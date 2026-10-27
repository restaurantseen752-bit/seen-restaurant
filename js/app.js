
// --- Custom UI Modals ---
function showCustomAlert(message, title = 'تنبيه') {
    let modal = document.getElementById('custom-alert-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'custom-alert-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:20px; backdrop-filter: blur(5px);';
    modal.innerHTML = `
        <div style="background:linear-gradient(145deg, #1f1f1f, #141414); border:2px solid #f39c12; border-radius:20px; padding:25px 20px; text-align:center; max-width:350px; width:100%; box-shadow: 0 10px 30px rgba(243,156,18,0.2); animation: popIn 0.3s ease;">
            <h3 style="color:#f39c12; margin:0 0 15px 0; font-size:20px;">${title}</h3>
            <p style="color:#ddd; font-size:16px; margin:0 0 20px 0; line-height:1.6;">${message}</p>
            <button onclick="document.getElementById('custom-alert-modal').remove()" style="background:#f39c12; color:#000; border:none; padding:10px 25px; border-radius:10px; font-weight:bold; font-size:16px; cursor:pointer; width:100%;">حسناً</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showCustomConfirm(message, title = 'تأكيد') {
    return new Promise((resolve) => {
        let modal = document.getElementById('custom-confirm-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'custom-confirm-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:20px; backdrop-filter: blur(5px);';
        modal.innerHTML = `
            <div style="background:linear-gradient(145deg, #1f1f1f, #141414); border:2px solid #f39c12; border-radius:20px; padding:25px 20px; text-align:center; max-width:350px; width:100%; box-shadow: 0 10px 30px rgba(243,156,18,0.2); animation: popIn 0.3s ease;">
                <h3 style="color:#f39c12; margin:0 0 15px 0; font-size:20px;">${title}</h3>
                <p style="color:#ddd; font-size:16px; margin:0 0 20px 0; line-height:1.6;">${message}</p>
                <div style="display:flex; gap:10px;">
                    <button id="btn-custom-yes" style="background:#2ecc71; color:#fff; border:none; padding:10px; border-radius:10px; font-weight:bold; font-size:16px; cursor:pointer; flex:1;">نعم</button>
                    <button id="btn-custom-no" style="background:#e74c3c; color:#fff; border:none; padding:10px; border-radius:10px; font-weight:bold; font-size:16px; cursor:pointer; flex:1;">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-custom-yes').onclick = () => { modal.remove(); resolve(true); };
        document.getElementById('btn-custom-no').onclick = () => { modal.remove(); resolve(false); };
    });
}

function showCustomPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        let modal = document.getElementById('custom-prompt-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'custom-prompt-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:20px; backdrop-filter: blur(5px);';
        modal.innerHTML = `
            <div style="background:linear-gradient(145deg, #1f1f1f, #141414); border:2px solid #f39c12; border-radius:20px; padding:25px 20px; text-align:center; max-width:350px; width:100%; box-shadow: 0 10px 30px rgba(243,156,18,0.2); animation: popIn 0.3s ease;">
                <h3 style="color:#f39c12; margin:0 0 15px 0; font-size:18px;">${message}</h3>
                <input type="text" id="custom-prompt-input" value="${defaultValue}" style="width:100%; padding:12px; border-radius:8px; border:1px solid #444; background:#222; color:#fff; margin-bottom:15px; font-size:16px; box-sizing:border-box; text-align:center;">
                <div style="display:flex; gap:10px;">
                    <button id="btn-prompt-yes" style="background:#2ecc71; color:#fff; border:none; padding:10px; border-radius:10px; font-weight:bold; font-size:16px; cursor:pointer; flex:1;">حفظ</button>
                    <button id="btn-prompt-no" style="background:#e74c3c; color:#fff; border:none; padding:10px; border-radius:10px; font-weight:bold; font-size:16px; cursor:pointer; flex:1;">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-prompt-yes').onclick = () => { const val = document.getElementById('custom-prompt-input').value; modal.remove(); resolve(val); };
        document.getElementById('btn-prompt-no').onclick = () => { modal.remove(); resolve(null); };
    });
}
// Add CSS animation if not exists
if (!document.getElementById('custom-modal-style')) {
    const style = document.createElement('style');
    style.id = 'custom-modal-style';
    style.innerHTML = '@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }';
    document.head.appendChild(style);
}

let currentSettings = {}; let allMenuItems = []; let allCategories = []; let cart = []; let deferredPrompt;

const categoryImages = {
    'البيتزا العادية': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    'البيتزا المحشية': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
    'السندوتشات': 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500&q=80',
    'الوجبات': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
    'البوكسات العائلية': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
    'المشروبات الغازية والعصائر': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80'
};

function navigateTo(pageId) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById(pageId).classList.add('active'); window.scrollTo(0, 0); }
function showToast(msg) { const toast = document.getElementById('toast'); toast.innerText = msg; toast.style.display = 'block'; toast.style.opacity = '1'; setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.style.display = 'none', 300); }, 2000); }
function openQrModal() { document.getElementById('qr-modal').style.display = 'flex'; }
function closeQrModal() { document.getElementById('qr-modal').style.display = 'none'; }

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; if (!window.matchMedia('(display-mode: standalone)').matches) { document.getElementById('install-banner').style.display = 'flex'; } });
function installApp() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; const isChrome = /CriOS/.test(navigator.userAgent);
    if (isIOS) { if (isChrome) { document.getElementById('ios-chrome-warning').style.display = 'block'; document.getElementById('ios-safari-steps').style.display = 'none'; } else { document.getElementById('ios-chrome-warning').style.display = 'none'; document.getElementById('ios-safari-steps').style.display = 'block'; } document.getElementById('ios-install-modal').style.display = 'flex'; } 
    else if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((choiceResult) => { if (choiceResult.outcome === 'accepted') document.getElementById('install-banner').style.display = 'none'; deferredPrompt = null; }); }
}
function copyForSafari() { navigator.clipboard.writeText(window.location.href); showCustomAlert('تم نسخ الرابط! افتح سفاري والصقه في شريط العنوان.'); }
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('service-worker.js').catch(err => console.log('SW failed: ', err)); }); }

document.addEventListener('DOMContentLoaded', async () => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) document.getElementById('install-banner').style.display = 'none';
    try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        const data = await res.json();
        currentSettings = data.settings || {}; allMenuItems = data.items || []; allCategories = data.categories || []; const offers = data.offers || []; currentSettings.delivery_areas = data.delivery_areas || [];
        document.getElementById('header-phone').innerText = currentSettings.phone || '0935746965'; document.getElementById('header-address').innerText = currentSettings.address || 'سرت';
        if (currentSettings.status === 'closed' && currentSettings.announcement) { document.getElementById('announcementText').innerText = currentSettings.announcement; document.getElementById('maintenanceBanner').style.display = 'block'; }

        const offersContainer = document.getElementById('customer-offers-container');
        if (offers.length > 0) { offersContainer.innerHTML = offers.map(o => `<div style="background: linear-gradient(145deg, #1f1f1f, #141414); border: 2px solid #f39c12; border-radius: 15px; padding: 20px; margin-bottom: 15px; text-align: center;"><span style="font-size: 30px; display: block; margin-bottom: 10px;">🎁</span><p style="font-size: 16px; color: #fff; margin:0 0 10px 0;">${o.text}</p><div style="font-size: 22px; font-weight: bold; color: #f39c12; margin-bottom: 15px;">${o.price} د.ل</div><button onclick="addOfferToCart(${o.id}, '${o.text.replace(/'/g, "\\'")}', ${o.price})" style="background:#2ecc71; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px;">اغتنم الفرصة</button></div>`).join(''); } 
        else { offersContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: #888;">لا توجد عروض حالياً.</div>`; }

        const compContainer = document.getElementById('customer-comp-container');
        if (data.competitions && data.competitions.length > 0) { compContainer.innerHTML = data.competitions.map(c => c.winner ? `<div style="background: linear-gradient(145deg, #1f1f1f, #141414); border: 2px solid #2ecc71; border-radius: 15px; padding: 20px; margin-bottom: 15px; text-align: center; position: relative; overflow: hidden;"><div style="position: absolute; top: 10px; right: -30px; background: #2ecc71; color: #fff; padding: 5px 40px; transform: rotate(45deg); font-weight: bold; font-size: 12px;">منتهية</div><h3 style="color: #f39c12; margin-bottom: 10px;">🏆 ${c.title}</h3><p style="color: #fff; margin-bottom: 5px;">الجائزة: <strong>${c.prize}</strong></p><p style="color: #aaa; font-size: 14px; margin-bottom: 15px;">المدة: ${c.duration}</p><div style="background: rgba(46, 204, 113, 0.1); border: 1px dashed #2ecc71; border-radius: 10px; padding: 15px;"><p style="color: #2ecc71; font-size: 18px; font-weight: bold; margin: 0;">🎉 الفائز: ${c.winner}</p></div></div>` : `<div style="background: #1f1f1f; border: 1px solid #f39c12; border-radius: 12px; padding: 20px; margin-bottom: 15px; text-align: center;"><h3 style="color: #f39c12; margin-bottom: 10px;">🔥 ${c.title}</h3><p style="color: #fff; margin-bottom: 5px;">الجائزة: <strong>${c.prize}</strong></p><p style="color: #aaa; font-size: 14px;">المدة: ${c.duration}</p><p style="color: #f39c12; font-size: 13px; margin-top: 10px; font-weight: bold;">⏳ المسابقة مستمرة.. شارك الآن!</p></div>`).join(''); } 
        else { compContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: #888;">لا توجد مسابقات حالياً.</div>`; }
        renderCustomerMenu(allMenuItems, allCategories);
    } catch (e) { console.error("خطأ:", e); document.getElementById('customer-menu-container').innerHTML = '<p style="text-align:center; color:#fff;">عذراً، حدث خطأ في تحميل القائمة.</p>'; }
});



