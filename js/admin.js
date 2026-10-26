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
    const pass = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');
    if (!pass) { errEl.style.display = 'block'; errEl.innerText = 'ادخل كلمة المرور'; return; }
    errEl.style.display = 'none';
    try {
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', password: pass })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            currentToken = data.token;
            sessionStorage.setItem('adminToken', currentToken);
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            fetchData();
        } else {
            errEl.style.display = 'block';
            errEl.innerText = 'كلمة المرور غير صحيحة';
        }
    } catch (e) {
        errEl.style.display = 'block';
        errEl.innerText = 'خطأ في الاتصال';
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
        const settings = data.settings || {};
        const competitions = data.competitions || [];
        const offers = data.offers || [];
        const deliveryAreas = data.delivery_areas || [];

        document.getElementById('dash-orders').innerText = data.todayOrdersCount || 0;
        document.getElementById('dash-items').innerText = items.length;

        const catBody = document.getElementById('category-table-body');
        catBody.innerHTML = categories.map(cat => `<tr><td>${cat.name}</td><td>${cat.is_active ? '🟢 متاح' : '🔴 غير متوفر'}</td><td><button class="action-btn ${cat.is_active ? 'btn-delete' : 'btn-edit'}" onclick="toggleCategory('${cat.name}', ${cat.is_active ? 0 : 1})">${cat.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>`).join('');

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
        alert('حدث خطأ في الاتصال'); return false;
    }
}

async function toggleCategory(name, is_active) { if(confirm(`تغيير حالة القسم ${name}؟`)) { const s = await sendAction('toggle_category', { name, is_active }); if (s) alert(`✅ تم التحديث!`); } }

async function addMenuItem() {
    const n = document.getElementById('item-name').value, p = document.getElementById('item-price').value, c = document.getElementById('item-category').value, d = document.getElementById('item-desc').value;
    const fileInput = document.getElementById('item-img-file');
    let imgUrl = '';
    if (!n || !p) { alert('الرجاء إدخال الاسم والسعر'); return; }
    const btn = event.target; btn.innerText = 'جاري الرفع...'; btn.disabled = true;
    if (fileInput.files.length > 0) {
        const compressed = await compressImageForUpload(fileInput.files[0]); const formData = new FormData(); formData.append('image', compressed);
        try {
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.success) imgUrl = uploadData.url;
        } catch (e) { alert('خطأ في رفع الصورة'); btn.innerText = 'إضافة الصنف'; btn.disabled = false; return; }
    }
    const s = await sendAction('add_item', { name: n, price: p, category: c, description: d, image_url: imgUrl });
    if (s) { document.getElementById('item-name').value = ''; document.getElementById('item-price').value = ''; document.getElementById('item-desc').value = ''; fileInput.value = ''; alert('✅ تمت الإضافة!'); }
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
    if (!name || !price) { alert('الاسم والسعر مطلوبان'); return; }
    const btn = document.getElementById('btn-save-edit'); btn.innerText = 'جاري الحفظ...'; btn.disabled = true;
    if (fileInput.files.length > 0) {
        const compressed = await compressImageForUpload(fileInput.files[0]); const formData = new FormData(); formData.append('image', compressed);
        try {
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.success) imgUrl = uploadData.url;
        } catch (e) { alert('خطأ في رفع الصورة'); btn.innerText = 'حفظ التعديلات'; btn.disabled = false; return; }
    }
    const s = await sendAction('update_full_item', { id, name, price, category, description: desc, image_url: imgUrl, old_image_url: currentEditItem ? currentEditItem.image_url : '' });
    if (s) { alert('✅ تم حفظ التعديلات بنجاح!'); document.getElementById('edit-item-modal').style.display = 'none'; }
    btn.innerText = 'حفظ التعديلات'; btn.disabled = false;
}

