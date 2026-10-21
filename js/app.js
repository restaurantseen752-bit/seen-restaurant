let currentSettings = {};
let allMenuItems = [];
let allCategories = [];
let cart = [];

const categoryImages = {
    'البيتزا العادية': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    'البيتزا المحشية': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
    'السندوتشات': 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500&q=80',
    'الوجبات': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
    'البوكسات العائلية': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80'
};

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.style.display = 'none', 300);
    }, 2000);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        const data = await res.json();
        
        currentSettings = data.settings || {};
        allMenuItems = data.items || [];
        allCategories = data.categories || [];
        const offers = data.offers || [];

        document.getElementById('header-phone').innerText = currentSettings.phone || '0935746965';
        document.getElementById('header-address').innerText = currentSettings.address || 'سرت';

        if (currentSettings.status === 'closed' && currentSettings.announcement) {
            document.getElementById('announcementText').innerText = currentSettings.announcement;
            document.getElementById('maintenanceBanner').style.display = 'block';
        }

        const offersContainer = document.getElementById('customer-offers-container');
        if (offers.length > 0) {
            offersContainer.innerHTML = offers.map(o => `
                <div style="background: linear-gradient(145deg, #1f1f1f, #141414); border: 2px solid #f39c12; border-radius: 15px; padding: 20px; margin-bottom: 15px; text-align: center;">
                    <span style="font-size: 30px; display: block; margin-bottom: 10px;">🎁</span>
                    <p style="font-size: 16px; color: #fff; margin:0 0 10px 0;">${o.text}</p>
                    <div style="font-size: 22px; font-weight: bold; color: #f39c12; margin-bottom: 15px;">${o.price} د.ل</div>
                    <button onclick="addOfferToCart(${o.id}, '${o.text.replace(/'/g, "\\'")}', ${o.price})" style="background:#2ecc71; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px;">اغتنم الفرصة</button>
                </div>
            `).join('');
        } else {
            offersContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: #888;">لا توجد عروض حالياً.</div>`;
        }

        const compContainer = document.getElementById('customer-comp-container');
        if (data.competitions && data.competitions.length > 0) {
            compContainer.innerHTML = data.competitions.map(c => {
                if (c.winner) {
                    return `<div style="background: linear-gradient(145deg, #1f1f1f, #141414); border: 2px solid #2ecc71; border-radius: 15px; padding: 20px; margin-bottom: 15px; text-align: center; position: relative; overflow: hidden;"><div style="position: absolute; top: 10px; right: -30px; background: #2ecc71; color: #fff; padding: 5px 40px; transform: rotate(45deg); font-weight: bold; font-size: 12px;">منتهية</div><h3 style="color: #f39c12; margin-bottom: 10px;">🏆 ${c.title}</h3><p style="color: #fff; margin-bottom: 5px;">الجائزة: <strong>${c.prize}</strong></p><p style="color: #aaa; font-size: 14px; margin-bottom: 15px;">المدة: ${c.duration}</p><div style="background: rgba(46, 204, 113, 0.1); border: 1px dashed #2ecc71; border-radius: 10px; padding: 15px;"><p style="color: #2ecc71; font-size: 18px; font-weight: bold; margin: 0;">🎉 الفائز: ${c.winner}</p></div></div>`;
                }
                return `<div style="background: #1f1f1f; border: 1px solid #f39c12; border-radius: 12px; padding: 20px; margin-bottom: 15px; text-align: center;"><h3 style="color: #f39c12; margin-bottom: 10px;">🔥 ${c.title}</h3><p style="color: #fff; margin-bottom: 5px;">الجائزة: <strong>${c.prize}</strong></p><p style="color: #aaa; font-size: 14px;">المدة: ${c.duration}</p><p style="color: #f39c12; font-size: 13px; margin-top: 10px; font-weight: bold;">⏳ المسابقة مستمرة.. شارك الآن!</p></div>`;
            }).join('');
        } else {
            compContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: #888;">لا توجد مسابقات حالياً.</div>`;
        }

        renderCustomerMenu(allMenuItems, allCategories);

    } catch (e) { 
        console.error("خطأ:", e); 
        document.getElementById('customer-menu-container').innerHTML = '<p style="text-align:center; color:#fff;">عذراً، حدث خطأ في تحميل القائمة.</p>';
    }
});

