// Collector: Hacker News (lọc tin AI) qua Algolia HN Search API.
// Tài liệu: https://hn.algolia.com/api  — API tìm kiếm chính thức của HN, miễn phí, không cần key.

import { fetchJson } from "../lib/http.js";
import {
  HN_SEARCH_TERMS,
  AI_KEYWORDS,
  RECENT_WINDOW_HOURS,
  MAX_ITEMS_PER_SOURCE,
} from "../lib/config.js";

const ALGOLIA_ENDPOINT = "https://hn.algolia.com/api/v1/search_by_date";

/** Tiêu đề có chứa ít nhất một từ khoá AI không? (so khớp chữ thường) */
function looksLikeAI(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Chuẩn hoá 1 hit Algolia về khuôn dữ liệu chung. */
function toItem(h) {
  const hnUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
  return {
    source: "hackernews",
    sourceId: String(h.objectID),
    title: h.title,
    url: h.url || hnUrl, // Ask/Show HN không có url ngoài -> trỏ về trang HN
    author: h.author ?? null,
    publishedAt: h.created_at ?? null,
    score: typeof h.points === "number" ? h.points : null,
    extra: {
      numComments: typeof h.num_comments === "number" ? h.num_comments : 0,
      hnUrl,
    },
  };
}

/** Gọi Algolia cho 1 từ khoá, chỉ lấy story trong cửa sổ thời gian gần đây. */
async function searchTerm(term, sinceTs) {
  const params = new URLSearchParams({
    query: term,
    tags: "story",
    numericFilters: `created_at_i>${sinceTs}`,
    hitsPerPage: "50",
  });
  const data = await fetchJson(`${ALGOLIA_ENDPOINT}?${params.toString()}`);
  return Array.isArray(data.hits) ? data.hits : [];
}

/**
 * Thu thập tin AI mới từ Hacker News.
 * Gọi từng từ khoá riêng (Algolia không hỗ trợ OR) rồi gộp + khử trùng theo objectID.
 * @returns {Promise<Array>} mảng item theo khuôn dữ liệu chung.
 */
export async function collectHackerNews() {
  const sinceTs = Math.floor(Date.now() / 1000) - RECENT_WINDOW_HOURS * 3600;

  const results = await Promise.all(
    HN_SEARCH_TERMS.map((term) => searchTerm(term, sinceTs))
  );

  // Gộp mọi hit, khử trùng theo objectID (một bài có thể khớp nhiều từ khoá).
  const byId = new Map();
  for (const hit of results.flat()) {
    if (hit?.title && !byId.has(hit.objectID)) byId.set(hit.objectID, hit);
  }

  const items = [...byId.values()]
    // Giữ lại story có tiêu đề "ra dáng" AI để tăng độ chính xác khi xem.
    .filter((h) => looksLikeAI(h.title))
    .map(toItem);

  // Sắp theo điểm giảm dần để tin nổi bật lên đầu, rồi cắt bớt.
  items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return items.slice(0, MAX_ITEMS_PER_SOURCE);
}
