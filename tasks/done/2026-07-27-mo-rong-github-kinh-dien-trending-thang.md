# Mở rộng nguồn GitHub: "Kinh điển" + "Trending tháng" + tách khỏi "Tất cả"

## Mục tiêu
Thêm 2 nguồn GitHub mới ("Kinh điển" — repo AI nổi lâu, ≥5.000 sao; "Trending tháng" — chạy
đều như ngày/tuần) để developer khám phá repo tốt hơn, đồng thời **tách toàn bộ 6 nguồn
GitHub khỏi feed "Tất cả"** để tin GitHub không lấp tin thời sự khác trong ngày.

## Bối cảnh
Đọc kỹ **`docs/superpowers/specs/2026-07-27-github-expansion-classics-monthly-design.md`**
trước khi làm — file đó có toàn bộ chi tiết kỹ thuật (đã bàn + duyệt với user), task này chỉ
tóm tắt lại thành checklist. Xem thêm CLAUDE.md mục 4 (quyết định "1-feed", KHÔNG tách trang
riêng — task này KHÔNG vi phạm quyết định đó, chỉ đổi ý nghĩa filter `"all"`).

Quyết định đã chốt, đừng đề xuất lại:
- Tách HẾT 6 nguồn GitHub (4 cũ + 2 mới) khỏi `filter="all"`, không chỉ 2 nguồn mới.
- "Kinh điển" backfill **1 lần** (script riêng), KHÔNG đưa vào pipeline chạy đều.
- "Trending tháng" chạy đều trong pipeline, y hệt cơ chế ngày/tuần đã có.
- Trong phạm vi lọc GitHub, "Nổi bật nhất" sắp theo số sao. Feed "Tất cả" không đổi (không còn
  liên quan vì đã loại GitHub).
- Dedupe repo trùng chỉ áp dụng khi xem "Tất cả GitHub", chỉ trong nhóm 5 nguồn trending-family
  (không gồm `github_release`).

## Việc cần làm

### 1. `lib/config.js`
- [ ] Thêm `GITHUB_CLASSICS_MIN_STARS = 5000`, `GITHUB_CLASSICS_PER_TOPIC = 25`,
      `GITHUB_CLASSICS_MAX = 150`.

### 2. `collectors/github.js`
- [ ] Sửa `collectGithubTrendingScrape(period)`: cho phép thêm giá trị `"monthly"` (bên cạnh
      `"daily"`/`"weekly"` đang có).
- [ ] Thêm hàm mới `collectGithubClassics()`: phỏng theo `collectGithubTrending()` nhưng KHÔNG
      lọc theo `pushed:>`, dùng `stars:>GITHUB_CLASSICS_MIN_STARS`, `per_page`
      `GITHUB_CLASSICS_PER_TOPIC`, lặp qua `GITHUB_TRENDING_TOPICS` có sẵn, gộp trùng theo id,
      cắt tổng theo `GITHUB_CLASSICS_MAX`. `source: "github_classics"`,
      `publishedAt: repo.pushed_at || repo.created_at` (ngày THẬT, không dùng `new Date()`).

### 3. `pipeline.js` (và `collect.js` cho đồng bộ bản xem trước)
- [ ] Thêm `["GitHub Trending Monthly", () => collectGithubTrendingScrape("monthly")]` vào
      mảng `COLLECTORS`, ngay sau dòng "GitHub Trending Weekly".
- [ ] KHÔNG thêm `collectGithubClassics` vào `COLLECTORS` — nguồn đó chỉ chạy qua script
      backfill riêng ở mục 4.

### 4. Script mới `backfill-github-classics.js` (gốc dự án)
- [ ] Phỏng theo cấu trúc bước 2-4 của `pipeline.js` (thu thập → lọc tin đã có bằng
      `fetchExistingKeys`/`itemKey` → tóm tắt bằng `summarizeMany` → ghi bằng `insertItems`),
      KHÔNG phỏng theo `backfill-titles.js` (vì đây là tin mới cần tóm tắt đầy đủ, không phải
      chỉ dịch tiêu đề).
- [ ] Có cờ `--count` (chỉ đếm số repo dự kiến lấy được, không tóm tắt/ghi) để xem trước.
- [ ] Sau khi chạy xong in tổng token + chi phí ước tính (theo mẫu `backfill-titles.js`:
      `PRICE_IN=1.0`, `PRICE_OUT=5.0` USD/1 triệu token).
- [ ] Cách chạy: `node --env-file=.env backfill-github-classics.js`.

### 5. `web/lib/filters.js`
- [ ] Thêm 2 entry con vào `SOURCE_FILTERS`:
      `{ key: "github_trending_monthly", label: "🔥 Trending (tháng)", labelKey: "githubSubMonthly", sources: ["github_trending_monthly"], parent: "github" }`
      `{ key: "github_classics", label: "Kinh điển", labelKey: "githubSubClassics", sources: ["github_classics"], parent: "github" }`
- [ ] Cập nhật `sources` của entry `key: "github"` (nút cha) thành đủ 6 nguồn.
- [ ] Export thêm `GITHUB_ALL_SOURCES` (6 nguồn) và `GITHUB_TRENDING_FAMILY` (5 nguồn, không
      gồm `github_release`) — dùng ở `web/lib/supabaseServer.js`.

