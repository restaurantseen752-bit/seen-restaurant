// Cloudflare Pages Function - Main Data API (Final Perfected Version)

async function hashPassword(password, saltB64) {
    const enc = new TextEncoder();
    const salt = enc.encode(saltB64);
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        key, 256
    );
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

async function verifySession(db, token) {
    if (!token || typeof token !== 'string' || token.length < 10) return false;
    const now = Math.floor(Date.now() / 1000);
    const s = await db.prepare('SELECT token FROM admin_sessions WHERE token = ? AND expires_at > ?').bind(token, now).first();
    if (!s) return false;
    await db.prepare('UPDATE admin_sessions SET last_used_at = ? WHERE token = ?').bind(now, token).run();
    return true;
}

async function createSession(db) {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    let token = btoa(String.fromCharCode(...buf));
    token = token.replace(/[+/=]/g, '');
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 7 * 24 * 60 * 60;
    await db.prepare('INSERT INTO admin_sessions (token, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?)').bind(token, now, exp, now).run();
    return token;
}

async function verifyPassword(db, password) {
    const cred = await db.prepare('SELECT password_hash, salt FROM admin_credentials WHERE id = 1').first();
    if (!cred) return false;
    const h = await hashPassword(password, cred.salt);
    return h === cred.password_hash;
}

async function makeNewCredentials(db, newPassword) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    const saltB64 = btoa(String.fromCharCode(...buf));
    const hash = await hashPassword(newPassword, saltB64);
    const now = Math.floor(Date.now() / 1000);
    await db.prepare('UPDATE admin_credentials SET password_hash = ?, salt = ?, updated_at = ? WHERE id = 1').bind(hash, saltB64, now).run();
}

async function deleteImageFromGitHub(env, imageUrl) {
    if (!imageUrl || !imageUrl.includes('jsdelivr.net/gh/')) return;
    try {
        const parts = imageUrl.split('/');
        const filename = parts[parts.length - 1];
        const owner = env.GITHUB_OWNER;
        const repo = env.GITHUB_REPO;
        const token = env.GITHUB_TOKEN;
        if (!owner || !repo || !token) return;
        const getUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + filename;
        const getRes = await fetch(getUrl, {
            headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'CF-Worker' }
        });
        if (getRes.ok) {
            const fileData = await getRes.json();
            await fetch(getUrl, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'CF-Worker' },
                body: JSON.stringify({ message: 'Delete ' + filename, sha: fileData.sha })
            });
        }
    } catch (e) {
        console.error('Failed to delete old image:', e);
    }
}

