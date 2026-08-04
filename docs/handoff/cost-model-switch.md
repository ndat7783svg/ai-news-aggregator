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
