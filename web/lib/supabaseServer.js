// Truy vấn Supabase phía server (dùng khoá anon, chỉ đọc). DÙNG CHUNG cho page.js và API route.
// KHÔNG import file này vào client component (chứa khoá phía server).

import { createClient } from "@supabase/supabase-js";
import { sourcesForFilter } from "./filters";

const COLUMNS =
  "id, source, title, url, author, published_at, score, summary_vi, summary_en";

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

/**
 * Lấy 1 trang tin, sắp theo thời gian đăng mới nhất (id giảm dần để phân trang ổn định).
 * @param {{ filter?: string, offset?: number, limit?: number }} opts
 * @returns {Promise<{items: Array, hasMore: boolean, configMissing?: boolean, error?: string}>}
 */
export async function fetchItems({ filter = "all", offset = 0, limit = 40 } = {}) {
  const supabase = getClient();
  if (!supabase) return { items: [], hasMore: false, configMissing: true };

  let q = supabase
    .from("news_items")
    .select(COLUMNS)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const sources = sourcesForFilter(filter);
  if (sources && sources.length) q = q.in("source", sources);

  const { data, error } = await q;
  if (error) return { items: [], hasMore: false, error: error.message };
  return { items: data || [], hasMore: (data || []).length === limit };
}
