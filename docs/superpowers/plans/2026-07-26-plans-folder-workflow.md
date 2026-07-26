# Thư mục plans/ — Quy trình bàn plan từ Codex/Antigravity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo thư mục `plans/` để Codex/Antigravity thả ý tưởng/plan vào, cùng tài liệu hướng
dẫn để Claude Code (và user) đọc, bàn luận, rồi chuyển thành task thực thi trong `tasks/todo/`
sẵn có.

**Architecture:** Thuần tài liệu + cấu trúc thư mục (không có code chạy được) — 3 file mới/sửa:
`plans/README.md` (mới), `plans/incoming/.gitkeep` + `plans/done/.gitkeep` (mới),
`tasks/README.md` (sửa, thêm ghi chú liên kết), `PROJECT_MAP.md` (sửa, thêm dòng mô tả).

**Tech Stack:** Markdown thuần, git. Không có runtime/dependency nào khác.

## Global Constraints

- Spec nguồn: `docs/superpowers/specs/2026-07-26-multi-agent-plan-review-design.md` — mọi task
  bên dưới phải khớp nội dung đã duyệt ở đó, không tự thêm bớt.
- KHÔNG tạo `plans/approved/` hay bất kỳ cơ chế đánh dấu "đã duyệt" riêng trong file plan —
  trạng thái đã bàn xong thể hiện qua việc có file task tương ứng trong `tasks/todo/`.
- KHÔNG thêm cơ chế tự động (watch file, webhook, script) — toàn bộ quy trình là thủ công qua
  chat, giống cách `tasks/` đang vận hành.
- KHÔNG ghi log việc bàn plan vào `HANDOFF.md` — `HANDOFF.md` chỉ log code thật đã chạy xong.
- Tên thư mục cố định: `plans/incoming/` (chờ bàn) và `plans/done/` (đã bàn xong, chỉ lưu vết).
- Quy ước tên file plan: `YYYY-MM-DD-mo-ta-ngan-<nguon>.md`, `<nguon>` ∈ {`codex`,
  `antigravity`}.

---

### Task 1: Tạo khung thư mục `plans/` + `plans/README.md`

**Files:**
- Create: `plans/README.md`
- Create: `plans/incoming/.gitkeep`
- Create: `plans/done/.gitkeep`

**Interfaces:**
- Consumes: không phụ thuộc task nào khác.
- Produces: thư mục `plans/incoming/` và `plans/done/` mà Task 2 (ghi chú trong
  `tasks/README.md`) sẽ tham chiếu tới bằng đường dẫn tương đối `../plans/README.md`.

- [ ] **Step 1: Tạo file `plans/incoming/.gitkeep` (rỗng)**

Tạo file rỗng để git track thư mục trống (git không track thư mục rỗng), giống cách
`tasks/todo/.gitkeep` đang làm.

Nội dung file: để trống (0 byte).

- [ ] **Step 2: Tạo file `plans/done/.gitkeep` (rỗng)**

Nội dung file: để trống (0 byte).

- [ ] **Step 3: Viết `plans/README.md`**

```markdown
# plans/ — Ý tưởng/plan từ Codex hoặc Antigravity, mang qua Claude bàn

> Chiều ngược lại của `tasks/`: ở đó Claude giao việc cho Codex; ở đây Codex/Antigravity mang
> ý tưởng/plan qua để Claude Code (cùng user) đọc và bàn luận trước khi cho phép thực hiện.

## Cách dùng

1. Codex hoặc Antigravity soạn 1 file `.md` mô tả ý tưởng/plan, đặt vào **`plans/incoming/`**.
2. Báo lại cho user: *"Plan đã lưu ở `plans/incoming/<tên file>.md` — nhờ Claude Code xem
   trước khi mình bắt đầu."* **KHÔNG tự ý bắt đầu code** khi chưa có xác nhận từ user là đã
   bàn xong với Claude.
3. User mở chat Claude Code, nói kiểu *"check plan"* hoặc *"có plan chưa"* — Claude đọc file,
   đối chiếu với `CLAUDE.md`/`AGENTS.md` (việc dang dở + quyết định đã chốt), rồi bàn luận cùng
   user ngay trong chat (không sửa trực tiếp vào file plan).
4. Khi hai bên thống nhất, Claude viết 1 file task mới vào **`tasks/todo/`** (xem
   [`tasks/README.md`](../tasks/README.md)) làm lệnh thực thi thật sự, có dòng "Nguồn:
   `plans/incoming/<tên file>.md`" trong phần Bối cảnh. Sau đó Claude chuyển file plan gốc
   sang **`plans/done/`**.
5. Nếu ý tưởng bị loại (quyết định không làm), Claude vẫn chuyển file sang `plans/done/`,
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
```

