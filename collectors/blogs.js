// Collector: blog chính thức qua RSS/Atom (OpenAI, Google DeepMind, Hugging Face).
// Đọc được cả RSS 2.0 (<rss><channel><item>) lẫn Atom (<feed><entry>).

import { fetchText } from "../lib/http.js";
import { XMLParser } from "fast-xml-parser";
import { decodeHTML } from "entities";
import { BLOG_FEEDS, MAX_ITEMS_PER_SOURCE } from "../lib/config.js";

// Nới giới hạn "entity expansion" (mặc định 1000). Vài feed Atom (BAIR, Simon
// Willison) chứa rất nhiều HTML entity hợp lệ trong nội dung, vượt mức mặc định
// và bị chặn. Feed lấy từ nguồn tin cậy (URL cố định) nên nới an toàn; vẫn giữ
// trần hữu hạn để phòng feed dị thường.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: { enabled: true, maxTotalExpansions: 100000, maxExpandedLength: 5000000 },
});

function toArray(x) {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

// Bỏ thẻ HTML + gộp khoảng trắng (mô tả RSS thường lẫn HTML).
// decodeHTML 2 lần: vài feed (vd TechCrunch/WordPress) double-encode entity trong
// CDATA (vd "&amp;#8217;" -> XML parser chỉ decode 1 lớp ra "&#8217;" dạng chữ),
// 1 lần decode không đủ để ra ký tự thật ("'").
function clean(s) {
  if (typeof s === "object" && s) s = s["#text"] ?? "";
  if (typeof s !== "string") return "";
  const stripped = s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return decodeHTML(decodeHTML(stripped));
}

function toIso(d) {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t.toISOString();
}

async function collectOneFeed(feed) {
  const xml = await fetchText(feed.url);
  const doc = parser.parse(xml);

  const rssItems = toArray(doc?.rss?.channel?.item);
  const atomItems = toArray(doc?.feed?.entry);
  const isAtom = rssItems.length === 0 && atomItems.length > 0;
  const raw = (rssItems.length ? rssItems : atomItems).slice(0, MAX_ITEMS_PER_SOURCE);

  const items = raw.map((e) => {
    let link, guid, title, desc, date;
    if (isAtom) {
      const links = toArray(e.link);
      const alt = links.find((l) => l["@_rel"] === "alternate") || links[0];
      link = alt ? alt["@_href"] || "" : "";
      guid = e.id || link;
      title = clean(e.title);
      desc = clean(e.summary ?? e.content);
      date = e.updated || e.published;
    } else {
      link = clean(e.link);
      guid = clean(e.guid ?? link);
      title = clean(e.title);
      desc = clean(e.description ?? e["content:encoded"]);
      date = e.pubDate;
    }
    return {
      source: feed.slug,
      sourceId: guid || link,
      title,
      url: link,
      author: feed.name,
      publishedAt: toIso(date),
      score: null,
      extra: { publisher: feed.name, abstract: desc.slice(0, 500) },
    };
  });

  return items.filter((it) => it.title && it.url);
}

export async function collectBlogs() {
  const results = await Promise.allSettled(BLOG_FEEDS.map(collectOneFeed));
  const items = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") items.push(...r.value);
    else console.error(`  ⚠ Blog ${BLOG_FEEDS[i].name} lỗi: ${r.reason?.message || r.reason}`);
  });
  return items;
}
