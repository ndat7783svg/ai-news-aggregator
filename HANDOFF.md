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
- **Còn dang dở / cần theo dõi:** (1) chưa xem kết quả thật trên web sau khi pipeline chạy lần
  tới — phiên sau kiểm tra feed có tin badge "🔥 Trending (ngày)/(tuần)" chưa; (2) worktree
  `D:/news-summary-web-project-github-trending` + nhánh `codex/github-trending` đã gộp xong,
  có thể xoá nếu không dùng nữa; (3) chi phí tóm tắt lô repo trending đầu tiên ~$0.05-0.10 một
  lần (đã báo user từ lúc bàn plan).

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
  Antigravity đọc, xem mục dưới).
- **Ngoài code dự án — cấu hình skill cho Antigravity (26-27/07):** tạo skill
  `nextjs-perf-sk` (tối ưu hiệu năng React/Next.js, rút gọn từ `vercel-labs/agent-skills`, chỉ
  ĐỌC nội dung công khai, KHÔNG cài package bên thứ 3) ở 2 nơi: `~/.claude/skills/nextjs-perf-sk/`
  (Claude Code) và `.agents/skills/nextjs-perf-sk/` (Antigravity, theo tài liệu chính thức ở
  `~/.gemini/antigravity/builtin/skills/agy-customizations/docs/skills.md`). Nguyên tắc chung
  `app-web-sk` copy sang `~/.gemini/GEMINI.md`. **CHÚ Ý: các bản này KHÔNG tự đồng bộ — sửa 1
  bên phải sửa bên kia.** User CHƯA xác nhận Antigravity có thật sự đọc `~/.gemini/GEMINI.md`
  hay không (vị trí này lấy từ nguồn ngoài, độ tin cậy thấp hơn phần `.agents/skills/`).

### 2026-07-27 — Claude Code (Opus 5) + Antigravity: đổi brand "SAI News" → "BAI News" + banner 3 ngày
- **Yêu cầu user (3 việc):** (1) lưu chế độ màu + ngôn ngữ, (2) banner báo đổi tên miền hiện 3
  ngày, (3) đổi tên trang SAI News → BAI News.
- **Việc (1) hoá ra ĐÃ CÓ SẴN** — Claude test trực tiếp trên production (đổi sang sáng + EN,
  tải lại trang, cả 2 giữ nguyên; `localStorage` ở `Feed.js:47-76`). Không code gì thêm. Bài
  học: user báo "chưa có tính năng X" thì kiểm chứng trên web thật trước khi viết task.
- **Quyết định đã chốt khi bàn plan:** đổi brand NGAY trong cùng 1 lần deploy (không làm banner
  "sắp đổi" trước rồi đổi sau); hạn banner hardcode 30/07/2026 nên tự ẩn cho mọi người, KHÔNG
  cần deploy lần 2; có nút ✕ đóng, nhớ bằng `localStorage`.
- **Antigravity làm:** đổi 2 chỗ brand (`web/app/layout.js` metadata.title, `web/components/Feed.js`
  h1), tạo `web/components/RenameBanner.js`, thêm 3 biến CSS `--banner-*` vào cả 3 block theme
  (`:root`, `[data-theme="dark"]`, `@media prefers-color-scheme:dark`) + style `.rename-banner`.
  Làm đúng phạm vi, không lan man. Để **chưa commit** (giống lần trước).
- **Claude kiểm tra thật (không tin lời kể):** `npm run build` sạch; chạy dev server, xác nhận
  h1 + `document.title` đều "BAI News"; banner hiện đúng nội dung; bấm ✕ → biến mất + ghi
  `dismissedBanner_baiRename2026=1`, tải lại KHÔNG hiện lại; xoá khoá + đặt theme tối → banner
  hiện lại với màu tối đúng (`#2a2517` nền / `#f5dfa0` chữ, tương phản tốt); hằng số hạn parse
  đúng (30/07/2026 23:59:59 +07, còn 3.53 ngày).
