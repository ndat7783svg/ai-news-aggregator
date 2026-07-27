# Mở rộng nguồn GitHub: "Kinh điển" + "Trending tháng" + tách khỏi "Tất cả"

**Ngày:** 2026-07-27
**Bàn cùng:** user + Claude Code (Opus 5), qua chat trực tiếp (không qua `plans/`).

## Bối cảnh / Vấn đề

Feed GitHub hiện có 4 nguồn: Release, "Trending nhiều sao" (Search API, ≥500 sao, còn push
trong 180 ngày, 7 topic), Trending ngày/tuần (scrape `github.com/trending`). Với user (không
phải dev) là đủ, nhưng developer muốn tìm repo AI thích hợp thì thấy thiếu:
1. Ít chiều rộng — chỉ vài chục repo mỗi lần xem.
2. Không có repo "kinh điển" đã nổi lâu — bị rớt vì ngưỡng "còn push trong 180 ngày" hoặc không
   khớp 7 topic đang lọc.
3. Không có góc nhìn "top tháng" (chỉ có ngày/tuần).

Vấn đề kỹ thuật phát hiện khi bàn: **"Nổi bật nhất" hiện KHÔNG dùng số sao cho GitHub** — chỉ
HN/Reddit được tính điểm (xem `web/lib/supabaseServer.js`, `SCORED_SOURCES`), mọi tin GitHub
luôn bị đẩy xuống cuối. Đây là lý do sắp xếp "không phát huy tác dụng" mà user cảm nhận được.

User cũng chỉ ra: nếu bơm thêm ~100-150 repo "Kinh điển" (backfill 1 lần) + Trending tháng vào
**"Tất cả"** (feed tổng hợp), tin thật trong ngày sẽ bị lấp/loãng. Quyết định: **tách hẳn GitHub
(cả 6 nguồn — 4 cũ + 2 mới) ra khỏi "Tất cả"**. GitHub đã có "Tất cả GitHub" riêng (nút lọc
GitHub hiện có) nên không mất khả năng xem, chỉ đổi chỗ hiển thị mặc định.

## Quyết định đã chốt (đừng bàn lại)

- Tách **HẾT** 6 nguồn GitHub khỏi filter `"all"` (không chỉ 2 nguồn mới) — trang chủ mặc định
  từ nay không còn lẫn repo, phải bấm nút "GitHub" để xem.
- **KHÔNG** làm trang/route riêng cho GitHub (giữ đúng quyết định cũ ở CLAUDE.md mục 4: mô hình
  1-feed) — đây chỉ là đổi ý nghĩa của filter `"all"`, GitHub vẫn nằm trên cùng 1 trang, truy
  cập qua nút lọc có sẵn.
- "Kinh điển" (`github_classics`): backfill **1 lần**, KHÔNG chạy lại theo cron. ≥5.000 sao,
  không giới hạn ngày push, dùng lại `GITHUB_TRENDING_TOPICS` hiện có, ~100-150 repo.
- "Trending tháng" (`github_trending_monthly`): chạy **đều** mỗi lần pipeline, y hệt cơ chế
  ngày/tuần đang có (dùng lại `collectGithubTrendingScrape`, chỉ thêm period `"monthly"`).
- Trong phạm vi lọc GitHub (nút "GitHub" hoặc bất kỳ nhóm con nào), "Nổi bật nhất" sắp theo
  **số sao giảm dần** thay vì bị đẩy xuống cuối. Feed `"all"` không còn tin GitHub nên không
  còn liên quan tới thay đổi này.
- Khi xem "Tất cả GitHub" (gộp 5 nguồn trending-family: `github_trending`,
  `github_trending_daily/weekly/monthly`, `github_classics`), cùng 1 repo trùng ở nhiều nguồn
  con → chỉ hiện **1 thẻ** (giữ bản có `published_at` mới nhất). `github_release` KHÔNG tham
  gia dedupe này (là tin "ra bản mới", không phải trùng lặp).

## Chi phí ước tính (đã duyệt với user)

- Backfill Kinh điển: ~100-150 repo × ~$0.0017-0.002/repo (Haiku, giống lần mở rộng Trending
  25/07) ≈ **$0.15 – $0.25, một lần duy nhất**.
- Trending tháng: batch đầu ~10-15 repo mới lọt bộ lọc AI ≈ **$0.02 – $0.03** một lần; sau đó
  gần như $0 (chỉ tốn khi có repo mới lọt top tháng, vài lần/tháng).
