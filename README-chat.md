# Cài đặt khung chat "Đôi lời mún nói" (Firebase Firestore – miễn phí)

## 1. Tạo project Firebase

1. Vào https://console.firebase.google.com → **Add project** (tắt Google Analytics cũng được).
2. Menu trái **Build → Firestore Database → Create database** → chọn vùng `asia-southeast1` → **Start in production mode**.
3. **Project settings** (bánh răng) → **Your apps** → bấm biểu tượng **Web `</>`** → đặt tên app → **Register app**.
4. Copy đối tượng `firebaseConfig` hiện ra, dán đè vào `window.FIREBASE_CONFIG` trong file `firebase-config.js`.

## 2. Luật bảo mật (Firestore → Rules → Publish)

Cho phép ai có link đọc và gửi lời nhắn hợp lệ, **không cho sửa/xóa**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{id} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['name', 'title', 'content', 'createdAt'])
        && request.resource.data.name is string && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 40
        && request.resource.data.title is string && request.resource.data.title.size() > 0 && request.resource.data.title.size() <= 120
        && request.resource.data.content is string && request.resource.data.content.size() > 0 && request.resource.data.content.size() <= 3000
        && request.resource.data.createdAt == request.time;
      allow update, delete: if false;
    }

    // ===== Photographs: ảnh thu nhỏ + chú thích =====
    match /photos/{id} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['thumb', 'caption', 'uploader', 'createdAt'])
        && request.resource.data.thumb is string && request.resource.data.thumb.matches('data:image/jpeg;base64,.*')
        && request.resource.data.thumb.size() <= 200000
        && request.resource.data.caption is string && request.resource.data.caption.size() <= 200
        && request.resource.data.uploader in ['Bin', 'Zin']
        && request.resource.data.createdAt == request.time;
      allow update: if false;
      allow delete: if true;
    }

    // ===== Photographs: ảnh lớn =====
    match /photoData/{id} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['data'])
        && request.resource.data.data is string && request.resource.data.data.matches('data:image/jpeg;base64,.*')
        && request.resource.data.data.size() <= 1000000;
      allow update: if false;
      allow delete: if true;
    }

    // ===== Profile, Ảnh bìa Home & Trạng thái/Cột mốc/Vòng quay =====
    match /profiles/{person} {
      allow read: if true;
      allow create, update: if person in ['bin', 'zin', 'home', 'mood']
        && request.resource.data.keys().hasOnly(['name', 'bio', 'about', 'likes', 'photo', 'updatedAt'])
        && request.resource.data.name is string && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 60
        && request.resource.data.bio is string && request.resource.data.bio.size() <= 160
        && request.resource.data.about is string && request.resource.data.about.size() <= 1500
        && request.resource.data.likes is string && request.resource.data.likes.size() <= 1000
        && request.resource.data.photo is string && request.resource.data.photo.size() <= 750000
        && (request.resource.data.photo == '' || request.resource.data.photo.matches('data:image/jpeg;base64,.*'))
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }
  }
}
```

> Ảnh không dùng Firebase Storage (bắt buộc gói Blaze có thẻ) mà được nén trên trình duyệt (~1600px JPEG) rồi lưu thẳng vào Firestore → vẫn miễn phí.

> Lưu ý: `apiKey` của Firebase Web không phải bí mật, nhưng ai có link trang đều đọc/gửi được lời nhắn. Muốn riêng tư hơn có thể bật Firebase Authentication sau.

## 3. Giới hạn gói miễn phí (Spark)

50.000 lượt đọc / 20.000 lượt ghi mỗi ngày, 1 GB dữ liệu — thoải mái cho 2 người dùng.
