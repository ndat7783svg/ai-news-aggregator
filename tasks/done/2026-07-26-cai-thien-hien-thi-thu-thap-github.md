# Cải thiện hiển thị thẻ GitHub + thêm luồng Trending thật (daily/weekly)

## Mục tiêu
Thẻ GitHub trên feed hiển thị đẹp/rõ hơn (icon sao, rút gọn số, hiện ngôn ngữ lập trình), và
thêm 1 luồng thu thập mới lấy đúng danh sách "Trending" thật của GitHub (github.com/trending,
theo ngày + theo tuần) để mỗi ngày đều có tin GitHub mới, thay vì chỉ dựa vào Search API vốn
rất ổn định và ít thay đổi.

## Bối cảnh
Nguồn: `plans/done/2026-07-26-cai-thien-hien-thi-github-repo-antigravity.md` (plan gốc từ
Antigravity). Đã bàn với user, các quyết định CHỐT khác với plan gốc — làm đúng theo đây,
KHÔNG làm lại phần A gốc/B gốc/C2 gốc nếu khác mô tả dưới:

- Phần **A** (icon ★ + rút gọn số sao) và **B** (hiện ngôn ngữ lập trình): giữ như plan gốc,
  làm luôn.
- Phần **C1 gốc** (repo mới tạo ≤30 ngày + ngưỡng sao tuyệt đối) — **KHÔNG làm theo cách này**.
  User muốn đúng kiểu "nổi theo ngày/tuần" như trang github.com/trending thật, không phải lọc
  theo ngưỡng sao tuyệt đối (lý do: ngưỡng tuyệt đối cho repo mới tạo dễ ra 0 kết quả nhiều
  ngày). Thay bằng mục **C1-mới** dưới đây.
- Phần **C2 gốc** (hạ `GITHUB_TRENDING_MIN_STARS` 500→200) — **KHÔNG làm**. User quyết định
  giữ nguyên 500 cho nguồn `github_trending` hiện tại (đã hoạt động ổn, không đổi).
- Phần **C3** (update lại số sao repo cũ) — **không làm** (đã gác lại theo plan gốc, vẫn giữ).

Dự án là **web tin tức AI**, không phải tin GitHub nói chung — trang github.com/trending thật
không có bộ lọc theo topic AI, nên phải tự lọc lại (xem C1-mới bước 3) để tránh lẫn repo không
liên quan AI (game, framework web, v.v.) vào feed.

## Việc cần làm

### A. Icon ★ + rút gọn số sao trên thẻ GitHub
- [ ] `web/components/NewsCard.js`: thêm hàm `formatStars(n)` rút gọn số (158000 → "158K",
  1200 → "1.2K", 800 → "800", dưới 1000 giữ nguyên).
- [ ] Khi `item.source` bắt đầu bằng `"github_"` (áp dụng cho mọi nguồn GitHub, gồm cả 2 nguồn
  mới ở mục C1-mới): đổi icon hiển thị số từ `▲` sang `★`, dùng `formatStars(item.score)`.
  Nguồn khác (hackernews, reddit...) giữ nguyên `▲` + số đầy đủ như hiện tại.

### B. Hiện ngôn ngữ lập trình trên thẻ GitHub
- [ ] `web/lib/supabaseServer.js`: thêm cột `extra` vào hằng `COLUMNS` (hiện đang thiếu, nên
  frontend chưa có dữ liệu `extra` dù DB đã lưu).
- [ ] `web/components/NewsCard.js`: nếu `item.source` bắt đầu bằng `"github_"` và
  `item.extra?.language` có giá trị, hiện 1 dòng nhỏ: chấm tròn màu + tên ngôn ngữ (kiểu badge
  ngôn ngữ trên github.com). Có thể dùng 1 map màu cơ bản cho vài ngôn ngữ phổ biến
  (Python, JavaScript, TypeScript, Rust, Go, C++...), còn lại dùng màu xám mặc định — không cần
  khớp 100% màu thật của GitHub.
- [ ] `web/app/globals.css`: thêm style cho badge ngôn ngữ mới (chấm tròn + text, cỡ chữ nhỏ,
  không phá layout thẻ hiện có).

