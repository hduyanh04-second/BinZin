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
    window.setMobileMenu?.(false)
}));
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

    // ===== 1. Trạng thái hôm nay (Mood / Status ở trang Home — lưu vào profiles/mood) =====
    const MOOD_KEY = 'binzin-mood-v1';
    const PRESETS = [
        ['💭', 'Nhớ người iu quá chừng'],
        ['🧋', 'Thèm trà sữa cùng nhau'],
        ['🍜', 'Đói bụng rồi, đi ăn thui'],
        ['💻', 'Đang chạy deadline chăm chỉ'],
        ['😴', 'Buồn ngủ díp mắt'],
        ['🎮', 'Muốn rủ người iu chơi game'],
        ['🥰', 'Đang rất vui và iu đời'],
        ['🥺', 'Cần một cái ôm ngay bây giờ']
    ];
    let moodState = { binEmoji: '💭', binText: 'Nhớ Zin nhiều lắm 💕', zinEmoji: '🧋', zinText: 'Thèm trà sữa cùng Bin', countdownEvents: null, customMilestones: '', wheelEat: '', wheelGo: '' };
    let activeMoodPerson = 'bin', saveMoodDoc;

    function renderMood() {
        $('mood-emoji-bin').textContent = moodState.binEmoji || '💭';
        $('mood-text-bin').textContent = moodState.binText || 'Nhớ Zin nhiều lắm 💕';
        $('mood-emoji-zin').textContent = moodState.zinEmoji || '🧋';
        $('mood-text-zin').textContent = moodState.zinText || 'Thèm trà sữa cùng Bin';
    }

    const serializeState = s => JSON.stringify({
        binEmoji: s.binEmoji, binText: s.binText, zinEmoji: s.zinEmoji, zinText: s.zinText,
        countdownEvents: s.countdownEvents, customMilestones: s.customMilestones, wheelEat: s.wheelEat, wheelGo: s.wheelGo
    });

    if (firebaseReady) {
        const moodRef = firebase.firestore().collection('profiles').doc('mood');
        moodRef.onSnapshot(snap => {
            if (snap.exists) {
                const d = snap.data();
                try {
                    const parsed = JSON.parse(d.about || '{}');
                    moodState = { ...moodState, ...parsed };
                } catch { }
                renderMood();
                renderMilestones();
                syncWheelFromRemote();
            }
        }, err => console.error(err));
        saveMoodDoc = async patch => {
            moodState = { ...moodState, ...patch };
            localStorage.setItem(MOOD_KEY, serializeState(moodState));
            await moodRef.set({
                name: 'AppState',
                bio: `${moodState.binEmoji} ${moodState.binText}`.slice(0, 150),
                about: serializeState(moodState).slice(0, 1490),
                likes: '',
                photo: '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        };
    } else {
        try { moodState = { ...moodState, ...JSON.parse(localStorage.getItem(MOOD_KEY) || '{}') } } catch { }
        saveMoodDoc = async patch => {
            moodState = { ...moodState, ...patch };
            localStorage.setItem(MOOD_KEY, serializeState(moodState));
        };
    }

    const moodModal = $('mood-modal'), moodForm = $('mood-form'), presetsEl = $('mood-presets');
    PRESETS.forEach(([em, txt]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'secondary text-xs !py-1.5 !px-2.5';
        b.textContent = `${em} ${txt}`;
        b.addEventListener('click', () => { $('mood-emoji-input').value = em; $('mood-text-input').value = txt });
        presetsEl.append(b);
    });

    document.querySelectorAll('[data-mood-person]').forEach(btn => {
        btn.addEventListener('click', () => {
            activeMoodPerson = btn.dataset.moodPerson;
            $('mood-modal-title').textContent = activeMoodPerson === 'bin' ? '🐻 Trạng thái của Bin' : '🌷 Trạng thái của Zin';
            $('mood-emoji-input').value = activeMoodPerson === 'bin' ? moodState.binEmoji : moodState.zinEmoji;
            $('mood-text-input').value = activeMoodPerson === 'bin' ? moodState.binText : moodState.zinText;
            moodModal.hidden = false;
            $('mood-text-input').focus();
        });
    });
    $('mood-cancel').addEventListener('click', () => { moodModal.hidden = true });
    moodModal.addEventListener('click', e => { if (e.target === moodModal) moodModal.hidden = true });
    moodForm.addEventListener('submit', async e => {
        e.preventDefault();
        const em = $('mood-emoji-input').value.trim() || '💕';
        const txt = $('mood-text-input').value.trim();
        if (!txt) return;
        const patch = activeMoodPerson === 'bin' ? { binEmoji: em, binText: txt } : { zinEmoji: em, zinText: txt };
        moodModal.hidden = true;
        renderMood();
        try { await saveMoodDoc(patch); renderMood(); toast('Đã cập nhật trạng thái 💕') }
        catch (err) { console.error(err); toast('Lưu trạng thái chưa được, thử lại nha.') }
    });
    renderMood();

    // ===== 2. Cột mốc & Đếm ngược ngày kỷ niệm (CRUD đầy đủ cho cả 2 bảng) =====
    const autoListEl = $('auto-milestones'), cdEmptyEl = $('cd-empty'), customListEl = $('custom-milestones'), customEmptyEl = $('custom-ms-empty');
    const DAY_MS = 86400000;
    const fmtVN = d => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const toISODate = u => new Date(u).toISOString().slice(0, 10);

    function buildDefaultCountdowns() {
        const now = new Date();
        const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const startUTC = Date.UTC(2026, 6, 4); // 04/07/2026
        const currentDays = Math.round((todayUTC - startUTC) / DAY_MS) + 1;
        const list = [];
        const dayTargets = [50, 100, 150, 200, 250, 300, 365, 500, 730, 1000, 1500, 2000];
        for (const n of dayTargets) {
            if (n >= currentDays && list.length < 3) {
                const targetUTC = startUTC + (n - 1) * DAY_MS;
                list.push(`💖|${toISODate(targetUTC)}|Kỷ niệm ${n} ngày yêu nhau`);
            }
        }
        let annivYear = now.getFullYear();
        let annivUTC = Date.UTC(annivYear, 6, 4);
        if (annivUTC < todayUTC || annivYear <= 2026) { annivYear = Math.max(2027, annivYear + 1); annivUTC = Date.UTC(annivYear, 6, 4) }
        list.push(`💍|${toISODate(annivUTC)}|Kỷ niệm ${annivYear - 2026} năm bên nhau`);

        const nextAnnual = (mIdx, day) => {
            let y = now.getFullYear(), u = Date.UTC(y, mIdx, day);
            if (u < todayUTC) { y++; u = Date.UTC(y, mIdx, day) }
            return toISODate(u);
        };
        list.push(`🎂|${nextAnnual(0, 31)}|Sinh nhật Bin 🧸 (31/01)`);
        list.push(`🎂|${nextAnnual(8, 8)}|Sinh nhật Zin 🌷 (08/09)`);
        return list.join('\n');
    }

    function getCountdownEvents() {
        const raw = moodState.countdownEvents === null || moodState.countdownEvents === undefined
            ? buildDefaultCountdowns()
            : moodState.countdownEvents;
        if (!raw) return [];
        return raw.split('\n').filter(Boolean).map((line, idx) => {
            const parts = line.split('|');
            if (parts.length >= 3) {
                const [icon, dateStr, ...rest] = parts;
                return { idx, icon: icon || '💖', dateStr, title: rest.join('|') };
            }
            const [dateStr, ...rest] = parts;
            return { idx, icon: '💖', dateStr, title: rest.join('|') };
        }).filter(x => x.dateStr && x.title);
    }

    function getCustomMilestones() {
        if (!moodState.customMilestones) return [];
        return moodState.customMilestones.split('\n').filter(Boolean).map((line, idx) => {
            const [dateStr, ...rest] = line.split('|');
            return { idx, dateStr, title: rest.join('|') };
        }).filter(x => x.dateStr && x.title);
    }

    let editingCdIdx = -1, editingMsIdx = -1;

    function setCdEditing(item) {
        if (item) {
            editingCdIdx = item.idx;
            $('cd-icon').value = item.icon || '💖';
            $('cd-title').value = item.title;
            $('cd-date').value = item.dateStr;
            $('cd-submit').textContent = 'Lưu';
            $('cd-cancel').hidden = false;
            $('cd-title').focus();
        } else {
            editingCdIdx = -1;
            $('cd-icon').value = '💖';
            $('cd-title').value = '';
            $('cd-date').value = '';
            $('cd-submit').textContent = 'Thêm';
            $('cd-cancel').hidden = true;
        }
    }

    function setMsEditing(item) {
        if (item) {
            editingMsIdx = item.idx;
            $('ms-title').value = item.title;
            $('ms-date').value = item.dateStr;
            $('ms-submit').textContent = 'Lưu';
            $('ms-cancel').hidden = false;
            $('ms-title').focus();
        } else {
            editingMsIdx = -1;
            $('ms-title').value = '';
            $('ms-date').value = '';
            $('ms-submit').textContent = 'Thêm';
            $('ms-cancel').hidden = true;
        }
    }

    function renderMilestones() {
        if (!autoListEl) return;
        const now = new Date();
        const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

        // Bảng 1: Đếm ngược cột mốc sắp tới (CRUD)
        const cdItems = getCountdownEvents().map(it => {
            const [y, m, d] = it.dateStr.split('-').map(Number);
            const u = Date.UTC(y, m - 1, d);
            return { ...it, date: new Date(u), diff: Math.round((u - todayUTC) / DAY_MS) };
        });
        cdItems.sort((a, b) => a.diff - b.diff);
        autoListEl.replaceChildren();
        cdItems.forEach(it => {
            const li = document.createElement('li');
            li.className = 'milestone-item';
            const badgeText = it.diff === 0 ? '🎉 Hôm nay!' : it.diff > 0 ? `Còn ${it.diff} ngày` : `${Math.abs(it.diff)} ngày trước`;

            const iconEl = document.createElement('span');
            iconEl.className = 'text-2xl';
            iconEl.setAttribute('aria-hidden', 'true');
            iconEl.textContent = it.icon;

            const info = document.createElement('div');
            info.className = 'min-w-0 flex-1';
            const t = document.createElement('p'); t.className = 'font-bold text-[#713d53]'; t.textContent = it.title;
            const sub = document.createElement('p'); sub.className = 'text-xs text-[#876777]'; sub.textContent = fmtVN(it.date);
            info.append(t, sub);

            const badge = document.createElement('span');
            badge.className = 'milestone-badge';
            badge.textContent = badgeText;

            const actions = document.createElement('div');
            actions.className = 'flex gap-1';
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'secondary text-xs !py-1 !px-2';
            editBtn.textContent = '✏️';
            editBtn.setAttribute('aria-label', 'Sửa ' + it.title);
            editBtn.addEventListener('click', () => setCdEditing(it));

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'secondary text-xs !py-1 !px-2';
            delBtn.textContent = '✕';
            delBtn.setAttribute('aria-label', 'Xóa ' + it.title);
            delBtn.addEventListener('click', async () => {
                const next = getCountdownEvents().filter(x => x.idx !== it.idx).map(x => `${x.icon}|${x.dateStr}|${x.title}`).join('\n');
                if (editingCdIdx === it.idx) setCdEditing(null);
                await saveMoodDoc({ countdownEvents: next });
                renderMilestones();
                toast('Đã xóa cột mốc.');
            });
            actions.append(editBtn, delBtn);

            li.append(iconEl, info, badge, actions);
            autoListEl.append(li);
        });
        if (cdEmptyEl) cdEmptyEl.hidden = cdItems.length > 0;

        // Bảng 2: Danh sách kỷ niệm riêng (CRUD)
        const customs = getCustomMilestones();
        customListEl.replaceChildren();
        customs.forEach(c => {
            const [y, m, d] = c.dateStr.split('-').map(Number);
            const u = Date.UTC(y, m - 1, d);
            const diff = Math.round((u - todayUTC) / DAY_MS);
            const label = diff === 0 ? '🎉 Hôm nay!' : diff > 0 ? `Còn ${diff} ngày` : `${Math.abs(diff)} ngày trước`;
            const li = document.createElement('li');
            li.className = 'milestone-item';
            const info = document.createElement('div');
            info.className = 'min-w-0 flex-1';
            const t = document.createElement('p'); t.className = 'font-bold text-[#713d53]'; t.textContent = `📌 ${c.title}`;
            const sub = document.createElement('p'); sub.className = 'text-xs text-[#876777]'; sub.textContent = fmtVN(new Date(u));
            info.append(t, sub);

            const badge = document.createElement('span');
            badge.className = 'milestone-badge';
            badge.textContent = label;

            const actions = document.createElement('div');
            actions.className = 'flex gap-1';
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'secondary text-xs !py-1 !px-2';
            editBtn.textContent = '✏️';
            editBtn.setAttribute('aria-label', 'Sửa ' + c.title);
            editBtn.addEventListener('click', () => setMsEditing(c));

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'secondary text-xs !py-1 !px-2';
            del.textContent = '✕';
            del.setAttribute('aria-label', 'Xóa cột mốc');
            del.addEventListener('click', async () => {
                const next = getCustomMilestones().filter(x => x.idx !== c.idx).map(x => `${x.dateStr}|${x.title}`).join('\n');
                if (editingMsIdx === c.idx) setMsEditing(null);
                await saveMoodDoc({ customMilestones: next });
                renderMilestones();
                toast('Đã xóa kỷ niệm.');
            });
            actions.append(editBtn, del);
            li.append(info, badge, actions);
            customListEl.append(li);
        });
        customEmptyEl.hidden = customs.length > 0;
    }

    $('cd-cancel')?.addEventListener('click', () => setCdEditing(null));
    $('countdown-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const icon = ($('cd-icon').value.trim() || '💖').replace(/\|/g, '');
        const title = $('cd-title').value.trim().replace(/\|/g, '-');
        const dateStr = $('cd-date').value;
        if (!title || !dateStr) return;
        const current = getCountdownEvents();
        if (editingCdIdx >= 0) {
            const target = current.find(x => x.idx === editingCdIdx);
            if (target) { target.icon = icon; target.title = title; target.dateStr = dateStr }
        } else {
            current.push({ icon, dateStr, title });
        }
        setCdEditing(null);
        await saveMoodDoc({ countdownEvents: current.map(x => `${x.icon}|${x.dateStr}|${x.title}`).join('\n') });
        renderMilestones();
        toast('Đã lưu cột mốc đếm ngược 💕');
    });

    $('cd-reset-btn')?.addEventListener('click', async () => {
        setCdEditing(null);
        await saveMoodDoc({ countdownEvents: buildDefaultCountdowns() });
        renderMilestones();
        toast('Đã khôi phục các cột mốc mặc định.');
    });

    $('ms-cancel')?.addEventListener('click', () => setMsEditing(null));
    $('milestone-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const title = $('ms-title').value.trim().replace(/\|/g, '-');
        const dateStr = $('ms-date').value;
        if (!title || !dateStr) return;
        const current = getCustomMilestones();
        if (editingMsIdx >= 0) {
            const target = current.find(x => x.idx === editingMsIdx);
            if (target) { target.title = title; target.dateStr = dateStr }
        } else {
            current.push({ dateStr, title });
        }
        setMsEditing(null);
        await saveMoodDoc({ customMilestones: current.map(x => `${x.dateStr}|${x.title}`).join('\n') });
        renderMilestones();
        toast('Đã lưu ngày kỷ niệm 💕');
    });
    renderMilestones();

    // ===== 3. Vòng quay "Hôm nay ăn gì / Đi đâu?" =====
    const DEFAULT_WHEEL = {
        eat: ['Lẩu thái chua cay 🍲', 'Đồ nướng BBQ 🥩', 'Mì cay 7 cấp độ 🌶️', 'Sushi & Sashimi 🍣', 'Bún đậu mắm tôm 🥢', 'Pizza & Mì Ý 🍕', 'Gà rán + Trà sữa 🍗', 'Phở bò / Bún bò 🍜'],
        go: ['Đi dạo phố & uống trà sữa 🧋', 'Đi xem phim rạp 🍿', 'Chụp Photobooth Hàn Quốc 📸', 'Đi cafe học bài / làm việc ☕', 'Đi siêu thị nấu ăn cùng nhau 🛒', 'Đi công viên hóng gió 🌿', 'Ở nhà cày phim & ôm nhau 🛋️', 'Đi khu vui chơi / gắp thú 🧸']
    };
    const WHEEL_COLORS = ['#f8d5df', '#ffe7ed', '#fbdce5', '#f3b6c8', '#fff0e9', '#efd8df', '#f6c8d6', '#ffe1e9'];
    let wheelTab = 'eat', spinning = false, wheelAngle = 0;
    let wheelData = { eat: [...DEFAULT_WHEEL.eat], go: [...DEFAULT_WHEEL.go] };

    function syncWheelFromRemote() {
        if (moodState.wheelEat) wheelData.eat = moodState.wheelEat.split('|').filter(Boolean);
        if (moodState.wheelGo) wheelData.go = moodState.wheelGo.split('|').filter(Boolean);
        renderWheel();
    }
    syncWheelFromRemote();

    function saveWheelList() {
        return saveMoodDoc({
            wheelEat: wheelData.eat.join('|'),
            wheelGo: wheelData.go.join('|')
        });
    }

    function drawWheel() {
        const canvas = $('wheel-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const items = wheelData[wheelTab];
        const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 8;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!items.length) return;
        const arc = (Math.PI * 2) / items.length;
        items.forEach((label, i) => {
            const start = wheelAngle + i * arc, end = start + arc;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, start, end);
            ctx.closePath();
            ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(start + arc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#673d50';
            ctx.font = 'bold 13px "DM Sans", sans-serif';
            const short = label.length > 18 ? label.slice(0, 17) + '…' : label;
            ctx.fillText(short, r - 14, 4);
            ctx.restore();
        });
        // Tâm vòng quay
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#c85578';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    function renderWheel() {
        $('wheel-list-title').textContent = wheelTab === 'eat' ? 'Danh sách món ăn 🍜' : 'Danh sách địa điểm 🛵';
        const ul = $('wheel-items');
        if (!ul) return;
        ul.replaceChildren();
        wheelData[wheelTab].forEach((item, idx) => {
            const li = document.createElement('li');
            li.className = 'wheel-chip';
            const span = document.createElement('span');
            span.textContent = item;
            const del = document.createElement('button');
            del.type = 'button';
            del.textContent = '✕';
            del.setAttribute('aria-label', 'Xóa ' + item);
            del.addEventListener('click', () => {
                if (wheelData[wheelTab].length <= 2) { toast('Cần giữ ít nhất 2 lựa chọn để quay nha!'); return }
                wheelData[wheelTab].splice(idx, 1);
                saveWheelList();
                renderWheel();
            });
            li.append(span, del);
            ul.append(li);
        });
        drawWheel();
    }

    document.querySelectorAll('[data-wheel-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (spinning) return;
            wheelTab = btn.dataset.wheelTab;
            document.querySelectorAll('[data-wheel-tab]').forEach(b => {
                const active = b === btn;
                b.classList.toggle('active', active);
                b.setAttribute('aria-selected', String(active));
            });
            $('wheel-result').textContent = '';
            renderWheel();
        });
    });

    $('wheel-add-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const val = $('wheel-item-input').value.trim().replace(/\|/g, '-');
        if (!val) return;
        wheelData[wheelTab].push(val);
        $('wheel-item-input').value = '';
        saveWheelList();
        renderWheel();
    });

    $('wheel-reset-default')?.addEventListener('click', () => {
        wheelData[wheelTab] = [...DEFAULT_WHEEL[wheelTab]];
        saveWheelList();
        renderWheel();
        toast('Đã khôi phục danh sách mặc định.');
    });

    $('wheel-spin')?.addEventListener('click', () => {
        const items = wheelData[wheelTab];
        if (spinning || items.length < 2) return;
        spinning = true;
        $('wheel-spin').disabled = true;
        $('wheel-result').textContent = 'Đang quay… 🎡';

        const extraSpins = (5 + Math.random() * 4) * Math.PI * 2;
        const startAngle = wheelAngle;
        const targetAngle = startAngle + extraSpins;
        const duration = 3400;
        const t0 = performance.now();

        function frame(now) {
            const p = Math.min(1, (now - t0) / duration);
            const ease = 1 - Math.pow(1 - p, 3);
            wheelAngle = startAngle + (targetAngle - startAngle) * ease;
            drawWheel();
            if (p < 1) requestAnimationFrame(frame);
            else {
                spinning = false;
                $('wheel-spin').disabled = false;
                const arc = (Math.PI * 2) / items.length;
                // Mũi tên ở góc trên cùng (-PI/2)
                const norm = ((-Math.PI / 2 - wheelAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                const winIdx = Math.floor(norm / arc) % items.length;
                $('wheel-result').textContent = `🎉 Chốt đơn: ${items[winIdx]}!`;
            }
        }
        requestAnimationFrame(frame);
    });
    renderWheel();
})();
