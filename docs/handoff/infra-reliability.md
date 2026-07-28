# Độ tin cậy hạ tầng (GitHub Actions)

Sự cố vận hành liên quan tới GitHub Actions/pipeline tự động và cách đã xử lý.

### 2026-07-25 — Claude Code (Opus 5)
- Chẩn đoán & sửa sự cố Actions kẹt hàng loạt (run #128 kẹt `queued` ~5 tiếng, chặn ~20 run
  sau bị `cancelled`, web đứng tin). Nguyên nhân: `concurrency.cancel-in-progress: false` trong
  `.github/workflows/collect.yml`.
- Đổi `cancel-in-progress: true` + thêm `timeout-minutes: 10`. Commit `68f3a11`, đã push.
- Đã xác minh: run mới nhất chạy thành công (~19s), web có tin mới trở lại.
- Cập nhật `CLAUDE.md` mục 5 (thêm ghi chú sự cố này) — **chưa commit**, còn nằm ở working tree.
- Tạo file `HANDOFF.md` này.
