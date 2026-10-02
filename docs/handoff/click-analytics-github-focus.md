# Đo lượt bấm theo loại tin + thử nghiệm ưu tiên GitHub

Nhật ký việc tìm hiểu "người đọc thích loại tin gì" để quyết định có tập trung vào GitHub không.

### 2026-10-02 — Claude Code (Opus 5.5)

**Câu hỏi của user:** muốn tập trung 1 đối tượng; nghĩ tin GitHub (repo/công cụ AI mã nguồn mở,
tóm tắt tiếng Việt) là thứ khác biệt nhất cho người Việt — hỏi có xem được số liệu Vercel không.

**Số liệu Vercel Analytics 30 ngày (xem qua Chrome đã đăng nhập):** 627 visitors / 840 page views,
bounce 85%, 91% Việt Nam, 60% desktop. Referrer gần như toàn Facebook (l.facebook.com 256,
facebook.com 73, lm.facebook.com 43). Trang: `/` 625, `/github-ai` 11, `/da-luu` 8, **`/tin/...`
= 0** → bot Facebook (link về `/tin/{id}`) chưa kéo được lượt nào trong tháng (có thể chưa bật cron).
**Không trả lời được "loại tin nào được đọc"**: click đi thẳng ra link gốc, Vercel Hobby không có
custom events (cần Pro).

**Đã làm:**
- Tab GitHub đứng ngay sau "Tất cả"; khối "GitHub AI đang hot tuần này" (6 repo
  `github_trending_weekly` nhiều sao nhất) đầu trang chủ, máy tính lưới 3 cột, điện thoại vuốt
  ngang; bỏ khối GitHub trùng lặp ở cột phải.
- Tự đo click ẩn danh: `ClickTracker` + `data-track-*` + `/api/track` + bảng `click_events`
  (không IP/tài khoản; lọc bot theo user-agent + `navigator.webdriver`). Vị trí đo: feed, khối
  GitHub, cột Nổi bật, trang chi tiết, Tin mới khác, `/github-ai`, Đã lưu.
- `npm run click-stats [ngày]` in thống kê theo loại tin / vị trí / thiết bị + top 10 tin.
- `db/supabase.js`: export `getClient` để script dùng lại.

**Lưu ý khi đọc số liệu:** khối GitHub nằm trên cùng nên được lợi vị trí — so sánh nên xem cả
"Theo VỊ TRÍ" (feed vs github_strip) chứ không chỉ tổng theo loại tin.

**Dang dở:** user cần chạy SQL tạo bảng trên Supabase (Claude không đăng nhập hộ được). Đợi 1-2 tuần
rồi xem số liệu để quyết định có biến GitHub thành nội dung chính.

**Nhân tiện phát hiện:** tài khoản Vercel (team asuo_team, Hobby) báo vượt hạn mức miễn phí
Image Optimization (121K/100K cache writes) — nhiều khả năng do dự án `truyen-chu-dich` cùng tài
khoản (bainews không dùng ảnh). Đã báo user.
