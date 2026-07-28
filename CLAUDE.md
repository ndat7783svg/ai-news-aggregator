# CLAUDE.md — AI News Aggregator (bàn giao cho phiên sau)

> Đọc file này + `PROJECT_MAP.md` (bản đồ file chi tiết) là tiếp tục làm việc được ngay.
> Người dùng **không phải lập trình viên**, giao tiếp **tiếng Việt**, thao tác thủ công cần
> **hướng dẫn từng bước + giá trị copy-paste sẵn**; trao đổi qua ảnh chụp màn hình rất tốt.
>
> **Khi cập nhật file này:** chỉ ghi **trạng thái hiện tại** (không ngày tháng, không kể chuyện
> điều tra/nguyên nhân). Mọi diễn biến, lý do quyết định, bug đã sửa → ghi vào `HANDOFF.md`. Nếu
> 1 gạch đầu dòng sắp vượt 3-4 dòng, đó là dấu hiệu nó thuộc về HANDOFF.md, không phải ở đây.
>
> **Trước khi bắt tay vào 1 nhiệm vụ mới, LUÔN hỏi user trước: để Claude làm hay để AI khác
> (Codex/Antigravity...) làm?** User chủ động chia việc cho nhiều AI để tiết kiệm token — đừng tự
> ý bắt tay vào việc lớn/tốn token mà chưa hỏi. Việc nhỏ, rõ ràng, ít bước (sửa 1-2 dòng, trả lời
> câu hỏi, đọc/kiểm tra file) thì cứ làm luôn không cần hỏi.

## 1. Tổng quan
Website tổng hợp & **tóm tắt** tin AI (mô hình Techmeme/TLDR): thu tin nhiều nguồn → tóm tắt
song ngữ Việt+Anh bằng AI → hiển thị feed kèm link bài gốc. **Không đăng lại toàn văn.**

Kiến trúc: **Next.js (Vercel)** đọc **Supabase (Postgres)**; **GitHub Actions** chạy pipeline
Node.js định kỳ để thu thập + tóm tắt bằng **Claude Haiku API** rồi ghi Supabase.

**Nguồn đang chạy:** Hacker News (Algolia Search API), arXiv (cs.AI/LG/RO), GitHub (8 repo
Release + "Repo nổi bật"/"Trending" daily-weekly-monthly + "Kinh điển", 6 nguồn con — xem mục 2),
13 blog/báo AI qua RSS/Atom (OpenAI, DeepMind, Hugging Face, Mistral, BAIR, Simon Willison,
TechCrunch, The Verge, Ars Technica, VentureBeat, MIT Tech Review, Import AI, The Gradient — miễn
phí, không cần API key). Danh sách ở `lib/config.js`; thêm blog phải khai slug ở
`web/lib/filters.js` (1 trong 3 nhóm) + `web/lib/format.js`. **Reddit CHƯA bật** (mục 3).
X/Twitter **bỏ hẳn** (API đọc ~$100+/tháng, không hợp chi phí).

## 2. Trạng thái hiện tại — ĐÃ CHẠY THẬT trên production
- **Brand hiển thị: "BAI News"** (tagline trung lập "Tổng hợp & tóm tắt tin tức, kèm nguồn").
  Tên project hạ tầng (Vercel/GitHub/Supabase) giữ nguyên `ai-news-aggregator`. Banner thông báo
  đổi tên tự ẩn sau 30/07/2026, không cần deploy lại.
- **Giao diện:** feed thẻ kiểu Techmeme/TLDR; VI/EN (nhớ `localStorage`); Sáng/Tối (theo hệ
  thống hoặc chọn tay, nhớ `localStorage`); lọc theo nguồn (Tất cả + từng nguồn, 13 blog gộp 3
  nhóm: Blog hãng AI/Báo công nghệ/Newsletter); sắp xếp Mới nhất/Nổi bật; lọc thời gian (Hôm
  nay/Tuần/Tháng/Năm/Mọi lúc); infinite scroll (`/api/items`, 40 tin/lần).
- **GitHub:** 6 nguồn con (Release/Trending nhiều sao/🔥 ngày/tuần/tháng/Kinh điển) gộp vào 1 nút
  "GitHub" + `<select>` phụ, **đã tách hẳn khỏi feed "Tất cả"** (trang chủ mặc định chỉ hiện tin
  thời sự/báo/blog/arXiv/HN). "Nổi bật nhất" trong phạm vi GitHub sắp theo số sao.
  Thẻ hiển thị ★ + số rút gọn + badge ngôn ngữ lập trình.
- **Tiêu đề dịch (`title_vi`):** chế độ VI hiện tiêu đề tiếng Việt, EN giữ gốc — sinh trong bước
  tóm tắt (`summarizer.js`).
