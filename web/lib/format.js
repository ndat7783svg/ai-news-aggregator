// Nhãn + màu cho từng nguồn, và định dạng thời gian tương đối song ngữ.

export const SOURCE_META = {
  hackernews: { label: "Hacker News", color: "#ff6600" },
  arxiv: { label: "arXiv", color: "#b31b1b" },
  openai: { label: "OpenAI", color: "#10a37f" },
  deepmind: { label: "Google DeepMind", color: "#1a73e8" },
  huggingface: { label: "Hugging Face", color: "#ff9d00" },
  mistral: { label: "Mistral AI", color: "#fa520f" },
  bair: { label: "Berkeley BAIR", color: "#003262" },
  simonwillison: { label: "Simon Willison", color: "#0d7d7d" },
  github_release: { label: "GitHub Release", color: "#6e40c9" },
  github_trending: { label: "GitHub Trending", color: "#24292e" },
  reddit: { label: "Reddit", color: "#ff4500" },
};

export function sourceMeta(source) {
  return SOURCE_META[source] || { label: source, color: "#6b7280" };
}

// "2 giờ trước" / "2 hours ago"
export function relativeTime(iso, lang) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units = [
    [31536000, "year", "năm"],
    [2592000, "month", "tháng"],
    [86400, "day", "ngày"],
    [3600, "hour", "giờ"],
    [60, "minute", "phút"],
  ];
  for (const [sec, en, vi] of units) {
    const v = Math.floor(s / sec);
    if (v >= 1) {
      return lang === "vi" ? `${v} ${vi} trước` : `${v} ${en}${v > 1 ? "s" : ""} ago`;
    }
  }
  return lang === "vi" ? "vừa xong" : "just now";
}
