// ===== Trang "Đôi lời mún nói": khung chat lưu trên Firebase Firestore =====
const $ = id => document.getElementById(id);
const NAME_KEY = 'binzin-chat-name', LOCAL_KEY = 'binzin-chat-messages';
const list = $('chat-list'), empty = $('chat-empty'), form = $('chat-form'), statusEl = $('chat-status');
const titleInput = $('chat-title'), contentInput = $('chat-content');
const nameRadios = [...document.querySelectorAll('input[name="chat-name"]')];
const selectedName = () => nameRadios.find(r => r.checked)?.value || '';

// ---------- Menu điện thoại: xem nav.js ----------

// ---------- Hiển thị ----------
// Nhớ người gửi đã chọn trên máy này; đổi lựa chọn thì đảo phía khung chat ngay
const savedName = localStorage.getItem(NAME_KEY);
nameRadios.forEach(r => {
    r.checked = r.value === savedName;
    r.addEventListener('change', () => { localStorage.setItem(NAME_KEY, r.value); render(lastMessages) });
});
let lastMessages = [];
const myName = () => (localStorage.getItem(NAME_KEY) || '').trim().toLocaleLowerCase('vi-VN');
const fmtTime = d => d ? d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Đang gửi…';

function render(messages) {
    lastMessages = messages;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    list.replaceChildren();
    messages.forEach(m => {
        const mine = m.name.trim().toLocaleLowerCase('vi-VN') === myName();
        const li = document.createElement('li');
        li.className = 'chat-row' + (mine ? ' mine' : '');
        const bubble = document.createElement('article');
        bubble.className = 'chat-bubble';
        const meta = document.createElement('p');
        meta.className = 'chat-meta';
        const who = document.createElement('strong'); who.textContent = m.name;
        const time = document.createElement('time'); time.textContent = fmtTime(m.createdAt);
        if (m.createdAt) time.dateTime = m.createdAt.toISOString();
        meta.append(who, ' · ', time);
        const title = document.createElement('h3'); title.className = 'chat-title'; title.textContent = m.title;
        const body = document.createElement('p'); body.className = 'chat-content'; body.textContent = m.content;
        bubble.append(meta, title, body); li.append(bubble); list.append(li);
    });
    empty.hidden = messages.length > 0;
    if (nearBottom || render.first !== false) { list.scrollTop = list.scrollHeight; render.first = false }
}

// ---------- Lưu trữ ----------
const cfg = window.FIREBASE_CONFIG || {};
const firebaseReady = window.firebase && cfg.apiKey && !String(cfg.apiKey).startsWith('YOUR_');
let sendMessage;

if (firebaseReady) {
    firebase.initializeApp(cfg);
    const col = firebase.firestore().collection('messages');
    statusEl.textContent = 'Đang tải lời nhắn…';
    col.orderBy('createdAt', 'asc').limit(500).onSnapshot(snap => {
        statusEl.textContent = '';
        render(snap.docs.map(doc => {
            const d = doc.data({ serverTimestamps: 'estimate' });
            return { name: d.name || '', title: d.title || '', content: d.content || '', createdAt: d.createdAt ? d.createdAt.toDate() : null };
        }));
    }, err => { console.error(err); statusEl.textContent = 'Không tải được lời nhắn (kiểm tra cấu hình/luật Firestore).' });
    sendMessage = m => col.add({ ...m, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
} else {
    // Chưa cấu hình Firebase: tạm lưu trên trình duyệt này
    statusEl.textContent = 'Chưa cấu hình Firebase — lời nhắn đang tạm lưu trên máy này (xem firebase-config.js).';
    const load = () => JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]').map(m => ({ ...m, createdAt: new Date(m.createdAt) }));
    render(load());
    sendMessage = async m => {
        const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        all.push({ ...m, createdAt: new Date().toISOString() });
        localStorage.setItem(LOCAL_KEY, JSON.stringify(all)); render(load());
    };
}

// ---------- Gửi ----------
form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = selectedName(), title = titleInput.value.trim(), content = contentInput.value.trim();
    if (!name) { statusEl.textContent = 'Chọn Bin hoặc Zin trước nha 💕'; return }
    if (!title || !content) return;
    localStorage.setItem(NAME_KEY, name);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
        await sendMessage({ name, title, content });
        titleInput.value = ''; contentInput.value = '';
        list.scrollTop = list.scrollHeight;
    } catch (err) {
        console.error(err); statusEl.textContent = 'Gửi chưa được, thử lại nha 🥲';
    } finally { button.disabled = false }
});

