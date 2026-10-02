"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import NewsCard, { pickText } from "./NewsCard";
import { trackProps } from "../lib/track";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { t } from "../lib/i18n";
import { SOURCE_FILTERS, PAGE_SIZE } from "../lib/filters";
import { fetchUserSavedItemIds } from "../lib/savedItems";
import { useLang, useAuthUser } from "../lib/useSiteState";
import { dayKey, dayLabel, fullDate, formatStars } from "../lib/format";
import { SearchIcon, CloseIcon, ArrowUpIcon } from "./icons";

// Thứ tự tab chuyên mục: GitHub đứng đầu (nội dung muốn hướng tới người đọc Việt nhất), rồi tin thời sự.
const TAB_ORDER = ["github", "blog_labs", "blog_press", "hackernews", "arxiv", "blog_news", "reddit"];

function SkeletonList({ count = 4 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="story skeleton">
          <span className="sk sk-meta" />
          <span className="sk sk-title" />
          <span className="sk sk-title short" />
          <span className="sk sk-line" />
          <span className="sk sk-line" />
          <span className="sk sk-line short" />
        </div>
      ))}
    </div>
  );
}

function BackToTop({ lang }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 1400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t(lang, "backToTop")}
      title={t(lang, "backToTop")}
    >
      <ArrowUpIcon />
    </button>
  );
}

/**
 * Khối "GitHub AI đang hot" ở đầu trang chủ (hiện cả trên điện thoại): repo trending tuần nhiều
 * sao nhất. Điện thoại = vuốt ngang, máy tính = lưới 3 cột.
 */
