# Mở rộng nguồn GitHub

Mạch tiến hoá tính năng GitHub: luồng "🔥 Trending" thật (daily/weekly), gom bộ lọc thành 1 nút,
rồi mở rộng thêm "Kinh điển" + "Trending tháng" + tách khỏi feed "Tất cả".

### 2026-07-26 — Claude Code (Opus 5) + Codex: luồng "🔥 Trending" GitHub daily/weekly
- **Xử lý xong plan Antigravity đang chờ** (`plans/incoming/` → `plans/done/`). Bàn với user và
  **chốt khác plan gốc**: bỏ phần "Rising" theo ngưỡng sao tuyệt đối (repo mới tạo ≤30 ngày,
  ≥50 sao) vì dễ ra 0 kết quả nhiều ngày; thay bằng đọc thẳng trang **github.com/trending**
  (daily + weekly) — đúng thứ user muốn đọc. Cũng **bỏ phần C2** (hạ ngưỡng `github_trending`
  500→200): user quyết giữ nguyên 500. Phần C3 (update sao repo cũ) vẫn gác lại.
- Claude viết task `tasks/todo/2026-07-26-cai-thien-hien-thi-thu-thap-github.md` → Codex thực thi
  trên nhánh `codex/github-trending` (worktree riêng `D:/news-summary-web-project-github-trending`,
  để **chưa commit**) → Claude kiểm tra thật rồi mới gộp.
- **Kiểm tra thật (không tin lời kể):** chạy `npm run collect` (132 tin, GitHub 92), chạy riêng
  collector trending (17 repo trên trang → lọc còn 7 repo AI thật, loại đúng nodejs/jenkins/VPN/
  game), `npm test` 4/4 pass, `npm run build` trong `web/` pass.
- **Claude sửa 1 lỗi thật của Codex trước khi gộp:** hàm lọc AI khớp kiểu "chứa chuỗi con" nên
  từ khoá `rag` dính vào *storage*/*fragment*/*dragon* → repo không liên quan sẽ lọt vào feed.
  Đổi sang khớp **ranh giới từ** cho mọi từ khoá, test lại 8/8 đúng.
- **Ngoài phạm vi task nhưng chấp nhận** (đã báo user): Codex đổi `web/next.config.js` →
  `next.config.mjs` + thêm `"type": "module"` vào `web/package.json` (cần thiết để file test ở
  gốc import được module trong `web/`). Build web vẫn pass nên giữ lại.
- File đổi: `collectors/github.js`, `collect.js`, `pipeline.js`, `package.json`,
  `web/components/NewsCard.js`, `web/lib/{filters,format,supabaseServer}.js`,
  `web/app/globals.css`, `web/next.config.mjs`, `test/github-trending.test.js`, `PROJECT_MAP.md`.
