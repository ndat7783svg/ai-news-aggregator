# SEO trang chuyên đề GitHub AI

2 trang tĩnh song ngữ `/github-ai` + `/en/github-ai` — thử nghiệm đầu tiên cho hướng "SEO nội
dung dài hạn".

### 2026-07-27 — Claude Code (Sonnet 5) bàn thiết kế + Antigravity thực thi — trang SEO song ngữ GitHub AI
- **Claude:** bàn với user hướng "SEO nội dung dài hạn" (CLAUDE.md mục 3), chốt thử nghiệm nhỏ
  đầu tiên: 2 trang tĩnh server-rendered `/github-ai` (VI) + `/en/github-ai` (EN), không toggle
  client-side (Google không đọc được), có hreflang liên kết chéo. Viết spec
  `docs/superpowers/specs/2026-07-27-seo-github-ai-bilingual-design.md` + task
  `tasks/todo/2026-07-27-trang-seo-github-ai-song-ngu.md`, giao Antigravity làm.
- **Antigravity:** thực thi đúng task, commit `56f64c6` (feat) + `af028f6` (docs, cập nhật
  PROJECT_MAP.md). File mới: `web/app/github-ai/page.js`, `web/app/en/github-ai/page.js`,
  `web/components/GithubAiList.js`; sửa `web/app/sitemap.js` (thêm 2 URL), `web/components/Feed.js`
  (thêm link footer trỏ `/github-ai`).
- **Claude kiểm tra lại (không tin báo cáo suông):** đọc diff từng file, đối chiếu đúng spec
  (fetchItems filter="github" sort="hot" limit=60, GithubAiList là Server Component không
  `"use client"`, metadata + `alternates.languages` đúng cả 2 chiều, sitemap có đủ 3 URL).
  `npm run build` sạch (cả 2 route dựng tĩnh thành công). Chạy dev server thật, xác nhận qua
  browser: title/nội dung đúng ngôn ngữ từng trang, `<link rel="alternate" hreflang="vi/en">`
  xuất hiện đúng trong HTML cả 2 chiều, link footer `/github-ai` bấm được từ trang chủ. Trang
  hiện "Chưa có dữ liệu"/"No data available" khi chạy local — đúng như dự kiến vì máy này chưa
  có `web/.env.local`, không phải lỗi code.
- **Còn dang dở:** chưa deploy lên production để xem Google Search Console có index được không
  (cần thời gian, không kiểm tra ngay được); chưa đo hiệu quả traffic thật (cần vài tuần). Nếu
  hiệu quả, cân nhắc nhân rộng sang chủ đề khác (blog hãng, arXiv) như đã ghi trong spec.
