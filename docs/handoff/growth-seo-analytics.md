# SEO cơ bản + Analytics + domain chính

Nền tảng kỹ thuật SEO, số liệu traffic thật lần đầu, và đặt domain riêng làm chính.

### 2026-07-27 — Claude Code (Sonnet 5): SEO cơ bản + xem số liệu Analytics thật + domain chính
- **SEO kỹ thuật cơ bản (trước đó web KHÔNG có favicon/sitemap/robots):** thêm
  `web/app/robots.js` (cho phép crawl + trỏ sitemap), `web/app/sitemap.js` (khai trang chủ),
  `web/app/icon.svg` (favicon), mở rộng metadata trong `web/app/layout.js` (`keywords`,
  `openGraph`, `twitter`, `metadataBase`, title/description có từ khoá tiếng Việt). Thử thêm ảnh
  OG tự sinh bằng `next/og` `ImageResponse` nhưng gặp lỗi Next.js đã biết **trên Windows** (load
  font mặc định qua `file://` URL sai định dạng, `ERR_INVALID_URL`) — bỏ, chỉ giữ OG dạng chữ.
  Commit `77b4f84`, đã push, Vercel tự deploy.
- **Xem số liệu Vercel Web Analytics thật lần đầu (24h):** 174 visitor, 275 pageview, bounce rate
  88%, đỉnh ~20 visitor/giờ. Referrer **~64% từ Facebook** (gộp facebook.com/l.facebook.com/
  lm.facebook.com/m.facebook.com), **gần như 0% từ tìm kiếm** (bing.com chỉ 1 lượt, không có
  Google organic). Kết luận cùng user: traffic phụ thuộc gần hoàn toàn 1 kênh không đều →
  nguyên nhân gốc rễ traffic dao động mạnh theo ngày. **Quyết định:** chưa bật quảng cáo (traffic
  quá nhỏ/bấp bênh để có ý nghĩa), ưu tiên đa dạng hoá kênh trước — mốc để cân nhắc lại: traffic
  ổn định vài trăm–1000+/ngày *liên tục*.
- **Chốt chiến lược quảng bá:** Facebook đăng đều tay (đang có traffic thật nhưng chỉ đăng 1 lần
  rồi thôi) song song SEO làm nền tảng lâu dài. KHÔNG dùng Product Hunt/Indie Hackers (đối tượng
  ở đó là dev/founder quốc tế, lệch với 97% traffic hiện tại là người Việt).
- **User tự đặt `bainews.site` làm domain chính trên Vercel** (Settings → Domains → "Redirect to
  another Domain") — `sainews.vercel.app` giờ tự redirect 308 sang `bainews.site`, link
  Facebook/bookmark cũ không gãy. Đã xác nhận qua ảnh chụp Vercel Dashboard.
- File đổi: `web/app/robots.js` (mới), `web/app/sitemap.js` (mới), `web/app/icon.svg` (mới),
  `web/app/layout.js`.

### 2026-07-29 — Claude Code (Sonnet 5): ảnh OG cho `/tin/[id]`, chạy thử Facebook Ads, khởi tạo bot Facebook
- **Thêm ảnh preview (og:image) cho trang chi tiết `/tin/{id}`** — trước đó chỉ có OG dạng chữ
  (xem mục 2026-07-27 ở trên). Thử lại `next/og` `ImageResponse` (nghĩ lỗi cũ có thể do config
  khác) → **gặp lại đúng lỗi cũ** `ERR_INVALID_URL` khi load font mặc định trên Windows — xác
  nhận lại kết luận cũ, KHÔNG dùng `next/og` trên máy này. Thử tiếp quy ước file tĩnh
  `opengraph-image.png` (không cần code, theo chuẩn Next.js) — **cũng KHÔNG hoạt động**: kiểm
  tra `.next/server/app-paths-manifest.json` xác nhận Next.js dev server ở máy này không đăng ký
  file này thành route dù đúng tên/định dạng (bug/giới hạn khác, chưa rõ nguyên nhân gốc, không
  đáng đào sâu thêm). **Giải pháp dùng:** ảnh tĩnh đặt ở `web/public/og-banner.png` (static file
  bình thường, không qua cơ chế "metadata route" nào) + khai báo thẳng URL trong
  `openGraph.images` ở `generateMetadata` (`web/app/tin/[id]/page.js`) — cách này chắc chắn hoạt
  động vì chỉ dựa vào static file serving cơ bản của Next.js. Ảnh sinh bằng script tạm
  `web/scripts/gen-og-image.mjs` (dùng `sharp`, cài `--no-save` nên không có trong
  `package.json` — cần `npm install --no-save sharp` lại nếu muốn chạy lại script để đổi ảnh).
- **Chạy thử Facebook Ads lần đầu:** đổi 1 trang Facebook cũ (bỏ hoang, 0 follower) thành trang
  "BAI News" (giữ nguyên @username Facebook cũ `thungumon`), tạo quảng cáo test qua
  "Trung tâm quảng cáo" (giao diện rút gọn, không phải Ads Manager đầy đủ) — mục tiêu "Tăng khách
  truy cập trang web", đối tượng Việt Nam 18+, ~130k VND cho 4 ngày, link đích có gắn UTM
  (`utm_source=facebook&utm_medium=paidsocial&utm_campaign=test1`) để tách riêng traffic ads
  khỏi traffic group trong Analytics. Đã bấm Đăng, đang chờ Meta duyệt.
- **Khởi tạo dự án mới `D:\bai-news-facebook-bot`** (tách biệt hoàn toàn khỏi dự án này, theo
  đúng mô hình `bai-news-video-project` — liên kết qua Supabase dùng chung, chỉ đọc). Mục đích:
  tự động đăng tin lên Trang Facebook BAI News (4 lần/ngày, dùng `summary_vi` có sẵn làm caption,
  link về `bainews.site/tin/{id}`, ảnh preview tự động nhờ `og-banner.png` mới thêm ở trên — bot
  KHÔNG cần tự xử lý ảnh). Đã viết đặc tả đầy đủ vào `CLAUDE.md` của dự án đó + scaffold cơ bản
  (`package.json`, `.env.example`, khung `scripts/post.mjs` — CHƯA có logic thật, để dành cho
  bước thực thi tiếp theo, có thể giao AI khác). Bài học cron-job.org/`workflow_dispatch`,
  `cancel-in-progress: true` của dự án web đã ghi lại trong đặc tả đó để không lặp lại lỗi cũ.
- File đổi ở dự án này: `web/app/tin/[id]/page.js` (thêm `openGraph.images`),
  `web/public/og-banner.png` (mới), `web/scripts/gen-og-image.mjs` (mới, script tạm sinh ảnh).
