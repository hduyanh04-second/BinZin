// ============================================================
// CẤU HÌNH FIREBASE CHO TRANG "ĐÔI LỜI MÚN NÓI" (letter.html)
// ------------------------------------------------------------
// 1. Vào https://console.firebase.google.com -> Add project (miễn phí, gói Spark)
// 2. Build -> Firestore Database -> Create database (chọn vùng asia-southeast1)
// 3. Project settings (bánh răng) -> Your apps -> chọn biểu tượng Web </>
//    -> đăng ký app -> copy đối tượng firebaseConfig và dán đè vào bên dưới.
// 4. Firestore -> Rules: dán luật trong file README-chat.md rồi Publish.
//
// Khi còn để giá trị mẫu "YOUR_..." trang chat sẽ tạm lưu tin nhắn
// trên trình duyệt (localStorage) — chỉ máy đó mới thấy.
// ============================================================
window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyBPn9HNvDeMdFbm72k0yhgiPXzLH44Ff5w",
    authDomain: "binzin-9c18d.firebaseapp.com",
    projectId: "binzin-9c18d",
    storageBucket: "binzin-9c18d.firebasestorage.app",
    messagingSenderId: "YOUR_SEN511371061753DER_ID",
    appId: "1:511371061753:web:a348322cbe16b879f23528",
    measurementId: "G-58FVK5K1FW"
};
