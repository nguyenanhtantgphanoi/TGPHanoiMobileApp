# TGPHanoi Mobile App

Hướng dẫn nhanh để chạy dự án, kiểm thử và export bundle cho Android/iOS.

## 1) Chuẩn bị môi trường

- Node.js LTS (khuyến nghị >= 18)
- npm
- Expo CLI (dùng qua `npx expo`)
- Với chạy native:
  - Android Studio + Android SDK (cho Android)
  - Xcode (cho iOS, macOS)

## 2) Cài dependencies

```bash
npm install
```

## 3) Chạy app ở môi trường development

```bash
npm run start
```

Tùy nền tảng:

```bash
npm run android
npm run ios
npm run web
```

## 4) Chạy test

Hiện tại project **chưa có script test tự động** trong `package.json` (không có `npm test` hoặc `npm run test`).

Các bước kiểm thử đang áp dụng:

1. Chạy app:
   ```bash
   npm run start
   ```
2. Mở app trên Android/iOS và kiểm tra manual các màn hình/chức năng chính.
3. Theo dõi log lỗi trong terminal Metro và log runtime trên thiết bị/emulator.

> Khi project bổ sung Jest/Detox hoặc framework test khác, hãy cập nhật thêm mục này.

## 5) Export bundle Android

Lệnh:

```bash
npm run export-android
```

Script sẽ:
- Tạo bundle qua `expo export:embed`
- Đóng gói:
  - `android/index.android.bundle.zip`
  - `android/sourcemap.zip`
- Tự dọn file tạm trong `android/output` và `android/sourcemap.js`

## 6) Export bundle iOS

Lệnh:

```bash
npm run export-ios
```

Script sẽ:
- Tạo bundle qua `expo export:embed`
- Đóng gói:
  - `ios/main.jsbundle.zip`
  - `ios/sourcemap.zip`
- Tự dọn file tạm trong `ios/output` và `ios/sourcemap.js`

## 7) Một số lỗi thường gặp

- Thiếu dependency:
  ```bash
  npm install
  ```
- Lỗi cache Metro:
  ```bash
  npx expo start -c
  ```
- Lỗi môi trường native: kiểm tra lại Android SDK / Xcode và phiên bản toolchain.

Đóng Android Studio hoàn toàn.

Trong Terminal chạy:

which node

Sau đó kiểm tra:

echo $PATH

Nếu Node nằm trong .nvm, Android Studio thường không load .zshrc nên không biết node.

Bạn có thể khởi động Android Studio từ Terminal:

open -a "Android Studio"

hoặc thử:

/Applications/Android\ Studio.app/Contents/MacOS/studio

Sau đó build lại.

Nếu cách này build được thì xác nhận vấn đề là environment PATH của Android Studio.