# Thiết kế: Nút "Lưu" (danh sách localStorage) + nút "Chia sẻ" (trang chi tiết từng tin)

**Ngày:** 27/07/2026
**Bối cảnh:** Web không có login/tài khoản (CLAUDE.md mục 4, đừng đề xuất lại). User muốn: (1)
lưu tin vào danh sách cá nhân để xem lại sau, kiểu YouTube/Facebook nhưng không cần đăng nhập;
(2) chia sẻ tin ra ngoài sao cho link dẫn VỀ trang BAI News (tăng traffic quay lại), không chia
sẻ thẳng link bài gốc.

## Quyết định đã chốt (đừng đề xuất lại hướng khác)
- **Không dùng backend/tài khoản cho việc lưu tin** — toàn bộ danh sách lưu trong
  `localStorage` phía trình duyệt người dùng. Đơn giản, khớp quyết định "chưa làm login".
- **Chia sẻ trỏ về trang chi tiết riêng từng tin** (`/tin/[id]`), KHÔNG chia sẻ thẳng link bài
  gốc, KHÔNG chỉ chia sẻ link trang chủ kèm text. Cần tạo route mới.
- **Luồng lưu tin:** bấm nút là lưu ngay vào danh sách mặc định "Đã lưu" (không hỏi gì, giống
  nút tim Facebook / Save nhanh YouTube). Tạo/chọn danh sách khác là thao tác phụ qua popup mở
  từ 1 nút mũi tên nhỏ cạnh nút Lưu, KHÔNG bắt chọn danh sách ngay từ lần bấm đầu tiên.
- **Chia sẻ dùng Web Share API trước, fallback copy link:** `navigator.share()` nếu trình duyệt
  hỗ trợ (chủ yếu mobile) → mở đúng menu chia sẻ native (Zalo/Messenger/Facebook...); nếu không
  hỗ trợ (đa số desktop) → tự động `navigator.clipboard.writeText()` + hiện thông báo "Đã copy
  link".
- **Phạm vi lần này CHỈ áp dụng cho trang chủ** (`web/components/NewsCard.js`). KHÔNG áp dụng
  cho `/github-ai`, `/en/github-ai` (dùng component riêng `GithubAiList.js`, không đụng vào) —
  có thể làm sau nếu hiệu quả.
- **Danh sách đã lưu KHÔNG cache bản sao tiêu đề/tóm tắt trong localStorage** — chỉ lưu `itemId`,
  khi vào trang "Đã lưu" thì gọi API lấy dữ liệu MỚI NHẤT từ Supabase theo id. Lý do: tránh hiện
  dữ liệu cũ nếu sau này có backfill sửa `title_vi`/tóm tắt.

## Kiến trúc

### A. Dữ liệu localStorage
Khoá `bai_saved_lists` (đặt tên tránh đụng khoá `theme`/`lang` đã dùng), cấu trúc:
```js
{
  lists: {
    "default": { name: "Đã lưu", createdAt: "2026-07-27T..." },
    // thêm danh sách khác do người dùng tự tạo, key = id ngẫu nhiên (vd crypto.randomUUID())
  },
  saved: [
    { itemId: 123, listId: "default", savedAt: "2026-07-27T..." },
  ],
}
```
Viết 1 module tiện ích mới `web/lib/savedLists.js` (client-only, không `"use client"` vì không
phải component — chỉ là hàm thuần, được import bởi các client component khác) với các hàm:
`getState()`, `saveItem(itemId, listId="default")`, `removeItem(itemId, listId)`,
`createList(name)`, `renameList(listId, name)`, `deleteList(listId)` (xoá cả các bản ghi `saved`
thuộc list đó, KHÔNG cho xoá `"default"`), `isSaved(itemId)`, `getListsForItem(itemId)`. Mọi hàm
đọc/ghi trực tiếp `localStorage`, tự bọc try/catch (localStorage có thể bị chặn ở chế độ ẩn danh
— lỗi thì coi như không lưu được, không crash trang).

### B. Nút Lưu trong `NewsCard.js`
- Thêm 2 icon nhỏ vào `.card-bottom`, cạnh nút "Đọc bài gốc": 🔖 (Lưu) và 🔗 (Chia sẻ).
- `NewsCard` cần chuyển sang theo dõi state đã lưu chưa (`useState` + đọc `isSaved(item.id)` lúc
  mount) — nghĩa là `NewsCard.js` phải thêm `"use client"` nếu hiện tại đang là phần của cây
  client (đã nằm trong `Feed.js` vốn là `"use client"`, nên bản thân `NewsCard` render trong môi
  trường client — cứ thêm hook state bình thường, không cần đổi gì về "use client" vì nó không
  tự có directive riêng, kế thừa từ cha).
