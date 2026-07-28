# CLAUDE.md — AI News Aggregator (bàn giao cho phiên sau)

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
- **Thương hiệu hiển thị: "BAI News"** (h1 + `<title>` + meta, đổi từ "SAI News" ngày 27/07);
  tagline trung lập "Tổng hợp & tóm tắt tin tức, kèm nguồn." (bỏ neo "AI" để mở rộng chủ đề
  sau). Tên project trên Vercel/GitHub/Supabase GIỮ NGUYÊN (ai-news-aggregator).
  **Banner thông báo đổi tên** hiện đầu trang đến hết 30/07/2026 (tự ẩn sau hạn, có nút đóng
  lưu localStorage) — component `web/components/RenameBanner.js`, gắn trong `web/app/layout.js`.
  Sau 30/07 banner tự ẩn, không cần deploy lại; dọn code cũ không cấp thiết.
- **Chế độ Sáng/Tối:** nút icon cạnh VI/EN; mặc định theo hệ thống (`prefers-color-scheme`),
  chọn tay nhớ `localStorage`; dùng `data-theme` trên `<html>` + script inline chống nháy trong
  `web/app/layout.js`; màu qua biến CSS nên phủ toàn trang. **Bug đã sửa (27/07):** script
  inline đặt `data-theme` trước khi React hydrate, nhưng thuộc tính này có thể bị mất sau khi
  hydrate xong (JSX gốc của `<html>` không khai báo `data-theme` nên không đảm bảo giữ nguyên
  qua vòng đời React) → chọn sáng/tối xong tải lại trang có lúc KHÔNG giữ. Fix: `Feed.js` đọc
  thẳng `localStorage.getItem("theme")` (nguồn đáng tin cậy) trong `useEffect` sau khi mount rồi
  **ghi lại** `data-theme`, không chỉ đọc từ thuộc tính DOM. Nhãn nút VI/EN, badge nguồn GitHub
  (`web/lib/format.js`) và banner đổi tên (`RenameBanner.js`) đều đã hỗ trợ dịch song ngữ đầy đủ.
- **Tính năng frontend đã live:** feed thẻ; **nút chuyển ngôn ngữ VI/EN** (nhớ localStorage);
  **lọc theo nguồn** (Tất cả + mỗi nguồn; 13 blog/báo tách thành **3 nhóm**: "Blog hãng AI"
  (openai/deepmind/huggingface/mistral/bair), "Báo công nghệ" (techcrunch/theverge/arstechnica/
  venturebeat/technologyreview), "Newsletter" (simonwillison/importai/thegradient); **6 nguồn
  GitHub gộp thành 1 nút "GitHub" + 1 ô `<select>` phụ hiện khi chọn** (Tất cả GitHub / Release /
  Trending nhiều sao / 🔥 Trending ngày / 🔥 Trending tuần / 🔥 Trending tháng / Kinh điển —
  xem `web/lib/filters.js`, entry con đánh dấu `parent: "github"`, 27/07) — nhãn đổi theo VI/EN
  qua `web/lib/i18n.js`; nút ẩn nếu nhóm/nguồn chưa có tin; **toàn bộ 6 nguồn GitHub đã được tách
  khỏi feed "Tất cả"** (trang chủ mặc định chỉ hiện tin thời sự/báo/blog/arXiv/HN); trong phạm vi
  GitHub, sắp "Nổi bật nhất" xếp theo số sao giảm dần);
  **infinite scroll** (tải 40 tin/lần qua `/api/items`, tự tải thêm khi cuộn, kết hợp mọi bộ lọc,
  có "Đang tải thêm…"/"Đã hết tin"). Thẻ hiển thị: badge nguồn, điểm — GitHub dùng ★ + số rút
  gọn ("158K") + badge ngôn ngữ lập trình, nguồn khác dùng ▲ + số đầy đủ — thời gian tương đối,
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
  xem số liệu ở Vercel dashboard → tab Analytics. **Số liệu xem thật 27/07 (24h):** 174 visitor,
  275 pageview, bounce rate 88%, đỉnh ~20 visitor/giờ. Referrer: **~64% từ Facebook**
  (facebook.com/l.facebook.com/lm.facebook.com/m.facebook.com cộng lại), **gần như 0% từ tìm
  kiếm** (bing.com chỉ 1, không có Google organic). → Kết luận: traffic phụ thuộc gần hoàn toàn
  1 kênh (Facebook, đăng 1 lần rồi thôi, không đều) — đây là gốc rễ traffic dao động mạnh theo
  ngày. **Quyết định:** chưa bật quảng cáo (xem mục 4), ưu tiên đa dạng hoá kênh trước.
