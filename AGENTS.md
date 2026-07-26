# AGENTS.md — AI News Aggregator (bàn giao cho phiên sau)

> Đọc file này + `PROJECT_MAP.md` (bản đồ file chi tiết) là tiếp tục làm việc được ngay.
> Người dùng **không phải lập trình viên**, giao tiếp **tiếng Việt**, thao tác thủ công cần
> **hướng dẫn từng bước + giá trị copy-paste sẵn**; trao đổi qua ảnh chụp màn hình rất tốt.

## 1. Tổng quan
Website tổng hợp & **tóm tắt** tin AI (mô hình Techmeme/TLDR): thu tin nhiều nguồn → tóm tắt
song ngữ Việt+Anh bằng AI → hiển thị feed kèm link bài gốc. **Không đăng lại toàn văn.**

Kiến trúc: **Next.js (Vercel)** đọc **Supabase (Postgres)**; **GitHub Actions** chạy pipeline
Node.js định kỳ để thu thập + tóm tắt bằng **Claude Haiku API** rồi ghi Supabase.

**Nguồn đang chạy:** Hacker News (Algolia Search API), arXiv (cs.AI/LG/RO), GitHub Releases
(8 repo: llama.cpp, transformers, ComfyUI, vllm, ollama, whisper.cpp, unsloth, sglang),
GitHub "Repo nổi bật" (qua GitHub **Search API** — repo AI nhiều sao còn push gần đây, KHÔNG
còn giới hạn "chỉ repo mới tạo"; dùng `api.github.com` khác `github.com`), và **13 blog/báo AI
qua RSS/Atom**: OpenAI, Google DeepMind, Hugging Face, Mistral, Berkeley BAIR, Simon Willison,
TechCrunch, The Verge, Ars Technica, VentureBeat, MIT Tech Review, Import AI, The Gradient.
(Danh sách blog/repo ở `lib/config.js`; thêm blog phải khai báo slug ở `web/lib/filters.js`
(vào 1 trong 3 nhóm) + `web/lib/format.js`.) Blog/báo miễn phí, KHÔNG cần API key. **Reddit
CHƯA bật** (xem mục 3). X/Twitter **bỏ** (API đọc ~$100+/tháng, không hợp chi phí).

## 2. Trạng thái hiện tại — ĐÃ CHẠY THẬT trên production
- Cả **5 cột mốc xong**: (1) collector HN+arXiv, (2) tóm tắt song ngữ Haiku, (3) dedupe+Supabase,
  (4) frontend feed, (5) GitHub Actions + deploy Vercel.
- **Thương hiệu hiển thị: "SAI News"** (h1 + `<title>` + meta); tagline trung lập "Tổng hợp &
  tóm tắt tin tức, kèm nguồn." (bỏ neo "AI" để mở rộng chủ đề sau). Tên project trên
  Vercel/GitHub/Supabase GIỮ NGUYÊN (ai-news-aggregator).
- **Chế độ Sáng/Tối:** nút icon cạnh VI/EN; mặc định theo hệ thống (`prefers-color-scheme`),
  chọn tay nhớ `localStorage`; dùng `data-theme` trên `<html>` + script inline chống nháy trong
  `web/app/layout.js`; màu qua biến CSS nên phủ toàn trang.
- **Tính năng frontend đã live:** feed thẻ; **nút chuyển ngôn ngữ VI/EN** (nhớ localStorage);
  **lọc theo nguồn** (Tất cả + mỗi nguồn; 13 blog/báo tách thành **3 nhóm**: "Blog hãng AI"
  (openai/deepmind/huggingface/mistral/bair), "Báo công nghệ" (techcrunch/theverge/arstechnica/
  venturebeat/technologyreview), "Newsletter" (simonwillison/importai/thegradient) — nhãn đổi
  theo VI/EN qua `web/lib/i18n.js`; nút ẩn nếu nhóm/nguồn chưa có tin);
  **infinite scroll** (tải 40 tin/lần qua `/api/items`, tự tải thêm khi cuộn, kết hợp mọi bộ lọc,
  có "Đang tải thêm…"/"Đã hết tin"). Thẻ hiển thị: badge nguồn, điểm (▲), thời gian tương đối,
  tiêu đề (link bài gốc), tóm tắt theo ngôn ngữ, tác giả.
