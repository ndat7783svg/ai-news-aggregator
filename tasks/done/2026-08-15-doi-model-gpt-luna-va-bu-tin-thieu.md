# Đổi model tóm tắt sang GPT-5.6 Luna (OpenAI) + bù khoảng trống tin 6 ngày

## Mục tiêu
Claude Haiku (Anthropic) đã hết credit, pipeline không tóm tắt được tin nào từ đó — trang KHÔNG
có tin mới suốt nhiều ngày qua. Đã xác nhận CHÍNH XÁC qua lịch sử GitHub Actions (workflow
`collect.yml`, không phải ước lượng):
- **Lần chạy thành công cuối cùng:** run id `31278292275`, `2026-08-08T21:00:54Z` UTC = **04:00
  sáng 09/08/2026 giờ Việt Nam**.
- **Bắt đầu lỗi liên tục từ:** run id `31278880725`, `2026-08-08T21:15:28Z` UTC = **04:15 sáng
  09/08/2026 giờ Việt Nam** — lỗi không ngừng từ đó tới nay (15/08/2026), tức **gián đoạn đúng 6
  ngày**.

Cần: (1) chuyển hẳn sang model rẻ hơn **GPT-5.6 Luna (OpenAI)** để hết tình trạng hết credit liên
tục, (2) khôi phục lại các tin bị bỏ lỡ trong 6 ngày gián đoạn đó, trong khả năng cho phép (xem
lưu ý quan trọng bên dưới — KHÔNG phải lúc nào cũng khôi phục được).

## Bối cảnh
Xem `docs/handoff/cost-model-switch.md` — kế hoạch đổi model đã bàn từ 02/08/2026, quyết định
gốc dùng Haiku ở `CLAUDE.md` mục 4. User đã có `OPENAI_API_KEY` mới (tự tạo trên
platform.openai.com), sẽ cung cấp riêng — thêm vào `.env` (local) và secret GitHub Actions
(production), KHÔNG hardcode vào code.

So giá đã xác nhận (02/08/2026): Claude Haiku 4.5 = $1/$5 mỗi triệu token input/output; GPT-5.6
Luna = $0.20/$1.20 mỗi triệu token — rẻ hơn ~4-5 lần.

