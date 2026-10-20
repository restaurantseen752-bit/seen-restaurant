// استخدام بيانات الدخول المحفوظة أو الافتراضية
let currentUser = localStorage.getItem('adminUser') || 'admin';
let currentPass = localStorage.getItem('adminPass') || '123456';
let apiPass = "123456"; // الباسورد الخاص بالـ API (لأسباب أمنية في هذه النسخة)

function login() {
    const userInput = document.getElementById('login-user').value;
    const passInput = document.getElementById('login-pass').value;
    if (userInput === currentUser && passInput === currentPass) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        fetchData(); 
    } else { document.getElementById('login-error').style.display = 'block'; }
}

function logout() { location.reload(); }

async function fetchData() {
    try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        const data = await res.json();
        
        document.getElementById('dash-items').innerText = data.items.length;

        // 1. الأقسام
        const catBody = document.getElementById('category-table-body');
        catBody.innerHTML = '';
        if (data.categories) {
            data.categories.forEach(cat => {
                catBody.innerHTML += `
                    <tr>
                        <td>${cat.name}</td>
                        <td style="color: ${cat.is_active ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">
                            ${cat.is_active ? '🟢 متاح' : '🔴 غير متوفر'}
                        </td>
                        <td>
                            <button class="action-btn ${cat.is_active ? 'btn-delete' : 'btn-edit'}" 
                                    onclick="toggleCategory('${cat.name}', ${cat.is_active ? 0 : 1})">
                                ${cat.is_active ? 'إيقاف القسم' : 'تفعيل القسم'}
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        // 2. الأصناف
        const filter = document.getElementById('filter-category').value;
        const items = filter === 'all' ? data.items : data.items.filter(i => i.category === filter);
        const tbody = document.getElementById('menu-table-body');
        tbody.innerHTML = items.length ? '' : '<tr><td colspan="4" style="text-align:center;">لا توجد أصناف.</td></tr>';
        items.forEach(item => {
            tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.price} د.ل</td><td>${item.category}</td>
            <td><button class="action-btn btn-edit" onclick="editMenuItem(${item.id}, '${item.name}', ${item.price})">تعديل</button>
            <button class="action-btn btn-delete" onclick="deleteMenuItem(${item.id})">حذف</button></td></tr>`;
        });

        // 3. الإعدادات والعروض والحالة
        document.getElementById('set-phone').value = data.settings.phone || '';
        document.getElementById('set-address').value = data.settings.address || '';
        document.getElementById('set-whatsapp').value = data.settings.whatsapp || '';
        document.getElementById('offer-text').value = data.settings.offer || '';
        document.getElementById('current-offer-display').innerHTML = data.settings.offer ? `<strong>✅ العرض الحالي:</strong><br>${data.settings.offer}` : 'لا يوجد عرض.';

        const isClosed = data.settings.status === 'closed';
        document.getElementById('dashboard-status-text').innerText = isClosed ? 'مغلق' : 'مفتوح';
        document.getElementById('dashboard-status-text').style.color = isClosed ? 'var(--danger)' : 'var(--success)';
        document.getElementById('status-indicator').innerText = isClosed ? '🔴 مغلق' : '🟢 مفتوح';
        document.getElementById('status-indicator').style.color = isClosed ? 'var(--danger)' : 'var(--success)';
        document.getElementById('announcementInput').value = data.settings.announcement || '';
        document.getElementById('btn-close-rest').style.display = isClosed ? 'none' : 'block';
        document.getElementById('btn-open-rest').style.display = isClosed ? 'block' : 'none';

        // 4. المسابقات
        const compBody = document.getElementById('comp-table-body');
        compBody.innerHTML = data.competitions.length ? '' : '<tr><td colspan="5" style="text-align:center;">لا توجد مسابقات.</td></tr>';
        data.competitions.forEach(c => {
            compBody.innerHTML += `<tr><td>${c.title}</td><td>${c.prize}</td><td>${c.duration}</td><td>${c.winner || '-'}</td>
            <td><button class="action-btn btn-edit" onclick="setWinner(${c.id})">فائز</button>
            <button class="action-btn btn-delete" onclick="deleteComp(${c.id})">حذف</button></td></tr>`;
        });

    } catch (e) { console.error(e); }
}

async function sendAction(action, payload) {
    try {
        // نرسل الباسورد الثابت للـ API لكي يسمح بالكتابة
        const res = await fetch('/api/data', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...payload, action, password: apiPass }) 
        });
        const data = await res.json();
        if (res.ok) { await fetchData(); return true; } 
        else { alert('خطأ: ' + data.error); return false; }
    } catch (e) { alert('حدث خطأ في الاتصال'); return false; }
}