function getCategoryImage(name) {
    if (name.includes('بيتزا محشية')) return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80';
    if (name.includes('بيتزا')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80';
    if (name.includes('سندوتش')) return 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500&q=80';
    if (name.includes('وجب')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80';
    if (name.includes('بوكس')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80';
    if (name.includes('مشروب') || name.includes('عصير')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80';
    if (name.includes('معجنات') || name.includes('مخبوزات')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80';
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80'; // Default
}

function renderCustomerMenu(items, categories) {
    const container = document.getElementById('customer-menu-container');
    let displayCategories = categories;
    
    // --- ترتيب الأقسام: وضع المعجنات قبل المشروبات ---
    if (displayCategories && displayCategories.length > 0) {
        const pastriesIndex = displayCategories.findIndex(c => c.name === 'المعجنات');
        const drinksIndex = displayCategories.findIndex(c => c.name === 'المشروبات الغازية والعصائر');
        if (pastriesIndex !== -1 && drinksIndex !== -1) {
            const pastriesItem = displayCategories.splice(pastriesIndex, 1)[0];
            const newDrinksIndex = displayCategories.findIndex(c => c.name === 'المشروبات الغازية والعصائر');
            displayCategories.splice(newDrinksIndex, 0, pastriesItem);
        }
    }
    // ---------------------------------------------------

    if (!displayCategories || displayCategories.length === 0) { 
        displayCategories = [{ name: 'البيتزا العادية', is_active: 1 },{ name: 'البيتزا المحشية', is_active: 1 },{ name: 'السندوتشات', is_active: 1 },{ name: 'الوجبات', is_active: 1 },{ name: 'البوكسات العائلية', is_active: 1 }]; 
    }

    container.innerHTML = displayCategories.map(cat => {
        const catName = cat.name; 
        const isActive = cat.is_active; 
        const catItems = items.filter(i => i.category === catName); 
        const bgImage = getCategoryImage(catName);
        
        if (!isActive) { 
            return `<button class="accordion" onclick="showCustomAlert('نعتذر منك، هذا القسم غير متوفر حالياً.')" style="background-image: url('${bgImage}');"><div class="acc-content"><span class="acc-title" style="${catName.length > 15 ? 'font-size: 16px; line-height: 1.2;' : ''}">${catName}</span><span class="acc-badge" style="background:#e74c3c; color:#fff; border-color:#e74c3c;">غير متوفر حالياً</span></div></button>`; 
        }

        let itemsHtml = catItems.map(item => {
            if (item.is_active === 0) {
                return `<div class="menu-item" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 0; border-bottom: 1px dashed #444; gap: 10px; opacity: 0.7;">
                            <div style="flex: 1; min-width: 0;">
                                <span class="item-name" style="display:block; color:#fff; font-weight:bold; word-break: break-word;">${item.name}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px; flex-shrink: 0;">
                                <span style="color:#e74c3c; font-weight:bold; white-space: nowrap; font-size:12px; background:rgba(231,76,60,0.15); border:1px solid rgba(231,76,60,0.3); padding:4px 10px; border-radius:8px; display:flex; flex-direction:column; align-items:center; line-height:1.2;">
                                    <span>نفدت الكمية</span>
                                    <span style="font-size:10px; color:#ff9999;">غير متوفر</span>
                                </span>
                            </div>
                        </div>`;
            }
            const hasDetails = (item.description && item.description.trim() !== '') || (item.image_url && item.image_url.trim() !== '');
            
            // If hasDetails is true, show details button and HIDE the + button.
            // If false, HIDE details button and SHOW the + button.
            return `<div class="menu-item" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 0; border-bottom: 1px dashed #444; gap: 10px;">
                        <div style="flex: 1; min-width: 0;">
                            <span class="item-name" style="display:block; color:#fff; font-weight:bold; word-break: break-word;">${item.name}</span>
                            ${hasDetails ? `<button onclick="openDetails(${item.id})" style="background:#333; color:#f39c12; border:1px solid #f39c12; padding:4px 10px; border-radius:5px; font-size:12px; margin-top:6px; cursor:pointer; display:inline-block;">🔍 عرض التفاصيل والطلب</button>` : ''}
                        </div>
                        <div style="display:flex; align-items:center; gap:12px; flex-shrink: 0;">
                            <span style="color:#f39c12; font-weight:bold; white-space: nowrap; font-size:16px;">${item.price} د.ل</span>
                            ${!hasDetails ? `<button onclick="addToCart(${item.id})" style="background:#f39c12; color:#000; border:none; width:38px; height:38px; border-radius:50%; font-size:26px; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center; box-shadow: 0 3px 8px rgba(243, 156, 18, 0.4); transition: transform 0.1s;">+</button>` : ''}
                        </div>
                    </div>`;
        }).join('');
        
        return `<button class="accordion" style="background-image: url('${bgImage}');"><div class="acc-content"><span class="acc-title" style="${catName.length > 15 ? 'font-size: 16px; line-height: 1.2;' : ''}">${catName}</span><span class="acc-badge">افتح واختر</span></div></button><div class="panel">${catItems.length > 0 ? itemsHtml : '<div style="padding: 15px; color: #888; text-align: center;">لا توجد أصناف متاحة في هذا القسم حالياً.</div>'}</div>`;
    }).join('');

    var acc = document.getElementsByClassName("accordion");
    for (var i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function(e) {
            if(e.target.closest('.menu-item') && this.classList.contains('active')) return;
            if(this.getAttribute('onclick')) return;
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) { panel.style.maxHeight = null; panel.classList.remove("active"); }
            else { 
                document.querySelectorAll('.panel').forEach(p => { p.style.maxHeight = null; p.classList.remove("active"); }); 
                this.classList.add("active"); 
                panel.classList.add("active"); 
                panel.style.maxHeight = panel.scrollHeight + "px"; 
            }
        });
    }
}


function openDetails(id) {
    const item = allMenuItems.find(i => i.id === id); if(!item) return;
    document.getElementById('detail-item-name').innerText = item.name; document.getElementById('detail-item-price').innerText = item.price; document.getElementById('detail-item-desc').innerText = item.description || 'لا يوجد وصف متاح.';
    const imgEl = document.getElementById('detail-item-image');
    if(item.image_url) { imgEl.src = item.image_url; imgEl.style.display = 'block'; } else { imgEl.style.display = 'none'; }
    document.getElementById('detail-item-add-btn').onclick = function() { addToCart(item.id); closeItemDetails(); };
    document.getElementById('item-details-modal').style.display = 'flex';
}
function closeItemDetails() { document.getElementById('item-details-modal').style.display = 'none'; }

function updateOrderTotal() {
    const totalItems = cart.reduce((sum, item) => sum + (item.price * item.qty), 0); 
    const deliverySelect = document.getElementById('delivery-select');
    const deliveryFee = parseFloat(deliverySelect.value) || 0; 
    const finalTotal = totalItems + deliveryFee;
    
    document.getElementById('summary-subtotal').innerText = totalItems; 
    document.getElementById('summary-delivery').innerText = deliveryFee; 
    document.getElementById('summary-total').innerText = finalTotal;
    
    const addressInput = document.getElementById('customer-address'); 
    if (deliverySelect.value === "" || deliverySelect.value === "0") { 
        addressInput.style.display = 'none'; 
        if (deliverySelect.value === "0") addressInput.value = 'استلام من المطعم';
        else addressInput.value = '';
    } else { 
        addressInput.style.display = 'block'; 
        addressInput.value = ''; 
    }
}
function togglePaymentMethod() { document.getElementById('prepayment-section').style.display = document.getElementById('payment-method').value === 'prepayment' ? 'block' : 'none'; }

function openCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #333; padding-bottom:10px;">
            <div style="flex:1; padding-left:10px;">
                <strong style="color:#fff; font-size:15px; display:block; margin-bottom:4px;">${item.name}</strong>
                <span style="color:#f39c12; font-size:13px; font-weight:bold;">${item.price * item.qty} د.ل</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                <div style="display:flex; align-items:center; background:#1a1a1a; border:1px solid #444; border-radius:8px; overflow:hidden;">
                    <button onclick="changeQty('${item.id}', -1)" style="background:#333; color:#f39c12; border:none; width:30px; height:30px; font-size:20px; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center;">-</button>
                    <span style="color:#fff; font-weight:bold; width:30px; text-align:center; font-size:15px;">${item.qty}</span>
                    <button onclick="changeQty('${item.id}', 1)" style="background:#333; color:#f39c12; border:none; width:30px; height:30px; font-size:20px; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center;">+</button>
                </div>
                <button onclick="removeFromCart('${item.id}')" style="background:rgba(231,76,60,0.15); color:#e74c3c; border:1px solid #e74c3c; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">حذف</button>
            </div>
        </div>
    `).join('');
    const deliverySelect = document.getElementById('delivery-select'); deliverySelect.innerHTML = '<option value="" disabled selected hidden>-- الرجاء اختيار طريقة الاستلام --</option><option value="0">الاستلام من المطعم (0.0 د.ل)</option>';
    if (currentSettings.delivery_areas) { currentSettings.delivery_areas.forEach(area => { deliverySelect.innerHTML += `<option value="${area.fee}">${area.name} (${area.fee} د.ل)</option>`; }); }
    document.getElementById('prepayment-info-text').innerText = currentSettings.prepayment_info || 'لم يتم وضع معلومات دفع.';
    updateOrderTotal(); document.getElementById('cart-modal').style.display = 'flex';
}
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

function changeQty(id, change) {
    const item = cart.find(i => String(i.id) === String(id));
    if (!item) return;
    
    item.qty += change;
    
    if (item.qty <= 0) {
        removeFromCart(id);
    } else {
        updateCartUI();
        openCart(); // Re-render the cart modal to show new quantity
    }
}

function removeFromCart(id) { cart = cart.filter(i => String(i.id) !== String(id)); updateCartUI(); if (cart.length === 0) closeCart(); else openCart(); }
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0); const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('cart-count').innerText = totalItems; document.getElementById('cart-total').innerText = totalPrice; document.getElementById('summary-total').innerText = totalPrice;
    if (totalItems > 0) document.getElementById('cart-bar').style.display = 'flex'; else document.getElementById('cart-bar').style.display = 'none';
}

function showClosedModal() {
    let modal = document.getElementById('closed-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'closed-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:20px; backdrop-filter: blur(5px);';
        modal.innerHTML = `
            <div style="background:linear-gradient(145deg, #1f1f1f, #141414); border:2px solid #f39c12; border-radius:20px; padding:30px 20px; text-align:center; max-width:350px; width:100%; box-shadow: 0 10px 30px rgba(243,156,18,0.2); position:relative; animation: popIn 0.3s ease;">
                <button onclick="document.getElementById('closed-modal').style.display='none'" style="position:absolute; top:10px; right:15px; background:none; border:none; color:#aaa; font-size:26px; cursor:pointer;">&times;</button>
                <div style="font-size:55px; margin-bottom:15px;">🙏</div>
                <p style="color:#f39c12; font-size:18px; font-weight:bold; margin:0 0 20px 0; line-height:1.6;">نعتذر منك، المطعم مغلق حالياً</p>
                <button onclick="document.getElementById('closed-modal').style.display='none'" style="background:#2ecc71; color:#000; border:none; padding:12px 25px; border-radius:12px; font-weight:bold; font-size:16px; cursor:pointer; width:100%; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);">حسناً، فهمت</button>
            </div>
            <style>@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }</style>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
}

function addToCart(id) { 
    if (currentSettings.status === 'closed') { showClosedModal(); return; }
    const item = allMenuItems.find(i => i.id === id); const existing = cart.find(i => i.id === id); if (existing) { existing.qty++; showToast(`تمت إضافة ${item.name}`); } else { cart.push({ ...item, qty: 1 }); showToast(`تم اختيار ${item.name}`); } updateCartUI(); }
function addOfferToCart(id, name, price) { 
    if (currentSettings.status === 'closed') { showClosedModal(); return; }
    const offerId = 'offer_' + id; const existing = cart.find(i => i.id === offerId); if (existing) { existing.qty++; showToast(`تمت إضافة ${name}`); } else { cart.push({ id: offerId, name: name, price: price, qty: 1 }); showToast(`تم اختيار العرض: ${name}`); } updateCartUI(); }


function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(maxWidth / img.width, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    const compressedFile = new File([blob], "receipt.jpg", { type: 'image/jpeg', lastModified: Date.now() });
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}


function compressReceiptImage(file, maxWidth = 1000, quality = 0.7) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) return resolve(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(maxWidth / img.width, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    if (!blob) return resolve(file);
                    const compressedFile = new File([blob], "receipt.jpg", { type: 'image/jpeg', lastModified: Date.now() });
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}



async function compressReceiptImage(file) {
    let fileToCompress = file;

    // 1. Handle iPhone HEIC format
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
        try {
            if (!window.heic2any) {
                await loadScript('https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js');
            }
            const convertedBlob = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
            fileToCompress = new File([convertedBlob], 'converted.jpg', { type: 'image/jpeg' });
        } catch (e) {
            console.error('HEIC conversion failed:', e);
            throw new Error('صيغة صورة الآيفون غير مدعومة.');
        }
    }

    // 2. Compress using browser-image-compression (Web Worker)
    try {
        if (!window.imageCompression) {
            await loadScript('https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.0/dist/browser-image-compression.js');
        }
        const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: 'image/jpeg'
        };
        return await window.imageCompression(fileToCompress, options);
    } catch (e) {
        console.error('Compression failed:', e);
        throw new Error('فشل ضغط الصورة على هذا الهاتف.');
    }
}


