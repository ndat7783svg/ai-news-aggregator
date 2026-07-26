// Định nghĩa bộ lọc nguồn — DÙNG CHUNG cho client (Feed) và server (API/page).
// 13 blog/báo được chia làm 3 nhóm chủ đề: hãng AI / báo công nghệ / newsletter.
// `labelKey` (nếu có) là khoá i18n để hiện nhãn theo VI/EN; không có thì dùng `label` cố định.

export const PAGE_SIZE = 40; // số tin mỗi lần tải

export const SOURCE_FILTERS = [
  { key: "github_release", label: "GitHub Release", sources: ["github_release"] },
  { key: "github_trending", label: "GitHub Trending", sources: ["github_trending"] },
  {
    key: "github_hot",
    label: "🔥 Trending",
    sources: ["github_trending_daily", "github_trending_weekly"],
  },
  { key: "hackernews", label: "Hacker News", sources: ["hackernews"] },
  { key: "arxiv", label: "arXiv", sources: ["arxiv"] },
  {
    key: "blog_labs",
    label: "AI Labs",
    labelKey: "filterBlogLabs",
    sources: ["openai", "deepmind", "huggingface", "mistral", "bair"],
  },
  {
    key: "blog_press",
    label: "Tech Press",
    labelKey: "filterBlogPress",
    sources: ["techcrunch", "theverge", "arstechnica", "venturebeat", "technologyreview"],
  },
  {
    key: "blog_news",
    label: "Newsletters",
    labelKey: "filterBlogNews",
    sources: ["simonwillison", "importai", "thegradient"],
  },
  { key: "reddit", label: "Reddit", sources: ["reddit"] },
];

// Trả về danh sách source string cho 1 bộ lọc; null nghĩa là "tất cả" (không lọc).
export function sourcesForFilter(key) {
  if (key === "all") return null;
  const f = SOURCE_FILTERS.find((x) => x.key === key);
  return f ? f.sources : null;
}
