# PROJECT_MAP — Bản đồ kiến trúc

Tra cứu nhanh cấu trúc dự án. Cập nhật khi thêm file/hệ thống mới.

## Dự án là gì
Website tổng hợp & tóm tắt tin tức AI (song ngữ VI + EN), hiển thị feed kèm link bài gốc.
Chi tiết & nguyên tắc: `docs/superpowers/specs/2026-07-22-ai-news-aggregator-design.md`.

**Đang chạy thật:**
- Web công khai: https://ai-news-aggregator-ivory-beta.vercel.app (Vercel, root = `web/`)
- Repo: https://github.com/ndat7783svg/ai-news-aggregator
- Pipeline tự chạy mỗi 30 phút qua GitHub Actions (`.github/workflows/collect.yml`)
- Database: Supabase (bảng `news_items`), RLS đọc-công-khai/ghi-chỉ-service_role

## Tình trạng
- [x] Cột mốc 1: collector Hacker News + arXiv, in ra console.
- [x] Cột mốc 2: tóm tắt AI song ngữ (Claude Haiku) — đã test OK.
- [x] Cột mốc 3a: dedupe + tóm tắt + ghi Supabase (HN + arXiv) — đã test OK, có 40 tin trong DB.
- [~] Cột mốc 3b: đã thêm Blog RSS (OpenAI/DeepMind/HF), GitHub Releases, GitHub Trending — chạy OK. Còn Reddit (chờ credential).
- [x] Cột mốc 4: frontend Next.js (feed từ Supabase, nút VI/EN) — đã test render OK với dữ liệu thật.
- [x] Cột mốc 5: GitHub Actions chạy mỗi 30 phút + deploy Vercel công khai — HOÀN TẤT.
- [ ] (Tuỳ chọn) Thêm Reddit: cần REDDIT_CLIENT_ID/SECRET (secret trên GitHub + Vercel nếu cần).

## File / thư mục chính
| Đường dẫn | Vai trò |
|-----------|---------|
| `collect.js` | Điểm chạy chính: gọi các collector, gộp, in console. |
| `collectors/hackernews.js` | Thu thập tin AI từ HN qua Algolia HN Search API. |
| `collectors/arxiv.js` | Thu thập bài mới từ arXiv (cs.AI, cs.LG, cs.RO) qua Atom API. |
| `collectors/blogs.js` | Blog chính thức qua RSS/Atom (OpenAI, Google DeepMind, Hugging Face). |
| `collectors/github.js` | GitHub Releases (repo AI lớn) + "Trending" qua Search API. Dùng api.github.com. |
| `collectors/reddit.js` | Reddit OAuth (cần REDDIT_CLIENT_ID/SECRET); tự bỏ qua nếu thiếu. |
| `summarize/summarizer.js` | Tóm tắt AI song ngữ (VI+EN) bằng Claude Haiku (`claude-haiku-4-5`), structured outputs. `summarizeItem` / `summarizeMany`. |
| `summarize-test.js` | Test cột mốc 2: thu vài tin rồi tóm tắt, in ra để xem chất lượng. |
| `pipeline.js` | **Pipeline chính (cột mốc 3):** thu thập → lọc tin mới → tóm tắt → ghi Supabase. GitHub Actions sẽ chạy file này. |
| `db/supabase.js` | Kết nối Supabase (service_role): `fetchExistingKeys` (dedupe), `insertItems`. |
| `db/schema.sql` | SQL tạo bảng `news_items` + index + RLS. Chạy 1 lần trên Supabase SQL Editor. |
| `lib/keys.js` | `itemKey(item)` = "source\|source_id" — khoá chống trùng. |
| `lib/config.js` | Cấu hình chung: từ khoá AI, chuyên mục arXiv, giới hạn số tin, cửa sổ thời gian. |
| `lib/http.js` | fetch dùng chung: timeout, User-Agent; helper `fetchJson` / `fetchText`. |
| `web/` | **Frontend Next.js (cột mốc 4).** App Router, đọc Supabase (anon key) phía server. |
| `web/app/page.js` | Server component: đọc `news_items` từ Supabase → `Feed`. ISR 5 phút. |
| `web/components/Feed.js` | Client: nút chuyển VI/EN (nhớ localStorage), render danh sách thẻ tin. |
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
