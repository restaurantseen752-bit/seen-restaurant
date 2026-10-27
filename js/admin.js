
// --- Custom UI Modals ---
function showCustomAlert(message, title = 'تنبيه') {
    let modal = document.getElementById('custom-alert-modal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'custom-alert-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:20px;';
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
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:20px;';
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
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:20px;';
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
if (!document.getElementById('custom-modal-style')) {
    const style = document.createElement('style');
    style.id = 'custom-modal-style';
    style.innerHTML = '@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }';
    document.head.appendChild(style);
}
// --- End Custom UI Modals ---

// Admin panel JS - session-based auth
let currentToken = sessionStorage.getItem('adminToken') || '';
let currentEditItem = null;

function compressImageForUpload(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) return resolve(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(new File([blob], "item.jpg", { type: 'image/jpeg' }));
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}


// Auto-check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    if (currentToken) {
        const ls = document.getElementById('login-screen');
        const ac = document.getElementById('app-container');
        if (ls) ls.style.display = 'none';
        if (ac) ac.style.display = 'flex';
        fetchData();
    }
});

async function login() {
    console.log("🔵 [1] تم الضغط على زر الدخول");
    const passEl = document.getElementById('login-pass');
    const errEl = document.getElementById('login-error');
    
    if (!passEl) { console.error("❌ لم يتم العثور على حقل كلمة المرور"); return; }
    const pass = passEl.value;
    console.log("🔵 [2] كلمة المرور المدخلة:", pass);

    if (!pass) { 
        if (errEl) { errEl.style.display = 'block'; errEl.innerText = 'ادخل كلمة المرور'; }
        else { alert('ادخل كلمة المرور'); }
        return; 
    }
    if (errEl) errEl.style.display = 'none';
    
    try {
        console.log("🔵 [3] جاري الاتصال بالسيرفر...");
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', password: pass })
        });
        console.log("🔵 [4] استجابة السيرفر:", res.status);
        
        const data = await res.json();
        console.log("🔵 [5] بيانات السيرفر:", data);

        if (res.ok && data.token) {
            console.log("✅ [6] نجح الدخول، جاري حفظ التوكن...");
            currentToken = data.token;
            
            // حماية من أخطاء sessionStorage (قد تسبب صمتاً في المتصفحات الخفية)
            try { sessionStorage.setItem('adminToken', currentToken); } 
            catch(e) { console.warn("⚠️ لم يتمكن المتصفح من حفظ الجلسة:", e); }

            const ls = document.getElementById('login-screen');
            const ac = document.getElementById('app-container');
            if (ls) ls.style.display = 'none';
            if (ac) ac.style.display = 'flex';
            
            console.log("✅ [7] جاري تحميل البيانات...");
            fetchData();
        } else {
            console.warn("❌ [6] رفض السيرفر الدخول:", data.error);
            if (errEl) { errEl.style.display = 'block'; errEl.innerText = 'كلمة المرور غير صحيحة'; }
            else { alert('كلمة المرور غير صحيحة'); }
        }
    } catch (e) {
        console.error("❌ [ERROR] فشل الاتصال:", e);
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('حدث خطأ في الاتصال: ' + e.message, 'خطأ تقني');
        } else {
            alert('حدث خطأ في الاتصال: ' + e.message);
        }
    }
}

async function logout() {
    if (currentToken) {
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout', token: currentToken })
            });
        } catch (e) {}
    }
    sessionStorage.removeItem('adminToken');
    currentToken = '';
    location.reload();
}

