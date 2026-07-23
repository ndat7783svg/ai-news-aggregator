import { sourceMeta, relativeTime } from "../lib/format";
import { t } from "../lib/i18n";

export default function NewsCard({ item, lang }) {
  const meta = sourceMeta(item.source);
  // Ưu tiên ngôn ngữ đang chọn; nếu thiếu thì rơi về bản còn lại.
  const summary =
    lang === "vi"
      ? item.summary_vi || item.summary_en
      : item.summary_en || item.summary_vi;

  return (
    <article className="card">
      <div className="card-top">
        <span className="badge" style={{ backgroundColor: meta.color }}>
          {meta.label}
        </span>
        {typeof item.score === "number" && (
          <span className="score">▲ {item.score}</span>
        )}
        <span className="time">{relativeTime(item.published_at, lang)}</span>
      </div>

      <h2 className="card-title">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </h2>

      <p className="summary">{summary}</p>

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