- **Claude sửa thêm — Antigravity chỉ cập nhật CLAUDE.md mục 2, còn sót:** mục 2 (toạ độ dự án),
  mục 3 (việc dang dở), mục 7 việc 4 vẫn ghi "CHƯA đổi brand"; và **AGENTS.md không được cập
  nhật gì cả** (file này là bản sao y hệt CLAUDE.md, chỉ khác dòng tiêu đề). Claude sửa 3 chỗ
  còn sót + đồng bộ lại AGENTS.md. **Lần sau viết task nhớ ghi rõ: cập nhật CẢ CLAUDE.md VÀ
  AGENTS.md, và rà hết mọi mục nhắc tới việc đó, không chỉ mục trạng thái.**
- **CÒN LẠI (việc tay của user):** vào Vercel → Settings → Domains → đặt `bainews.site` làm
  Primary. Chưa làm tính đến cuối phiên này.
- File đổi: `web/app/layout.js`, `web/components/Feed.js`, `web/app/globals.css`,
  `web/components/RenameBanner.js` (mới), `CLAUDE.md`, `AGENTS.md`.

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

### 2026-07-27 — Claude Code (Sonnet 5) sửa 2 bug user phát hiện sau khi deploy GitHub expansion
- **User báo (qua ảnh chụp màn hình EN mode):** (1) badge "Kinh điển" không có bản dịch tiếng
  Anh, banner đổi tên miền cũng không dịch; (2) lưu chế độ sáng/tối "vẫn chưa hoạt động".
- **Bug 1 — i18n badge/banner:** `web/lib/format.js` (`SOURCE_META`) lưu nhãn nguồn dạng chuỗi
  cố định, không phân biệt VI/EN — lỗi này đã có TỪ TRƯỚC (áp dụng cả cho
  `github_trending_daily/weekly` cũ, chỉ là "Kinh điển" thuần Việt nên lộ rõ nhất). Fix: thêm
  `labelKey` vào các entry cần dịch, `sourceMeta(source, lang)` nhận thêm `lang` để tra `t()`.
  `RenameBanner.js` trước đây hardcode tiếng Việt 100% (bỏ sót khi viết task đổi brand 27/07,
  không phát hiện lúc đó vì test chỉ nhìn qua, không đổi ngôn ngữ). Fix: thêm khoá
  `renameBannerText`/`renameBannerClose` vào `i18n.js`, banner tự đọc `localStorage.lang` lúc
  mount + lắng nghe custom event `bai-lang-change` (Feed.js bắn ra khi bấm nút VI/EN) để đổi
  chữ ngay không cần tải lại trang — vì banner nằm ngoài cây state của Feed, không tự nhận
  props lang.
- **Bug 2 — mất chế độ sáng/tối sau tải lại trang (bug thật, xác nhận bằng test trực tiếp trên
  bainews.site với tab trình duyệt HOÀN TOÀN MỚI, nhiều lần, loại trừ cache/tool quirk):**
  script inline trong `layout.js` đặt `document.documentElement.dataset.theme` TRƯỚC khi React
  hydrate — nhưng vì JSX gốc của `<html>` không khai báo `data-theme`, thuộc tính này không
  được đảm bảo giữ nguyên qua vòng đời hydrate của React (có thể bị dọn mất). `Feed.js` trước
  đó CHỈ đọc lại thuộc tính này (không tự ghi), nên nếu nó đã mất thì React state `theme` sai
  theo, và nút bấm sau đó vẫn hoạt động (set lại state) nhưng round tiếp theo (tải trang mới)
  lặp lại vấn đề. Fix: đổi effect trong `Feed.js` — đọc THẲNG `localStorage.getItem("theme")`
  (nguồn đáng tin cậy nhất, không phụ thuộc DOM attribute có sống sót qua hydrate hay không) rồi
  chủ động **ghi lại** `data-theme` mỗi lần mount, không chỉ đọc. Đã test qua nhiều lần bật/tắt
  + tải lại (bằng `window.location.reload()` thật, tab mới hoàn toàn) trên `localhost` — giữ
  đúng cả 2 chiều sáng/tối.
- File đổi: `web/components/Feed.js`, `web/components/NewsCard.js`,
  `web/components/RenameBanner.js`, `web/lib/format.js`, `web/lib/i18n.js`.