async function fetchData() {
    try {
        const res = await fetch('/api/data?token=' + encodeURIComponent(currentToken), { cache: 'no-store' });
        const data = await res.json();
        if (!data) return;
        if (!data.isAdmin) {
            sessionStorage.removeItem('adminToken');
            currentToken = '';
            location.reload();
            return;
        }
        const items = data.items || [];
        const categories = data.categories || [];

        // --- تحديث قائمة الأقسام في (إضافة صنف) و (تعديل صنف) ---
        // --- تحديث فلتر عرض الأصناف ---
        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            const currentFilter = filterSelect.value;
            filterSelect.innerHTML = '<option value="all">عرض كل الأقسام</option>';
            categories.forEach(cat => {
                filterSelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
            });
            if (currentFilter && currentFilter !== 'all') {
                filterSelect.value = currentFilter;
            }
        }

        const catSelect = document.getElementById('item-category');
        const editCatSelect = document.getElementById('edit-item-category');
        if (catSelect && editCatSelect) {
            // حفظ القيمة الحالية (إذا كان المستخدم يعدل صنفاً ما)
            const currentVal = catSelect.value;
            const currentEditVal = editCatSelect.value;
            
            // مسح الخيارات القديمة
            catSelect.innerHTML = '';
            editCatSelect.innerHTML = '';
            
            // إضافة الخيارات الجديدة من قاعدة البيانات
            categories.forEach(cat => {
                catSelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
                editCatSelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
            });
            
            // استعادة القيمة السابقة إن وجدت
            if (currentVal) catSelect.value = currentVal;
            if (currentEditVal) editCatSelect.value = currentEditVal;
        }
        // -----------------------------------------------------------

        const settings = data.settings || {};
        const competitions = data.competitions || [];
        const offers = data.offers || [];
        const deliveryAreas = data.delivery_areas || [];

        document.getElementById('dash-orders').innerText = data.todayOrdersCount || 0;
        document.getElementById('dash-items').innerText = items.length;

        const catBody = document.getElementById('category-table-body');
        catBody.innerHTML = categories.map(cat => `
                <tr>
                    <td>${cat.name}</td>
                    <td>${cat.is_active ? '🟢 متاح' : '🔴 غير متوفر'}</td>
                    <td style="display:flex; gap:5px;">
                        <button class="action-btn btn-edit" onclick="editCategory(${cat.id}, '${cat.name}')">تعديل</button>
                        <button class="action-btn ${cat.is_active ? 'btn-delete' : 'btn-edit'}" onclick="toggleCategory('${cat.name}', ${cat.is_active ? 0 : 1})">${cat.is_active ? 'إيقاف' : 'تفعيل'}</button>
                    </td>
                </tr>
            `).join('');

        const filter = document.getElementById('filter-category').value;
        const filteredItems = filter === 'all' ? items : items.filter(i => i.category === filter);
        const tbody = document.getElementById('menu-table-body');
        tbody.innerHTML = filteredItems.length ? '' : '<tr><td colspan="4" style="text-align:center;">لا توجد أصناف.</td></tr>';
        filteredItems.forEach(item => {
            const itemData = encodeURIComponent(JSON.stringify(item));
            const statusBtn = item.is_active === 0 
                ? `<button class="action-btn btn-edit" style="background:#2ecc71; color:#fff; border:none;" onclick="toggleItem(${item.id}, 1)">تفعيل</button>` 
                : `<button class="action-btn btn-delete" style="background:#f39c12; color:#000;" onclick="toggleItem(${item.id}, 0)">إيقاف</button>`;
            tbody.innerHTML += `<tr><td style="${item.is_active === 0 ? 'opacity:0.5;' : ''}">${item.name}</td><td>${item.price} د.ل</td><td>${item.category}</td><td style="display:flex; gap:5px;"><button class="action-btn btn-edit" onclick="openEditModal('${itemData}')">تعديل</button><button class="action-btn btn-delete" onclick="deleteMenuItem(${item.id})">حذف</button>${statusBtn}</td></tr>`;
        });

        const offersBody = document.getElementById('offers-table-body');
        offersBody.innerHTML = offers.map(o => `<tr><td>${o.text} (${o.price} د.ل)</td><td><button class="action-btn btn-delete" onclick="deleteOffer(${o.id})">حذف</button></td></tr>`).join('') || '<tr><td colspan="2" style="text-align:center;">لا توجد عروض.</td></tr>';

        const deliveryBody = document.getElementById('delivery-table-body');
        deliveryBody.innerHTML = deliveryAreas.map(area => `<tr><td>${area.name}</td><td>${area.fee} د.ل</td><td><button class="action-btn btn-delete" onclick="deleteDeliveryArea(${area.id})">حذف</button></td></tr>`).join('') || '<tr><td colspan="3" style="text-align:center;">لا توجد مناطق</td></tr>';

        if (!document.getElementById('set-telegram-token').matches(':focus')) {
            document.getElementById('set-phone').value = settings.phone || '';
            document.getElementById('set-address').value = settings.address || '';
            document.getElementById('set-telegram-token').value = settings.telegramToken || '';
            document.getElementById('set-telegram-chatid').value = settings.telegramChatId || '';
            document.getElementById('set-prepayment').value = settings.prepayment_info || '';
        }

        const isClosed = settings.status === 'closed';
        document.getElementById('dashboard-status-text').innerText = isClosed ? 'مغلق' : 'مفتوح';
        document.getElementById('dashboard-status-text').style.color = isClosed ? 'var(--danger)' : 'var(--success)';
        document.getElementById('status-indicator').innerText = isClosed ? '🔴 مغلق' : '🟢 مفتوح';
        document.getElementById('status-indicator').style.color = isClosed ? 'var(--danger)' : 'var(--success)';
        document.getElementById('announcementInput').value = settings.announcement || '';
        document.getElementById('btn-close-rest').style.display = isClosed ? 'none' : 'block';
        document.getElementById('btn-open-rest').style.display = isClosed ? 'block' : 'none';

        const compBody = document.getElementById('comp-table-body');
        compBody.innerHTML = competitions.map(c => `
            <tr style="background-color: ${c.status === 'finished' ? 'rgba(46, 204, 113, 0.1)' : 'transparent'};">
                <td>${c.title} ${c.status === 'finished' ? '(منتهية)' : ''}</td><td>${c.prize}</td><td>${c.duration}</td><td>${c.winner || 'لم يحدد'}</td>
                <td>${c.status !== 'finished' ? `<button class="action-btn btn-edit" onclick="setWinner(${c.id})">🏆</button>` : ''}<button class="action-btn btn-delete" onclick="deleteComp(${c.id})">🗑️</button></td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="text-align:center;">لا توجد مسابقات.</td></tr>';
    } catch (e) {
        console.error(e);
    }
}

async function sendAction(action, payload) {
    try {
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, action, token: currentToken })
        });
        const data = await res.json();
        if (res.ok) { await fetchData(); return true; }
        else { alert('خطأ: ' + data.error); return false; }
    } catch (e) {
        showCustomAlert('حدث خطأ في الاتصال'); return false;
    }
}

async function toggleCategory(name, is_active) { if(await showCustomConfirm(`تغيير حالة القسم ${name}؟`)) { const s = await sendAction('toggle_category', { name, is_active }); if (s) showCustomAlert(`✅ تم التحديث!`); } }

async function addMenuItem() {
    const n = document.getElementById('item-name').value, p = document.getElementById('item-price').value, c = document.getElementById('item-category').value, d = document.getElementById('item-desc').value;
    const fileInput = document.getElementById('item-img-file');
    let imgUrl = '';
    if (!n || !p) { showCustomAlert('الرجاء إدخال الاسم والسعر'); return; }
    const btn = event.target; btn.innerText = 'جاري الرفع...'; btn.disabled = true;
    if (fileInput.files.length > 0) {
        const compressed = await compressImageForUpload(fileInput.files[0]); const formData = new FormData(); formData.append('image', compressed);
        try {
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.success) imgUrl = uploadData.url;
        } catch (e) { showCustomAlert('خطأ في رفع الصورة'); btn.innerText = 'إضافة الصنف'; btn.disabled = false; return; }
    }
    const s = await sendAction('add_item', { name: n, price: p, category: c, description: d, image_url: imgUrl });
    if (s) { document.getElementById('item-name').value = ''; document.getElementById('item-price').value = ''; document.getElementById('item-desc').value = ''; fileInput.value = ''; showCustomAlert('✅ تمت الإضافة!'); }
    btn.innerText = 'إضافة الصنف'; btn.disabled = false;
}

function openEditModal(encodedData) {
    const item = JSON.parse(decodeURIComponent(encodedData)); currentEditItem = item;
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-price').value = item.price;
    document.getElementById('edit-item-category').value = item.category;
    document.getElementById('edit-item-desc').value = item.description || '';
    const imgPreview = document.getElementById('edit-item-img-preview'), btnDeleteImg = document.getElementById('btn-delete-img');
    if (item.image_url) { imgPreview.src = item.image_url; imgPreview.style.display = 'block'; btnDeleteImg.style.display = 'inline-block'; }
    else { imgPreview.style.display = 'none'; btnDeleteImg.style.display = 'none'; }
    document.getElementById('edit-item-img-file').value = '';
    document.getElementById('edit-item-modal').style.display = 'flex';
}

async function saveFullItemEdit() {
    const id = document.getElementById('edit-item-id').value, name = document.getElementById('edit-item-name').value, price = document.getElementById('edit-item-price').value, category = document.getElementById('edit-item-category').value, desc = document.getElementById('edit-item-desc').value;
    const fileInput = document.getElementById('edit-item-img-file');
    let imgUrl = currentEditItem ? currentEditItem.image_url : '';
    if (!name || !price) { showCustomAlert('الاسم والسعر مطلوبان'); return; }
    const btn = document.getElementById('btn-save-edit'); btn.innerText = 'جاري الحفظ...'; btn.disabled = true;
    if (fileInput.files.length > 0) {
        const compressed = await compressImageForUpload(fileInput.files[0]); const formData = new FormData(); formData.append('image', compressed);
        try {
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.success) imgUrl = uploadData.url;
        } catch (e) { showCustomAlert('خطأ في رفع الصورة'); btn.innerText = 'حفظ التعديلات'; btn.disabled = false; return; }
    }
    const s = await sendAction('update_full_item', { id, name, price, category, description: desc, image_url: imgUrl, old_image_url: currentEditItem ? currentEditItem.image_url : '' });
    if (s) { showCustomAlert('✅ تم حفظ التعديلات بنجاح!'); document.getElementById('edit-item-modal').style.display = 'none'; }
    btn.innerText = 'حفظ التعديلات'; btn.disabled = false;
}

async function deleteItemImage() { if (await showCustomConfirm('حذف الصورة؟')) { currentEditItem.image_url = ''; document.getElementById('edit-item-img-preview').style.display = 'none'; document.getElementById('btn-delete-img').style.display = 'none'; } }
async function deleteMenuItem(id) { if (await showCustomConfirm('حذف الصنف؟')) { const s = await sendAction('delete_item', { id }); if (s) showCustomAlert('✅ تم الحذف!'); } }
async function addOffer() { const t = document.getElementById('offer-text').value, p = document.getElementById('offer-price').value; if (t && p) { const s = await sendAction('add_offer', { text: t, price: parseFloat(p) }); if (s) { document.getElementById('offer-text').value = ''; document.getElementById('offer-price').value = ''; showCustomAlert('✅ تمت الإضافة!'); } } }
async function deleteOffer(id) { if (await showCustomConfirm('حذف العرض؟')) { const s = await sendAction('delete_offer', { id }); if (s) showCustomAlert('✅ تم الحذف!'); } }
async function addDeliveryArea() { const n = document.getElementById('delivery-name').value, f = document.getElementById('delivery-fee').value; if (n && f) { const s = await sendAction('add_delivery_area', { name: n, fee: parseFloat(f) }); if (s) { document.getElementById('delivery-name').value = ''; document.getElementById('delivery-fee').value = ''; showCustomAlert('✅ تمت الإضافة!'); } } }
async function deleteDeliveryArea(id) { if (await showCustomConfirm('حذف المنطقة؟')) { const s = await sendAction('delete_delivery_area', { id }); if (s) showCustomAlert('✅ تم الحذف!'); } }
async function closeRestaurant() { const t = document.getElementById('announcementInput').value; if (!t) return showCustomAlert('اكتب سبب الإغلاق'); await sendAction('update_setting', { key: 'status', value: 'closed' }); const s = await sendAction('update_setting', { key: 'announcement', value: t }); if (s) showCustomAlert('✅ تم الإغلاق!'); }
async function openRestaurant() { if (await showCustomConfirm('فتح المطعم؟')) { await sendAction('update_setting', { key: 'status', value: 'open' }); const s = await sendAction('update_setting', { key: 'announcement', value: '' }); if (s) showCustomAlert('✅ تم الفتح!'); } }

async function saveContactInfo() {
    const btn = event.target; btn.innerText = 'جاري الحفظ...'; btn.disabled = true;
    try {
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_all_settings',
                token: currentToken,
                phone: document.getElementById('set-phone').value,
                address: document.getElementById('set-address').value,
                telegramToken: document.getElementById('set-telegram-token').value,
                telegramChatId: document.getElementById('set-telegram-chatid').value,
                prepayment_info: document.getElementById('set-prepayment').value
            })
        });
        if (res.ok) showCustomAlert('✅ تم حفظ الإعدادات بنجاح!'); else showCustomAlert('حدث خطأ أثناء الحفظ.');
    } catch(e) { showCustomAlert('حدث خطأ في الاتصال.'); } finally { btn.innerText = 'حفظ الإعدادات'; btn.disabled = false; }
}

async function saveCredentials() {
    const p = document.getElementById('new-password').value;
    if (!p) { showCustomAlert('ادخل كلمة المرور الجديدة'); return; }
    if (p.length < 6) { showCustomAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (!await showCustomConfirm('تغيير كلمة المرور؟ سيتم تسجيل خروجك من جميع الأجهزة.')) return;
    try {
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'change_password', token: currentToken, new_password: p })
        });
        const data = await res.json();
        if (res.ok) {
            showCustomAlert('✅ تم تغيير كلمة المرور! سيتم تسجيل خروجك الآن.');
            sessionStorage.removeItem('adminToken');
            location.reload();
        } else {
            showCustomAlert('خطأ: ' + (data.error || 'فشل التغيير'));
        }
    } catch (e) { showCustomAlert('حدث خطأ في الاتصال'); }
}

async function addCompetition() { const t = document.getElementById('comp-title').value, p = document.getElementById('comp-prize').value, d = document.getElementById('comp-duration').value; if (t && p && d) { const s = await sendAction('add_competition', { title: t, prize: p, duration: d }); if (s) { document.getElementById('comp-title').value = ''; document.getElementById('comp-prize').value = ''; document.getElementById('comp-duration').value = ''; showCustomAlert('✅ تمت الإضافة!'); } } }
async function deleteComp(id) { if (await showCustomConfirm('حذف؟')) { const s = await sendAction('delete_competition', { id }); if (s) showCustomAlert('✅ تم الحذف!'); } }
async function setWinner(id) { let w = await showCustomPrompt('اسم الفائز:'); if (w) { const s = await sendAction('set_winner', { id, winner: w }); if (s) showCustomAlert('✅ تم تسجيل الفائز!'); } }

function showSection(id, el) { document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active')); el.classList.add('active'); if (window.innerWidth <= 768) closeMenu(); }
function openMenu() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('active'); }
function closeMenu() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); }

// Service Worker Update Logic for Admin
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(reg => {
            reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = async () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (await showCustomConfirm('تم تحديث لوحة التحكم! اضغط موافق لإعادة التحميل وتطبيق النسخة الجديدة.')) {
                                window.location.reload();
                            }
                        }
                    };
                }
            };
        }).catch(err => console.log('SW Reg Error', err));
    });
}

async function toggleItem(id, is_active) {
    if(await showCustomConfirm(`هل أنت متأكد من ${is_active ? 'تفعيل' : 'إيقاف'} هذا الصنف؟`)) {
        const s = await sendAction('toggle_item', { id, is_active });
        if (s) showCustomAlert(`✅ تم ${is_active ? 'تفعيل' : 'إيقاف'} الصنف!`);
    }
}

async function editCategory(id, currentName) {
    let newName = await showCustomPrompt('أدخل الاسم الجديد للقسم:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
        const s = await sendAction('edit_category', { id, name: newName.trim() });
        if (s) showCustomAlert('✅ تم تعديل اسم القسم بنجاح!');
    }
}