- **SEO cơ bản đã thêm (27/07, Claude Sonnet 5):** `web/app/robots.js` (cho phép crawl + trỏ
  sitemap), `web/app/sitemap.js` (khai trang chủ), `web/app/icon.svg` (favicon — trước đó
  KHÔNG có favicon nào), metadata trong `web/app/layout.js` mở rộng (`keywords`, `openGraph`,
  `twitter`, `metadataBase`, title/description có từ khoá tiếng Việt "tin AI"/"tóm tắt tin AI
  tiếng Việt"). **Lưu ý:** thử thêm ảnh Open Graph tự sinh (`next/og` `ImageResponse`) nhưng gặp
  lỗi đã biết của Next.js **trên Windows** (load font mặc định qua `file://` URL sai định dạng,
  lỗi `ERR_INVALID_URL`) — đã bỏ, chỉ giữ OG dạng chữ. Muốn có ảnh preview đẹp khi chia sẻ
  Facebook thì cần thiết kế ảnh tĩnh 1200×630 rồi gắn thủ công (chưa làm, không gấp). Đã commit
  + push (`77b4f84`), Vercel tự deploy.
- **SEO nội dung — 2 trang song ngữ "GitHub AI nổi bật" (27/07, Claude bàn thiết kế + Antigravity
  code, đã kiểm tra + deploy):** `/github-ai` (VI) + `/en/github-ai` (EN), Server Component,
  ISR 5 phút, dữ liệu live từ `fetchItems({filter:"github", sort:"hot"})`. Có `alternates.
  languages` (hreflang) liên kết chéo 2 bản, đã khai trong `web/app/sitemap.js`. File:
  `web/app/github-ai/page.js`, `web/app/en/github-ai/page.js`, `web/components/GithubAiList.js`
  (component hiển thị riêng, KHÔNG dùng chung `NewsCard.js`). Spec:
  `docs/superpowers/specs/2026-07-27-seo-github-ai-bilingual-design.md`.
- **Nút Lưu tin (localStorage) + nút Chia sẻ + trang chi tiết `/tin/[id]` (27/07, Claude bàn
  thiết kế + Antigravity code, đã kiểm tra + deploy):** không cần tài khoản — danh sách lưu
  trong `localStorage` khoá `bai_saved_lists` (module `web/lib/savedLists.js`: tạo/đổi tên/xoá
  danh sách, lưu/bỏ lưu tin). Bấm 🔖 là lưu ngay vào danh sách mặc định "Đã lưu"; mũi tên cạnh đó
  mở popup (`SaveListPopup.js`) để chọn/tạo danh sách khác. Nút Chia sẻ (`web/lib/share.js`)
  dùng `navigator.share()` trên di động, fallback copy link trên desktop — **link chia sẻ luôn
  trỏ về `bainews.site/tin/{id}`** (trang chi tiết mới, `web/app/tin/[id]/page.js` +
  `DetailContent.js`), không chia sẻ thẳng link bài gốc — mục tiêu giữ traffic quay lại web.
  Trang "Đã lưu" ở `/da-luu` (không cache dữ liệu cũ — luôn gọi `/api/saved-items?ids=...` lấy
  bản mới nhất từ Supabase). Spec: `docs/superpowers/specs/2026-07-27-save-share-buttons-design.md`.
  **Phạm vi hiện tại: chỉ trang chủ** (`NewsCard.js`), CHƯA có trên `/github-ai`/`/en/github-ai`.
- **Nút Lưu/Chia sẻ đổi giao diện (27/07, Claude Sonnet 5):** bản đầu Antigravity làm dùng emoji
  (🔖🔗▾) trong khung viền mảnh — user chê xấu, yêu cầu làm theo kiểu "pill" bo tròn nền đặc
  giống YouTube. Đã thay bằng icon SVG vẽ nét (`web/components/icons.js`: `ShareIcon`,
  `BookmarkIcon`, `ChevronDownIcon`, dùng `currentColor` nên tự đổi màu theo theme/trạng thái),
  style `.pill`/`.pill-group` trong `globals.css` (biến `--chip`/`--chip-hover` cho cả 2 theme).
  **Bug kỹ thuật gặp phải:** dùng thuộc tính viết tắt `background: var(--chip)` với
  `transition: background 0.12s` khiến khi đổi theme (sáng↔tối) mà KHÔNG tải lại trang, nền nút
  không cập nhật theo giá trị biến CSS mới (kẹt ở giá trị cũ) — đổi sang `background-color` +
  `transition: background-color 0.12s` mới nội suy đúng qua biến CSS thay đổi động. **Nếu sau
  này thêm phần tử có nền đổi theo `data-theme` + có transition, LUÔN dùng `background-color`,
  KHÔNG dùng shorthand `background`.**
- **Nút menu ☰ ở header (27/07, Claude Sonnet 5):** góc phải header, cùng hàng và đứng SAU nút
  sáng/tối + VI/EN (ngoài cùng bên phải) — `web/components/HeaderMenu.js`, dropdown neo dưới nút
  canh phải, đóng khi bấm ra ngoài/Esc/bấm lại nút. 3 mục: Trang chủ, GitHub AI nổi bật (tự trỏ
  `/en/github-ai` khi đang chế độ EN), Tin đã lưu. Chân trang (`Feed.js`) rút gọn lại còn 1 link
  GitHub AI (bỏ bớt link trùng với menu, giữ 1 link để có liên kết nội bộ tĩnh trong HTML cho SEO).
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
- Web chính: **https://bainews.site** — domain riêng, đã mua ở Namecheap ($0.98/năm, KHÔNG
  auto-renew, tự hết hạn nếu không gia hạn tay), đã trỏ DNS + đã đặt làm **domain chính** trên
  Vercel (27/07, qua "Redirect to another Domain"). `sainews.vercel.app` (URL Vercel gốc, Root
  Directory = `web/`, env `SUPABASE_URL` + `SUPABASE_ANON_KEY`) giờ **tự redirect 308** sang
  `bainews.site` — link Facebook/bookmark cũ không gãy. Brand hiển thị đã đổi sang "BAI News"
  (27/07), banner thông báo đổi tên chạy tới hết 30/07/2026 rồi tự ẩn.
