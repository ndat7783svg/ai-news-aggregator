# Thiết kế: Quy trình duyệt plan từ Codex/Antigravity (thư mục `plans/`)

Ngày: 2026-07-26
Trạng thái: Đã duyệt (chờ viết plan triển khai)

## Bối cảnh & vấn đề

Dự án đã có cơ chế `tasks/` cho chiều **Claude → Codex**: Claude viết file task vào
`tasks/todo/`, user trỏ Codex đọc và làm, Claude kiểm tra bằng git diff/log rồi chuyển file
sang `tasks/done/` (xem `tasks/README.md`, `PROJECT_MAP.md`).

User muốn thêm chiều **ngược lại**: Codex hoặc Antigravity tự soạn ý tưởng/plan trước, đưa qua
để Claude Code đọc, bàn luận lại cùng user, rồi mới cho phép thực hiện. Vai trò của Claude ở
đây giống người giám sát/kiểm duyệt: Codex code → Claude check; Antigravity lên plan → Claude
duyệt.

Ràng buộc quan trọng:
- Cả 3 công cụ (Claude Code, Codex, Antigravity) đều chạy **local, cùng thư mục**
  `D:\news-summary-web-project` — nên dùng file trên đĩa làm kênh trao đổi, **không cần user
  tự copy/download** file giữa các công cụ.
- User không phải lập trình viên, muốn quy trình **nhàn nhất có thể**.
- Codex/Antigravity phải **biết trước** là plan cần mang qua Claude bàn, không được tự ý bắt
  đầu code ngay sau khi soạn xong plan.
- Việc báo "đã duyệt, làm đi" giữa các công cụ vẫn do **user chuyển lời bằng miệng**.

### Thiết kế ban đầu và lý do đơn giản hoá

Bản đầu tiên có thêm thư mục `plans/approved/` + đánh dấu "✅ ĐÃ DUYỆT" ngay trong file plan,
rồi dùng chính file đó làm lệnh thực thi. Bị thừa: có 2 nơi thể hiện "đã duyệt" (khối đánh dấu
trong file plan, và bản thân việc tồn tại ở `approved/`), trong khi định dạng plan (viết tự do)
lại không tốt bằng định dạng `tasks/` (có tiêu chí hoàn thành + ranh giới rõ) để giao việc thật.
**Quyết định cuối: bỏ `plans/approved/`, dùng thẳng `tasks/todo/` sẵn có làm nơi duy nhất chứa
lệnh thực thi**, bất kể ý tưởng đến từ Claude tự nghĩ ra hay từ Codex/Antigravity mang qua.

## Thiết kế

### Cấu trúc thư mục mới

```
plans/
  README.md          # hướng dẫn format, trỏ Codex/Antigravity đọc 1 lần
  incoming/          # plan/ý tưởng thô, chờ bàn luận cùng Claude+user
  done/              # đã bàn xong, đã chuyển thành task — chỉ lưu vết
```