- **GitHub "Repo nổi bật" đã mở rộng (25/07):** bỏ giới hạn "chỉ repo tạo ≤30 ngày" → lấy repo
  AI nhiều sao còn push trong ~180 ngày (≥500 sao), 7 chủ đề, tối đa 60 repo/lần thu thập. Giờ có
  cả repo mới hot lẫn repo lớn kinh điển (tensorflow, ollama, transformers, langchain, pytorch...).
  Mốc thời gian hiển thị = ngày push gần nhất (không phải ngày tạo repo). Cấu hình ở `lib/config.js`
  (`GITHUB_TRENDING_*`). Chi phí tóm tắt lô repo mới lần đầu ~$0.10 (một lần, đã chạy 25/07).
- **Dịch tiêu đề (title_vi):** chế độ VI hiển thị tiêu đề tiếng Việt (`title_vi`), EN giữ gốc.
  Sinh trong bước tóm tắt (`summarizer.js`, giữ nguyên tên riêng/repo/phiên bản/username).
  149 tin cũ đã backfill xong (24/07, ~$0.10) bằng `backfill-titles.js`.
- **Sắp xếp (có nút):** "Mới nhất" (`published_at` giảm dần) và "Nổi bật nhất" (theo `score`).
  Chỉ **hackernews + reddit** tính điểm; nguồn không điểm (arXiv/blog/GitHub — kể cả github_trending
  dù có sao) **xuống cuối**, không loại bỏ. Sắp phía server; chế độ "hot" lấy cửa sổ ứng viên
  (`HOT_WINDOW=1000`) rồi sắp ở JS trong `web/lib/supabaseServer.js`.
- **Lọc thời gian (dropdown):** Hôm nay/Tuần này/Tháng này/Năm này/Mọi lúc — theo `published_at`
  (24h/7/30/365 ngày). Kết hợp đúng với lọc nguồn + sắp xếp. Mặc định "Mọi lúc".
- **Vercel Web Analytics:** đã bật (`@vercel/analytics`, `<Analytics/>` trong `web/app/layout.js`);
  xem số liệu ở Vercel dashboard → tab Analytics.
- **DB:** Supabase bảng `news_items`, RLS = **đọc công khai / ghi chỉ service_role**. Hiện ~170+ tin
  (tăng dần sau khi thêm nguồn).
- **Cơ chế `plans/` (mới, 26/07):** chiều ngược lại `tasks/` — Codex hoặc Antigravity thả ý
  tưởng/plan vào `plans/incoming/`, Claude Code đọc + bàn cùng user trong chat, chốt xong thì
  Claude viết task thực thi thẳng vào `tasks/todo/` (KHÔNG có `plans/approved/` riêng, xem
  `plans/README.md`). Đã tạo xong khung + tài liệu (`plans/README.md`, `tasks/README.md` cập
  nhật, `PROJECT_MAP.md` cập nhật); tiện thể track nốt `tasks/todo/`/`tasks/done/` vào git
  (trước đó bị sót, chưa từng commit). Chi tiết thiết kế: `docs/superpowers/specs/2026-07-26-
  multi-agent-plan-review-design.md`.
- **Tự động (QUAN TRỌNG):** lịch chạy thật do **cron-job.org** gọi GitHub REST `workflow_dispatch`
  mỗi 15' — vì cron nội bộ của GitHub Actions bị bóp lịch (chạy thưa 3-4h/lần), KHÔNG tin cậy.
  Xem memory `ai-news-cron-throttling-fix` (URL API, header, token). Workflow vẫn giữ block
  `schedule` (dự phòng) + `workflow_dispatch`. Secrets: `ANTHROPIC_API_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` (+ `GITHUB_TOKEN` tự cấp; Reddit tùy chọn).
  **Pipeline exit 1 nếu tóm tắt hỏng TOÀN BỘ** (báo ĐỎ thay vì success giả); `summarizer.js`
  tự chuẩn hoá `ANTHROPIC_API_KEY`. (Sự cố key hỏng đã xử lý 24/07 — xem memory.)

