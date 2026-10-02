"use client";

// 1 tin trong feed, trình bày kiểu danh sách báo: dòng nguồn · thời gian, tiêu đề (serif),
// tóm tắt, rồi dòng "Đọc tại <tên miền>" + nút Chia sẻ/Lưu.

import { formatStars, sourceMeta, relativeTime, domainOf } from "../lib/format";
import { t } from "../lib/i18n";
import StoryActions from "./StoryActions";
import { ExternalIcon } from "./icons";

export const LANGUAGE_COLORS = {
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

/** Dòng nguồn · thời gian · điểm/sao — dùng chung cho thẻ tin và trang chi tiết. */
export function StoryMeta({ item, lang }) {
  const meta = sourceMeta(item.source, lang);
  const isGithub = item.source?.startsWith("github_");
  const language = isGithub ? item.extra?.language : null;
  return (
    <div className="story-meta">
      <span className="story-source">
        <span className="source-dot" style={{ backgroundColor: meta.color }} aria-hidden="true" />
        {meta.label}
      </span>
      <span className="sep" aria-hidden="true">·</span>
      <time dateTime={item.published_at || undefined} suppressHydrationWarning>
        {relativeTime(item.published_at, lang)}
      </time>
      {typeof item.score === "number" && (
        <>
          <span className="sep" aria-hidden="true">·</span>
          <span className="story-score">
            {isGithub
              ? `★ ${formatStars(item.score)}`
              : `▲ ${item.score} ${t(lang, "points")}`}
          </span>
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
    </div>
  );
}

export function pickText(item, lang) {
  const title = lang === "vi" ? item.title_vi || item.title : item.title;
  const summary =
    lang === "vi" ? item.summary_vi || item.summary_en : item.summary_en || item.summary_vi;
  return { title, summary };
}

export default function NewsCard({ item, lang, initialSaved = false, onUnsave }) {
  const { title, summary } = pickText(item, lang);
  const domain = domainOf(item.url);

  return (
    <article className="story">
      <StoryMeta item={item} lang={lang} />

      <h2 className="story-title">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      </h2>

      {summary && <p className="story-summary">{summary}</p>}

      <div className="story-foot">
        <a className="story-link" href={item.url} target="_blank" rel="noopener noreferrer">
          {t(lang, "readAt")} <strong>{domain || t(lang, "readOriginal")}</strong>
          <ExternalIcon />
        </a>
        {item.author && <span className="story-author">{item.author}</span>}
        <StoryActions item={item} lang={lang} initialSaved={initialSaved} onUnsave={onUnsave} />
      </div>
    </article>
  );
}
