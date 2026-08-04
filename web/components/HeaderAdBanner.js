"use client";

import { useEffect, useState } from "react";
import AdsterraBanner from "./AdsterraBanner";

// 2 mã Ad Unit tạo trên Adsterra (site bainews.site): banner cố định đầu trang,
// đổi kích thước theo màn hình để vừa cả điện thoại lẫn máy tính.
const DESKTOP_AD = { key: "3ebd63c5ce3bc4e28ba83347434a04f0", width: 728, height: 90 };
const MOBILE_AD = { key: "726c1b09a9bb018969d5911451da1fd0", width: 300, height: 250 };

export default function HeaderAdBanner() {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    // Chỉ tải 1 quảng cáo phù hợp màn hình, không tải cả 2 rồi ẩn bớt (ẩn quảng cáo mà vẫn
    // gọi request là vi phạm chính sách "hidden ads" của mạng quảng cáo).
    const mq = window.matchMedia("(min-width: 640px)");
    setAd(mq.matches ? DESKTOP_AD : MOBILE_AD);
  }, []);

  if (!ad) return null;

  return (
    <div className="header-ad-banner">
      <AdsterraBanner adKey={ad.key} width={ad.width} height={ad.height} />
    </div>
  );
}
