"use client";

import { useEffect, useRef, useState } from "react";
import NewsCard from "./NewsCard";
import HeaderMenu from "./HeaderMenu";
import HeaderAdBanner from "./HeaderAdBanner";
import { t } from "../lib/i18n";
import { SOURCE_FILTERS, PAGE_SIZE } from "../lib/filters";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Feed({
  initialItems,
  initialHasMore,
  availableSources = [],
  error,
  configMissing,
  initialLang = "vi",
}) {
  const [lang, setLang] = useState(initialLang);
  const [theme, setTheme] = useState("light"); // "light" | "dark" (thực tế set sau khi mount)
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new"); // "new" = Mới nhất, "hot" = Nổi bật nhất
  const [time, setTime] = useState("all"); // all | today | week | month | year
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const offsetRef = useRef(initialItems.length); // số dòng đã lấy từ DB (cho phân trang)
  const seenIds = useRef(new Set(initialItems.map((i) => i.id))); // chống trùng khi nối
  const sentinelRef = useRef(null);
  const didMount = useRef(false); // bỏ qua lần fetch đầu cho "all" (đã có dữ liệu SSR)

  // Nhớ ngôn ngữ đã chọn.
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
      // Báo cho các component ngoài cây React (RenameBanner) đổi ngôn ngữ ngay, không cần tải lại trang.
      window.dispatchEvent(new CustomEvent("bai-lang-change", { detail: l }));
    } catch {}
  }

  // Đồng bộ trạng thái theme: đọc thẳng từ localStorage (nguồn đáng tin cậy nhất) thay vì chỉ
  // dựa vào thuộc tính script inline (layout.js) đã đặt trên <html> — thuộc tính đó có thể bị
  // React dọn mất lúc hydrate vì JSX gốc không khai báo `data-theme`. Ghi lại thuộc tính ở đây
  // để chắc chắn giao diện luôn khớp lựa chọn đã lưu, kể cả khi bước đặt trước hydrate bị mất.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const t =
        saved === "dark" || saved === "light"
          ? saved
          : document.documentElement.dataset.theme;
      if (t === "dark" || t === "light") {
        setTheme(t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      document.documentElement.dataset.theme = next;
      localStorage.setItem("theme", next); // nhớ cho lần sau ghé lại
    } catch {}
  }

  // Lọc ra các hạng mục chống trùng theo id.
  function dedupe(list) {
    const out = [];
    for (const it of list) {
      if (seenIds.current.has(it.id)) continue;
      seenIds.current.add(it.id);
      out.push(it);
    }
    return out;
  }

  // Dựng URL API kèm đủ bộ lọc nguồn + sắp xếp + thời gian đang chọn.
  function itemsUrl(off) {
    const p = new URLSearchParams({
      filter,
      sort,
      time,
      offset: String(off),
      limit: String(PAGE_SIZE),
    });
    return `/api/items?${p.toString()}`;
  }

  // Đổi bất kỳ bộ lọc/sắp xếp nào → tải lại trang đầu (bỏ qua lần đầu vì đã có SSR).
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    let cancelled = false;
    setLoading(true);
    seenIds.current = new Set();
    offsetRef.current = 0;
    setItems([]);
    setHasMore(true);

    fetch(itemsUrl(0))
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const raw = d.items || [];
        offsetRef.current = raw.length;
        setItems(dedupe(raw));
        setHasMore(!!d.hasMore);
      })
      .catch(() => {
        if (!cancelled) setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, sort, time]);

  // Tải thêm batch tiếp theo (nối vào cuối).
  async function loadMore() {
    if (loading || !hasMore || configMissing || error) return;
    setLoading(true);
    try {
      const res = await fetch(itemsUrl(offsetRef.current));
      const d = await res.json();
      const raw = d.items || [];
      offsetRef.current += raw.length;
      const fresh = dedupe(raw);
      if (fresh.length) setItems((prev) => [...prev, ...fresh]);
      setHasMore(!!d.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // Luôn trỏ tới loadMore mới nhất để observer không dùng closure cũ.
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  // Tự tải thêm khi cuộn gần tới cuối (IntersectionObserver trên "sentinel").
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "500px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Hiện nút lọc dựa trên các nguồn THỰC CÓ trong DB (không phụ thuộc trang đầu),
  // hoặc nếu đang chọn chính nó (để nút không biến mất khi đang lọc).
  // Chỉ lấy entry KHÔNG có `parent` để 4 nút con GitHub không hiện trên hàng chính.
  const availableFilters = SOURCE_FILTERS.filter(
    (f) =>
      !f.parent &&
      (filter === f.key || f.sources.some((s) => availableSources.includes(s)))
  );

  // Entry con GitHub có dữ liệu thực tế trong DB.
  const githubSubFilters = SOURCE_FILTERS.filter(
    (f) =>
      f.parent === "github" &&
      f.sources.some((s) => availableSources.includes(s))
  );

  // Kiểm tra filter đang chọn thuộc nhóm GitHub (cha hoặc con).
  const isGithubActive =
    filter === "github" ||
    SOURCE_FILTERS.find((x) => x.key === filter)?.parent === "github";

  const filterLabel = (f) => (f?.labelKey ? t(lang, f.labelKey) : f?.label);
  const activeFilterLabel =
    filter === "all"
      ? t(lang, "all")
      : filterLabel(SOURCE_FILTERS.find((f) => f.key === filter));

  return (
    <main className="wrap">
      <header className="site-header">
        <div>
          <h1 className="site-title">BAI News</h1>
          <p className="tagline">{t(lang, "tagline")}</p>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={t(lang, theme === "dark" ? "themeToLight" : "themeToDark")}
            title={t(lang, theme === "dark" ? "themeToLight" : "themeToDark")}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
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
          <HeaderMenu lang={lang} />
        </div>
      </header>

      <HeaderAdBanner />

      {!configMissing && !error && availableFilters.length > 0 && (
        <div className="controls">
          <div className="control-group">
            <span className="control-label">{t(lang, "sourceLabel")}</span>
            <div className="source-filter" role="group" aria-label="Filter by source">
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
                aria-pressed={filter === "all"}
              >
                {t(lang, "all")}
              </button>
              {availableFilters.map((f) => (
                <button
                  key={f.key}
                  className={f.key === "github" && isGithubActive ? "active" : filter === f.key ? "active" : ""}
                  onClick={() => setFilter(f.key)}
                  aria-pressed={f.key === "github" ? isGithubActive : filter === f.key}
                >
                  {filterLabel(f)}
                </button>
              ))}

              {/* Ô chọn phụ GitHub — chỉ hiện khi đang lọc nhóm GitHub */}
              {isGithubActive && githubSubFilters.length > 0 && (
                <select
                  className="github-sub-select"
                  value={isGithubActive && filter !== "github" ? filter : "github"}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="GitHub sub-filter"
                >
                  <option value="github">{t(lang, "githubSubAll")}</option>
                  {githubSubFilters.map((f) => (
                    <option key={f.key} value={f.key}>
                      {filterLabel(f)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="control-row">
            <div className="control-group">
              <span className="control-label">{t(lang, "sortLabel")}</span>
              <div className="pill-toggle" role="group" aria-label={t(lang, "sortLabel")}>
                <button
                  className={sort === "new" ? "active" : ""}
                  onClick={() => setSort("new")}
                  aria-pressed={sort === "new"}
                >
                  {t(lang, "sortNew")}
                </button>
                <button
                  className={sort === "hot" ? "active" : ""}
                  onClick={() => setSort("hot")}
                  aria-pressed={sort === "hot"}
                >
                  {t(lang, "sortHot")}
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">{t(lang, "timeLabel")}</span>
              <select
                className="time-select"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label={t(lang, "timeLabel")}
              >
                <option value="all">{t(lang, "timeAll")}</option>
                <option value="today">{t(lang, "timeToday")}</option>
                <option value="week">{t(lang, "timeWeek")}</option>
                <option value="month">{t(lang, "timeMonth")}</option>
                <option value="year">{t(lang, "timeYear")}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {configMissing && <p className="notice">{t(lang, "configHint")}</p>}
      {error && !configMissing && (
        <p className="notice error">
          {t(lang, "errorPrefix")}: {error}
        </p>
      )}
      {!error && !configMissing && !loading && items.length === 0 && (
        <p className="notice">{t(lang, "empty")}</p>
      )}

      {items.length > 0 && (
        <p className="count">
          {items.length}
          {hasMore ? "+" : ""} {t(lang, "itemsSuffix")}
          {filter !== "all" && activeFilterLabel ? ` · ${activeFilterLabel}` : ""}
        </p>
      )}

      <div className="feed">
        {items.map((it) => (
          <NewsCard key={it.id} item={it} lang={lang} />
        ))}
      </div>

      {loading && (
        <p className="loadmore">{t(lang, "loadingMore")}</p>
      )}
      {!loading && !hasMore && items.length > 0 && (
        <p className="loadmore end">{t(lang, "end")}</p>
      )}

      {/* Điểm mốc để phát hiện cuộn tới cuối */}
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />

      {/* Link tới các trang khác đã chuyển lên menu ☰ ở header (giữ 1 link ở chân trang
          cho người cuộn hết feed, và để Google có liên kết nội bộ trong HTML tĩnh). */}
      <footer className="site-footer">
        <a href={lang === "en" ? "/en/github-ai" : "/github-ai"}>
          {t(lang, "navGithubAi")} →
        </a>
      </footer>
    </main>
  );
}