- Gọi GitHub REST/Search API: **$0** (có `GITHUB_TOKEN`, miễn phí).
- Không phát sinh chi phí vận hành hàng tháng đáng kể so với mức hiện tại (~$1-3/tháng).

## Thiết kế kỹ thuật

### 1. `lib/config.js` — thêm hằng số
```js
export const GITHUB_CLASSICS_MIN_STARS = 5000;
export const GITHUB_CLASSICS_PER_TOPIC = 25; // lấy mỗi topic rồi gộp trùng, cắt tổng
export const GITHUB_CLASSICS_MAX = 150;
```
Dùng lại `GITHUB_TRENDING_TOPICS` đã có, không cần danh sách topic riêng.

### 2. `collectors/github.js`
- `collectGithubTrendingScrape(period)`: hiện chỉ chấp nhận `"daily" | "weekly"` — sửa validate
  để chấp nhận thêm `"monthly"`. Không cần đổi logic khác (đã tổng quát theo `period`, source
  tự thành `github_trending_monthly`).
- Thêm hàm mới `collectGithubClassics()`:
  - Giống cấu trúc `collectGithubTrending()` nhưng KHÔNG có điều kiện `pushed:>...` trong query
    Search API, thay ngưỡng sao bằng `GITHUB_CLASSICS_MIN_STARS`, `per_page`
    `GITHUB_CLASSICS_PER_TOPIC`, cắt tổng theo `GITHUB_CLASSICS_MAX` sau khi gộp trùng theo id
    (giữ nguyên kiểu gộp/sort đã có).
  - `source: "github_classics"`, `sourceId: String(repo.id)`, `publishedAt: repo.pushed_at ||
    repo.created_at` (dùng ngày THẬT của repo, không dùng "now" — để "Mới nhất" trong phạm vi
    GitHub vẫn có ý nghĩa, và để dedupe Phần 5 so sánh đúng).

### 3. `pipeline.js` — nguồn chạy đều
Thêm vào mảng `COLLECTORS`:
```js
["GitHub Trending Monthly", () => collectGithubTrendingScrape("monthly")],
```
(Vị trí: ngay sau dòng "GitHub Trending Weekly".) **KHÔNG** thêm `collectGithubClassics` vào
đây — nguồn đó chạy qua script backfill riêng, không phải pipeline định kỳ.

Cũng cập nhật `collect.js` (bản xem trước console) thêm dòng tương tự cho nhất quán, dù không
bắt buộc.

### 4. Script mới `backfill-github-classics.js` (gốc dự án, ngang hàng `backfill-titles.js`)
Chạy 1 lần: `node --env-file=.env backfill-github-classics.js`. Cấu trúc phỏng theo
`pipeline.js` bước 2-4 (không phải `backfill-titles.js` — vì đây là tin MỚI cần tóm tắt đầy đủ,
không phải chỉ dịch tiêu đề):
1. Gọi `collectGithubClassics()`.
2. Lọc bỏ tin đã có trong DB bằng `fetchExistingKeys` + `itemKey` (tránh tóm tắt lại nếu chạy
   script 2 lần do lỗi giữa chừng).
3. Tóm tắt bằng `summarizeMany` (concurrency 3, giống pipeline).
4. Ghi bằng `insertItems`.
5. In tổng token + chi phí ước tính ra console (theo mẫu `backfill-titles.js`: `PRICE_IN=1.0`,
   `PRICE_OUT=5.0` USD/1M token), để user xem được số thật sau khi chạy.
Có cờ `--count` (chỉ đếm, không tóm tắt/ghi) như `backfill-titles.js`, để user xem trước số
lượng/chi phí ước tính rồi mới quyết định chạy thật.

### 5. `web/lib/filters.js` — thêm sub-filter + export danh sách nguồn GitHub
```js
{ key: "github_trending_monthly", label: "🔥 Trending (tháng)", labelKey: "githubSubMonthly", sources: ["github_trending_monthly"], parent: "github" },
{ key: "github_classics", label: "Kinh điển", labelKey: "githubSubClassics", sources: ["github_classics"], parent: "github" },
```
Thêm vào mảng `sources` của entry `key: "github"` (nút cha) cả 2 source mới, thành 6 phần tử.

Export thêm 2 hằng số dùng ở server:
```js
export const GITHUB_ALL_SOURCES = ["github_release", "github_trending", "github_trending_daily", "github_trending_weekly", "github_trending_monthly", "github_classics"];
export const GITHUB_TRENDING_FAMILY = ["github_trending", "github_trending_daily", "github_trending_weekly", "github_trending_monthly", "github_classics"]; // không gồm release
```