- **SEO:** `robots.js`/`sitemap.js`/`icon.svg`/metadata mở rộng (`layout.js`). 2 trang chuyên đề
  song ngữ **"GitHub AI nổi bật"**: `/github-ai` (VI) + `/en/github-ai` (EN), server-rendered ISR
  5 phút, hreflang liên kết chéo (`GithubAiList.js`, KHÔNG dùng chung `NewsCard.js`).
- **Lưu tin + Chia sẻ (chỉ trang chủ, chưa có ở `/github-ai`):** nút 🔖 lưu vào danh sách
  `localStorage` (khoá `bai_saved_lists`, module `web/lib/savedLists.js`) — bấm là lưu ngay vào
  "Đã lưu" mặc định, mũi tên mở popup chọn/tạo danh sách khác (`SaveListPopup.js`). Nút Chia sẻ
  (`web/lib/share.js`) dùng `navigator.share()`/fallback copy link, **luôn trỏ về
  `bainews.site/tin/{id}`** (trang chi tiết `web/app/tin/[id]/`, không chia sẻ thẳng link gốc).
  Trang "Đã lưu" ở `/da-luu` (luôn gọi `/api/saved-items?ids=...`, không cache cũ). Cả 2 nút vẽ
  kiểu pill bo tròn (icon SVG, `web/components/icons.js`), không dùng emoji.
- **Menu ☰ ở header** (`HeaderMenu.js`, ngoài cùng bên phải): Trang chủ / GitHub AI nổi bật / Tin
  đã lưu.
- **Vercel Web Analytics** đã bật, xem ở Vercel dashboard → tab Analytics. Traffic hiện phụ thuộc
  gần hoàn toàn kênh Facebook, gần như 0% từ tìm kiếm (chi tiết + số liệu: `HANDOFF.md`).
- **DB:** Supabase bảng `news_items`, RLS đọc-công-khai/ghi-chỉ-service_role, ~170+ tin.
- **Tự động hoá (QUAN TRỌNG):** lịch chạy thật do **cron-job.org** gọi GitHub REST
  `workflow_dispatch` mỗi 15' (cron nội bộ Actions không tin cậy — xem mục 5). Secrets:
  `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (+ `GITHUB_TOKEN` tự cấp;
  Reddit tuỳ chọn). Pipeline exit 1 nếu tóm tắt hỏng toàn bộ.
- **Cơ chế `plans/`** (chiều ngược `tasks/`): Codex/Antigravity thả plan vào `plans/incoming/`,
  Claude bàn cùng user rồi viết task thực thi vào `tasks/todo/`. Xem `plans/README.md`.

**Toạ độ dự án:**
- Web chính: **https://bainews.site** (domain riêng, Namecheap, KHÔNG auto-renew). Đã đặt làm
  domain chính trên Vercel; `sainews.vercel.app` (URL gốc, Root Directory = `web/`) tự redirect
  308 sang domain chính.
- GitHub: **https://github.com/ndat7783svg/ai-news-aggregator** (public)
- Supabase project ref: **huqbirxwvrprqkhrwnsl** (`https://huqbirxwvrprqkhrwnsl.supabase.co`)

## 3. CHƯA làm / dang dở (đừng tưởng đã có)
- **Quảng cáo: CHƯA bật.** Traffic hiện quá nhỏ/bấp bênh (phụ thuộc 1 kênh Facebook). Mốc để cân
  nhắc lại: traffic ổn định vài trăm–1000+/ngày *liên tục*. Đừng đề xuất trước khi đạt mốc này.
- **SEO nội dung dài hạn — mới có GitHub AI.** Chưa mở rộng trang chuyên đề sang chủ đề khác
  (blog hãng, arXiv), chưa đo được hiệu quả traffic/index thật (mới deploy, cần đợi vài tuần rồi
  xem Google Search Console + Analytics).
- **Reddit: CHƯA bật, kẹt ở bước tạo app.** Code `collectors/reddit.js` sẵn sàng, tự bỏ qua nếu
  thiếu `REDDIT_CLIENT_ID`/`SECRET`. Vướng: ISP chặn `reddit.com` (cần 4G/VPN) + reCAPTCHA lúc
  tạo app không phản hồi (nghi CGNAT bị đánh dấu nghi ngờ). Đã gợi ý thử đổi IP/mạng khác, **chưa
  có kết quả xác nhận** — hỏi lại user trước khi gợi ý thêm hướng khác. Đừng lặp lại hướng "tắt
  cookie bên thứ 3" (đã thử, không hiệu quả). Chi tiết điều tra: `HANDOFF.md`.
- **Blog hãng AI còn thiếu tin riêng của các mô hình lớn** (Anthropic/Claude, Gemini, Grok,
  Kimi). Chưa tìm/thêm nguồn — cần kiểm tra RSS chính thức có tồn tại không, hoặc mở rộng từ khoá
  HN/blog hiện có.
