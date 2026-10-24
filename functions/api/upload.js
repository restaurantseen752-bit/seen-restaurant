export async function onRequest(context) {
    const { request, env } = context;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

    try {
        const formData = await request.formData();
        const file = formData.get('image');
        if (!file) return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400, headers: corsHeaders });

        const owner = env.GITHUB_OWNER;
        const repo = env.GITHUB_REPO;
        const token = env.GITHUB_TOKEN;

        if (!owner || !repo || !token) {
            return new Response(JSON.stringify({ error: 'GitHub credentials not configured in Cloudflare' }), { status: 500, headers: corsHeaders });
        }

        // Convert file to base64 safely
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64String = btoa(binary);

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `img_${Date.now()}.${ext}`;

        // Upload to GitHub
        const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
        const ghRes = await fetch(ghUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Cloudflare-Worker'
            },
            body: JSON.stringify({
                message: `Upload ${filename}`,
                content: base64String
            })
        });

        if (!ghRes.ok) {
            const err = await ghRes.json();
            throw new Error(err.message || 'GitHub upload failed');
        }

        // Return jsDelivr URL (Note: New uploads take a few seconds to be available on jsDelivr)
        const url = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${filename}`;

        return new Response(JSON.stringify({ success: true, url: url }), { headers: corsHeaders });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
}
