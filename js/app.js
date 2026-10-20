let currentSettings = {};
let allMenuItems = [];
let cart = [];

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // جلب البيانات من السيرفر (Cloudflare API)
        const res = await fetch('/api/data');
        const data = await res.json();
        
        currentSettings = data.settings;
        allMenuItems = data.items;

        // 1. معلومات التواصل
        document.getElementById('header-phone').innerText = currentSettings.phone || '0935746965';
        document.getElementById('header-address').innerText = currentSettings.address || 'سرت';

        // 2. شريط الإغلاق
        if (currentSettings.status === 'closed' && currentSettings.announcement) {
            document.getElementById('announcementText').innerText = currentSettings.announcement;
            document.getElementById('maintenanceBanner').style.display = 'block';
        }

        // 3. العروض
        const offersContainer = document.getElementById('customer-offers-container');
        if (currentSettings.offer) {
            offersContainer.innerHTML = `<div style="background: linear-gradient(145deg, #1f1f1f, #141414); border: 2px solid #f39c12; border-radius: 15px; padding: 30px 20px; text-align: center;"><span style="font-size: 40px; display: block; margin-bottom: 15px;">🎁</span><h2 style="color: #f39c12; margin-bottom: 15px;">عرض خاص!</h2><p style="font-size: 18px; color: #fff;">${currentSettings.offer}</p></div>`;
        } else {
            offersContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: #888;">لا توجد عروض حالياً.</div>`;
        }

        // 4. المسابقات
        const compContainer = document.getElementById('customer-comp-container');
        if (data.competitions && data.competitions.length > 0) {
            compContainer.innerHTML = data.competitions.map(c => `
                <div style="background: #1f1f1f; border: 1px solid #f39c12; border-radius: 12px; padding: 20px; margin-bottom: 15px; text-align: center;">
                    <h3 style="color: #f39c12; margin-bottom: 10px;">🏆 ${c.title}</h3>
                    <p style="color: #fff; margin-bottom: 5px;">الجائزة: <strong>${c.prize}</strong></p>
                    <p style="color: #aaa; font-size: 14px;">المدة: ${c.duration}</p>
                    ${c.winner ? `<p style="color: #2ecc71; font-weight: bold; margin-top: 10px;">🎉 الفائز: ${c.winner}</p>` : ''}
                </div>
            `).join('');
        } else {
            compContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: #888;">لا توجد مسابقات حالياً.</div>`;
        }

        // 5. بناء قائمة الطعام ديناميكياً
        renderCustomerMenu(data.items);

    } catch (e) { 
        console.error("خطأ في جلب البيانات:", e); 
        document.getElementById('customer-menu-container').innerHTML = '<p style="text-align:center; color:#fff;">عذراً، حدث خطأ في تحميل القائمة.</p>';
    }
});

function renderCustomerMenu(items) {
    const container = document.getElementById('customer-menu-container');
    const categories = [...new Set(items.map(item => item.category))];

    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#fff;">لا توجد أصناف حالياً.</p>';
        return;
    }

    container.innerHTML = categories.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        return `
            <button class="accordion"><div class="acc-content"><span class="acc-title">${cat}</span><span class="acc-badge">افتح واختر</span></div></button>
            <div class="panel">
                ${catItems.map(item => `
                    <div class="menu-item">
                        <span class="item-name">${item.name}</span>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span class="item-price">${item.price} <span>د.ل</span></span>
                            <button onclick="addToCart(${item.id})" style="background:#f39c12; color:#000; border:none; width:30px; height:30px; border-radius:50%; font-weight:bold; cursor:pointer;">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');

    // تفعيل الأكورديون
    var acc = document.getElementsByClassName("accordion");
    for (var i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) { panel.style.maxHeight = null; panel.classList.remove("active"); } 
            else {
                var allPanels = document.querySelectorAll('.panel');
                allPanels.forEach(p => { p.style.maxHeight = null; p.classList.remove("active"); });
                this.classList.add("active"); panel.classList.add("active");
                panel.style.maxHeight = panel.scrollHeight + "px";
            } 
        });
    }
}

// --- السلة ---
function addToCart(id) {
    const item = allMenuItems.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.qty++; } else { cart.push({ ...item, qty: 1 }); }
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    document.getElementById('cart-count').innerText = totalItems;
    document.getElementById('cart-total').innerText = totalPrice;
    document.getElementById('modal-total').innerText = totalPrice;
    
    if (totalItems > 0) document.getElementById('cart-bar').style.display = 'flex';
    else document.getElementById('cart-bar').style.display = 'none';
}

function openCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:8px;">
            <div><strong style="color:#fff;">${item.name}</strong><br><span style="color:#aaa; font-size:12px;">${item.qty} × ${item.price} د.ل</span></div>
            <button onclick="removeFromCart(${item.id})" style="background:#e74c3c; color:#fff; border:none; padding:4px 8px; border-radius:5px; cursor:pointer;">حذف</button>
        </div>
    `).join('');
    document.getElementById('cart-modal').style.display = 'flex';
}

function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
    if (cart.length === 0) closeCart(); else openCart();
}

// --- إرسال الواتساب ---
function sendWhatsAppOrder() {
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const notes = document.getElementById('order-notes').value;

    if (!name || !phone) { alert('الرجاء إدخال الاسم ورقم الهاتف'); return; }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let message = `*طلب جديد من مطعم سين*\n\n👤 *الاسم:* ${name}\n📞 *الهاتف:* ${phone}\n📝 *ملاحظات:* ${notes || 'لا يوجد'}\n\n*الطلبات:*\n`;
    cart.forEach(item => { message += `▪️ ${item.name} (${item.qty}) - ${item.price * item.qty} د.ل\n`; });
    message += `\n💰 *المجموع:* ${total} د.ل`;

    // استخدام رقم الواتساب الديناميكي من إعدادات لوحة التحكم
    const waNumber = currentSettings.whatsapp || '218935746965'; 
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    // تصفير السلة وإغلاق النافذة
    cart = [];
    updateCartUI();
    closeCart();
}
