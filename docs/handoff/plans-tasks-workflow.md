# Cơ chế plans/ ↔ tasks/

Quy trình nhận ý tưởng/plan từ Codex hoặc Antigravity, bàn với user, rồi giao việc thực thi.

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
  Antigravity lưu vào `plans/incoming/` theo đúng format.
- Cập nhật `CLAUDE.md` + đồng bộ `AGENTS.md` phản ánh toàn bộ việc trên.
- Đã push lên `origin/main` (HEAD lúc push: `1e97678`; còn phần fix CLAUDE.md/AGENTS.md/HANDOFF.md
  này chưa push, sẽ push ở cuối phiên).
