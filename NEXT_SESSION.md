# NEXT_SESSION.md — bàn giao task đang làm dở

> File này chỉ chứa **task cụ thể đang dở**, không phải quy tắc/trạng thái ổn định của dự án
> (những cái đó ở `CLAUDE.md`). Đọc xong thì **xoá nội dung mục đã làm xong**, đừng để tồn đọng.

## Bối cảnh vừa xảy ra (phiên trước, 15/08/2026)

- **Model tóm tắt đã đổi hẳn sang GPT-5.6 Luna (OpenAI), không còn dùng Claude Haiku** — Anthropic
  đã hết credit thật, pipeline gián đoạn 6 ngày (09/08-15/08), đã sửa lỗi + chạy bù tin thành
  công (1257 tin mới). Việc này **ĐÃ XONG HOÀN TOÀN**, không cần làm gì thêm. Chi tiết:
  `docs/handoff/cost-model-switch.md`.
- **Quảng cáo Adsterra ĐÃ TẮT HẲN, không dùng lại** — xác nhận gây hành vi độc hại thật (bấm link
  bị chuyển hướng sang trang lạ như Shopee). Đừng đề xuất bật lại hay "rải thêm chỗ khác" — đây là
  quyết định đã chốt, không phải tạm thời.
- **AdSense:** tài khoản gốc vẫn bị vô hiệu hoá, khiếu nại chưa có kết quả. Đã đổi sang tài khoản
  đứng tên em gái ndat (`ca-pub-4228692528546788`, mã đã gắn trong `web/app/layout.js`) — **đang
  chờ Google xác minh quyền sở hữu domain**, chưa bấm "Yêu cầu xem xét".

## Việc cần làm ở phiên tiếp theo

### 1. Theo dõi AdSense mới (em gái) — ưu tiên cao nhất
Kiểm tra email/dashboard AdSense xem quyền sở hữu domain đã xác minh xong chưa. Nếu xong, bấm
"Yêu cầu xem xét" (quy trình giống lần đầu, xem `docs/handoff/adsense-monetization.md` mục
2026-07-31 để nhắc lại từng bước). Nếu AdSense mới **cũng không qua**, đừng tự ý mở thêm tài khoản
khác — hỏi lại user trước (domain đã đổi qua 3 tài khoản AdSense trong vài ngày, đổi thêm dễ bị
Google để ý).

### 2. Nếu AdSense không thành: thử Infolinks (đã xác định là phương án dự phòng)
Không phải popup/popunder, an toàn hơn Adsterra/Monetag nhiều — nhưng doanh thu rất thấp, đừng kỳ
vọng nhiều. Xem lý do chọn ở `docs/handoff/adsense-monetization.md` mục 2026-08-15.

### 3. Chưa rõ: user đã gửi tin nhắn cho Adsterra support chưa
Đã soạn sẵn 1 đoạn báo cáo sự cố redirect độc hại để user gửi bộ phận hỗ trợ Adsterra, nhưng chưa
xác nhận đã gửi hay có phản hồi gì chưa. Hỏi lại nếu liên quan — chỉ cân nhắc bật lại Adsterra nếu
có xác nhận RÕ RÀNG từ họ đã xử lý, không tự ý bật lại.

## Việc KHÔNG cần làm lại (đã quyết, đừng đề xuất lại)
- **Không bật lại Adsterra** trừ khi Adsterra support xác nhận đã xử lý sự cố redirect.
- **Không dùng Monetag, PopCash, PopAds, AdCash, TinyAdz, PropellerAds, Yllix, ExoClick** — cùng
  nhóm rủi ro popup/popunder hoặc (ExoClick) mạng quảng cáo người lớn, không hợp trang tin AI.
- Đã thử Paxum, MGID, Media.net, Setupad, Newor Media — không phù hợp quy mô/traffic hiện tại
  (traffic nhỏ, tiếng Việt, không đạt ngưỡng tối thiểu của các mạng này).
- **Không tự ý mở thêm tài khoản Google/AdSense mới** cho chính ndat (VPN, số điện thoại mới,
  thiết bị mới...) để né lệnh cấm — đã từ chối hướng này, rủi ro liên luỵ tài khoản Google chính.
