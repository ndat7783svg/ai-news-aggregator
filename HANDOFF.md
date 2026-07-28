# HANDOFF.md — Mục lục nhật ký bàn giao giữa các AI/công cụ

> File này dùng khi làm việc trên dự án bằng **nhiều công cụ AI khác nhau** (Claude Code,
> Antigravity, Codex, ...). Đọc `CLAUDE.md` trước để biết tổng quan dự án.
>
> Đây **chỉ là mục lục** — nội dung nhật ký thật nằm trong từng file ở `docs/handoff/`, tách theo
> **chủ đề/tính năng** (không theo buổi làm việc, vì 1 buổi thường đụng nhiều chủ đề). Mở đúng
> file chủ đề cần tra thay vì đọc hết mọi chủ đề.

## Quy tắc ghi (dành cho AI đang đọc file này)

1. **Xác định chủ đề** của việc vừa làm — 1 trong các file bên dưới, hoặc chủ đề hoàn toàn mới.
2. **Chủ đề đã có file** → mở đúng file đó trong `docs/handoff/`, **nối thêm** 1 mục
   `### YYYY-MM-DD — ...` mới vào cuối file, KHÔNG sửa/xoá mục cũ.
3. **Chủ đề mới** → tạo file mới `docs/handoff/<ten-chu-de>.md` (1 dòng giới thiệu đầu file + mục
   ngày-tháng), rồi thêm 1 dòng vào bảng mục lục bên dưới.
4. **1 buổi làm việc đụng nhiều chủ đề** → ghi vào nhiều file tương ứng, không gộp chung 1 chỗ.
5. Mỗi mục gồm: ngày, công cụ nào làm, đã làm gì (ngắn gọn), file nào đổi, còn gì dang dở. Đây là
   **tường thuật ý định**, không thay thế `git log`/`git diff` — ghi trung thực, đừng tô hồng.
6. Nếu việc đang làm liên quan quyết định đã chốt trong `CLAUDE.md` (mục 4) hoặc việc dang dở
   (mục 3), nhắc lại tên mục đó để tránh làm lại/đề xuất lại điều đã quyết.

## Mục lục theo chủ đề

- [Mở rộng nguồn GitHub](docs/handoff/github-source-expansion.md) — luồng "🔥 Trending"
  daily/weekly/tháng, gom bộ lọc thành 1 nút, "Kinh điển" 136 repo, bài học lọc từ khoá.
- [Đổi brand BAI News](docs/handoff/rebrand-bai-news.md) — SAI→BAI + banner 3 ngày, 2 bug
  i18n/theme phát hiện sau deploy.
- [SEO trang chuyên đề GitHub AI](docs/handoff/seo-content-pages.md) — `/github-ai` +
  `/en/github-ai` song ngữ, hreflang.
- [Nút Lưu/Chia sẻ](docs/handoff/save-share-feature.md) — danh sách localStorage, `/tin/[id]`,
  `/da-luu`, giao diện pill YouTube + menu ☰ header.
- [SEO cơ bản + Analytics + domain](docs/handoff/growth-seo-analytics.md) — robots/sitemap, số
  liệu traffic thật, `bainews.site` làm domain chính.
- [Cơ chế plans/ ↔ tasks/](docs/handoff/plans-tasks-workflow.md) — quy trình nhận ý tưởng từ
  Codex/Antigravity, bài học về quy trình subagent-driven-development tốn token.
- [Độ tin cậy hạ tầng](docs/handoff/infra-reliability.md) — sự cố Actions kẹt hàng đợi, fix
  `cancel-in-progress`.
