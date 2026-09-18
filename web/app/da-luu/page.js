"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchUserSavedItemIds } from "../../lib/savedItems";
import { supabase } from "../../lib/supabaseClient";
import { t } from "../../lib/i18n";
import NewsCard from "../../components/NewsCard";

export default function DaLuuPage() {
  const [lang, setLang] = useState("vi");
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
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {}

    loadData();
  }, [loadData]);

  function handleUnsave(unSavedId) {
    setItems((prev) => prev.filter((item) => item.id !== unSavedId));
  }

  return (
    <main className="wrap">
      <header className="site-header">
        <div>
          <h1 className="site-title">
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
              BAI News
            </a>
          </h1>
          <p className="tagline">
            <a href="/" className="detail-back" style={{ marginBottom: 0 }}>
              {t(lang, "backHome")}
            </a>
          </p>
        </div>
      </header>

      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "1rem 0 1.5rem" }}>
        {t(lang, "saved")}
      </h2>

      {loading && (
        <p style={{ color: "var(--muted)" }}>{t(lang, "loadingMore")}</p>
      )}

      {!loading && !user && (
        <div className="saved-auth-prompt">
          <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
            {t(lang, "savedRequireLogin")}
          </p>
          <a
            href="/dang-nhap?redirect=/da-luu"
            className="auth-btn-primary"
            style={{
              display: "inline-block",
              width: "auto",
              padding: "8px 20px",
              textDecoration: "none",
            }}
          >
            {t(lang, "login")}
          </a>
        </div>
      )}

      {!loading && user && items.length === 0 && (
        <p style={{ color: "var(--muted)" }}>{t(lang, "savedEmpty")}</p>
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
  );
}
