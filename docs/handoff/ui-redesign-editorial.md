# Thiết kế lại giao diện kiểu trang báo (editorial)

Nhật ký việc làm lại UX/UI toàn site sau phản hồi người dùng "trang quá cổ điển, thiết kế AI hoá quá".

### 2026-10-02 — Claude Code (Opus 5.5): làm lại toàn bộ giao diện

**Bối cảnh:** user giao toàn quyền thiết kế (không phải dân UX/code, "tôi sẽ theo ý kiến của
bạn"), yêu cầu làm 1 mạch, gặp bug thì sửa luôn. Không giao cho Antigravity.

**Chẩn đoán "AI hoá":** bố cục mặc định kiểu template AI — thẻ bo tròn + bóng đổ, nút viên thuốc
màu xanh dương, nhãn nguồn dạng pill nhiều màu, font hệ thống, emoji (🔥📢) trong nhãn.

**Hướng mới (tham khảo Techmeme / The Verge / Axios / Hacker News):**
- Nền "giấy" ấm (`#faf8f3`), 1 màu nhấn đỏ son (`--accent`), tối = nền `#121210`.
- Font qua `next/font/google`: **Be Vietnam Pro** (chữ thân, dựng cho tiếng Việt) + **Source
  Serif 4** (tiêu đề serif). Đều có subset `vietnamese`.
- Tin trình bày dạng danh sách báo, ngăn bằng đường kẻ mảnh; dòng meta = chấm màu nguồn + tên
  nguồn · thời gian · điểm; "Đọc tại <tên miền> ↗"; nút Lưu/Chia sẻ chỉ còn icon.
- Tiêu đề đã bấm đọc chuyển màu nhạt (`:visited`, kiểu HN).

**Tính năng UX mới:**
- Header dùng chung mọi trang (`SiteHeader.js`, sticky): logo, điều hướng ngang (máy tính) / ☰
  (điện thoại ≤760px), Sáng/Tối, VI/EN, Đăng nhập/Tài khoản. Chân trang chung `SiteFooter.js`.
- Trang chủ: dòng ngày + tiêu đề; **tab chuyên mục cố định khi cuộn**; **ô tìm kiếm** (debounce
  350ms, API `/api/items?q=`, tìm `ilike` trên title/title_vi/summary_vi/summary_en — từ khoá được
  làm sạch ký tự cú pháp PostgREST ở `cleanSearch()`); Mới nhất/Nổi bật dạng segmented; **chia tin
  theo ngày** (Hôm nay/Hôm qua/Thứ…, tính theo giờ VN để server và trình duyệt khớp nhau);
  skeleton khi tải; nút lên đầu trang.
- **Cột phải (≥1024px):** 5 tin HN điểm cao nhất tuần, 5 repo GitHub trending tuần, giới thiệu
  (`fetchRailData()` trong `supabaseServer.js`). Ẩn trên điện thoại.
- Trang chi tiết `/tin/[id]`: tiêu đề lớn, khối "Tóm tắt nhanh", nút "Đọc tại <tên miền>", nút
  Lưu/Chia sẻ có nhãn, mục **"Tin mới khác"** (6 tin mới nhất, link nội bộ) để giữ người đọc từ
  Facebook ở lại.
- `/github-ai`, `/en/github-ai`: danh sách xếp hạng có số thứ tự; h1 là tên trang (trước là
  "BAI News") — tốt hơn cho SEO.
- `/da-luu`, `/dang-nhap`, `/dang-ky`, `/tai-khoan`: gắn header/footer chung, style lại.

**Bug đã sửa trong lúc làm:**
- **Open redirect** ở `/dang-nhap` và `/dang-ky`: `?redirect=https://trang-la.com` từng đưa người
  dùng sang trang ngoài sau khi đăng nhập → giờ chỉ nhận đường dẫn nội bộ bắt đầu bằng `/`.
- Đổi bộ lọc khi đang tải dở trang kế tiếp có thể chèn tin của bộ lọc cũ vào → thêm bộ đếm
  "thế hệ" (`genRef`) trong `Feed.js`, kết quả cũ về muộn bị bỏ.
- Lưu tin thất bại chỉ hoàn tác ở 1 thẻ, các thẻ khác vẫn hiện "đã lưu" → giờ hoàn tác đồng bộ +
  hiện thông báo lỗi.
- Link chia sẻ thêm `?lang=` để người nhận thấy đúng ngôn ngữ người chia sẻ đang đọc.
- Biến CSS `--font-sans/--font-serif` trùng tên với biến next/font tạo ra làm font không tải và dấu
  tiếng Việt bị tách rời → đổi biến của site thành `--ff-sans/--ff-serif`.

**Đã xoá:** `RenameBanner.js` (banner đổi tên hết hạn từ 30/07), `AdsterraBanner.js` +
`HeaderAdBanner.js` (Adsterra đã chốt không dùng lại), các chuỗi i18n banner, emoji 🔥 trong nhãn
GitHub.

**File mới:** `web/lib/useSiteState.js` (hook `useLang`/`useTheme`/`useAuthUser`),
`web/components/SiteHeader.js`, `SiteFooter.js`, `StoryActions.js`.

**Đã kiểm tra:** `npm run build` thành công; xem trên trình duyệt ở 375px và 1280-1366px, sáng +
tối, tìm kiếm, đổi tab, Nổi bật, GitHub + ô chọn phụ, đổi EN, không lỗi console, không tràn ngang.

**Còn lại / gợi ý:** chưa đo phản hồi người dùng thật; nút Lưu/Chia sẻ vẫn chưa có ở `/github-ai`.
