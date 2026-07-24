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
GitHub "Trending" (qua GitHub **Search API** — không có API trending chính thức; dùng
`api.github.com` khác `github.com`), và **13 blog/báo AI qua RSS/Atom**: OpenAI, Google
DeepMind, Hugging Face, Mistral, Berkeley BAIR, Simon Willison, TechCrunch, The Verge, Ars
Technica, VentureBeat, MIT Tech Review, Import AI, The Gradient. (Danh sách blog/repo ở
`lib/config.js`; thêm blog phải khai báo slug ở `web/lib/filters.js` + `web/lib/format.js`.)
Blog/báo miễn phí, KHÔNG cần API key. **Reddit CHƯA bật** (xem mục 3). X/Twitter **bỏ** (API
đọc ~$100+/tháng, không hợp chi phí).

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
  **lọc theo nguồn** (Tất cả + mỗi nguồn, "Blog" gộp cả 13 blog/báo, nút ẩn nếu nguồn chưa có tin);
  **infinite scroll** (tải 40 tin/lần qua `/api/items`, tự tải thêm khi cuộn, kết hợp mọi bộ lọc,
  có "Đang tải thêm…"/"Đã hết tin"). Thẻ hiển thị: badge nguồn, điểm (▲), thời gian tương đối,
  tiêu đề (link bài gốc), tóm tắt theo ngôn ngữ, tác giả.
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
- **Tự động (QUAN TRỌNG):** lịch chạy thật do **cron-job.org** gọi GitHub REST `workflow_dispatch`
  mỗi 15' — vì cron nội bộ của GitHub Actions bị bóp lịch (chạy thưa 3-4h/lần), KHÔNG tin cậy.
  Xem memory `ai-news-cron-throttling-fix` (URL API, header, token). Workflow vẫn giữ block
  `schedule` (dự phòng) + `workflow_dispatch`. Secrets: `ANTHROPIC_API_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` (+ `GITHUB_TOKEN` tự cấp; Reddit tùy chọn).
  **Pipeline exit 1 nếu tóm tắt hỏng TOÀN BỘ** (báo ĐỎ thay vì success giả); `summarizer.js`
  tự chuẩn hoá `ANTHROPIC_API_KEY`. (Sự cố key hỏng đã xử lý 24/07 — xem memory.)

**Toạ độ dự án:**
- Web: **https://sainews.vercel.app** (Vercel, Root Directory = `web/`, env `SUPABASE_URL` + `SUPABASE_ANON_KEY`)
- GitHub: **https://github.com/ndat7783svg/ai-news-aggregator** (public)
- Supabase project ref: **huqbirxwvrprqkhrwnsl** (`https://huqbirxwvrprqkhrwnsl.supabase.co`)

## 3. CHƯA làm / dang dở (đừng tưởng đã có)
- **Reddit: CHƯA bật.** Code `collectors/reddit.js` sẵn sàng, tự bỏ qua nếu thiếu
  `REDDIT_CLIENT_ID`/`REDDIT_CLIENT_SECRET`. Vướng: **ISP người dùng chặn `reddit.com`** nên chưa
  vào được `reddit.com/prefs/apps` tạo app "script". Pipeline chạy trên cloud GitHub → vẫn hoạt
  động nếu có credential; cần user vào trang đó **1 lần qua 4G/VPN** để lấy client_id/secret rồi
  thêm vào **GitHub secrets** (không cần Vercel). Grant `client_credentials` (app-only, read-only).
- **Tên miền .com: CHƯA mua.** Đang dùng subdomain miễn phí `sainews.vercel.app`.
- Blog **Anthropic & Meta AI**: bỏ qua vì không có RSS chính thức (không scraping).
- **Login/thanh toán/tài khoản, PWA/app điện thoại: CHƯA làm** (ngoài phạm vi bản đầu).

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
- **Vercel đổi tên domain không giới hạn số lần** (Settings → Domains). Hiện là `sainews`.
- **Khung trình duyệt tự động của Claude không "vẽ khung hình"** → click mô phỏng &
  IntersectionObserver không kích hoạt trong đó. Kiểm tra tính năng tương tác (nút, lọc, cuộn)
  bằng `dispatchEvent` hoặc trên **web thật**, đừng kết luận "lỗi" từ công cụ.
- Chạy web cục bộ: `cd web && npm run dev` (cần `web/.env.local` với `SUPABASE_URL` +
  `SUPABASE_ANON_KEY`). Pipeline cục bộ: `npm run pipeline` (cần `.env` ở gốc).

## 6. Chi phí thực tế
- **Anthropic tới giờ: ước tính < $1** (đã tóm tắt ~170+ tin + backfill tiêu đề + test). Thêm 10
  blog + 5 repo (24/07) → 1 lần backfill ~150 tin mới ≈ **$0.25 một lần**. **Số thật xem ở
  console.anthropic.com → Usage/Billing** (mình không đọc được console của bạn).
- **Vận hành hàng tháng: ước ~$1–3/tháng, thường chỉ vài chục cent** (chỉ tóm tắt tin MỚI; nhiều
  nguồn hơn → nhiều tin mới/ngày hơn nhưng vẫn nhỏ, ~0,15 cent/tin). Supabase/Vercel/GitHub Actions
  + cron-job.org đều **miễn phí** ở quy mô này.

## 7. Bước tiếp theo nên đề xuất (nếu hỏi "giờ làm gì tiếp")
1. **Thêm Reddit** khi user vào được `reddit.com/prefs/apps` (qua 4G/VPN vì ISP chặn): tạo app
   script → điền `REDDIT_CLIENT_ID`/`SECRET` vào **GitHub secrets**. Nút lọc Reddit tự hiện khi có tin.
2. Mua **tên miền .com** riêng (gắn vào Vercel) nếu muốn thương hiệu.
3. Về sau: PWA/app điện thoại, thêm nguồn nữa, trau chuốt giao diện, có thể thêm lọc từ khoá AI cho
   các nguồn báo phổ thông (TechCrunch/Verge... hiện lấy toàn bộ mục AI, chưa lọc thêm).

**Đã xong (đừng đề xuất lại):** cron-job.org (nhịp tự động), dịch tiêu đề `title_vi` + backfill,
nút sắp xếp Mới nhất/Nổi bật, lọc thời gian, dark mode, Vercel Analytics, mở rộng nguồn (13 blog/8 repo).