- GitHub: **https://github.com/ndat7783svg/ai-news-aggregator** (public)
- Supabase project ref: **huqbirxwvrprqkhrwnsl** (`https://huqbirxwvrprqkhrwnsl.supabase.co`)

## 3. CHƯA làm / dang dở (đừng tưởng đã có)
- **Quảng cáo (ads): CHƯA bật.** Đã bàn kỹ 27/07 — traffic hiện quá nhỏ (174 visitor/ngày) và quá
  bấp bênh (phụ thuộc 1 kênh Facebook không đều, dao động -48%/ngày) để quảng cáo có ý nghĩa. Mốc
  tham khảo để cân nhắc lại: traffic ổn định vài trăm–1000+/ngày *liên tục* (không phải 1 đỉnh
  rồi tụt). Đừng đề xuất bật quảng cáo trước khi đạt mốc này.
- **Nội dung SEO dài hạn — ĐÃ BẮT ĐẦU (27/07), còn nhỏ.** Đã có 2 trang chuyên đề song ngữ
  GitHub AI (`/github-ai`, `/en/github-ai`) + trang chi tiết từng tin (`/tin/[id]`, chủ yếu để
  phục vụ nút Chia sẻ nhưng đồng thời cũng là nội dung SEO dài-tail) — xem mục 2. **Còn thiếu:**
  chưa mở rộng trang chuyên đề sang chủ đề khác (blog hãng, arXiv...), chưa đo được hiệu quả thật
  (traffic/index) vì mới deploy, cần đợi vài tuần rồi xem lại Google Search Console + Analytics.
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
- ~~Tên miền riêng `bainews.site`: đặt làm domain chính~~ **ĐÃ XONG (27/07).** User tự vào
  Vercel → Domains → Edit → bật "Redirect to another Domain" → `sainews.vercel.app` giờ tự
  redirect 308 sang `bainews.site` (đã xác nhận qua ảnh chụp Vercel Dashboard). Không mua
  `.com` (giá premium $2,385, quá đắt).
