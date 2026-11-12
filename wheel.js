// ===== Trang "Hôm nay ăn gì / Đi đâu?": Vòng quay may mắn đồng bộ Firebase =====
(() => {
    const { toast, subscribeAppState } = window.BinZin;
    const DEFAULT_WHEEL = {
        eat: ['Lẩu thái chua cay 🍲', 'Đồ nướng BBQ 🥩', 'Mì cay 7 cấp độ 🌶️', 'Sushi & Sashimi 🍣', 'Bún đậu mắm tôm 🥢', 'Pizza & Mì Ý 🍕', 'Gà rán + Trà sữa 🍗', 'Phở bò / Bún bò 🍜'],
        go: ['Đi dạo phố & uống trà sữa 🧋', 'Đi xem phim rạp 🍿', 'Chụp Photobooth Hàn Quốc 📸', 'Đi cafe học bài / làm việc ☕', 'Đi siêu thị nấu ăn cùng nhau 🛒', 'Đi công viên hóng gió 🌿', 'Ở nhà cày phim & ôm nhau 🛋️', 'Đi khu vui chơi / gắp thú 🧸']
    };
    const WHEEL_COLORS = ['#f8d5df', '#ffe7ed', '#fbdce5', '#f3b6c8', '#fff0e9', '#efd8df', '#f6c8d6', '#ffe1e9'];
    let wheelTab = 'eat', spinning = false, wheelAngle = 0;
    const wheelData = { eat: [...DEFAULT_WHEEL.eat], go: [...DEFAULT_WHEEL.go] };

    const saveAppState = subscribeAppState(state => {
        if (state.wheelEat) wheelData.eat = state.wheelEat.split('|').filter(Boolean);
        if (state.wheelGo) wheelData.go = state.wheelGo.split('|').filter(Boolean);
        renderWheel();
    });

    const saveWheelList = () => saveAppState({
        wheelEat: wheelData.eat.join('|'),
        wheelGo: wheelData.go.join('|')
    });

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

    $('wheel-add-form').addEventListener('submit', e => {
        e.preventDefault();
        const val = $('wheel-item-input').value.trim().replace(/\|/g, '-');
        if (!val) return;
        wheelData[wheelTab].push(val);
        $('wheel-item-input').value = '';
        saveWheelList();
        renderWheel();
    });

    $('wheel-spin').addEventListener('click', () => {
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
                const norm = ((-Math.PI / 2 - wheelAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                const winIdx = Math.floor(norm / arc) % items.length;
                $('wheel-result').textContent = `🎉 Chốt đơn: ${items[winIdx]}!`;
            }
        }
        requestAnimationFrame(frame);
    });
})();

