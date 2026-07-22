# AI News Aggregator

Website tổng hợp & tóm tắt tin tức AI (song ngữ Việt + Anh), kèm link về bài gốc.
Bản đồ kiến trúc: [PROJECT_MAP.md](PROJECT_MAP.md). Thiết kế: [docs/superpowers/specs](docs/superpowers/specs/2026-07-22-ai-news-aggregator-design.md).

## Yêu cầu
- Node.js 20.6+ (khuyến nghị 24). Kiểm tra: `node --version`.

## Cài đặt
```bash
npm install
```

## Cột mốc 1 — Thu thập tin (không cần API key)
Thu thập tin AI từ Hacker News + arXiv, in ra console:
```bash
npm run collect
```

## Cột mốc 2 — Tóm tắt AI song ngữ (cần Anthropic API key)
1. Lấy API key tại https://console.anthropic.com (xem hướng dẫn bên dưới).
2. Chép `.env.example` thành `.env`, dán key vào.
3. Chạy test tóm tắt (thu vài tin rồi tóm tắt, in VI + EN):
```bash
npm run summarize
```

### Lấy Anthropic API key (làm 1 lần)
1. Vào https://console.anthropic.com, đăng ký / đăng nhập.
2. Nạp một ít tín dụng (mục **Billing** → **Add credits**). $5 là quá đủ để test.
3. Vào **API Keys** → **Create Key**, đặt tên (vd "news-app"), copy key (dạng `sk-ant-...`).
4. Chép `.env.example` thành `.env`, dán key vào dòng `ANTHROPIC_API_KEY=`.

Chi phí: dùng model **Claude Haiku** — rất rẻ. Tóm tắt ~40 tin tốn khoảng **vài cent**;
chạy tự động cả ngày thường vẫn dưới **1 USD/ngày**.

## Chưa làm (cột mốc sau)
- Đủ 6 nguồn + dedupe + ghi Supabase.
- Frontend Next.js hiển thị feed.
- GitHub Actions chạy tự động theo lịch.