**Toạ độ dự án:**
- Web: **https://sainews.vercel.app** (Vercel, Root Directory = `web/`, env `SUPABASE_URL` + `SUPABASE_ANON_KEY`)
- **Domain riêng mới (26/07): `bainews.site`** — đã mua ở Namecheap ($0.98/năm, KHÔNG auto-renew,
  tự hết hạn nếu không gia hạn tay), đã trỏ DNS (A record `@` → IP Vercel) + add vào Vercel
  Domains, **đã chạy thật (HTTP 200, SSL tự cấp)**. Hiện chạy **song song** với
  `sainews.vercel.app`, cả 2 cùng dẫn tới 1 web. **CHƯA đổi brand hiển thị** (vẫn "SAI News"),
  **CHƯA đặt làm domain chính** — kế hoạch: làm banner thông báo đổi tên hiển thị 24h cho user
  cũ biết trước, rồi mới đổi brand "SAI News" → "BAI News" + đặt `bainews.site` làm domain
  chính (xem việc dang dở mục 3). Lý do đổi: traffic chủ yếu qua Facebook share (mục 7 phần đã
  xong), rủi ro mất user khi đổi domain thấp vì ít người nhớ/gõ tay URL cũ.
- GitHub: **https://github.com/ndat7783svg/ai-news-aggregator** (public)
- Supabase project ref: **huqbirxwvrprqkhrwnsl** (`https://huqbirxwvrprqkhrwnsl.supabase.co`)

## 3. CHƯA làm / dang dở (đừng tưởng đã có)
- **Reddit: CHƯA bật, đang KẸT ở bước tạo app (thử 25/07, tạm gác lại theo yêu cầu user).**
  Code `collectors/reddit.js` sẵn sàng, tự bỏ qua nếu thiếu `REDDIT_CLIENT_ID`/`SECRET`. Vướng
  2 lớp: (1) ISP chặn `reddit.com` → user phải dùng 4G/VPN mới vào được `reddit.com/prefs/apps`;
  (2) **reCAPTCHA khi tạo app cứ tích không "ăn"/bấm "tạo ứng dụng" không phản hồi** — đã loại trừ
  nguyên nhân chặn cookie bên thứ 3 (đã tắt, vẫn lỗi); nghi ngờ cao nhất là **IP 4G dùng chung
  (CGNAT) bị Google reCAPTCHA đánh dấu nghi ngờ** (rất phổ biến ở mạng di động VN). Đã gợi ý
  user thử bật/tắt chế độ máy bay (đổi IP 4G) hoặc thử ở mạng wifi khác hẳn — **CHƯA có kết quả
  xác nhận**, phiên sau hỏi lại user đã thử chưa trước khi gợi ý thêm. Đừng lặp lại hướng "tắt
  cookie bên thứ 3" (đã thử, không hiệu quả).
- **Blog hãng AI còn thiếu tin cập nhật riêng của các mô hình lớn** (Anthropic/Claude, Google
  Gemini, xAI Grok, Moonshot Kimi...) — user muốn theo dõi các "con AI" này cập nhật gì mới.
  X/Twitter đã loại vì đắt (~$100+/tháng). Kỳ vọng ban đầu là Reddit sẽ có nhiều tin này nhưng
  Reddit đang kẹt (xem trên). **CHƯA tìm/thêm nguồn nào cho việc này** — cần tìm RSS chính thức
  (Anthropic/Google/xAI có thể không có RSS công khai, cần kiểm tra lại) hoặc mở rộng từ khoá
  HN/blog hiện có để bắt tin về các model này tốt hơn.
- **Tên miền riêng: ĐÃ MUA `bainews.site` (26/07, xem mục 2)**, đã nối Vercel, chạy song song
  `sainews.vercel.app`. **CHƯA công khai/đổi brand** — còn dang dở: (1) làm banner thông báo
  đổi tên hiển thị cho user hiện tại thấy trong ~24h, (2) sau đó mới đổi "SAI News" → "BAI News"
  + đặt `bainews.site` làm domain chính. Không mua `.com` (giá premium $2,385, quá đắt).