- Build sạch, đã verify bằng dev server thật (không dùng route giả cho phần theme — test trực
  tiếp qua reload thật).

### 2026-07-27 — Claude Code (Sonnet 5) bàn thiết kế + Antigravity thực thi — trang SEO song ngữ GitHub AI
- **Claude:** bàn với user hướng "SEO nội dung dài hạn" (CLAUDE.md mục 3), chốt thử nghiệm nhỏ
  đầu tiên: 2 trang tĩnh server-rendered `/github-ai` (VI) + `/en/github-ai` (EN), không toggle
  client-side (Google không đọc được), có hreflang liên kết chéo. Viết spec
  `docs/superpowers/specs/2026-07-27-seo-github-ai-bilingual-design.md` + task
  `tasks/todo/2026-07-27-trang-seo-github-ai-song-ngu.md`, giao Antigravity làm.
- **Antigravity:** thực thi đúng task, commit `56f64c6` (feat) + `af028f6` (docs, cập nhật
  PROJECT_MAP.md). File mới: `web/app/github-ai/page.js`, `web/app/en/github-ai/page.js`,
  `web/components/GithubAiList.js`; sửa `web/app/sitemap.js` (thêm 2 URL), `web/components/Feed.js`
  (thêm link footer trỏ `/github-ai`).
- **Claude kiểm tra lại (không tin báo cáo suông):** đọc diff từng file, đối chiếu đúng spec
  (fetchItems filter="github" sort="hot" limit=60, GithubAiList là Server Component không
  `"use client"`, metadata + `alternates.languages` đúng cả 2 chiều, sitemap có đủ 3 URL).
  `npm run build` sạch (cả 2 route dựng tĩnh thành công). Chạy dev server thật, xác nhận qua
  browser: title/nội dung đúng ngôn ngữ từng trang, `<link rel="alternate" hreflang="vi/en">`
  xuất hiện đúng trong HTML cả 2 chiều, link footer `/github-ai` bấm được từ trang chủ. Trang
  hiện "Chưa có dữ liệu"/"No data available" khi chạy local — đúng như dự kiến vì máy này chưa
  có `web/.env.local` (đã ghi chú từ trước trong CLAUDE.md mục 5), không phải lỗi code.
- **Còn dang dở:** chưa deploy lên production để xem Google Search Console có index được không
  (cần thời gian, không kiểm tra ngay được); chưa đo hiệu quả traffic thật (cần vài tuần). Nếu
  hiệu quả, cân nhắc nhân rộng sang chủ đề khác (blog hãng, arXiv) như đã ghi trong spec.

### 2026-07-27 — Claude Code (Sonnet 5) bàn thiết kế + Antigravity thực thi — nút Lưu & Chia sẻ
- **Claude:** bàn với user, chốt thiết kế: lưu tin vào danh sách trong `localStorage` (không cần
  login — CLAUDE.md mục 4), bấm là lưu ngay vào "Đã lưu" mặc định (popup chọn danh sách là thao
  tác phụ); chia sẻ dùng Web Share API + fallback copy link, URL trỏ về trang chi tiết mới
  `/tin/[id]` (không chia sẻ thẳng link bài gốc — mục tiêu kéo traffic về web). Spec:
  `docs/superpowers/specs/2026-07-27-save-share-buttons-design.md`.
- **Antigravity:** thực thi, commit `6c6ac82` (feat, 12 file) + `8af1263` (docs). File mới:
  `web/lib/savedLists.js`, `web/lib/share.js`, `web/components/SaveListPopup.js`,
  `web/app/tin/[id]/page.js` + `DetailContent.js`, `web/app/da-luu/page.js`,
  `web/app/api/saved-items/route.js`; sửa `NewsCard.js`, `Feed.js` (link footer "Tin đã lưu"),
  `i18n.js`, `supabaseServer.js` (thêm `fetchItemById`/`fetchItemsByIds`), `globals.css`.
