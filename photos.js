// ===== Trang Photographs: tải ảnh lên / xem / xóa, lưu trên Firebase Firestore =====
// Ảnh được nén ngay trên trình duyệt rồi lưu thành 2 phần:
//   photos/{id}     -> ảnh thu nhỏ + chú thích (tải nhanh cho lưới ảnh)
//   photoData/{id}  -> ảnh lớn (~1600px), chỉ tải khi mở xem
const { toast, loadImage, compressImage: compress, firebaseReady } = window.BinZin;
const NAME_KEY = 'binzin-chat-name';        // dùng chung lựa chọn Bin/Zin với trang chat
const PAGE_SIZE = 48;
const FULL = { maxSide: 1600, quality: .85, maxChars: 900000 };   // < 1MB / document Firestore
const THUMB = { maxSide: 480, quality: .72, maxChars: 150000 };

const form = $('upload-form'), fileInput = $('photo-input'), dropZone = $('drop-zone'), previewList = $('preview-list');
const fileSummary = $('file-summary'), captionInput = $('photo-caption'), uploadBtn = $('upload-button'), statusEl = $('photo-status');
const gallery = $('gallery'), emptyEl = $('gallery-empty'), countEl = $('photo-count'), loadMoreBtn = $('load-more');
const uploaderRadios = [...document.querySelectorAll('input[name="uploader"]')];

let selectedFiles = [], photos = [], limitCount = PAGE_SIZE, unsubscribe = null, busy = false;
const fullCache = new Map();

// ---------- Người đăng (nhớ lựa chọn trên máy) ----------
const savedName = localStorage.getItem(NAME_KEY);
uploaderRadios.forEach(r => { r.checked = r.value === savedName; r.addEventListener('change', () => localStorage.setItem(NAME_KEY, r.value)) });
const uploader = () => uploaderRadios.find(r => r.checked)?.value || '';

// ---------- Firebase ----------
let db, photosCol, dataCol;
if (firebaseReady) {
    db = firebase.firestore(); photosCol = db.collection('photos'); dataCol = db.collection('photoData');
    subscribe();
} else {
    statusEl.textContent = 'Chưa cấu hình Firebase (firebase-config.js) nên chưa tải ảnh lên được.';
    emptyEl.hidden = false;
}

function subscribe() {
    if (unsubscribe) unsubscribe();
    unsubscribe = photosCol.orderBy('createdAt', 'desc').limit(limitCount).onSnapshot(snap => {
        photos = snap.docs.map(doc => {
            const d = doc.data({ serverTimestamps: 'estimate' });
            return { id: doc.id, thumb: d.thumb, caption: d.caption || '', uploader: d.uploader || '', createdAt: d.createdAt ? d.createdAt.toDate() : new Date() };
        });
        loadMoreBtn.hidden = snap.size < limitCount;
        renderGallery();
        if (lbIndex >= 0) { lbIndex = photos.findIndex(p => p.id === lbId); lbIndex >= 0 ? showLightbox(lbIndex) : closeLightbox() }
    }, err => { console.error(err); statusEl.textContent = 'Không tải được ảnh (kiểm tra luật Firestore cho photos).' });
}
loadMoreBtn.addEventListener('click', () => { limitCount += PAGE_SIZE; subscribe() });

// ---------- Lưới ảnh ----------
const fmtDate = d => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function renderGallery() {
    gallery.replaceChildren();
    photos.forEach((p, i) => {
        const li = document.createElement('li'); li.className = 'photo-card';
        const open = document.createElement('button'); open.type = 'button'; open.className = 'photo-open';
        open.setAttribute('aria-label', 'Xem ảnh' + (p.caption ? ': ' + p.caption : ''));
        const img = document.createElement('img'); img.src = p.thumb; img.alt = p.caption || 'Ảnh kỷ niệm'; img.loading = 'lazy';
        open.append(img); open.addEventListener('click', () => showLightbox(i));
        const del = document.createElement('button'); del.type = 'button'; del.className = 'photo-delete'; del.textContent = '🗑';
        del.setAttribute('aria-label', 'Xóa ảnh'); del.addEventListener('click', () => deletePhoto(p));
        const cap = document.createElement('div'); cap.className = 'photo-caption';
        if (p.caption) { const t = document.createElement('p'); t.className = 'font-semibold text-[#713d53]'; t.textContent = p.caption; cap.append(t) }
        const meta = document.createElement('p'); meta.className = 'text-xs text-[#876777]';
        meta.textContent = (p.uploader ? (p.uploader === 'Bin' ? '🐻 ' : p.uploader === 'Zin' ? '🐰 ' : '') + p.uploader + ' · ' : '') + fmtDate(p.createdAt);
        cap.append(meta);
        li.append(open, del, cap); gallery.append(li);
    });
    emptyEl.hidden = photos.length > 0;
    countEl.textContent = photos.length ? `${photos.length}${loadMoreBtn.hidden ? '' : '+'} ảnh` : '';
}