### C1-mới. Luồng "🔥 Trending" thật từ github.com/trending (daily + weekly)
- [ ] Thêm dependency `cheerio` vào `package.json` (dùng để parse HTML trang trending).
- [ ] `collectors/github.js`: thêm hàm mới `collectGithubTrendingScrape(period)` với
  `period` là `"daily"` hoặc `"weekly"`:
  1. Gọi `https://github.com/trending?since=<period>` (HTTP GET thường, không cần token —
     đây là trang web công khai, không phải API). Đặt `User-Agent` hợp lý (giống các collector
     khác) để tránh bị chặn.
  2. Dùng `cheerio` lấy danh sách repo hiển thị trên trang (tên đầy đủ `owner/repo`), giữ đúng
     **thứ tự xếp hạng** trang trả về (đó là rank quan trọng, không tự sort lại theo sao).
  3. **Lọc AI:** với mỗi repo lấy được, gọi tiếp `GET /repos/{owner}/{repo}` (REST API chính
     thức, dùng `ghHeaders()` có sẵn) để lấy `topics`, `description`, `language`,
     `stargazers_count`. Chỉ giữ lại repo nếu **topics giao với `GITHUB_TRENDING_TOPICS`**
     (đã có trong `lib/config.js`) **hoặc** `description` khớp 1 từ trong `AI_KEYWORDS` (cũng
     đã có trong `lib/config.js`, không phân biệt hoa/thường). Repo không khớp thì loại bỏ
     (không phải AI, không đưa vào feed AI News).
  4. Trả về item dạng giống `collectGithubTrending()` hiện có, nhưng:
     - `source`: `"github_trending_daily"` hoặc `"github_trending_weekly"` (theo `period`)
     - `sourceId`: dùng `String(repo.id)` (id số thật từ REST API, không dùng tên vì tên có
       thể đổi)
     - `score`: `repo.stargazers_count`
     - `extra`: `{ language: repo.language, stars: repo.stargazers_count, abstract:
       repo.description || "", rank: <thứ tự trong danh sách trending> }`
     - `publishedAt`: dùng thời điểm thu thập hiện tại (`new Date().toISOString()`) — trang
       trending không cho biết ngày cụ thể, nên coi như "mới" tại thời điểm bắt được.
  5. Giới hạn số repo lấy về mỗi loại (ví dụ tối đa 25, đúng bằng số repo trang trending hiển
     thị 1 trang — không cần phân trang).
- [ ] `collect.js` và `pipeline.js`: gọi thêm `collectGithubTrendingScrape("daily")` và
  `collectGithubTrendingScrape("weekly")` trong luồng thu thập (giống cách gọi
  `collectGithubTrending()` hiện có).
- [ ] `web/lib/filters.js`: thêm 1 filter mới, ví dụ:
  ```js
  { key: "github_hot", label: "🔥 Trending", sources: ["github_trending_daily", "github_trending_weekly"] },
  ```
- [ ] `web/lib/format.js`: thêm vào `SOURCE_META`:
  ```js
  github_trending_daily: { label: "🔥 Trending (ngày)", color: "#f97316" },
  github_trending_weekly: { label: "🔥 Trending (tuần)", color: "#ea580c" },
  ```
  (màu chỉ là gợi ý, có thể chỉnh cho hợp giao diện hiện tại, miễn khác màu `github_trending`
  hiện có để phân biệt trên feed.)

## Tiêu chí hoàn thành / cách verify
- `npm run pipeline` (cần `.env` ở gốc có đủ key) chạy xong không lỗi, log có nhắc tới
  "GitHub Trending Daily"/"GitHub Trending Weekly" (hoặc tên tương tự) thu được ít nhất vài
  repo (trừ khi trùng lặp bị dedupe hết ở lần chạy sau).
- Query thử Supabase (hoặc xem trên web sau khi deploy) thấy có tin `source =
  'github_trending_daily'` và `'github_trending_weekly'`, có `extra.language` khác null.
- Trên web (`cd web && npm run dev`): thẻ nguồn `github_*` hiện icon `★` + số dạng rút gọn
  (VD "24K" không phải "24000"), hiện badge ngôn ngữ lập trình nếu có dữ liệu. Bộ lọc nguồn có
  thêm nút "🔥 Trending", bấm vào chỉ hiện tin 2 nguồn mới.
- Không có repo rõ ràng không liên quan AI (VD 1 game engine, 1 framework CSS...) lọt vào 2
  nguồn mới — nếu thấy lọt, nghĩa là bước lọc AI (C1-mới bước 3) chưa đúng, cần xem lại.

## KHÔNG được làm
- Không đổi `GITHUB_TRENDING_MIN_STARS` (giữ 500) và không thêm ngưỡng sao tuyệt đối nào cho
  2 nguồn trending mới — luồng mới dựa vào rank của trang trending + lọc theo topic AI, không
  lọc theo số sao.
- Không xoá hoặc đổi hành vi nguồn `github_trending`/`github_release` hiện có.
- Không thêm bảng DB mới hay logic UPDATE số sao cho tin cũ (phần C3, đã gác lại).
- Không tự ý đổi cấu trúc HTML parse sang gọi thêm API trả phí nào khác ngoài GitHub REST API
  (miễn phí, đã dùng sẵn `ghHeaders()`).
- Không push thẳng lên `main` nếu chưa qua review — tạo commit rõ ràng để Claude Code kiểm tra
  bằng `git diff` trước khi coi là xong.
