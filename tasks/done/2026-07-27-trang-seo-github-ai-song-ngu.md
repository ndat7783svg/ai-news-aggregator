# Thêm 2 trang SEO song ngữ "GitHub AI nổi bật" (/github-ai + /en/github-ai)

## Mục tiêu
Thêm 2 trang tĩnh, server-rendered, tổng hợp tin "GitHub AI nổi bật" — 1 bản tiếng Việt
(`/github-ai`), 1 bản tiếng Anh (`/en/github-ai`) — để Google có thể index theo chủ đề cụ thể.
Trang chủ hiện là SPA 1 trang (nội dung đổi bằng JS client-side), Google khó xếp hạng theo từ
khoá riêng biệt; đây là thử nghiệm SEO nội dung đầu tiên.

## Bối cảnh
Xem CLAUDE.md mục 3 ("Nội dung SEO dài hạn: CHƯA làm"). Thiết kế đầy đủ đã bàn kỹ với user và
chốt tại: **`docs/superpowers/specs/2026-07-27-seo-github-ai-bilingual-design.md`** — ĐỌC FILE
NÀY TRƯỚC, nó có toàn bộ quyết định kiến trúc (route, data fetching, hreflang, sitemap...).
Task này chỉ tóm tắt lại thành checklist thực thi.

Các quyết định đã chốt, ĐỪNG đề xuất lại:
- Song ngữ = 2 route riêng biệt, KHÔNG dùng toggle client-side kiểu trang chủ (Google không đọc
  được nội dung sau JS toggle).
- Dữ liệu tự động/live từ Supabase qua ISR, không snapshot tĩnh, không bảng DB mới, không cron mới.
- Component hiển thị mới, server-side, KHÔNG tương tác (không toggle ngôn ngữ, không infinite
  scroll) — khác `Feed.js`.
- Phạm vi nhỏ: đúng 2 trang, tối đa ~60 tin, không phân trang.

## Việc cần làm

- [ ] Đọc kỹ `docs/superpowers/specs/2026-07-27-seo-github-ai-bilingual-design.md` trước khi code.

- [ ] Tạo component mới `web/components/GithubAiList.js` (Server Component, KHÔNG có
  `"use client"`):
  - Nhận props `items`, `lang` (`"vi"` hoặc `"en"`).
  - Mỗi tin hiển thị: badge nguồn, ★ + số sao rút gọn, badge ngôn ngữ lập trình (field `extra`),
    thời gian tương đối, tiêu đề (link `url` gốc — dùng `title_vi` khi `lang==="vi"` và có giá
    trị, fallback về `title` gốc nếu `title_vi` null; dùng `title` gốc khi `lang==="en"`), tóm
    tắt (`summary_vi` khi `lang==="vi"`, `summary_en` khi `lang==="en"`), tác giả (`author`).
  - Copy logic hiển thị số sao rút gọn/badge ngôn ngữ/thời gian tương đối từ `web/lib/format.js`
    và `web/components/Feed.js` (đã có sẵn, đừng viết lại từ đầu).
  - Tái dùng CSS class thẻ tin đã có trong `web/app/globals.css` (không tạo style thẻ mới trừ
    khi bố cục thật sự cần khác).

- [ ] Tạo `web/app/github-ai/page.js` (bản tiếng Việt):
  - `export const revalidate = 300;` (khớp `web/app/page.js`).
  - Gọi `fetchItems({ filter: "github", sort: "hot", time: "all", offset: 0, limit: 60 })` từ
    `web/lib/supabaseServer.js`.
  - Render đoạn giới thiệu tĩnh (~2-3 câu tiếng Việt, có cụm từ khoá tự nhiên như "repo AI nổi
    bật trên GitHub", "GitHub trending AI") + `<GithubAiList items={items} lang="vi" />`.
  - `export const metadata = {...}` với `title`, `description` riêng (khác trang chủ) và
    `alternates.canonical` = `https://bainews.site/github-ai`, `alternates.languages` = `{ vi:
    "https://bainews.site/github-ai", en: "https://bainews.site/en/github-ai" }` (xem mẫu code
    đầy đủ trong file spec, mục "Metadata + hreflang").

- [ ] Tạo `web/app/en/github-ai/page.js` (bản tiếng Anh): giống hệt trang trên nhưng
  `lang="en"`, đoạn giới thiệu bằng tiếng Anh (xoay quanh "trending AI repositories on GitHub",
  "notable open-source AI projects"), `alternates.canonical` =
  `https://bainews.site/en/github-ai`.

- [ ] `web/app/sitemap.js`: thêm 2 URL mới vào mảng trả về (giữ nguyên entry trang chủ đã có):
  ```js
  { url: "https://bainews.site/github-ai", lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
  { url: "https://bainews.site/en/github-ai", lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
  ```

- [ ] Thêm 1 link nội bộ từ trang chủ trỏ tới `/github-ai` (đặt trong `web/components/Feed.js`
  hoặc footer/`web/app/layout.js`, chọn vị trí không phá bố cục hiện có) — chỉ cần link tiếng
  Việt, bản EN không cần link riêng từ trang chủ VI (đã tự liên kết qua hreflang).

## Tiêu chí hoàn thành / cách verify
- `cd web && npm run dev` → vào `http://localhost:3000/github-ai`: thấy đoạn giới thiệu tiếng
  Việt + danh sách tin GitHub (tối đa 60 tin, có ★ số sao, badge ngôn ngữ lập trình), KHÔNG có
  nút đổi ngôn ngữ hay nút lọc nguồn nào trên trang này.
- Vào `/en/github-ai`: bố cục giống hệt nhưng toàn bộ chữ (đoạn giới thiệu, tiêu đề, tóm tắt)
  là tiếng Anh.
- View source (Ctrl+U) cả 2 trang: thấy đúng `<title>`, `<meta name="description">`, và
  `<link rel="alternate" hreflang="vi" .../>` + `<link rel="alternate" hreflang="en" .../>` xuất
  hiện trong HTML (không phải chỉ 1 thẻ hreflang mà thiếu thẻ còn lại).
- Vào `http://localhost:3000/sitemap.xml`: thấy đủ 3 URL (trang chủ + 2 trang mới).
- Từ trang chủ, tìm thấy và bấm được link tới `/github-ai`.
- `npm run build` (trong `web/`) chạy qua không lỗi.

## KHÔNG được làm
- Không đổi collector/pipeline (`collectors/*.js`, `pipeline.js`, `summarizer.js`).
- Không sửa logic bên trong `web/lib/supabaseServer.js`, `web/lib/filters.js`,
  `web/lib/format.js` — chỉ import/gọi hàm đã có, không đổi hành vi lọc/sắp xếp hiện tại (dùng
  đúng nguyên tham số `fetchItems` như trên).
- Không thêm bảng Supabase mới, không thêm GitHub Actions cron mới.
- Không làm ảnh Open Graph tuỳ chỉnh riêng (đã biết lỗi `next/og` trên Windows, không gấp — xem
  CLAUDE.md mục 2).
- Không mở rộng sang chủ đề khác (blog hãng, arXiv...) trong task này — chỉ GitHub AI.
- Không tự ý push thẳng lên `main` nếu chưa qua review — tạo commit rõ ràng để Claude Code kiểm
  tra bằng `git diff` trước khi coi là xong.
