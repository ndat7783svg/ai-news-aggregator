# PROJECT_MAP — Bản đồ kiến trúc

Tra cứu nhanh cấu trúc dự án. Cập nhật khi thêm file/hệ thống mới.

## Dự án là gì
Website tổng hợp & tóm tắt tin tức AI (song ngữ VI + EN), hiển thị feed kèm link bài gốc.
Chi tiết & nguyên tắc: `docs/superpowers/specs/2026-07-22-ai-news-aggregator-design.md`.

**Đang chạy thật (thương hiệu hiển thị: "SAI News", tên project hạ tầng giữ nguyên):**
- Web công khai: https://sainews.vercel.app (Vercel, root = `web/`)
- Repo: https://github.com/ndat7783svg/ai-news-aggregator
- Pipeline tự chạy mỗi 15 phút: **cron-job.org** gọi `workflow_dispatch` (GitHub Actions cron nội bộ bị bóp lịch, không tin cậy → xem memory `ai-news-cron-throttling-fix`). Workflow: `.github/workflows/collect.yml`.
- **Vercel Web Analytics** đã bật (`@vercel/analytics`, `<Analytics/>` trong `web/app/layout.js`).
- Database: Supabase project ref `huqbirxwvrprqkhrwnsl` (bảng `news_items`), RLS đọc-công-khai/ghi-chỉ-service_role

## Tình trạng
- [x] Cột mốc 1–5: collector (7 nguồn) → tóm tắt song ngữ Haiku → dedupe/Supabase → frontend feed → Actions+Vercel. Đã live, ~130 tin.
- [x] Dịch tiêu đề (`title_vi`) trong bước tóm tắt + backfill 149 tin cũ xong.
- [x] Sắp xếp Mới nhất/Nổi bật + lọc thời gian (Hôm nay/Tuần/Tháng/Năm/Mọi lúc).
- [x] Chế độ Sáng/Tối (theo hệ thống + nhớ lựa chọn) + đổi tên hiển thị "SAI News".
- [ ] Reddit: code sẵn (`collectors/reddit.js`), CHƯA bật — cần REDDIT_CLIENT_ID/SECRET.
- [ ] Tên miền .com riêng: CHƯA mua, đang dùng `sainews.vercel.app`.

Chi tiết đầy đủ & quyết định đã chốt: xem `CLAUDE.md` ở gốc dự án (nguồn thông tin mới nhất).