// --- الأقسام والأصناف ---
async function toggleCategory(name, is_active) {
    if(confirm(`هل أنت متأكد من ${is_active ? 'تفعيل' : 'إيقاف'} قسم "${name}"؟`)) {
        const success = await sendAction('toggle_category', { name, is_active });
        if (success) alert('✅ تم تحديث حالة القسم بنجاح!');
    }
}

async function addMenuItem() {
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
    const category = document.getElementById('item-category').value;
    if (!name || !price) { alert('الرجاء إدخال الاسم والسعر'); return; }
    
    const success = await sendAction('add_item', { name, price, category });
    if (success) {
        document.getElementById('item-name').value = '';
        document.getElementById('item-price').value = '';
        document.getElementById('filter-category').value = 'all';
        alert('✅ تمت إضافة الصنف بنجاح!');
    }
}

async function deleteMenuItem(id) { if (confirm('حذف الصنف؟')) { const s = await sendAction('delete_item', { id }); if (s) alert('✅ تم حذف الصنف بنجاح!'); } }
async function editMenuItem(id, name, price) { let p = prompt(`السعر الجديد لـ ${name}:`, price); if (p) { const s = await sendAction('update_item', { id, price: p }); if (s) alert('✅ تم تعديل السعر بنجاح!'); } }

// --- العروض ---
async function saveOffer() { const s = await sendAction('update_setting', { key: 'offer', value: document.getElementById('offer-text').value }); if (s) alert('✅ تم حفظ العرض بنجاح!'); }
async function clearOffer() { if(confirm('هل تريد إلغاء العرض ومسحه؟')) { const s = await sendAction('update_setting', { key: 'offer', value: '' }); if (s) alert('✅ تم إلغاء العرض!'); } }

// --- حالة المطعم ---
async function closeRestaurant() { const text = document.getElementById('announcementInput').value; if (!text) { alert('اكتب سبب الإغلاق'); return; } await sendAction('update_setting', { key: 'status', value: 'closed' }); const s = await sendAction('update_setting', { key: 'announcement', value: text }); if (s) alert('✅ تم الإغلاق بنجاح!'); }
async function openRestaurant() { if(confirm('فتح المطعم؟')) { await sendAction('update_setting', { key: 'status', value: 'open' }); const s = await sendAction('update_setting', { key: 'announcement', value: '' }); if (s) alert('✅ تم الفتح بنجاح!'); } }

// --- الإعدادات وبيانات الدخول ---
async function saveContactInfo() { 
    await sendAction('update_setting', { key: 'phone', value: document.getElementById('set-phone').value }); 
    await sendAction('update_setting', { key: 'address', value: document.getElementById('set-address').value }); 
    const s = await sendAction('update_setting', { key: 'whatsapp', value: document.getElementById('set-whatsapp').value }); 
    if (s) alert('✅ تم حفظ معلومات التواصل!'); 
}

function saveCredentials() {
    const newUser = document.getElementById('new-username').value;
    const newPass = document.getElementById('new-password').value;
    if(newUser && newPass) {
        localStorage.setItem('adminUser', newUser);
        localStorage.setItem('adminPass', newPass);
        currentUser = newUser; currentPass = newPass;
        alert('✅ تم تحديث بيانات الدخول للوحة التحكم!');
        document.getElementById('new-username').value = '';
        document.getElementById('new-password').value = '';
    } else { alert('الرجاء كتابة اسم المستخدم وكلمة المرور.'); }
}

// --- المسابقات ---
async function addCompetition() { const t = document.getElementById('comp-title').value; const p = document.getElementById('comp-prize').value; const d = document.getElementById('comp-duration').value; if (t && p && d) { const s = await sendAction('add_competition', { title: t, prize: p, duration: d }); if (s) { document.getElementById('comp-title').value = ''; document.getElementById('comp-prize').value = ''; document.getElementById('comp-duration').value = ''; alert('✅ تمت إضافة المسابقة!'); } } else { alert('املأ الحقول'); } }
async function deleteComp(id) { if (confirm('حذف؟')) { const s = await sendAction('delete_competition', { id }); if (s) alert('✅ تم الحذف!'); } }
async function setWinner(id) { let w = prompt('اسم الفائز:'); if (w) { const s = await sendAction('set_winner', { id, winner: w }); if (s) alert('✅ تم تسجيل الفائز!'); } }

// --- التنقل ---
function showSection(id, el) { document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active')); el.classList.add('active'); if (window.innerWidth <= 768) closeMenu(); }
function openMenu() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('active'); }
function closeMenu() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); }
