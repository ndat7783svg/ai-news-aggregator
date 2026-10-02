// Chân trang dùng chung (không có state → dùng được cả trong Server Component).

import { t } from "../lib/i18n";

export default function SiteFooter({ lang = "vi" }) {
  const en = lang === "en";
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true">B</span>
          <div>
            <p className="footer-name">BAI News</p>
            <p className="footer-about">{t(lang, "footerAbout")}</p>
          </div>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <a href={en ? "/en" : "/"}>{t(lang, "navLatest")}</a>
          <a href={en ? "/en/github-ai" : "/github-ai"}>{t(lang, "navGithubAi")}</a>
          <a href="/da-luu">{t(lang, "navSaved")}</a>
          <a href={en ? "/" : "/en"} hrefLang={en ? "vi" : "en"}>
            {en ? "Tiếng Việt" : "English"}
          </a>
        </nav>
      </div>
      <p className="footer-note">{t(lang, "footerNote")}</p>
    </footer>
  );
}
