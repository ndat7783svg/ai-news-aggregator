// Truy vấn Supabase phía server (dùng khoá anon, chỉ đọc). DÙNG CHUNG cho page.js và API route.
// KHÔNG import file này vào client component (chứa khoá phía server).

import { createClient } from "@supabase/supabase-js";
import { sourcesForFilter } from "./filters";

const COLUMNS =
  "id, source, title, title_vi, url, author, published_at, score, summary_vi, summary_en, extra";

// Làm sạch biến môi trường (lỡ dán cả "TÊN=", dấu nháy, khoảng trắng thừa).
function cleanSecret(raw, name) {
  return raw
    .trim()
    .replace(new RegExp("^" + name + "\\s*=\\s*", "i"), "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function getClient() {
  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_ANON_KEY;
  if (!rawUrl || !rawKey) return null;
  const url = cleanSecret(rawUrl, "SUPABASE_URL")
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
  const key = cleanSecret(rawKey, "SUPABASE_ANON_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Chỉ 2 nguồn có "điểm độ nóng" thật (upvote). GitHub Trending có số sao nhưng
// theo thiết kế KHÔNG dùng để xếp hạng (khác thang đo) → coi như không điểm.
const SCORED_SOURCES = new Set(["hackernews", "reddit"]);

// Trần cửa sổ ứng viên khi sắp theo "Nổi bật" (giới hạn 1 request của PostgREST).
// Ở quy mô hiện tại (hàng trăm tin) là dư; kết hợp bộ lọc thời gian còn nhỏ hơn.
const HOT_WINDOW = 1000;

// Mốc thời gian (published_at >= now - N ngày). null = "Mọi lúc" (không lọc).
function timeCutoffISO(time) {
  const days = { today: 1, week: 7, month: 30, year: 365 }[time];
  if (!days) return null;
  return new Date(Date.now() - days * 86400 * 1000).toISOString();
}

// So sánh theo thời gian đăng mới nhất, rồi id (ổn định khi trùng thời gian).
function cmpNewest(a, b) {
  const ta = a.published_at ? Date.parse(a.published_at) : 0;
  const tb = b.published_at ? Date.parse(b.published_at) : 0;
  return tb - ta || b.id - a.id;
}

// Sắp "Nổi bật nhất": tin có điểm (HN/Reddit) lên đầu theo điểm giảm dần;
// các nguồn không có điểm xuống cuối, xếp theo mới nhất. KHÔNG loại bỏ tin nào.
function sortHot(rows) {
  const scored = [];
  const rest = [];
  for (const r of rows) {
    if (SCORED_SOURCES.has(r.source) && typeof r.score === "number") scored.push(r);
    else rest.push(r);
  }
  scored.sort((a, b) => b.score - a.score || cmpNewest(a, b));
  rest.sort(cmpNewest);
  return [...scored, ...rest];
}

/**
 * Lấy 1 trang tin, kết hợp lọc nguồn + lọc thời gian + chế độ sắp xếp.
 * @param {{ filter?: string, sort?: "new"|"hot", time?: string, offset?: number, limit?: number }} opts
 * @returns {Promise<{items: Array, hasMore: boolean, configMissing?: boolean, error?: string}>}
 */
export async function fetchItems({
  filter = "all",
  sort = "new",
  time = "all",
  offset = 0,
  limit = 40,
} = {}) {
  const supabase = getClient();
  if (!supabase) return { items: [], hasMore: false, configMissing: true };

  const sources = sourcesForFilter(filter);
  const cutoff = timeCutoffISO(time);

  if (sort === "hot") {
    // Không phân trang được ở DB (thứ tự điểm có điều kiện) → lấy cửa sổ ứng viên,
    // sắp ở JS rồi cắt đúng trang. Ứng viên lấy theo mới nhất để bám tin gần đây.
    let q = supabase
      .from("news_items")
      .select(COLUMNS)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(HOT_WINDOW);
    if (sources && sources.length) q = q.in("source", sources);
    if (cutoff) q = q.gte("published_at", cutoff);

    const { data, error } = await q;
    if (error) return { items: [], hasMore: false, error: error.message };
    const sorted = sortHot(data || []);
    return {
      items: sorted.slice(offset, offset + limit),
      hasMore: offset + limit < sorted.length,
    };
  }

  // "Mới nhất" (mặc định): phân trang hiệu quả ngay ở DB.
  let q = supabase
    .from("news_items")
    .select(COLUMNS)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);
  if (sources && sources.length) q = q.in("source", sources);
  if (cutoff) q = q.gte("published_at", cutoff);

  const { data, error } = await q;
  if (error) return { items: [], hasMore: false, error: error.message };
  return { items: data || [], hasMore: (data || []).length === limit };
}

/**
 * Lấy danh sách các NGUỒN thực sự có tin trong DB (để quyết định hiện nút lọc nào).
 * Quét cột source của ~2000 tin mới nhất (nhẹ) rồi khử trùng.
 * @returns {Promise<string[]>}
 */
export async function fetchAvailableSources() {
  const supabase = getClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("news_items")
    .select("source")
    .order("id", { ascending: false })
    .limit(2000);
  if (error || !data) return [];
  return [...new Set(data.map((r) => r.source))];
}