- **Claude kiểm tra lại:** đọc diff từng file, đối chiếu spec — đúng kiến trúc, API route có ĐỦ
  cả `force-dynamic` + `fetchCache = "force-no-store"` (bài học CLAUDE.md mục 5, lần này không
  sót). Viết script test riêng mock `localStorage` chạy thẳng `savedLists.js` bằng Node: **11/11
  case pass**, kể cả các case rìa (chặn xoá danh sách "default", xoá danh sách kéo theo tin bên
  trong, không lưu trùng, bỏ lưu khỏi mọi danh sách).
- **Claude PHÁT HIỆN + SỬA 2 lỗi i18n Antigravity bỏ sót** (task đã ghi rõ "KHÔNG được sót bản
  dịch nào" nhưng vẫn lọt): (1) `da-luu/page.js` hardcode tiếng Việt "N tin không tải được (id
  không còn trong DB)." — hiện nguyên tiếng Việt cả khi đang ở chế độ EN; (2) `SaveListPopup.js`
  hardcode `aria-label="Đóng"`. Fix: thêm khoá `savedMissing`/`closePopup` vào `i18n.js` (cả VI
  và EN), thay 2 chỗ hardcode. Đã verify lại trên trình duyệt thật: đổi VI/EN cả 2 chuỗi hiện
  đúng ngôn ngữ, không lỗi console.
- **Hạn chế khi kiểm tra:** máy này KHÔNG có `web/.env.local` nên không kết nối được Supabase —
  không thể bấm thử nút Lưu/Chia sẻ trên thẻ tin thật, cũng không mở được `/tin/<id>` với dữ
  liệu thật. Phần đã verify được: logic `savedLists.js` (test script), trang `/da-luu` render
  (nạp dữ liệu giả vào localStorage — danh sách/đổi tên/đếm số/chặn xoá "default" đều đúng),
  build sạch (11 route). **Cần user tự kiểm tra trên production sau khi deploy:** bấm nút Lưu và
  Chia sẻ trên thẻ tin thật, mở thử link `/tin/<id>` được chia sẻ.
- Lặp lại bài học cũ: Antigravity làm đúng phần lớn nhưng vẫn sót chi tiết khác nhau mỗi lần —
  lần này là i18n (đúng loại lỗi đã từng xảy ra 27/07). Luôn phải đọc diff + chạy thử thật.

### 2026-07-27 — Claude Code (Sonnet 5): SEO cơ bản + xem số liệu Analytics thật + domain chính
- **SEO kỹ thuật cơ bản (trước đó web KHÔNG có favicon/sitemap/robots):** thêm
  `web/app/robots.js` (cho phép crawl + trỏ sitemap), `web/app/sitemap.js` (khai trang chủ),
  `web/app/icon.svg` (favicon), mở rộng metadata trong `web/app/layout.js` (`keywords`,
  `openGraph`, `twitter`, `metadataBase`, title/description có từ khoá tiếng Việt). Thử thêm ảnh
  OG tự sinh bằng `next/og` `ImageResponse` nhưng gặp lỗi Next.js đã biết **trên Windows** (load
  font mặc định qua `file://` URL sai định dạng, `ERR_INVALID_URL`) — bỏ, chỉ giữ OG dạng chữ.
  Commit `77b4f84`, đã push, Vercel tự deploy.
- **Xem số liệu Vercel Web Analytics thật lần đầu (24h):** 174 visitor, 275 pageview, bounce rate
  88%, đỉnh ~20 visitor/giờ. Referrer **~64% từ Facebook** (gộp facebook.com/l.facebook.com/
  lm.facebook.com/m.facebook.com), **gần như 0% từ tìm kiếm** (bing.com chỉ 1 lượt, không có
  Google organic). Kết luận cùng user: traffic phụ thuộc gần hoàn toàn 1 kênh không đều →
  nguyên nhân gốc rễ traffic dao động mạnh theo ngày. **Quyết định:** chưa bật quảng cáo (traffic
  quá nhỏ/bấp bênh để có ý nghĩa), ưu tiên đa dạng hoá kênh trước — mốc để cân nhắc lại: traffic
  ổn định vài trăm–1000+/ngày *liên tục*.
- **Chốt chiến lược quảng bá:** Facebook đăng đều tay (đang có traffic thật nhưng chỉ đăng 1 lần
  rồi thôi) song song SEO làm nền tảng lâu dài. KHÔNG dùng Product Hunt/Indie Hackers (đối tượng
  ở đó là dev/founder quốc tế, lệch với 97% traffic hiện tại là người Việt).
- **User tự đặt `bainews.site` làm domain chính trên Vercel** (Settings → Domains → "Redirect to
  another Domain") — `sainews.vercel.app` giờ tự redirect 308 sang `bainews.site`, link
  Facebook/bookmark cũ không gãy. Đã xác nhận qua ảnh chụp Vercel Dashboard.
- File đổi: `web/app/robots.js` (mới), `web/app/sitemap.js` (mới), `web/app/icon.svg` (mới),
  `web/app/layout.js`.

### 2026-07-27 — Claude Code (Sonnet 5): làm lại nút Lưu/Chia sẻ theo kiểu pill YouTube + menu ☰ header
- **User phản hồi:** bản đầu Antigravity làm nút Lưu/Chia sẻ dùng emoji (🔖🔗▾) trong khung viền
  mảnh — chê xấu, yêu cầu làm theo kiểu "pill" bo tròn nền đặc giống YouTube. Dựng bản xem trước
  bằng widget trước khi code để chốt hướng.
- **Đổi giao diện:** bỏ emoji, vẽ icon SVG nét đơn (`web/components/icons.js`: `ShareIcon`,
  `BookmarkIcon`, `ChevronDownIcon`, dùng `currentColor` tự đổi màu theo theme/trạng thái); style
  `.pill`/`.pill-group` mới trong `globals.css` (biến `--chip`/`--chip-hover` cho cả 2 theme);
  nút Lưu + mũi tên gộp chung 1 pill; trạng thái đã lưu đảo màu nền.
- **Bug kỹ thuật phát hiện khi kiểm tra đổi theme động (không tải lại trang):** dùng thuộc tính
  viết tắt `background: var(--chip)` cùng `transition: background 0.12s` khiến nền nút không cập
  nhật theo giá trị biến CSS mới khi đổi theme — kẹt ở màu cũ. Fix: đổi toàn bộ sang
  `background-color` + `transition: background-color 0.12s`. **Lúc đầu tưởng là bug thật, đo lại
  hoá ra một phần do trình duyệt tự động không compositing frame nên transition đứng yên (xem
  CLAUDE.md mục 5) — verify lại bằng cách tắt transition tạm thời mới phân biệt được bug thật
  (background shorthand) với hạn chế công cụ (transition không chạy).**
  Dựng trang tạm `web/app/preview-card-tmp/` với dữ liệu giả để đo màu (máy này không có
  `web/.env.local`), xoá sau khi xong.
- **Thêm nút menu ☰ ở header** (`web/components/HeaderMenu.js`): đặt ngoài cùng bên phải, sau nút
  sáng/tối + VI/EN — theo đúng yêu cầu user (dựng preview bằng widget trước khi code). Dropdown
  neo dưới nút, canh phải, đóng khi bấm ra ngoài/Esc/bấm lại nút, 3 mục: Trang chủ, GitHub AI nổi
  bật (tự trỏ `/en/github-ai` khi đang chế độ EN), Tin đã lưu. Rút gọn footer `Feed.js` chỉ còn 1
  link GitHub AI (bỏ 2 link emoji trùng với menu).
- **Kiểm tra thật:** build sạch cả 2 lần; dựng dev server, dùng `dispatchEvent` mô phỏng bấm nút
  (đóng/mở bằng 4 cách: click ngoài/Esc/bấm lại nút/bấm 1 mục), đo màu bằng
  `getComputedStyle` ở cả 2 theme sau khi tắt transition, xác nhận đổi VI/EN đúng (link GitHub
  đổi route), không lỗi console.
- File đổi: `web/components/icons.js`, `web/app/globals.css`, `web/components/NewsCard.js`,
  `web/components/HeaderMenu.js` (mới), `web/components/Feed.js`, `web/lib/i18n.js`.
- Đã commit (`8d70576` pill, `d3a5fad` menu), đã push, Vercel tự deploy.
