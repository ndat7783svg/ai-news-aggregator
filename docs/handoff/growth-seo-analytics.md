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
