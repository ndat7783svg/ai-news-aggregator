"use client";

import { useEffect, useState } from "react";

// Banner tự ẩn sau ngày này (3 ngày kể từ 27/07/2026).
const BANNER_EXPIRES = new Date("2026-07-30T23:59:59+07:00").getTime();
const DISMISS_KEY = "dismissedBanner_baiRename2026";

export default function RenameBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Hết hạn → không hiện.
    if (Date.now() > BANNER_EXPIRES) return;
    // Đã bấm đóng lần trước → không hiện.
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {}
    setVisible(true);
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
      <p className="rename-banner-text">
        📢 SAI News nay đã đổi tên thành <strong>BAI News</strong> tại tên
        miền mới <strong>bainews.site</strong>.
      </p>
      <button
        className="rename-banner-close"
        onClick={dismiss}
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}
