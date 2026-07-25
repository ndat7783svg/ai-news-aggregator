# HANDOFF.md — Nhật ký bàn giao giữa các AI/công cụ

> File này dùng khi làm việc trên dự án bằng **nhiều công cụ AI khác nhau** (Claude Code,
> Antigravity, ...). Đọc `CLAUDE.md` trước để biết tổng quan dự án — file này chỉ ghi
> **nhật ký các phiên làm việc gần đây**, để công cụ sau/người kiểm tra biết công cụ trước
> đã làm gì, tại sao, và còn gì dang dở.

## Quy tắc ghi (dành cho AI đang đọc file này)

- Mỗi khi làm xong một việc (sửa bug, thêm tính năng, đổi cấu hình...), **thêm một mục mới
  vào cuối file**, KHÔNG sửa/xoá mục cũ.
- Mỗi mục gồm: ngày giờ, công cụ nào làm, đã làm gì (ngắn gọn), file nào đổi, còn gì dang dở
  hoặc cần người dùng xác nhận thêm.
- Đây là **tường thuật ý định**, không thay thế `git log`/`git diff` — người kiểm tra sẽ đối
  chiếu lại bằng git, nên ghi trung thực, đừng tô hồng kết quả.
- Nếu việc đang làm liên quan quyết định đã chốt trong `CLAUDE.md` (mục 4) hoặc việc dang dở
  (mục 3), nhắc lại tên mục đó để tránh làm lại/đề xuất lại điều đã quyết.

## Nhật ký

### 2026-07-25 — Claude Code (Opus 5)
- Chẩn đoán & sửa sự cố Actions kẹt hàng loạt (run #128 kẹt `queued` ~5 tiếng, chặn ~20 run
  sau bị `cancelled`, web đứng tin). Nguyên nhân: `concurrency.cancel-in-progress: false` trong
  `.github/workflows/collect.yml`.
- Đổi `cancel-in-progress: true` + thêm `timeout-minutes: 10`. Commit `68f3a11`, đã push.
- Đã xác minh: run mới nhất chạy thành công (~19s), web có tin mới trở lại.
- Cập nhật `CLAUDE.md` mục 5 (thêm ghi chú sự cố này) — **chưa commit**, còn nằm ở working tree.
- Tạo file `HANDOFF.md` này.
