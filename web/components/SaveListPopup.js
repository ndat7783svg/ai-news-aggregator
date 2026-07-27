"use client";

import { useRef, useEffect, useState } from "react";
import {
  getState,
  saveItem,
  removeItem,
  createList,
  getListsForItem,
} from "../lib/savedLists";
import { t } from "../lib/i18n";

/**
 * Popup quản lý danh sách lưu tin.
 * Props:
 *   itemId  — id của tin đang xem xét
 *   lang    — "vi" | "en"
 *   onClose — callback khi popup đóng
 *   onUpdate — callback sau khi state localStorage thay đổi (để cha re-render icon)
 */
export default function SaveListPopup({ itemId, lang, onClose, onUpdate }) {
  const overlayRef = useRef(null);
  const [state, setState] = useState(() => getState());
  const [checkedIds, setCheckedIds] = useState(() => getListsForItem(itemId));
  const [newName, setNewName] = useState("");

  // Đóng khi click ra ngoài popup.
  useEffect(() => {
    function handleClick(e) {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function toggle(listId) {
    const alreadyIn = checkedIds.includes(listId);
    if (alreadyIn) {
      removeItem(itemId, listId);
      setCheckedIds((prev) => prev.filter((id) => id !== listId));
    } else {
      saveItem(itemId, listId);
      setCheckedIds((prev) => [...prev, listId]);
    }
    onUpdate?.();
  }

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const listId = createList(trimmed);
    if (listId) {
      // Tự động thêm tin vào danh sách mới tạo.
      saveItem(itemId, listId);
      setState(getState());
      setCheckedIds((prev) => [...prev, listId]);
      setNewName("");
      onUpdate?.();
    }
  }

  const lists = Object.entries(state.lists);

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--card-bg, #fff)",
          border: "1px solid var(--border, #e5e7eb)",
          borderRadius: 12,
          padding: "1.25rem",
          minWidth: 260,
          maxWidth: 340,
          width: "90vw",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {t(lang, "saveToList")}
          </span>
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: "var(--muted)",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {lists.map(([listId, listInfo]) => (
            <label
              key={listId}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={checkedIds.includes(listId)}
                onChange={() => toggle(listId)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: "0.9rem" }}>{listInfo.name}</span>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder={t(lang, "newListPlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            style={{
              flex: 1,
              padding: "0.4rem 0.6rem",
              borderRadius: 6,
              border: "1px solid var(--border, #e5e7eb)",
              background: "var(--bg, #fff)",
              color: "var(--text, #111)",
              fontSize: "0.85rem",
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: 6,
              border: "none",
              background: "var(--accent, #1d4ed8)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
