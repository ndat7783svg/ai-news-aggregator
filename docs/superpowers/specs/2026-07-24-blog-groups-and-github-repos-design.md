# Thiết kế: Tách nhóm Blog + Mở rộng repo GitHub

Ngày: 2026-07-24
Trạng thái: Đã duyệt (chờ viết plan)

## Bối cảnh & vấn đề

Website SAI News (xem `CLAUDE.md`, `PROJECT_MAP.md`) đang chạy thật. Hai vấn đề trải nghiệm:

1. **Nút lọc "Blog" gộp quá nhiều** — 1 nút gộp 13 blog/báo, người đọc khó tìm đúng loại tin
   muốn đọc.
2. **GitHub quá ít tin, thiếu repo nổi lâu** — "trending" hiện chỉ bắt repo *tạo trong 30 ngày*,
   nên các repo AI nổi tiếng lâu năm (llama.cpp, ComfyUI, LangChain...) không bao giờ xuất hiện.
   Người dùng muốn thấy cả repo mới lẫn repo kinh điển đang được quan tâm.

Ràng buộc: giữ đơn giản/ổn định trước; báo trước mọi chi phí API; không phá vỡ quyết định đã chốt
trong `CLAUDE.md` trừ khi cần.

## Phần A — Tách nút "Blog" thành 3 nhóm chủ đề

### Chia nhóm
| Nút (key) | Nhãn VI / EN | Các source |
|-----------|--------------|------------|
| `blog_labs` | "Blog hãng AI" / "AI Labs" | openai, deepmind, huggingface, mistral, bair |
| `blog_press` | "Báo công nghệ" / "Tech Press" | techcrunch, theverge, arstechnica, venturebeat, technologyreview |
| `blog_news` | "Newsletter" / "Newsletters" | simonwillison, importai, thegradient |

### Thay đổi
- `web/lib/filters.js`: thay 1 mục `blog` trong `SOURCE_FILTERS` bằng 3 mục trên. Mỗi mục thêm
  trường tuỳ chọn `labelKey` (khoá i18n) thay cho `label` cố định.
- `web/lib/i18n.js`: thêm 3 khoá nhãn cho VI + EN (`blog_labs`, `blog_press`, `blog_news`).
- `web/components/Feed.js`: khi render nhãn nút lọc và nhãn ở dòng đếm (`activeFilterLabel`),
  ưu tiên `f.labelKey ? t(lang, f.labelKey) : f.label`. Các mục cũ (không có `labelKey`)
  giữ nguyên hành vi.

### Cơ chế sẵn có (không phải sửa)
- Nút tự ẩn nếu nhóm chưa có tin: `availableFilters` trong `Feed.js` đã lọc theo
  `f.sources.some(s => availableSources.includes(s))` — hoạt động đúng với nhóm nhiều source.
- Backend `fetchItems` + `/api/items` đã hỗ trợ 1 filter ánh xạ ra nhiều source
  (`sourcesForFilter`) — không cần sửa.

### Chi phí
0đ — thuần giao diện lọc phía web, không gọi API AI.

## Phần B — Mở rộng "Repo nổi bật" (gồm cả repo nổi lâu)

### Thay đổi logic thu thập (`collectors/github.js` + `lib/config.js`)
1. **Bỏ điều kiện `created:>{30 ngày}`** trong `collectGithubTrending`. Thay bằng truy vấn
   *repo AI nhiều sao còn hoạt động*: `topic:{topic} pushed:>{~180 ngày} stars:>500 sort:stars order:desc`.
   → cả repo mới hot lẫn repo lớn kinh điển (đang được bảo trì) đều lọt vào.
2. **Thêm chủ đề** trong `GITHUB_TRENDING_TOPICS`: hiện `["llm", "ai-agent", "generative-ai"]`
   → thêm `machine-learning`, `deep-learning`, `rag`, `computer-vision` (tổng ~7 chủ đề).
3. **Lấy nhiều hơn**: `per_page` 5 → 15 mỗi chủ đề; gộp trùng theo `repo.id`; giới hạn tổng
   ~60 (hằng số mới, ví dụ `GITHUB_TRENDING_MAX = 60`, thay cho `MAX_ITEMS_PER_SOURCE`).
4. **Dùng ngày hoạt động gần nhất làm mốc thời gian**: `publishedAt = repo.pushed_at || repo.created_at`
   (hiện dùng `created_at`). → repo lớn đang được bảo trì nổi lên đầu feed thay vì chìm vì "tạo lâu rồi".
5. Cấu hình mới trong `lib/config.js`: đổi/ thêm `GITHUB_TRENDING_TOPICS`, thêm
   `GITHUB_TRENDING_PUSHED_DAYS = 180`, `GITHUB_TRENDING_MIN_STARS = 500`,
   `GITHUB_TRENDING_PER_TOPIC = 15`, `GITHUB_TRENDING_MAX = 60`. (Có thể bỏ `GITHUB_TRENDING_DAYS`
   cũ nếu không còn dùng.)

### KHÔNG thay đổi
- Sort "Nổi bật nhất" (hot): github_trending vẫn xuống cuối (quyết định đã chốt). Lý do vẫn đúng:
  sao GitHub tới hàng chục nghìn sẽ áp đảo nếu tính vào điểm chung với HN.
- Cấu trúc dữ liệu collector (`{source, sourceId, title, url, author, publishedAt, score, extra}`)
  giữ nguyên; source vẫn là `github_trending`.

### Hành vi mong đợi (nêu rõ để không hiểu nhầm)
- Lần chạy pipeline đầu sau khi triển khai: nạp một loạt (~50–70) repo nổi lâu → user thấy ngay.
- Về sau: chỉ repo mới đáng chú ý (vượt ngưỡng sao, mới với hệ thống) trôi vào dần. Repo cũ
  **già dần trong feed** như mọi tin (không ghim vĩnh viễn). Muốn xem lại → lọc nút GitHub.
- Dedupe theo `(source, source_id=repo.id)` đảm bảo repo không bị tóm tắt/chèn lại nhiều lần.

### Chi phí
- **Một lần** tóm tắt ~50–70 repo mới ≈ **~$0.10** (Claude Haiku, ~0,15 cent/tin).
- **Hàng tháng**: gần như không đổi — chỉ tóm tắt repo mới xuất hiện (thường vài repo/ngày).
- GitHub Search API miễn phí; Actions có `GITHUB_TOKEN` tự cấp (hạn mức search cao hơn), ~7
  request/lần chạy — an toàn.

## Kiểm thử / xác minh
- **Phần A**: chạy web cục bộ (`cd web && npm run dev`), kiểm 3 nút nhóm hiện đúng, lọc ra
  đúng nguồn, nhãn đổi theo VI/EN, nút ẩn khi nhóm chưa có tin.
- **Phần B**: chạy `collectors/github.js` (qua `npm run collect`) xem có repo nổi lâu
  (llama.cpp/ComfyUI...) trong kết quả `github_trending`, `publishedAt` là ngày hoạt động gần đây,
  không lỗi rate limit. Kiểm tổng ≤ 60, không trùng.

## Ngoài phạm vi (YAGNI)
- Không làm "thư viện repo kinh điển" ghim riêng (đã cân nhắc, người dùng chọn hướng gộp).
- Không đổi cơ chế sort/điểm.
- Không thêm nguồn GitHub mới ngoài trending mở rộng.
