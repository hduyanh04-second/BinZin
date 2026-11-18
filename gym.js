// ===== Trang Tập Gym (gym.html): Chuỗi điểm danh, Mục tiêu, Lịch tập tuần & Nhật ký / Kỷ lục cá nhân =====
(() => {
    const { toast, todayISO, firebaseReady } = window.BinZin;
    const LOCAL_KEY = 'binzin-gym-v1';
    const DAY_ORDER = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const DAY_LABELS = { T2: 'Thứ 2', T3: 'Thứ 3', T4: 'Thứ 4', T5: 'Thứ 5', T6: 'Thứ 6', T7: 'Thứ 7', CN: 'Chủ Nhật' };
    const SESSION_ORDER = ['1', '2', '3', '4', '5'];
    const SESSION_LABELS = { '1': 'Buổi 1', '2': 'Buổi 2', '3': 'Buổi 3', '4': 'Buổi 4', '5': 'Buổi 5' };
    const LEGACY_SESSION = { T2: '1', T3: '2', T4: '3', T5: '4', T6: '5', T7: '5', CN: '5' };
    const normalizeSession = v => SESSION_LABELS[v] ? v : (LEGACY_SESSION[v] || '1');

    const DEFAULT_GYM = {
        bin: {
            weeklyTarget: 4,
            checkins: [],
            goals: [
                { id: 'g1', title: 'Đi tập đều 4 buổi / tuần', target: 'Không bỏ buổi nào', done: false },
                { id: 'g2', title: 'Đẩy ngực (Bench Press) chạm mốc mới', target: '70kg x 5 reps', done: false }
            ],
            schedule: [
                { id: 's1', day: '1', focus: 'Ngực + Tay sau (Push)', note: 'Bench Press, Incline Dumbbell, Dips' },
                { id: 's2', day: '2', focus: 'Lưng + Tay trước (Pull)', note: 'Lat Pulldown, Barbell Row, Bicep Curl' },
                { id: 's3', day: '3', focus: 'Chân + Vai (Legs & Shoulders)', note: 'Squat, RDL, Overhead Press' },
                { id: 's4', day: '4', focus: 'Fullbody + Cardio cùng Zin', note: 'Chạy bộ 20p + Gập bụng' }
            ],
            prs: [
                { id: 'p1', exercise: 'Squat', record: '80kg × 5 lần', date: todayISO() },
                { id: 'p2', exercise: 'Bench Press', record: '60kg × 6 lần', date: todayISO() }
            ],
            logs: []
        },
        zin: {
            weeklyTarget: 4,
            checkins: [],
            goals: [
                { id: 'z1', title: 'Duy trì tập 4 buổi / tuần cùng Bin', target: 'Thưởng trà sữa cuối tuần', done: false },
                { id: 'z2', title: 'Giữ eo thon & dáng xinh', target: 'Plank 2 phút mỗi buổi', done: false }
            ],
            schedule: [
                { id: 'zs1', day: '1', focus: 'Mông + Đùi sau (Glutes & Hamstrings)', note: 'Hip Thrust, RDL, Kickback' },
                { id: 'zs2', day: '2', focus: 'Lưng + Tay thon + Bụng', note: 'Seated Row, Plank, Crunch' },
                { id: 'zs3', day: '3', focus: 'Thân dưới (Squat & Lunges)', note: 'Goblet Squat, Bulgarian Split Squat' },
                { id: 'zs4', day: '4', focus: 'Cardio + Giãn cơ cùng Bin', note: 'Đi bộ dốc 25p + Stretching' }
            ],
            prs: [
                { id: 'zp1', exercise: 'Hip Thrust', record: '50kg × 10 lần', date: todayISO() },
                { id: 'zp2', exercise: 'Plank', record: '1 phút 45 giây', date: todayISO() }
            ],
            logs: []
        }
    };

    const state = {
        bin: structuredClone(DEFAULT_GYM.bin),
        zin: structuredClone(DEFAULT_GYM.zin)
    };
    let activePerson = 'bin';
    let editGoalId = null, editSchId = null, editPrId = null, editLogId = null;

    // ---------- Kết nối Firebase (lưu vào profiles/gym-bin & profiles/gym-zin) ----------
    let savePersonGym;
    const statusEl = $('gym-status');

    function parseDoc(key, raw) {
        try {
            const p = JSON.parse(raw || '{}');
            return {
                weeklyTarget: Number(p.weeklyTarget) || DEFAULT_GYM[key].weeklyTarget,
                checkins: Array.isArray(p.checkins) ? p.checkins : DEFAULT_GYM[key].checkins,
                goals: Array.isArray(p.goals) ? p.goals : DEFAULT_GYM[key].goals,
                schedule: Array.isArray(p.schedule) ? p.schedule : DEFAULT_GYM[key].schedule,
                prs: Array.isArray(p.prs) ? p.prs : DEFAULT_GYM[key].prs,
                logs: Array.isArray(p.logs) ? p.logs : DEFAULT_GYM[key].logs
            };
        } catch {
            return structuredClone(DEFAULT_GYM[key]);
        }
    }

    // Đọc cache cục bộ ngay lập tức để không bị giật lag khi mở trang
    try {
        const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
        if (local.bin) state.bin = parseDoc('bin', JSON.stringify(local.bin));
        if (local.zin) state.zin = parseDoc('zin', JSON.stringify(local.zin));
    } catch { }
    const saveLocalCache = () => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)) } catch { } };

    if (firebaseReady) {
        const col = firebase.firestore().collection('profiles');
        ['bin', 'zin'].forEach(key => {
            col.doc('gym-' + key).onSnapshot(snap => {
                if (snap.exists) {
                    const d = snap.data();
                    state[key] = parseDoc(key, (d.about || '') + (d.likes || ''));
                    saveLocalCache();
                    renderAll();
                }
            }, err => {
                console.error(err);
                if (err?.code === 'permission-denied') {
                    statusEl.textContent = 'Hãy cập nhật Rules trong README-chat.md (thêm gym-bin, gym-zin vào profiles) rồi bấm Publish nha!';
                }
            });
        });

        savePersonGym = async key => {
            saveLocalCache();
            const json = JSON.stringify(state[key]);
            // Chia vào about (<=1500) + likes (<=1000) để tận dụng tối đa 2500 ký tự của schema profiles
            const part1 = json.slice(0, 1480);
            const part2 = json.slice(1480, 2460);
            await col.doc('gym-' + key).set({
                name: key === 'bin' ? 'Gym Bin' : 'Gym Zin',
                bio: `Streak: ${calcStreak(state[key].checkins)} ngày`,
                about: part1,
                likes: part2,
                photo: '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        };
    } else {
        savePersonGym = async () => saveLocalCache();
    }

    // ---------- 1. Tính chuỗi ngày tập (Streak) & Điểm danh 7 ngày trong tuần ----------
    const isoFromDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    function getWeekDates() {
        const now = new Date();
        const day = now.getDay(); // 0=CN, 1=T2...
        const diffToMon = day === 0 ? -6 : 1 - day;
        const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
        return DAY_ORDER.map((code, i) => {
            const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
            return { code, iso: isoFromDate(d), dayNum: d.getDate() };
        });
    }

    function calcStreak(checkins) {
        const set = new Set(checkins);
        const now = new Date();
        let cur = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (!set.has(isoFromDate(cur))) {
            cur.setDate(cur.getDate() - 1);
            if (!set.has(isoFromDate(cur))) return 0;
        }
        let streak = 0;
        while (set.has(isoFromDate(cur))) {
            streak++;
            cur.setDate(cur.getDate() - 1);
        }
        return streak;
    }

    function renderCheckinCard(key) {
        const data = state[key];
        const set = new Set(data.checkins);
        const today = todayISO();
        const week = getWeekDates();
        const doneThisWeek = week.filter(w => set.has(w.iso)).length;
        const target = data.weeklyTarget || 4;
        const pct = Math.min(100, Math.round((doneThisWeek / target) * 100));
        const streak = calcStreak(data.checkins);

        $(`streak-${key}`).textContent = `🔥 ${streak} ngày liên tiếp`;
        $(`week-progress-${key}`).textContent = `Tuần này: ${doneThisWeek}/${target} buổi (${pct}%)`;
        $(`week-bar-${key}`).style.width = `${pct}%`;

        const dotsHost = $(`week-dots-${key}`);
        dotsHost.replaceChildren();
        week.forEach(w => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const checked = set.has(w.iso);
            const isToday = w.iso === today;
            btn.className = 'gym-day-dot' + (checked ? ' checked' : '') + (isToday ? ' today' : '');
            btn.title = `${DAY_LABELS[w.code]} (${w.iso}) — bấm để bật/tắt điểm danh`;
            btn.innerHTML = `<span class="text-[11px] font-bold">${w.code}</span><span class="text-xs">${checked ? '✓' : w.dayNum}</span>`;
            btn.addEventListener('click', () => toggleDateCheckin(key, w.iso));
            dotsHost.append(btn);
        });

        const checkinBtn = $(`checkin-btn-${key}`);
        const checkedToday = set.has(today);
        checkinBtn.textContent = checkedToday ? '✅ Đã điểm danh hôm nay (Bấm để hoàn tác)' : '💪 Điểm danh hôm nay';
        checkinBtn.classList.toggle('primary', !checkedToday);
        checkinBtn.classList.toggle('secondary', checkedToday);
    }

    async function toggleDateCheckin(key, iso) {
        const list = state[key].checkins;
        const idx = list.indexOf(iso);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(iso);
        list.sort();
        if (list.length > 90) list.splice(0, list.length - 90);
        renderCheckinCard(key);
        try {
            await savePersonGym(key);
            toast(idx >= 0 ? 'Đã bỏ điểm danh.' : `Giỏi quá! ${key === 'bin' ? 'Bin' : 'Zin'} đã điểm danh tập gym 💪🔥`);
        } catch (err) {
            console.error(err);
            toast('Lưu điểm danh chưa được, kiểm tra lại Rules nha.');
        }
    }

    $('checkin-btn-bin').addEventListener('click', () => toggleDateCheckin('bin', todayISO()));
    $('checkin-btn-zin').addEventListener('click', () => toggleDateCheckin('zin', todayISO()));

    // ---------- Chuyển tab Sổ tập của Bin / Zin ----------
    document.querySelectorAll('[data-gym-person]').forEach(btn => {
        btn.addEventListener('click', () => {
            activePerson = btn.dataset.gymPerson;
            document.querySelectorAll('[data-gym-person]').forEach(b => {
                const active = b === btn;
                b.setAttribute('aria-selected', String(active));
                b.classList.toggle('primary', active);
                b.classList.toggle('secondary', !active);
            });
            $('active-person-label').textContent = activePerson === 'bin' ? 'Đang xem: 🐻 Bin' : 'Đang xem: 🌷 Zin';
            resetAllForms();
            renderPersonSections();
        });
    });

    $('weekly-target-select').addEventListener('change', async () => {
        state[activePerson].weeklyTarget = Number($('weekly-target-select').value) || 4;
        renderCheckinCard(activePerson);
        await savePersonGym(activePerson);
        toast('Đã cập nhật mục tiêu số buổi/tuần 🎯');
    });

    // ---------- 2. Mục tiêu (Goals CRUD) ----------
    function setGoalEditing(item) {
        if (item) {
            editGoalId = item.id;
            $('goal-title').value = item.title;
            $('goal-target').value = item.target || '';
            $('goal-submit').textContent = 'Lưu';
            $('goal-cancel').hidden = false;
            $('goal-title').focus();
        } else {
            editGoalId = null;
            $('goal-title').value = '';
            $('goal-target').value = '';
            $('goal-submit').textContent = 'Thêm';
            $('goal-cancel').hidden = true;
        }
    }
    $('goal-cancel').addEventListener('click', () => setGoalEditing(null));

    $('goal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const title = $('goal-title').value.trim();
        const target = $('goal-target').value.trim();
        if (!title) return;
        const goals = state[activePerson].goals;
        if (editGoalId) {
            const g = goals.find(x => x.id === editGoalId);
            if (g) { g.title = title; g.target = target }
        } else {
            goals.push({ id: 'g' + Date.now(), title, target, done: false });
        }
        setGoalEditing(null);
        renderGoals();
        await savePersonGym(activePerson);
        toast('Đã lưu mục tiêu 🎯');
    });

    function renderGoals() {
        const goals = state[activePerson].goals;
        const ul = $('goal-list');
        ul.replaceChildren();
        goals.forEach(g => {
            const li = document.createElement('li');
            li.className = 'milestone-item';
            const checkBtn = document.createElement('button');
            checkBtn.type = 'button';
            checkBtn.className = 'gym-check-circle' + (g.done ? ' done' : '');
            checkBtn.textContent = g.done ? '✓' : '';
            checkBtn.setAttribute('aria-label', 'Đánh dấu hoàn thành');
            checkBtn.addEventListener('click', async () => {
                g.done = !g.done;
                renderGoals();
                await savePersonGym(activePerson);
            });

            const info = document.createElement('div');
            info.className = 'min-w-0 flex-1';
            const t = document.createElement('p');
            t.className = 'font-bold text-[#713d53]' + (g.done ? ' line-through opacity-60' : '');
            t.textContent = g.title;
            info.append(t);
            if (g.target) {
                const sub = document.createElement('p');
                sub.className = 'text-xs text-[#876777]';
                sub.textContent = `🎯 ${g.target}`;
                info.append(sub);
            }

            const actions = document.createElement('div');
            actions.className = 'flex gap-1';
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'secondary text-xs !py-1 !px-2';
            editBtn.textContent = '✏️';
            editBtn.addEventListener('click', () => setGoalEditing(g));

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'secondary text-xs !py-1 !px-2';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', async () => {
                state[activePerson].goals = goals.filter(x => x.id !== g.id);
                if (editGoalId === g.id) setGoalEditing(null);
                renderGoals();
                await savePersonGym(activePerson);
                toast('Đã xóa mục tiêu.');
            });
            actions.append(editBtn, delBtn);
            li.append(checkBtn, info, actions);
            ul.append(li);
        });
        $('goal-empty').hidden = goals.length > 0;
    }

    // ---------- 3. Lịch tập trong tuần (Buổi 1 - Buổi 5 CRUD) ----------
    function setSchEditing(item) {
        if (item) {
            editSchId = item.id;
            $('sch-day').value = normalizeSession(item.day);
            $('sch-focus').value = item.focus;
            $('sch-note').value = item.note || '';
            $('sch-submit').textContent = 'Lưu';
            $('sch-cancel').hidden = false;
            $('sch-focus').focus();
        } else {
            editSchId = null;
            $('sch-day').value = '1';
            $('sch-focus').value = '';
            $('sch-note').value = '';
            $('sch-submit').textContent = 'Thêm';
            $('sch-cancel').hidden = true;
        }
    }
    $('sch-cancel').addEventListener('click', () => setSchEditing(null));

    $('schedule-form').addEventListener('submit', async e => {
        e.preventDefault();
        const day = normalizeSession($('sch-day').value);
        const focus = $('sch-focus').value.trim();
        const note = $('sch-note').value.trim();
        if (!focus) return;
        const schedule = state[activePerson].schedule;
        if (editSchId) {
            const s = schedule.find(x => x.id === editSchId);
            if (s) { s.day = day; s.focus = focus; s.note = note }
        } else {
            schedule.push({ id: 's' + Date.now(), day, focus, note });
        }
        schedule.sort((a, b) => SESSION_ORDER.indexOf(normalizeSession(a.day)) - SESSION_ORDER.indexOf(normalizeSession(b.day)));
        setSchEditing(null);
        renderSchedule();
        await savePersonGym(activePerson);
        toast('Đã lưu lịch tập trong tuần 📋');
    });

    function renderSchedule() {
        const schedule = state[activePerson].schedule;
        schedule.sort((a, b) => SESSION_ORDER.indexOf(normalizeSession(a.day)) - SESSION_ORDER.indexOf(normalizeSession(b.day)));
        const ul = $('schedule-list');
        ul.replaceChildren();
        schedule.forEach(s => {
            const li = document.createElement('li');
            li.className = 'milestone-item';
            const sessionKey = normalizeSession(s.day);

            const dayBadge = document.createElement('span');
            dayBadge.className = 'milestone-badge';
            dayBadge.textContent = SESSION_LABELS[sessionKey] || 'Buổi 1';

            const info = document.createElement('div');
            info.className = 'min-w-0 flex-1';
            const t = document.createElement('p');
            t.className = 'font-bold text-[#713d53]';
            t.textContent = s.focus;
            info.append(t);
            if (s.note) {
                const sub = document.createElement('p');
                sub.className = 'text-xs text-[#876777]';
                sub.textContent = s.note;
                info.append(sub);
            }

            const actions = document.createElement('div');
            actions.className = 'flex gap-1';
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'secondary text-xs !py-1 !px-2';
            editBtn.textContent = '✏️';
            editBtn.addEventListener('click', () => setSchEditing(s));

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'secondary text-xs !py-1 !px-2';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', async () => {
                state[activePerson].schedule = schedule.filter(x => x.id !== s.id);
                if (editSchId === s.id) setSchEditing(null);
                renderSchedule();
                await savePersonGym(activePerson);
                toast('Đã xóa buổi tập.');
            });
            actions.append(editBtn, delBtn);
            li.append(dayBadge, info, actions);
            ul.append(li);
        });
        $('schedule-empty').hidden = schedule.length > 0;
    }

    // ---------- 4A. Kỷ lục cá nhân (PRs CRUD) ----------
    const fmtDateVN = iso => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return d && m && y ? `${d}/${m}/${y}` : iso;
    };

    function setPrEditing(item) {
        if (item) {
            editPrId = item.id;
            $('pr-exercise').value = item.exercise;
            $('pr-record').value = item.record;
            $('pr-date').value = item.date || todayISO();
            $('pr-submit').textContent = 'Lưu';
            $('pr-cancel').hidden = false;
            $('pr-exercise').focus();
        } else {
            editPrId = null;
            $('pr-exercise').value = '';
            $('pr-record').value = '';
            $('pr-date').value = todayISO();
            $('pr-submit').textContent = 'Thêm';
            $('pr-cancel').hidden = true;
        }
    }
    $('pr-cancel').addEventListener('click', () => setPrEditing(null));

    $('pr-form').addEventListener('submit', async e => {
        e.preventDefault();
        const exercise = $('pr-exercise').value.trim();
        const record = $('pr-record').value.trim();
        const date = $('pr-date').value || todayISO();
        if (!exercise || !record) return;
        const prs = state[activePerson].prs;
        if (editPrId) {
            const p = prs.find(x => x.id === editPrId);
            if (p) { p.exercise = exercise; p.record = record; p.date = date }
        } else {
            prs.unshift({ id: 'p' + Date.now(), exercise, record, date });
        }
        setPrEditing(null);
        renderPRs();
        await savePersonGym(activePerson);
        toast('Đã lưu kỷ lục cá nhân 🏆');
    });

    function renderPRs() {
        const prs = state[activePerson].prs;
        const ul = $('pr-list');
        ul.replaceChildren();
        prs.forEach(p => {
            const li = document.createElement('li');
            li.className = 'milestone-item';
            const icon = document.createElement('span');
            icon.className = 'text-2xl';
            icon.textContent = '🏆';

            const info = document.createElement('div');
            info.className = 'min-w-0 flex-1';
            const t = document.createElement('p');
            t.className = 'font-bold text-[#713d53]';
            t.textContent = p.exercise;
            const sub = document.createElement('p');
            sub.className = 'text-xs text-[#876777]';
            sub.textContent = fmtDateVN(p.date);
            info.append(t, sub);

            const badge = document.createElement('span');
            badge.className = 'milestone-badge';
            badge.textContent = p.record;

            const actions = document.createElement('div');
            actions.className = 'flex gap-1';
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'secondary text-xs !py-1 !px-2';
            editBtn.textContent = '✏️';
            editBtn.addEventListener('click', () => setPrEditing(p));

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'secondary text-xs !py-1 !px-2';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', async () => {
                state[activePerson].prs = prs.filter(x => x.id !== p.id);
                if (editPrId === p.id) setPrEditing(null);
                renderPRs();
                await savePersonGym(activePerson);
                toast('Đã xóa kỷ lục.');
            });
            actions.append(editBtn, delBtn);
            li.append(icon, info, badge, actions);
            ul.append(li);
        });
        $('pr-empty').hidden = prs.length > 0;
    }

    // ---------- 4B. Nhật ký bài tập (Workout Logs CRUD) ----------
    function setLogEditing(item) {
        if (item) {
            editLogId = item.id;
            $('log-exercise').value = item.exercise;
            $('log-detail').value = item.detail;
            $('log-date').value = item.date || todayISO();
            $('log-submit').textContent = 'Lưu';
            $('log-cancel').hidden = false;
            $('log-exercise').focus();
        } else {
            editLogId = null;
            $('log-exercise').value = '';
            $('log-detail').value = '';
            $('log-date').value = todayISO();
            $('log-submit').textContent = 'Ghi nhật ký';
            $('log-cancel').hidden = true;
        }
    }
    $('log-cancel').addEventListener('click', () => setLogEditing(null));

    $('log-form').addEventListener('submit', async e => {
        e.preventDefault();
        const exercise = $('log-exercise').value.trim();
        const detail = $('log-detail').value.trim();
        const date = $('log-date').value || todayISO();
        if (!exercise || !detail) return;
        const logs = state[activePerson].logs;
        if (editLogId) {
            const l = logs.find(x => x.id === editLogId);
            if (l) { l.exercise = exercise; l.detail = detail; l.date = date }
        } else {
            logs.unshift({ id: 'l' + Date.now(), exercise, detail, date });
            if (logs.length > 40) logs.pop();
            // Tự động đánh dấu điểm danh cho ngày ghi nhật ký nếu chưa có
            if (!state[activePerson].checkins.includes(date)) {
                state[activePerson].checkins.push(date);
                state[activePerson].checkins.sort();
            }
        }
        setLogEditing(null);
        renderAll();
        await savePersonGym(activePerson);
        toast('Đã ghi nhật ký bài tập 📓💪');
    });

    function renderLogs() {
        const logs = state[activePerson].logs;
        const ul = $('log-list');
        ul.replaceChildren();
        logs.forEach(l => {
            const li = document.createElement('li');
            li.className = 'milestone-item';
            const info = document.createElement('div');
            info.className = 'min-w-0 flex-1';
            const t = document.createElement('p');
            t.className = 'font-bold text-[#713d53]';
            t.textContent = `🏋️ ${l.exercise}`;
            const sub = document.createElement('p');
            sub.className = 'text-xs text-[#876777]';
            sub.textContent = `${l.detail} · ${fmtDateVN(l.date)}`;
            info.append(t, sub);

            const actions = document.createElement('div');
            actions.className = 'flex gap-1';
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'secondary text-xs !py-1 !px-2';
            editBtn.textContent = '✏️';
            editBtn.addEventListener('click', () => setLogEditing(l));

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'secondary text-xs !py-1 !px-2';
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', async () => {
                state[activePerson].logs = logs.filter(x => x.id !== l.id);
                if (editLogId === l.id) setLogEditing(null);
                renderLogs();
                await savePersonGym(activePerson);
                toast('Đã xóa nhật ký.');
            });
            actions.append(editBtn, delBtn);
            li.append(info, actions);
            ul.append(li);
        });
        $('log-empty').hidden = logs.length > 0;
    }

    function resetAllForms() {
        setGoalEditing(null);
        setSchEditing(null);
        setPrEditing(null);
        setLogEditing(null);
    }

    function renderPersonSections() {
        $('weekly-target-select').value = String(state[activePerson].weeklyTarget || 4);
        renderGoals();
        renderSchedule();
        renderPRs();
        renderLogs();
    }

    function renderAll() {
        renderCheckinCard('bin');
        renderCheckinCard('zin');
        renderPersonSections();
    }

    resetAllForms();
    renderAll();
})();