// ---------- Chọn ảnh ----------
function setFiles(files) {
    selectedFiles = [...files].filter(f => f.type.startsWith('image/'));
    previewList.querySelectorAll('img').forEach(img => URL.revokeObjectURL(img.src));
    previewList.replaceChildren();
    selectedFiles.forEach(f => { const img = document.createElement('img'); img.src = URL.createObjectURL(f); img.alt = f.name; previewList.append(img) });
    previewList.hidden = !selectedFiles.length;
    fileSummary.textContent = selectedFiles.length ? `Đã chọn ${selectedFiles.length} ảnh` : 'Chọn được nhiều ảnh cùng lúc';
    uploadBtn.disabled = !selectedFiles.length || !firebaseReady;
}
fileInput.addEventListener('change', () => setFiles(fileInput.files));
['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('dragging') }));
['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('dragging') }));
dropZone.addEventListener('drop', e => setFiles(e.dataTransfer.files));

// ---------- Tải lên ----------
form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy || !selectedFiles.length || !firebaseReady) return;
    const who = uploader();
    if (!who) { statusEl.textContent = 'Chọn Bin hoặc Zin trước nha 💕'; return }
    busy = true; uploadBtn.disabled = true;
    const caption = captionInput.value.trim();
    let ok = 0; const failed = [];
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        statusEl.textContent = `Đang tải ảnh ${i + 1}/${selectedFiles.length}…`;
        try {
            const img = await loadImage(file);
            const full = compress(img, FULL), thumb = compress(img, THUMB);
            const ref = photosCol.doc(), batch = db.batch();
            batch.set(ref, { thumb, caption, uploader: who, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            batch.set(dataCol.doc(ref.id), { data: full });
            await batch.commit();
            fullCache.set(ref.id, full); ok++;
        } catch (err) { console.error(err); failed.push(file.name) }
    }
    statusEl.textContent = `Đã tải lên ${ok} ảnh 💕` + (failed.length ? ` · Lỗi ${failed.length} ảnh: ${failed.join(', ')}` : '');
    fileInput.value = ''; captionInput.value = ''; setFiles([]);
    busy = false;
});

// ---------- Xóa ----------
const confirmBox = $('confirm-box'), confirmOk = $('confirm-ok'), confirmCancel = $('confirm-cancel'), confirmImg = $('confirm-img');
function askConfirm(p) {
    return new Promise(resolve => {
        confirmImg.src = p.thumb; confirmBox.hidden = false; confirmCancel.focus();
        const done = result => { confirmBox.hidden = true; confirmOk.onclick = confirmCancel.onclick = confirmBox.onclick = null; document.removeEventListener('keydown', onKey, true); resolve(result) };
        const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); done(false) } };
        confirmOk.onclick = () => done(true);
        confirmCancel.onclick = () => done(false);
        confirmBox.onclick = e => { if (e.target === confirmBox) done(false) };
        document.addEventListener('keydown', onKey, true);
    });
}
async function deletePhoto(p) {
    if (!(await askConfirm(p))) return;
    toast('Đang xóa ảnh…');
    try {
        const batch = db.batch();
        batch.delete(photosCol.doc(p.id)); batch.delete(dataCol.doc(p.id));
        await batch.commit(); fullCache.delete(p.id);
        toast('Đã xóa ảnh 🗑');
    } catch (err) {
        console.error(err);
        toast(err?.code === 'permission-denied'
            ? 'Firestore chưa cho phép xóa — hãy Publish lại luật mới trong README-chat.md (có "allow delete: if true").'
            : 'Xóa chưa được (' + (err?.code || err?.message || 'lỗi') + '), thử lại nha.', 7000);
    }
}
// ---------- Xem ảnh lớn ----------
const lightbox = $('lightbox'), lbImg = $('lb-img'), lbCaption = $('lb-caption'), lbMeta = $('lb-meta');
let lbIndex = -1, lbId = null, lastFocus = null;

async function showLightbox(i) {
    const p = photos[i]; if (!p) return;
    if (lightbox.hidden) lastFocus = document.activeElement;
    lbIndex = i; lbId = p.id;
    lbImg.src = fullCache.get(p.id) || p.thumb; lbImg.alt = p.caption || 'Ảnh kỷ niệm';
    lbCaption.textContent = p.caption; lbCaption.hidden = !p.caption;
    lbMeta.textContent = (p.uploader ? p.uploader + ' · ' : '') + fmtDate(p.createdAt) + ` · ${i + 1}/${photos.length}`;
    $('lb-prev').hidden = i === 0; $('lb-next').hidden = i === photos.length - 1;
    lightbox.hidden = false; document.body.style.overflow = 'hidden'; $('lb-close').focus();
    if (!fullCache.has(p.id)) {
        try {
            const snap = await dataCol.doc(p.id).get();
            if (snap.exists) { fullCache.set(p.id, snap.data().data); if (lbId === p.id) lbImg.src = snap.data().data }
        } catch (err) { console.error(err) }
    }
}
function closeLightbox() { lightbox.hidden = true; lbIndex = -1; lbId = null; document.body.style.overflow = ''; lastFocus?.focus() }

$('lb-close').addEventListener('click', closeLightbox);
$('lb-prev').addEventListener('click', () => showLightbox(lbIndex - 1));
$('lb-next').addEventListener('click', () => showLightbox(lbIndex + 1));
$('lb-delete').addEventListener('click', () => { const p = photos[lbIndex]; if (p) deletePhoto(p) });
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox() });
document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft' && lbIndex > 0) showLightbox(lbIndex - 1);
    else if (e.key === 'ArrowRight' && lbIndex < photos.length - 1) showLightbox(lbIndex + 1);
});
// Vuốt trái/phải trên điện thoại
let touchX = null;
lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX }, { passive: true });
lightbox.addEventListener('touchend', e => {
    if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (dx > 50 && lbIndex > 0) showLightbox(lbIndex - 1); else if (dx < -50 && lbIndex < photos.length - 1) showLightbox(lbIndex + 1);
});