### 6. `web/lib/i18n.js`
- [ ] Thêm nhãn `githubSubMonthly` ("🔥 Trending (tháng)" / "🔥 Trending (monthly)") và
      `githubSubClassics` ("Kinh điển" / "Classics") cho cả VI và EN — **đây là lỗi Antigravity
      từng bỏ sót ở task gộp nút GitHub trước (27/07), Claude phải sửa lại. Lần này làm đúng
      ngay từ đầu, nhớ kiểm tra cả 2 ngôn ngữ trước khi báo xong.**

### 7. `web/lib/supabaseServer.js` — 3 thay đổi logic (chi tiết đầy đủ trong spec mục 7)
- [ ] Khi `filter === "all"`: loại trừ `GITHUB_ALL_SOURCES` khỏi kết quả (cả 2 nhánh sort
      `"new"` và `"hot"`) bằng `.not("source", "in", ...)`.
- [ ] Thêm `isPureGithubSources(sources)`: true nếu mọi nguồn đang lọc đều thuộc
      `GITHUB_ALL_SOURCES`. Khi `sort === "hot"` và `isPureGithubSources(sources)` → dùng hàm
      sort mới `sortByStars` (theo `score` giảm dần) THAY cho `sortHot` hiện tại.
- [ ] Khi `filter === "github"` (nút cha, gộp 6 nguồn): dùng cửa sổ ứng viên
      (`GITHUB_WINDOW = 2000`, giống cách `HOT_WINDOW` đang làm cho hot-sort) cho CẢ 2 chế độ
      sort, dedupe theo `title` (owner/repo) trong nhóm `GITHUB_TRENDING_FAMILY` (giữ bản
      `published_at` mới nhất, tie-break `score` cao hơn), `github_release` không tham gia
      dedupe. Sau dedupe mới áp sort + cắt trang.
      Khi lọc 1 nhóm con cụ thể (không phải nút cha "github") → giữ nguyên đường DB-query nhanh
      như cũ, không cần cửa sổ/dedupe (chỉ 1 nguồn, không có gì trùng).

### 8. Cập nhật tài liệu
- [ ] `CLAUDE.md` VÀ `AGENTS.md` (CẢ HAI FILE, không chỉ 1 — AGENTS.md là bản sao gần như y hệt
      CLAUDE.md, lần trước Antigravity chỉ sửa 1 file khiến Claude phải làm lại): mục 2 (thêm
      mô tả 2 nguồn mới + việc tách khỏi "Tất cả"), mục 7 (đánh dấu việc này đã xong nếu có ghi
      trong "sắp làm").
- [ ] `PROJECT_MAP.md`: thêm dòng cho `backfill-github-classics.js`, cập nhật mô tả
      `collectors/github.js` và `web/lib/filters.js`/`supabaseServer.js` nếu mô tả cũ không còn
      khớp.

## Tiêu chí hoàn thành / cách verify
- `npm run build` (trong `web/`) sạch, không lỗi.
- Trang chủ mặc định (`filter=all`) — chạy `npm run dev`, mở `localhost:3000`: **không còn thẻ
  nào có badge nguồn GitHub**.
- Bấm nút "GitHub" → ô chọn phụ hiện đủ 6 mục, có "🔥 Trending (tháng)" và "Kinh điển", nhãn
  đổi đúng khi chuyển VI/EN (kiểm tra bằng mắt cả 2 ngôn ngữ, không chỉ đọc code).
- Chọn "Tất cả GitHub" + bấm "Nổi bật nhất" → thứ tự giảm dần theo số sao (không phải theo thời
  gian), không có repo cùng tên xuất hiện 2 thẻ trở lên.
- Chọn riêng nhóm con "Kinh điển" → chỉ hiện repo nguồn `github_classics`.
- Chạy `node --env-file=.env backfill-github-classics.js --count` (cần `.env` có đủ
  `ANTHROPIC_API_KEY`/`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`) → xem số repo dự kiến trước
  khi chạy thật lệnh không có `--count`.

## KHÔNG được làm
- Không tạo route/trang riêng cho GitHub (vẫn 1 trang, chỉ đổi ý nghĩa filter).
- Không tự ý chạy `backfill-github-classics.js` (không có `--count`) để ghi thật vào DB — làm
  xong code, verify bằng `--count`, còn lại để user (qua Claude Code) xác nhận rồi mới chạy thật
  (tốn tiền Anthropic thật, dù nhỏ ~$0.15-0.25).
- Không đổi ngưỡng/topic của nguồn `github_trending` ("Trending nhiều sao") hiện có.
- Không đụng vào logic `SCORED_SOURCES` (HN/Reddit) trong `sortHot` gốc — chỉ thêm nhánh mới
  `sortByStars` riêng cho GitHub, không sửa hành vi cũ.
- Không push thẳng lên `main` nếu chưa qua review.

## Nguồn
`docs/superpowers/specs/2026-07-27-github-expansion-classics-monthly-design.md`
