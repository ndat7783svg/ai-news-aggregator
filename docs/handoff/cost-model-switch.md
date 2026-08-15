# Cân nhắc đổi model tóm tắt (chi phí)

Theo dõi việc cân nhắc đổi model tóm tắt AI từ Claude Haiku sang model khác rẻ hơn, do lo ngại
chi phí Anthropic tăng nhanh hơn dự tính. Quyết định gốc dùng Haiku ở `CLAUDE.md` mục 4.

### 2026-08-02 — Claude: ghi nhận đề xuất đổi sang GPT-5.6 Luna, chưa đổi

- User xem Claude Console → Cost, thấy $2.96 chi phí trong 30 ngày (filter theo 1 API key), lo
  ngại $5 credit không đủ dùng 1 tháng, đề xuất đổi sang "GPT-5.6 Luna" (OpenAI) cho rẻ.
- Đã tra cứu xác nhận model có thật (không phải nhớ nhầm tên), vừa được OpenAI giảm giá 80% cuối
  tháng 7/2026. So sánh giá:
  - Claude Haiku 4.5: $1 / triệu token input, $5 / triệu token output.
  - GPT-5.6 Luna: $0.20 / triệu token input, $1.20 / triệu token output — rẻ hơn ~4-5 lần.
- Lưu ý khi đọc số $2.96/30 ngày: một phần chi phí đó đến từ các đợt **backfill 1 lần** (dịch
  `title_vi` cho tin cũ, thu thập 136 repo "Kinh điển" GitHub) — không phải chi phí vận hành đều
  đặn. Chi phí vận hành thật (chỉ tóm tắt tin MỚI mỗi 15') ước thấp hơn, xem `CLAUDE.md` mục 6.
- **Quyết định:** CHƯA đổi ngay. User muốn ghi lại làm việc dang dở, đợi khi credit Anthropic hết
  mới chuyển hẳn — không đổi khi đang còn tiền, tránh việc dở dang giữa chừng.
- Việc cần làm khi tới lúc đổi:
  1. Viết lại phần gọi API tóm tắt trong `summarize/summarizer.js` (hiện dùng Anthropic SDK +
     structured outputs) sang OpenAI SDK, giữ nguyên khuôn dữ liệu trả về (title_vi, summary_vi,
     summary_en) để không phải sửa `db/supabase.js` hay web.
  2. Test chất lượng tóm tắt song ngữ VI+EN của Luna trên vài chục tin trước khi chuyển hẳn toàn
     bộ — Haiku đã kiểm tra chất lượng tốt, Luna thì chưa, đừng giả định tự động tốt tương đương
     chỉ vì rẻ hơn.
  3. Cập nhật secret GitHub Actions: thêm `OPENAI_API_KEY`, có thể giữ `ANTHROPIC_API_KEY` song
     song một thời gian để so sánh trước khi gỡ hẳn.
  4. Sau khi đổi xong, cập nhật lại quyết định đã chốt ở `CLAUDE.md` mục 4.

### 2026-08-15 — Đã đổi hẳn sang GPT-5.6 Luna, kèm sự cố gián đoạn 6 ngày + đã bù

**Lý do đổi ngay hôm nay (khác kế hoạch "đợi hết credit" ban đầu):** Anthropic hết credit thật —
xác nhận qua lịch sử GitHub Actions, pipeline lỗi liên tục từ **04:15 sáng 09/08/2026** tới
15/08/2026 (đúng 6 ngày trang không có tin mới).

**Antigravity** viết lại `summarize/summarizer.js` sang OpenAI SDK (Chat Completions +
`response_format: json_schema`), sửa `pipeline.js`/`.github/workflows/collect.yml` dùng
`OPENAI_API_KEY`. Tạm tăng `RECENT_WINDOW_HOURS` (48→168) và `MAX_ITEMS_PER_SOURCE` (20→150)
trong `lib/config.js` để bù tin, nhưng **chưa chạy bù thật, chưa test model có gọi được không**.

**Claude kiểm tra lại (không tin lời báo "xong"), phát hiện 2 lỗi thật khi chạy thử:**
1. Model Luna không nhận `max_tokens` — API trả lỗi 400, sửa thành `max_completion_tokens`.
2. `db/supabase.js` bước lọc trùng gộp 200 sourceId/query — sourceId của blog là URL dài
   (guid/link RSS), vượt giới hạn header 16KB của Supabase, lỗi "fetch failed". Giảm `BATCH`
   200→50.

**Đã test chất lượng Luna** trên vài tin thật (chỉ có tiêu đề, có abstract, có nhắc Trung Quốc) —
tóm tắt đúng ý, không bịa, giữ đúng tên riêng, không lẫn chữ Hán. Chất lượng ngang Haiku, không
cần chỉnh prompt.

**Đã chạy bù tin thật:**
- Chạy pipeline với cấu hình tạm rộng (168h/150 tin): 755 tin mới (mọi nguồn).
- HN bù đủ toàn bộ 6 ngày. **arXiv KHÔNG đủ** — chỉ bù được từ 13/08 trở lại (do khối lượng
  arXiv/ngày quá lớn, "150 bài mới nhất" không đủ phủ 6 ngày).
- Bù riêng arXiv cho khoảng thiếu 09/08–13/08 bằng query `submittedDate` range: server báo
  **1393 bài** trong khoảng đó, chỉ lấy 500 bài đầu (đủ dùng cho feed tin đọc lướt, lấy hết 1393
  sẽ ngập feed toàn bài nghiên cứu, không hợp mô hình trang). → **~893 bài arXiv trong khoảng
  09/08–13/08 KHÔNG có trên trang, chấp nhận mất — không phải lỗi, là lựa chọn có chủ đích.**
- Tổng cộng: **1257 tin mới** được bù. Đã trả `RECENT_WINDOW_HOURS`/`MAX_ITEMS_PER_SOURCE` về
  48/20 sau khi xong.
- Đã xác nhận production (cron-job.org → GitHub Actions) tự chạy thành công với code mới, tin
  "1 giờ trước" đã lên trang thật.

**Trạng thái hiện tại: đã chuyển hẳn sang GPT-5.6 Luna, không còn dùng Anthropic Haiku nữa.**
`ANTHROPIC_API_KEY` vẫn còn trong GitHub secrets (không dùng tới, không gỡ, không hại gì).
