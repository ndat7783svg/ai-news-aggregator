# Cải thiện hiển thị & thu thập GitHub Repo trên SAI News

**Từ:** Antigravity
**Ngày:** 2026-07-26

## Bối cảnh / Mục tiêu

Tin GitHub trên SAI News quá ít sau ngày đầu tiên — nguyên nhân gốc: top 60 repo ≥500 sao rất
ổn định, dedupe khiến không lặp lại; thiếu luồng bắt repo "mới nổi nhanh" (kiểu
LoopEngineering, spec-kit — sao ít nhưng tăng rất nhanh). Thẻ hiển thị GitHub cũng chưa tận
dụng hết dữ liệu đã thu (ngôn ngữ lập trình, số sao dạng dễ đọc). Mục tiêu: hiển thị đẹp hơn
+ thu thập đa dạng hơn để mỗi ngày có thêm tin GitHub mới.

## Plan chi tiết

### A. Hiển thị ★ sao + rút gọn số trên thẻ GitHub

- **Vấn đề:** Thẻ `github_trending` hiện số sao dạng `▲ 158000` — trông giống điểm upvote HN,
  dễ nhầm; số quá dài khó đọc.
- **Sửa:** Trong `web/components/NewsCard.js`, khi source bắt đầu bằng `github_`:
  - Đổi icon `▲` → `★`
  - Rút gọn số: 158000 → "158K", 1200 → "1.2K", 800 → "800"
- **File đổi:** `web/components/NewsCard.js` (thêm hàm `formatStars`, sửa JSX hiện score)

### B. Hiện ngôn ngữ lập trình trên thẻ GitHub Trending

- **Vấn đề:** Dữ liệu `extra.language` (Python, TypeScript, Rust...) đã thu sẵn trong DB nhưng
  không hiển thị.
- **Sửa:** Thêm 1 dòng metadata trên thẻ GitHub: chấm tròn màu + tên ngôn ngữ (giống badge
  ngôn ngữ trên github.com).
- **File đổi:** `web/components/NewsCard.js` (đọc `extra` từ item, hiện badge ngôn ngữ),
  `web/app/globals.css` (style cho badge ngôn ngữ).
- **Lưu ý:** Cần thêm cột `extra` vào `COLUMNS` trong `web/lib/supabaseServer.js` (hiện chưa
  select cột này → frontend không có dữ liệu `extra`).

### C1. Thêm luồng "Rising" — repo mới tạo ≤30 ngày, tăng sao nhanh

- **Vấn đề:** Sau ngày đầu, collector trending hầu như không tìm được repo mới vì top 60 repo
  ≥500 sao quá ổn định. Thiếu cơ chế bắt repo mới nổi (tạo gần đây, sao ít nhưng tăng nhanh).
- **Sửa:** Thêm hàm `collectGithubRising()` trong `collectors/github.js`:
  - Query GitHub Search API: `created:>YYYY-MM-DD` (30 ngày trước) + `stars:>50` + topic AI
  - Source mới: `github_rising` (tách hẳn khỏi `github_trending`)
  - Lấy tối đa 30 repo/lần, sắp theo sao giảm dần
- **File đổi:**
  - `lib/config.js` — thêm `GITHUB_RISING_*` (ngưỡng sao, ngày tạo, max)
  - `collectors/github.js` — thêm hàm `collectGithubRising()`
  - `collect.js` — gọi `collectGithubRising()` trong luồng thu thập
  - `pipeline.js` — gọi `collectGithubRising()` trong pipeline chính
  - `web/lib/filters.js` — thêm filter `github_rising`
  - `web/lib/format.js` — thêm `github_rising` vào `SOURCE_META` (badge "🔥 Rising", màu cam)
- **Ngưỡng sao:** Đề xuất ≥50 (bắt repo thật mới), có thể nâng 100 nếu nhiễu — **cần user
  quyết định**.

### C2. Hạ ngưỡng + thêm topics cho trending hiện tại

- Hạ `GITHUB_TRENDING_MIN_STARS` từ 500 → **200** để bắt thêm repo tầm trung
- Giảm `GITHUB_TRENDING_PUSHED_DAYS` từ 180 → **90** ngày (ưu tiên repo "nóng")
- Thêm topics (nếu cần): `"ai-tools"`, `"nlp"`, `"text-to-image"`, `"autonomous-agents"`
- **File đổi:** `lib/config.js`

### C3. (Tuỳ chọn, làm sau) Cập nhật số sao cho repo cũ

- Thêm cơ chế cập nhật `extra.stars` + `score` cho repo GitHub đã có trong DB (quét lại 1
  lần/ngày)
- **Không tạo tin mới** (dedupe vẫn giữ), chỉ UPDATE số sao → hiển thị chính xác hơn
- Phức tạp hơn vì cần thêm logic UPDATE trong pipeline (hiện chỉ INSERT)
- **Đề xuất gác lại**, làm sau khi A+B+C1+C2 ổn

### Thứ tự thực hiện đề xuất

| # | Việc | Độ khó | Tác động |
|---|------|--------|----------|
| 1 | A. ★ sao + rút gọn số | Nhỏ | Nhận biết ngay |
| 2 | B. Hiện ngôn ngữ lập trình | Nhỏ | Developer thích |
| 3 | C1. Luồng "Rising" | Vừa | **Nhiều tin mới mỗi ngày** |
| 4 | C2. Hạ ngưỡng + thêm topics | Nhỏ | Đa dạng hơn |
| 5 | C3. Cập nhật sao repo cũ | Vừa-Lớn | Chính xác hơn (làm sau) |

### Chi phí ước tính

- Tóm tắt lô repo rising lần đầu: ~$0.05-0.10 (một lần)
- Hàng ngày sau đó: thêm vài repo mới/ngày × 0.15 cent = không đáng kể
- Không ảnh hưởng chi phí vận hành vì dedupe vẫn hoạt động bình thường

### Câu hỏi cần user quyết định

1. Làm tất cả A+B+C1+C2 luôn, hay chọn một vài cái trước?
2. Ngưỡng sao cho "Rising": 50 (bắt repo thật mới, có thể nhiễu) hay 100 (ít nhiễu hơn)?
3. Badge "Rising" hiển thị thế nào: "🔥 Rising" hay "GitHub Rising"?

---
⚠️ **Plan này cần mang qua Claude Code bàn luận trước. KHÔNG tự ý bắt đầu code.**
Soạn xong, báo lại cho user: "Plan đã lưu ở `plans/incoming/2026-07-26-cai-thien-hien-thi-github-repo-antigravity.md` — nhờ Claude Code xem trước khi mình bắt đầu." Chờ user xác nhận đã bàn xong với Claude rồi mới thực hiện.
