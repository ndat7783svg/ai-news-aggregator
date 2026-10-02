"use client";

// Cặp nút Lưu + Chia sẻ dùng chung cho thẻ tin (NewsCard) và trang chi tiết (/tin/[id]).

import { useState, useEffect, useRef } from "react";
import { t } from "../lib/i18n";
import { saveUserItem, removeUserSavedItem } from "../lib/savedItems";
import { supabase } from "../lib/supabaseClient";
import { shareItem } from "../lib/share";
import { ShareIcon, BookmarkIcon } from "./icons";

export default function StoryActions({ item, lang, initialSaved = false, onUnsave, showLabels = false }) {
  const [saved, setSaved] = useState(initialSaved);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  // Đồng bộ trạng thái lưu giữa các thẻ cùng 1 tin trên trang.
  useEffect(() => {
    function handleSavedChange(e) {
      if (e.detail && e.detail.itemId === item.id) setSaved(e.detail.saved);
    }
    window.addEventListener("bai-saved-item-change", handleSavedChange);
    return () => window.removeEventListener("bai-saved-item-change", handleSavedChange);
  }, [item.id]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function flash(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }

  function emit(itemId, value) {
    window.dispatchEvent(
      new CustomEvent("bai-saved-item-change", { detail: { itemId, saved: value } })
    );
  }

  async function handleSave() {
    const currentPath = window.location.pathname + window.location.search;
    const loginUrl = `/dang-nhap?redirect=${encodeURIComponent(currentPath)}`;
    if (!supabase) {
      window.location.href = loginUrl;
      return;
    }

    const prev = saved;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = loginUrl;
        return;
      }

      const next = !prev;
      setSaved(next);
      emit(item.id, next);

      const ok = next ? await saveUserItem(item.id) : await removeUserSavedItem(item.id);
      if (!ok) {
        // Ghi DB thất bại → trả lại trạng thái cũ ở mọi thẻ.
        setSaved(prev);
        emit(item.id, prev);
        flash(t(lang, "actionFailed"));
      } else {
        flash(t(lang, next ? "savedToast" : "unsavedToast"));
        if (!next) onUnsave?.(item.id);
      }
    } catch {
      setSaved(prev);
      emit(item.id, prev);
      flash(t(lang, "actionFailed"));
    }
  }

  async function handleShare() {
    const result = await shareItem(item, lang);
    if (result === "copied") flash(t(lang, "copiedLink"));
  }

  return (
    <div className="story-actions">
      {toast && (
        <span className="action-toast" role="status">
          {toast}
        </span>
      )}
      <button
        className={`action-btn${showLabels ? " with-label" : ""}`}
        onClick={handleShare}
        title={t(lang, "share")}
        aria-label={t(lang, "share")}
      >
        <ShareIcon size={16} />
        {showLabels && <span>{t(lang, "share")}</span>}
      </button>
      <button
        className={`action-btn${saved ? " is-saved" : ""}${showLabels ? " with-label" : ""}`}
        onClick={handleSave}
        title={saved ? t(lang, "unsave") : t(lang, "save")}
        aria-label={saved ? t(lang, "unsave") : t(lang, "save")}
        aria-pressed={saved}
      >
        <BookmarkIcon size={16} filled={saved} />
        {showLabels && <span>{saved ? t(lang, "saved") : t(lang, "save")}</span>}
      </button>
    </div>
  );
}