- Blog **Anthropic & Meta AI** (blog chính thức hãng, khác với "tin về model Claude"): bỏ qua vì
  không có RSS chính thức (không scraping).
- **Login/thanh toán/tài khoản, PWA/app điện thoại: CHƯA làm** (ngoài phạm vi bản đầu).
- **Có 1 plan từ Antigravity đang chờ duyệt (26/07)** về cải thiện hiển thị "Repo nổi bật"
  GitHub: sau ngày đầu gần như không có tin GitHub mới (top 60 repo ≥500 sao quá ổn định, dedupe
  khiến không lặp lại), thiếu luồng bắt repo "mới nổi nhanh" (kiểu LoopEngineering, spec-kit —
  sao ít nhưng tăng nhanh). Đề xuất sơ bộ: cải thiện thẻ hiển thị (rút gọn số sao kiểu "158K",
  đổi icon, hiện ngôn ngữ lập trình) + thêm luồng "Rising" (repo mới tạo ≤30 ngày, ≥50 sao) +
  badge riêng. **CHƯA bàn xong với user, chưa quyết ngưỡng sao cho "Rising" (50 hay 100).** File
  plan nằm ở `plans/incoming/` (tên file tuỳ Antigravity đặt lúc lưu) — phiên sau kiểm tra
  `plans/incoming/` trước, đọc + bàn tiếp với user nếu chưa xử lý.

## 4. Quyết định đã chốt (ĐỪNG đề xuất lại)
- **Dedupe theo (source, source_id), KHÔNG theo URL.** Vì mỗi nguồn có ID ổn định; URL hay đổi
  (tham số tracking/redirect) dễ sót; cùng 1 bài ở 2 nguồn thì **giữ cả 2** (thể hiện độ nóng).
  (Gộp chéo theo URL có thể làm sau nếu cần.)
- **Dùng Claude Haiku (`claude-haiku-4-5`), không đổi sang Gemini/GPT.** Theo spec ban đầu; rất
  rẻ ($1/$5 mỗi triệu token in/out); chất lượng tóm tắt 2-4 câu VI+EN đã kiểm tra tốt; dùng
  structured outputs cho JSON sạch; giữ đồng bộ hệ Claude.
- **Chưa làm login/thanh toán**: bản đầu ưu tiên chạy ổn định; code đã **tách module**
  (collect / summarize / db / web) để gắn thêm sau mà không viết lại.
- **Giao diện feed thẻ (kiểu Techmeme/TLDR), KHÔNG làm kiểu swipe/TikTok.** Hợp mô hình
  "tóm tắt + dẫn nguồn", dễ đọc lướt và kèm link gốc.
- Ngôn ngữ: collector/pipeline dùng **JS thuần (Node ESM)**; web dùng **Next.js 14 App Router (JS)**.
- **Rủi ro pháp lý mô hình tóm tắt+link: user đã xem xét và CHẤP NHẬN (25/07), đừng bàn lại
  trừ khi có thay đổi lớn** (thu phí/quảng cáo dựa nội dung người khác, đăng lại toàn văn, dùng
  logo/ảnh hãng khác). Lý do: tóm tắt ngắn viết lại bằng lời riêng + luôn link nguồn + không chép
  nguyên văn = nhóm rủi ro thấp (giống Techmeme/TLDR); luật bảo vệ cách diễn đạt, không bảo vệ
  bản thân sự kiện/tin tức. Chi tiết: memory `ai-news-legal-risk-note`.

## 5. Vướng mắc / lưu ý kỹ thuật đã gặp
- **ISP thỉnh thoảng chặn `github.com`** (git push timeout) — nhưng `api.github.com`, Vercel,
  Supabase, Anthropic đều vào được. Push cuối cùng vẫn chạy (không cần VPN), nếu treo thì
  đợi/thử lại hoặc 4G/VPN. **Actions chạy trên cloud GitHub nên tự động về sau KHÔNG phụ thuộc
  mạng người dùng.** git đã cấu hình local: user `ndat7783` / `ndat7783@gmail.com`; đã đăng nhập
  đẩy được (credential cached).
