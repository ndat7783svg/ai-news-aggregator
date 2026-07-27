export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { fetchItemsByIds } from "../../../lib/supabaseServer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") || "";

  // Parse danh sách id, giới hạn tối đa 200 để tránh lạm dụng.
  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 200);

  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const items = await fetchItemsByIds(ids);
  return NextResponse.json({ items });
}