function GithubStrip({ lang, items, onSeeAll }) {
  if (!items.length) return null;
  return (
    <section className="gh-strip" aria-labelledby="gh-strip-title">
      <div className="gh-strip-head">
        <h2 id="gh-strip-title" className="gh-strip-title">
          {t(lang, "railGithub")}
        </h2>
        <button type="button" className="gh-strip-more" onClick={onSeeAll}>
          {t(lang, "railSeeAll")} →
        </button>
      </div>
      <div className="gh-strip-list">
        {items.map((it) => {
          const summary = pickText(it, lang).summary;
          return (
            <a
              key={it.id}
              className="gh-card"
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              {...trackProps(it, "github_strip")}
            >
              <span className="gh-card-name">{it.title}</span>
              {summary && <span className="gh-card-desc">{summary}</span>}
              <span className="gh-card-meta">
                ★ {formatStars(it.score)}
                {it.extra?.language ? ` · ${it.extra.language}` : ""}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/** Cột phải (chỉ hiện trên màn hình rộng): tin nổi bật tuần + giới thiệu. */
function Rail({ lang, topItems }) {
  return (
    <aside className="rail">
      {topItems.length > 0 && (
        <section className="rail-block">
          <h2 className="rail-title">{t(lang, "railTop")}</h2>
          <p className="rail-hint">{t(lang, "railTopHint")}</p>
          <ol className="rail-list numbered">
            {topItems.map((it) => (
              <li key={it.id}>
                <a href={it.url} target="_blank" rel="noopener noreferrer" {...trackProps(it, "rail_top")}>
                  {lang === "vi" ? it.title_vi || it.title : it.title}
                </a>
                {typeof it.score === "number" && (
                  <span className="rail-meta">
                    ▲ {it.score} {t(lang, "points")}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="rail-block rail-about">
        <h2 className="rail-title">{t(lang, "railAboutTitle")}</h2>
        <p>{t(lang, "railAboutBody")}</p>
        <p className="rail-hint">{t(lang, "railAboutUpdate")}</p>
      </section>
    </aside>
  );
}

export default function Feed({
  initialItems,
  initialHasMore,
  availableSources = [],
  topItems = [],
  githubItems = [],
  error,
  configMissing,
  initialLang = "vi",
  respectStoredLang = true,
}) {
  const [lang, setLang] = useLang(initialLang, respectStoredLang);
  const user = useAuthUser();
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new"); // "new" = Mới nhất, "hot" = Nổi bật nhất
  const [time, setTime] = useState("all"); // all | today | week | month | year
  const [query, setQuery] = useState(""); // chữ đang gõ trong ô tìm kiếm
  const [q, setQ] = useState(""); // từ khoá đã áp dụng (sau debounce)
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [todayKey, setTodayKey] = useState(null); // chỉ có sau khi mount (tránh lệch hydrate)

  const offsetRef = useRef(initialItems.length); // số dòng đã lấy từ DB (cho phân trang)
  const seenIds = useRef(new Set(initialItems.map((i) => i.id))); // chống trùng khi nối
  const sentinelRef = useRef(null);
  const tabsRef = useRef(null);
  const didMount = useRef(false); // bỏ qua lần fetch đầu cho "all" (đã có dữ liệu SSR)
  // Mỗi lần đổi bộ lọc tăng "thế hệ" → kết quả loadMore của bộ lọc cũ về muộn sẽ bị bỏ qua.
  const genRef = useRef(0);

  useEffect(() => {
    setTodayKey(dayKey(new Date().toISOString()));
  }, []);

  // Lấy danh sách ID các tin đã lưu khi đã đăng nhập.
  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    fetchUserSavedItemIds().then((ids) => setSavedIds(new Set(ids)));
  }, [user]);

  // Đồng bộ trạng thái lưu giữa các thẻ tin trong feed.
  useEffect(() => {
    function handleSavedChange(e) {
      if (!e.detail) return;
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (e.detail.saved) next.add(e.detail.itemId);
        else next.delete(e.detail.itemId);
        return next;
      });
    }
    window.addEventListener("bai-saved-item-change", handleSavedChange);
    return () => window.removeEventListener("bai-saved-item-change", handleSavedChange);
  }, []);

  // Debounce ô tìm kiếm: gõ xong 350ms mới tìm.
  useEffect(() => {
    const id = setTimeout(() => setQ(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  function dedupe(list) {
    const out = [];
    for (const it of list) {
      if (seenIds.current.has(it.id)) continue;
      seenIds.current.add(it.id);
      out.push(it);
    }
    return out;
  }

  // Dựng URL API kèm đủ bộ lọc nguồn + sắp xếp + thời gian + từ khoá.
  function itemsUrl(off) {
    const p = new URLSearchParams({
      filter,
      sort,
      time,
      offset: String(off),
      limit: String(PAGE_SIZE),
    });
    if (q) p.set("q", q);
    return `/api/items?${p.toString()}`;
  }

  // Đổi bất kỳ bộ lọc/sắp xếp/từ khoá nào → tải lại trang đầu (bỏ qua lần đầu vì đã có SSR).
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const gen = ++genRef.current;
    setLoading(true);
    setFetchError(false);
    seenIds.current = new Set();
    offsetRef.current = 0;
    setItems([]);
    setHasMore(true);

    fetch(itemsUrl(0))
      .then((r) => r.json())
      .then((d) => {
        if (gen !== genRef.current) return;
        if (d.error) setFetchError(true);
        const raw = d.items || [];
        offsetRef.current = raw.length;
        setItems(dedupe(raw));
        setHasMore(!!d.hasMore);
      })
      .catch(() => {
        if (gen !== genRef.current) return;
        setFetchError(true);
        setHasMore(false);
      })
      .finally(() => {
        if (gen === genRef.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sort, time, q]);

  // Tải thêm batch tiếp theo (nối vào cuối).
  async function loadMore() {
    if (loading || !hasMore || configMissing || error) return;
    const gen = genRef.current;
    setLoading(true);
    try {
      const res = await fetch(itemsUrl(offsetRef.current));
      const d = await res.json();
      if (gen !== genRef.current) return; // bộ lọc đã đổi trong lúc chờ → bỏ kết quả cũ
      const raw = d.items || [];
      offsetRef.current += raw.length;
      const fresh = dedupe(raw);
      if (fresh.length) setItems((prev) => [...prev, ...fresh]);
      setHasMore(!!d.hasMore);
    } catch {
      if (gen === genRef.current) setHasMore(false);
    } finally {
      if (gen === genRef.current) setLoading(false);
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
      { rootMargin: "600px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Tab chuyên mục chỉ hiện nguồn THỰC CÓ trong DB (hoặc đang chọn chính nó).
  // Bỏ entry có `parent` để 6 bộ lọc con GitHub không hiện thành tab riêng.
  const tabs = useMemo(
    () =>
      SOURCE_FILTERS.filter(
        (f) =>
          !f.parent &&
          (filter === f.key || f.sources.some((s) => availableSources.includes(s)))
      ).sort((a, b) => TAB_ORDER.indexOf(a.key) - TAB_ORDER.indexOf(b.key)),
    [availableSources, filter]
  );

  const githubSubFilters = SOURCE_FILTERS.filter(
    (f) => f.parent === "github" && f.sources.some((s) => availableSources.includes(s))
  );

  const isGithubActive =
    filter === "github" || SOURCE_FILTERS.find((x) => x.key === filter)?.parent === "github";

  const filterLabel = (f) => (f?.labelKey ? t(lang, f.labelKey) : f?.label);

  // Chia tin theo ngày khi xem "Mới nhất" (kiểu trang báo); "Nổi bật" thì để liền 1 danh sách.
  const groups = useMemo(() => {
    if (sort !== "new") return [{ key: "all", items }];
    const out = [];
    for (const it of items) {
      const k = dayKey(it.published_at);
      const last = out[out.length - 1];
      if (last && last.key === k) last.items.push(it);
      else out.push({ key: k, items: [it] });
    }
    return out;
  }, [items, sort]);

  const showControls = !configMissing && !error;
  const isEmpty = !error && !configMissing && !loading && items.length === 0;

  return (
    <>
      <SiteHeader lang={lang} onLangChange={setLang} active="home" />

      <div className="page">
        <div className="masthead">
          <p className="masthead-date" suppressHydrationWarning>
            {fullDate(new Date(), lang)}
          </p>
          <h1 className="masthead-title">{t(lang, "tagline")}</h1>
        </div>

        <div className="layout">
          <main className="main-col">
            {showControls && !isGithubActive && !q && (
              <GithubStrip
                lang={lang}
                items={githubItems}
                onSeeAll={() => {
                  setFilter("github");
                  tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            )}

            {showControls && (
              <>
                <div className="tabs-bar" ref={tabsRef}>
                  <div className="tabs" role="tablist" aria-label={t(lang, "sourceLabel")}>
                    <button
                      role="tab"
                      aria-selected={filter === "all"}
                      className={filter === "all" ? "active" : ""}
                      onClick={() => setFilter("all")}
                    >
                      {t(lang, "all")}
                    </button>
                    {tabs.map((f) => {
                      const isActive = f.key === "github" ? isGithubActive : filter === f.key;
                      return (
                        <button
                          key={f.key}
                          role="tab"
                          aria-selected={isActive}
                          className={isActive ? "active" : ""}
                          onClick={() => setFilter(f.key)}
                        >
                          {filterLabel(f)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="toolbar">
                  <form
                    className="search"
                    role="search"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setQ(query.trim());
                    }}
                  >
                    <SearchIcon size={16} />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t(lang, "searchPlaceholder")}
                      aria-label={t(lang, "searchLabel")}
                      maxLength={80}
                    />
                    {query && (
                      <button
                        type="button"
                        className="search-clear"
                        onClick={() => {
                          setQuery("");
                          setQ("");
                        }}
                        aria-label={t(lang, "searchClear")}
                        title={t(lang, "searchClear")}
                      >
                        <CloseIcon size={14} />
                      </button>
                    )}
                  </form>

                  <div className="toolbar-right">
                    {isGithubActive && githubSubFilters.length > 0 && (
                      <select
                        className="select"
                        value={filter !== "github" ? filter : "github"}
                        onChange={(e) => setFilter(e.target.value)}
                        aria-label="GitHub"
                      >
                        <option value="github">{t(lang, "githubSubAll")}</option>
                        {githubSubFilters.map((f) => (
                          <option key={f.key} value={f.key}>
                            {filterLabel(f)}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="segmented" role="group" aria-label={t(lang, "sortLabel")}>
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

                    <select
                      className="select"
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
              </>
            )}

            {q && (
              <p className="results-line">
                {t(lang, "resultsFor")} <strong>“{q}”</strong>
              </p>
            )}

            {configMissing && <p className="notice">{t(lang, "configHint")}</p>}
            {(error || fetchError) && !configMissing && (
              <p className="notice error">
                {t(lang, "errorPrefix")}
                {error ? `: ${error}` : ""}
              </p>
            )}
            {isEmpty && !fetchError && (
              <p className="notice">{q ? t(lang, "noResults") : t(lang, "empty")}</p>
            )}

            <div className="feed">
              {groups.map((g) => (
                <Fragment key={g.key}>
                  {sort === "new" && (
                    <h2 className="day-heading" suppressHydrationWarning>
                      {dayLabel(g.key, lang, todayKey)}
                    </h2>
                  )}
                  {g.items.map((it) => (
                    <NewsCard key={it.id} item={it} lang={lang} initialSaved={savedIds.has(it.id)} />
                  ))}
                </Fragment>
              ))}
            </div>

            {loading && <SkeletonList count={items.length === 0 ? 5 : 2} />}
            {!loading && !hasMore && items.length > 0 && (
              <p className="feed-end">{t(lang, "end")}</p>
            )}

            {/* Điểm mốc để phát hiện cuộn tới cuối */}
            <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
          </main>

          <Rail lang={lang} topItems={topItems} />
        </div>
      </div>

      <SiteFooter lang={lang} />
      <BackToTop lang={lang} />
    </>
  );
}
