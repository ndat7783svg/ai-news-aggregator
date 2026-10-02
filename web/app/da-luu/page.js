"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchUserSavedItemIds } from "../../lib/savedItems";
import { supabase } from "../../lib/supabaseClient";
import { t } from "../../lib/i18n";
import { useLang } from "../../lib/useSiteState";
import NewsCard from "../../components/NewsCard";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export default function DaLuuPage() {
  const [lang] = useLang();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const ids = await fetchUserSavedItemIds();
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/saved-items?ids=${ids.join(",")}`);
      const json = await res.json();
      const rawItems = json.items || [];

      // Sắp xếp các item theo đúng thứ tự mảng IDs (mới lưu nhất lên đầu)
      const map = new Map(rawItems.map((item) => [item.id, item]));
      const ordered = ids.map((id) => map.get(id)).filter(Boolean);

      setItems(ordered);
    } catch {
      // Lỗi mạng
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleUnsave(unSavedId) {
    setItems((prev) => prev.filter((item) => item.id !== unSavedId));
  }

  return (
    <>
      <SiteHeader active="saved" />

      <main className="page-narrow">
        <div className="page-head">
          <h1 className="page-title">{t(lang, "savedPageTitle")}</h1>
          <p className="page-desc">{t(lang, "savedPageDesc")}</p>
        </div>

        {loading && <p className="loadmore">{t(lang, "loadingMore")}</p>}

        {!loading && !user && (
          <div className="empty-state">
            <p>{t(lang, "savedRequireLogin")}</p>
            <a href="/dang-nhap?redirect=/da-luu" className="btn-ink">
              {t(lang, "login")}
            </a>
          </div>
        )}

        {!loading && user && items.length === 0 && (
          <div className="empty-state">
            <p>{t(lang, "savedEmpty")}</p>
            <a href={lang === "en" ? "/en" : "/"} className="btn-ink">
              {t(lang, "browseNews")}
            </a>
          </div>
        )}

        {!loading && user && items.length > 0 && (
          <div className="feed">
            {items.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                lang={lang}
                initialSaved={true}
                onUnsave={handleUnsave}
              />
            ))}
          </div>
        )}
      </main>

      <SiteFooter lang={lang} />
    </>
  );
}
