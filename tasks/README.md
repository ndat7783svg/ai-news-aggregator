# tasks/ — Giao việc cho Codex (hoặc agent thực thi khác)

## Cách dùng
1. Claude (tôi) viết 1 file `.md` mô tả việc cần làm, đặt vào **`tasks/todo/`**.
2. Bạn mở chat Codex, nói: *"đọc file `tasks/todo/<tên file>.md` rồi làm theo"*
   (Codex KHÔNG tự động phát hiện file mới — bạn phải trỏ nó vào file mỗi lần).
3. Codex làm xong, tạo commit/PR như bình thường.
4. Quay lại đây, tôi kiểm tra bằng `git diff`/`git log` thật (không tin lời Codex tự kể),
   ghi kết quả vào [`HANDOFF.md`](../HANDOFF.md), rồi **di chuyển file task đó sang
   `tasks/done/`**.

## Format 1 file task

```markdown
# <Tên việc ngắn gọn>

## Mục tiêu
1-2 câu: làm gì, để làm gì.

## Bối cảnh
Liên kết tới mục trong CLAUDE.md nếu có (VD: "xem CLAUDE.md mục 3 — chưa tìm nguồn cho
Anthropic/Gemini/Grok"). Nêu quyết định đã chốt cần tuân theo (CLAUDE.md mục 4), tránh Codex
đề xuất lại điều đã quyết.

## Việc cần làm
- [ ] Bước 1
- [ ] Bước 2
- [ ] ...

## Tiêu chí hoàn thành / cách verify
Làm sao biết đã xong đúng — chạy lệnh gì, xem gì trên web, test nào phải pass.

## KHÔNG được làm
Ranh giới rõ ràng — VD: không đổi sang model khác, không tự ý sửa schema DB, không push
thẳng lên main nếu chưa qua review.
```

## Quy ước đặt tên file
`YYYY-MM-DD-mo-ta-ngan.md`, ví dụ: `2026-07-26-tim-nguon-blog-ai-lon.md`

## Task xuất phát từ một plan (`plans/`)

Ngoài việc Claude tự khởi xướng, 1 file task ở đây cũng có thể là kết quả của việc bàn luận
một ý tưởng/plan do Codex hoặc Antigravity mang qua (xem [`plans/README.md`](../plans/README.md)).
Trường hợp đó, thêm 1 dòng trong mục **Bối cảnh** của file task:

```
Nguồn: plans/done/<tên file plan gốc>.md
```

để giữ liên kết ngược lại lý do/ngữ cảnh ban đầu.