## File / thư mục chính
| Đường dẫn | Vai trò |
|-----------|---------|
| `collect.js` | Điểm chạy chính: gọi các collector, gộp, in console. |
| `collectors/hackernews.js` | Thu thập tin AI từ HN qua Algolia HN Search API. |
| `collectors/arxiv.js` | Thu thập bài mới từ arXiv (cs.AI, cs.LG, cs.RO) qua Atom API. |
| `collectors/blogs.js` | 13 blog/báo AI qua RSS/Atom: OpenAI, DeepMind, Hugging Face, Mistral, BAIR, Simon Willison, TechCrunch, The Verge, Ars Technica, VentureBeat, MIT Tech Review, Import AI, The Gradient. Parser đã nới `processEntities.maxTotalExpansions` (feed nhiều entity). Danh sách + slug ở `lib/config.js` (`BLOG_FEEDS`); slug phải khai báo ở `web/lib/filters.js` (xếp vào 1 trong 3 nhóm `blog_labs`/`blog_press`/`blog_news`) + `web/lib/format.js` (badge). |
| `collectors/github.js` | GitHub Releases 8 repo (llama.cpp, transformers, ComfyUI, vllm, ollama, whisper.cpp, unsloth, sglang) + "Repo nổi bật" (`github_trending`) qua Search API: repo AI nhiều sao còn push gần đây (~180 ngày), 7 topic, tối đa 60 — gồm cả repo mới hot lẫn repo lớn kinh điển. Mốc thời gian = ngày push gần nhất. Dùng api.github.com. Ngưỡng/topic ở `lib/config.js` (`GITHUB_TRENDING_*`). |
| `collectors/reddit.js` | Reddit OAuth (cần REDDIT_CLIENT_ID/SECRET); tự bỏ qua nếu thiếu. **CHƯA bật** — ISP người dùng chặn reddit.com nên chưa tạo được app (pipeline chạy cloud vẫn OK nếu có credential). |
| `summarize/summarizer.js` | Tóm tắt AI song ngữ (VI+EN) + **dịch tiêu đề `title_vi`** bằng Claude Haiku (`claude-haiku-4-5`), structured outputs. `summarizeItem`/`summarizeMany`; `translateTitle`/`translateTitles` (dịch riêng tiêu đề cho backfill). |
| `backfill-titles.js` | Script chạy 1 lần: dịch `title_vi` cho tin cũ chưa có (`--count`/`--limit`, in chi phí token). Cần cột `title_vi` (ALTER TABLE) trước. |
| `summarize-test.js` | Test cột mốc 2: thu vài tin rồi tóm tắt, in ra để xem chất lượng. |
| `pipeline.js` | **Pipeline chính (cột mốc 3):** thu thập → lọc tin mới → tóm tắt → ghi Supabase. GitHub Actions sẽ chạy file này. |
| `db/supabase.js` | Kết nối Supabase (service_role): `fetchExistingKeys` (dedupe), `insertItems`. |
| `db/schema.sql` | SQL tạo bảng `news_items` + index + RLS. Chạy 1 lần trên Supabase SQL Editor. |
| `lib/keys.js` | `itemKey(item)` = "source\|source_id" — khoá chống trùng. |
| `lib/config.js` | Cấu hình chung: từ khoá AI, chuyên mục arXiv, giới hạn số tin, cửa sổ thời gian. |
| `lib/http.js` | fetch dùng chung: timeout, User-Agent; helper `fetchJson` / `fetchText`. |
| `web/` | **Frontend Next.js (cột mốc 4).** App Router, đọc Supabase (anon key) phía server. |
| `web/app/layout.js` | Root layout: title/meta "SAI News", script inline chống nháy cho `data-theme` (Sáng/Tối) trên `<html>`. |
| `web/app/page.js` | Server component: đọc `news_items` từ Supabase → `Feed`. ISR 5 phút. |
| `web/components/Feed.js` | Client: VI/EN (localStorage), lọc nguồn, **sắp xếp Mới nhất/Nổi bật**, **lọc thời gian (dropdown)**, infinite scroll (gọi `/api/items` với filter+sort+time). |
| `web/lib/supabaseServer.js` | Truy vấn Supabase (anon, chỉ đọc) DÙNG CHUNG cho page.js + API. `fetchItems({filter,sort,time,offset,limit})`: sắp/lọc phía server; chế độ "hot" lấy cửa sổ rồi `sortHot()` ở JS (chỉ HN+Reddit tính điểm). |
| `web/app/api/items/route.js` | API phân trang cho infinite scroll: nhận `filter/sort/time/offset/limit`. |
| `web/lib/filters.js` | Định nghĩa bộ lọc nguồn (`SOURCE_FILTERS`, `PAGE_SIZE=40`) — dùng chung client+server. 13 blog chia 3 nhóm: `blog_labs` (hãng AI), `blog_press` (báo công nghệ), `blog_news` (newsletter); mỗi nhóm có `labelKey` để hiện nhãn VI/EN (chuỗi ở `web/lib/i18n.js`). |
| `web/components/NewsCard.js` | Thẻ 1 tin: badge nguồn, điểm, thời gian, tiêu đề (link), tóm tắt, link gốc. |
| `web/lib/i18n.js` | Chuỗi giao diện VI/EN. `web/lib/format.js`: nhãn+màu nguồn, thời gian tương đối. |
| `web/.env.local` | `SUPABASE_URL` + `SUPABASE_ANON_KEY` (KHÔNG commit). Mẫu: `.env.local.example`. |
| `.env` | Chứa `ANTHROPIC_API_KEY` (KHÔNG commit). Mẫu: `.env.example`. |
| `package.json` | Node ESM (`type: module`); scripts `npm run collect`, `npm run summarize`. |

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