Thêm `plans/incoming/.gitkeep` và `plans/done/.gitkeep` để git track thư mục rỗng (giống cách
`tasks/todo/` và `tasks/done/` đang làm — đặt tên `incoming/done` nhất quán với mẫu đó).

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
⚠️ **Plan này cần mang qua Claude Code bàn luận trước. KHÔNG tự ý bắt đầu code.**
Soạn xong, báo lại cho user: "Plan đã lưu ở `plans/incoming/<tên file>.md` — nhờ Claude Code
xem trước khi mình bắt đầu." Chờ user xác nhận đã bàn xong với Claude rồi mới thực hiện.
```

`plans/README.md` nêu rõ: user cần trỏ Codex/Antigravity đọc file README này (một lần, hoặc
mỗi khi nhắc chúng soạn plan) để chúng tự áp dụng format + đoạn cảnh báo cuối, giống cách
`tasks/README.md` đang vận hành cho chiều ngược lại.

### Quy trình (Claude Code thực hiện)

1. User báo có plan mới (câu tự nhiên kiểu "check plan", "có plan chưa" là đủ) — Claude liệt
   kê `plans/incoming/`.
2. Claude đọc file, đối chiếu với `CLAUDE.md`/`AGENTS.md` mục 3 (việc dang dở) và mục 4 (quyết
   định đã chốt) để tránh xung đột hoặc đề xuất lại điều đã quyết, rồi **bàn luận trong chat**
   cùng user — sửa/tinh chỉnh ý tưởng qua lại bằng lời, không sửa trực tiếp vào file plan.
3. Khi hai bên đã thống nhất, Claude **viết một file task mới vào `tasks/todo/`** theo đúng
   format sẵn có trong `tasks/README.md` (Mục tiêu / Bối cảnh / Việc cần làm / Tiêu chí hoàn
   thành / KHÔNG được làm) — đây là lệnh thực thi thật sự. Thêm dòng `Nguồn: plans/done/
   <tên file>.md` trong phần Bối cảnh để giữ liên kết ngữ cảnh.
4. Claude di chuyển file plan gốc từ `plans/incoming/` sang `plans/done/` (chỉ lưu vết, không
   cần đánh dấu gì thêm — file task ở `tasks/todo/` chính là bằng chứng đã bàn xong).
5. Từ đây quy trình giao/nhận việc chạy y hệt cơ chế `tasks/` sẵn có: user trỏ Codex đọc file
   task, Codex làm, Claude kiểm tra bằng git diff/log, chuyển sang `tasks/done/`, ghi log vào
   `HANDOFF.md`.
6. Nếu bàn xong nhưng **quyết định không làm** (ý tưởng bị loại): Claude vẫn chuyển file sang
   `plans/done/`, chỉ khác là không tạo file task tương ứng — nêu rõ lý do loại bỏ trong chat
   (có thể note thêm 1 dòng ngắn ở đầu file plan trước khi chuyển, kiểu "Không thực hiện —
   <lý do>", để sau này đọc lại `plans/done/` không nhầm là đã làm).

### Không làm (ngoài phạm vi)

- Không tạo `plans/approved/` hay bất kỳ trạng thái đánh dấu riêng nào trong file plan — trạng
  thái "đã duyệt/đã bàn" thể hiện qua việc tồn tại file task tương ứng trong `tasks/todo/`.
- Không ghi log việc bàn luận plan vào `HANDOFF.md` — `HANDOFF.md` chỉ dùng để log **code thật
  đã chạy xong** (đối chiếu được bằng git diff/log). Việc bàn plan chỉ là bước trước đó.
- Không xây cơ chế tự động (webhook, watch file, thông báo qua lại) giữa Claude/Codex/
  Antigravity — cả 3 đều là tool được user vận hành thủ công qua chat riêng biệt.

### Cập nhật file liên quan

- `PROJECT_MAP.md`: thêm dòng mô tả `plans/` vào bảng file chính (tương tự dòng đã có cho
  `tasks/`).
- `tasks/README.md`: thêm 1-2 câu ghi chú rằng task trong `tasks/todo/` có thể xuất phát từ
  một plan ở `plans/` (không chỉ do Claude tự khởi xướng), kèm quy ước dòng "Nguồn:" khi áp
  dụng.

## Việc khác liên quan (ngoài phạm vi spec này)

User yêu cầu ghi nhận mẫu hình này (thư mục điều phối nhiều AI agent cùng làm 1 project) vào
skill cá nhân `app-web-sk` (`C:\Users\ADMIN\.claude\skills\app-web-sk\SKILL.md`) để áp dụng cho
các project mới sau này, không chỉ riêng dự án này. Việc cập nhật skill cá nhân này thực hiện
riêng, không nằm trong plan triển khai của spec này (spec này chỉ tạo `plans/` cho dự án
`news-summary-web-project`).
