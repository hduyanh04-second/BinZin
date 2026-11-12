// ===== Trang Profile: xem, chỉnh sửa thông tin và đổi ảnh đại diện của Bin & Zin trên Firebase =====
const { toast, loadImage, compressImage: compress, firebaseReady } = window.BinZin;
const LOCAL_KEY = 'binzin-profiles';
const AVATAR = { maxSide: 900, quality: .84, maxChars: 650000 };

// Thông tin mặc định ban đầu của Bin và Zin
const DEFAULTS = {
    bin: {
        name: 'Bin 🧸',
        bio: 'IT nerd của Zin, chuyên chọc Zin điên.',
        about: 'Họ và tên: Hoàng Hải Duy Anh\nSinh nhật: 31/01/2004\nGia đình: Bố Hải Anh, Mẹ Hoa, Em Châu Anh (Sâu)\nCông việc: IT nerd',
        likes: 'Keycap, mai ni cáp, chơi game, ăn và ngủ, thích chọc điên Zin.',
        photo: ''
    },
    zin: {
        name: 'Zin 🌷',
        bio: 'Cô sinh viên năng động, business girl tương lai.',
        about: 'Họ và tên: Nguyễn Mai Trang\nSinh nhật: 08/09/2006\nGia đình: Bố Sơn, Mẹ Nghĩa, Chị Phương\nCông việc: Cô sinh viên năng động / Business girl tương lai',
        likes: 'Thích xanh navy, đồ cute dùng hằng ngày, pijama, thích mắng Bin và thích Bin chiều chuộng.',
        photo: ''
    }
};

let activePerson = 'bin', editing = false;
const profiles = { bin: { ...DEFAULTS.bin }, zin: { ...DEFAULTS.zin } };

const statusEl = $('profile-status'), card = $('profile-card');
const viewPane = $('view-pane'), editForm = $('edit-form'), editBtn = $('edit-btn');
const viewPhoto = $('view-photo'), viewPlaceholder = $('view-placeholder'), placeholderEmoji = $('placeholder-emoji');
const avatarInput = $('avatar-input'), removePhotoBtn = $('remove-photo-btn');

// ---------- Hiển thị ----------
function render() {
    const p = profiles[activePerson];
    $('view-name').textContent = p.name;
    $('view-bio').textContent = p.bio;
    $('view-about').textContent = p.about;
    $('view-likes').textContent = p.likes;

    placeholderEmoji.textContent = activePerson === 'bin' ? '🧸' : '🌷';
    if (p.photo) {
        viewPhoto.src = p.photo; viewPhoto.alt = p.name;
        viewPhoto.hidden = false; viewPlaceholder.hidden = true; removePhotoBtn.hidden = false;
    } else {
        viewPhoto.removeAttribute('src');
        viewPhoto.hidden = true; viewPlaceholder.hidden = false; removePhotoBtn.hidden = true;
    }

    if (editing) fillForm();
}

function fillForm() {
    const p = profiles[activePerson];
    $('input-name').value = p.name;
    $('input-bio').value = p.bio;
    $('input-about').value = p.about;
    $('input-likes').value = p.likes;
}

function setEditing(on) {
    editing = on;
    viewPane.hidden = on;
    editForm.hidden = !on;
    editBtn.hidden = on;
    if (on) { fillForm(); $('input-name').focus() }
}

// ---------- Chuyển tab Bin / Zin ----------
document.querySelectorAll('[data-person]').forEach(btn => {
    btn.addEventListener('click', () => {
        activePerson = btn.dataset.person;
        document.querySelectorAll('[data-person]').forEach(b => {
            const active = b === btn;
            b.setAttribute('aria-selected', String(active));
            b.classList.toggle('primary', active);
            b.classList.toggle('secondary', !active);
        });
        card.setAttribute('aria-labelledby', btn.id);
        setEditing(false);
        render();
    });
});

editBtn.addEventListener('click', () => setEditing(true));
$('cancel-btn').addEventListener('click', () => setEditing(false));

// ---------- Kết nối Firebase ----------
let saveProfile;

if (firebaseReady) {
    const col = firebase.firestore().collection('profiles');
    ['bin', 'zin'].forEach(key => {
        col.doc(key).onSnapshot(snap => {
            if (snap.exists) {
                const d = snap.data();
                profiles[key] = {
                    name: d.name ?? DEFAULTS[key].name,
                    bio: d.bio ?? DEFAULTS[key].bio,
                    about: d.about ?? DEFAULTS[key].about,
                    likes: d.likes ?? DEFAULTS[key].likes,
                    photo: d.photo ?? ''
                };
                if (key === activePerson) render();
            }
        }, err => {
            console.error(err);
            statusEl.textContent = err?.code === 'permission-denied'
                ? 'Chưa có quyền đọc/ghi profiles trên Firestore — hãy cập nhật Rules trong README-chat.md rồi bấm Publish nha.'
                : 'Không tải được hồ sơ từ Firebase.';
        });
    });
    saveProfile = async (key, data) => {
        const next = { ...profiles[key], ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        await col.doc(key).set(next);
    };
} else {
    statusEl.textContent = 'Chưa cấu hình Firebase — thay đổi đang tạm lưu trên máy này.';
    const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    if (saved.bin) profiles.bin = { ...DEFAULTS.bin, ...saved.bin };
    if (saved.zin) profiles.zin = { ...DEFAULTS.zin, ...saved.zin };
    saveProfile = async (key, data) => {
        profiles[key] = { ...profiles[key], ...data };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(profiles));
        render();
    };
}

render();

// ---------- Lưu thông tin chỉnh sửa ----------
editForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('input-name').value.trim();
    const bio = $('input-bio').value.trim();
    const about = $('input-about').value.trim();
    const likes = $('input-likes').value.trim();
    if (!name || !bio || !about || !likes) return;

    const saveBtn = $('save-btn');
    saveBtn.disabled = true;
    try {
        await saveProfile(activePerson, { name, bio, about, likes });
        profiles[activePerson] = { ...profiles[activePerson], name, bio, about, likes };
        setEditing(false);
        render();
        toast('Đã lưu hồ sơ 💕');
    } catch (err) {
        console.error(err);
        toast(err?.code === 'permission-denied'
            ? 'Firestore chặn lưu — hãy Publish lại Rules mới trong README-chat.md nha!'
            : 'Lưu chưa được, thử lại nha 🥲', 5500);
    } finally {
        saveBtn.disabled = false;
    }
});

// ---------- Nén và đổi ảnh đại diện ----------
avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files[0];
    avatarInput.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const key = activePerson;
    toast('Đang tải ảnh đại diện…');
    try {
        const img = await loadImage(file);
        const photo = compress(img, AVATAR);
        await saveProfile(key, { photo });
        profiles[key].photo = photo;
        if (key === activePerson) render();
        toast('Đã cập nhật ảnh đại diện 💕');
    } catch (err) {
        console.error(err);
        toast(err?.code === 'permission-denied'
            ? 'Firestore chặn lưu ảnh — hãy Publish lại Rules mới trong README-chat.md nha!'
            : 'Đổi ảnh chưa được, thử lại nha 🥲', 5500);
    }
});

removePhotoBtn.addEventListener('click', async () => {
    const key = activePerson;
    toast('Đang xóa ảnh đại diện…');
    try {
        await saveProfile(key, { photo: '' });
        profiles[key].photo = '';
        if (key === activePerson) render();
        toast('Đã xóa ảnh đại diện.');
    } catch (err) {
        console.error(err);
        toast('Xóa ảnh chưa được, thử lại nha.');
    }
});

