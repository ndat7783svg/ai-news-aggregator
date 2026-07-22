# PROJECT_MAP — Bản đồ kiến trúc

Tra cứu nhanh cấu trúc dự án. Cập nhật khi thêm file/hệ thống mới.

## Dự án là gì
Website tổng hợp & tóm tắt tin tức AI (song ngữ VI + EN), hiển thị feed kèm link bài gốc.
Chi tiết & nguyên tắc: `docs/superpowers/specs/2026-07-22-ai-news-aggregator-design.md`.

## Tình trạng
- [x] Cột mốc 1: collector Hacker News + arXiv, in ra console.
- [ ] Cột mốc 2: tóm tắt AI song ngữ (Claude Haiku).
- [ ] Cột mốc 3: đủ 6 nguồn + dedupe + ghi Supabase.
- [ ] Cột mốc 4: frontend Next.js.
- [ ] Cột mốc 5: GitHub Actions chạy tự động.

## File / thư mục chính
| Đường dẫn | Vai trò |
|-----------|---------|
| `collect.js` | Điểm chạy chính: gọi các collector, gộp, in console. |
| `collectors/hackernews.js` | Thu thập tin AI từ HN qua Algolia HN Search API. |
| `collectors/arxiv.js` | Thu thập bài mới từ arXiv (cs.AI, cs.LG, cs.RO) qua Atom API. |
| `lib/config.js` | Cấu hình chung: từ khoá AI, chuyên mục arXiv, giới hạn số tin, cửa sổ thời gian. |
| `lib/http.js` | fetch dùng chung: timeout, User-Agent; helper `fetchJson` / `fetchText`. |
| `package.json` | Node ESM (`type: module`); script `npm run collect`. |

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