- Blog **Anthropic & Meta AI** (blog chính thức hãng, khác với "tin về model Claude"): bỏ qua vì
  không có RSS chính thức (không scraping).
- **Login/thanh toán/tài khoản, PWA/app điện thoại: CHƯA làm** (ngoài phạm vi bản đầu).
- **Cập nhật số sao repo GitHub cũ (phần C3 của plan Antigravity): CHƯA làm, đã gác lại.**
  Số sao hiển thị là số tại lúc thu thập, không được cập nhật về sau. Muốn làm phải thêm logic
  UPDATE trong pipeline (hiện chỉ INSERT) — cân nhắc kỹ, không cấp thiết.

## 4. Quyết định đã chốt (ĐỪNG đề xuất lại)
- **Chiến lược quảng bá (27/07):** ưu tiên **Facebook đăng đều tay** (kênh đang có traffic thật
  nhưng chỉ đăng 1 lần rồi thôi — cần làm đều đặn thay vì 1 lần) song song với **SEO làm nền tảng
  lâu dài** (chậm nhưng bền, không phụ thuộc thuật toán 1 nền tảng). **KHÔNG dùng Product
  Hunt/Indie Hackers** dù đây là gợi ý mặc định cho web tool — vì đối tượng ở đó là dev/founder
  quốc tế nói tiếng Anh, lệch hẳn với 97% traffic hiện tại là người Việt.
  Xem thêm dự án phụ trợ ở mục 8 (video ngắn quảng bá qua NotebookLM).
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
  IntersectionObserver không kích hoạt trong đó, **CSS `transition` cũng không chạy** (đã gặp lại
  27/07 khi kiểm tra nút pill: nền không đổi khi chuyển theme động — tưởng là bug thật, hoá ra do
  pane không compositing frame nên hiệu ứng đứng yên; tắt `transition` tạm thời bằng `<style>*{
  transition:none!important}</style>` để đo lại mới thấy đúng). Kiểm tra tính năng tương tác
  (nút, lọc, cuộn, đổi theme/màu có transition) bằng `dispatchEvent` + tắt transition khi cần đo,
  hoặc kiểm trên **web thật**, đừng vội kết luận "lỗi" chỉ từ công cụ này.
- **ĐÃ SỬA (25/07) — Next.js Data Cache làm lọc theo nguồn hiện tin cũ:** `export const dynamic
  = "force-dynamic"` trong route API **KHÔNG** tự tắt cache cho từng lệnh `fetch` bên trong (Supabase
  đọc qua `fetch`). Mỗi tổ hợp filter/sort/time là 1 URL bị Next Data Cache "đóng băng" riêng, chỉ
  query `all` được trang chủ ISR làm tươi. **Fix:** thêm `export const fetchCache =
  "force-no-store";` cạnh `force-dynamic` trong `web/app/api/items/route.js`. **Nếu thêm route
  API mới đọc Supabase, LUÔN nhớ thêm cả 2 dòng này**, không chỉ `force-dynamic`. Chi tiết: memory
  `ai-news-nextjs-data-cache-filter`.