**Điều chỉnh so với kế hoạch gốc trong `cost-model-switch.md`:** kế hoạch gốc có bước "giữ
ANTHROPIC_API_KEY song song để so sánh chất lượng trước khi gỡ hẳn" — **bỏ bước này**, vì Haiku
hiện KHÔNG còn credit (user không muốn nạp thêm), không có gì để so sánh song song nữa. Thay vào
đó: dùng chính đợt tóm tắt bù tin 6 ngày qua (mục "Việc cần làm" #2 bên dưới) làm bài test chất
lượng thực tế cho Luna — tự nhiên vừa bù tin vừa test, không cần bước test riêng.

## Việc cần làm

### 1. Viết lại `summarize/summarizer.js` sang OpenAI SDK cho model Luna
- [ ] Cài `openai` package (npm), bỏ import `@anthropic-ai/sdk` (hoặc giữ nếu muốn dễ rollback,
  nhưng không dùng nữa trong luồng chính).
- [ ] Đổi `MODEL` sang đúng tên model Luna trên OpenAI API (xác nhận lại tên chính xác qua tài
  liệu OpenAI lúc code — tên "GPT-5.6 Luna" là tên gọi thị trường, cần map đúng model ID API).
- [ ] Giữ NGUYÊN khuôn dữ liệu trả về của `summarizeItem`/`translateTitle`/`summarizeMany`/
  `translateTitles` — vẫn trả về object có `titleVi`, `summaryVi`, `summaryEn` (hoặc
  `summaryError`/`titleError`) y hệt hiện tại, để KHÔNG phải sửa `pipeline.js`, `db/supabase.js`,
  hay bất kỳ code web nào.
- [ ] Dùng cơ chế structured outputs/JSON schema tương đương của OpenAI API (Chat Completions
  `response_format: { type: "json_schema", ... }` hoặc Responses API tuỳ bản SDK) để giữ đúng
  khuôn `OUTPUT_SCHEMA`/`TITLE_SCHEMA` đã có — copy nguyên `SYSTEM_PROMPT`, `TITLE_RULES`,
  `TITLE_SYSTEM` (prompt tiếng Việt đã tối ưu, không viết lại từ đầu).
- [ ] Đổi tên biến env đọc key: `OPENAI_API_KEY` (giữ logic `cleanKey()` chuẩn hoá y hệt bản cũ —
  tự bỏ prefix `TÊN=`, dấu nháy, khoảng trắng thừa khi dán secret lỗi).
- [ ] `pipeline.js` dòng 46: đổi check biến môi trường bắt buộc từ `ANTHROPIC_API_KEY` sang
  `OPENAI_API_KEY`. Dòng 74/87 sửa lại chữ "Claude Haiku" → "GPT-5.6 Luna" cho đúng log.

### 2. Bù tin bị bỏ lỡ (gián đoạn 09/08 04:15 → nay) — ĐỌC KỸ TRƯỚC KHI LÀM
**Lưu ý quan trọng, KHÔNG được bỏ qua:** pipeline hiện tại **KHÔNG lưu tin thô chưa tóm tắt vào
Supabase** — xem `pipeline.js` dòng 84-89: nếu tóm tắt hỏng TOÀN BỘ (`ok.length === 0`), pipeline
thoát lỗi TRƯỚC bước ghi DB (dòng 91 `insertItems`). Nghĩa là **tin thu thập được từ 04:15 sáng
09/08/2026 tới nay đã bị VỨT BỎ hoàn toàn mỗi lần chạy** (đã xác nhận chính xác mốc giờ này qua
lịch sử GitHub Actions, xem mục "Mục tiêu" ở trên) — không có "tin tồn kho chờ tóm tắt" nào để lấy
lại. Đây không phải việc "tóm tắt lại tin đã lưu", mà là việc **thu thập lại từ đầu**, và **một số
nguồn sẽ KHÔNG lấy lại được đầy đủ** do giới hạn cửa sổ thời gian/số lượng của từng collector:

- **Hacker News** (`collectors/hackernews.js`): chỉ lấy tin trong `RECENT_WINDOW_HOURS` = 48 giờ
  gần nhất (`lib/config.js`). Tính từ lúc thật sự chạy bù (không phải từ 09/08) tới 04:15 sáng
  09/08/2026, ra đúng số giờ cần đặt tạm cho `RECENT_WINDOW_HOURS` (ví dụ nếu chạy bù vào
  15/08/2026 ~09:00 sáng giờ VN, khoảng cách tới 09/08 04:15 là ~148 giờ — cộng dư ra ~5-10 giờ
  cho chắc, đặt tạm ~155-160). **Tin HN phát sinh TRƯỚC 09/08 04:15 (tức trước lúc pipeline còn
  chạy tốt) không cần bù, chỉ cần phủ đúng khoảng gián đoạn.**
- **arXiv** (`collectors/arxiv.js`): lấy `MAX_ITEMS_PER_SOURCE` = 20 bài **mới nhất** theo
  `submittedDate` (không phải theo khung giờ). arXiv cs.AI/cs.LG/cs.RO ra rất nhiều bài/ngày, nên
  chạy lại bình thường **chỉ lấy được ngày gần nhất**, các ngày trước trong khoảng gián đoạn gần
  như chắc chắn bị đẩy khỏi top 20, mất luôn.
- **Blog RSS** (`collectors/blogs.js`) và **GitHub Releases/Trending**: khả năng cao **tự phục
  hồi tốt hơn** vì RSS feed thường giữ nhiều mục gần đây, GitHub API cũng không giới hạn chặt theo
  giờ — nhưng vẫn nên kiểm tra thực tế sau khi chạy, đừng giả định.

**Cách xử lý đề xuất (chọn 1, ưu tiên phương án A):**
- **Phương án A — nới cửa sổ tạm thời cho lần chạy đầu tiên, rồi trả về như cũ:**
  1. Trước khi chạy pipeline lần đầu sau khi đổi model, tạm sửa `lib/config.js`:
     `RECENT_WINDOW_HOURS` từ 48 lên đủ bao phủ tới mốc **04:15 sáng 09/08/2026 giờ Việt Nam**
     (giờ pipeline bắt đầu lỗi liên tục) — tính số giờ từ lúc THỰC SỰ chạy lệnh bù tới mốc đó,
     cộng dư thêm 5-10 giờ cho chắc.
  2. Với arXiv, sửa tạm `collectArxiv()` hoặc gọi thêm 1 lần với tham số ngày cụ thể (arXiv API
     hỗ trợ `search_query` kèm `submittedDate:[20260809 TO YYYYMMDD]` — cận dưới cố định
     `20260809`, cận trên là ngày chạy bù thực tế) để quét đủ khoảng ngày bị lỡ, thay vì chỉ lấy
     "20 bài mới nhất" (sẽ bỏ sót các ngày cũ hơn).
  3. Chạy `npm run pipeline` 1 lần (cục bộ, có `.env` đủ `OPENAI_API_KEY` mới) để thu + tóm tắt bù
     bằng Luna — đây cũng chính là bài test chất lượng thực tế trên dữ liệu thật.
  4. Sau khi chạy xong, **trả `RECENT_WINDOW_HOURS` về lại 48** và bỏ đoạn sửa tạm ở arXiv — đây
     là thay đổi MỘT LẦN để bù, không phải cấu hình lâu dài (giữ rộng mãi sẽ tăng chi phí/số
     lượng tin không cần thiết).
- **Phương án B — chấp nhận mất tin cũ, chỉ chạy pipeline bình thường từ giờ trở đi:** đơn giản
  hơn nhưng mất hẳn tin AI nổi bật suốt 6 ngày gián đoạn đó, đặc biệt arXiv/HN. Chỉ chọn nếu user
  đồng ý
  sau khi được giải thích phương án A tốn thêm chút công nhưng bù được nhiều hơn.

**Dedupe không cần lo:** cơ chế `fetchExistingKeys`/`itemKey` (theo `source` + `source_id`) đã tự
động lọc trùng khi ghi DB — chạy lại nhiều lần hay nới cửa sổ rộng hơn không tạo tin trùng lặp,
không cần thêm logic dedupe riêng.

### 3. Cập nhật secret GitHub Actions
- [ ] Thêm secret `OPENAI_API_KEY` vào repo GitHub (Settings → Secrets and variables → Actions).
- [ ] Sửa `.github/workflows/collect.yml` (hoặc tên file workflow chạy pipeline hiện tại — kiểm
  tra đúng tên file) để inject `OPENAI_API_KEY` vào bước chạy `node pipeline.js`, bỏ
  `ANTHROPIC_API_KEY` khỏi bước đó nếu không còn dùng (có thể giữ secret cũ trong repo cho gọn,
  chỉ cần không bắt buộc trong workflow nữa).

### 4. Cập nhật tài liệu sau khi xong
- [ ] `CLAUDE.md` mục 4 ("Quyết định đã chốt"): sửa dòng "Dùng Claude Haiku... không đổi sang
  Gemini/GPT" thành trạng thái mới — đã đổi sang GPT-5.6 Luna, lý do chi phí, ngày đổi.
  `CLAUDE.md` mục 6 ("Chi phí thực tế"): cập nhật ước tính chi phí hàng tháng theo giá Luna.
- [ ] `docs/handoff/cost-model-switch.md`: nối thêm mục ngày hôm nay ghi lại đã đổi xong, kết quả
  test chất lượng thực tế (Luna tóm tắt ổn không, có cần chỉnh prompt gì không).
- [ ] Nếu phương án bù tin ở mục 2 áp dụng: ghi rõ khoảng ngày nào bị mất hẳn (nếu có, do giới hạn
  collector) vào `docs/handoff/` — để tránh sau này ai đó thắc mắc "sao thiếu tin ngày X".

## Tiêu chí hoàn thành / cách verify
- `node --env-file=.env pipeline.js` chạy cục bộ thành công, log hiện "GPT-5.6 Luna" thay vì
  "Claude Haiku", không lỗi thiếu `OPENAI_API_KEY`.
- Vào Supabase table `news_items`, thấy tin mới có `title_vi`/`summary_vi`/`summary_en` đầy đủ,
  đọc thử vài tin xem chất lượng tóm tắt ổn không (đúng ý, không bịa, không lẫn tiếng Trung/Nhật/
  Hàn — đúng các ràng buộc đã có trong `SYSTEM_PROMPT`).
- Sau khi chạy bù, vào `bainews.site` thấy tin mới xuất hiện trở lại, số lượng tin của những ngày
  bị gián đoạn tăng lên rõ rệt so với trước khi chạy bù (không nhất thiết đầy đủ 100%, xem lưu ý
  giới hạn collector ở mục 2).
- GitHub Actions chạy `workflow_dispatch` thủ công 1 lần, xem log thành công, không lỗi thiếu key.
- `RECENT_WINDOW_HOURS` trong `lib/config.js` đã trả về 48 sau khi bù xong (không để dư).

## KHÔNG được làm
- Không đổi cấu trúc bảng Supabase (`db/supabase.js`) — chỉ `summarize/summarizer.js` cần đổi
  logic gọi API, khuôn dữ liệu trả về giữ nguyên.
- Không sửa web (`web/`) — model tóm tắt là việc backend/pipeline, không ảnh hưởng frontend.
- Không giữ `RECENT_WINDOW_HOURS` hay giới hạn arXiv rộng vĩnh viễn sau khi bù xong — chỉ nới tạm
  1 lần rồi trả về cấu hình gốc.
- Không tự ý push thẳng lên `main` nếu chưa qua review — tạo commit rõ ràng để Claude Code kiểm
  tra bằng `git diff` trước khi coi là xong (đặc biệt vì đây là thay đổi ảnh hưởng chi phí thật
  hàng tháng, cần kiểm tra kỹ trước khi để chạy tự động lâu dài).
