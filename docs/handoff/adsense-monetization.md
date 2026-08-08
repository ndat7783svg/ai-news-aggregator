# Quảng cáo (Google AdSense + Adsterra)

Quá trình bật quảng cáo trên `bainews.site`. Quyết định trước đó ở `CLAUDE.md` mục 3 là "chưa
bật, đợi traffic ổn định vài trăm-1000+/ngày" — user chủ động đổi ý, muốn gắn ngay 1 quảng cáo dù
traffic còn nhỏ, để có động lực (thấy tiền về, dù ít) thay vì đợi.

### 2026-07-31 — Claude: tạo tài khoản AdSense, gắn script, xác minh quyền sở hữu thành công

- Tạo tài khoản Google AdSense, thêm site `bainews.site`, quốc gia thanh toán Việt Nam.
- **Bài học kỹ thuật (đã thêm vào `CLAUDE.md` mục 5):** lần đầu gắn script AdSense bằng component
  `next/script` (`strategy="afterInteractive"` rồi `"beforeInteractive"`) đều **KHÔNG** ra thẻ
  `<script src=...>` tĩnh trong HTML gốc — Next.js chèn qua cơ chế JS (`self.__next_s.push(...)`
  hoặc RSC payload dạng JSON), AdSense không xác minh được vì bot xác minh của họ không (hoặc
  không đáng tin cậy) chạy JS. Fix: dùng thẳng thẻ `<script>` HTML thuần trong `<head>` của
  `web/app/layout.js` (không qua `next/script`) → ra literal `<script async src="...">` tĩnh, xác
  minh quyền sở hữu thành công ngay.
- Trạng thái hiện tại: quyền sở hữu đã xác minh (dấu tick xanh). Còn thiếu bước **"Yêu cầu xem
  xét"** (request review) để Google duyệt site theo chính sách chương trình AdSense — chưa bấm,
  cần làm ở buổi sau (hoặc user tự bấm, không cần code).
- File đổi: `web/app/layout.js` (chỉ gắn script xác minh domain, CHƯA có ô quảng cáo hiển thị nào
  trên giao diện).

### 2026-07-31 — Claude: đã bấm "Yêu cầu xem xét", đang chờ Google duyệt

- Đã chọn CMP của Google (thông báo đồng ý 3 lựa chọn: Đồng ý/Không đồng ý/Quản lý lựa chọn, đúng
  chuẩn GDPR) cho người dùng khu vực EEA/UK/Thuỵ Sĩ — trang chủ yếu người Việt nên ít ảnh hưởng,
  chọn cho đủ thủ tục.
- Đã bấm "Yêu cầu xem xét" lúc 09:37 31/7/2026. Google báo thời gian duyệt: **vài ngày, có thể tới
  2-4 tuần**. Không cần làm gì thêm, chỉ đợi email kết quả.
- Còn dang dở: nhập thông tin thanh toán (mục "Thanh toán" trong AdSense — không gấp, có thể làm
  bất cứ lúc nào trước khi duyệt xong). Sau khi duyệt xong mới có mã quảng cáo (ad unit) thật để
  code gắn 1 ô quảng cáo vào giao diện — việc đó chưa làm, cần quay lại khi AdSense duyệt xong.

### Sau đó — tài khoản AdSense bị vô hiệu hoá, đã gửi khiếu nại

Trước khi Google duyệt xong, tài khoản AdSense bị vô hiệu hoá. User đã gửi khiếu nại (kết quả
chưa biết). Trong lúc chờ, user chủ động chuyển sang dùng **Adsterra** làm giải pháp tạm thời
(xem mục dưới).

### 2026-08-04 — Antigravity: gắn banner Adsterra ở đầu trang

- Tạo tài khoản Adsterra (`dat_bainews`), thêm site `bainews.site`, tạo 2 ad unit **Banner**:
  300x250 (điện thoại) + 728x90 (máy tính), tự đổi cỡ theo màn hình.
- Code: `web/components/AdsterraBanner.js` (load qua script `highperformanceformat.com`, cô lập
  trong iframe riêng để tránh `document.write` xoá trắng trang), `web/components/HeaderAdBanner.js`
  (chọn size theo `matchMedia`), gắn vào `web/components/Feed.js` ngay dưới header.