async function sendOrder() {
    const notes = document.getElementById('order-notes').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const receiptFile = document.getElementById('receipt-upload').files[0];

    if (currentSettings.status === 'closed') {
        showCustomAlert('عذراً، المطعم مغلق حالياً. ' + (currentSettings.announcement || ''));
        return;
    }
            const deliverySelectVal = document.getElementById('delivery-select').value;
        const nameVal = document.getElementById('customer-name').value.trim();
        const phoneVal = document.getElementById('customer-phone').value.trim().replace(/[^0-9]/g, '');
        const addressVal = document.getElementById('customer-address').value.trim();

        const missingFields = [];

        if (deliverySelectVal === "") missingFields.push("طريقة الاستلام (توصيل أو استلام)");
        if (!nameVal) missingFields.push("الاسم الثلاثي");
        
        if (!phoneVal) {
            missingFields.push("رقم الهاتف");
        } else if (phoneVal.length !== 10) {
            showCustomAlert('عذراً منك، رقم الهاتف يجب أن يتكون من 10 أرقام كاملة (مثال: 0912345678). يرجى مراجعة الرقم.', 'تنبيه هام');
            return;
        }

        if (deliverySelectVal !== "0" && deliverySelectVal !== "" && !addressVal) {
            missingFields.push("العنوان بالتفصيل");
        }

        if (missingFields.length > 0) {
            let msg = "عذراً منك، يبدو أنك نسيت إدخال بعض البيانات الهامة لإتمام طلبك:<br><br>";
            missingFields.forEach(f => { msg += "🔸 <strong>" + f + "</strong><br>"; });
            msg += "<br>يرجى كتابتها لنتمكن من تجهيز طلبك بأسرع وقت.";
            showCustomAlert(msg, 'بيانات ناقصة');
            return;
        }
        
        // Set values after validation to ensure they are correct
        const name = nameVal;
        const phone = phoneVal;
        const address = addressVal;
    if (paymentMethod === 'prepayment' && !receiptFile) { showCustomAlert('الرجاء رفع صورة إيصال الدفع المسبق.'); return; }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const deliveryFee = parseFloat(document.getElementById('delivery-select').value) || 0;
    const total = subtotal + deliveryFee;
    
    const btn = document.getElementById('send-order-btn');
    btn.innerText = 'جاري معالجة الصورة...'; 
    btn.disabled = true;

    const formData = new FormData();
    formData.append('action', 'send_telegram');
    formData.append('total', total);

    let message = `*طلب جديد من مطعم سين*\n\n👤 *الاسم:* ${name}\n📞 *الهاتف:* ${phone}\n📍 *العنوان:* ${address}\n📝 *ملاحظات:* ${notes || 'لا يوجد'}\n💳 *الدفع:* ${paymentMethod === 'prepayment' ? 'مسبق' : 'عند الاستلام'}\n\n*الطلبات:*\n`;
    cart.forEach(item => { message += `▪️ ${item.name} (${item.qty}) - ${item.price * item.qty} د.ل\n`; });
    message += `\n💰 *المجموع الفرعي:* ${subtotal} د.ل\n🛵 *التوصيل:* ${deliveryFee} د.ل\n💵 *الإجمالي:* ${total} د.ل`;

    formData.append('message', message);

    if (receiptFile) {
        try {
            const compressed = await compressReceiptImage(receiptFile);
            formData.append('image', compressed, 'receipt.jpg');
        } catch (e) {
            alert("⚠️ " + e.message + "\n\nالطلب لم يتم إرساله. يرجى المحاولة مرة أخرى أو استخدام خيار (الدفع عند الاستلام).");
            btn.innerText = 'تأكيد الطلب'; 
            btn.disabled = false;
            return; // Stop here
        }
    }

    btn.innerText = 'جاري الإرسال...';
    try {
        const res = await fetch('/api/data', { method: 'POST', body: formData });
        if (res.ok) {
            closeCart(); 
            document.getElementById('success-modal').style.display = 'flex'; 
            cart = []; 
            updateCartUI();
            document.getElementById('customer-name').value = ''; 
            document.getElementById('customer-phone').value = ''; 
            document.getElementById('customer-address').value = ''; 
            document.getElementById('order-notes').value = '';
            document.getElementById('receipt-upload').value = '';
        } else {
            const errData = await res.json().catch(()=>({}));
            showCustomAlert('❌ الطلب لم يصل: ' + (errData.error || 'يرجى المحاولة لاحقاً'));
        }
    } catch (e) {
        showCustomAlert('⚠️ فشل الاتصال بالإنترنت. الطلب لم يتم إرساله. يرجى المحاولة مرة أخرى أو اختيار (الدفع عند الاستلام).');
    } finally {
        btn.innerText = 'تأكيد الطلب'; 
        btn.disabled = false;
    }
}