- **Supabase dùng hệ key mới → lấy `anon` và `service_role` ở tab "Legacy" trong Settings→API.**
  `service_role` = BÍ MẬT, chỉ cho pipeline/GitHub secret (ghi, bypass RLS); `anon` = cho web
  (chỉ đọc qua RLS). **Đã xác minh anon KHÔNG ghi/xoá được** (RLS chặn) → an toàn public.
- **Code tự chuẩn hoá env** (`db/supabase.js`, `web/lib/supabaseServer.js`, `web/app/page.js`):
  tự bỏ prefix `TÊN=`, dấu nháy, khoảng trắng, `/rest/v1` thừa khi dán secret. (Rút ra từ loạt
  Actions fail do dán secret lỗi.)
- **GitHub Actions scheduled là "best-effort" — ĐÃ XỬ LÝ:** cron nội bộ chạy thưa 3-4h/lần dù đặt
  15'. Giải pháp đang dùng: **cron-job.org** gọi `workflow_dispatch` mỗi 15' (đáng tin, chạy ngay).
  Chi tiết cấu hình ở memory `ai-news-cron-throttling-fix`. Muốn chạy tay: cron-job.org → Test Run,
  hoặc Actions → Run workflow.
- **ĐÃ SỬA (25/07) — 1 run kẹt "queued" chặn hàng loạt run sau (~20 run bị `cancelled` liền, web
  đứng tin 5 tiếng):** nguyên nhân là `concurrency: cancel-in-progress: false` trong
  `collect.yml` — khi 1 run bị GitHub Actions treo ở hàng đợi (không cấp được runner, hiếm nhưng
  có thể xảy ra), cấu hình cũ giữ nguyên run kẹt đó và huỷ mọi run mới đến sau, nên pipeline
  đứng hoàn toàn cho tới khi có người vào tay huỷ run kẹt. **Dấu hiệu nhận ra:** hàng loạt run
  trong tab Actions đều "chạy" đúng ~14-15 phút rồi bị huỷ (icon 🚫) — pipeline thật chỉ mất
  20 giây–2 phút, nên thời gian ~15' đó là **thời gian nằm chờ trong hàng đợi**, không phải lỗi
  code/API key. **Fix:** đổi `cancel-in-progress: true` (run mới luôn thắng, tự đá run kẹt ra,
  an toàn vì pipeline dedupe theo source+source_id) + thêm `timeout-minutes: 10`. Từ nay nếu
  GitHub lại treo run, tự phục hồi trong ≤15 phút, không cần can thiệp tay. Chi tiết: memory
  `ai-news-actions-queue-stuck-fix`.
- **Vercel đổi tên domain không giới hạn số lần** (Settings → Domains). Hiện là `sainews`.
- **Khung trình duyệt tự động của Claude không "vẽ khung hình"** → click mô phỏng &
  IntersectionObserver không kích hoạt trong đó. Kiểm tra tính năng tương tác (nút, lọc, cuộn)
  bằng `dispatchEvent` hoặc trên **web thật**, đừng kết luận "lỗi" từ công cụ.
- **ĐÃ SỬA (25/07) — Next.js Data Cache làm lọc theo nguồn hiện tin cũ:** `export const dynamic
  = "force-dynamic"` trong route API **KHÔNG** tự tắt cache cho từng lệnh `fetch` bên trong (Supabase
  đọc qua `fetch`). Mỗi tổ hợp filter/sort/time là 1 URL bị Next Data Cache "đóng băng" riêng, chỉ
  query `all` được trang chủ ISR làm tươi. **Fix:** thêm `export const fetchCache =
  "force-no-store";` cạnh `force-dynamic` trong `web/app/api/items/route.js`. **Nếu thêm route
  API mới đọc Supabase, LUÔN nhớ thêm cả 2 dòng này**, không chỉ `force-dynamic`. Chi tiết: memory
  `ai-news-nextjs-data-cache-filter`.
- Chạy web cục bộ: `cd web && npm run dev` (cần `web/.env.local` với `SUPABASE_URL` +
  `SUPABASE_ANON_KEY`). Pipeline cục bộ: `npm run pipeline` (cần `.env` ở gốc).