- [ ] **Step 4: Kiểm tra cấu trúc vừa tạo**

Run:
```bash
ls plans/ plans/incoming/ plans/done/
```
Expected: `plans/` chứa `README.md`, `incoming`, `done`; `plans/incoming/` và `plans/done/`
mỗi thư mục chứa `.gitkeep`.

- [ ] **Step 5: Commit**

```bash
git add plans/
git commit -m "docs: tạo thư mục plans/ cho quy trình bàn plan từ Codex/Antigravity"
```

---

### Task 2: Ghi chú liên kết trong `tasks/README.md`

**Files:**
- Modify: `tasks/README.md`

**Interfaces:**
- Consumes: `plans/README.md` từ Task 1 (đường dẫn tương đối `../plans/README.md`).
- Produces: không có gì task khác phụ thuộc — đây là task cuối cùng của chuỗi liên kết
  tài liệu.

- [ ] **Step 1: Thêm đoạn ghi chú vào cuối `tasks/README.md`**

Mở `tasks/README.md`, thêm đoạn sau vào **cuối file** (sau mục "Quy ước đặt tên file" hiện có):

```markdown

## Task xuất phát từ một plan (`plans/`)

Ngoài việc Claude tự khởi xướng, 1 file task ở đây cũng có thể là kết quả của việc bàn luận
một ý tưởng/plan do Codex hoặc Antigravity mang qua (xem [`plans/README.md`](../plans/README.md)).
Trường hợp đó, thêm 1 dòng trong mục **Bối cảnh** của file task:

```
Nguồn: plans/done/<tên file plan gốc>.md
```

để giữ liên kết ngược lại lý do/ngữ cảnh ban đầu.
```

- [ ] **Step 2: Kiểm tra file sau khi sửa**

Run:
```bash
grep -n "Task xuất phát từ một plan" tasks/README.md
```
Expected: in ra đúng 1 dòng khớp, xác nhận đoạn mới đã được thêm.

- [ ] **Step 3: Commit**

```bash
git add tasks/README.md
git commit -m "docs: ghi chú tasks/ có thể xuất phát từ 1 plan ở plans/"
```

---

### Task 3: Cập nhật `PROJECT_MAP.md`

**Files:**
- Modify: `PROJECT_MAP.md:60` (dòng mô tả `tasks/` trong bảng "File / thư mục chính")

**Interfaces:**
- Consumes: không phụ thuộc nội dung Task 1/2, chỉ cần biết `plans/` tồn tại (thứ tự thực hiện
  sau Task 1 để tránh mô tả một thư mục chưa tồn tại, nhưng không có phụ thuộc kỹ thuật).
- Produces: không có gì phụ thuộc theo sau.

- [ ] **Step 1: Thêm 1 dòng mới vào bảng, ngay sau dòng `tasks/`**

Trong `PROJECT_MAP.md`, tìm dòng (dòng 60 hiện tại):

```
| `tasks/` | Giao việc dạng file `.md` cho agent thực thi (Codex): `tasks/todo/` = chưa làm, `tasks/done/` = đã xong & đã review. Xem `tasks/README.md` cho format. |
```

Thêm ngay dòng sau nó:

```
| `plans/` | Ý tưởng/plan từ Codex hoặc Antigravity mang qua Claude bàn (chiều ngược `tasks/`): `plans/incoming/` = chờ bàn, `plans/done/` = đã bàn xong (chỉ lưu vết). Chốt xong thì tạo task mới ở `tasks/todo/`, không tự đánh dấu "duyệt" trong file plan. Xem `plans/README.md`. |
```

- [ ] **Step 2: Kiểm tra**

Run:
```bash
grep -n "plans/" PROJECT_MAP.md
```
Expected: thấy dòng bảng mới vừa thêm, nằm ngay sau dòng `tasks/`.

- [ ] **Step 3: Commit**

```bash
git add PROJECT_MAP.md
git commit -m "docs: thêm plans/ vào bản đồ file chính PROJECT_MAP.md"
```

---

## Sau khi hoàn thành

Toàn bộ 3 task trên là phần triển khai của spec
`docs/superpowers/specs/2026-07-26-multi-agent-plan-review-design.md`. Việc còn lại **ngoài
phạm vi plan này** (đã ghi rõ trong spec, mục "Việc khác liên quan"): cập nhật skill cá nhân
`app-web-sk` (`C:\Users\ADMIN\.claude\skills\app-web-sk\SKILL.md`) để ghi nhận mẫu hình
`tasks/`+`plans/` cho các project mới sau này — làm riêng, không phải 1 task ở đây.
