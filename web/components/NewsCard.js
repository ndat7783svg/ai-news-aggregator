"use client";

import { useState, useEffect } from "react";
import { formatStars, sourceMeta, relativeTime } from "../lib/format";
import { t } from "../lib/i18n";
import { saveUserItem, removeUserSavedItem } from "../lib/savedItems";
import { supabase } from "../lib/supabaseClient";
import { shareItem } from "../lib/share";
import { ShareIcon, BookmarkIcon } from "./icons";

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

export default function NewsCard({ item, lang, initialSaved = false, onUnsave }) {
  const meta = sourceMeta(item.source, lang);
  const summary =
    lang === "vi"
      ? item.summary_vi || item.summary_en
      : item.summary_en || item.summary_vi;
  const title = lang === "vi" ? item.title_vi || item.title : item.title;
  const isGithub = item.source?.startsWith("github_");
  const language = isGithub ? item.extra?.language : null;

  // State lưu tin
  const [saved, setSaved] = useState(initialSaved);
  // Toast thông báo copy link
  const [toast, setToast] = useState("");

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  useEffect(() => {
    function handleSavedChange(e) {
      if (e.detail && e.detail.itemId === item.id) {
        setSaved(e.detail.saved);
      }
    }
    window.addEventListener("bai-saved-item-change", handleSavedChange);
    return () => {
      window.removeEventListener("bai-saved-item-change", handleSavedChange);
    };
  }, [item.id]);

  async function handleSave() {
    if (!supabase) {
      window.location.href = "/dang-nhap";
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const currentPath =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/";
        window.location.href = `/dang-nhap?redirect=${encodeURIComponent(currentPath)}`;
        return;
      }

      const nextSaved = !saved;
      setSaved(nextSaved);

      // Phát sự kiện đồng bộ giữa các thẻ tin
      window.dispatchEvent(
        new CustomEvent("bai-saved-item-change", {
          detail: { itemId: item.id, saved: nextSaved },
        })
      );

      if (nextSaved) {
        const ok = await saveUserItem(item.id);
        if (!ok) setSaved(false);
      } else {
        const ok = await removeUserSavedItem(item.id);
        if (!ok) setSaved(true);
        else onUnsave?.(item.id);
      }
    } catch {
      setSaved(saved);
    }
  }

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

        {/* Nút Chia sẻ + Nút Lưu */}
        <span className="card-actions">
          <button
            className="pill share-pill"
            onClick={handleShare}
            title={t(lang, "share")}
            aria-label={t(lang, "share")}
          >
            <ShareIcon />
            <span className="pill-label">{t(lang, "share")}</span>
          </button>

          <button
            className={`pill save-pill${saved ? " saved" : ""}`}
            onClick={handleSave}
            title={saved ? t(lang, "unsave") : t(lang, "save")}
            aria-label={saved ? t(lang, "unsave") : t(lang, "save")}
            aria-pressed={saved}
          >
            <BookmarkIcon filled={saved} />
            <span className="pill-label">
              {saved ? t(lang, "saved") : t(lang, "save")}
            </span>
          </button>
        </span>

        {/* Toast thông báo copy link */}
        {toast && <span className="copy-toast">{toast}</span>}
      </div>
    </article>
  );
}
