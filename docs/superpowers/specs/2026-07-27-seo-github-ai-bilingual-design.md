# Thiết kế: Trang SEO "GitHub AI nổi bật" song ngữ (VI + EN)

**Ngày:** 27/07/2026
**Bối cảnh:** Xem `CLAUDE.md` mục 3 ("Nội dung SEO dài hạn: CHƯA làm"). Web hiện là SPA 1 trang,
traffic gần 0% từ tìm kiếm (Analytics 27/07: ~64% từ Facebook, gần như 0% Google organic — xem
CLAUDE.md mục 2). Đây là thử nghiệm đầu tiên cho hướng SEO nội dung, phạm vi cố tình giữ nhỏ để
đo hiệu quả trước khi nhân rộng sang chủ đề khác (blog hãng, arXiv...).

## Mục tiêu
Thêm 2 trang tĩnh (server-rendered), mỗi trang tổng hợp tin "GitHub AI nổi bật" theo 1 ngôn ngữ
cố định, để Google có thể index và xếp hạng cho các cụm từ khoá liên quan — khác với trang chủ
(SPA, nội dung đổi bằng JS client-side, khó index theo chủ đề cụ thể).

## Quyết định đã chốt (đừng đề xuất lại hướng khác)
- **Loại trang:** chuyên đề theo nguồn (GitHub AI), KHÔNG phải digest tổng hợp mọi nguồn, KHÔNG
  phải trang chi tiết từng tin riêng lẻ. Lý do: tận dụng bộ lọc `github` đã có sẵn, nội dung đủ
  dày (nhiều tin/trang) để tránh "thin content", ít việc code mới nhất.
- **Dữ liệu:** tự động, live từ Supabase qua ISR (`revalidate = 300`, khớp nhịp trang chủ), KHÔNG
  làm snapshot tĩnh cập nhật định kỳ riêng. Không thêm bảng DB mới, không thêm cron mới.
- **Song ngữ = 2 route riêng biệt**, KHÔNG dùng cơ chế toggle client-side (`localStorage`) như
  trang chủ. Lý do: Google không đọc được nội dung ẩn sau JS toggle — chỉ thấy 1 ngôn ngữ trong
  HTML gốc. Mỗi ngôn ngữ cần 1 URL độc lập để được index riêng.
- **Component hiển thị:** viết mới, server-side, KHÔNG tương tác (không toggle ngôn ngữ, không
  infinite scroll) — khác hẳn `Feed.js` (client component). Lý do: mỗi trang cố định 1 ngôn ngữ,
  không cần các tính năng đó; giữ đơn giản đúng phạm vi thử nghiệm nhỏ.
- **Phạm vi lần đầu:** đúng 2 trang, danh sách tĩnh tối đa ~60 tin mới nhất, không phân trang.

## Kiến trúc

### Route
- `web/app/github-ai/page.js` — bản tiếng Việt
- `web/app/en/github-ai/page.js` — bản tiếng Anh

### Data fetching (dùng lại nguyên `fetchItems` đã có trong `web/lib/supabaseServer.js`)
```js
const { items } = await fetchItems({ filter: "github", sort: "hot", time: "all", offset: 0, limit: 60 });
```
`filter: "github"` đã tự gộp + dedupe 6 nguồn GitHub (xem nhánh đặc biệt dòng ~120 file trên).
`sort: "hot"` = sắp theo số sao giảm dần (đã hỗ trợ sẵn cho nhóm GitHub qua `isPureGithubSources`).

### Component mới: `web/components/GithubAiList.js` (Server Component)
- Nhận props: `items`, `lang` (`"vi" | "en"`).
- Hiển thị mỗi tin: badge nguồn, ★ + số sao rút gọn, badge ngôn ngữ lập trình (field `extra`),
  thời gian tương đối, tiêu đề (link bài gốc — `title_vi` nếu `lang==="vi"` else `title`), tóm
  tắt (`summary_vi` nếu `lang==="vi"` else `summary_en`), tác giả.
- Tái dùng CSS class thẻ đã có trong `web/app/globals.css` (không tạo style card mới từ đầu) —
  chỉ thêm class mới nếu bố cục khác biệt thật sự cần thiết.
