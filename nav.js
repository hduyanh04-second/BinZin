// Menu điều hướng trên điện thoại — dùng chung cho các trang riêng (letter.html, photos.html)
(() => {
    const menuToggle = document.getElementById('menu-toggle'), mainNav = document.getElementById('main-nav');
    if (!menuToggle || !mainNav) return;
    const setMenu = open => { mainNav.classList.toggle('open', open); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu') };
    menuToggle.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false) });
    document.addEventListener('click', e => { if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && !menuToggle.contains(e.target)) setMenu(false) });
    window.matchMedia('(min-width:768px)').addEventListener('change', e => { if (e.matches) setMenu(false) });
})();

