"use client";

// Thanh đầu trang dùng chung cho MỌI trang: logo, điều hướng, Sáng/Tối, VI/EN, tài khoản.
// - Trang client có state ngôn ngữ riêng (Feed) → truyền `lang` + `onLangChange` (điều khiển từ ngoài).
// - Trang server ép ngôn ngữ theo URL (/github-ai, /en/github-ai) → truyền `langLinks` để nút VI/EN là link.
// - Không truyền gì → header tự quản ngôn ngữ qua hook `useLang` (đồng bộ với trang qua sự kiện).

import { t } from "../lib/i18n";
import { useLang, useTheme, useAuthUser } from "../lib/useSiteState";
import HeaderMenu from "./HeaderMenu";
import { SunIcon, MoonIcon, UserIcon } from "./icons";

export default function SiteHeader({ lang: langProp, onLangChange, langLinks, active }) {
  const [ownLang, setOwnLang] = useLang();
  const lang = langProp || ownLang;
  const setLang = onLangChange || setOwnLang;
  const [theme, toggleTheme] = useTheme();
  const user = useAuthUser();

  const homeHref = lang === "en" ? "/en" : "/";
  const githubHref = lang === "en" ? "/en/github-ai" : "/github-ai";

  const nav = [
    { key: "home", href: homeHref, label: t(lang, "navLatest") },
    { key: "github", href: githubHref, label: t(lang, "navGithubShort") },
    { key: "saved", href: "/da-luu", label: t(lang, "navSaved") },
  ];

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href={homeHref} className="brand" aria-label="BAI News">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span className="brand-name">
            BAI<span className="brand-name-light"> News</span>
          </span>
        </a>

        <nav className="site-nav" aria-label={t(lang, "menu")}>
          {nav.map((n) => (
            <a
              key={n.key}
              href={n.href}
              className={active === n.key ? "active" : ""}
              aria-current={active === n.key ? "page" : undefined}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={t(lang, theme === "dark" ? "themeToLight" : "themeToDark")}
            title={t(lang, theme === "dark" ? "themeToLight" : "themeToDark")}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="lang-switch" role="group" aria-label="Language">
            {["vi", "en"].map((l) =>
              langLinks ? (
                <a
                  key={l}
                  href={langLinks[l]}
                  className={lang === l ? "active" : ""}
                  aria-current={lang === l ? "true" : undefined}
                  hrefLang={l}
                >
                  {l.toUpperCase()}
                </a>
              ) : (
                <button
                  key={l}
                  className={lang === l ? "active" : ""}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                >
                  {l.toUpperCase()}
                </button>
              )
            )}
          </div>

          {/* Chưa kiểm tra xong đăng nhập → chừa chỗ trống, tránh nháy nút "Đăng nhập" với người đã đăng nhập */}
          {user === undefined ? (
            <span className="icon-btn-placeholder" aria-hidden="true" />
          ) : user ? (
            <a
              href="/tai-khoan"
              className="icon-btn"
              aria-label={t(lang, "navAccount")}
              title={t(lang, "navAccount")}
            >
              <UserIcon />
            </a>
          ) : (
            <a href="/dang-nhap" className="login-link">
              {t(lang, "login")}
            </a>
          )}

          <HeaderMenu lang={lang} user={user} />
        </div>
      </div>
    </header>
  );
}
