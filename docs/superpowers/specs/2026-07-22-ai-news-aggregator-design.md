# Thiết kế: Website tổng hợp & tóm tắt tin tức AI

Ngày: 2026-07-22

## Mục tiêu

Website tự động thu thập tin/bài mới về AI từ nhiều nguồn, tóm tắt bằng AI (song ngữ
Việt + Anh), hiển thị dạng feed kèm link về bài gốc. Không đăng lại toàn văn — chỉ tóm
tắt + dẫn nguồn (mô hình Techmeme/TLDR).

## Nguyên tắc bắt buộc

- Đơn giản trước, nâng cao sau. Không tự thêm tính năng ngoài phạm vi.
- Không code thanh toán/tài khoản ở giai đoạn này; kiến trúc tách module để gắn thêm sau.
- Luôn kèm nguồn + link cạnh mỗi tin (bắt buộc).
- Không lấy toàn văn bài gốc — chỉ tóm tắt ngắn bằng lời AI.
- Ưu tiên miễn phí; phát sinh chi phí phải báo & ước tính trước.
- Làm theo từng cột mốc, xác nhận trước khi qua bước tiếp.

## Kiến trúc kỹ thuật (đã chốt)

- Frontend: Next.js, deploy free trên Vercel.
- Thu thập & tóm tắt: script Node.js chạy qua GitHub Actions scheduled workflow (15-30 phút).
- Tóm tắt: Claude Haiku API (song ngữ VI + EN, mỗi bản 2-4 câu).
- Database: Supabase (Postgres free tier); frontend đọc trực tiếp.

## Nguồn tin (6 nguồn, chỉ RSS/API chính thức)

1. GitHub Trending (AI/ML)
2. GitHub Releases repo AI lớn (llama.cpp, transformers, ComfyUI...) — GitHub REST API
3. arXiv cs.AI / cs.LG / cs.RO — arXiv API (Atom)
4. Blog chính thức OpenAI, Anthropic, Google DeepMind, Meta AI, Hugging Face — RSS
5. Hacker News (lọc từ khoá AI) — **Algolia HN Search API**
6. Reddit r/LocalLLaMA, r/MachineLearning, r/robotics — Reddit API chính thức

## Cấu trúc thư mục (tách module)

```
collectors/        mỗi nguồn 1 file
lib/               code dùng chung: fetch, chuẩn hoá, config
summarize/         tóm tắt AI (cột mốc 2)
db/                Supabase (cột mốc 3)
web/               Next.js frontend (cột mốc 4)
.github/workflows/ chạy tự động theo lịch (cột mốc 5)
collect.js         chạy tất cả collector, in ra console
```

Ngôn ngữ: JavaScript thuần (Node ESM) cho collector — chạy trực tiếp, không cần build.

## Khuôn dữ liệu chung (interface giữa các module)

Mọi collector trả về mảng object cùng dạng:

```js
{
  source:      "hackernews",           // tên nguồn
  sourceId:    "12345",                // id gốc, dùng chống trùng sau này
  title:       "...",                  // tiêu đề gốc
  url:         "https://...",          // link về bài gốc (bắt buộc)
  author:      "pg" | null,
  publishedAt: "2026-07-22T10:00:00Z", // ISO 8601 UTC
  score:       128 | null,             // điểm HN; arXiv để null
  extra:       { ... }                 // riêng từng nguồn (vd: abstract arXiv)
}
```

## Cột mốc

1. **(hiện tại)** Collector HN + arXiv, in ra console. Không DB, không AI, không dedupe.
2. Thêm tóm tắt AI song ngữ (Claude Haiku) cho tin thu được; test chất lượng.
3. Mở rộng đủ 6 nguồn + dedupe (theo url/sourceId) + ghi vào Supabase.
4. Frontend Next.js hiển thị feed từ Supabase.
5. GitHub Actions chạy tự động theo lịch 15-30 phút.

## Phạm vi cột mốc 1

- `collectors/hackernews.js`: Algolia HN Search API, lọc từ khoá AI, bài ~48h gần nhất.
- `collectors/arxiv.js`: arXiv API (cs.AI, cs.LG, cs.RO), N bài mới nhất.
- `collect.js`: chạy cả 2, in console gọn đẹp.
- Phụ thuộc: `fast-xml-parser` (đọc XML arXiv) — nhẹ, miễn phí.

## Quyết định để lại cột mốc sau

- Cấu trúc bảng Supabase (cột mốc 3) — sẽ hỏi lại trước khi làm.
- Chiến lược dedupe chi tiết (cột mốc 3).
- Anthropic API key: user chưa có, sẽ hướng dẫn lấy sau cột mốc 1 (kèm ước tính chi phí Haiku).