- Chạy web cục bộ: `cd web && npm run dev` (cần `web/.env.local` với `SUPABASE_URL` +
  `SUPABASE_ANON_KEY`). Pipeline cục bộ: `npm run pipeline` (cần `.env` ở gốc).
  **Lưu ý (27/07):** kiểm tra thấy `web/.env.local` hiện KHÔNG tồn tại trên máy này (chỉ có
  `.env.local.example`) — nếu cần chạy dev cục bộ mà chưa có, tạo file này từ mẫu, điền
  `SUPABASE_URL`/`SUPABASE_ANON_KEY` (lấy ở Supabase Dashboard → Settings → API Keys → tab
  "Legacy anon, service_role API keys" → dòng `anon`).

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
0. **Dự án video (mục 8) đã setup xong, chưa chạy thử** — nếu user nhắc tới, gợi ý mở chat mới ở
   `D:\bai-news-video-project` để làm video test đầu tiên (không làm trong project này).
1. **Kiểm tra `plans/incoming/` trước tiên:** nếu Codex/Antigravity có thả plan mới thì đọc +
   bàn với user trước khi làm việc khác (xem `plans/README.md`). Hiện đang RỖNG (26/07).
2. **Đo hiệu quả 2 trang SEO GitHub AI + nút Lưu/Chia sẻ (deploy 27/07):** đợi vài tuần rồi xem
   Google Search Console có index `/github-ai`/`/en/github-ai`/`/tin/[id]` không, Analytics có
   traffic từ tìm kiếm tăng không. Nếu hiệu quả, cân nhắc nhân rộng trang chuyên đề sang chủ đề
   khác (blog hãng, arXiv).
3. **Reddit (đang kẹt CAPTCHA/IP 4G, xem mục 3):** hỏi user đã thử bật/tắt máy bay hoặc mạng
   khác chưa; nếu vẫn kẹt, cân nhắc gác hẳn hoặc thử cách khác (nhờ người khác tạo app hộ ở mạng
   sạch). Khi có `client_id`/`secret` → thêm vào **GitHub secrets**, nút lọc Reddit tự hiện.
4. **Thêm nguồn cập nhật cho các AI lớn** (Anthropic/Claude, Gemini, Grok, Kimi) vào nhóm "Blog
   hãng AI" — user yêu cầu 25/07, chưa khảo sát nguồn khả thi (RSS chính thức có/không, hay mở
   rộng từ khoá HN/blog hiện có).
5. Về sau: PWA/app điện thoại, thêm nguồn nữa, trau chuốt giao diện, có thể thêm lọc từ khoá AI cho
   các nguồn báo phổ thông (TechCrunch/Verge... hiện lấy toàn bộ mục AI, chưa lọc thêm), thêm nút
   Lưu/Chia sẻ cho `/github-ai`/`/en/github-ai` (`GithubAiList.js`) nếu tính năng này hiệu quả.

