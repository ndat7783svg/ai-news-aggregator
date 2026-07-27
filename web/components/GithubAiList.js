// GithubAiList — Server Component hiển thị danh sách repo GitHub AI nổi bật.
// Dùng cho 2 trang SEO /github-ai (VI) và /en/github-ai (EN).
// KHÔNG phải client component — không toggle ngôn ngữ, không infinite scroll.

import { formatStars, sourceMeta, relativeTime } from "../lib/format";

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
};

export default function GithubAiList({ items, lang }) {
  if (!items || items.length === 0) {
    return (
      <p className="empty-notice">
        {lang === "vi" ? "Chưa có dữ liệu." : "No data available."}
      </p>
    );
  }

  return (
    <div className="feed">
      {items.map((item) => {
        const meta = sourceMeta(item.source, lang);
        // Tiêu đề: VI dùng title_vi nếu có, fallback về title gốc; EN dùng title gốc.
        const title = lang === "vi" ? item.title_vi || item.title : item.title;
        // Tóm tắt theo ngôn ngữ, có fallback.
        const summary =
          lang === "vi"
            ? item.summary_vi || item.summary_en
            : item.summary_en || item.summary_vi;
        const language = item.extra?.language;

        return (
          <article key={item.id} className="card">
            <div className="card-top">
              <span className="badge" style={{ backgroundColor: meta.color }}>
                {meta.label}
              </span>
              {typeof item.score === "number" && (
                <span className="score">★ {formatStars(item.score)}</span>
              )}
              <span className="time">{relativeTime(item.published_at, lang)}</span>
            </div>

            <h2 className="card-title">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {title}
              </a>
            </h2>

            {summary && <p className="summary">{summary}</p>}

            {language && (
              <div className="repo-language">
                <span
                  className="language-dot"
                  style={{ backgroundColor: LANGUAGE_COLORS[language] || "#6b7280" }}
                />
                {language}
              </div>
            )}

            <div className="card-bottom">
              <a
                className="original"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {lang === "vi" ? "Đọc bài gốc" : "Read original"} →
              </a>
              {item.author && (
                <span className="author">· {item.author}</span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
