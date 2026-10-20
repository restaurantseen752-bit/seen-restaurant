let adminPass = "123456"; 
let allComps = [];

function login() {
    if (document.getElementById('login-user').value === 'admin' && document.getElementById('login-pass').value === '123456') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        fetchData(); 
    } else { document.getElementById('login-error').style.display = 'block'; }
}

function logout() { location.reload(); }

async function fetchData() {
    try {
        const res = await fetch('/api/data');
        const data = await res.json();
        
        const filter = document.getElementById('filter-category').value;
        const items = filter === 'all' ? data.items : data.items.filter(i => i.category === filter);
        const tbody = document.getElementById('menu-table-body');
        tbody.innerHTML = items.length ? '' : '<tr><td colspan="4" style="text-align:center;">لا توجد أصناف.</td></tr>';
        items.forEach(item => {
            tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.price} د.ل</td><td>${item.category}</td>
            <td><button class="action-btn btn-edit" onclick="editMenuItem(${item.id}, '${item.name}', ${item.price})">تعديل</button>
            <button class="action-btn btn-delete" onclick="deleteMenuItem(${item.id})">حذف</button></td></tr>`;
        });
        document.getElementById('dash-items').innerText = data.items.length;

        document.getElementById('set-phone').value = data.settings.phone || '';
        document.getElementById('set-address').value = data.settings.address || '';
        document.getElementById('set-whatsapp').value = data.settings.whatsapp || '';
        document.getElementById('offer-text').value = data.settings.offer || '';
        document.getElementById('current-offer-display').innerHTML = data.settings.offer ? `<strong>✅ العرض:</strong><br>${data.settings.offer}` : 'لا يوجد عرض.';

        const isClosed = data.settings.status === 'closed';
        document.getElementById('dashboard-status-text').innerText = isClosed ? 'مغلق' : 'مفتوح';
        document.getElementById('dashboard-status-text').style.color = isClosed ? 'var(--danger)' : 'var(--success)';
        document.getElementById('status-indicator').innerText = isClosed ? '🔴 مغلق' : '🟢 مفتوح';
        document.getElementById('status-indicator').style.color = isClosed ? 'var(--danger)' : 'var(--success)';
        document.getElementById('announcementInput').value = data.settings.announcement || '';
        document.getElementById('btn-close-rest').style.display = isClosed ? 'none' : 'block';
        document.getElementById('btn-open-rest').style.display = isClosed ? 'block' : 'none';

        allComps = data.competitions;
        const compBody = document.getElementById('comp-table-body');
        compBody.innerHTML = allComps.length ? '' : '<tr><td colspan="5" style="text-align:center;">لا توجد مسابقات.</td></tr>';
        allComps.forEach(c => {
            compBody.innerHTML += `<tr><td>${c.title}</td><td>${c.prize}</td><td>${c.duration}</td><td>${c.winner || '-'}</td>
            <td><button class="action-btn btn-edit" onclick="setWinner(${c.id})">فائز</button>
            <button class="action-btn btn-delete" onclick="deleteComp(${c.id})">حذف</button></td></tr>`;
        });

    } catch (e) { console.error(e); }
}

async function sendAction(action, payload) {
    const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, action, password: adminPass }) });
    if (res.ok) { fetchData(); return true; }
    return false;
}

function addMenuItem() {
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
    const category = document.getElementById('item-category').value;
    if (name && price) sendAction('add_item', { name, price, category });
}
function deleteMenuItem(id) { if (confirm('حذف؟')) sendAction('delete_item', { id }); }
function editMenuItem(id, name, price) { let p = prompt(`السعر الجديد لـ ${name}:`, price); if (p) sendAction('update_item', { id, price: p }); }

function saveOffer() { sendAction('update_setting', { key: 'offer', value: document.getElementById('offer-text').value }); }
function clearOffer() { sendAction('update_setting', { key: 'offer', value: '' }); }

function closeRestaurant() { sendAction('update_setting', { key: 'status', value: 'closed' }); sendAction('update_setting', { key: 'announcement', value: document.getElementById('announcementInput').value }); }
function openRestaurant() { sendAction('update_setting', { key: 'status', value: 'open' }); sendAction('update_setting', { key: 'announcement', value: '' }); }

function saveContactInfo() { 
    sendAction('update_setting', { key: 'phone', value: document.getElementById('set-phone').value });
    sendAction('update_setting', { key: 'address', value: document.getElementById('set-address').value });
    sendAction('update_setting', { key: 'whatsapp', value: document.getElementById('set-whatsapp').value });
}

function addCompetition() {
    const title = document.getElementById('comp-title').value;
    const prize = document.getElementById('comp-prize').value;
    const duration = document.getElementById('comp-duration').value;
    if (title && prize && duration) sendAction('add_competition', { title, prize, duration });
}
function deleteComp(id) { if (confirm('حذف المسابقة؟')) sendAction('delete_competition', { id }); }
function setWinner(id) { let w = prompt('اسم الفائز:'); if (w) sendAction('set_winner', { id, winner: w }); }

function showSection(id, el) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
    if (window.innerWidth <= 768) closeMenu();
}
function openMenu() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('active'); }
function closeMenu() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); }