### 6. `web/lib/i18n.js` — thêm nhãn VI/EN
`githubSubMonthly`: "🔥 Trending (tháng)" / "🔥 Trending (monthly)"
`githubSubClassics`: "Kinh điển" / "Classics"

### 7. `web/lib/supabaseServer.js` — 3 thay đổi logic
a) **Loại GitHub khỏi `"all"`:** khi `filter === "all"` (tức `sources` rỗng/null từ
   `sourcesForFilter`), áp thêm điều kiện loại trừ `GITHUB_ALL_SOURCES` vào cả 2 nhánh query
   (`sort==="hot"` và `sort==="new"`) bằng PostgREST `.not("source", "in", "(...)")`
   (Supabase JS: `.not("source", "in", \`(${GITHUB_ALL_SOURCES.join(",")})\`)`).

b) **"Nổi bật nhất" theo sao trong phạm vi GitHub:** thêm hàm kiểm tra
   `isPureGithubSources(sources)` — `true` nếu `sources` không rỗng và MỌI phần tử đều thuộc
   `GITHUB_ALL_SOURCES`. Trong nhánh `sort==="hot"`, nếu `isPureGithubSources(sources)`, dùng
   1 hàm sort riêng `sortByStars` (sắp theo `score` giảm dần, tie-break `cmpNewest`) THAY vì
   `sortHot` hiện tại (vốn luôn đẩy GitHub xuống cuối). Nhánh `sort==="hot"` không phải GitHub
   (bao gồm cả `"all"` sau khi đã loại GitHub) giữ nguyên `sortHot` như cũ.

c) **Dedupe repo trùng khi xem "Tất cả GitHub":** khi `filter === "github"` (sources = 6 nguồn
   GitHub gộp) — bất kể `sort` là `"new"` hay `"hot"` — cần lấy 1 cửa sổ ứng viên rồi xử lý ở
   JS trước khi cắt trang (giống cách `sort==="hot"` đang làm với `HOT_WINDOW`), vì dedupe theo
   repo phải làm ở JS. Thêm hằng `GITHUB_WINDOW = 2000` (đủ dư cho vài trăm/nghìn tin GitHub).
   Logic dedupe: nhóm các item có `source` thuộc `GITHUB_TRENDING_FAMILY` theo `title` (chính
   là `owner/repo`, đã thống nhất định dạng ở `toTrendingItem`), MỖI nhóm chỉ giữ 1 item có
   `published_at` lớn nhất (tie-break: ưu tiên item có `score` cao hơn). Item thuộc
   `github_release` giữ nguyên tất cả, không tham gia gộp. Sau dedupe, áp đúng `sort` đã chọn
   (`sortByStars` nếu hot, `cmpNewest` nếu new) rồi cắt trang theo `offset/limit` như cách
   `HOT_WINDOW` đang cắt.
   Chỉ áp dụng nhánh đặc biệt này khi `filter === "github"` (nút cha). Khi lọc 1 nhóm con cụ
   thể (VD chỉ `"github_classics"`), dùng lại đường DB-query bình thường (không cần cửa sổ,
   không có gì để trùng vì chỉ 1 nguồn).

### 8. Kiểm tra/verify (Antigravity tự chạy trước khi báo xong)
- `npm run build` sạch.
- Trang chủ mặc định (`filter=all`): KHÔNG còn thẻ nào có badge nguồn GitHub.
- Bấm nút "GitHub" → ô chọn phụ có đủ 6 mục (thêm "🔥 Trending (tháng)", "Kinh điển"), nhãn đổi
  đúng theo VI/EN.
- Chọn "Tất cả GitHub" + "Nổi bật nhất" → thứ tự giảm dần theo số sao, không có repo trùng tên
  xuất hiện 2 thẻ.
- Chọn riêng "Kinh điển" → chỉ hiện repo nguồn `github_classics`.
- Chạy `node --env-file=.env backfill-github-classics.js --count` xem số lượng dự kiến trước
  khi chạy thật.

## Ngoài phạm vi (KHÔNG làm)
- Không tạo route/trang riêng cho GitHub.
- Không cập nhật lại số sao của repo cũ theo thời gian (việc khác, đã gác lại — xem CLAUDE.md
  mục 3).
- Không đổi ngưỡng/topic của "Trending nhiều sao" (`github_trending`) hiện có.
