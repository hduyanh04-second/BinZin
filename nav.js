// ===== Dùng chung cho toàn bộ các trang: Menu điện thoại + Khóa mật khẩu + Hiệu ứng hạt bay & tim chạm =====
(() => {
    // 1. Menu điều hướng trên điện thoại
    const menuToggle = document.getElementById('menu-toggle'), mainNav = document.getElementById('main-nav');
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

    // 2. Màn hình khóa mật khẩu (Passcode: 040726)
    const PASSCODE = '040726';
    const UNLOCK_KEY = 'binzin-unlocked-v1';

    function openLockScreen() {
        if (document.getElementById('passcode-gate')) return;
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

        function updateDots() {
            dots.forEach((d, i) => d.classList.toggle('filled', i < code.length));
        }

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
            if (!document.getElementById('passcode-gate')) { document.removeEventListener('keydown', onKey); return }
            if (e.key >= '0' && e.key <= '9') { e.preventDefault(); pushDigit(e.key) }
            else if (e.key === 'Backspace') { e.preventDefault(); code = code.slice(0, -1); updateDots() }
            else if (e.key === 'Escape') { e.preventDefault(); code = ''; updateDots() }
        };
        document.addEventListener('keydown', onKey);
    }

    if (localStorage.getItem(UNLOCK_KEY) !== '1') openLockScreen();

    // Thêm nút khóa nhanh trên thanh điều hướng
    if (mainNav && !mainNav.querySelector('[data-lock-btn]')) {
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

    // 3. Hiệu ứng hạt bay (cánh hoa / tim rơi nhẹ) & tim nảy khi bấm chuột/chạm
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
