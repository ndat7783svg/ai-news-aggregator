// GithubAiList — Server Component hiển thị danh sách repo GitHub AI nổi bật.
// Dùng cho 2 trang SEO /github-ai (VI) và /en/github-ai (EN).
// KHÔNG phải client component — không toggle ngôn ngữ, không infinite scroll.
// Trình bày giống thẻ tin trang chủ (cùng class CSS) nhưng không có nút Lưu/Chia sẻ.

import { formatStars, sourceMeta, relativeTime, domainOf } from "../lib/format";

const LANGUAGE_COLORS = {
  Python: "#3572A5",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Rust: "#dea584",
  Go: "#00ADD8",
  "C++": "#f34b7d",
  Java: "#b07219",
  "C#": "#178600",
  Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B",
};

export default function GithubAiList({ items, lang }) {
  if (!items || items.length === 0) {
    return (
      <p className="notice">{lang === "vi" ? "Chưa có dữ liệu." : "No data available."}</p>
    );
  }

  return (
    <div className="feed">
      {items.map((item, idx) => {
        const meta = sourceMeta(item.source, lang);
        // Tiêu đề: VI dùng title_vi nếu có, fallback về title gốc; EN dùng title gốc.
        const title = lang === "vi" ? item.title_vi || item.title : item.title;
        const summary =
          lang === "vi"
            ? item.summary_vi || item.summary_en
            : item.summary_en || item.summary_vi;
        const language = item.extra?.language;

        return (
          <article key={item.id} className="story story-ranked">
            <span className="rank" aria-hidden="true">
              {idx + 1}
            </span>
            <div className="story-body">
              <div className="story-meta">
                <span className="story-source">
                  <span className="source-dot" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                  {meta.label}
                </span>
                {typeof item.score === "number" && (
                  <>
                    <span className="sep" aria-hidden="true">·</span>
                    <span className="story-score">★ {formatStars(item.score)}</span>
                  </>
                )}
                {language && (
                  <>
                    <span className="sep" aria-hidden="true">·</span>
                    <span className="story-lang">
                      <span
                        className="lang-dot"
                        style={{ backgroundColor: LANGUAGE_COLORS[language] || "#8b8b8b" }}
                        aria-hidden="true"
                      />
                      {language}
                    </span>
                  </>
                )}
                <span className="sep" aria-hidden="true">·</span>
                <time dateTime={item.published_at || undefined}>
                  {relativeTime(item.published_at, lang)}
                </time>
              </div>

              <h2 className="story-title">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {title}
                </a>
              </h2>

              {summary && <p className="story-summary">{summary}</p>}

              <div className="story-foot">
                <a className="story-link" href={item.url} target="_blank" rel="noopener noreferrer">
                  {lang === "vi" ? "Xem trên" : "View on"} <strong>{domainOf(item.url) || "github.com"}</strong> ↗
                </a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