- Blog **Anthropic & Meta AI** (blog chính thức hãng): bỏ qua vì không có RSS chính thức (không
  scraping).
- **Login/thanh toán/tài khoản, PWA/app điện thoại: CHƯA làm** (ngoài phạm vi bản đầu).
- **Cập nhật số sao repo GitHub cũ: CHƯA làm, đã gác lại.** Số sao là số tại lúc thu thập. Muốn
  làm phải thêm logic UPDATE trong pipeline (hiện chỉ INSERT) — cân nhắc kỹ, không cấp thiết.
- **Nút Lưu/Chia sẻ chưa có trên `/github-ai`, `/en/github-ai`** (`GithubAiList.js`) — cân nhắc
  thêm nếu tính năng ở trang chủ hiệu quả.

## 4. Quyết định đã chốt (ĐỪNG đề xuất lại)
- **Chiến lược quảng bá:** Facebook đăng đều tay (kênh có traffic thật nhưng cần đăng đều, không
  phải 1 lần rồi thôi) song song SEO làm nền tảng lâu dài. **KHÔNG dùng Product Hunt/Indie
  Hackers** — đối tượng ở đó là dev/founder quốc tế, lệch với 97% traffic hiện tại là người Việt.
  Dự án phụ trợ video quảng bá: xem mục 8.
- **Dedupe theo (source, source_id), KHÔNG theo URL.** Mỗi nguồn có ID ổn định; URL hay đổi
  (tracking/redirect) dễ sót; cùng 1 bài ở 2 nguồn thì giữ cả 2 (thể hiện độ nóng).
- **Dùng Claude Haiku (`claude-haiku-4-5`), không đổi sang Gemini/GPT.** Rất rẻ, chất lượng tóm
  tắt 2-4 câu VI+EN đã kiểm tra tốt, structured outputs cho JSON sạch, giữ đồng bộ hệ Claude.
- **Chưa làm login/thanh toán:** ưu tiên chạy ổn định; code đã tách module (collect/summarize/
  db/web) để gắn thêm sau mà không viết lại.
- **Giao diện feed thẻ (Techmeme/TLDR), KHÔNG làm kiểu swipe/TikTok.** Hợp mô hình "tóm tắt + dẫn
  nguồn", dễ đọc lướt và kèm link gốc.
- Ngôn ngữ: collector/pipeline dùng **JS thuần (Node ESM)**; web dùng **Next.js 14 App Router (JS)**.
- **Rủi ro pháp lý mô hình tóm tắt+link: user đã CHẤP NHẬN, đừng bàn lại** trừ khi có thay đổi
  lớn (thu phí/quảng cáo dựa nội dung người khác, đăng lại toàn văn, dùng logo/ảnh hãng khác).
  Lý do: tóm tắt viết lại bằng lời riêng + luôn link nguồn + không chép nguyên văn = rủi ro thấp
  (giống Techmeme/TLDR). Chi tiết: memory `ai-news-legal-risk-note`.

## 5. Quy tắc kỹ thuật cần nhớ
- **ISP người dùng đôi khi chặn `github.com`** (git push timeout) — `api.github.com`, Vercel,
  Supabase, Anthropic vẫn vào được. Actions chạy trên cloud GitHub, KHÔNG phụ thuộc mạng người dùng.
- **Supabase dùng hệ key mới** → lấy `anon`/`service_role` ở tab "Legacy" trong Settings→API.
  `service_role` chỉ cho pipeline (ghi, bypass RLS); `anon` cho web (chỉ đọc qua RLS).
- **Code tự chuẩn hoá env** (`db/supabase.js`, `web/lib/supabaseServer.js`): tự bỏ prefix `TÊN=`,
  dấu nháy, khoảng trắng, `/rest/v1` thừa khi dán secret.
