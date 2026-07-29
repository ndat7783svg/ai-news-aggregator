// Script tạm: sinh ảnh og:image tĩnh (1200x630) bằng sharp, thay cho next/og (lỗi ERR_INVALID_URL
// trên Windows khi load font mặc định) và thay cho quy ước file opengraph-image.png trong app/
// (Next.js dev ở máy này không nhận diện file đó là metadata route — xem HANDOFF.md). Ghi thẳng
// vào public/ và khai báo URL trong generateMetadata thay vì dựa vào quy ước tự động của Next.
// Chạy 1 lần, không phải code chạy trong app. Sau khi có file PNG, có thể gỡ `sharp` khỏi
// node_modules (`npm install --no-save` không ghi vào package.json).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0e0f13"/>
  <rect x="480" y="150" width="240" height="240" rx="54" fill="#2563eb"/>
  <text x="600" y="330" font-family="Arial, Helvetica, sans-serif" font-size="150" font-weight="700"
        fill="#ffffff" text-anchor="middle">B</text>
  <text x="600" y="470" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700"
        fill="#ffffff" text-anchor="middle">BAI News</text>
  <text x="600" y="520" font-family="Arial, Helvetica, sans-serif" font-size="30"
        fill="#9aa0ab" text-anchor="middle">Tổng hợp &amp; tóm tắt tin tức AI, kèm nguồn</text>
</svg>
`;

const outPath = new URL("../public/og-banner.png", import.meta.url);
const buf = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(outPath, buf);
console.log("Wrote", outPath.pathname, buf.length, "bytes");
