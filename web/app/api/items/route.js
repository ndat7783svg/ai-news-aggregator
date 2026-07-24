// API phân trang cho infinite scroll. Client gọi: /api/items?filter=<key>&offset=<n>&limit=<n>
// Chạy phía server, đọc Supabase bằng khoá anon (không lộ khoá ra trình duyệt).

import { fetchItems } from "../../../lib/supabaseServer";
import { PAGE_SIZE } from "../../../lib/filters";

export const dynamic = "force-dynamic"; // render động (không cache kết quả route)
// QUAN TRỌNG: force-dynamic KHÔNG tự tắt cache cho từng fetch bên trong. Supabase đọc qua
// fetch nên bị Next Data Cache "đóng băng" theo từng URL truy vấn (mỗi bộ lọc/sắp xếp/thời
// gian là 1 URL) → tin mới không hiện khi lọc theo nguồn. Ép mọi fetch trong route = no-store.
export const fetchCache = "force-no-store"; // luôn đọc dữ liệu sống từ Supabase

const ALLOWED_TIME = new Set(["all", "today", "week", "month", "year"]);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";
  const sort = searchParams.get("sort") === "hot" ? "hot" : "new";
  const timeParam = searchParams.get("time") || "all";
  const time = ALLOWED_TIME.has(timeParam) ? timeParam : "all";
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10) || PAGE_SIZE)
  );

  const result = await fetchItems({ filter, sort, time, offset, limit });
  return Response.json(result);
}
