"use client";

import { useEffect, useRef, useState } from "react";
import NewsCard from "./NewsCard";
import { t } from "../lib/i18n";
import { SOURCE_FILTERS, PAGE_SIZE } from "../lib/filters";

export default function Feed({
  initialItems,
  initialHasMore,
  availableSources = [],
  error,
  configMissing,
}) {
  const [lang, setLang] = useState("vi");
  const [filter, setFilter] = useState("all");
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

  // Đổi bộ lọc → tải lại trang đầu cho nguồn đó (bỏ qua lần đầu "all" vì đã có SSR).
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

    fetch(`/api/items?filter=${encodeURIComponent(filter)}&offset=0&limit=${PAGE_SIZE}`)
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
  }, [filter]);

  // Tải thêm batch tiếp theo (nối vào cuối).
  async function loadMore() {
    if (loading || !hasMore || configMissing || error) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/items?filter=${encodeURIComponent(filter)}&offset=${offsetRef.current}&limit=${PAGE_SIZE}`
      );
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
  const availableFilters = SOURCE_FILTERS.filter(
    (f) => filter === f.key || f.sources.some((s) => availableSources.includes(s))
  );
  const activeFilterLabel =
    filter === "all" ? t(lang, "all") : SOURCE_FILTERS.find((f) => f.key === filter)?.label;

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

      {!configMissing && !error && availableFilters.length > 0 && (
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
              className={filter === f.key ? "active" : ""}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
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
    </main>
  );
}
