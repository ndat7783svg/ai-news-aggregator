"use client";

import { useState, useEffect } from "react";
import { getState, renameList, deleteList, removeItem } from "../../lib/savedLists";
import { t } from "../../lib/i18n";
import NewsCard from "../../components/NewsCard";

export default function DaLuuPage() {
  const [lang, setLang] = useState("vi");
  const [savedState, setSavedState] = useState(null);
  const [itemsMap, setItemsMap] = useState({}); // id → item object
  const [loading, setLoading] = useState(true);
  // Chỉnh sửa tên danh sách
  const [editingListId, setEditingListId] = useState(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    // Đọc lang từ localStorage
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {
      // giữ mặc định "vi"
    }
    loadData();
  }, []);

  async function loadData() {
    const state = getState();
    setSavedState(state);

    const allIds = [...new Set(state.saved.map((s) => s.itemId))];
    if (allIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/saved-items?ids=${allIds.join(",")}`);
      const json = await res.json();
      const map = {};
      for (const item of json.items || []) {
        map[item.id] = item;
      }
      setItemsMap(map);
    } catch {
      // Lỗi mạng → itemsMap trống, hiện thông báo lỗi nhẹ
    }
    setLoading(false);
  }

  function refresh() {
    setSavedState(getState());
    loadData();
  }

  function handleUnsave(itemId, listId) {
    removeItem(itemId, listId);
    refresh();
  }

  function startRename(listId, currentName) {
    setEditingListId(listId);
    setEditingName(currentName);
  }

  function confirmRename(listId) {
    if (editingName.trim()) {
      renameList(listId, editingName.trim());
    }
    setEditingListId(null);
    setSavedState(getState());
  }

  function handleDeleteList(listId) {
    deleteList(listId);
    refresh();
  }

  if (!savedState) return null;

  const lists = Object.entries(savedState.lists);
  const totalSaved = savedState.saved.length;

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

      {!loading && totalSaved === 0 && (
        <p style={{ color: "var(--muted)" }}>{t(lang, "savedEmpty")}</p>
      )}

      {!loading && lists.map(([listId, listInfo]) => {
        const listSaved = savedState.saved.filter((s) => s.listId === listId);
        if (listSaved.length === 0) return null;

        const items = listSaved
          .map((s) => itemsMap[s.itemId])
          .filter(Boolean);

        return (
          <section key={listId} className="saved-section">
            <div className="saved-section-header">
              {editingListId === listId ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmRename(listId)}
                    autoFocus
                    style={{
                      border: "1px solid var(--accent)",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: "1rem",
                      fontWeight: 700,
                      background: "var(--bg)",
                      color: "var(--text)",
                    }}
                  />
                  <button className="small-btn" onClick={() => confirmRename(listId)}>✓</button>
                  <button className="small-btn" onClick={() => setEditingListId(null)}>✕</button>
                </>
              ) : (
                <>
                  <h3 className="saved-section-title">
                    {listInfo.name}
                    <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "var(--muted)", marginLeft: 8 }}>
                      ({listSaved.length})
                    </span>
                  </h3>
                  <div className="saved-section-actions">
                    <button
                      className="small-btn"
                      onClick={() => startRename(listId, listInfo.name)}
                    >
                      {t(lang, "renameList")}
                    </button>
                    {listId !== "default" && (
                      <button
                        className="small-btn danger"
                        onClick={() => handleDeleteList(listId)}
                      >
                        {t(lang, "deleteList")}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="feed">
              {items.map((item) => (
                <div key={item.id} style={{ position: "relative" }}>
                  <NewsCard item={item} lang={lang} />
                  <button
                    className="small-btn danger"
                    style={{ position: "absolute", top: 12, right: 12 }}
                    onClick={() => handleUnsave(item.id, listId)}
                  >
                    {t(lang, "unsave")}
                  </button>
                </div>
              ))}
              {listSaved.length > items.length && (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  {listSaved.length - items.length} {t(lang, "savedMissing")}
                </p>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
