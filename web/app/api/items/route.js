// API phân trang cho infinite scroll. Client gọi: /api/items?filter=<key>&offset=<n>&limit=<n>
// Chạy phía server, đọc Supabase bằng khoá anon (không lộ khoá ra trình duyệt).

import { fetchItems } from "../../../lib/supabaseServer";
import { PAGE_SIZE } from "../../../lib/filters";

export const dynamic = "force-dynamic"; // luôn lấy dữ liệu mới

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10) || PAGE_SIZE)
  );

  const result = await fetchItems({ filter, offset, limit });
  return Response.json(result);
}