- KHÔNG dùng `"use client"` — không có state, không có sự kiện tương tác.

### Nội dung tĩnh (đoạn giới thiệu SEO)
Mỗi trang có 1 đoạn mở đầu cố định trong code (không lấy từ DB), ~2-3 câu, chứa từ khoá tự
nhiên:
- VI: xoay quanh "repo AI nổi bật trên GitHub", "GitHub trending AI".
- EN: xoay quanh "trending AI repositories on GitHub", "notable open-source AI projects".

### Metadata + hreflang
Mỗi trang có `generateMetadata()` (hoặc `export const metadata`) riêng: `title`, `description`
khác trang chủ, và bắt buộc khai `alternates.languages` để Google hiểu 2 trang là bản dịch của
nhau:
```js
export const metadata = {
  title: "...",
  description: "...",
  alternates: {
    canonical: "https://bainews.site/github-ai", // (hoặc /en/github-ai cho bản EN)
    languages: {
      vi: "https://bainews.site/github-ai",
      en: "https://bainews.site/en/github-ai",
    },
  },
};
```

### Sitemap
Thêm cả 2 URL vào `web/app/sitemap.js` (hiện chỉ có trang chủ):
```js
{ url: "https://bainews.site/github-ai", lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
{ url: "https://bainews.site/en/github-ai", lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
```

### Liên kết nội bộ
Trang chủ (`web/components/Feed.js` hoặc footer trong `web/app/layout.js`) thêm 1 link trỏ tới
`/github-ai` — Google cần tìm ra trang qua liên kết thật, không chỉ qua sitemap. Bản `/en/github-ai`
không cần link riêng từ trang chủ tiếng Việt (đã tự liên kết qua thẻ hreflang).

## Rủi ro / lưu ý kỹ thuật
- Nếu sau này tách route API riêng đọc Supabase cho 2 trang này (hiện KHÔNG cần vì dùng
  Server Component gọi thẳng `fetchItems`, không qua `/api/items`), phải nhớ thêm cả
  `export const dynamic = "force-dynamic"` và `export const fetchCache = "force-no-store"` —
  bài học đã ghi trong CLAUDE.md mục 5 (bug Next.js Data Cache khiến lọc hiện tin cũ).
- `fetchItems` trả `title_vi` có thể `null` cho vài tin cũ chưa backfill — cần fallback về
  `title` gốc khi hiển thị bản VI nếu `title_vi` rỗng (đã là hành vi hiện có trong `Feed.js`,
  copy đúng logic đó).

## KHÔNG làm trong lần này
- Không đổi collector/pipeline (`collectors/*.js`, `pipeline.js`).
- Không đổi `web/lib/supabaseServer.js`, `web/lib/filters.js`, `web/lib/format.js` — chỉ đọc,
  không sửa logic lọc/sắp xếp hiện có.
- Không làm ảnh Open Graph tuỳ chỉnh riêng cho 2 trang này (đã biết lỗi `next/og` trên Windows —
  xem CLAUDE.md mục 2, không gấp).
- Không mở rộng sang chủ đề khác (blog hãng, arXiv) — để đánh giá kết quả trang GitHub trước.
- Không tự ý push thẳng lên `main` nếu chưa qua review.

## Tiêu chí hoàn thành
- `cd web && npm run dev` → vào `/github-ai`: thấy đoạn giới thiệu tiếng Việt + danh sách tin
  GitHub (tối đa 60 tin), tiêu đề/tóm tắt tiếng Việt, không có nút đổi ngôn ngữ hay nút lọc nào.
- Vào `/en/github-ai`: tương tự nhưng toàn bộ nội dung tiếng Anh (kể cả đoạn giới thiệu).
- View source (Ctrl+U) cả 2 trang: thấy `<title>`, `<meta name="description">`,
  `<link rel="alternate" hreflang="vi"...>` và `hreflang="en"` xuất hiện đúng trong HTML.
- `web/app/sitemap.js` liệt kê đủ 3 URL (trang chủ + 2 trang mới).
- Trang chủ có ít nhất 1 link bấm được trỏ tới `/github-ai`.