- Đã gộp vào `main` (merge `fad8445`) + push `e2dd90f` → Vercel tự deploy, pipeline tự chạy lần
  sau (cron-job.org 15').

### 2026-07-27 — Claude Code (Opus 5) + Antigravity: gom bộ lọc GitHub làm 1
- **Vấn đề:** sau khi thêm luồng Trending daily/weekly, hàng nút lọc có 3 nút GitHub rời
  (`GitHub Release`, `GitHub Trending`, `🔥 Trending`) — rối, sẽ càng rối nếu thêm nguồn GitHub
  nữa. User cân nhắc làm hẳn trang phụ cho GitHub; Claude khuyên KHÔNG (tách trang riêng là đổi
  luôn mô hình 1-feed đã chốt ở CLAUDE.md mục 4), thay bằng gom nhóm như cách 13 blog đang gom
  thành 3 nhóm. User đồng ý.
- **Cách làm đã chốt:** 1 nút "GitHub" gộp 4 nguồn trên hàng chính + 1 ô `<select>` phụ hiện khi
  chọn GitHub (Tất cả GitHub / Release / Trending nhiều sao / 🔥 Trending ngày / 🔥 Trending
  tuần). Tái dùng đúng pattern `<select>` của bộ lọc "Thời gian", KHÔNG dựng component dropdown
  mới. Entry con đánh dấu `parent: "github"` để ẩn khỏi hàng nút chính.
- **Lần đầu giao việc cho Antigravity** (Codex hết token tháng). Antigravity sửa thẳng trên
  `main`, để **chưa commit** — làm đúng task, không lan man ngoài phạm vi.
- **Kiểm tra thật:** máy không có `web/.env.local` nên trang chính không tải được dữ liệu →
  Claude tạo route tạm `web/app/tmp-uicheck/page.js` truyền props giả để kiểm tra UI, test xong
  **đã xoá** (build xác nhận sạch). Kết quả: nút gộp đúng, ô phụ hiện/ẩn đúng khi đổi filter,
  giữ đúng lựa chọn, nút "GitHub" vẫn `aria-pressed=true` khi đang chọn mục con.
- **Claude sửa thêm 1 chỗ (lỗi của task Claude viết, không phải Antigravity):** 3 mục con trong ô
  phụ thiếu `labelKey` nên chế độ EN vẫn hiện tiếng Việt. Đã thêm `githubSubStars/Daily/Weekly`
  vào `web/lib/i18n.js` + `labelKey` vào `web/lib/filters.js`, kiểm tra lại VI/EN đều đúng.
- File đổi: `web/lib/filters.js`, `web/lib/i18n.js`, `web/components/Feed.js`,
  `web/app/globals.css`. Thêm `.agents/skills/nextjs-perf-sk/SKILL.md` (skill Next.js cho
  Antigravity đọc).
- **Ngoài code dự án — cấu hình skill cho Antigravity (26-27/07):** tạo skill
  `nextjs-perf-sk` (tối ưu hiệu năng React/Next.js, rút gọn từ `vercel-labs/agent-skills`, chỉ
  ĐỌC nội dung công khai, KHÔNG cài package bên thứ 3) ở 2 nơi: `~/.claude/skills/nextjs-perf-sk/`
  (Claude Code) và `.agents/skills/nextjs-perf-sk/` (Antigravity, theo tài liệu chính thức ở
  `~/.gemini/antigravity/builtin/skills/agy-customizations/docs/skills.md`). Nguyên tắc chung
  `app-web-sk` copy sang `~/.gemini/GEMINI.md`. **CHÚ Ý: các bản này KHÔNG tự đồng bộ — sửa 1
  bên phải sửa bên kia.** User CHƯA xác nhận Antigravity có thật sự đọc `~/.gemini/GEMINI.md`
  hay không (vị trí này lấy từ nguồn ngoài, độ tin cậy thấp hơn phần `.agents/skills/`).

### 2026-07-27 — Claude Code (Opus 5) + Antigravity (model Gemini 3.6 Flash): mở rộng GitHub (Kinh điển + Trending tháng)
- **Vấn đề user nêu:** tin GitHub quá ít với developer muốn tìm repo — thiếu chiều rộng, thiếu
  repo "kinh điển" nổi lâu, thiếu góc nhìn top tháng. User tự chỉ ra rủi ro: bơm thêm ~150 repo
  vào feed "Tất cả" sẽ **lấp tin thời sự trong ngày** → chốt **tách hẳn 6 nguồn GitHub khỏi
  "Tất cả"** (GitHub đã có "Tất cả GitHub" riêng).
- **Phát hiện khi bàn thiết kế:** "Nổi bật nhất" trước nay KHÔNG dùng số sao cho GitHub (chỉ
  HN/Reddit có điểm) → mọi repo luôn bị đẩy xuống cuối. Đây là gốc rễ cảm giác "sắp xếp kiểu gì
  cũng rối". Fix: thêm `sortByStars`, chỉ áp dụng khi lọc thuần GitHub.
- Thiết kế đầy đủ: `docs/superpowers/specs/2026-07-27-github-expansion-classics-monthly-design.md`;
  task: `tasks/done/2026-07-27-mo-rong-github-kinh-dien-trending-thang.md`.
- **Antigravity làm task này với model Gemini 3.6 Flash** (Antigravity là công cụ, model bên
  trong nó có thể đổi tuỳ lúc — Gemini 3.6 Flash không phải 1 agent riêng). Làm đúng phần lớn:
  collector `collectGithubClassics`, 3 thay đổi logic `supabaseServer.js`, i18n **đủ cả VI+EN**,
  cập nhật **cả CLAUDE.md lẫn AGENTS.md** (2 lỗi Antigravity từng mắc ở task trước — lần này
  không lặp lại), tự thêm badge ở `web/lib/format.js` dù task không ghi (đúng quy ước dự án).
- **Claude phát hiện + sửa 2 lỗi thật trong `backfill-github-classics.js`:**
  1. **Ghi cả repo tóm tắt HỎNG vào DB** — dùng `insertItems(summarized)` thay vì lọc `ok` như
     `pipeline.js`. Hậu quả nếu để nguyên: thẻ trống vĩnh viễn trên web, chạy lại KHÔNG sửa được
     (dedupe theo source+source_id + upsert `ignoreDuplicates`). Đã thêm lọc + guard "hỏng toàn
     bộ → exit 1" giống pipeline.
  2. **Báo giá luôn $0.0000** — script truyền `onUsage` nhưng `summarizeMany()`/`summarizeItem()`
     KHÔNG nhận tham số đó (chỉ `translateTitle` có). Gemini copy nhầm khuôn từ
     `backfill-titles.js`. Đã thêm hỗ trợ `onUsage` vào `summarize/summarizer.js` theo đúng mẫu.
- **Kiểm tra thật:** build sạch; `node --check` mọi file backend; route tạm `web/app/tmp-uicheck/`
  xác nhận ô chọn GitHub đủ 7 mục + VI/EN đúng (test xong **đã xoá**).
- **Đã chạy backfill THẬT:** 136 repo kinh điển, **0 repo lỗi**, chi phí thật **$0.2656**
  (token vào=138143, ra=25496). Xác minh lại bằng query Supabase: 136 dòng `github_classics`,
  **0 dòng thiếu tóm tắt**. Có cả repo kinh điển thật (tensorflow, AutoGPT, ollama).
- **Lưu ý vận hành:** máy user KHÔNG có `GITHUB_TOKEN` trong `.env` → GitHub Search API giới hạn
  10 req/phút. Chạy script nhiều lần liên tiếp sẽ bị 403 rate limit và chỉ lấy được một phần
  (lần thử thứ 2 ra 89/136 repo). Không sao: đợi 1 phút chạy lại, repo đã lưu được bỏ qua, KHÔNG
  bị tính tiền 2 lần.
- File đổi: `lib/config.js`, `collectors/github.js`, `pipeline.js`, `collect.js`,
  `summarize/summarizer.js`, `backfill-github-classics.js` (mới), `web/lib/filters.js`,
  `web/lib/format.js`, `web/lib/i18n.js`, `web/lib/supabaseServer.js`, + tài liệu.

## Bài học lọc từ khoá (áp dụng mọi lần thêm nguồn mới)
So khớp từ khoá AI phải theo **ranh giới từ** (`\bkeyword\b`), KHÔNG dùng "chứa chuỗi con" — từ
khoá `rag` dính vào **sto*rag*e**/**f*rag*ment**/**d*rag*on** làm repo không liên quan lọt vào
feed AI.
