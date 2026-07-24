// Định nghĩa bộ lọc nguồn — DÙNG CHUNG cho client (Feed) và server (API/page).
// "Blog" gộp các blog hãng (OpenAI, DeepMind, Hugging Face).

export const PAGE_SIZE = 40; // số tin mỗi lần tải

export const SOURCE_FILTERS = [
  { key: "github_release", label: "GitHub Release", sources: ["github_release"] },
  { key: "github_trending", label: "GitHub Trending", sources: ["github_trending"] },
  { key: "hackernews", label: "Hacker News", sources: ["hackernews"] },
  { key: "arxiv", label: "arXiv", sources: ["arxiv"] },
  {
    key: "blog",
    label: "Blog",
    sources: ["openai", "deepmind", "huggingface", "mistral", "bair", "simonwillison"],
  },
  { key: "reddit", label: "Reddit", sources: ["reddit"] },
];

// Trả về danh sách source string cho 1 bộ lọc; null nghĩa là "tất cả" (không lọc).
export function sourcesForFilter(key) {
  if (key === "all") return null;
  const f = SOURCE_FILTERS.find((x) => x.key === key);
  return f ? f.sources : null;
}
