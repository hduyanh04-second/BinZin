// ===== Trang chủ (index.html): Ảnh bìa đôi & Trạng thái hôm nay (Mood / Status) =====
(() => {
    const { toast, loadImage, compressImage, firebaseReady, subscribeAppState } = window.BinZin;

    // 1. Ảnh bìa đôi (lưu trên Firestore: profiles/home)
    const heroImg = $('hero-img'), heroPlaceholder = $('hero-placeholder'), heroInput = $('hero-input'), heroRemove = $('hero-remove');
    const HERO_KEY = 'binzin-home-photo';
    const HERO_SPEC = { maxSide: 1200, quality: .85, maxChars: 700000 };

    const showHero = src => {
        if (src) { heroImg.src = src; heroImg.hidden = false; heroPlaceholder.hidden = true; heroRemove.hidden = false }
        else { heroImg.removeAttribute('src'); heroImg.hidden = true; heroPlaceholder.hidden = false; heroRemove.hidden = true }
    };

    let saveHero;
    if (firebaseReady) {
        const docRef = firebase.firestore().collection('profiles').doc('home');
        docRef.onSnapshot(snap => { showHero(snap.exists ? (snap.data().photo || '') : '') }, err => console.error(err));
        saveHero = photo => docRef.set({ name: 'Home', bio: '', about: '', likes: '', photo, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
        showHero(localStorage.getItem(HERO_KEY) || '');
        saveHero = async photo => {
            if (photo) localStorage.setItem(HERO_KEY, photo); else localStorage.removeItem(HERO_KEY);
            showHero(photo);
        };
    }

    heroInput.addEventListener('change', async () => {
        const file = heroInput.files[0];
        heroInput.value = '';
        if (!file || !file.type.startsWith('image/')) return;
        toast('Đang tải ảnh bìa lên…');
        try {
            const im = await loadImage(file), photo = compressImage(im, HERO_SPEC);
            await saveHero(photo); showHero(photo); toast('Đã cập nhật ảnh bìa 💕');
        } catch (err) {
            console.error(err);
            toast(err?.code === 'permission-denied'
                ? 'Hãy cập nhật Rules trong README-chat.md nha!'
                : 'Đổi ảnh bìa chưa được, thử lại nha 🥲', 5500);
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

    // 2. Trạng thái hôm nay (Mood / Status của Bin & Zin)
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
    let moodState = {}, activeMoodPerson = 'bin';

    const saveAppState = subscribeAppState(next => {
        moodState = next;
        $('mood-emoji-bin').textContent = moodState.binEmoji || '💭';
        $('mood-text-bin').textContent = moodState.binText || 'Nhớ Zin nhiều lắm 💕';
        $('mood-emoji-zin').textContent = moodState.zinEmoji || '🧋';
        $('mood-text-zin').textContent = moodState.zinText || 'Thèm trà sữa cùng Bin';
    });

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
            $('mood-emoji-input').value = activeMoodPerson === 'bin' ? (moodState.binEmoji || '💭') : (moodState.zinEmoji || '🧋');
            $('mood-text-input').value = activeMoodPerson === 'bin' ? (moodState.binText || '') : (moodState.zinText || '');
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
        try { await saveAppState(patch); toast('Đã cập nhật trạng thái 💕') }
        catch (err) { console.error(err); toast('Lưu trạng thái chưa được, thử lại nha.') }
    });
})();
