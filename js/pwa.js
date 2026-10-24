document.addEventListener('DOMContentLoaded', () => {
    // 1. إضافة أيقونة الباركود في البنر
    const banner = document.querySelector('.hero-banner');
    if (banner) {
        banner.style.position = 'relative';
        const qrIconDiv = document.createElement('div');
        qrIconDiv.style.cssText = 'position: absolute; top: 15px; right: 15px; z-index: 10; text-align: center; cursor: pointer;';
        qrIconDiv.onclick = () => { document.getElementById('qr-modal').style.display = 'flex'; };
        qrIconDiv.innerHTML = `
            <img src="qr.png" style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid #f39c12; background: #fff; padding: 2px;">
            <div style="color: #f39c12; font-size: 10px; font-weight: bold; margin-top: 4px; text-shadow: 1px 1px 2px #000;">شارك تطبيقنا</div>
        `;
        banner.appendChild(qrIconDiv);
    }

    // 2. إضافة نافذة الباركود المخفية
    const modalDiv = document.createElement('div');
    modalDiv.id = 'qr-modal';
    modalDiv.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:4000; justify-content:center; align-items:center; padding:20px;';
    modalDiv.innerHTML = `
        <div style="background:#1a1a1a; border:2px solid #f39c12; width:100%; max-width:350px; border-radius:20px; padding:30px; text-align:center; position:relative;">
            <span onclick="document.getElementById('qr-modal').style.display='none'" style="position:absolute; top:10px; left:15px; font-size:30px; cursor:pointer; color:#fff;">&times;</span>
            <h2 style="color:#f39c12; margin-bottom:10px; font-size:22px;">شارك تطبيقنا</h2>
            <p style="color:#aaa; margin-bottom:20px; font-size:14px;">امسح الباركود بكاميرا هاتفك لتثبيت التطبيق ودعوة أصدقائك</p>
            <div style="background:#fff; padding:15px; border-radius:15px; display:inline-block;">
                <img src="qr.png" alt="QR Code" style="width:100%; max-width:250px; display:block;">
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);

    // 3. إضافة شريط تثبيت التطبيق
    const installDiv = document.createElement('div');
    installDiv.id = 'install-banner';
    installDiv.style.cssText = 'display:none; position:fixed; bottom:75px; left:10px; right:10px; background:#f39c12; color:#000; padding:15px; border-radius:12px; z-index:9999; justify-content:space-between; align-items:center; box-shadow:0 5px 15px rgba(0,0,0,0.5);';
    installDiv.innerHTML = `
        <div style="font-weight:bold; font-size:14px;">📱 ثبت تطبيقنا لطلب أسرع</div>
        <div>
            <button onclick="installApp()" style="background:#000; color:#fff; border:none; padding:8px 15px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px;">تثبيت</button>
            <button onclick="document.getElementById('install-banner').style.display='none'" style="background:transparent; border:none; font-size:20px; cursor:pointer; color:#000; margin-left:10px;">&times;</button>
        </div>
    `;
    document.body.appendChild(installDiv);

    // 4. تسجيل Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(err => console.log('SW failed: ', err));
    }
});

// 5. تفعيل زر التثبيت
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        const banner = document.getElementById('install-banner');
        if(banner) banner.style.display = 'flex';
    }
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                const banner = document.getElementById('install-banner');
                if(banner) banner.style.display = 'none';
            }
            deferredPrompt = null;
        });
    }
}

// Service Worker Update Logic for Customer
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(reg => {
            reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('تم تحديث التطبيق! اضغط موافق لإعادة التحميل للحصول على أحدث القائمة.')) {
                                window.location.reload();
                            }
                        }
                    };
                }
            };
        }).catch(err => console.log('SW Reg Error', err));
    });
}