- **GitHub Actions `schedule` không đáng tin (chạy thưa 3-4h/lần dù đặt 15').** Fix đang dùng:
  cron-job.org gọi `workflow_dispatch`. Chi tiết: memory `ai-news-cron-throttling-fix`.
- **`concurrency: cancel-in-progress: true` bắt buộc** trong `collect.yml` (+ `timeout-minutes:
  10`) — nếu để `false`, 1 run kẹt "queued" sẽ huỷ hàng loạt run sau, web đứng tin. Chi tiết:
  memory `ai-news-actions-queue-stuck-fix`.
- **Route API mới đọc Supabase LUÔN cần cả 2 dòng:** `export const dynamic = "force-dynamic"` VÀ
  `export const fetchCache = "force-no-store"`. Thiếu dòng thứ 2 → Next.js Data Cache đóng băng
  kết quả theo từng URL filter/sort/time. Chi tiết: memory `ai-news-nextjs-data-cache-filter`.
- **CSS: phần tử có nền đổi theo `data-theme` + có `transition` → LUÔN dùng `background-color`,
  KHÔNG dùng shorthand `background`** (shorthand không nội suy đúng khi biến CSS đổi động).
- **Khung trình duyệt tự động của Claude không compositing frame** → click mô phỏng,
  IntersectionObserver, CSS `transition` đều không chạy trong đó. Kiểm tra bằng `dispatchEvent` +
  tắt transition tạm thời (`<style>*{transition:none!important}</style>`) khi cần đo màu/hiệu
  ứng, hoặc kiểm trên web thật — đừng vội kết luận "lỗi" chỉ từ công cụ này.
- **Lọc theo từ khoá AI phải dùng ranh giới từ (`\bkeyword\b`), KHÔNG "chứa chuỗi con"** — vd
  `rag` dính vào *storage*/*fragment*/*dragon* làm lọt repo không liên quan.
- **Ngưỡng `github_trending` (Search API) là 500 sao — đã cân nhắc kỹ, đừng hạ.**
- Chạy web cục bộ: `cd web && npm run dev` (cần `web/.env.local` — mẫu `.env.local.example`,
  lấy `anon` key ở Supabase Dashboard → Settings → API Keys → tab "Legacy"). Pipeline cục bộ:
  `npm run pipeline` (cần `.env` ở gốc, mẫu `.env.example`).

## 6. Chi phí thực tế
- **Anthropic tới giờ:** ước tính < $1.50 (tóm tắt ~170+ tin + backfill + vài lô mở rộng nguồn).
  Số thật xem ở console.anthropic.com → Usage/Billing.
- **Vận hành hàng tháng:** ước ~$1–3/tháng (chỉ tóm tắt tin MỚI mỗi lần chạy 15', dedupe theo
  source+source_id nên không lặp phí). Supabase/Vercel/GitHub Actions/cron-job.org miễn phí ở
  quy mô này.

## 7. Bước tiếp theo nên đề xuất (nếu hỏi "giờ làm gì tiếp")
0. **Dự án video (mục 8) đã setup xong, chưa chạy thử** — nếu user nhắc tới, gợi ý mở chat mới ở
   `D:\bai-news-video-project`.
1. **Kiểm tra `plans/incoming/` trước tiên** — nếu Codex/Antigravity thả plan mới thì bàn trước
   khi làm việc khác.
2. **Đo hiệu quả 2 trang SEO GitHub AI + nút Lưu/Chia sẻ:** đợi vài tuần rồi xem Google Search
   Console có index không, Analytics có traffic từ tìm kiếm tăng không. Nếu hiệu quả, nhân rộng
   sang chủ đề khác.
3. **Reddit:** hỏi user đã thử đổi IP/mạng chưa; nếu vẫn kẹt, cân nhắc gác hẳn.
4. **Thêm nguồn cho các AI lớn** (Anthropic/Claude, Gemini, Grok, Kimi) vào nhóm "Blog hãng AI".
5. Về sau: PWA/app điện thoại, thêm nguồn nữa, lọc từ khoá AI cho báo phổ thông (TechCrunch/Verge
   hiện lấy toàn bộ mục AI), thêm nút Lưu/Chia sẻ cho trang GitHub AI nếu hiệu quả.

**Lịch sử đầy đủ mọi việc đã làm (theo ngày, kèm lý do/diễn biến): xem `HANDOFF.md`.**

## 8. Dự án phụ trợ: video quảng bá qua NotebookLM
Dự án **RIÊNG BIỆT** tại `D:\bai-news-video-project` (Claude Code project khác, KHÔNG phải thư
mục con của project này) — video ngắn (~60s, dọc) tóm tắt tin AI nổi bật bằng NotebookLM, đăng
YouTube Shorts/TikTok/Facebook Reels để có thêm kênh quảng bá ngoài Facebook.

**Cách 2 dự án liên kết:** qua **database Supabase dùng chung** (KHÔNG qua "chat nhớ nhau"). Dự
án video có `.env` riêng chứa `SUPABASE_URL`/`SUPABASE_ANON_KEY` (key chỉ đọc) để tự query bảng
`news_items` qua REST API. Nếu xoay vòng anon key thì nhớ cập nhật cả bên đó.

**Trạng thái:** đã setup xong tài liệu/quy trình (xem `D:\bai-news-video-project\CLAUDE.md`),
kênh YouTube "AisuoG" + tài khoản NotebookLM đã có — **CHƯA chạy thử làm video lần nào**.

Bài học điều phối nhiều AI (Codex/Antigravity) làm task — đã đúc kết vào skill `app-web-sk`
mục 8, áp dụng cho mọi project, không lặp lại ở đây.
