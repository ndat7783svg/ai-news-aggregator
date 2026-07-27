// Nhãn + màu cho từng nguồn, và định dạng thời gian tương đối song ngữ.

import { t } from "./i18n";

export const SOURCE_META = {
  hackernews: { label: "Hacker News", color: "#ff6600" },
  arxiv: { label: "arXiv", color: "#b31b1b" },
  openai: { label: "OpenAI", color: "#10a37f" },
  deepmind: { label: "Google DeepMind", color: "#1a73e8" },
  huggingface: { label: "Hugging Face", color: "#ff9d00" },
  mistral: { label: "Mistral AI", color: "#fa520f" },
  bair: { label: "Berkeley BAIR", color: "#003262" },
  simonwillison: { label: "Simon Willison", color: "#0d7d7d" },
  techcrunch: { label: "TechCrunch", color: "#0a8500" },
  theverge: { label: "The Verge", color: "#5200ff" },
  arstechnica: { label: "Ars Technica", color: "#ff4e00" },
  venturebeat: { label: "VentureBeat", color: "#c8102e" },
  technologyreview: { label: "MIT Tech Review", color: "#000000" },
  importai: { label: "Import AI", color: "#1f6feb" },
  thegradient: { label: "The Gradient", color: "#3f51b5" },
  github_release: { label: "GitHub Release", color: "#6e40c9" },
  github_trending: { label: "GitHub Trending", labelKey: "githubSubStars", color: "#24292e" },
  github_trending_daily: { label: "🔥 Trending (ngày)", labelKey: "githubSubDaily", color: "#f97316" },
  github_trending_weekly: { label: "🔥 Trending (tuần)", labelKey: "githubSubWeekly", color: "#ea580c" },
  github_trending_monthly: { label: "🔥 Trending (tháng)", labelKey: "githubSubMonthly", color: "#c2410c" },
  github_classics: { label: "Kinh điển", labelKey: "githubSubClassics", color: "#475569" },
  reddit: { label: "Reddit", color: "#ff4500" },
};

// `lang` tuỳ chọn: nếu nguồn có `labelKey`, dịch theo chuỗi i18n (VI/EN) thay vì nhãn cố định.
export function sourceMeta(source, lang) {
  const meta = SOURCE_META[source] || { label: source, color: "#6b7280" };
  if (lang && meta.labelKey) return { ...meta, label: t(lang, meta.labelKey) };
  return meta;
}

/** Rút gọn số sao GitHub để phần đầu thẻ gọn hơn. */
export function formatStars(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "";
  if (n < 1000) return String(n);
  const compact = n / 1000;
  return `${compact >= 100 ? Math.round(compact) : Number(compact.toFixed(1))}K`;
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
