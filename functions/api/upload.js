export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    try {
        const formData = await request.formData();
        const file = formData.get('image');
        if (!file) return new Response(JSON.stringify({ error: 'No image' }), { status: 400 });
        const ext = file.name.split('.').pop();
        const filename = `img_${Date.now()}.${ext}`;
        await env.IMAGES.put(filename, file.stream(), { httpMetadata: { contentType: file.type } });
        return new Response(JSON.stringify({ success: true, url: `/api/image/${filename}` }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
}