- Đã deploy lên production, đã lên tin thật (impression + click ghi nhận được, revenue gần $0 vì
  traffic nhỏ — CPM ~$0.002/1000 lượt hiện, bình thường ở quy mô này).
- Đã chọn phương thức nhận tiền: PayPal (so với Paxum/chuyển khoản — PayPal rẻ và chắc chắn nhất
  dù ngưỡng rút $25 cao hơn Paxum $5).
- **2026-08-04, cùng ngày:** user báo có người dùng bình luận phàn nàn quảng cáo hiển thị là nội
  dung cá cược/crypto (banner "MELBET... Exclusive Bonus"), lệch thương hiệu 1 trang tin AI
  nghiêm túc. Đã hỏi user 4 hướng xử lý (chặn danh mục quảng cáo trong dashboard Adsterra / tạm gỡ
  chờ AdSense / cứ để vậy / đổi network khác) — **user chọn "cứ để vậy"** vì traffic còn nhỏ, chưa
  đáng lo (xem memory `ai-news-adsense-monetization`).

### 2026-08-04 — Claude: TẮT KHẨN CẤP banner Adsterra — người dùng báo bị bung quảng cáo/popup

- Vài giờ sau khi chấp nhận nội dung quảng cáo lệch thương hiệu ở trên, user báo **khẩn cấp**:
  nhiều người dùng thật bình luận rằng bấm vào link trên trang thì bị bung ra hàng loạt quảng
  cáo (khác hẳn 1 banner tĩnh — có dấu hiệu popup/redirect).
- Claude kiểm tra code: `HeaderAdBanner`/`AdsterraBanner` là mã quảng cáo duy nhất mới thêm gần
  đây có khả năng gây hành vi này (layout.js chỉ còn script AdSense cũ, tài khoản đã bị vô hiệu
  hoá nên không phục vụ quảng cáo thật). Thử tái hiện bằng công cụ trình duyệt tự động của Claude
  nhưng **không tái hiện được** — domain quảng cáo (`highperformanceformat.com`) bị chặn/không
  load được trong môi trường đó, không kết luận được "sạch" hay "có lỗi" chỉ từ công cụ này.
- Do có báo cáo thật từ nhiều người dùng và đây là mã nghi ngờ số 1 (Adsterra là mạng "remnant"
  nổi tiếng hay để lọt quảng cáo/creative có hành vi popup/redirect ẩn trong định dạng banner),
  **quyết định tắt ngay để chặn đứng ảnh hưởng**, không đợi điều tra sâu hơn trước — ưu tiên an
  toàn người dùng hơn doanh thu (vốn đang gần $0).
- Cách tắt: `web/components/Feed.js` bọc `{false && <HeaderAdBanner />}` (không xoá code, chỉ
  ngừng render) — dễ bật lại nếu xác định được đây không phải nguyên nhân, hoặc thay bằng ad unit/
  network khác an toàn hơn.
- **Việc cần làm ở phiên sau:** xác nhận thật sự banner Adsterra là nguyên nhân (hỏi lại người
  bình luận chi tiết hơn, hoặc theo dõi xem sau khi tắt còn ai báo lỗi tương tự không). Nếu đúng,
  cân nhắc bỏ hẳn Adsterra, tìm network khác uy tín hơn hoặc quay lại chờ AdSense.
- **Đã xác nhận nguyên nhân qua bình luận Facebook thật:** 1 người dùng mô tả rõ "bấm vào thấy
  hiện ra tùm lum, rồi nhảy link Shopee" — site không có link Shopee nào, xác nhận đây là hành vi
  chuyển hướng độc hại (popunder/clickjack) từ creative Adsterra, không phải hiểu lầm. Kết luận:
  không bật lại Adsterra.

### 2026-08-04/05 — Claude: tìm mạng quảng cáo thay thế — không có lựa chọn nào phù hợp

