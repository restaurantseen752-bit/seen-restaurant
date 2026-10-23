export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    if (request.method === 'GET') {
        try {
            const url = new URL(request.url);
            const authPass = url.searchParams.get('auth'); 

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
                // إخفاء التوكن ومعرف المحادثة عن الزبائن (الزبون لا يملك كلمة المرور)
                if (authPass !== "123456") {
                    if (['telegramToken', 'telegramChatId'].includes(row.key)) {
                        return; 
                    }
                }
                settingsObj[row.key] = row.value;
            });

            return new Response(JSON.stringify({ 
                items: items.results, 
                settings: settingsObj, 
                competitions: competitions.results, 
                categories: categories.results,
                offers: offers.results, 
                todayOrdersCount: todayOrdersCount,
                delivery_areas: delivery_areas.results
            }), { headers });
        } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }

    if (request.method === 'POST') {
        const body = await request.json();
        
        // إرسال الطلب لتلغرام (لا يحتاج كلمة مرور لأن الزبون هو من يرسل)
        if (body.action === 'send_telegram') {
            try {
                const settings = await db.prepare('SELECT * FROM settings WHERE key IN ("telegramToken", "telegramChatId")').all();
                const settingsObj = {};
                settings.results.forEach(row => settingsObj[row.key] = row.value);

                const token = settingsObj.telegramToken;
                const chatId = settingsObj.telegramChatId;

                if (!token || !chatId) return new Response(JSON.stringify({ error: 'لم يتم إعداد بوت تلغرام.' }), { status: 400, headers });

                const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
                const response = await fetch(telegramUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: body.message, parse_mode: 'Markdown' })
                });
                
                if(response.ok) {
                    if (body.receipt_url) {
                        const photoUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
                        await fetch(photoUrl, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: chatId, photo: body.receipt_url, caption: "📸 إيصال الدفع المرفق" })
                        });
                    }
                    await db.prepare('INSERT INTO orders (total) VALUES (?)').bind(body.total || 0).run();
                    return new Response(JSON.stringify({ success: true }), { headers });
                } else {
                    const tgResponse = await response.json();
                    return new Response(JSON.stringify({ error: 'خطأ من تلغرام: ' + tgResponse.description }), { status: 500, headers });
                }
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // حماية جميع إجراءات المدير بكلمة المرور
        const ADMIN_PASS = "123456"; 
        if (body.password !== ADMIN_PASS) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

        try {
            if (body.action === 'update_all_settings') {
                const updates = [
                    { key: 'phone', value: body.phone }, { key: 'address', value: body.address },
                    { key: 'telegramToken', value: body.telegramToken }, { key: 'telegramChatId', value: body.telegramChatId },
                    { key: 'prepayment_info', value: body.prepayment_info }
                ];
                for (let u of updates) {
                    await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(u.key, u.value).run();
                }
                return new Response(JSON.stringify({ success: true }), { headers });
            }
            
            if (body.action === 'add_item') await db.prepare('INSERT INTO items (name, price, category, description, image_url) VALUES (?, ?, ?, ?, ?)').bind(body.name, body.price, body.category, body.description, body.image_url).run();
            else if (body.action === 'delete_item') await db.prepare('DELETE FROM items WHERE id = ?').bind(body.id).run();
            else if (body.action === 'update_full_item') await db.prepare('UPDATE items SET name = ?, price = ?, category = ?, description = ?, image_url = ? WHERE id = ?').bind(body.name, body.price, body.category, body.description, body.image_url, body.id).run();
            else if (body.action === 'update_setting') await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(body.key, body.value).run();
            else if (body.action === 'toggle_category') await db.prepare('UPDATE categories SET is_active = ? WHERE name = ?').bind(body.is_active, body.name).run();
            else if (body.action === 'add_delivery_area') await db.prepare('INSERT INTO delivery_areas (name, fee) VALUES (?, ?)').bind(body.name, body.fee).run();
            else if (body.action === 'delete_delivery_area') await db.prepare('DELETE FROM delivery_areas WHERE id = ?').bind(body.id).run();
            else if (body.action === 'add_offer') await db.prepare('INSERT INTO offers (text, price) VALUES (?, ?)').bind(body.text, body.price).run();
            else if (body.action === 'delete_offer') await db.prepare('DELETE FROM offers WHERE id = ?').bind(body.id).run();
            else if (body.action === 'add_competition') await db.prepare('INSERT INTO competitions (title, prize, duration) VALUES (?, ?, ?)').bind(body.title, body.prize, body.duration).run();
            else if (body.action === 'delete_competition') await db.prepare('DELETE FROM competitions WHERE id = ?').bind(body.id).run();
            else if (body.action === 'set_winner') await db.prepare('UPDATE competitions SET winner = ?, status = "finished" WHERE id = ?').bind(body.winner, body.id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }
    return new Response('Method Not Allowed', { status: 405, headers });
}
