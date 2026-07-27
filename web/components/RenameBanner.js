"use client";

import { useEffect, useState } from "react";
import { t } from "../lib/i18n";

// Banner tự ẩn sau ngày này (3 ngày kể từ 27/07/2026).
const BANNER_EXPIRES = new Date("2026-07-30T23:59:59+07:00").getTime();
const DISMISS_KEY = "dismissedBanner_baiRename2026";

export default function RenameBanner() {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState("vi");

  useEffect(() => {
    // Hết hạn → không hiện.
    if (Date.now() > BANNER_EXPIRES) return;
    // Đã bấm đóng lần trước → không hiện.
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
      const saved = localStorage.getItem("lang");
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {}
    setVisible(true);

    // Nghe sự kiện đổi ngôn ngữ từ Feed (nút VI/EN) để đổi chữ ngay, không cần tải lại trang.
    function onLangChange(e) {
      if (e.detail === "vi" || e.detail === "en") setLang(e.detail);
    }
    window.addEventListener("bai-lang-change", onLangChange);
    return () => window.removeEventListener("bai-lang-change", onLangChange);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  return (
    <div className="rename-banner" role="status">
      <p className="rename-banner-text">📢 {t(lang, "renameBannerText")}</p>
      <button
        className="rename-banner-close"
        onClick={dismiss}
        aria-label={t(lang, "renameBannerClose")}
      >
        ✕
      </button>
    </div>
  );
}
