# Đổi brand "SAI News" → "BAI News" + banner thông báo 3 ngày

## Mục tiêu
Đổi tên hiển thị của website từ "SAI News" sang "BAI News", đồng thời hiện 1 banner thông
báo trong 3 ngày để user cũ biết đã đổi tên (tránh nhầm lẫn/nghi ngờ web lạ).

## Bối cảnh
Xem CLAUDE.md mục 2 (đã mua domain riêng `bainews.site`, nối Vercel, chạy song song
`sainews.vercel.app`) và mục 7 việc 4 (kế hoạch đổi brand đang dang dở). Đã bàn với user +
Claude Code (27/07), chốt các quyết định sau — **đừng đề xuất lại**:
- Đổi tên brand **ngay lập tức** trong cùng 1 lần deploy (KHÔNG làm banner "sắp đổi" trước rồi
  mới đổi sau — đã cân nhắc và chọn phương án gộp 1 lần).
- Tên project trên Vercel/GitHub/Supabase **giữ nguyên** `ai-news-aggregator` — chỉ đổi brand
  hiển thị (text trên web), không đổi tên repo/project.
- Chế độ lưu màu sáng/tối + ngôn ngữ VI/EN qua `localStorage` **đã có sẵn và hoạt động đúng**
  (đã test trực tiếp trên production 27/07) — KHÔNG phải làm gì thêm cho việc này, không nằm
  trong phạm vi task này.
- Việc đặt `bainews.site` làm domain chính trên Vercel Dashboard là thao tác **thủ công của
  user** (Settings → Domains → Set as Primary), KHÔNG thuộc phạm vi task code này.

## Việc cần làm

### 1. Đổi brand trong code (2 chỗ, đã rà soát toàn bộ `web/`, không còn chỗ nào khác)
- [ ] `web/app/layout.js` dòng 5 — `metadata.title`: đổi "SAI News — tổng hợp & tóm tắt tin
      song ngữ" → "BAI News — tổng hợp & tóm tắt tin song ngữ".
- [ ] `web/components/Feed.js` dòng 203 — `<h1 className="site-title">SAI News</h1>` →
      `<h1 className="site-title">BAI News</h1>`.

### 2. Banner thông báo đổi tên (component mới)
- [ ] Tạo `web/components/RenameBanner.js` (client component, `"use client"`):
  - Thanh cố định trên đầu trang, nội dung: "📢 SAI News nay đã đổi tên thành **BAI News** tại
    tên miền mới **bainews.site**." + nút đóng "✕" ở bên phải.
  - Hạn hiển thị: hardcode hằng số ngày kết thúc = **2026-07-30T23:59:59+07:00** (3 ngày kể từ
    27/07/2026). Nếu ngày hiện tại (`new Date()`) đã qua mốc này → không render gì cả (return
    null), áp dụng cho MỌI người xem, không cần deploy lại lần 2 để tắt banner.
  - Bấm "✕" → lưu 1 khoá riêng vào `localStorage` (ví dụ `localStorage.setItem("dismissedBanner_baiRename2026","1")`)
    → từ lần sau, trên trình duyệt đó không hiện banner nữa dù chưa hết 3 ngày. Đọc khoá này
    lúc mount (trong `useEffect`, giống cách `Feed.js` đang đọc `theme`/`lang` — tránh lỗi
    hydration mismatch giữa server và client).
  - Style: theme-aware, dùng biến CSS có sẵn trong `web/app/globals.css` (không hardcode màu
    sáng/tối riêng lẻ) — có thể thêm biến CSS mới cho banner (vd `--banner-bg`, `--banner-text`,
    `--banner-border`) vào cả 2 block `:root` (sáng) và `[data-theme="dark"]` (tối) trong
    `globals.css`. Màu nền gợi ý: vàng/cam nhạt cảnh báo nhẹ nhàng, không chói.
- [ ] Gắn `<RenameBanner />` vào `web/app/layout.js`, render **phía trên** `{children}` (ngoài
      `<main>`, đầu `<body>`) để hiện trên mọi trang.

### 3. Cập nhật tài liệu dự án sau khi xong
- [ ] Cập nhật `CLAUDE.md` mục 2 + mục 7: đánh dấu việc đổi brand + banner đã xong, ghi rõ
      ngày banner hết hạn (30/07/2026) để phiên sau biết khi nào có thể xoá hẳn component banner
      (dọn dẹp code không cấp thiết, có thể để nguyên vì code tự ẩn banner sau hạn — nêu rõ
      trong ghi chú để không có ai nhầm là banner còn "treo" vĩnh viễn).

## Tiêu chí hoàn thành / cách verify
- Chạy `cd web && npm run dev`, mở `http://localhost:3000`:
  - Tiêu đề tab trình duyệt và chữ H1 trên trang đều là "BAI News", không còn "SAI News" ở
    đâu (kiểm tra cả chế độ sáng/tối, cả VI/EN).
  - Banner hiện ở đầu trang với đúng nội dung, đúng màu theo theme sáng/tối.
  - Bấm "✕" → banner biến mất, tải lại trang (F5) → banner **không** hiện lại.
  - Sửa tạm hằng số ngày kết thúc thành 1 ngày trong quá khứ để test → banner không hiện (rồi
    trả lại đúng ngày 2026-07-30 trước khi commit).
- `npm run build` trong `web/` không lỗi.

## KHÔNG được làm
- Không đổi tên project trên Vercel/GitHub/Supabase (vẫn là `ai-news-aggregator`).
- Không tự ý đặt `bainews.site` làm domain chính trên Vercel (việc của user, ngoài phạm vi code).
- Không đụng vào logic lưu `theme`/`lang` trong `localStorage` (đã hoạt động đúng, không phải
  bug cần sửa).
- Không xoá component banner ngay cả sau khi hết hạn hiển thị — để nguyên (tự ẩn theo ngày),
  việc dọn dẹp code cũ không cấp thiết, để phiên sau quyết định.
- Không push thẳng lên `main` nếu chưa qua review/commit rõ ràng theo quy trình thường của repo.
