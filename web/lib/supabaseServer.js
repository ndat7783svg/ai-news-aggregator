import { createClient } from "@supabase/supabase-js";
import {
  sourcesForFilter,
  GITHUB_ALL_SOURCES,
  GITHUB_TRENDING_FAMILY,
} from "./filters";

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

// Chỉ 2 nguồn có "điểm độ nóng" thật (upvote).
const SCORED_SOURCES = new Set(["hackernews", "reddit"]);

// Trần cửa sổ ứng viên khi sắp theo "Nổi bật" hoặc khi dedupe GitHub.
const HOT_WINDOW = 1000;
const GITHUB_WINDOW = 2000;

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

// Sắp "Nổi bật nhất" cho tin thông thường (HN/Reddit lên đầu theo điểm).
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

// Sắp theo số sao giảm dần cho các nguồn GitHub.
function sortByStars(rows) {
  return [...rows].sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || cmpNewest(a, b));
}

// Kiểm tra danh sách nguồn có phải thuần các nguồn GitHub không.
function isPureGithubSources(sources) {
  if (!sources || sources.length === 0) return false;
  return sources.every((s) => GITHUB_ALL_SOURCES.includes(s));
}

// Dedupe repo trùng trong nhóm trending-family (giữ bản có published_at mới nhất).
function dedupeGithubTrendingFamily(rows) {
  const trendingMap = new Map();
  const releases = [];

  for (const item of rows) {
    if (GITHUB_TRENDING_FAMILY.includes(item.source)) {
      const key = item.title;
      if (!trendingMap.has(key)) {
        trendingMap.set(key, item);
      } else {
        const existing = trendingMap.get(key);
        const tNew = item.published_at ? Date.parse(item.published_at) : 0;
        const tOld = existing.published_at ? Date.parse(existing.published_at) : 0;
        if (tNew > tOld || (tNew === tOld && (item.score ?? 0) > (existing.score ?? 0))) {
          trendingMap.set(key, item);
        }
      }
    } else {
      releases.push(item);
    }
  }

  return [...trendingMap.values(), ...releases];
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

  // Nhánh đặc biệt cho nút cha "github" (gộp 6 nguồn): cần cửa sổ ứng viên + dedupe theo title ở JS.
  if (filter === "github") {
    let q = supabase
      .from("news_items")
      .select(COLUMNS)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(GITHUB_WINDOW);
    if (sources && sources.length) q = q.in("source", sources);
    if (cutoff) q = q.gte("published_at", cutoff);

    const { data, error } = await q;
    if (error) return { items: [], hasMore: false, error: error.message };

    const deduped = dedupeGithubTrendingFamily(data || []);
    const sorted = sort === "hot" ? sortByStars(deduped) : deduped.sort(cmpNewest);
    return {
      items: sorted.slice(offset, offset + limit),
      hasMore: offset + limit < sorted.length,
    };
  }

  // Nhánh sắp theo "Nổi bật nhất" (sort === "hot") cho các bộ lọc khác.
  if (sort === "hot") {
    let q = supabase
      .from("news_items")
      .select(COLUMNS)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(HOT_WINDOW);

    if (filter === "all") {
      q = q.not("source", "in", `(${GITHUB_ALL_SOURCES.join(",")})`);
    } else if (sources && sources.length) {
      q = q.in("source", sources);
    }

    if (cutoff) q = q.gte("published_at", cutoff);

    const { data, error } = await q;
    if (error) return { items: [], hasMore: false, error: error.message };

    const sorted = isPureGithubSources(sources)
      ? sortByStars(data || [])
      : sortHot(data || []);

    return {
      items: sorted.slice(offset, offset + limit),
      hasMore: offset + limit < sorted.length,
    };
  }

  // Nhánh sắp "Mới nhất" (sort === "new") cho các bộ lọc thông thường.
  let q = supabase
    .from("news_items")
    .select(COLUMNS)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === "all") {
    q = q.not("source", "in", `(${GITHUB_ALL_SOURCES.join(",")})`);
  } else if (sources && sources.length) {
    q = q.in("source", sources);
  }

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

/**
 * Lấy 1 tin theo id (cho trang chi tiết /tin/[id]).
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
export async function fetchItemById(id) {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("news_items")
    .select(COLUMNS)
    .eq("id", Number(id))
    .single();
  if (error || !data) return null;
  return data;
}

/**
 * Lấy nhiều tin theo mảng id (cho trang Đã lưu /da-luu).
 * @param {number[]} ids
 * @returns {Promise<object[]>}
 */
export async function fetchItemsByIds(ids) {
  const supabase = getClient();
  if (!supabase || !ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("news_items")
    .select(COLUMNS)
    .in("id", ids.map(Number));
  if (error || !data) return [];
  return data;
}