function renderCustomerMenu(items, categories) {
    const container = document.getElementById('customer-menu-container');
    let displayCategories = categories;
    if (!displayCategories || displayCategories.length === 0) {
        displayCategories = [{ name: 'البيتزا العادية', is_active: 1 },{ name: 'البيتزا المحشية', is_active: 1 },{ name: 'السندوتشات', is_active: 1 },{ name: 'الوجبات', is_active: 1 },{ name: 'البوكسات العائلية', is_active: 1 }];
    }

    container.innerHTML = displayCategories.map(cat => {
        const catName = cat.name; const isActive = cat.is_active;
        const catItems = items.filter(i => i.category === catName);
        const bgImage = categoryImages[catName] || categoryImages['البيتزا العادية'];

        if (!isActive) {
            return `<button class="accordion" onclick="alert('نعتذر منك، هذا القسم غير متوفر حالياً.')" style="background-image: url('${bgImage}');"><div class="acc-content"><span class="acc-title">${catName}</span><span class="acc-badge" style="background:#e74c3c; color:#fff; border-color:#e74c3c;">غير متوفر حالياً</span></div></button>`;
        }

        return `<button class="accordion" style="background-image: url('${bgImage}');"><div class="acc-content"><span class="acc-title">${catName}</span><span class="acc-badge">افتح واختر</span></div></button>
            <div class="panel">${catItems.length > 0 ? catItems.map(item => `<div class="menu-item"><span class="item-name">${item.name}</span><div style="display:flex; align-items:center; gap:10px;"><span class="item-price">${item.price} <span>د.ل</span></span><button onclick="addToCart(${item.id})" style="background:#f39c12; color:#000; border:none; width:30px; height:30px; border-radius:50%; font-weight:bold; cursor:pointer;">+</button></div></div>`).join('') : '<div style="padding: 15px; color: #888; text-align: center;">لا توجد أصناف متاحة في هذا القسم حالياً.</div>'}</div>`;
    }).join('');

    var acc = document.getElementsByClassName("accordion");
    for (var i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            if(this.getAttribute('onclick')) return; 
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

function addToCart(id) {
    const item = allMenuItems.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);
    if (existing) { 
        existing.qty++; 
        showToast(`تمت إضافة ${item.name} (الكمية: ${existing.qty})`);
    } else { 
        cart.push({ ...item, qty: 1 }); 
        showToast(`تم اختيار ${item.name}`);
    }
    updateCartUI();
}

function addOfferToCart(id, name, price) {
    const offerId = 'offer_' + id;
    const existing = cart.find(i => i.id === offerId);
    if (existing) {
        existing.qty++;
        showToast(`تمت إضافة ${name} (الكمية: ${existing.qty})`);
    } else {
        cart.push({ id: offerId, name: name, price: price, qty: 1 });
        showToast(`تم اختيار العرض: ${name}`);
    }
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
    container.innerHTML = cart.map(item => `<div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:8px;"><div><strong style="color:#fff;">${item.name}</strong><br><span style="color:#aaa; font-size:12px;">${item.qty} × ${item.price} د.ل</span></div><button onclick="removeFromCart('${item.id}')" style="background:#e74c3c; color:#fff; border:none; padding:4px 8px; border-radius:5px; cursor:pointer;">حذف</button></div>`).join('');
    document.getElementById('cart-modal').style.display = 'flex';
}

function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

function removeFromCart(id) { 
    // إصلاح المقارنة لتعمل مع الأرقام والنصوص
    cart = cart.filter(i => String(i.id) !== String(id)); 
    updateCartUI(); 
    if (cart.length === 0) closeCart(); 
    else openCart(); 
}

async function sendOrder() {
    const name = document.getElementById('customer-name').value;
    // تنظيف رقم الهاتف من أي مسافات أو رموز للحفاظ على الأرقام فقط
    const phone = document.getElementById('customer-phone').value.replace(/[^0-9+]/g, ''); 
    const address = document.getElementById('customer-address').value;
    const notes = document.getElementById('order-notes').value;

    if (!name || !phone || !address) { alert('الرجاء إدخال الاسم ورقم الهاتف وعنوان التوصيل'); return; }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let message = `*طلب جديد من مطعم سين*\n\n👤 *الاسم:* ${name}\n📞 *الهاتف:* ${phone}\n📍 *العنوان:* ${address}\n📝 *ملاحظات:* ${notes || 'لا يوجد'}\n\n*الطلبات:*\n`;
    cart.forEach(item => { message += `▪️ ${item.name} (${item.qty}) - ${item.price * item.qty} د.ل\n`; });
    message += `\n💰 *المجموع:* ${total} د.ل`;

    const btn = document.getElementById('send-order-btn');
    btn.innerText = 'جاري الإرسال...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_telegram', message: message, total: total })
        });

        const data = await res.json();

        if (res.ok) {
            closeCart();
            document.getElementById('success-modal').style.display = 'flex';
            cart = [];
            updateCartUI();
            document.getElementById('customer-name').value = '';
            document.getElementById('customer-phone').value = '';
            document.getElementById('customer-address').value = '';
            document.getElementById('order-notes').value = '';
        } else {
            alert(data.error || 'حدث خطأ أثناء إرسال الطلب.');
        }
    } catch (e) {
        alert('حدث خطأ في الاتصال.');
    } finally {
        btn.innerText = 'تأكيد الطلب وإرساله';
        btn.disabled = false;
    }
}
