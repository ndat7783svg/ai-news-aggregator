"use client";

import { useEffect, useRef } from "react";

// Script quảng cáo Adsterra dùng document.write nội bộ — phải ghi vào document RIÊNG của
// 1 iframe (không phải document của trang), nếu không sẽ xoá trắng cả trang khi chạy sau
// lúc trang đã tải xong (hành vi mặc định của document.write ngoài lúc parse HTML).
export default function AdsterraBanner({ adKey, width, height }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const iframe = document.createElement("iframe");
    iframe.style.border = "0";
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.display = "block";
    iframe.scrolling = "no";
    container.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(
      `<script>atOptions=${JSON.stringify({
        key: adKey,
        format: "iframe",
        height,
        width,
        params: {},
      })};</script><script src="https://www.highperformanceformat.com/${adKey}/invoke.js"></script>`
    );
    doc.close();

    return () => {
      container.innerHTML = "";
    };
  }, [adKey, width, height]);

  return (
    <div
      ref={containerRef}
      style={{ width, height, margin: "0 auto" }}
      aria-hidden="true"
    />
  );
}
