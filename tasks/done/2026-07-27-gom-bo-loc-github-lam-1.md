# Gom 3 nút lọc GitHub thành 1 nút + ô chọn phụ

## Mục tiêu
Hàng nút lọc nguồn hiện có 3 nút rời cho GitHub (`GitHub Release`, `GitHub Trending`,
`🔥 Trending`) — gây rối vì cả 3 đều là "GitHub", chỉ khác tiêu chí. Gom lại còn **1 nút
"GitHub"** trên hàng chính; khi nút này đang chọn, hiện thêm 1 ô `<select>` nhỏ để chọn cụ thể
loại nào (Release / Trending nhiều sao / Trending ngày / Trending tuần).

## Bối cảnh
Đã có luồng GitHub Trending daily/weekly (xem CLAUDE.md mục "Luồng 🔥 Trending GitHub (26/07)").
Giờ có 4 nguồn GitHub riêng (`github_release`, `github_trending`, `github_trending_daily`,
`github_trending_weekly`), mỗi nguồn đang là 1 nút lọc riêng trên hàng chính — quá nhiều, cần
gom lại. Đã bàn với user và chốt cách làm: **tái dùng đúng pattern `<select>` đang có sẵn cho
bộ lọc "Thời gian"** (`web/components/Feed.js`), KHÔNG dựng component dropdown/submenu mới từ
đầu — giữ đơn giản, ít code mới.

## Việc cần làm

- [ ] `web/lib/filters.js`: sửa `SOURCE_FILTERS`:
  - Đổi entry `github_release`/`github_trending`/`github_hot` (3 dòng hiện có) thành:
    - 1 entry cha: `{ key: "github", label: "GitHub", sources: ["github_release",
      "github_trending", "github_trending_daily", "github_trending_weekly"] }`
    - 4 entry con, thêm field `parent: "github"` để đánh dấu KHÔNG hiện trên hàng nút chính:
      ```js
      { key: "github_release", label: "Release", sources: ["github_release"], parent: "github" },
      { key: "github_trending", label: "Trending (nhiều sao)", sources: ["github_trending"], parent: "github" },
      { key: "github_trending_daily", label: "🔥 Trending (ngày)", sources: ["github_trending_daily"], parent: "github" },
      { key: "github_trending_weekly", label: "🔥 Trending (tuần)", sources: ["github_trending_weekly"], parent: "github" },
      ```
  - `sourcesForFilter(key)` giữ nguyên logic (tìm theo `key` trong `SOURCE_FILTERS`, không quan
    tâm có `parent` hay không) — không cần sửa hàm này.

- [ ] `web/lib/i18n.js`: thêm 1 chuỗi mới cho lựa chọn "tất cả GitHub" trong ô select phụ:
  - VI: `githubSubAll: "Tất cả GitHub"`
  - EN: `githubSubAll: "All GitHub"`

- [ ] `web/components/Feed.js`:
  - Hàng nút lọc chính (`availableFilters`, dòng ~174): chỉ lấy các entry **KHÔNG có** field
    `parent` (thêm điều kiện `!f.parent` vào filter hiện có), để 4 nút con GitHub không hiện
    trên hàng chính, chỉ còn 1 nút "GitHub" gộp.
  - Thêm biến `githubSubFilters` = các entry có `parent === "github"` VÀ có nguồn thực tế
    trong `availableSources` (dùng đúng logic đã có: `f.sources.some((s) =>
    availableSources.includes(s))`).
  - Khi `filter === "github"` HOẶC filter đang chọn là 1 trong 4 key con GitHub (tức
    `SOURCE_FILTERS.find((x) => x.key === filter)?.parent === "github"`): hiện thêm 1
    `<select>` mới, **đặt ngay cạnh/dưới nút "GitHub"** trong `.source-filter` (style/cấu trúc
    JSX mô phỏng đúng `<select className="time-select">` đã có ở control-row phía dưới, dùng
    class riêng ví dụ `github-sub-select` để không lẫn CSS với `time-select`):
    - Option đầu: `value="github"`, label = `t(lang, "githubSubAll")`
    - Các option sau: từng entry trong `githubSubFilters`, `value={f.key}`,
      label = `filterLabel(f)` (hàm `filterLabel` đã có sẵn trong file)
    - `onChange`: gọi thẳng `setFilter(e.target.value)` — không cần state mới, tái dùng
      `filter` đang có.
    - Giá trị `<select>` hiện tại (`value=`) = `filter` (nếu `filter` không phải "github" và
      không phải 1 trong 4 key con, mặc định về `"github"`).
  - Khi bấm nút "GitHub" trên hàng chính: `setFilter("github")` như các nút khác (không cần
    logic đặc biệt, dùng đúng cơ chế nút đang có).

- [ ] `web/app/globals.css`: thêm style nhỏ cho `.github-sub-select` (có thể copy gần giống
  `.time-select` đã có, chỉnh kích thước/margin cho hợp với việc nó nằm cạnh nút lọc thay vì
  trong control-row riêng).

## Tiêu chí hoàn thành / cách verify
- `cd web && npm run dev`: hàng nút lọc nguồn chỉ còn **1 nút "GitHub"** (không còn 3 nút rời).
- Bấm nút "GitHub" → feed hiện tin của cả 4 nguồn GitHub gộp lại, đồng thời xuất hiện 1 ô chọn
  phụ có 5 lựa chọn (Tất cả GitHub / Release / Trending nhiều sao / Trending ngày / Trending
  tuần).
- Chọn 1 mục cụ thể trong ô phụ (VD "🔥 Trending (ngày)") → feed chỉ còn đúng tin nguồn đó, ô
  phụ vẫn hiện và giữ đúng lựa chọn đang chọn.
- Chuyển sang nút lọc khác (VD "Hacker News") → ô chọn phụ GitHub biến mất.
- Chuyển ngôn ngữ VI/EN → nhãn "Tất cả GitHub"/"All GitHub" đổi đúng theo `t(lang,
  "githubSubAll")`.
- Không có nguồn GitHub nào bị mất khỏi feed tổng ("Tất cả" ở đầu hàng nút vẫn hiện đủ mọi tin
  như trước, không đổi hành vi).

## KHÔNG được làm
- Không đổi bất kỳ collector/pipeline nào (`collectors/github.js`, `pipeline.js`...) — task
  này CHỈ đổi UI lọc, không đổi cách thu thập/lưu dữ liệu.
- Không đổi `web/lib/supabaseServer.js` hay API `/api/items` — `sourcesForFilter()` vẫn nhận
  đúng 1 key như cũ, không cần đổi backend.
- Không tự dựng component dropdown/menu mới (kiểu thư viện UI, custom popup...) — dùng đúng thẻ
  `<select>` HTML thuần như cách "Thời gian" đang làm.
- Không push thẳng lên `main` nếu chưa qua review — tạo commit rõ ràng để Claude Code kiểm tra
  bằng `git diff` trước khi coi là xong.
