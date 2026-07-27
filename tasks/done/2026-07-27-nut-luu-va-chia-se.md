# Thêm nút "Lưu" (danh sách localStorage) + nút "Chia sẻ" (trang chi tiết /tin/[id])

## Mục tiêu
Thêm 2 nút cạnh mỗi tin trên trang chủ: 🔖 Lưu tin vào danh sách cá nhân (lưu trong trình duyệt,
không cần đăng nhập) để xem lại sau, và 🔗 Chia sẻ tin — link chia sẻ dẫn về trang chi tiết
riêng trên BAI News (không dẫn thẳng ra bài gốc), giúp người nhận link quay lại web thay vì đi
thẳng sang nguồn khác.

## Bối cảnh
Thiết kế đầy đủ đã bàn kỹ với user và chốt tại:
**`docs/superpowers/specs/2026-07-27-save-share-buttons-design.md`** — ĐỌC FILE NÀY TRƯỚC, nó
có toàn bộ quyết định kiến trúc (cấu trúc dữ liệu localStorage, luồng UI, route mới...). Task
này chỉ tóm tắt lại thành checklist thực thi.

Các quyết định đã chốt, ĐỪNG đề xuất lại:
- KHÔNG dùng backend/tài khoản để lưu tin — toàn bộ trong `localStorage` (đã chốt "chưa làm
  login" ở CLAUDE.md mục 4).
- Bấm 🔖 là lưu ngay vào danh sách mặc định "Đã lưu" (không hỏi gì) — tạo/chọn danh sách khác là
  thao tác phụ qua popup mở từ nút mũi tên riêng, KHÔNG bắt chọn ngay từ lần bấm đầu.
- Chia sẻ dùng `navigator.share()` trước, fallback copy link vào clipboard.
- Danh sách "Đã lưu" KHÔNG cache tiêu đề/tóm tắt trong localStorage — chỉ lưu `itemId`, luôn gọi
  API lấy dữ liệu mới nhất.
- Lần này CHỈ áp dụng cho trang chủ (`NewsCard.js`) — KHÔNG đụng `GithubAiList.js`
  (`/github-ai`, `/en/github-ai`).

## Việc cần làm

### 1. Module tiện ích localStorage
- [ ] Tạo `web/lib/savedLists.js`: các hàm `getState()`, `saveItem(itemId, listId="default")`,
  `removeItem(itemId, listId)`, `createList(name)`, `renameList(listId, name)`,
  `deleteList(listId)` (chặn xoá `"default"`), `isSaved(itemId)`, `getListsForItem(itemId)`.
  Đọc/ghi khoá `localStorage` tên `bai_saved_lists`, cấu trúc đúng như mô tả trong spec mục A.
  Bọc try/catch mọi thao tác (localStorage có thể bị chặn ở chế độ ẩn danh — lỗi thì coi như
  không lưu được, không crash trang).

### 2. Module chia sẻ
- [ ] Tạo `web/lib/share.js`: hàm `shareItem(item, lang)` — dùng `navigator.share()` nếu có,
  fallback `navigator.clipboard.writeText()`. URL chia sẻ = `https://bainews.site/tin/${item.id}`
  (xem code mẫu đầy đủ trong spec mục B).

### 3. `web/lib/supabaseServer.js`
- [ ] Thêm `fetchItemById(id)`: `select(COLUMNS).eq("id", id).single()`.
- [ ] Thêm `fetchItemsByIds(ids)`: `select(COLUMNS).in("id", ids)`, trả mảng items.

### 4. Trang chi tiết `web/app/tin/[id]/page.js`
- [ ] Server Component, gọi `fetchItemById(params.id)`; không tìm thấy → `notFound()`.
- [ ] `generateMetadata({ params })` lấy title/description từ chính tin đó (dùng `title_vi`/
  `summary_vi` mặc định).
- [ ] Hiển thị: badge nguồn, điểm (nếu có), thời gian, tiêu đề, tóm tắt đầy đủ, nút "Đọc bài
  gốc" (`item.url`), link "← Về trang chủ".
- [ ] Ngôn ngữ hiển thị (VI/EN) đọc theo `localStorage.lang` giống trang chủ — nếu khách mới
  chưa có lưu gì thì mặc định tiếng Việt (xem spec mục C).

### 5. API route `web/app/api/saved-items/route.js`
- [ ] Nhận query `ids` (chuỗi số cách nhau dấu phẩy, giới hạn tối đa 200 id/lần), gọi
  `fetchItemsByIds`, trả JSON.
- [ ] BẮT BUỘC thêm cả `export const dynamic = "force-dynamic";` VÀ
  `export const fetchCache = "force-no-store";` (bài học CLAUDE.md mục 5 — thiếu dòng thứ 2 sẽ
  bị Next.js Data Cache đóng băng kết quả).

### 6. `web/components/NewsCard.js`
- [ ] Thêm 2 icon vào `.card-bottom`, cạnh nút "Đọc bài gốc": 🔖 (Lưu) và 🔗 (Chia sẻ).
- [ ] 🔖: đọc `isSaved(item.id)` lúc mount (dùng `useState`+`useEffect`), bấm → lưu/bỏ lưu, đổi
  icon ngay không cần tải lại trang.
- [ ] Nút mũi tên nhỏ cạnh 🔖 → mở popup (component mới, xem mục 7).
- [ ] 🔗: gọi `shareItem(item, lang)`; nếu rơi vào nhánh copy link, hiện toast/thông báo ngắn
  "Đã copy link" (tái dùng cách hiện thông báo đang có trong codebase nếu có, không cần thêm
  thư viện toast ngoài).

### 7. `web/components/SaveListPopup.js` (component mới)
- [ ] Popup đơn giản: liệt kê danh sách hiện có (checkbox, tick = tin đang trong danh sách đó),
  ô nhập tên + nút "Tạo danh sách mới". Đóng khi click ra ngoài popup.

### 8. Trang "Đã lưu" `web/app/da-luu/page.js`
- [ ] Client Component: lúc mount đọc `saved` từ `savedLists.js`, gọi
  `/api/saved-items?ids=...`.
- [ ] Hiển thị chia theo từng danh sách (tên danh sách làm tiêu đề), mỗi danh sách render các
  thẻ tin bằng `NewsCard.js`, thêm nút "Bỏ lưu" nhanh trên mỗi thẻ.
- [ ] Đổi tên/xoá danh sách (trừ "Đã lưu" mặc định — không cho xoá).
- [ ] Chưa lưu tin nào → hiện thông báo trống "Chưa có tin nào được lưu."

### 9. `web/lib/i18n.js`
- [ ] Thêm đủ khoá dịch VI/EN cho: Lưu/Đã lưu, Chia sẻ, Đã copy link, Lưu vào danh sách khác,
  Tạo danh sách mới, Đổi tên, Xoá danh sách, Bỏ lưu, Chưa có tin nào được lưu. KHÔNG được sót
  bản dịch nào (đã từng có bug thiếu i18n — xem `HANDOFF.md` mục sửa bug 27/07, đừng lặp lại).

## Tiêu chí hoàn thành / cách verify
- `cd web && npm run dev`: mỗi thẻ tin trang chủ có 2 icon 🔖/🔗 cạnh "Đọc bài gốc".
- Bấm 🔖 → icon đổi trạng thái ngay, không tải lại trang; bấm lại → bỏ lưu, icon trở lại ban đầu.
- Mũi tên cạnh 🔖 → popup hiện đúng, tạo danh sách mới hoạt động, tick vào danh sách → tin xuất
  hiện đúng trong danh sách đó khi vào `/da-luu`.
- `/da-luu`: tin hiện đúng, chia đúng theo danh sách, đổi tên/xoá danh sách hoạt động (trừ
  "Đã lưu" mặc định không xoá được), tải lại trang (F5) dữ liệu vẫn còn.
- Bấm 🔗 trên desktop Chrome → link copy vào clipboard + có thông báo. (Test Web Share API thật
  trên điện thoại nếu tiện, không bắt buộc nếu không có thiết bị.)
- Vào `/tin/<id>` của 1 tin có thật (thay `<id>` bằng id thật trong DB) → tiêu đề/tóm tắt đúng,
  nút đọc bài gốc + link về trang chủ hoạt động. View source thấy `<title>`/`<meta
  description>` đúng theo tin đó.
- Chuyển VI/EN trên trang chủ → mọi nhãn nút mới đổi ngôn ngữ đúng, không sót chữ cứng.
- `npm run build` chạy sạch, không lỗi.

## KHÔNG được làm
- Không đồng bộ danh sách lưu giữa nhiều thiết bị/tài khoản.
- Không thêm nút Lưu/Chia sẻ vào `/github-ai`, `/en/github-ai` (`GithubAiList.js`) — ngoài phạm
  vi task này.
- Không làm ảnh Open Graph tuỳ chỉnh riêng cho `/tin/[id]` (lỗi `next/og` trên Windows đã biết,
  không gấp — xem CLAUDE.md mục 2).
- Không đổi collector/pipeline (`collectors/*.js`, `pipeline.js`, `summarizer.js`).
- Không đổi schema Supabase (`db/schema.sql`) hay logic trong `web/lib/filters.js`,
  `web/lib/format.js` — chỉ thêm hàm mới vào `web/lib/supabaseServer.js` như mô tả, không sửa
  hàm cũ.
- Không tự ý push thẳng lên `main` nếu chưa qua review — tạo commit rõ ràng để Claude Code kiểm
  tra bằng `git diff` trước khi coi là xong.
