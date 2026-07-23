"use client";

import { useEffect, useState } from "react";
import NewsCard from "./NewsCard";
import { t } from "../lib/i18n";

// Các bộ lọc nguồn, theo thứ tự hiển thị. match: nguồn nào thuộc bộ lọc này.
// "Blog" gộp các blog hãng (OpenAI, DeepMind, Hugging Face).
const SOURCE_FILTERS = [
  { key: "github_release", label: "GitHub Release", match: (s) => s === "github_release" },
  { key: "github_trending", label: "GitHub Trending", match: (s) => s === "github_trending" },
  { key: "hackernews", label: "Hacker News", match: (s) => s === "hackernews" },
  { key: "arxiv", label: "arXiv", match: (s) => s === "arxiv" },
  { key: "blog", label: "Blog", match: (s) => ["openai", "deepmind", "huggingface"].includes(s) },
  { key: "reddit", label: "Reddit", match: (s) => s === "reddit" },
];

export default function Feed({ items, error, configMissing }) {
  const [lang, setLang] = useState("vi");
  const [filter, setFilter] = useState("all");

  // Nhớ ngôn ngữ người dùng đã chọn (lưu ở trình duyệt).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {}
  }, []);

  function pick(l) {
    setLang(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }

  // Chỉ hiện bộ lọc nào thực sự có tin trong dữ liệu (vd Reddit chỉ hiện nếu có).
  const availableFilters = SOURCE_FILTERS.filter((f) =>
    items.some((it) => f.match(it.source))
  );
  const activeFilter = SOURCE_FILTERS.find((f) => f.key === filter);
  const visible =
    filter === "all" || !activeFilter
      ? items
      : items.filter((it) => activeFilter.match(it.source));

  return (
    <main className="wrap">
      <header className="site-header">
        <div>
          <h1 className="site-title">AI News</h1>
          <p className="tagline">{t(lang, "tagline")}</p>
        </div>
        <div className="lang-toggle" role="group" aria-label="Language">
          <button
            className={lang === "vi" ? "active" : ""}
            onClick={() => pick("vi")}
            aria-pressed={lang === "vi"}
          >
            VI
          </button>
          <button
            className={lang === "en" ? "active" : ""}
            onClick={() => pick("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
      </header>

      {!configMissing && !error && availableFilters.length > 0 && (
        <div className="source-filter" role="group" aria-label="Filter by source">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            {t(lang, "all")}
          </button>
          {availableFilters.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? "active" : ""}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {configMissing && <p className="notice">{t(lang, "configHint")}</p>}
      {error && !configMissing && (
        <p className="notice error">
          {t(lang, "errorPrefix")}: {error}
        </p>
      )}
      {!error && !configMissing && visible.length === 0 && (
        <p className="notice">{t(lang, "empty")}</p>
      )}

      {visible.length > 0 && (
        <p className="count">
          {visible.length} {t(lang, "itemsSuffix")}
        </p>
      )}

      <div className="feed">
        {visible.map((it) => (
          <NewsCard key={it.id} item={it} lang={lang} />
        ))}
      </div>
    </main>
  );
}