- Bấm 🔖: nếu chưa lưu → `saveItem(item.id)`, đổi icon sang trạng thái "đã lưu" (fill màu). Nếu
  đã lưu → bấm lại = bỏ lưu khỏi TẤT CẢ danh sách đang chứa nó (thao tác nhanh, đối xứng với lưu
  nhanh).
- Mũi tên nhỏ cạnh 🔖 mở 1 popup đơn giản (component mới `web/components/SaveListPopup.js`):
  liệt kê danh sách hiện có (checkbox mỗi danh sách, tick = tin đang nằm trong danh sách đó),
  ô nhập tên + nút "Tạo danh sách mới" ở cuối. Đóng popup khi click ra ngoài (giống pattern đơn
  giản, không cần thư viện modal ngoài).
- Bấm 🔗: gọi hàm `shareItem(item, lang)` (đặt trong `web/lib/share.js`):
  ```js
  const url = `https://bainews.site/tin/${item.id}`;
  const title = lang === "vi" ? item.title_vi || item.title : item.title;
  const text = (lang === "vi" ? item.summary_vi : item.summary_en)?.slice(0, 120);
  if (navigator.share) {
    navigator.share({ url, title, text }).catch(() => {}); // user bấm huỷ popup share → im lặng
  } else {
    navigator.clipboard.writeText(url);
    // hiện toast "Đã copy link"
  }
  ```

### C. Trang chi tiết `/tin/[id]`
Route mới `web/app/tin/[id]/page.js` — Server Component:
- `fetchItemById(id)` (hàm mới trong `web/lib/supabaseServer.js`, `select(COLUMNS).eq("id",
  id).single()`). Nếu không tìm thấy (id sai/đã xoá — hiện tại KHÔNG có cơ chế xoá tin nên
  trường hợp này hiếm) → gọi `notFound()` của Next.js (trang 404 mặc định).
- `generateMetadata({ params })`: `title`/`description` lấy từ tin đó (dùng `title_vi`/
  `summary_vi` mặc định vì phần lớn traffic là người Việt — trang này KHÔNG làm 2 bản ngôn ngữ
  riêng như `/github-ai`, chỉ 1 route, nội dung hiển thị theo `lang` client-side giống trang chủ).
- Nội dung: badge nguồn, ★/▲ điểm nếu có, thời gian, tiêu đề, tóm tắt ĐẦY ĐỦ (không cắt), nút
  "Đọc bài gốc" (`item.url`), link "← Về trang chủ". Đọc `lang` qua `localStorage` trong 1
  Client Component con nhỏ (tương tự cách `Feed.js` đọc lúc mount) — vì Server Component không
  biết `localStorage`; nếu chưa có `lang` lưu (khách mới từ link chia sẻ) → mặc định tiếng Việt.
- KHÔNG có nút Lưu/Chia sẻ lặp lại trên chính trang chi tiết (đã ở đó rồi) — chỉ cần nút Lưu là
  đủ, có thể thêm cho tiện nhưng không bắt buộc; nếu thêm thì tái dùng `NewsCard.js` luôn thay vì
  viết layout riêng cho nhất quán.

### D. Trang "Đã lưu" `/da-luu`
Route mới `web/app/da-luu/page.js` — Client Component (cần đọc localStorage + gọi API):
- Lúc mount: đọc `saved` từ `localStorage` qua `savedLists.js`, gom danh sách `itemId`, gọi
  `GET /api/saved-items?ids=1,2,3`.
- API route mới `web/app/api/saved-items/route.js`: nhận `ids` (chuỗi số cách nhau bởi dấu
  phẩy, giới hạn tối đa 200 id/lần để tránh lạm dụng), gọi `fetchItemsByIds(ids)` (hàm mới
  trong `supabaseServer.js`, `select(COLUMNS).in("id", ids)`), trả JSON mảng items. Bắt buộc
  `export const dynamic = "force-dynamic"` + `export const fetchCache = "force-no-store"` (bài
  học đã ghi CLAUDE.md mục 5 — mọi route API mới đọc Supabase phải có cả 2 dòng này).
- Giao diện: chia theo từng danh sách (tiêu đề = tên danh sách, có thể đổi tên/xoá danh sách trừ
  "Đã lưu" mặc định không xoá được), mỗi danh sách hiện các thẻ tin (tái dùng `NewsCard.js`),
  mỗi thẻ có thêm nút "Bỏ lưu" nhanh (gọi `removeItem`).
- Nếu chưa lưu tin nào: hiện thông báo trống ("Chưa có tin nào được lưu.").

### E. Cập nhật `web/lib/i18n.js`
Thêm các khoá dịch mới cần dùng: nhãn nút Lưu/Đã lưu/Chia sẻ/Đã copy link/Lưu vào danh sách
khác/Tạo danh sách mới/Đổi tên/Xoá danh sách/Bỏ lưu/Chưa có tin nào được lưu — cả 2 ngôn ngữ
VI/EN (trang chủ đang hỗ trợ song ngữ đầy đủ, tính năng mới phải theo đúng, không được bỏ sót
như bug i18n đã từng xảy ra — xem `HANDOFF.md` mục sửa bug 27/07).

## Rủi ro / lưu ý kỹ thuật
- `localStorage` không hoạt động ở chế độ duyệt web ẩn danh nghiêm ngặt (Safari private mode có
  thể chặn) — mọi hàm trong `savedLists.js` phải bọc try/catch, lỗi thì coi như thao tác lưu
  không thành công (không throw làm crash trang).
- `navigator.share`/`navigator.clipboard` chỉ hoạt động trên context bảo mật (`https://` hoặc
  `localhost`) — khi test local qua `http://localhost:3000` vẫn được vì localhost được trình
  duyệt coi là an toàn, không cần lo.