## 6. Chi phí thực tế
- **Anthropic tới giờ: ước tính < $1.10** (đã tóm tắt ~170+ tin + backfill tiêu đề + test + ~50-70
  repo GitHub mới khi mở rộng "Repo nổi bật" 25/07 ≈ +$0.10 một lần). **Số thật xem ở
  console.anthropic.com → Usage/Billing** (mình không đọc được console của bạn).
- **Vận hành hàng tháng: ước ~$1–3/tháng, thường chỉ vài chục cent** (chỉ tóm tắt tin MỚI mỗi lần
  chạy 15'; nhiều nguồn hơn → nhiều tin mới/ngày hơn nhưng vẫn nhỏ, ~0,15 cent/tin). Supabase/
  Vercel/GitHub Actions + cron-job.org đều **miễn phí** ở quy mô này.
- **QUAN TRỌNG — tránh nhầm lẫn đã xảy ra 25/07:** chi phí "một lần" (VD $0.10 khi mở rộng nguồn)
  KHÔNG lặp lại mỗi lần cron chạy (15'). Cron chỉ tóm tắt tin **hoàn toàn mới** (dedupe theo
  source+source_id), nên mỗi lần chạy chỉ tốn ~vài tin × 0,15 cent, không phải $0.10 × 96
  lần/ngày. Nếu user hỏi lại lo lắng về chi phí, giải thích đúng cơ chế này ngay, đừng để hiểu
  nhầm "user tưởng ngày tốn $9,6" lặp lại.

## 7. Bước tiếp theo nên đề xuất (nếu hỏi "giờ làm gì tiếp")
1. **Kiểm tra `plans/incoming/` trước tiên (26/07):** có 1 plan từ Antigravity về cải thiện
   hiển thị "Repo nổi bật" GitHub đang chờ (xem mục 3) — đọc + bàn tiếp với user nếu phiên trước
   chưa xử lý xong.
2. **Reddit (đang kẹt CAPTCHA/IP 4G, xem mục 3):** hỏi user đã thử bật/tắt máy bay hoặc mạng
   khác chưa; nếu vẫn kẹt, cân nhắc gác hẳn hoặc thử cách khác (nhờ người khác tạo app hộ ở mạng
   sạch). Khi có `client_id`/`secret` → thêm vào **GitHub secrets**, nút lọc Reddit tự hiện.
3. **Thêm nguồn cập nhật cho các AI lớn** (Anthropic/Claude, Gemini, Grok, Kimi) vào nhóm "Blog
   hãng AI" — user yêu cầu 25/07, chưa khảo sát nguồn khả thi (RSS chính thức có/không, hay mở
   rộng từ khoá HN/blog hiện có).
4. **Đổi brand + domain chính (26/07):** làm banner thông báo đổi tên hiển thị (hiện cho user
   hiện tại thấy ~24h), sau đó đổi "SAI News" → "BAI News" + đặt `bainews.site` làm domain
   chính trên Vercel (xem mục 2, mục 3).
5. Về sau: PWA/app điện thoại, thêm nguồn nữa, trau chuốt giao diện, có thể thêm lọc từ khoá AI cho
   các nguồn báo phổ thông (TechCrunch/Verge... hiện lấy toàn bộ mục AI, chưa lọc thêm).

**Đã xong (đừng đề xuất lại):** cron-job.org (nhịp tự động), dịch tiêu đề `title_vi` + backfill,
nút sắp xếp Mới nhất/Nổi bật, lọc thời gian, dark mode, Vercel Analytics (đã xem số liệu 25/07 —
traffic chủ yếu từ Facebook referral, 97% VN, bounce rate cao là bình thường vì web 1 trang),
tách nhóm Blog (3 nhóm), mở rộng "Repo nổi bật" GitHub (13 blog/60 repo), fix lỗi Next.js Data
Cache khiến lọc theo nguồn hiện tin cũ, mua tên miền riêng `bainews.site` + nối Vercel (26/07),
tạo cơ chế `plans/` (Codex/Antigravity → Claude bàn → `tasks/todo/`) + track nốt `tasks/` vào
git (26/07).
