# PROJECT_MAP — Bản đồ kiến trúc

Tra cứu nhanh cấu trúc dự án. Cập nhật khi thêm file/hệ thống mới.

## Dự án là gì
Website tổng hợp & tóm tắt tin tức AI (song ngữ VI + EN), hiển thị feed kèm link bài gốc.
Chi tiết & nguyên tắc: `docs/superpowers/specs/2026-07-22-ai-news-aggregator-design.md`.

**Đang chạy thật (thương hiệu hiển thị: "BAI News", tên project hạ tầng giữ nguyên):**
- Web công khai: https://sainews.vercel.app (Vercel, root = `web/`)
- Repo: https://github.com/ndat7783svg/ai-news-aggregator
- Pipeline tự chạy mỗi 15 phút: **cron-job.org** gọi `workflow_dispatch` (GitHub Actions cron nội bộ bị bóp lịch, không tin cậy → xem memory `ai-news-cron-throttling-fix`). Workflow: `.github/workflows/collect.yml`.
- **Vercel Web Analytics** đã bật (`@vercel/analytics`, `<Analytics/>` trong `web/app/layout.js`).
- Database: Supabase project ref `huqbirxwvrprqkhrwnsl` (bảng `news_items`), RLS đọc-công-khai/ghi-chỉ-service_role

## Tình trạng
- [x] Cột mốc 1–5: collector (nhiều nguồn) → tóm tắt song ngữ Haiku → dedupe/Supabase → frontend
      feed → Actions+Vercel. Đã live, ~170+ tin.
- [x] Dịch tiêu đề (`title_vi`) trong bước tóm tắt + backfill tin cũ xong.
- [x] Sắp xếp Mới nhất/Nổi bật + lọc thời gian (Hôm nay/Tuần/Tháng/Năm/Mọi lúc).
- [x] Chế độ Sáng/Tối (theo hệ thống + nhớ lựa chọn). Brand hiển thị "BAI News",
      `bainews.site` đã đặt làm domain chính trên Vercel.
- [x] GitHub: 6 nguồn con gộp 1 nút, tách khỏi feed "Tất cả".
- [x] SEO cơ bản (robots/sitemap/favicon) + 2 trang chuyên đề song ngữ `/github-ai`/`/en/github-ai`.
- [x] Lưu tin (localStorage, có danh sách) + Chia sẻ + trang chi tiết `/tin/[id]` + `/da-luu` +
      menu ☰ ở header.
- [ ] Reddit: code sẵn (`collectors/reddit.js`), CHƯA bật — cần REDDIT_CLIENT_ID/SECRET.

Chi tiết đầy đủ & quyết định đã chốt: xem `CLAUDE.md` ở gốc dự án (nguồn thông tin mới nhất);
lịch sử/diễn biến theo ngày: xem `HANDOFF.md`.

