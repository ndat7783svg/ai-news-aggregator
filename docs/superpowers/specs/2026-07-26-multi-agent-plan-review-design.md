# Thiết kế: Quy trình duyệt plan từ Codex/Antigravity (thư mục `plans/`)

Ngày: 2026-07-26
Trạng thái: Đã duyệt (chờ viết plan triển khai)

## Bối cảnh & vấn đề

Dự án đã có cơ chế `tasks/` cho chiều **Claude → Codex**: Claude viết file task vào
`tasks/todo/`, user trỏ Codex đọc và làm, Claude kiểm tra bằng git diff/log rồi chuyển file
sang `tasks/done/` (xem `tasks/README.md`, `PROJECT_MAP.md`).

User muốn thêm chiều **ngược lại**: Codex hoặc Antigravity tự soạn ý tưởng/plan trước, rồi
đưa qua để Claude Code đọc, đối chiếu với các quyết định đã chốt trong `CLAUDE.md`/`AGENTS.md`,
và **duyệt** trước khi Codex/Antigravity được phép thực hiện. Vai trò của Claude ở đây giống
người giám sát/kiểm duyệt: Codex code → Claude check; Antigravity lên plan → Claude duyệt.

Ràng buộc quan trọng:
- Cả 3 công cụ (Claude Code, Codex, Antigravity) đều chạy **local, cùng thư mục**
  `D:\news-summary-web-project` — nên có thể dùng file trên đĩa làm kênh trao đổi, **không
  cần user tự copy/download** file giữa các công cụ.
- User không phải lập trình viên, muốn quy trình **nhàn nhất có thể** — không muốn phải tự
  gõ lại nội dung, không muốn bước thủ công thừa.
- Codex/Antigravity phải **biết trước** là plan cần Claude duyệt, không được tự ý bắt đầu code
  ngay sau khi soạn xong plan.
- Việc báo "đã duyệt, làm đi" giữa các công cụ vẫn do **user chuyển lời bằng miệng** (không
  cần cơ chế tự động thông báo qua lại giữa các tool) — giữ đơn giản, không cần webhook/API.

## Thiết kế

### Cấu trúc thư mục mới

```
plans/
  README.md          # hướng dẫn format, trỏ Codex/Antigravity đọc 1 lần
  incoming/          # plan mới, chờ Claude duyệt
  approved/          # Claude đã duyệt, đã đánh dấu trong file
```

Thêm `plans/incoming/.gitkeep` và `plans/approved/.gitkeep` để git track thư mục rỗng (giống
cách `tasks/todo/` và `tasks/done/` đang làm).

### Quy ước tên file

`YYYY-MM-DD-mo-ta-ngan-<nguon>.md`, `<nguon>` là `codex` hoặc `antigravity`.
Ví dụ: `2026-07-27-them-nguon-blog-anthropic-antigravity.md`.

### Format bắt buộc trong 1 file plan (quy định ở `plans/README.md`)

```markdown
# <Tên plan>

**Từ:** Codex | Antigravity
**Ngày:** YYYY-MM-DD

## Bối cảnh / Mục tiêu
1-2 câu: đang giải quyết vấn đề gì, để làm gì.

## Plan chi tiết
Các bước dự kiến, file sẽ đổi, rủi ro/đánh đổi nếu có.

---
⚠️ **Plan này cần Claude Code đọc & duyệt trước khi thực hiện. KHÔNG tự ý bắt đầu code.**
Soạn xong, báo lại cho user: "Plan đã lưu ở `plans/incoming/<tên file>.md` — nhờ Claude Code
duyệt trước khi mình bắt đầu." Chờ user xác nhận Claude đã duyệt rồi mới thực hiện.
```

`plans/README.md` nêu rõ: user cần trỏ Codex/Antigravity đọc file README này (một lần, hoặc
mỗi khi nhắc chúng soạn plan) để chúng tự áp dụng format + đoạn cảnh báo cuối, giống cách
`tasks/README.md` đang vận hành cho chiều ngược lại.

### Quy trình duyệt (Claude Code thực hiện)

1. User báo có plan mới (không cần cú pháp cố định, câu tự nhiên kiểu "check plan", "có plan
   chưa" là đủ) — Claude liệt kê `plans/incoming/`.
2. Claude đọc từng file, đối chiếu với `CLAUDE.md`/`AGENTS.md` mục 3 (việc dang dở) và mục 4
   (quyết định đã chốt) để tránh xung đột hoặc đề xuất lại điều đã quyết.
3. Claude trả lời trong chat: **Duyệt** hoặc **Cần sửa** kèm lý do cụ thể — không chỉ nói
   "ổn"/"không ổn" chung chung.
4. Nếu **duyệt**: Claude chèn khối sau vào đầu file (trước dòng `# <Tên plan>`):
   ```
   ✅ ĐÃ DUYỆT bởi Claude Code — YYYY-MM-DD
   Ghi chú: <điều kiện/lưu ý khi thực hiện, nếu có>
   ---
   ```
   rồi di chuyển file sang `plans/approved/`.
5. Nếu **cần sửa**: Claude để nguyên file ở `plans/incoming/`, chỉ nêu rõ trong chat cần sửa
   gì. User tự quay lại Codex/Antigravity yêu cầu sửa (có thể ghi đè cùng file hoặc tạo file
   mới cùng tên gốc).
6. Việc báo "đã duyệt, làm đi" giữa các công cụ do **user tự nói miệng** — không cần Claude
   làm gì thêm ở bước này.

### Không làm (ngoài phạm vi)

- Không tạo thư mục `plans/rejected/` riêng — trạng thái "cần sửa" chỉ thể hiện qua việc file
  còn nằm ở `incoming/` + phản hồi trong chat, không cần thư mục riêng.
- Không ghi log việc duyệt plan vào `HANDOFF.md` — `HANDOFF.md` chỉ dùng để log **code thật đã
  chạy xong** (đối chiếu được bằng git diff/log), còn duyệt plan là bước bàn luận, trạng thái
  đã nằm sẵn trong tên thư mục (`incoming` vs `approved`) và khối duyệt trong file.
- Không xây cơ chế tự động (webhook, watch file, thông báo qua lại) giữa Claude/Codex/
  Antigravity — cả 3 đều là tool được user vận hành thủ công qua chat riêng biệt, không có API
  hay tiến trình nền chung để tự động hoá thêm mà không phức tạp hoá quá mức cần thiết.

### Cập nhật `PROJECT_MAP.md`

Thêm dòng vào bảng file chính mô tả `plans/` (tương tự dòng đã có cho `tasks/`), để bản đồ dự
án khớp thực tế.

## Việc khác liên quan (ngoài phạm vi spec này)

User yêu cầu ghi nhận mẫu hình này (thư mục điều phối nhiều AI agent cùng làm 1 project) vào
skill cá nhân `app-web-sk` (`C:\Users\ADMIN\.claude\skills\app-web-sk\SKILL.md`) để áp dụng cho
các project mới sau này, không chỉ riêng dự án này. Việc cập nhật skill cá nhân này thực hiện
riêng, không nằm trong plan triển khai của spec này (spec này chỉ tạo `plans/` cho dự án
`news-summary-web-project`).
