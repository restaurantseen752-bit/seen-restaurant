const CACHE_NAME = 'seen-v16.0'; // نغير الرقم يدويا كلما أردنا إجبار الجميع على التحديث

self.addEventListener('install', (event) => {
    self.skipWaiting(); // إجبار المتصفح على تفعيل النسخة الجديدة فورا
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './', './index.html', './admin.html',
                './css/style.css', './css/admin.css',
                './js/app.js', './js/admin.js', './js/pwa.js',
                './manifest.json', './logo.png'
            ]).catch(err => console.log('Cache addAll error', err));
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim()) // السيطرة على كل التبويبات المفتوحة
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;

    // استراتيجية: الشبكة أولاً (لجلب التحديثات)، وإذا انقطع النت نستخدم الكاش
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
