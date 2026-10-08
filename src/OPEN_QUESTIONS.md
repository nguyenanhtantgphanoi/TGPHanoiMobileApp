
# 1. GiaoXuScreen
1. Đổi API load danh sách giáo xứ thành https://lmwp.tgphanoi.org/api/parishes
2. Mảng Json có cấu trúc như sau:
{
    "id": "6a1025aca7842611aa870252",
    "STT": "1",
    "name": "An Hòa",
    "href": "https://tonggiaophanhanoi.org/giao-xu-an-hoa/",
    "ten_khac": "",
    "dia_chi": "Xóm Mới, xã Quảng Bị, Tp. Hà Nội",
    "ngay_thanh_lap": "",
    "ten_thanh_quan_thay": "",
    "ngay_mung_le_quan_thay": "",
    "ngay_cung_hien": "",
    "so_nhan_danh": "",
    "linh_muc_chinh_xu": "",
    "giao_ho_truc_thuoc": [],
    "documents": [],
    "media": [],
    "giao_hat": "6a102023a7842611aa870246",
    "deaneryName": "Thanh Oai"
  }
  3. Mỗi card giáo xứ hiển thị thông tin theo từng hàng như sau
  "Giáo xứ "+item.name
  Nếu item.ten_khac != "" thì "Tên khác: "+item.ten_khac
  "Giáo hạt: "+ item.deaneryName
  "Địa chỉ: "+ item.dia_chi

  url để mở trang chi tiết giáo xứ: item.href

# 2. GiaoHatScreen
1. Gọi API giống với GiaoXuScreen. Thiết kế để chỉ gọi 1 lần và dùng được data cho cả 2 screen
2. Lấy các giá trị khác nhau của deaneryName làm danh sách giáo hạt
3. Số lượng giáo xứ của mỗi giáo hạt đếm từ số item có deaneryName là giáo hạt đó

# 3. LichCongGiaoScreen
1. Vấn đề: khi nội dung bài đọc và giáo xứ chầu lượt dài, một phần nội dung dưới bottom bị che khuất
2. Giải pháp: Khi có nội dung xứ chầu lượt, cho phép chiều cao của block tự động kéo dài cho đủ nội dung. Các block phía dưới tự động đẩy xuống

# 4. NotificationScreen
Lỗi: Trên android, notification screen luôn hiện lên khi mở app mặc dù không có notification nào
Debug và Sửa
Hãy ghi vào file này những việc bạn đã làm

Đã làm:
1. Trace luồng điều hướng trong `App.js`:
   - `addNotificationResponseReceivedListener(...)`
   - `Notifications.getLastNotificationResponseAsync()`
   - `navigateFromNotificationData(...)`
2. Xác định nguyên nhân chính:
   - `getLastNotificationResponseAsync()` có thể trả về response cũ từ lần mở trước.
   - App đang xử lý lại response cũ này khi khởi động, nên tự điều hướng vào `NotificationScreen`.
3. Sửa lỗi chống điều hướng lặp:
   - Thêm lưu `request.identifier` đã xử lý vào `AsyncStorage` (`@last_handled_notification_id`).
   - Khi app mở lại, nếu `request.identifier` trùng ID đã xử lý thì bỏ qua, không navigate.
4. Dọn last response để tránh tái phát:
   - Sau khi xử lý response, gọi `Notifications.clearLastNotificationResponseAsync()`.
   - Đồng thời gọi clear sau bước bootstrap `getLastNotificationResponseAsync()`.
5. Kết quả mong đợi:
   - Mở app bình thường không còn tự bật `NotificationScreen` khi không có notification mới được bấm.
   - Vẫn giữ được điều hướng đúng khi người dùng thực sự bấm vào notification.