- Route `/tin/[id]` không có trang 404 tuỳ chỉnh sẵn — dùng mặc định của Next.js là đủ, không cần
  làm thêm.

## KHÔNG làm trong lần này
- Không đồng bộ danh sách lưu giữa nhiều thiết bị (cần tài khoản — ngoài phạm vi, đã chốt CLAUDE.md
  mục 4 "chưa làm login").
- Không thêm nút Lưu/Chia sẻ vào `/github-ai`, `/en/github-ai` (`GithubAiList.js`) — làm sau nếu
  cần, không phải lần này.
- Không làm ảnh Open Graph tuỳ chỉnh riêng cho `/tin/[id]` (đã biết lỗi `next/og` trên Windows —
  xem CLAUDE.md mục 2, không gấp).
- Không đổi collector/pipeline, không đổi schema Supabase (`db/schema.sql`) — chỉ đọc dữ liệu có
  sẵn qua cột `id` đã có.
- Không tự ý push thẳng lên `main` nếu chưa qua review.

## Tiêu chí hoàn thành
- `cd web && npm run dev`: mỗi thẻ tin trên trang chủ có 2 icon 🔖/🔗 cạnh "Đọc bài gốc".
- Bấm 🔖 trên 1 tin → icon đổi trạng thái "đã lưu" ngay, không tải lại trang. Bấm lại → bỏ lưu,
  icon trở về trạng thái ban đầu.
- Bấm mũi tên cạnh 🔖 → popup hiện, tạo được danh sách mới, tick được vào danh sách đó, tin xuất
  hiện đúng trong danh sách đó khi vào `/da-luu`.
- Vào `/da-luu`: thấy đúng các tin đã lưu, chia đúng theo danh sách, đổi tên/xoá danh sách hoạt
  động, xoá danh sách "Đã lưu" mặc định bị chặn (không có nút xoá hoặc bấm báo lỗi rõ ràng).
  Tải lại trang (F5) → dữ liệu vẫn còn (do đọc lại từ `localStorage`).
- Bấm 🔗 trên điện thoại thật (hoặc giả lập bằng DevTools mobile) → mở đúng menu chia sẻ native.
  Trên desktop (Chrome bình thường) → link được copy vào clipboard, có thông báo xác nhận.
- Vào thẳng `https://bainews.site/tin/<id>` (hoặc `localhost:3000/tin/<id>` lúc dev) của 1 tin có
  thật → thấy đúng tiêu đề, tóm tắt đầy đủ, nút đọc bài gốc hoạt động, link "Về trang chủ" hoạt
  động. View source thấy `<title>`/`<meta description>` đúng theo tin đó (không phải tiêu đề
  chung chung của trang chủ).
- Chuyển VI/EN trên trang chủ → toàn bộ nhãn nút mới (Lưu/Chia sẻ/danh sách...) đổi ngôn ngữ đúng
  theo `t(lang, ...)`, không có chữ nào bị sót lại tiếng Việt/Anh cứng.
- `npm run build` chạy sạch, không lỗi.