function deleteItemImage() { if (confirm('حذف الصورة؟')) { currentEditItem.image_url = ''; document.getElementById('edit-item-img-preview').style.display = 'none'; document.getElementById('btn-delete-img').style.display = 'none'; } }
async function deleteMenuItem(id) { if (confirm('حذف الصنف؟')) { const s = await sendAction('delete_item', { id }); if (s) alert('✅ تم الحذف!'); } }
async function addOffer() { const t = document.getElementById('offer-text').value, p = document.getElementById('offer-price').value; if (t && p) { const s = await sendAction('add_offer', { text: t, price: parseFloat(p) }); if (s) { document.getElementById('offer-text').value = ''; document.getElementById('offer-price').value = ''; alert('✅ تمت الإضافة!'); } } }
async function deleteOffer(id) { if (confirm('حذف العرض؟')) { const s = await sendAction('delete_offer', { id }); if (s) alert('✅ تم الحذف!'); } }
async function addDeliveryArea() { const n = document.getElementById('delivery-name').value, f = document.getElementById('delivery-fee').value; if (n && f) { const s = await sendAction('add_delivery_area', { name: n, fee: parseFloat(f) }); if (s) { document.getElementById('delivery-name').value = ''; document.getElementById('delivery-fee').value = ''; alert('✅ تمت الإضافة!'); } } }
async function deleteDeliveryArea(id) { if (confirm('حذف المنطقة؟')) { const s = await sendAction('delete_delivery_area', { id }); if (s) alert('✅ تم الحذف!'); } }
async function closeRestaurant() { const t = document.getElementById('announcementInput').value; if (!t) return alert('اكتب سبب الإغلاق'); await sendAction('update_setting', { key: 'status', value: 'closed' }); const s = await sendAction('update_setting', { key: 'announcement', value: t }); if (s) alert('✅ تم الإغلاق!'); }
async function openRestaurant() { if (confirm('فتح المطعم؟')) { await sendAction('update_setting', { key: 'status', value: 'open' }); const s = await sendAction('update_setting', { key: 'announcement', value: '' }); if (s) alert('✅ تم الفتح!'); } }

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
        if (res.ok) alert('✅ تم حفظ الإعدادات بنجاح!'); else alert('حدث خطأ أثناء الحفظ.');
    } catch(e) { alert('حدث خطأ في الاتصال.'); } finally { btn.innerText = 'حفظ الإعدادات'; btn.disabled = false; }
}

async function saveCredentials() {
    const p = document.getElementById('new-password').value;
    if (!p) { alert('ادخل كلمة المرور الجديدة'); return; }
    if (p.length < 6) { alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (!confirm('تغيير كلمة المرور؟ سيتم تسجيل خروجك من جميع الأجهزة.')) return;
    try {
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'change_password', token: currentToken, new_password: p })
        });
        const data = await res.json();
        if (res.ok) {
            alert('✅ تم تغيير كلمة المرور! سيتم تسجيل خروجك الآن.');
            sessionStorage.removeItem('adminToken');
            location.reload();
        } else {
            alert('خطأ: ' + (data.error || 'فشل التغيير'));
        }
    } catch (e) { alert('حدث خطأ في الاتصال'); }
}

async function addCompetition() { const t = document.getElementById('comp-title').value, p = document.getElementById('comp-prize').value, d = document.getElementById('comp-duration').value; if (t && p && d) { const s = await sendAction('add_competition', { title: t, prize: p, duration: d }); if (s) { document.getElementById('comp-title').value = ''; document.getElementById('comp-prize').value = ''; document.getElementById('comp-duration').value = ''; alert('✅ تمت الإضافة!'); } } }
async function deleteComp(id) { if (confirm('حذف؟')) { const s = await sendAction('delete_competition', { id }); if (s) alert('✅ تم الحذف!'); } }
async function setWinner(id) { let w = prompt('اسم الفائز:'); if (w) { const s = await sendAction('set_winner', { id, winner: w }); if (s) alert('✅ تم تسجيل الفائز!'); } }

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
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('تم تحديث لوحة التحكم! اضغط موافق لإعادة التحميل وتطبيق النسخة الجديدة.')) {
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
    if(confirm(`هل أنت متأكد من ${is_active ? 'تفعيل' : 'إيقاف'} هذا الصنف؟`)) {
        const s = await sendAction('toggle_item', { id, is_active });
        if (s) alert(`✅ تم ${is_active ? 'تفعيل' : 'إيقاف'} الصنف!`);
    }
}
