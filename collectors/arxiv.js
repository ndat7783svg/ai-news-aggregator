// Collector: arXiv (cs.AI, cs.LG, cs.RO) qua arXiv API chính thức (Atom XML).
// Tài liệu: https://info.arxiv.org/help/api  — miễn phí, không cần key.

import { fetchText } from "../lib/http.js";
import { XMLParser } from "fast-xml-parser";
import { ARXIV_CATEGORIES, MAX_ITEMS_PER_SOURCE } from "../lib/config.js";

const ARXIV_ENDPOINT = "http://export.arxiv.org/api/query";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

/** Ép giá trị về mảng: arXiv trả object khi chỉ có 1 phần tử, mảng khi nhiều. */
function toArray(x) {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

/** Gộp nhiều khoảng trắng/xuống dòng thành 1 dấu cách. */
function cleanText(s) {
  return typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
}

/**
 * Thu thập bài mới nhất từ arXiv theo các chuyên mục cấu hình.
 * @returns {Promise<Array>} mảng item theo khuôn dữ liệu chung.
 */
export async function collectArxiv() {
  const searchQuery = ARXIV_CATEGORIES.map((c) => `cat:${c}`).join("+OR+");
  const params = new URLSearchParams({
    sortBy: "submittedDate",
    sortOrder: "descending",
    max_results: String(MAX_ITEMS_PER_SOURCE),
  });
  // search_query phải ghép thủ công vì "+OR+" không được encode lại.
  const url = `${ARXIV_ENDPOINT}?search_query=${searchQuery}&${params.toString()}`;

  const xml = await fetchText(url);
  const parsed = parser.parse(xml);
  const entries = toArray(parsed?.feed?.entry);

  return entries.map((e) => {
    // e.id dạng "http://arxiv.org/abs/2401.12345v1" -> lấy phần id sau /abs/
    const absUrl = typeof e.id === "string" ? e.id : "";
    const sourceId = absUrl.split("/abs/")[1] || absUrl;

    // Link PDF (nếu có) nằm trong mảng link với title="pdf".
    const links = toArray(e.link);
    const pdf = links.find((l) => l["@_title"] === "pdf");

    const authors = toArray(e.author)
      .map((a) => cleanText(a?.name))
      .filter(Boolean);
    const categories = toArray(e.category)
      .map((c) => c["@_term"])
      .filter(Boolean);

    return {
      source: "arxiv",
      sourceId,
      title: cleanText(e.title),
      url: absUrl, // trang tóm tắt bài gốc trên arXiv
      author: authors.join(", ") || null,
      publishedAt: e.published ?? null,
      score: null,
      extra: {
        abstract: cleanText(e.summary),
        categories,
        pdfUrl: pdf ? pdf["@_href"] : null,
      },
    };
  });
}
