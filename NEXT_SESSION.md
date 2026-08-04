# NEXT_SESSION.md — bàn giao task đang làm dở

> File này chỉ chứa **task cụ thể đang dở**, không phải quy tắc/trạng thái ổn định của dự án
> (những cái đó ở `CLAUDE.md`). Đọc xong thì **xoá nội dung mục đã làm xong**, đừng để tồn đọng.

## Bối cảnh vừa xảy ra (phiên trước)

- Đã bật quảng cáo **Adsterra** (thay vì đợi AdSense — AdSense đang bị vô hiệu hoá, đã gửi khiếu
  nại, xem `docs/handoff/adsense-monetization.md`).
- Đã tạo tài khoản Adsterra (`dat_bainews`), thêm site `bainews.site`, tạo 2 ad unit **Banner**:
  300x250 (điện thoại) + 728x90 (máy tính) — đặt ngay dưới header trang chủ, tự đổi cỡ theo màn
  hình. Code: `web/components/AdsterraBanner.js`, `web/components/HeaderAdBanner.js`, gắn vào
  `web/components/Feed.js`. Đã deploy lên production, đã lên tin thật (impression + click ghi
  nhận được, revenue $0 vì mới — bình thường 1-2 ngày đầu).
- Đã chọn phương thức nhận tiền: **PayPal** (so với Paxum/chuyển khoản ngân hàng — PayPal rẻ và
  chắc chắn nhất dù ngưỡng rút $25 cao hơn Paxum $5). User đã đăng ký PayPal xong, đang liên kết
  thẻ ngân hàng VN. Chưa cấu hình PayPal trong Adsterra (ô đó đang mờ, chờ đạt $25 mới chọn được).

## Việc cần làm ở phiên tiếp theo

### 1. Rải thêm quảng cáo Adsterra ở nhiều chỗ hơn ("càng nhiều càng tốt")
User muốn tăng số vị trí gắn quảng cáo để tăng doanh thu. **Chưa thống nhất phạm vi cụ thể** —
việc đầu tiên ở phiên mới là hỏi lại user muốn gắn thêm ở đâu, ví dụ:
- Xen giữa các thẻ tin trong feed trang chủ (`web/components/NewsCard.js` / `Feed.js`) — kiểu cứ
  N thẻ tin thì chèn 1 banner.
- Trang chi tiết tin `/tin/[id]` (`web/app/tin/[id]/DetailContent.js`).
- Trang `/github-ai`, `/en/github-ai` (`GithubAiList.js`).
- Trang "Đã lưu" `/da-luu`.

Nhắc: mỗi vị trí mới cần tạo thêm Ad Unit riêng trong dashboard Adsterra (mỗi cỡ/vị trí có 1 mã
`key` riêng, xem cách làm banner đầu trang đã làm để lặp lại). Cân nhắc **không nhồi nhét quá
30% nội dung là quảng cáo** (đây cũng là 1 trong các điều kiện chính sách publisher thường gặp,
tránh làm phiền người đọc quá mức dù traffic còn nhỏ).

## Việc KHÔNG cần làm lại (đã quyết ở phiên trước)
- Đã thử Paxum, MGID — không phù hợp (MGID cần 5.000 lượt/ngày + bài ≥500 từ, không đạt; Paxum
  rút về VN tốn phí hơn PayPal) — đừng quay lại đề xuất 2 cái này trừ khi traffic tăng mạnh.

