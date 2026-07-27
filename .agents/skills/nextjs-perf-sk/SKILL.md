---
name: nextjs-perf-sk
description: >-
  Kỹ thuật tối ưu hiệu năng React/Next.js (rút gọn từ vercel-labs/agent-skills — bộ quy tắc
  chính thức của Vercel, chỉ đọc và viết lại, không cài package của họ). Dùng khi viết mới hoặc
  tối ưu code React/Next.js trong project này: tránh waterfall khi gọi dữ liệu, giảm bundle
  size, cache phía server (RSC).
---

# Kỹ thuật Next.js/React hiệu năng cao

Bản đồng bộ với skill `nextjs-perf-sk` bên Claude Code (`~/.claude/skills/nextjs-perf-sk/`) —
chỉ chọn lọc phần tác động lớn nhất từ nguồn, không copy nguyên văn toàn bộ.

## 1. Tránh "waterfall" (chờ tuần tự không cần thiết)
Khi 1 trang/route cần gọi nhiều nguồn dữ liệu độc lập (DB, API ngoài...), gọi song song bằng
`Promise.all()` thay vì `await` tuần tự từng cái. Đây là lỗi hiệu năng phổ biến nhất, tác động
lớn nhất tới tốc độ tải trang — ưu tiên sửa trước các lỗi hiệu năng khác.

## 2. Giảm kích thước bundle
- Dùng `dynamic import` (`next/dynamic`) cho component nặng không cần hiện ngay khi tải trang.
- Tránh import cả 1 thư viện lớn chỉ để dùng 1 hàm nhỏ — kiểm tra có bản import lẻ/tree-shakeable
  không trước khi import nguyên thư viện.

## 3. Cache phía server (RSC/route handler)
- Dùng `React.cache()` để tránh gọi trùng cùng 1 query trong 1 lần render.
- Đừng lưu dữ liệu theo từng request vào biến cấp module (module-level) dùng chung — dễ lẫn dữ
  liệu giữa các user/request khác nhau.
- **Bài học đã gặp thật ở chính project này:** `export const dynamic = "force-dynamic"` KHÔNG đủ
  để tắt cache khi route đọc dữ liệu qua `fetch()` (kể cả gọi REST API ngoài như Supabase) — phải
  thêm cả `export const fetchCache = "force-no-store"` mới chắc chắn dữ liệu luôn mới cho mọi tổ
  hợp query/filter, không chỉ query mặc định (xem `web/app/api/items/route.js`).

## Nguồn
Rút gọn từ [vercel-labs/agent-skills — react-best-practices](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/AGENTS.md)
(bộ quy tắc chính thức của Vercel, 40+ quy tắc chi tiết trong 8 nhóm — chỉ lấy nhóm "CRITICAL"/
"HIGH" tác động lớn nhất, bỏ qua micro-optimization). Đọc trực tiếp nội dung công khai trên
GitHub, KHÔNG cài package/chạy script của họ.
