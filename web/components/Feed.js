"use client";

import { useEffect, useState } from "react";
import NewsCard from "./NewsCard";
import { t } from "../lib/i18n";

export default function Feed({ items, error, configMissing }) {
  const [lang, setLang] = useState("vi");

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

      {configMissing && <p className="notice">{t(lang, "configHint")}</p>}
      {error && !configMissing && (
        <p className="notice error">
          {t(lang, "errorPrefix")}: {error}
        </p>
      )}
      {!error && !configMissing && items.length === 0 && (
        <p className="notice">{t(lang, "empty")}</p>
      )}

      {items.length > 0 && (
        <p className="count">
          {items.length} {t(lang, "itemsSuffix")}
        </p>
      )}

      <div className="feed">
        {items.map((it) => (
          <NewsCard key={it.id} item={it} lang={lang} />
        ))}
      </div>
    </main>
  );
}
