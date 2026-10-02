"use client";

// Bộ đếm lượt bấm vào tin (ẩn danh). Gắn 1 lần ở layout.js, nghe click trên toàn trang:
// link nào có `data-track-id` + `data-track-source` + `data-track-place` thì gửi 1 sự kiện
// về /api/track bằng sendBeacon (không chặn việc mở link, vẫn gửi được khi rời trang).
// Dùng thuộc tính data-* nên gắn được cả vào Server Component (GithubAiList) mà không cần JS riêng.

import { useEffect } from "react";

function currentLang() {
  if (location.pathname === "/en" || location.pathname.startsWith("/en/")) return "en";
  try {
    return localStorage.getItem("lang") === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
}

export default function ClickTracker() {
  useEffect(() => {
    // Bỏ qua trình duyệt tự động (bot, công cụ test) để số liệu sạch.
    if (navigator.webdriver) return;

    function onClick(e) {
      // Chỉ chuột trái (click) và chuột giữa (auxclick, mở tab mới).
      if (e.type === "auxclick" && e.button !== 1) return;
      const a = e.target.closest?.("a[data-track-source]");
      if (!a) return;
      const payload = JSON.stringify({
        itemId: Number(a.dataset.trackId) || null,
        source: a.dataset.trackSource,
        placement: a.dataset.trackPlace,
        lang: currentLang(),
        device: window.matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop",
      });
      try {
        const blob = new Blob([payload], { type: "application/json" });
        if (!navigator.sendBeacon?.("/api/track", blob)) {
          fetch("/api/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
        }
      } catch {}
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  return null;
}

