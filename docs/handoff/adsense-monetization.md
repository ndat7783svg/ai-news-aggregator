# Quảng cáo (Google AdSense)

Quá trình bật quảng cáo trên `bainews.site`. Quyết định trước đó ở `CLAUDE.md` mục 3 là "chưa
bật, đợi traffic ổn định vài trăm-1000+/ngày" — user chủ động đổi ý, muốn gắn ngay 1 quảng cáo dù
traffic còn nhỏ, để có động lực (thấy tiền về, dù ít) thay vì đợi.

### 2026-07-31 — Claude: tạo tài khoản AdSense, gắn script, xác minh quyền sở hữu thành công

- Tạo tài khoản Google AdSense, thêm site `bainews.site`, quốc gia thanh toán Việt Nam.
- **Bài học kỹ thuật (đã thêm vào `CLAUDE.md` mục 5):** lần đầu gắn script AdSense bằng component
  `next/script` (`strategy="afterInteractive"` rồi `"beforeInteractive"`) đều **KHÔNG** ra thẻ
  `<script src=...>` tĩnh trong HTML gốc — Next.js chèn qua cơ chế JS (`self.__next_s.push(...)`
  hoặc RSC payload dạng JSON), AdSense không xác minh được vì bot xác minh của họ không (hoặc
  không đáng tin cậy) chạy JS. Fix: dùng thẳng thẻ `<script>` HTML thuần trong `<head>` của
  `web/app/layout.js` (không qua `next/script`) → ra literal `<script async src="...">` tĩnh, xác
  minh quyền sở hữu thành công ngay.
- Trạng thái hiện tại: quyền sở hữu đã xác minh (dấu tick xanh). Còn thiếu bước **"Yêu cầu xem
  xét"** (request review) để Google duyệt site theo chính sách chương trình AdSense — chưa bấm,
  cần làm ở buổi sau (hoặc user tự bấm, không cần code).
- Còn dang dở: nhập thông tin thanh toán (mục "Thanh toán" trong AdSense, bắt buộc trước khi nhận
  tiền, chưa cần gấp vì phải đợi duyệt xong). Sau khi duyệt xong mới có mã quảng cáo (ad unit) thật
  để code gắn 1 ô quảng cáo vào giao diện — việc đó chưa làm, cần quay lại khi AdSense duyệt xong.
- File đổi: `web/app/layout.js` (chỉ gắn script xác minh domain, CHƯA có ô quảng cáo hiển thị nào
  trên giao diện).