Đã research Media.net (ưu tiên traffic Tier 1 Mỹ/Anh/Canada + tiếng Anh, không hợp trang tiếng
Việt), Setupad (cần ~100k lượt/tháng), Newor Media (gói không giới hạn traffic bắt buộc tiếng
Anh, gói khác cần 30-60k lượt/tháng) — đều không phù hợp quy mô/traffic hiện tại. Các mạng dễ vào
khác (PopCash, PopAds, AdCash, TinyAdz, PropellerAds, Monetag) đều cùng nhóm "remnant" rủi ro như
Adsterra. **Quyết định: không gắn mạng thay thế nào, tập trung chờ AdSense.**

### 2026-08-05 — phát hiện lý do AdSense bị vô hiệu hoá: liên kết tài khoản, không phải nội dung

Đọc email chính thức Google (3/8/2026): tài khoản AdSense (`pub-3734960989036733`) bị vô hiệu hoá
vì **"liên quan đến một tài khoản đã bị vô hiệu do vi phạm chính sách AdSense"** — không phải do
nội dung/traffic của bainews.site. Đã dò tìm qua Gmail (`ndat7783@gmail.com` +
`aisuo782@gmail.com`, kênh YouTube cũ "Aiyuo"/"SAiyuo") nhưng không tìm được bằng chứng cụ thể
tài khoản/kênh nào là nguồn gốc liên kết — khả năng cao là 1 tài khoản Google khác đã mất
quyền truy cập hoàn toàn, không còn trên thiết bị nào hiện có.

**Quyết định (2026-08-05): dùng danh tính em gái để tạo tài khoản AdSense mới**, vì việc dò tìm/
kháng cáo tài khoản cũ không có tiến triển. Đã cân nhắc và **từ chối** các hướng lách/né (VPN +
số điện thoại mới, mua điện thoại mới, đăng nhập tài khoản em gái trên thiết bị của ndat) vì đây
là hành vi Google coi là "circumventing" — rủi ro liên luỵ tới cả tài khoản Google chính đang
dùng, không chỉ AdSense. Hướng đã chọn: **em gái tự đăng ký + xác minh thanh toán bằng chính
thiết bị/thông tin của cô ấy** (không phải chỉ đứng tên suông).

- Tài khoản AdSense mới: `ca-pub-5459662308637363`. Đã thay mã xác minh domain trong
  `web/app/layout.js` từ `ca-pub-3734960989036733` (cũ, vô hiệu hoá) sang `ca-pub-5459662308637363`,
  push production (commit `5784a05`).

### 2026-08-06 — thực ra `ca-pub-5459662308637363` là tài khoản khác của chính ndat, không phải em gái; đã không qua

Ndat làm rõ lại: tài khoản `ca-pub-5459662308637363` ở mục trên **thực ra là ndat tự thử 1 tài
khoản Google khác của chính mình**, không phải em gái như ban đầu nói. Sau vài ngày, tài khoản
này **cũng không qua được** (không rõ chi tiết lý do).

**Đổi sang tài khoản AdSense thật sự của em gái ndat: `ca-pub-4228692528546788`** — lần đầu em
gái thử. Đã thay mã xác minh domain trong `web/app/layout.js`, push production (commit
`6afd3ed`).

**Lưu ý:** domain `bainews.site` đã đổi qua 3 tài khoản AdSense khác nhau chỉ trong vài ngày
(ndat gốc → ndat thử lần 2 → em gái). Đã cảnh báo ndat về rủi ro đổi tài khoản dồn dập trên cùng
1 domain có thể tự nó là tín hiệu đáng ngờ với Google — nếu lần này (em gái) cũng không qua, nên
dừng thử thêm tài khoản mới một thời gian.

- **Việc cần làm ở phiên sau:** theo dõi email xác nhận quyền sở hữu domain thành công cho
  `ca-pub-4228692528546788`, sau đó bấm "Yêu cầu xem xét" như quy trình cũ (xem mục 2026-07-31 ở
  trên). Khi mã AdSense mới được đưa để dán, hỏi rõ đây là tài khoản của ai, thử lần thứ mấy —
  đã có tiền lệ khai nhầm "của em tôi".