**Đã xong (đừng đề xuất lại):** cron-job.org (nhịp tự động), dịch tiêu đề `title_vi` + backfill,
nút sắp xếp Mới nhất/Nổi bật, lọc thời gian, dark mode, Vercel Analytics (đã xem số liệu 25/07 —
traffic chủ yếu từ Facebook referral, 97% VN, bounce rate cao là bình thường vì web 1 trang),
tách nhóm Blog (3 nhóm), mở rộng "Repo nổi bật" GitHub (13 blog/60 repo), fix lỗi Next.js Data
Cache khiến lọc theo nguồn hiện tin cũ, mua tên miền riêng `bainews.site` + nối Vercel (26/07),
tạo cơ chế `plans/` (Codex/Antigravity → Claude bàn → `tasks/todo/`) + track nốt `tasks/` vào
git (26/07), **luồng "🔥 Trending" thật daily/weekly + cải thiện thẻ GitHub (26/07)**, **gom 4
nút lọc GitHub thành 1 nút + ô chọn phụ (27/07, lần đầu giao Antigravity làm — Codex hết token
tháng)**, **đổi brand "SAI News" → "BAI News" + banner thông báo 3 ngày (27/07, Antigravity)**, **mở rộng
GitHub "Kinh điển" (136 repo, đã backfill thật) + "Trending tháng" + tách 6 nguồn GitHub khỏi
feed "Tất cả" (27/07, Antigravity — lần này chạy model Gemini 3.6 Flash bên trong — Claude phát
hiện + sửa 2 lỗi thật trong script backfill trước khi chạy, xem mục "Bài học điều phối nhiều AI"
cuối file)**, **đặt
`bainews.site` làm domain chính trên Vercel (27/07, user tự làm)**, **sửa bug chế độ sáng/tối
không giữ sau tải lại trang + thiếu dịch badge/banner GitHub (27/07, Claude Sonnet 5)**, **SEO
cơ bản: robots.txt/sitemap.xml/favicon/metadata (27/07, Claude Sonnet 5, xem mục 2)**, **xem số
liệu Analytics thật + chốt chiến lược quảng bá Facebook đều tay + SEO song song (27/07, xem mục
4)**, **setup xong dự án phụ trợ video NotebookLM ở `D:\bai-news-video-project` — chưa chạy thử
(27/07, xem mục 8)**, **2 trang SEO song ngữ GitHub AI nổi bật `/github-ai` + `/en/github-ai`
(27/07, Claude bàn + Antigravity code, đã kiểm tra + deploy, xem mục 2)**, **nút Lưu tin
(localStorage, có danh sách) + nút Chia sẻ + trang chi tiết `/tin/[id]` + trang "Đã lưu"
`/da-luu` (27/07, Claude bàn + Antigravity code)**, **làm lại giao diện nút Lưu/Chia sẻ theo
kiểu pill YouTube + nút menu ☰ ở header dẫn tới 3 trang (27/07, Claude Sonnet 5)**.

### Luồng "🔥 Trending" GitHub (26/07) — đã chạy
Nguồn mới `github_trending_daily` + `github_trending_weekly`: đọc trang **github.com/trending**
(`?since=daily|weekly`) bằng Cheerio, giữ đúng thứ hạng trang, rồi gọi REST API từng repo để
**lọc lại theo chủ đề AI** (topic khớp `GITHUB_TRENDING_TOPICS` hoặc mô tả khớp `AI_KEYWORDS`)
— vì trang trending không lọc theo chủ đề, không lọc sẽ lẫn repo game/VPN/framework web.
Nguồn `github_trending` cũ (Search API, ngưỡng **500 sao — giữ nguyên, đừng hạ**) vẫn chạy song
song. Thẻ GitHub: icon ★ + số sao rút gọn ("158K") + badge ngôn ngữ lập trình (cần cột `extra`
trong `COLUMNS` ở `web/lib/supabaseServer.js`). Chi tiết đã bàn:
`plans/done/2026-07-26-cai-thien-hien-thi-github-repo-antigravity.md` +
`tasks/done/2026-07-26-cai-thien-hien-thi-thu-thap-github.md`.

**Bài học khi lọc theo từ khoá:** so khớp phải theo **ranh giới từ** (`\bkeyword\b`), KHÔNG
dùng "chứa chuỗi con" — từ khoá `rag` dính vào **sto*rag*e**/**f*rag*ment**/**d*rag*on** làm
repo không liên quan lọt vào feed AI (đã sửa trước khi gộp).