async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const resp = await fetch(url, options);
            if (resp.ok) return resp;
            if (resp.status === 429) {
                await new Promise(r => setTimeout(r, 2000 * (i + 1)));
                continue;
            }
            const err = await resp.json().catch(() => ({ description: 'Unknown error' }));
            throw new Error(err.description || 'HTTP ' + resp.status);
        } catch (err) {
            if (i === maxRetries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB;
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    if (request.method === 'GET') {
        try {
            const url = new URL(request.url);
            const token = url.searchParams.get('token');
            const isAdmin = await verifySession(db, token);
            const items = await db.prepare('SELECT * FROM items').all();
            const settings = await db.prepare('SELECT * FROM settings').all();
            const competitions = await db.prepare('SELECT * FROM competitions').all();
            const categories = await db.prepare('SELECT * FROM categories').all();
            const offers = await db.prepare('SELECT * FROM offers WHERE is_active = 1').all();
            const delivery_areas = await db.prepare('SELECT * FROM delivery_areas').all();
            const ordersTodayRes = await db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at, '+2 hours') = date('now', '+2 hours')").first();
            const todayOrdersCount = ordersTodayRes ? ordersTodayRes.count : 0;
            const settingsObj = {};
            settings.results.forEach(row => {
                if (!isAdmin && ['telegramToken', 'telegramChatId'].includes(row.key)) return;
                settingsObj[row.key] = row.value;
            });
            return new Response(JSON.stringify({
                items: items.results,
                settings: settingsObj,
                competitions: competitions.results,
                categories: categories.results,
                offers: offers.results,
                todayOrdersCount: todayOrdersCount,
                delivery_areas: delivery_areas.results,
                isAdmin: isAdmin
            }), { headers });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    if (request.method === 'POST') {
        let body = {};
        let imageFile = null;
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            body.action = formData.get('action');
            body.total = formData.get('total');
            body.message = formData.get('message');
            body.token = formData.get('token');
            body.password = formData.get('password');
            body.new_password = formData.get('new_password');
            imageFile = formData.get('image');
        } else {
            try { body = await request.json(); }
            catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }
        }

        if (body.action === 'login') {
            if (!body.password) return new Response(JSON.stringify({ error: 'Password required' }), { status: 400, headers });
            const ok = await verifyPassword(db, body.password);
            if (!ok) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers });
            const token = await createSession(db);
            return new Response(JSON.stringify({ success: true, token: token }), { headers });
        }

        if (body.action === 'logout') {
            if (body.token) await db.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(body.token).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (body.action === 'change_password') {
            const isAdmin = await verifySession(db, body.token);
            if (!isAdmin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            if (!body.new_password) return new Response(JSON.stringify({ error: 'New password required' }), { status: 400, headers });
            if (body.new_password.length < 6) return new Response(JSON.stringify({ error: 'Password too short (min 6)' }), { status: 400, headers });
            await makeNewCredentials(db, body.new_password);
            await db.prepare('DELETE FROM admin_sessions').run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (body.action === 'send_telegram') {
            try {
                const settings = await db.prepare('SELECT * FROM settings WHERE key IN (?, ?)').bind('telegramToken', 'telegramChatId').all();
                const settingsObj = {};
                settings.results.forEach(row => settingsObj[row.key] = row.value);
                const token = settingsObj.telegramToken;
                const chatId = settingsObj.telegramChatId;
                if (!token || !chatId) return new Response(JSON.stringify({ error: 'Telegram not configured' }), { status: 400, headers });

                const statusRes = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('status').first();
                if (statusRes && statusRes.value === 'closed') {
                    return new Response(JSON.stringify({ error: 'عذراً، المطعم مغلق حالياً ولا يمكن استقبال الطلبات.' }), { status: 400, headers });
                }


                // STRICT RULE: If image exists, sendPhoto with Caption. If no image, sendMessage.
                if (imageFile) {
                    const photoUrl = 'https://api.telegram.org/bot' + token + '/sendPhoto';
                    const photoData = new FormData();
                    photoData.append('chat_id', chatId);
                    photoData.append('photo', imageFile, 'receipt.jpg');
                    photoData.append('caption', body.message);
                    photoData.append('parse_mode', 'Markdown');
                    await fetchWithRetry(photoUrl, { method: 'POST', body: photoData });
                } else {
                    const telegramUrl = 'https://api.telegram.org/bot' + token + '/sendMessage';
                    await fetchWithRetry(telegramUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: body.message, parse_mode: 'Markdown' })
                    });
                }

                await db.prepare('INSERT INTO orders (total) VALUES (?)').bind(body.total || 0).run();

                try {
                    await db.prepare("DELETE FROM orders WHERE created_at < datetime('now', '-30 days')").run();
                } catch (cleanupErr) {
                    console.error('Cleanup failed:', cleanupErr);
                }

                return new Response(JSON.stringify({ success: true }), { headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: 'فشل إرسال الطلب: ' + e.message }), { status: 500, headers });
            }
        }

        const isAdmin = await verifySession(db, body.token);
        if (!isAdmin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

        try {
            if (body.action === 'update_all_settings') {
                const updates = [
                    { key: 'phone', value: body.phone },
                    { key: 'address', value: body.address },
                    { key: 'telegramToken', value: body.telegramToken },
                    { key: 'telegramChatId', value: body.telegramChatId },
                    { key: 'prepayment_info', value: body.prepayment_info }
                ];
                for (let u of updates) {
                    await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(u.key, u.value).run();
                }
                return new Response(JSON.stringify({ success: true }), { headers });
            }
            if (body.action === 'add_item') await db.prepare('INSERT INTO items (name, price, category, description, image_url) VALUES (?, ?, ?, ?, ?)').bind(body.name, body.price, body.category, body.description, body.image_url).run();
            else if (body.action === 'delete_item') await db.prepare('DELETE FROM items WHERE id = ?').bind(body.id).run();
            else if (body.action === 'update_full_item') {
                if (body.old_image_url && body.old_image_url !== body.image_url) {
                    await deleteImageFromGitHub(env, body.old_image_url);
                }
                await db.prepare('UPDATE items SET name = ?, price = ?, category = ?, description = ?, image_url = ? WHERE id = ?').bind(body.name, body.price, body.category, body.description, body.image_url, body.id).run();
            }
            else if (body.action === 'update_setting') await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(body.key, body.value).run();
            else if (body.action === 'toggle_item') await db.prepare('UPDATE items SET is_active = ? WHERE id = ?').bind(body.is_active, body.id).run();
            else if (body.action === 'toggle_category') await db.prepare('UPDATE categories SET is_active = ? WHERE name = ?').bind(body.is_active, body.name).run();
            else if (body.action === 'add_delivery_area') await db.prepare('INSERT INTO delivery_areas (name, fee) VALUES (?, ?)').bind(body.name, body.fee).run();
            else if (body.action === 'delete_delivery_area') await db.prepare('DELETE FROM delivery_areas WHERE id = ?').bind(body.id).run();
            else if (body.action === 'add_offer') await db.prepare('INSERT INTO offers (text, price) VALUES (?, ?)').bind(body.text, body.price).run();
            else if (body.action === 'delete_offer') await db.prepare('DELETE FROM offers WHERE id = ?').bind(body.id).run();
            else if (body.action === 'add_competition') await db.prepare('INSERT INTO competitions (title, prize, duration) VALUES (?, ?, ?)').bind(body.title, body.prize, body.duration).run();
            else if (body.action === 'delete_competition') await db.prepare('DELETE FROM competitions WHERE id = ?').bind(body.id).run();
            else if (body.action === 'set_winner') await db.prepare("UPDATE competitions SET winner = ?, status = 'finished' WHERE id = ?").bind(body.winner, body.id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    return new Response('Method Not Allowed', { status: 405, headers });
}
