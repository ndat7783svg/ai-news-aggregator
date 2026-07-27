import { formatStars, sourceMeta, relativeTime } from "../lib/format";
import { t } from "../lib/i18n";

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

export default function NewsCard({ item, lang }) {
  const meta = sourceMeta(item.source, lang);
  // Ưu tiên ngôn ngữ đang chọn; nếu thiếu thì rơi về bản còn lại.
  const summary =
    lang === "vi"
      ? item.summary_vi || item.summary_en
      : item.summary_en || item.summary_vi;
  // Chế độ VI hiển thị tiêu đề đã dịch (nếu có); EN giữ nguyên tiêu đề gốc.
  const title = lang === "vi" ? item.title_vi || item.title : item.title;
  const isGithub = item.source?.startsWith("github_");
  const language = isGithub ? item.extra?.language : null;

  return (
    <article className="card">
      <div className="card-top">
        <span className="badge" style={{ backgroundColor: meta.color }}>
          {meta.label}
        </span>
        {typeof item.score === "number" && (
          <span className="score">{isGithub ? "★" : "▲"} {isGithub ? formatStars(item.score) : item.score}</span>
        )}
        <span className="time">{relativeTime(item.published_at, lang)}</span>
      </div>

      <h2 className="card-title">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      </h2>

      <p className="summary">{summary}</p>

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
          {t(lang, "readOriginal")} →
        </a>
        {item.author && <span className="author">· {item.author}</span>}
      </div>
    </article>
  );
}