### GitHub mở rộng: "Kinh điển" + "Trending tháng" + tách khỏi "Tất cả" (27/07) — đã chạy
Nguồn mới `github_classics` (≥5.000 sao, không giới hạn ngày push, backfill **1 lần** qua
`node --env-file=.env backfill-github-classics.js`, đã chạy thật: 136 repo, $0.2656) và
`github_trending_monthly` (chạy đều như ngày/tuần). **Toàn bộ 6 nguồn GitHub đã tách khỏi feed
"Tất cả"** — trang chủ mặc định giờ chỉ còn tin thời sự/blog/arXiv/HN, xem GitHub phải bấm nút
riêng. Trong phạm vi lọc GitHub, "Nổi bật nhất" sắp theo **số sao** (trước đây GitHub luôn bị
đẩy xuống cuối vì chỉ HN/Reddit được tính điểm — đã sửa, xem `web/lib/supabaseServer.js`
`isPureGithubSources`). Xem "Tất cả GitHub" tự **gộp trùng repo** xuất hiện ở nhiều nguồn con
(giữ bản mới nhất, không tính `github_release`). Chi tiết:
`docs/superpowers/specs/2026-07-27-github-expansion-classics-monthly-design.md`.

## 8. Dự án phụ trợ: video quảng bá qua NotebookLM (mới, 27/07)

Đã tạo dự án **RIÊNG BIỆT** tại `D:\bai-news-video-project` (Claude Code project khác, KHÔNG phải
thư mục con của project này) — mục đích tạo video ngắn (~60s, dọc) tóm tắt tin AI nổi bật bằng
NotebookLM, đăng YouTube Shorts/TikTok/Facebook Reels để có thêm kênh quảng bá ngoài Facebook.

**Cách 2 dự án liên kết:** KHÔNG qua "chat nhớ nhau" (2 chat độc lập hoàn toàn) — mà qua
**database Supabase dùng chung**. Dự án video có sẵn file `.env` riêng chứa `SUPABASE_URL` +
`SUPABASE_ANON_KEY` (đã copy từ Supabase Dashboard 27/07, key chỉ đọc — an toàn) để tự query bảng
`news_items` qua REST API, không cần đụng vào thư mục project này. Nếu sau này đổi anon key
(xoay vòng bảo mật) thì nhớ cập nhật cả bên `D:\bai-news-video-project\.env`.

**Trạng thái:** đã setup xong toàn bộ tài liệu/quy trình (xem `D:\bai-news-video-project\
CLAUDE.md`), kênh YouTube mới "AisuoG" đã tạo, tài khoản NotebookLM đã có — **CHƯA chạy thử làm
video lần nào**. Quyết định quan trọng đã chốt bên đó: bán tự động (không tự động hoàn toàn, cần
người dùng mở phiên chủ động + luôn tự bấm nút đăng cuối), video nói **tiếng Anh** (khác với
Facebook đang dùng tiếng Việt), dùng kênh YouTube MỚI thay vì kênh Minecraft cũ (1500 sub,
dormant 3 năm, khác ngách hoàn toàn).

**Bài học điều phối nhiều AI làm task (Codex, Antigravity — Antigravity chạy nhiều model khác
nhau tuỳ lúc, có lần Gemini 3.6 Flash):** cả 2 công cụ đều làm đúng phần lớn khi có task file
chi tiết ở `tasks/todo/`, nhưng đều **quên/sai sót khác nhau** mỗi lần — có lần thiếu `labelKey`
i18n hoặc quên cập nhật AGENTS.md; lần dùng Gemini 3.6 Flash viết script backfill copy khuôn từ
`pipeline.js` nhưng **bỏ sót bước lọc bản tóm tắt lỗi trước khi ghi DB** (nguy hiểm — dữ liệu
hỏng ghi kiểu này KHÔNG sửa được bằng cách chạy lại, vì dedupe theo unique key +
`ignoreDuplicates`) và **copy nhầm tham số `onUsage`** giữa 2 hàm tương tự
nhau khiến báo giá luôn hiện $0. → **LUÔN đọc kỹ diff + chạy thử thật (không chỉ đọc code) sau
mỗi lần giao AI khác làm**, đừng tin báo cáo "xong" của AI đó. Đã cập nhật bài học chung (áp
dụng mọi project, không riêng dự án này) vào skill `app-web-sk` mục 8.
