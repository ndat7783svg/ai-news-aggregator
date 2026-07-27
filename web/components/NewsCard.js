"use client";

import { useState, useEffect, useCallback } from "react";
import { formatStars, sourceMeta, relativeTime } from "../lib/format";
import { t } from "../lib/i18n";
import { isSaved, saveItem, removeItemFromAll } from "../lib/savedLists";
import { shareItem } from "../lib/share";
import SaveListPopup from "./SaveListPopup";

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
  const summary =
    lang === "vi"
      ? item.summary_vi || item.summary_en
      : item.summary_en || item.summary_vi;
  const title = lang === "vi" ? item.title_vi || item.title : item.title;
  const isGithub = item.source?.startsWith("github_");
  const language = isGithub ? item.extra?.language : null;

  // State lưu tin
  const [saved, setSaved] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  // Toast thông báo copy link
  const [toast, setToast] = useState("");

  useEffect(() => {
    setSaved(isSaved(item.id));
  }, [item.id]);

  function handleSave() {
    if (saved) {
      removeItemFromAll(item.id);
      setSaved(false);
    } else {
      saveItem(item.id);
      setSaved(true);
    }
  }

  const handlePopupUpdate = useCallback(() => {
    setSaved(isSaved(item.id));
  }, [item.id]);

  async function handleShare() {
    const result = await shareItem(item, lang);
    if (result === "copied") {
      setToast(t(lang, "copiedLink"));
      setTimeout(() => setToast(""), 2000);
    }
  }

  return (
    <article className="card">
      <div className="card-top">
        <span className="badge" style={{ backgroundColor: meta.color }}>
          {meta.label}
        </span>
        {typeof item.score === "number" && (
          <span className="score">
            {isGithub ? "★" : "▲"}{" "}
            {isGithub ? formatStars(item.score) : item.score}
          </span>
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

        {/* Nút Lưu + mũi tên popup */}
        <span className="card-actions">
          <button
            className={`action-btn save-btn${saved ? " saved" : ""}`}
            onClick={handleSave}
            title={saved ? t(lang, "unsave") : t(lang, "save")}
            aria-label={saved ? t(lang, "unsave") : t(lang, "save")}
          >
            {saved ? "🔖" : "🔖"}
            <span className="action-label">
              {saved ? t(lang, "saved") : t(lang, "save")}
            </span>
          </button>
          <button
            className="action-btn list-arrow-btn"
            onClick={() => setShowPopup(true)}
            title={t(lang, "saveToList")}
            aria-label={t(lang, "saveToList")}
          >
            ▾
          </button>

          {/* Nút Chia sẻ */}
          <button
            className="action-btn share-btn"
            onClick={handleShare}
            title={t(lang, "share")}
            aria-label={t(lang, "share")}
          >
            🔗
            <span className="action-label">{t(lang, "share")}</span>
          </button>
        </span>

        {/* Toast thông báo copy link */}
        {toast && (
          <span className="copy-toast">{toast}</span>
        )}
      </div>

      {/* Popup chọn danh sách */}
      {showPopup && (
        <SaveListPopup
          itemId={item.id}
          lang={lang}
          onClose={() => setShowPopup(false)}
          onUpdate={handlePopupUpdate}
        />
      )}
    </article>
  );
}
