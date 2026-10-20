let currentUser = localStorage.getItem('adminUser') || 'admin';
let currentPass = localStorage.getItem('adminPass') || '123456';
let apiPass = "123456"; 

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
        const res = await fetch('/api/data', { cache: 'no-store' });
        const data = await res.json();
        
        if(!data) return;
        const items = data.items || [];
        const categories = data.categories || [];
        const settings = data.settings || {};
        const competitions = data.competitions || [];
        const offers = data.offers || [];

        document.getElementById('dash-items').innerText = items.length;

        const catBody = document.getElementById('category-table-body');
        catBody.innerHTML = '';
        if (categories.length > 0) {
            categories.forEach(cat => {
                catBody.innerHTML += `
                    <tr><td>${cat.name}</td><td style="color: ${cat.is_active ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${cat.is_active ? '🟢 متاح' : '🔴 غير متوفر'}</td>
                    <td><button class="action-btn ${cat.is_active ? 'btn-delete' : 'btn-edit'}" onclick="toggleCategory('${cat.name}', ${cat.is_active ? 0 : 1})">${cat.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>
                `;
            });
        }

        const filter = document.getElementById('filter-category').value;
        const filteredItems = filter === 'all' ? items : items.filter(i => i.category === filter);
        const tbody = document.getElementById('menu-table-body');
        tbody.innerHTML = filteredItems.length ? '' : '<tr><td colspan="4" style="text-align:center;">لا توجد أصناف.</td></tr>';
        filteredItems.forEach(item => {
            tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.price} د.ل</td><td>${item.category}</td>
            <td><button class="action-btn btn-edit" onclick="editMenuItem(${item.id}, '${item.name}', ${item.price})">تعديل</button><button class="action-btn btn-delete" onclick="deleteMenuItem(${item.id})">حذف</button></td></tr>`;
        });

        const offersBody = document.getElementById('offers-table-body');
        offersBody.innerHTML = offers.length ? '' : '<tr><td colspan="2" style="text-align:center;">لا توجد عروض.</td></tr>';
        offers.forEach(o => {
            offersBody.innerHTML += `<tr><td>${o.text}</td><td><button class="action-btn btn-delete" onclick="deleteOffer(${o.id})">حذف</button></td></tr>`;
        });

        // تعبئة بيانات الإعدادات
        document.getElementById('set-phone').value = settings.phone || '';
        document.getElementById('set-address').value = settings.address || '';
        document.getElementById('set-telegram-token').value = settings.telegramToken || '';
        document.getElementById('set-telegram-chatid').value = settings.telegramChatId || '';

        const isClosed = settings.status === 'closed';
        document.getElementById('dashboard-status-text').innerText = isClosed ? 'مغلق' : 'مفتوح';
        document.getElementById('dashboard-status-text').style.color = isClosed ? 'var(--danger)' : 'var(--success)';
        document.getElementById('status-indicator').innerText = isClosed ? '🔴 مغلق' : '🟢 مفتوح';
        document.getElementById('status-indicator').style.color = isClosed ? 'var(--danger)' : 'var(--success)';
        document.getElementById('announcementInput').value = settings.announcement || '';
        document.getElementById('btn-close-rest').style.display = isClosed ? 'none' : 'block';
        document.getElementById('btn-open-rest').style.display = isClosed ? 'block' : 'none';

        const compBody = document.getElementById('comp-table-body');
        compBody.innerHTML = competitions.length ? '' : '<tr><td colspan="5" style="text-align:center;">لا توجد مسابقات.</td></tr>';
        competitions.forEach(c => {
            const isFinished = c.status === 'finished';
            compBody.innerHTML += `
                <tr style="background-color: ${isFinished ? 'rgba(46, 204, 113, 0.1)' : 'transparent'};">
                    <td>${c.title} ${isFinished ? '(منتهية)' : ''}</td><td>${c.prize}</td><td>${c.duration}</td><td>${c.winner || 'لم يحدد'}</td>
                    <td>${!isFinished ? `<button class="action-btn btn-edit" onclick="setWinner(${c.id})">🏆</button>` : ''}<button class="action-btn btn-delete" onclick="deleteComp(${c.id})">🗑️</button></td>
                </tr>
            `;
        });

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
async function addMenuItem() { const n = document.getElementById('item-name').value; const p = document.getElementById('item-price').value; const c = document.getElementById('item-category').value; if (n && p) { const s = await sendAction('add_item', { name: n, price: p, category: c }); if (s) { document.getElementById('item-name').value = ''; document.getElementById('item-price').value = ''; alert('✅ تمت الإضافة!'); } } }
async function deleteMenuItem(id) { if (confirm('حذف الصنف؟')) { const s = await sendAction('delete_item', { id }); if (s) alert('✅ تم الحذف!'); } }
async function editMenuItem(id, name, price) { let p = prompt(`السعر الجديد لـ ${name}:`, price); if (p) { const s = await sendAction('update_item', { id, price: p }); if (s) alert('✅ تم التعديل!'); } }
async function addOffer() { const t = document.getElementById('offer-text').value; if (!t) { alert('اكتب نص العرض'); return; } const s = await sendAction('add_offer', { text: t }); if (s) { document.getElementById('offer-text').value = ''; alert('✅ تمت الإضافة!'); } }
async function deleteOffer(id) { if(confirm('حذف العرض؟')) { const s = await sendAction('delete_offer', { id }); if (s) alert('✅ تم الحذف!'); } }
async function closeRestaurant() { const t = document.getElementById('announcementInput').value; if (!t) { alert('اكتب سبب الإغلاق'); return; } await sendAction('update_setting', { key: 'status', value: 'closed' }); const s = await sendAction('update_setting', { key: 'announcement', value: t }); if (s) alert('✅ تم الإغلاق!'); }
async function openRestaurant() { if(confirm('فتح المطعم؟')) { await sendAction('update_setting', { key: 'status', value: 'open' }); const s = await sendAction('update_setting', { key: 'announcement', value: '' }); if (s) alert('✅ تم الفتح!'); } }
async function saveContactInfo() { 
    await sendAction('update_setting', { key: 'phone', value: document.getElementById('set-phone').value }); 
    await sendAction('update_setting', { key: 'address', value: document.getElementById('set-address').value }); 
    await sendAction('update_setting', { key: 'telegramToken', value: document.getElementById('set-telegram-token').value }); 
    const s = await sendAction('update_setting', { key: 'telegramChatId', value: document.getElementById('set-telegram-chatid').value }); 
    if (s) alert('✅ تم حفظ بيانات التواصل والإشعارات!'); 
}
function saveCredentials() { const u = document.getElementById('new-username').value; const p = document.getElementById('new-password').value; if(u && p) { localStorage.setItem('adminUser', u); localStorage.setItem('adminPass', p); currentUser = u; currentPass = p; alert('✅ تم تحديث بيانات الدخول!'); document.getElementById('new-username').value = ''; document.getElementById('new-password').value = ''; } else { alert('الرجاء كتابة البيانات.'); } }
async function addCompetition() { const t = document.getElementById('comp-title').value; const p = document.getElementById('comp-prize').value; const d = document.getElementById('comp-duration').value; if (t && p && d) { const s = await sendAction('add_competition', { title: t, prize: p, duration: d }); if (s) { document.getElementById('comp-title').value = ''; document.getElementById('comp-prize').value = ''; document.getElementById('comp-duration').value = ''; alert('✅ تمت الإضافة!'); } } else { alert('املأ الحقول'); } }
async function deleteComp(id) { if (confirm('حذف؟')) { const s = await sendAction('delete_competition', { id }); if (s) alert('✅ تم الحذف!'); } }
async function setWinner(id) { let w = prompt('اسم الفائز:'); if (w) { const s = await sendAction('set_winner', { id, winner: w }); if (s) alert('✅ تم تسجيل الفائز!'); } }

function showSection(id, el) { document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active')); el.classList.add('active'); if (window.innerWidth <= 768) closeMenu(); }
function openMenu() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('active'); }
function closeMenu() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); }
