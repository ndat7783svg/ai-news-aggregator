# Nút Lưu tin + Chia sẻ

Danh sách lưu tin trong `localStorage`, trang chi tiết `/tin/[id]`, trang "Đã lưu" `/da-luu`,
sau đó làm lại giao diện thành pill YouTube + thêm menu ☰ header.

### 2026-07-27 — Claude Code (Sonnet 5) bàn thiết kế + Antigravity thực thi — nút Lưu & Chia sẻ
- **Claude:** bàn với user, chốt thiết kế: lưu tin vào danh sách trong `localStorage` (không cần
  login — CLAUDE.md mục 4), bấm là lưu ngay vào "Đã lưu" mặc định (popup chọn danh sách là thao
  tác phụ); chia sẻ dùng Web Share API + fallback copy link, URL trỏ về trang chi tiết mới
  `/tin/[id]` (không chia sẻ thẳng link bài gốc — mục tiêu kéo traffic về web). Spec:
  `docs/superpowers/specs/2026-07-27-save-share-buttons-design.md`.
- **Antigravity:** thực thi, commit `6c6ac82` (feat, 12 file) + `8af1263` (docs). File mới:
  `web/lib/savedLists.js`, `web/lib/share.js`, `web/components/SaveListPopup.js`,
  `web/app/tin/[id]/page.js` + `DetailContent.js`, `web/app/da-luu/page.js`,
  `web/app/api/saved-items/route.js`; sửa `NewsCard.js`, `Feed.js` (link footer "Tin đã lưu"),
  `i18n.js`, `supabaseServer.js` (thêm `fetchItemById`/`fetchItemsByIds`), `globals.css`.
- **Claude kiểm tra lại:** đọc diff từng file, đối chiếu spec — đúng kiến trúc, API route có ĐỦ
  cả `force-dynamic` + `fetchCache = "force-no-store"` (bài học CLAUDE.md mục 5, lần này không
  sót). Viết script test riêng mock `localStorage` chạy thẳng `savedLists.js` bằng Node: **11/11
  case pass**, kể cả các case rìa (chặn xoá danh sách "default", xoá danh sách kéo theo tin bên
  trong, không lưu trùng, bỏ lưu khỏi mọi danh sách).
- **Claude PHÁT HIỆN + SỬA 2 lỗi i18n Antigravity bỏ sót** (task đã ghi rõ "KHÔNG được sót bản
  dịch nào" nhưng vẫn lọt): (1) `da-luu/page.js` hardcode tiếng Việt "N tin không tải được (id
  không còn trong DB)." — hiện nguyên tiếng Việt cả khi đang ở chế độ EN; (2) `SaveListPopup.js`
  hardcode `aria-label="Đóng"`. Fix: thêm khoá `savedMissing`/`closePopup` vào `i18n.js` (cả VI
  và EN), thay 2 chỗ hardcode. Đã verify lại trên trình duyệt thật: đổi VI/EN cả 2 chuỗi hiện
  đúng ngôn ngữ, không lỗi console.
- **Hạn chế khi kiểm tra:** máy này KHÔNG có `web/.env.local` nên không kết nối được Supabase —
  không thể bấm thử nút Lưu/Chia sẻ trên thẻ tin thật, cũng không mở được `/tin/<id>` với dữ
  liệu thật. Phần đã verify được: logic `savedLists.js` (test script), trang `/da-luu` render
  (nạp dữ liệu giả vào localStorage — danh sách/đổi tên/đếm số/chặn xoá "default" đều đúng),
  build sạch (11 route).
- Lặp lại bài học cũ: Antigravity làm đúng phần lớn nhưng vẫn sót chi tiết khác nhau mỗi lần —
  lần này là i18n (đúng loại lỗi đã từng xảy ra 27/07). Luôn phải đọc diff + chạy thử thật.

### 2026-07-27 — Claude Code (Sonnet 5): làm lại nút Lưu/Chia sẻ theo kiểu pill YouTube + menu ☰ header
- **User phản hồi:** bản đầu Antigravity làm nút Lưu/Chia sẻ dùng emoji (🔖🔗▾) trong khung viền
  mảnh — chê xấu, yêu cầu làm theo kiểu "pill" bo tròn nền đặc giống YouTube. Dựng bản xem trước
  bằng widget trước khi code để chốt hướng.
- **Đổi giao diện:** bỏ emoji, vẽ icon SVG nét đơn (`web/components/icons.js`: `ShareIcon`,
  `BookmarkIcon`, `ChevronDownIcon`, dùng `currentColor` tự đổi màu theo theme/trạng thái); style
  `.pill`/`.pill-group` mới trong `globals.css` (biến `--chip`/`--chip-hover` cho cả 2 theme);
  nút Lưu + mũi tên gộp chung 1 pill; trạng thái đã lưu đảo màu nền.
- **Bug kỹ thuật phát hiện khi kiểm tra đổi theme động (không tải lại trang):** dùng thuộc tính
  viết tắt `background: var(--chip)` cùng `transition: background 0.12s` khiến nền nút không cập
  nhật theo giá trị biến CSS mới khi đổi theme — kẹt ở màu cũ. Fix: đổi toàn bộ sang
  `background-color` + `transition: background-color 0.12s`. **Lúc đầu tưởng là bug thật, đo lại
  hoá ra một phần do trình duyệt tự động không compositing frame nên transition đứng yên — verify
  lại bằng cách tắt transition tạm thời mới phân biệt được bug thật (background shorthand) với
  hạn chế công cụ (transition không chạy).**
  Dựng trang tạm `web/app/preview-card-tmp/` với dữ liệu giả để đo màu (máy này không có
  `web/.env.local`), xoá sau khi xong.
- **Thêm nút menu ☰ ở header** (`web/components/HeaderMenu.js`): đặt ngoài cùng bên phải, sau nút
  sáng/tối + VI/EN — theo đúng yêu cầu user (dựng preview bằng widget trước khi code). Dropdown
  neo dưới nút, canh phải, đóng khi bấm ra ngoài/Esc/bấm lại nút, 3 mục: Trang chủ, GitHub AI nổi
  bật (tự trỏ `/en/github-ai` khi đang chế độ EN), Tin đã lưu. Rút gọn footer `Feed.js` chỉ còn 1
  link GitHub AI (bỏ 2 link emoji trùng với menu).
- **Kiểm tra thật:** build sạch cả 2 lần; dựng dev server, dùng `dispatchEvent` mô phỏng bấm nút
  (đóng/mở bằng 4 cách: click ngoài/Esc/bấm lại nút/bấm 1 mục), đo màu bằng
  `getComputedStyle` ở cả 2 theme sau khi tắt transition, xác nhận đổi VI/EN đúng (link GitHub
  đổi route), không lỗi console.
- File đổi: `web/components/icons.js`, `web/app/globals.css`, `web/components/NewsCard.js`,
  `web/components/HeaderMenu.js` (mới), `web/components/Feed.js`, `web/lib/i18n.js`.
- Đã commit (`8d70576` pill, `d3a5fad` menu), đã push, Vercel tự deploy.

**Cần user tự kiểm tra trên production:** bấm nút Lưu và Chia sẻ trên thẻ tin thật, mở thử link
`/tin/<id>` được chia sẻ, xem tin có xuất hiện đúng ở `/da-luu` không.
