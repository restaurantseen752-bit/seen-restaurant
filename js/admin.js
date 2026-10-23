let currentUser = localStorage.getItem('adminUser') || 'admin';
let currentPass = localStorage.getItem('adminPass') || '123456';
let apiPass = "123456"; 
let currentEditItem = null;

function login() {
    if (document.getElementById('login-user').value === currentUser && document.getElementById('login-pass').value === currentPass) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        fetchData(); 
    } else { document.getElementById('login-error').style.display = 'block'; }
}

function logout() { location.reload(); }

async function fetchData() {
    try {
        const res = await fetch('/api/data?auth=' + apiPass, { cache: 'no-store' });
        const data = await res.json();
        if(!data) return;
        
        const items = data.items || [];
        const categories = data.categories || [];
        const settings = data.settings || {};
        const competitions = data.competitions || [];
        const offers = data.offers || [];
        const deliveryAreas = data.delivery_areas || [];

        document.getElementById('dash-orders').innerText = data.todayOrdersCount || 0;
        document.getElementById('dash-items').innerText = items.length;

        const catBody = document.getElementById('category-table-body');
        catBody.innerHTML = categories.map(cat => `
            <tr><td>${cat.name}</td><td style="color: ${cat.is_active ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${cat.is_active ? '🟢 متاح' : '🔴 غير متوفر'}</td>
            <td><button class="action-btn ${cat.is_active ? 'btn-delete' : 'btn-edit'}" onclick="toggleCategory('${cat.name}', ${cat.is_active ? 0 : 1})">${cat.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>
        `).join('');

        const filter = document.getElementById('filter-category').value;
        const filteredItems = filter === 'all' ? items : items.filter(i => i.category === filter);
        const tbody = document.getElementById('menu-table-body');
        tbody.innerHTML = filteredItems.length ? '' : '<tr><td colspan="4" style="text-align:center;">لا توجد أصناف.</td></tr>';
        filteredItems.forEach(item => {
            const itemData = encodeURIComponent(JSON.stringify(item));
            tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.price} د.ل</td><td>${item.category}</td>
            <td><button class="action-btn btn-edit" onclick="openEditModal('${itemData}')">تعديل</button><button class="action-btn btn-delete" onclick="deleteMenuItem(${item.id})">حذف</button></td></tr>`;
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

    } catch (e) { console.error(e); }
}

async function sendAction(action, payload) {
    try {
        const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, action, password: apiPass }) });
        const data = await res.json();
        if (res.ok) { await fetchData(); return true; } 
        else { alert('خطأ: ' + data.error); return false; }
    } catch (e) { alert('حدث خطأ في الاتصال'); return false; }
}

async function toggleCategory(name, is_active) { if(confirm(`تغيير حالة القسم ${name}؟`)) { const s = await sendAction('toggle_category', { name, is_active }); if (s) alert(`✅ تم التحديث!`); } }

async function addMenuItem() { 
    const n = document.getElementById('item-name').value, p = document.getElementById('item-price').value, c = document.getElementById('item-category').value, d = document.getElementById('item-desc').value;
    const fileInput = document.getElementById('item-img-file');
    let imgUrl = '';
    if (!n || !p) { alert('الرجاء إدخال الاسم والسعر'); return; }
    const btn = event.target; btn.innerText = 'جاري الرفع...'; btn.disabled = true;

    if (fileInput.files.length > 0) {
        const formData = new FormData(); formData.append('image', fileInput.files[0]); formData.append('password', apiPass);
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
        const formData = new FormData(); formData.append('image', fileInput.files[0]); formData.append('password', apiPass);
        try {
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.success) imgUrl = uploadData.url;
        } catch (e) { alert('خطأ في رفع الصورة'); btn.innerText = 'حفظ التعديلات'; btn.disabled = false; return; }
    }
    const s = await sendAction('update_full_item', { id, name, price, category, description: desc, image_url: imgUrl });
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
        const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_all_settings', password: apiPass, phone: document.getElementById('set-phone').value, address: document.getElementById('set-address').value, telegramToken: document.getElementById('set-telegram-token').value, telegramChatId: document.getElementById('set-telegram-chatid').value, prepayment_info: document.getElementById('set-prepayment').value }) });
        if (res.ok) alert('✅ تم حفظ الإعدادات بنجاح!'); else alert('حدث خطأ أثناء الحفظ.');
    } catch(e) { alert('حدث خطأ في الاتصال.'); } finally { btn.innerText = 'حفظ الإعدادات'; btn.disabled = false; }
}
function saveCredentials() { const u = document.getElementById('new-username').value, p = document.getElementById('new-password').value; if (u && p) { localStorage.setItem('adminUser', u); localStorage.setItem('adminPass', p); currentUser = u; currentPass = p; alert('✅ تم تحديث بيانات الدخول!'); document.getElementById('new-username').value = ''; document.getElementById('new-password').value = ''; } }
async function addCompetition() { const t = document.getElementById('comp-title').value, p = document.getElementById('comp-prize').value, d = document.getElementById('comp-duration').value; if (t && p && d) { const s = await sendAction('add_competition', { title: t, prize: p, duration: d }); if (s) { document.getElementById('comp-title').value = ''; document.getElementById('comp-prize').value = ''; document.getElementById('comp-duration').value = ''; alert('✅ تمت الإضافة!'); } } }
async function deleteComp(id) { if (confirm('حذف؟')) { const s = await sendAction('delete_competition', { id }); if (s) alert('✅ تم الحذف!'); } }
async function setWinner(id) { let w = prompt('اسم الفائز:'); if (w) { const s = await sendAction('set_winner', { id, winner: w }); if (s) alert('✅ تم تسجيل الفائز!'); } }

function showSection(id, el) { document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active')); el.classList.add('active'); if (window.innerWidth <= 768) closeMenu(); }
function openMenu() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('active'); }
function closeMenu() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); }
