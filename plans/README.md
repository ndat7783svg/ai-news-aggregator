# plans/ — Ý tưởng/plan từ Codex hoặc Antigravity, mang qua Claude bàn

> Chiều ngược lại của `tasks/`: ở đó Claude giao việc cho Codex; ở đây Codex/Antigravity mang
> ý tưởng/plan qua để Claude Code (cùng user) đọc và bàn luận trước khi cho phép thực hiện.

## Cách dùng

1. Trước tiên (một lần, hoặc mỗi khi nhắc soạn plan mới), bạn nói với Codex hoặc Antigravity:
   *"đọc file `plans/README.md` rồi soạn plan theo đúng format đó."* Chúng KHÔNG tự phát hiện
   thư mục này — bạn phải trỏ vào mỗi lần.
2. Codex hoặc Antigravity soạn 1 file `.md` mô tả ý tưởng/plan, đặt vào **`plans/incoming/`**.
3. Báo lại cho user: *"Plan đã lưu ở `plans/incoming/<tên file>.md` — nhờ Claude Code xem
   trước khi mình bắt đầu."* **KHÔNG tự ý bắt đầu code** khi chưa có xác nhận từ user là đã
   bàn xong với Claude.
4. User mở chat Claude Code, nói kiểu *"check plan"* hoặc *"có plan chưa"* — Claude đọc file,
   đối chiếu với `CLAUDE.md`/`AGENTS.md` (việc dang dở + quyết định đã chốt), rồi bàn luận cùng
   user ngay trong chat (không sửa trực tiếp vào file plan).
5. Khi hai bên thống nhất, Claude viết 1 file task mới vào **`tasks/todo/`** (xem
   [`tasks/README.md`](../tasks/README.md)) làm lệnh thực thi thật sự, có dòng "Nguồn:
   `plans/done/<tên file>.md`" trong phần Bối cảnh. Sau đó Claude chuyển file plan gốc
   sang **`plans/done/`**. Từ đây quy trình giao/nhận việc chạy y hệt cơ chế `tasks/` sẵn có
   (xem `tasks/README.md`): user trỏ Codex đọc file task, Codex làm, Claude kiểm tra, chuyển
   sang `tasks/done/`.
6. Nếu ý tưởng bị loại (quyết định không làm), Claude vẫn chuyển file sang `plans/done/`,
   thêm 1 dòng đầu file kiểu "Không thực hiện — <lý do>" để sau này đọc lại không nhầm là đã
   làm.

## Format 1 file plan

```markdown
# <Tên plan>

**Từ:** Codex | Antigravity
**Ngày:** YYYY-MM-DD

## Bối cảnh / Mục tiêu
1-2 câu: đang giải quyết vấn đề gì, để làm gì.

## Plan chi tiết
Các bước dự kiến, file sẽ đổi, rủi ro/đánh đổi nếu có.

---
⚠️ **Plan này cần mang qua Claude Code bàn luận trước. KHÔNG tự ý bắt đầu code.**
Soạn xong, báo lại cho user: "Plan đã lưu ở `plans/incoming/<tên file>.md` — nhờ Claude Code
xem trước khi mình bắt đầu." Chờ user xác nhận đã bàn xong với Claude rồi mới thực hiện.
```

## Quy ước đặt tên file

`YYYY-MM-DD-mo-ta-ngan-<nguon>.md`, `<nguon>` là `codex` hoặc `antigravity`.
Ví dụ: `2026-07-27-them-nguon-blog-anthropic-antigravity.md`.
