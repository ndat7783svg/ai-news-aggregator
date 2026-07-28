# Đổi brand "SAI News" → "BAI News"

Đổi brand + banner thông báo, và 2 bug user phát hiện ngay sau đợt deploy đó.

### 2026-07-27 — Claude Code (Opus 5) + Antigravity: đổi brand "SAI News" → "BAI News" + banner 3 ngày
- **Yêu cầu user (3 việc):** (1) lưu chế độ màu + ngôn ngữ, (2) banner báo đổi tên miền hiện 3
  ngày, (3) đổi tên trang SAI News → BAI News.
- **Việc (1) hoá ra ĐÃ CÓ SẴN** — Claude test trực tiếp trên production (đổi sang sáng + EN,
  tải lại trang, cả 2 giữ nguyên; `localStorage` ở `Feed.js:47-76`). Không code gì thêm. Bài
  học: user báo "chưa có tính năng X" thì kiểm chứng trên web thật trước khi viết task.
- **Quyết định đã chốt khi bàn plan:** đổi brand NGAY trong cùng 1 lần deploy (không làm banner
  "sắp đổi" trước rồi đổi sau); hạn banner hardcode 30/07/2026 nên tự ẩn cho mọi người, KHÔNG
  cần deploy lần 2; có nút ✕ đóng, nhớ bằng `localStorage`.
- **Antigravity làm:** đổi 2 chỗ brand (`web/app/layout.js` metadata.title, `web/components/Feed.js`
  h1), tạo `web/components/RenameBanner.js`, thêm 3 biến CSS `--banner-*` vào cả 3 block theme
  (`:root`, `[data-theme="dark"]`, `@media prefers-color-scheme:dark`) + style `.rename-banner`.
  Làm đúng phạm vi, không lan man. Để **chưa commit** (giống lần trước).
- **Claude kiểm tra thật (không tin lời kể):** `npm run build` sạch; chạy dev server, xác nhận
  h1 + `document.title` đều "BAI News"; banner hiện đúng nội dung; bấm ✕ → biến mất + ghi
  `dismissedBanner_baiRename2026=1`, tải lại KHÔNG hiện lại; xoá khoá + đặt theme tối → banner
  hiện lại với màu tối đúng (`#2a2517` nền / `#f5dfa0` chữ, tương phản tốt); hằng số hạn parse
  đúng (30/07/2026 23:59:59 +07, còn 3.53 ngày).
- **Claude sửa thêm — Antigravity chỉ cập nhật CLAUDE.md mục 2, còn sót:** mục 2 (toạ độ dự án),
  mục 3 (việc dang dở), mục 7 việc 4 vẫn ghi "CHƯA đổi brand"; và **AGENTS.md không được cập
  nhật gì cả** (file này là bản sao y hệt CLAUDE.md, chỉ khác dòng tiêu đề). Claude sửa 3 chỗ
  còn sót + đồng bộ lại AGENTS.md. **Lần sau viết task nhớ ghi rõ: cập nhật CẢ CLAUDE.md VÀ
  AGENTS.md, và rà hết mọi mục nhắc tới việc đó, không chỉ mục trạng thái.**
- File đổi: `web/app/layout.js`, `web/components/Feed.js`, `web/app/globals.css`,
  `web/components/RenameBanner.js` (mới), `CLAUDE.md`, `AGENTS.md`.

### 2026-07-27 — Claude Code (Sonnet 5) sửa 2 bug user phát hiện sau khi deploy GitHub expansion
- **User báo (qua ảnh chụp màn hình EN mode):** (1) badge "Kinh điển" không có bản dịch tiếng
  Anh, banner đổi tên miền cũng không dịch; (2) lưu chế độ sáng/tối "vẫn chưa hoạt động".
- **Bug 1 — i18n badge/banner:** `web/lib/format.js` (`SOURCE_META`) lưu nhãn nguồn dạng chuỗi
  cố định, không phân biệt VI/EN — lỗi này đã có TỪ TRƯỚC (áp dụng cả cho
  `github_trending_daily/weekly` cũ, chỉ là "Kinh điển" thuần Việt nên lộ rõ nhất). Fix: thêm
  `labelKey` vào các entry cần dịch, `sourceMeta(source, lang)` nhận thêm `lang` để tra `t()`.
  `RenameBanner.js` trước đây hardcode tiếng Việt 100% (bỏ sót khi viết task đổi brand 27/07,
  không phát hiện lúc đó vì test chỉ nhìn qua, không đổi ngôn ngữ). Fix: thêm khoá
  `renameBannerText`/`renameBannerClose` vào `i18n.js`, banner tự đọc `localStorage.lang` lúc
  mount + lắng nghe custom event `bai-lang-change` (Feed.js bắn ra khi bấm nút VI/EN) để đổi
  chữ ngay không cần tải lại trang — vì banner nằm ngoài cây state của Feed, không tự nhận
  props lang.
- **Bug 2 — mất chế độ sáng/tối sau tải lại trang (bug thật, xác nhận bằng test trực tiếp trên
  bainews.site với tab trình duyệt HOÀN TOÀN MỚI, nhiều lần, loại trừ cache/tool quirk):**
  script inline trong `layout.js` đặt `document.documentElement.dataset.theme` TRƯỚC khi React
  hydrate — nhưng vì JSX gốc của `<html>` không khai báo `data-theme`, thuộc tính này không
  được đảm bảo giữ nguyên qua vòng đời hydrate của React (có thể bị dọn mất). `Feed.js` trước
  đó CHỈ đọc lại thuộc tính này (không tự ghi), nên nếu nó đã mất thì React state `theme` sai
  theo, và nút bấm sau đó vẫn hoạt động (set lại state) nhưng round tiếp theo (tải trang mới)
  lặp lại vấn đề. Fix: đổi effect trong `Feed.js` — đọc THẲNG `localStorage.getItem("theme")`
  (nguồn đáng tin cậy nhất, không phụ thuộc DOM attribute có sống sót qua hydrate hay không) rồi
  chủ động **ghi lại** `data-theme` mỗi lần mount, không chỉ đọc. Đã test qua nhiều lần bật/tắt
  + tải lại (bằng `window.location.reload()` thật, tab mới hoàn toàn) trên `localhost` — giữ
  đúng cả 2 chiều sáng/tối.
- File đổi: `web/components/Feed.js`, `web/components/NewsCard.js`,
  `web/components/RenameBanner.js`, `web/lib/format.js`, `web/lib/i18n.js`.
- Build sạch, đã verify bằng dev server thật (không dùng route giả cho phần theme — test trực
  tiếp qua reload thật).