## File / thư mục chính
| Đường dẫn | Vai trò |
|-----------|---------|
| `collect.js` | Điểm chạy chính: gọi các collector, gộp, in console. |
| `collectors/hackernews.js` | Thu thập tin AI từ HN qua Algolia HN Search API. |
| `collectors/arxiv.js` | Thu thập bài mới từ arXiv (cs.AI, cs.LG, cs.RO) qua Atom API. |
| `collectors/blogs.js` | 13 blog/báo AI qua RSS/Atom: OpenAI, DeepMind, Hugging Face, Mistral, BAIR, Simon Willison, TechCrunch, The Verge, Ars Technica, VentureBeat, MIT Tech Review, Import AI, The Gradient. Parser đã nới `processEntities.maxTotalExpansions` (feed nhiều entity). Danh sách + slug ở `lib/config.js` (`BLOG_FEEDS`); slug phải khai báo ở `web/lib/filters.js` (xếp vào 1 trong 3 nhóm `blog_labs`/`blog_press`/`blog_news`) + `web/lib/format.js` (badge). |
| `collectors/github.js` | GitHub Releases 8 repo + "Repo nổi bật" (`github_trending`), "Kinh điển" (`github_classics`), và **Trending thật** daily/weekly/monthly (`github_trending_daily`/`weekly`/`monthly`): parse github.com/trending bằng Cheerio + API REST/Search. |
| `collectors/reddit.js` | Reddit OAuth (cần REDDIT_CLIENT_ID/SECRET); tự bỏ qua nếu thiếu. **CHƯA bật** — ISP người dùng chặn reddit.com nên chưa tạo được app (pipeline chạy cloud vẫn OK nếu có credential). |
| `summarize/summarizer.js` | Tóm tắt AI song ngữ (VI+EN) + **dịch tiêu đề `title_vi`** bằng Claude Haiku (`claude-haiku-4-5`), structured outputs. `summarizeItem`/`summarizeMany`; `translateTitle`/`translateTitles` (dịch riêng tiêu đề cho backfill). |
| `backfill-titles.js` | Script chạy 1 lần: dịch `title_vi` cho tin cũ chưa có (`--count`/`--limit`, in chi phí token). Cần cột `title_vi` (ALTER TABLE) trước. |
| `backfill-github-classics.js` | Script chạy 1 lần: thu thập, tóm tắt và ghi repo GitHub "Kinh điển" vào DB (`--count` xem trước, in chi phí token). |
| `summarize-test.js` | Test cột mốc 2: thu vài tin rồi tóm tắt, in ra để xem chất lượng. |
| `pipeline.js` | **Pipeline chính (cột mốc 3):** thu thập → lọc tin mới → tóm tắt → ghi Supabase. GitHub Actions sẽ chạy file này. |
| `db/supabase.js` | Kết nối Supabase (service_role): `fetchExistingKeys` (dedupe), `insertItems`. |
| `db/schema.sql` | SQL tạo bảng `news_items` + index + RLS. Chạy 1 lần trên Supabase SQL Editor. |
| `lib/keys.js` | `itemKey(item)` = "source\|source_id" — khoá chống trùng. |
| `lib/config.js` | Cấu hình chung: từ khoá AI, chuyên mục arXiv, giới hạn số tin, cửa sổ thời gian. |
| `lib/http.js` | fetch dùng chung: timeout, User-Agent; helper `fetchJson` / `fetchText`. |
| `web/` | **Frontend Next.js (cột mốc 4).** App Router, đọc Supabase (anon key) phía server. |
| `web/app/layout.js` | Root layout: title/meta "BAI News", script inline chống nháy cho `data-theme` (Sáng/Tối) trên `<html>`, render `<RenameBanner/>` trên cùng `<body>`. |
| `web/app/page.js` | Server component: đọc `news_items` từ Supabase → `Feed`. ISR 5 phút. |
| `web/app/tin/[id]/page.js` | **Trang chi tiết** `/tin/[id]`: Server Component, `generateMetadata` với title/desc từ tin thật, render `DetailContent`. |
| `web/app/tin/[id]/DetailContent.js` | Client component con: đọc `lang` từ localStorage (mặc định VI), hiển thị badge/điểm/tiêu đề/tóm tắt/nút đọc bài gốc. |
| `web/app/da-luu/page.js` | **Trang Đã lưu** `/da-luu`: Client Component, đọc localStorage + gọi `/api/saved-items`, chia theo danh sách, đổi tên/xoá danh sách, nút Bỏ lưu nhanh. |
| `web/components/Feed.js` | Client: VI/EN (localStorage), lọc nguồn, **sắp xếp Mới nhất/Nổi bật**, **lọc thời gian (dropdown)**, infinite scroll (gọi `/api/items` với filter+sort+time). Footer link nội bộ trỏ tới `/github-ai`. |
| `web/lib/supabaseServer.js` | Truy vấn Supabase (anon, chỉ đọc) DÙNG CHUNG cho page.js + API + trang SEO. `fetchItems({filter,sort,time,offset,limit})`: loại 6 nguồn GitHub khỏi `filter="all"`; sắp xếp theo sao cho nguồn thuần GitHub; cửa sổ candidate + dedupe 6 nguồn cho `filter="github"`. |
| `web/app/api/items/route.js` | API phân trang cho infinite scroll: nhận `filter/sort/time/offset/limit`. |
| `web/app/api/saved-items/route.js` | API lấy tin theo mảng id cho trang Đã lưu: `GET ?ids=1,2,3` → JSON. `force-dynamic` + `force-no-store` bắt buộc. |
| `web/lib/filters.js` | Định nghĩa bộ lọc nguồn (`SOURCE_FILTERS`, `PAGE_SIZE=40`) — dùng chung client+server. 6 nguồn GitHub gộp vào 1 nút "GitHub" cha + 6 sub-filter con; export `GITHUB_ALL_SOURCES` và `GITHUB_TRENDING_FAMILY`. |
| `web/components/NewsCard.js` | Thẻ 1 tin (client component): badge nguồn, điểm, thời gian, tiêu đề (link), tóm tắt, link gốc. **+nút 🔖 Lưu** (toggle, nhớ trạng thái `isSaved`), **mũi tên mở `SaveListPopup`**, **nút 🔗 Chia sẻ** (gọi `shareItem`, hiện toast). |
| `web/components/SaveListPopup.js` | Popup chọn/tạo danh sách lưu: checkbox từng danh sách, ô nhập tên + nút tạo mới, đóng khi click ngoài. |
| `web/components/GithubAiList.js` | **Server Component** — danh sách thẻ GitHub AI cho 2 trang SEO. Nhận props `items` + `lang`. Không có state/interaction. Tái dùng CSS class từ `globals.css`. |
| `web/app/github-ai/page.js` | **Trang SEO tiếng Việt** `/github-ai`: server-rendered ISR 5 phút, gọi `fetchItems(filter=github,sort=hot)`, metadata + hreflang đầy đủ. |
| `web/app/en/github-ai/page.js` | **Trang SEO tiếng Anh** `/en/github-ai`: tương tự nhưng `lang=en`. Liên kết hreflang với bản VI. |
| `web/components/RenameBanner.js` | **Tạm thời** — banner báo đổi tên SAI→BAI, tự ẩn sau 30/07/2026 (hằng số `BANNER_EXPIRES`), nút ✕ nhớ bằng localStorage. Style `.rename-banner` + biến `--banner-*` ở `globals.css`. Hết hạn thì tự ẩn, xoá code không cấp thiết. |
| `web/lib/i18n.js` | Chuỗi giao diện VI/EN — kể cả nhãn nút Lưu/Chia sẻ/Danh sách. `web/lib/format.js`: nhãn+màu nguồn, thời gian tương đối. |
| `web/lib/savedLists.js` | **Client-only** — quản lý danh sách lưu tin qua `localStorage` (khoá `bai_saved_lists`): `getState`, `saveItem`, `removeItem`, `removeItemFromAll`, `createList`, `renameList`, `deleteList`, `isSaved`, `getListsForItem`. Bọc try/catch toàn bộ. |
| `web/lib/share.js` | **Client-only** — `shareItem(item, lang)`: ưu tiên `navigator.share()` (mobile native), fallback copy link vào clipboard. Trả `"shared"\|"copied"\|"error"`. |
| `web/.env.local` | `SUPABASE_URL` + `SUPABASE_ANON_KEY` (KHÔNG commit). Mẫu: `.env.local.example`. |
| `.env` | Chứa `ANTHROPIC_API_KEY` (KHÔNG commit). Mẫu: `.env.example`. |
| `package.json` | Node ESM (`type: module`); scripts `npm run collect`, `npm run summarize`. |
| `CLAUDE.md` | Hướng dẫn dự án cho Claude Code — nguồn thông tin mới nhất, đọc trước khi làm việc. |
| `AGENTS.md` | Bản y hệt CLAUDE.md, dành cho agent khác (Codex, Antigravity...) — đồng bộ nội dung, sửa lại khi CLAUDE.md đổi. |
| `HANDOFF.md` | Nhật ký bàn giao giữa nhiều AI/công cụ khác nhau làm cùng dự án (Claude Code, Codex, Antigravity) — mỗi phiên ghi tóm tắt việc đã làm ở cuối file, đối chiếu bằng git log/diff. |
| `tasks/` | Giao việc dạng file `.md` cho agent thực thi (Codex): `tasks/todo/` = chưa làm, `tasks/done/` = đã xong & đã review. Xem `tasks/README.md` cho format. |
| `plans/` | Ý tưởng/plan từ Codex hoặc Antigravity mang qua Claude bàn (chiều ngược `tasks/`): `plans/incoming/` = chờ bàn, `plans/done/` = đã bàn xong (chỉ lưu vết). Chốt xong thì tạo task mới ở `tasks/todo/`, không tự đánh dấu "duyệt" trong file plan. Xem `plans/README.md`. |

## Khuôn dữ liệu chung (interface giữa các module)
Mọi collector trả về mảng object: `{ source, sourceId, title, url, author, publishedAt, score, extra }`.
Đây là hợp đồng dữ liệu để cột mốc sau (tóm tắt / DB) dùng lại mà không sửa collector.

## Phụ thuộc
- `collect.js` → `collectors/*` → `lib/http.js` + `lib/config.js`.
- Thư viện ngoài: `fast-xml-parser` (đọc XML arXiv). Không cần API key cho 2 nguồn hiện tại.

## Quyết định còn treo (cột mốc sau)
- Cấu trúc bảng Supabase (cột mốc 3) — hỏi lại trước khi làm.
- Chiến lược dedupe chi tiết (cột mốc 3).
- Anthropic API key: chưa có, hướng dẫn lấy trước cột mốc 2.
