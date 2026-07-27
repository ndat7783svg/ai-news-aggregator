// Định nghĩa bộ lọc nguồn — DÙNG CHUNG cho client (Feed) và server (API/page).
// 13 blog/báo được chia làm 3 nhóm chủ đề: hãng AI / báo công nghệ / newsletter.
// `labelKey` (nếu có) là khoá i18n để hiện nhãn theo VI/EN; không có thì dùng `label` cố định.

export const PAGE_SIZE = 40; // số tin mỗi lần tải

export const SOURCE_FILTERS = [
  // Nút cha gộp tất cả GitHub — hiện trên hàng nút chính.
  {
    key: "github",
    label: "GitHub",
    sources: [
      "github_release",
      "github_trending",
      "github_trending_daily",
      "github_trending_weekly",
      "github_trending_monthly",
      "github_classics",
    ],
  },
  // 6 nút con — chỉ hiện trong ô <select> phụ khi chọn GitHub.
  { key: "github_release", label: "Release", sources: ["github_release"], parent: "github" },
  { key: "github_trending", label: "Trending (nhiều sao)", labelKey: "githubSubStars", sources: ["github_trending"], parent: "github" },
  { key: "github_trending_daily", label: "🔥 Trending (ngày)", labelKey: "githubSubDaily", sources: ["github_trending_daily"], parent: "github" },
  { key: "github_trending_weekly", label: "🔥 Trending (tuần)", labelKey: "githubSubWeekly", sources: ["github_trending_weekly"], parent: "github" },
  { key: "github_trending_monthly", label: "🔥 Trending (tháng)", labelKey: "githubSubMonthly", sources: ["github_trending_monthly"], parent: "github" },
  { key: "github_classics", label: "Kinh điển", labelKey: "githubSubClassics", sources: ["github_classics"], parent: "github" },
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

export const GITHUB_ALL_SOURCES = [
  "github_release",
  "github_trending",
  "github_trending_daily",
  "github_trending_weekly",
  "github_trending_monthly",
  "github_classics",
];

export const GITHUB_TRENDING_FAMILY = [
  "github_trending",
  "github_trending_daily",
  "github_trending_weekly",
  "github_trending_monthly",
  "github_classics",
];

// Trả về danh sách source string cho 1 bộ lọc; null nghĩa là "tất cả" (không lọc).
export function sourcesForFilter(key) {
  if (key === "all") return null;
  const f = SOURCE_FILTERS.find((x) => x.key === key);
  return f ? f.sources : null;
}
