"use client";

import { useState, useRef, useEffect } from "react";
import { t } from "../lib/i18n";
import { MenuIcon, HomeIcon, GithubIcon, BookmarkIcon } from "./icons";

/**
 * Nút ☰ ở góc phải header + menu sổ xuống dẫn tới các trang của web.
 * Đóng khi bấm ra ngoài hoặc nhấn Esc.
 */
export default function HeaderMenu({ lang }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Bản EN của trang GitHub AI nằm ở route riêng (xem spec SEO song ngữ 27/07).
  const githubHref = lang === "en" ? "/en/github-ai" : "/github-ai";

  return (
    <div className="header-menu" ref={wrapRef}>
      <button
        className={`header-menu-btn${open ? " open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={t(lang, "menu")}
        title={t(lang, "menu")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MenuIcon />
      </button>

      {open && (
        <div className="header-menu-panel" role="menu">
          <a href="/" role="menuitem" onClick={() => setOpen(false)}>
            <HomeIcon />
            {t(lang, "navHome")}
          </a>
          <a href={githubHref} role="menuitem" onClick={() => setOpen(false)}>
            <GithubIcon />
            {t(lang, "navGithubAi")}
          </a>
          <a href="/da-luu" role="menuitem" onClick={() => setOpen(false)}>
            <BookmarkIcon size={17} />
            {t(lang, "navSaved")}
          </a>
        </div>
      )}
    </div>
  );
}
