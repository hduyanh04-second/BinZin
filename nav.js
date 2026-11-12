// ===== Dùng chung cho toàn bộ các trang: Thanh điều hướng, tiện ích, trạng thái Firebase, khóa mật khẩu & hiệu ứng =====
const $ = id => document.getElementById(id);

(() => {
    // 1. Tự động chuẩn hóa các liên kết trên thanh điều hướng & đánh dấu trang hiện tại
    const NAV_ITEMS = [
        { href: 'index.html', label: 'Home' },
        { href: 'profile.html', label: 'Profile' },
        { href: 'letter.html', label: 'Đôi lời mún nói' },
        { href: 'calendar.html', label: 'Ngày mấy iu nhau 🧐' },
        { href: 'photos.html', label: 'Photographs' },
        { href: 'wheel.html', label: 'Hôm nay ăn gì 🎡' },
        { href: 'games.html', label: 'Game' }
    ];
    const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const mainNav = $('main-nav'), menuToggle = $('menu-toggle');

    if (mainNav) {
        mainNav.replaceChildren();
        NAV_ITEMS.forEach(item => {
            const a = document.createElement('a');
            a.href = item.href;
            a.className = 'canva-button nav-btn';
            a.textContent = item.label;
            if (currentFile === item.href) {
                a.classList.add('active');
                a.setAttribute('aria-current', 'page');
            }
            mainNav.append(a);
        });
    }

    // 2. Menu điều hướng trên điện thoại
    const setMenu = open => {
        if (!menuToggle || !mainNav) return;
        mainNav.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    };
    window.setMobileMenu = setMenu;
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false) });
        document.addEventListener('click', e => {
            if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && !menuToggle.contains(e.target)) setMenu(false);
        });
        window.matchMedia('(min-width:768px)').addEventListener('change', e => { if (e.matches) setMenu(false) });
    }

    // 3. Tiện ích dùng chung (toast, xử lý ảnh, trạng thái chung trên Firebase)
    let toastTimer;
    const showToast = (msg, ms = 3200) => {
        let el = $('toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toast';
            el.className = 'toast';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.append(el);
        }
        el.textContent = msg;
        el.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.hidden = true }, ms);
    };

    const loadImage = file => new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file), img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img) };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh ' + file.name)) };
        img.src = url;
    });

    const compressImage = (img, { maxSide, quality, maxChars }) => {
        let side = maxSide, q = quality;
        for (let i = 0; i < 12; i++) {
            const s = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
            const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
            const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
            const data = canvas.toDataURL('image/jpeg', q);
            if (data.length <= maxChars) return data;
            if (q > .6) q -= .08; else side = Math.round(side * .85);
        }
        throw new Error('Ảnh quá lớn');
    };

    const todayISO = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const cfg = window.FIREBASE_CONFIG || {};
    const firebaseReady = Boolean(window.firebase && cfg.apiKey && !String(cfg.apiKey).startsWith('YOUR_'));
    if (firebaseReady && !firebase.apps.length) firebase.initializeApp(cfg);

    // Quản lý document dùng chung profiles/mood (lưu Mood ở Home, Cột mốc ở Calendar, Danh sách ở Wheel)
    const STATE_KEY = 'binzin-mood-v1';
    const DEFAULT_STATE = {
        binEmoji: '💭',
        binText: 'Nhớ Zin nhiều lắm 💕',
        zinEmoji: '🧋',
        zinText: 'Thèm trà sữa cùng Bin',
        countdownEvents: null,
        customMilestones: '',
        wheelEat: '',
        wheelGo: ''
    };

    function subscribeAppState(onChange) {
        let state = { ...DEFAULT_STATE };
        try { state = { ...state, ...JSON.parse(localStorage.getItem(STATE_KEY) || '{}') } } catch { }
        const serialize = s => JSON.stringify({
            binEmoji: s.binEmoji, binText: s.binText, zinEmoji: s.zinEmoji, zinText: s.zinText,
            countdownEvents: s.countdownEvents, customMilestones: s.customMilestones, wheelEat: s.wheelEat, wheelGo: s.wheelGo
        });
        if (firebaseReady) {
            const ref = firebase.firestore().collection('profiles').doc('mood');
            ref.onSnapshot(snap => {
                if (snap.exists) {
                    try { state = { ...state, ...JSON.parse(snap.data().about || '{}') } } catch { }
                    localStorage.setItem(STATE_KEY, serialize(state));
                    onChange(state);
                }
            }, err => console.error(err));
            onChange(state);
            return async patch => {
                state = { ...state, ...patch };
                localStorage.setItem(STATE_KEY, serialize(state));
                onChange(state);
                await ref.set({
                    name: 'AppState',
                    bio: `${state.binEmoji} ${state.binText}`.slice(0, 150),
                    about: serialize(state).slice(0, 1490),
                    likes: '',
                    photo: '',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            };
        }
        onChange(state);
        return async patch => {
            state = { ...state, ...patch };
            localStorage.setItem(STATE_KEY, serialize(state));
            onChange(state);
        };
    }

    window.BinZin = { toast: showToast, loadImage, compressImage, todayISO, firebaseReady, subscribeAppState };

    // 4. Màn hình khóa mật khẩu (Passcode: 040726)
    const PASSCODE = '040726';
    const UNLOCK_KEY = 'binzin-unlocked-v1';

    function openLockScreen() {
        if ($('passcode-gate')) return;
        const gate = document.createElement('div');
        gate.id = 'passcode-gate';
        gate.className = 'passcode-gate';
        gate.setAttribute('role', 'dialog');
        gate.setAttribute('aria-modal', 'true');
        gate.setAttribute('aria-label', 'Nhập mật khẩu để vào BinZin World');
        gate.innerHTML = `
            <div class="passcode-card" id="passcode-card">
                <div class="text-4xl" aria-hidden="true">🔐💕</div>
                <h2 class="mt-2 text-[#713d53]">BinZin World</h2>
                <p class="mt-1 text-sm text-[#876777]">Nhập mã kỷ niệm 6 số để mở khóa thế giới nhỏ</p>
                <p class="text-xs text-[#a84268] mt-1">💡 Gợi ý: Ngày tụi mình bắt đầu iu (ddmmyy)</p>
                <div class="passcode-dots" id="passcode-dots" aria-live="polite">
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                </div>
                <p id="passcode-err" class="passcode-err" role="alert"></p>
                <div class="passcode-pad">
                    <button type="button" data-digit="1">1</button>
                    <button type="button" data-digit="2">2</button>
                    <button type="button" data-digit="3">3</button>
                    <button type="button" data-digit="4">4</button>
                    <button type="button" data-digit="5">5</button>
                    <button type="button" data-digit="6">6</button>
                    <button type="button" data-digit="7">7</button>
                    <button type="button" data-digit="8">8</button>
                    <button type="button" data-digit="9">9</button>
                    <button type="button" data-action="clear" class="passcode-fn">Xóa</button>
                    <button type="button" data-digit="0">0</button>
                    <button type="button" data-action="back" class="passcode-fn" aria-label="Xóa 1 số">⌫</button>
                </div>
            </div>
        `;
        document.body.append(gate);
        document.body.style.overflow = 'hidden';

        let code = '';
        const dots = [...gate.querySelectorAll('#passcode-dots span')];
        const errEl = gate.querySelector('#passcode-err');
        const card = gate.querySelector('#passcode-card');

        const updateDots = () => dots.forEach((d, i) => d.classList.toggle('filled', i < code.length));

        function pushDigit(d) {
            if (code.length >= PASSCODE.length) return;
            errEl.textContent = '';
            code += d;
            updateDots();
            if (code.length === PASSCODE.length) {
                if (code === PASSCODE) {
                    localStorage.setItem(UNLOCK_KEY, '1');
                    gate.classList.add('unlocking');
                    setTimeout(() => { gate.remove(); document.body.style.overflow = '' }, 260);
                } else {
                    errEl.textContent = 'Chưa đúng rồi, thử lại ngày kỷ niệm nha 🥺';
                    card.classList.remove('shake');
                    void card.offsetWidth;
                    card.classList.add('shake');
                    setTimeout(() => { code = ''; updateDots() }, 380);
                }
            }
        }

        gate.addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.dataset.digit !== undefined) pushDigit(btn.dataset.digit);
            else if (btn.dataset.action === 'clear') { code = ''; errEl.textContent = ''; updateDots() }
            else if (btn.dataset.action === 'back') { code = code.slice(0, -1); errEl.textContent = ''; updateDots() }
        });

        const onKey = e => {
            if (!$('passcode-gate')) { document.removeEventListener('keydown', onKey); return }
            if (e.key >= '0' && e.key <= '9') { e.preventDefault(); pushDigit(e.key) }
            else if (e.key === 'Backspace') { e.preventDefault(); code = code.slice(0, -1); updateDots() }
            else if (e.key === 'Escape') { e.preventDefault(); code = ''; updateDots() }
        };
        document.addEventListener('keydown', onKey);
    }

    if (localStorage.getItem(UNLOCK_KEY) !== '1') openLockScreen();

    if (mainNav) {
        const lockBtn = document.createElement('button');
        lockBtn.type = 'button';
        lockBtn.dataset.lockBtn = '1';
        lockBtn.className = 'canva-button nav-btn';
        lockBtn.title = 'Khóa màn hình';
        lockBtn.setAttribute('aria-label', 'Khóa màn hình');
        lockBtn.textContent = '🔒';
        lockBtn.addEventListener('click', () => {
            localStorage.removeItem(UNLOCK_KEY);
            openLockScreen();
        });
        mainNav.append(lockBtn);
    }

    // 5. Hiệu ứng hạt bay & tim chạm
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const petalHost = document.createElement('div');
        petalHost.className = 'petal-layer';
        petalHost.setAttribute('aria-hidden', 'true');
        const symbols = ['🌸', '💗', '🌷', '✨', '💕', '💮'];
        for (let i = 0; i < 14; i++) {
            const s = document.createElement('span');
            s.className = 'floating-petal';
            s.textContent = symbols[i % symbols.length];
            s.style.left = `${(i * 7.3 + Math.random() * 5) % 100}%`;
            s.style.animationDuration = `${13 + Math.random() * 12}s`;
            s.style.animationDelay = `${-Math.random() * 20}s`;
            s.style.fontSize = `${12 + Math.random() * 10}px`;
            petalHost.append(s);
        }
        document.body.append(petalHost);

        const burstSymbols = ['💕', '💗', '💖', '✨', '🌸'];
        document.addEventListener('pointerdown', e => {
            if (e.target.closest('#passcode-gate')) return;
            for (let i = 0; i < 4; i++) {
                const h = document.createElement('span');
                h.className = 'click-heart';
                h.setAttribute('aria-hidden', 'true');
                h.textContent = burstSymbols[(i + Math.floor(Math.random() * burstSymbols.length)) % burstSymbols.length];
                const angle = (Math.PI * 2 * i) / 4 + (Math.random() - .5) * .6;
                const dist = 26 + Math.random() * 28;
                h.style.left = `${e.clientX}px`;
                h.style.top = `${e.clientY}px`;
                h.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
                h.style.setProperty('--ty', `${Math.sin(angle) * dist - 22}px`);
                document.body.append(h);
                setTimeout(() => h.remove(), 750);
            }
        }, { passive: true });
    }
})();
