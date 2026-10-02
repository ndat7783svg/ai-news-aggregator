// Nhận 1 lượt bấm vào tin (ẩn danh) từ ClickTracker → ghi bảng click_events.
// Không lưu IP / tài khoản. Lỗi thì im lặng trả 204 (đếm lượt bấm không được làm phiền người đọc).

import { logClick } from "../../../lib/supabaseServer";
import { PLACEMENTS, categoryOf } from "../../../lib/track";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;

export async function POST(request) {
  try {
    if (BOT_UA.test(request.headers.get("user-agent") || "")) {
      return new Response(null, { status: 204 });
    }
    const body = await request.json();
    const source = typeof body.source === "string" ? body.source.slice(0, 40) : "";
    const placement = PLACEMENTS.includes(body.placement) ? body.placement : null;
    if (!source || !placement) return new Response(null, { status: 204 });

    await logClick({
      item_id: Number.isInteger(body.itemId) ? body.itemId : null,
      source,
      category: categoryOf(source),
      placement,
      lang: body.lang === "en" ? "en" : "vi",
      device: body.device === "mobile" ? "mobile" : "desktop",
    });
  } catch {}
  return new Response(null, { status: 204 });
}
