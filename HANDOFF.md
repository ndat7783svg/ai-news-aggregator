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

### 2026-07-26 — Claude Code (Sonnet 5)
- Tạo cơ chế `plans/` — chiều ngược lại `tasks/`: Codex/Antigravity thả ý tưởng/plan vào
  `plans/incoming/`, Claude bàn cùng user trong chat, chốt xong thì Claude viết task thực thi
  thẳng vào `tasks/todo/` (không có `plans/approved/` riêng — quyết định đơn giản hoá theo yêu
  cầu user giữa chừng). Spec: `docs/superpowers/specs/2026-07-26-multi-agent-plan-review-design.md`;
  plan: `docs/superpowers/plans/2026-07-26-plans-folder-workflow.md`.
- File thay đổi: mới `plans/README.md`, `plans/incoming/.gitkeep`, `plans/done/.gitkeep`; sửa
  `tasks/README.md` (thêm mục liên kết ngược từ plan), `PROJECT_MAP.md` (thêm dòng `plans/`).
- Tiện thể dọn nợ cũ: commit nốt phần `PROJECT_MAP.md` còn treo từ phiên trước (domain
  `bainews.site`, dòng CLAUDE.md/AGENTS.md/HANDOFF.md/tasks/), và track `tasks/README.md` +
  `tasks/todo/.gitkeep` + `tasks/done/.gitkeep` vào git (trước giờ nằm trên đĩa nhưng chưa từng
  commit).
- Chạy qua quy trình subagent-driven-development (implementer + reviewer riêng cho từng bước +
  1 lượt review tổng thể bằng Opus) — review tổng thể bắt được 2 lỗi thật: link "Nguồn:" trong
  `plans/README.md` trỏ sai (`plans/incoming/` thay vì `plans/done/`, đã sửa cả ở spec), và
  `plans/README.md` thiếu bước hướng dẫn user trỏ Codex/Antigravity đọc file này (đã bổ sung).
  Cả 2 lỗi đã sửa, commit riêng.
- **User phản hồi: quy trình trên tốn quá nhiều usage phiên (>20%) cho việc chỉ tạo vài file
  docs.** Đã chốt với user: từ nay KHÔNG dùng `superpowers:subagent-driven-development` cho task
  thông thường nữa — mặc định viết spec → làm từng task trực tiếp (Edit/Write, tự review, commit)
  → xong task này mới sang task kế, trừ trường hợp đặc biệt user đồng ý dùng lại. Đã lưu vào
  memory cá nhân (`feedback-right-size-process`), không phải điều chỉnh trong code/docs dự án.
- Có 1 plan mới từ Antigravity (qua trong lúc làm việc) về cải thiện hiển thị "Repo nổi bật"
  GitHub (thẻ hiển thị + luồng "Rising" cho repo mới nổi nhanh) — đã hướng dẫn user nhờ
  Antigravity lưu vào `plans/incoming/` theo đúng format. **Chưa đọc/bàn xong** — phiên sau kiểm
  tra `plans/incoming/` trước khi làm gì khác (xem CLAUDE.md mục 3, mục 7).
- Cập nhật `CLAUDE.md` + đồng bộ `AGENTS.md` (mục 2, 3, 7) phản ánh toàn bộ việc trên.
- Đã push lên `origin/main` (HEAD lúc push: `1e97678`; còn phần fix CLAUDE.md/AGENTS.md/HANDOFF.md
  này chưa push, sẽ push ở cuối phiên).
