export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB;
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    if (request.method === 'GET') {
        try {
            const items = await db.prepare('SELECT * FROM items').all();
            const settings = await db.prepare('SELECT * FROM settings').all();
            const competitions = await db.prepare('SELECT * FROM competitions WHERE status = "active"').all();
            
            const settingsObj = {};
            settings.results.forEach(row => settingsObj[row.key] = row.value);

            return new Response(JSON.stringify({ items: items.results, settings: settingsObj, competitions: competitions.results }), { headers });
        } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }

    if (request.method === 'POST') {
        const body = await request.json();
        const ADMIN_PASS = "123456"; 
        if (body.password !== ADMIN_PASS) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

        try {
            if (body.action === 'add_item') await db.prepare('INSERT INTO items (name, price, category) VALUES (?, ?, ?)').bind(body.name, body.price, body.category).run();
            else if (body.action === 'delete_item') await db.prepare('DELETE FROM items WHERE id = ?').bind(body.id).run();
            else if (body.action === 'update_item') await db.prepare('UPDATE items SET price = ? WHERE id = ?').bind(body.price, body.id).run();
            else if (body.action === 'update_setting') await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(body.key, body.value).run();
            
            else if (body.action === 'add_competition') await db.prepare('INSERT INTO competitions (title, prize, duration) VALUES (?, ?, ?)').bind(body.title, body.prize, body.duration).run();
            else if (body.action === 'delete_competition') await db.prepare('DELETE FROM competitions WHERE id = ?').bind(body.id).run();
            else if (body.action === 'set_winner') await db.prepare('UPDATE competitions SET winner = ?, status = "finished" WHERE id = ?').bind(body.winner, body.id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }
    return new Response('Method Not Allowed', { status: 405, headers });
}
