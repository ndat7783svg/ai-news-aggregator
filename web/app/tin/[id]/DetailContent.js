"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { sourceMeta, relativeTime, formatStars } from "../../../lib/format";
import { t } from "../../../lib/i18n";

/**
 * Client component con của /tin/[id]/page.js.
 * Ưu tiên `?lang=` trên URL (dùng cho link chia sẻ từ bot Facebook, luôn ép vi),
 * nếu không có mới đọc `localStorage` (mặc định "vi" cho khách mới).
 */
export default function DetailContent({ item }) {
  const [lang, setLang] = useState("vi");
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromUrl = searchParams.get("lang");
    if (fromUrl === "vi" || fromUrl === "en") {
      setLang(fromUrl);
      return;
    }
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {
      // localStorage bị chặn → giữ mặc định "vi"
    }
  }, [searchParams]);

  const meta = sourceMeta(item.source, lang);
  const isGithub = item.source?.startsWith("github_");
  const title = lang === "vi" ? item.title_vi || item.title : item.title;
  const summary =
    lang === "vi"
      ? item.summary_vi || item.summary_en
      : item.summary_en || item.summary_vi;

  return (
    <div className="detail-wrap">
      <a href="/" className="detail-back">
        {t(lang, "backHome")}
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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

      <h1 className="detail-title">{title}</h1>

      {item.author && (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
          {item.author}
        </p>
      )}

      {summary && <p className="detail-summary">{summary}</p>}

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="detail-read-btn"
      >
        {t(lang, "readOriginalFull")}
      </a>
    </div>
  );
}
