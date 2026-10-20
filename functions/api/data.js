export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    if (request.method === 'GET') {
        try {
            const items = await db.prepare('SELECT * FROM items').all();
            const settings = await db.prepare('SELECT * FROM settings').all();
            const competitions = await db.prepare('SELECT * FROM competitions').all();
            const categories = await db.prepare('SELECT * FROM categories').all();
            const offers = await db.prepare('SELECT * FROM offers WHERE is_active = 1').all();
            
            const settingsObj = {};
            settings.results.forEach(row => settingsObj[row.key] = row.value);

            return new Response(JSON.stringify({ 
                items: items.results, 
                settings: settingsObj, 
                competitions: competitions.results, 
                categories: categories.results,
                offers: offers.results 
            }), { headers });
        } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }

    if (request.method === 'POST') {
        const body = await request.json();
        
        if (body.action === 'send_telegram') {
            try {
                const settings = await db.prepare('SELECT * FROM settings WHERE key IN ("telegramToken", "telegramChatId")').all();
                const settingsObj = {};
                settings.results.forEach(row => settingsObj[row.key] = row.value);

                const token = settingsObj.telegramToken;
                const chatId = settingsObj.telegramChatId;

                if (!token || !chatId) {
                    return new Response(JSON.stringify({ error: 'لم يتم إعداد بوت تلغرام في لوحة التحكم. يرجى التأكد من حفظ التوكن والآيدي.' }), { status: 400, headers });
                }

                const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
                const response = await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: body.message,
                        parse_mode: 'Markdown'
                    })
                });
                
                const tgResponse = await response.json();
                
                if(response.ok) return new Response(JSON.stringify({ success: true }), { headers });
                else return new Response(JSON.stringify({ error: 'خطأ من تلغرام: ' + tgResponse.description }), { status: 500, headers });

            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // حفظ الإعدادات (إجراء جماعي)
        if (body.action === 'update_all_settings') {
            try {
                const updates = [
                    { key: 'phone', value: body.phone },
                    { key: 'address', value: body.address },
                    { key: 'telegramToken', value: body.telegramToken },
                    { key: 'telegramChatId', value: body.telegramChatId }
                ];
                for (let u of updates) {
                    await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(u.key, u.value).run();
                }
                return new Response(JSON.stringify({ success: true }), { headers });
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        const ADMIN_PASS = "123456"; 
        if (body.password !== ADMIN_PASS) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

        try {
            if (body.action === 'add_item') await db.prepare('INSERT INTO items (name, price, category) VALUES (?, ?, ?)').bind(body.name, body.price, body.category).run();
            else if (body.action === 'delete_item') await db.prepare('DELETE FROM items WHERE id = ?').bind(body.id).run();
            else if (body.action === 'update_item') await db.prepare('UPDATE items SET price = ? WHERE id = ?').bind(body.price, body.id).run();
            else if (body.action === 'update_setting') await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(body.key, body.value).run();
            else if (body.action === 'toggle_category') await db.prepare('UPDATE categories SET is_active = ? WHERE name = ?').bind(body.is_active, body.name).run();
            
            else if (body.action === 'add_offer') await db.prepare('INSERT INTO offers (text) VALUES (?)').bind(body.text).run();
            else if (body.action === 'delete_offer') await db.prepare('DELETE FROM offers WHERE id = ?').bind(body.id).run();

            else if (body.action === 'add_competition') await db.prepare('INSERT INTO competitions (title, prize, duration) VALUES (?, ?, ?)').bind(body.title, body.prize, body.duration).run();
            else if (body.action === 'delete_competition') await db.prepare('DELETE FROM competitions WHERE id = ?').bind(body.id).run();
            else if (body.action === 'set_winner') await db.prepare('UPDATE competitions SET winner = ?, status = "finished" WHERE id = ?').bind(body.winner, body.id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }
    return new Response('Method Not Allowed', { status: 405, headers });
}
