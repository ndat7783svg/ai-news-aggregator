# Thêm trang chủ tiếng Anh `/en` (mirror trang chủ `/`)

## Mục tiêu
Tạo bản tiếng Anh của trang chủ tại route `/en`, để khi chia sẻ link `bainews.site` lên
X/Twitter hay kênh quốc tế, khung xem trước (Open Graph) không bị cố định tiếng Việt. Hiện
`web/app/layout.js` chỉ khai 1 bộ `metadata` tiếng Việt cố định cho toàn site; nút chuyển VI/EN
trên trang chỉ đổi *sau khi* trang tải xong trong trình duyệt (client-side), bot lấy preview
không chạy JS đó nên luôn thấy bản tiếng Việt.

## Bối cảnh
Xem `NEXT_SESSION.md` (việc #2, có thể đã bị xoá nếu phiên trước dọn xong) và CLAUDE.md mục 3.
Làm theo đúng khuôn mẫu đã có sẵn cho cặp trang song ngữ GitHub AI:
`web/app/github-ai/page.js` (VI) ↔ `web/app/en/github-ai/page.js` (EN). Task đó có file kế
hoạch gốc ở `tasks/done/2026-07-27-trang-seo-github-ai-song-ngu.md` — đọc để hiểu cách hreflang/
metadata đã làm, dù task này không tạo trang tĩnh mới mà mirror trang chủ (SPA có filter/sort/
infinite-scroll) nên phức tạp hơn 1 chút.

**Khác biệt quan trọng so với GitHub AI:** trang GitHub AI dùng component server-side thuần
(`GithubAiList.js`, không toggle, không state) nên chỉ cần truyền `lang="en"` là xong. Trang chủ
dùng `web/components/Feed.js` — 1 client component (`"use client"`) tự quản lý `lang` bằng
`useState` + đọc/ghi `localStorage.getItem("lang")`, có nút toggle VI/EN, có filter/sort/time,
có infinite scroll. Để `/en` render tiếng Anh ngay trong HTML gốc (SEO/bot đọc được), `Feed`
cần nhận ngôn ngữ ban đầu từ server thay vì luôn mặc định "vi".

**Đã làm sẵn (đừng làm lại, đừng revert):** `web/components/Feed.js` đã được sửa để nhận thêm
prop `initialLang = "vi"`, dùng để seed state: `const [lang, setLang] = useState(initialLang);`
(dòng khai báo function `Feed` hiện đã có tham số `initialLang`). Effect đọc `localStorage` vẫn
giữ nguyên — nghĩa là nếu người dùng đã từng chọn ngôn ngữ trên máy họ, `localStorage` vẫn có
thể ghi đè `initialLang` sau khi trang hydrate (đây là hành vi CHỦ Ý, giữ đồng bộ với cách trang
chủ VI hiện tại hoạt động — không cần sửa lại).

Quyết định đã chốt, ĐỪNG đề xuất lại:
- KHÔNG tạo context/provider ngôn ngữ mới, KHÔNG đổi cơ chế lưu `localStorage` key `"lang"` hiện
  có (nhiều component khác đang phụ thuộc: `DetailContent.js`, `SaveListPopup.js`, `da-luu/page.js`,
  `savedLists.js`, `RenameBanner.js`).
- KHÔNG viết lại `Feed.js`/`NewsCard.js` theo hướng khác — chỉ truyền thêm prop `initialLang`
  như đã làm, không đổi cấu trúc component.
- `/en` vẫn là cùng 1 app tương tác đầy đủ (filter, sort, infinite scroll) — không phải trang
  tĩnh giản lược như `/en/github-ai`.

## Việc cần làm

- [ ] Kiểm tra lại `web/components/Feed.js` đã có prop `initialLang = "vi"` và
  `useState(initialLang)` chưa (đã làm sẵn — chỉ xác nhận, không sửa lại nếu đúng).

- [ ] Sửa `web/app/page.js` (trang chủ VI):
  - Truyền thêm `initialLang="vi"` vào `<Feed ... />`.
  - Thêm `export const metadata = {...}` (hiện trang này CHƯA có metadata riêng, đang kế thừa
    hoàn toàn từ `layout.js`) với `alternates.canonical = "https://bainews.site"` và
    `alternates.languages = { vi: "https://bainews.site", en: "https://bainews.site/en" }`. Giữ
    nguyên title/description tiếng Việt hiện có trong `layout.js` (copy lại vào đây, không đổi
    nội dung) — vì khai `metadata` ở page sẽ override metadata layout cho route này.

- [ ] Tạo mới `web/app/en/page.js` (mirror `web/app/page.js`):
  - Cùng logic fetch dữ liệu (`fetchItems`, `fetchAvailableSources`), `export const revalidate = 300;`.
  - `export const metadata = {...}` bản tiếng Anh (title/description/openGraph/twitter dịch từ
    bản VI trong `layout.js`), `alternates.canonical = "https://bainews.site/en"`,
    `alternates.languages` giống hệt bên trên (2 chiều vi/en).
  - Truyền `initialLang="en"` vào `<Feed ... />`.

- [ ] `web/app/sitemap.js`: thêm 1 entry mới cho `https://bainews.site/en` (theo mẫu 2 entry
  GitHub AI đã có, `changeFrequency: "hourly"`, `priority` gợi ý 0.9 — thấp hơn trang chủ VI
  (1) nhưng cao hơn 2 trang GitHub AI (0.8) vì đây vẫn là trang chủ).

- [ ] Sau khi xong và đã tự kiểm tra (`npm run build` qua), cập nhật `CLAUDE.md` mục 2: thêm 1
  dòng ghi đã có trang chủ tiếng Anh `/en` (bên cạnh dòng đang ghi "2 trang chuyên đề song ngữ
  GitHub AI nổi bật"), giữ đúng quy tắc CLAUDE.md chỉ ghi trạng thái hiện tại, không kể lể quá
  trình.

## Tiêu chí hoàn thành / cách verify
- `cd web && npm run dev` → vào `http://localhost:3000/en`: giao diện load ngay bằng tiếng Anh
  (không phải load tiếng Việt rồi nhấp nháy đổi sang Anh) — kiểm bằng View Source (Ctrl+U), tìm
  đoạn HTML gốc phải chứa chữ tiếng Anh (vd tagline "News, summarized, with sources." hoặc tương
  đương), KHÔNG phải tiếng Việt.
- Trên `/en`, nút toggle VI/EN ở header vẫn hoạt động bình thường (bấm VI chuyển được sang tiếng
  Việt ngay tại URL `/en`, không cần điều hướng).
- Trang chủ `/` (VI) vẫn hoạt động y hệt như trước — không có hồi quy (regression) nào do việc
  thêm `initialLang`.
- View Source cả `/` và `/en`: thấy đúng `<title>`, `<meta name="description">`,
  `<link rel="alternate" hreflang="vi" .../>` và `<link rel="alternate" hreflang="en" .../>` cho
  cả 2 trang.
- Vào `http://localhost:3000/sitemap.xml`: thấy đủ 4 URL (`/`, `/en`, `/github-ai`, `/en/github-ai`).
- `npm run build` (trong `web/`) chạy qua không lỗi.

## KHÔNG được làm
- Không đổi collector/pipeline (`collectors/*.js`, `pipeline.js`, `summarizer.js`).
- Không sửa `web/lib/supabaseServer.js`, `web/lib/filters.js`, `web/lib/format.js`, `web/lib/i18n.js`
  — chỉ dùng hàm/dữ liệu đã có sẵn.
- Không đổi `<html lang="vi">` trong `web/app/layout.js` — đây là giới hạn đã biết (kể cả cặp
  trang GitHub AI cũng chưa xử lý việc này), không nằm trong phạm vi task.
- Không thêm quảng cáo/banner mới trong task này (việc quảng cáo Adsterra là task riêng, xem
  `NEXT_SESSION.md` việc #1 nếu còn tồn tại).
- Không tự ý push thẳng lên `main` nếu chưa qua review — tạo commit rõ ràng để Claude Code kiểm
  tra bằng `git diff` trước khi coi là xong.
