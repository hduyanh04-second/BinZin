// ===== Trang "Ngày mấy iu nhau": Đếm ngày yêu, lịch tháng & CRUD Cột mốc kỷ niệm =====
(() => {
    const { toast, todayISO, subscribeAppState } = window.BinZin;
    const DAY_MS = 86400000;
    const fmtVN = d => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const toISODate = u => new Date(u).toISOString().slice(0, 10);

    // 1. Lịch & bộ đếm ngày yêu (cố định 04/07/2026)
    let shownYear = new Date().getFullYear(), shownMonth = new Date().getMonth();

    function startDate() {
        const val = $('start-date')?.value;
        if (!val) return null;
        const [y, m, d] = val.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function renderCalendar() {
        const now = new Date();
        $('month-title').textContent = `Tháng ${shownMonth + 1} / ${shownYear}`;
        $('calendar-days').replaceChildren();
        const offset = new Date(shownYear, shownMonth, 1).getDay();
        const count = new Date(shownYear, shownMonth + 1, 0).getDate();
        const start = startDate();
        for (let i = 0; i < Math.ceil((offset + count) / 7) * 7; i++) {
            const date = new Date(shownYear, shownMonth, i - offset + 1);
            const cell = document.createElement('span');
            cell.className = 'day' + (date.getMonth() !== shownMonth ? ' text-[#c5adb5]' : '');
            if (date.toDateString() === now.toDateString()) cell.classList.add('today');
            if (start && date.toDateString() === start.toDateString()) cell.classList.add('start');
            cell.textContent = date.getDate();
            $('calendar-days').append(cell);
        }
    }

    function updateLoveDays(jumpToStart = false) {
        const date = startDate(), now = new Date();
        const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const startUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        if (startUTC > todayUTC) {
            $('days-count').textContent = '—';
            $('date-status').textContent = 'Ngày bắt đầu iu chưa thể ở tương lai nha.';
        } else {
            $('days-count').textContent = new Intl.NumberFormat('vi-VN').format(Math.round((todayUTC - startUTC) / DAY_MS) + 1);
            $('date-status').textContent = 'Từ ' + date.toLocaleDateString('vi-VN') + ' đến hôm nay 💕';
            if (jumpToStart) { shownYear = date.getFullYear(); shownMonth = date.getMonth() }
        }
        renderCalendar();
    }

    $('previous-month').onclick = () => { shownMonth--; if (shownMonth < 0) { shownMonth = 11; shownYear-- } renderCalendar() };
    $('next-month').onclick = () => { shownMonth++; if (shownMonth > 11) { shownMonth = 0; shownYear++ } renderCalendar() };
    $('today-button').onclick = () => { const now = new Date(); shownYear = now.getFullYear(); shownMonth = now.getMonth(); renderCalendar() };

    updateLoveDays(true);
    setInterval(() => updateLoveDays(false), 60000);

    // 2. CRUD Cột mốc đếm ngược & Kỷ niệm riêng
    const autoListEl = $('auto-milestones'), cdEmptyEl = $('cd-empty'), customListEl = $('custom-milestones'), customEmptyEl = $('custom-ms-empty');
    let appState = {}, editingCdIdx = -1, editingMsIdx = -1;

    function buildDefaultCountdowns() {
        const now = new Date();
        const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const startUTC = Date.UTC(2026, 6, 4);
        const currentDays = Math.round((todayUTC - startUTC) / DAY_MS) + 1;
        const list = [];
        const dayTargets = [50, 100, 150, 200, 250, 300, 365, 500, 730, 1000, 1500, 2000];
        for (const n of dayTargets) {
            if (n >= currentDays && list.length < 3) {
                list.push(`💖|${toISODate(startUTC + (n - 1) * DAY_MS)}|Kỷ niệm ${n} ngày yêu nhau`);
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
        const raw = appState.countdownEvents === null || appState.countdownEvents === undefined
            ? buildDefaultCountdowns()
            : appState.countdownEvents;
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
        if (!appState.customMilestones) return [];
        return appState.customMilestones.split('\n').filter(Boolean).map((line, idx) => {
            const [dateStr, ...rest] = line.split('|');
            return { idx, dateStr, title: rest.join('|') };
        }).filter(x => x.dateStr && x.title);
    }

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
            $('cd-date').value = todayISO();
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
            $('ms-date').value = todayISO();
            $('ms-submit').textContent = 'Thêm';
            $('ms-cancel').hidden = true;
        }
    }

    $('cd-date').value = todayISO();
    $('ms-date').value = todayISO();

    const saveAppState = subscribeAppState(next => {
        appState = next;
        renderMilestones();
    });

    function renderMilestones() {
        const now = new Date();
        const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

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
                await saveAppState({ countdownEvents: next });
                toast('Đã xóa cột mốc.');
            });
            actions.append(editBtn, delBtn);
            li.append(iconEl, info, badge, actions);
            autoListEl.append(li);
        });
        cdEmptyEl.hidden = cdItems.length > 0;

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
                await saveAppState({ customMilestones: next });
                toast('Đã xóa kỷ niệm.');
            });
            actions.append(editBtn, del);
            li.append(info, badge, actions);
            customListEl.append(li);
        });
        customEmptyEl.hidden = customs.length > 0;
    }

    $('cd-cancel').addEventListener('click', () => setCdEditing(null));
    $('countdown-form').addEventListener('submit', async e => {
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
        await saveAppState({ countdownEvents: current.map(x => `${x.icon}|${x.dateStr}|${x.title}`).join('\n') });
        toast('Đã lưu cột mốc đếm ngược 💕');
    });

    $('cd-reset-btn').addEventListener('click', async () => {
        setCdEditing(null);
        await saveAppState({ countdownEvents: buildDefaultCountdowns() });
        toast('Đã khôi phục các cột mốc mặc định.');
    });

    $('ms-cancel').addEventListener('click', () => setMsEditing(null));
    $('milestone-form').addEventListener('submit', async e => {
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
        await saveAppState({ customMilestones: current.map(x => `${x.dateStr}|${x.title}`).join('\n') });
        toast('Đã lưu ngày kỷ niệm 💕');
    });
})();

