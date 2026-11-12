const $ = id => document.getElementById(id);
let visitedGame = false, activeGame = 'who';
function newSecret(type, previous) { const characters = ['Doraemon', 'Nobita', 'Elsa', 'Spider-Man', 'Pikachu', 'Harry Potter', 'Sơn Tùng M-TP', 'Taylor Swift', 'Mickey Mouse', 'Luffy', 'Shin - Cậu bé bút chì', 'Minions']; let value; do { value = type === 'who' ? characters[Math.floor(Math.random() * characters.length)] : type === 'age' ? String(10 + Math.floor(Math.random() * 71)) : String(Math.floor(Math.random() * 10000)).padStart(4, '0') } while (value === previous); return value }
const rounds = {};
function newRound(type) { const old = rounds[type]?.secrets || []; const first = newSecret(type, old[0]); let second = newSecret(type, old[1]); while (second === first) second = newSecret(type, second); rounds[type] = { secrets: [first, second], phase: 0, attempts: [[], []], solved: [false, false] }; drawRound(type) }
function drawRound(type) {
    const s = rounds[type], host = $(type + '-play'); host.replaceChildren();
    if (s.phase < 4) {
        const player = s.phase < 2 ? 'Bin' : 'Zin', label = type === 'who' ? 'Nhân vật' : type === 'age' ? 'Độ tuổi' : 'Mã khóa';
        const box = document.createElement('div'); box.className = 'rounded-3xl bg-[#fff1f4] p-6';
        const title = document.createElement('p'); title.className = 'font-bold'; title.textContent = `${label} của ${player}`; box.append(title);
        const content = document.createElement('p'); content.className = s.phase % 2 ? 'font-["Fraunces"] text-4xl my-5 break-words' : 'mt-2'; content.textContent = s.phase % 2 ? s.secrets[s.phase < 2 ? 0 : 1] : `Chỉ ${player} nhìn màn hình lúc mở bí mật nha.`; box.append(content);
        const button = document.createElement('button'); button.type = 'button'; button.className = 'primary mt-5'; button.textContent = s.phase % 2 ? 'Che lại & chuyền máy' : `Mở bí mật của ${player}`; button.onclick = () => { s.phase++; drawRound(type) }; box.append(button); host.append(box); return
    }
    ['Bin', 'Zin'].forEach((name, i) => {
        const box = document.createElement('div'); box.className = 'rounded-3xl bg-[#fff1f4] p-5';
        const title = document.createElement('h3'); title.textContent = `${name} đoán ${type === 'who' ? 'nhân vật' : type === 'age' ? 'độ tuổi' : 'mã khóa'} của ${i === 0 ? 'Zin' : 'Bin'}`; box.append(title);
        const form = document.createElement('form'); form.className = 'mt-4 flex flex-wrap gap-2';
        const label = document.createElement('label'); label.className = 'sr-only'; label.htmlFor = `type-guess-{i}`; label.textContent = `Đáp án của ${name}`;
        const input = document.createElement('input'); input.id = label.htmlFor; input.className = 'field flex-1 min-w-32'; input.required = true; input.autocomplete = 'off';
        if (type === 'code') { input.inputMode = 'numeric'; input.pattern = '[0-9]{4}'; input.maxLength = 4 } else if (type === 'age') { input.type = 'number'; input.min = 10; input.max = 80 } else input.maxLength = 80;
        const button = document.createElement('button'); button.type = 'submit'; button.className = 'primary'; button.textContent = 'Đoán';
        form.append(label, input, button); const result = document.createElement('p'); result.className = 'mt-3 font-bold'; result.setAttribute('role', 'status'); const history = document.createElement('ol'); history.className = 'mt-2 text-[#876777] space-y-1';
        s.attempts[i].forEach(entry => { const li = document.createElement('li'); li.textContent = entry; history.append(li) });
        if (s.solved[i]) { input.disabled = true; button.disabled = true; result.textContent = type === 'code' ? 'Mã khóa đã được phá! 🎉' : 'Chúc mừng, đúng rồi! 🎉' }
        form.addEventListener('submit', e => {
            e.preventDefault(); const guess = input.value.trim(), secret = s.secrets[1 - i]; if (!guess || s.solved[i]) return;
            const correct = type === 'who' ? guess.toLocaleLowerCase('vi-VN') === secret.toLocaleLowerCase('vi-VN') : guess === secret;
            let feedback = correct ? (type === 'code' ? 'Mã khóa đã được phá! 🎉' : 'Chúc mừng, đúng rồi! 🎉') : 'Lêu lêu, thử lại nha 😛';
            if (type === 'code' && !correct) { const pool = [...secret], exact = [...guess].filter((digit, index) => digit === secret[index]).length; let total = 0; for (const digit of guess) { const index = pool.indexOf(digit); if (index !== -1) { pool.splice(index, 1); total++ } } feedback += ` ${total} số đúng, ${exact} vị trí đúng.` }
            result.textContent = feedback; const entry = `${guess} — ${feedback}`; s.attempts[i].push(entry); const li = document.createElement('li'); li.textContent = entry; history.append(li); input.value = ''; if (correct) { s.solved[i] = true; input.disabled = true; button.disabled = true }
        });
        box.append(form, result, history); host.append(box)
    })
}
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.go; document.querySelectorAll('.pane').forEach(p => p.hidden = p.id !== name);
    document.querySelectorAll('nav [data-go]').forEach(b => { b.classList.toggle('active', b.dataset.go === name); if (b.dataset.go === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current') });
    if (name === 'games' && !visitedGame) { visitedGame = true; newRound(activeGame) } window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenu(false)
}));
// Menu điều hướng trên điện thoại
const menuToggle = document.getElementById('menu-toggle'), mainNav = document.getElementById('main-nav');
function setMenu(open) { if (!menuToggle || !mainNav) return; mainNav.classList.toggle('open', open); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu') }
menuToggle?.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false) });
document.addEventListener('click', e => { if (mainNav?.classList.contains('open') && !mainNav.contains(e.target) && !menuToggle.contains(e.target)) setMenu(false) });
window.matchMedia('(min-width:768px)').addEventListener('change', e => { if (e.matches) setMenu(false) });
// Mở đúng mục khi đến từ trang khác (vd: letter.html -> index.html#calendar)
window.addEventListener('load', () => { const target = location.hash.slice(1); if (target && document.getElementById(target)?.classList.contains('pane')) document.querySelector(`nav [data-go="${target}"]`)?.click() });
let shownYear = new Date().getFullYear(), shownMonth = new Date().getMonth();
function startDate() { if (!$('start-date').value) return null; const [y, m, d] = $('start-date').value.split('-').map(Number), date = new Date(y, m - 1, d); return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null }
function renderCalendar() { const now = new Date(); $('month-title').textContent = `Tháng ${shownMonth + 1} / ${shownYear}`; $('calendar-days').replaceChildren(); const offset = new Date(shownYear, shownMonth, 1).getDay(), count = new Date(shownYear, shownMonth + 1, 0).getDate(), start = startDate(); for (let i = 0; i < Math.ceil((offset + count) / 7) * 7; i++) { const date = new Date(shownYear, shownMonth, i - offset + 1), cell = document.createElement('span'); cell.className = 'day' + (date.getMonth() !== shownMonth ? ' text-[#c5adb5]' : ''); if (date.toDateString() === now.toDateString()) cell.classList.add('today'); if (start && date.toDateString() === start.toDateString()) cell.classList.add('start'); cell.textContent = date.getDate(); $('calendar-days').append(cell) } }
$('start-date').addEventListener('change', () => { const date = startDate(), now = new Date(), todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()); if (!date) { $('days-count').textContent = '—'; $('date-status').textContent = ''; renderCalendar(); return } const startUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()); if (startUTC > todayUTC) { $('days-count').textContent = '—'; $('date-status').textContent = 'Ngày bắt đầu iu chưa thể ở tương lai nha.' } else { $('days-count').textContent = new Intl.NumberFormat('vi-VN').format(Math.round((todayUTC - startUTC) / 86400000) + 1); $('date-status').textContent = 'Từ ' + date.toLocaleDateString('vi-VN') + ' đến hôm nay 💕'; shownYear = date.getFullYear(); shownMonth = date.getMonth() } renderCalendar() });
$('previous-month').onclick = () => { shownMonth--; if (shownMonth < 0) { shownMonth = 11; shownYear-- } renderCalendar() };
$('next-month').onclick = () => { shownMonth++; if (shownMonth > 11) { shownMonth = 0; shownYear++ } renderCalendar() };
$('today-button').onclick = () => { const now = new Date(); shownYear = now.getFullYear(); shownMonth = now.getMonth(); renderCalendar() }; renderCalendar();
// Ngày bắt đầu yêu cố định (04/07/2026): tự động đếm khi tải trang và cập nhật mỗi phút (qua nửa đêm sẽ tự tăng)
function updateLoveDays() { $('start-date').dispatchEvent(new Event('change')) }
updateLoveDays(); setInterval(() => { const y = shownYear, m = shownMonth; updateLoveDays(); shownYear = y; shownMonth = m; renderCalendar() }, 60000);
document.querySelectorAll('[data-game]').forEach(button => button.addEventListener('click', () => { activeGame = button.dataset.game; document.querySelectorAll('.game-pane').forEach(p => p.hidden = p.id !== 'game-' + activeGame); document.querySelectorAll('[data-game]').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-selected', String(active)) }); if (['who', 'age', 'code'].includes(activeGame)) newRound(activeGame) }));
document.querySelectorAll('[data-restart]').forEach(b => b.addEventListener('click', () => newRound(b.dataset.restart)));
let xo = Array(100).fill(''), xoTurn = 'X', xoWinner = '';
function renderXO() { const board = $('xo-board'); board.replaceChildren(); xo.forEach((value, index) => { const cell = document.createElement('button'); cell.type = 'button'; cell.textContent = value; cell.className = value.toLowerCase(); cell.setAttribute('aria-label', `Hàng ${Math.floor(index / 10) + 1}, cột index%10+1{value?', '+value:''}`); cell.onclick = () => playXO(index); board.append(cell) }); $('xo-status').textContent = xoWinner ? xoWinner === 'draw' ? 'Hòarồi,chơilạinha!' : `{xoWinner==='X'?'Bin':'Zin'} thắng rồi! 🎉` : `Lượt của ${xoTurn === 'X' ? 'Bin (X)' : 'Zin (O)'}` }
function playXO(index) { if (xoWinner || xo[index]) return; xo[index] = xoTurn; const r = Math.floor(index / 10), c = index % 10; for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { let count = 1; for (const sign of [-1, 1]) { let rr = r + dr * sign, cc = c + dc * sign; while (rr >= 0 && rr < 10 && cc >= 0 && cc < 10 && xo[rr * 10 + cc] === xoTurn) { count++; rr += dr * sign; cc += dc * sign } } if (count >= 5) xoWinner = xoTurn } if (!xoWinner && !xo.includes('')) xoWinner = 'draw'; if (!xoWinner) xoTurn = xoTurn === 'X' ? 'O' : 'X'; renderXO() }
$('xo-reset').onclick = () => { xo = Array(100).fill(''); xoTurn = 'X'; xoWinner = ''; renderXO() }; renderXO();
const glyph = { wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙', bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟' };
let chess, turn, selected, finished; const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
function moves(board, from, to, attacks = false) { const [r, c] = from, [rr, cc] = to, p = board[r][c]; if (!p || !inside(rr, cc) || r === rr && c === cc) return false; const target = board[rr][cc], side = p[0], kind = p[1], dr = rr - r, dc = cc - c; if (!attacks && target?.[0] === side) return false; if (!attacks && target?.[1] === 'K') return false; if (kind === 'P') { const dir = side === 'w' ? -1 : 1; if (attacks) return dr === dir && Math.abs(dc) === 1; if (dc !== 0) return dr === dir && Math.abs(dc) === 1 && !!target; return !target && (dr === dir || (dr === 2 * dir && r === (side === 'w' ? 6 : 1) && !board[r + dir][c])) } if (kind === 'N') return Math.abs(dr) * Math.abs(dc) === 2; if (kind === 'K') return Math.max(Math.abs(dr), Math.abs(dc)) === 1; if (kind === 'B' && Math.abs(dr) !== Math.abs(dc)) return false; if (kind === 'R' && dr !== 0 && dc !== 0) return false; if (kind === 'Q' && !(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return false; const sr = Math.sign(dr), sc = Math.sign(dc); for (let step = 1; step < Math.max(Math.abs(dr), Math.abs(dc)); step++)if (board[r + sr * step][c + sc * step]) return false; return true }
function inCheck(board, side) { let king = null; for (let r = 0; r < 8; r++)for (let c = 0; c < 8; c++)if (board[r][c] === side + 'K') king = [r, c]; if (!king) return true; for (let r = 0; r < 8; r++)for (let c = 0; c < 8; c++)if (board[r][c] && board[r][c][0] !== side && moves(board, [r, c], king, true)) return true; return false }
function legal(board, from, to) { if (!moves(board, from, to)) return false; const copy = board.map(row => row.slice()), piece = copy[from[0]][from[1]]; copy[to[0]][to[1]] = piece; copy[from[0]][from[1]] = null; return !inCheck(copy, piece[0]) }
function hasMove(board, side) { for (let r = 0; r < 8; r++)for (let c = 0; c < 8; c++)if (board[r][c]?.[0] === side) for (let rr = 0; rr < 8; rr++)for (let cc = 0; cc < 8; cc++)if (legal(board, [r, c], [rr, cc])) return true; return false }
function renderChess() { const board = $('chess-board'); board.replaceChildren(); for (let r = 0; r < 8; r++)for (let c = 0; c < 8; c++) { const cell = document.createElement('button'); cell.type = 'button'; cell.className = (r + c) % 2 ? 'dark' : 'light'; if (selected && selected[0] === r && selected[1] === c) cell.classList.add('selected'); else if (selected && legal(chess, selected, [r, c])) cell.classList.add('possible'); cell.textContent = glyph[chess[r][c]] || ''; cell.setAttribute('aria-label', `Ô String.fromCharCode(97+c){8-r}${chess[r][c] ? ', quân ' + chess[r][c] : ''}`); cell.onclick = () => playChess(r, c); board.append(cell) } if (!finished) $('chess-status').textContent = `Lượt của turn==='w'?'Bin(Trắng)':'Zin(Đen)'{inCheck(chess,turn)?' — đang bị chiếu!':''}` }
function playChess(r, c) { if (finished) return; if (selected && legal(chess, selected, [r, c])) { const piece = chess[selected[0]][selected[1]]; chess[r][c] = piece[1] === 'P' && (r === 0 || r === 7) ? piece[0] + 'Q' : piece; chess[selected[0]][selected[1]] = null; selected = null; turn = turn === 'w' ? 'b' : 'w'; if (!hasMove(chess, turn)) { finished = true; $('chess-status').textContent = inCheck(chess, turn) ? `{turn==='w'?'Zin':'Bin'} thắng — chiếu hết! 🎉` : 'Hòa — hết nước đi hợp lệ.' } } else selected = chess[r][c]?.[0] === turn ? [r, c] : null; renderChess() }
function resetChess() { chess = [['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'], Array(8).fill('bP'), ...Array.from({ length: 4 }, () => Array(8).fill(null)), Array(8).fill('wP'), ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']]; turn = 'w'; selected = null; finished = false; renderChess() }
$('chess-reset').onclick = resetChess; resetChess();
// ===== Ảnh bìa ở mục Home (lưu trên Firebase Firestore: profiles/home) =====
(() => {
    const heroImg = $('hero-img'), heroPlaceholder = $('hero-placeholder'), heroInput = $('hero-input'), heroRemove = $('hero-remove');
    if (!heroImg || !heroInput) return;
    const HERO_KEY = 'binzin-home-photo';
    const HERO_SPEC = { maxSide: 1200, quality: .85, maxChars: 700000 };
    let toastTimer;
    const toast = (msg, ms = 3200) => { const el = $('toast'); if (!el) return; el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true }, ms) };
    const showHero = src => {
        if (src) { heroImg.src = src; heroImg.hidden = false; heroPlaceholder.hidden = true; heroRemove.hidden = false }
        else { heroImg.removeAttribute('src'); heroImg.hidden = true; heroPlaceholder.hidden = false; heroRemove.hidden = true }
    };
    const cfg = window.FIREBASE_CONFIG || {};
    const firebaseReady = window.firebase && cfg.apiKey && !String(cfg.apiKey).startsWith('YOUR_');
    let saveHero;
    if (firebaseReady) {
        if (!firebase.apps.length) firebase.initializeApp(cfg);
        const docRef = firebase.firestore().collection('profiles').doc('home');
        docRef.onSnapshot(snap => { showHero(snap.exists ? (snap.data().photo || '') : '') }, err => console.error(err));
        saveHero = photo => docRef.set({ name: 'Home', bio: '', about: '', likes: '', photo, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
        showHero(localStorage.getItem(HERO_KEY) || '');
        saveHero = async photo => { if (photo) localStorage.setItem(HERO_KEY, photo); else localStorage.removeItem(HERO_KEY); showHero(photo) };
    }
    const loadImg = file => new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im) }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Không đọc được ảnh')) }; im.src = u });
    const compress = (im, { maxSide, quality, maxChars }) => {
        let side = maxSide, q = quality;
        for (let i = 0; i < 12; i++) {
            const s = Math.min(1, side / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(im, 0, 0, w, h);
            const data = c.toDataURL('image/jpeg', q);
            if (data.length <= maxChars) return data;
            if (q > .6) q -= .08; else side = Math.round(side * .85);
        }
        throw new Error('Ảnh quá lớn');
    };
    heroInput.addEventListener('change', async () => {
        const file = heroInput.files[0]; heroInput.value = '';
        if (!file || !file.type.startsWith('image/')) return;
        toast('Đang tải ảnh bìa lên…');
        try {
            const im = await loadImg(file), photo = compress(im, HERO_SPEC);
            await saveHero(photo); showHero(photo); toast('Đã cập nhật ảnh bìa 💕');
        } catch (err) {
            console.error(err);
            toast(err?.code === 'permission-denied' ? 'Hãy cập nhật Rules trong README-chat.md (thêm home vào profiles) nha!' : 'Đổi ảnh bìa chưa được, thử lại nha 🥲', 5500);
        }
    });
    const confirmBox = $('confirm-box'), confirmOk = $('confirm-ok'), confirmCancel = $('confirm-cancel'), confirmImg = $('confirm-img');
    const askConfirm = src => new Promise(resolve => {
        confirmImg.src = src; confirmBox.hidden = false; confirmCancel.focus();
        const done = res => { confirmBox.hidden = true; confirmOk.onclick = confirmCancel.onclick = confirmBox.onclick = null; document.removeEventListener('keydown', onKey, true); resolve(res) };
        const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); done(false) } };
        confirmOk.onclick = () => done(true);
        confirmCancel.onclick = () => done(false);
        confirmBox.onclick = e => { if (e.target === confirmBox) done(false) };
        document.addEventListener('keydown', onKey, true);
    });
    heroRemove.addEventListener('click', async () => {
        if (!(await askConfirm(heroImg.src))) return;
        toast('Đang xóa ảnh bìa…');
        try { await saveHero(''); showHero(''); toast('Đã xóa ảnh bìa 🗑') }
        catch (err) { console.error(err); toast('Xóa ảnh chưa được, thử lại nha.') }
    });
})();
