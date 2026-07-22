// Điểm chạy chính của phần thu thập (cột mốc 1).
// Chạy: node collect.js  (hoặc: npm run collect)
// Nhiệm vụ: gọi các collector, gộp kết quả, in ra console gọn đẹp để xem trước.

import { collectHackerNews } from "./collectors/hackernews.js";
import { collectArxiv } from "./collectors/arxiv.js";

/** Định dạng thời gian ISO -> "22/07 15:30" cho dễ đọc; giữ nguyên nếu không parse được. */
function fmtTime(iso) {
  if (!iso) return "?";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** In một item ra console theo định dạng nhất quán. */
function printItem(item, idx) {
  const scorePart = item.score !== null ? `  ▲${item.score}` : "";
  console.log(`\n  ${idx}. ${item.title}`);
  console.log(`     nguồn: ${item.source}${scorePart}   ${fmtTime(item.publishedAt)}`);
  if (item.author) console.log(`     tác giả: ${item.author}`);
  console.log(`     link: ${item.url}`);
  if (item.extra?.abstract) {
    const short = item.extra.abstract.slice(0, 200);
    console.log(`     tóm lược gốc: ${short}${item.extra.abstract.length > 200 ? "…" : ""}`);
  }
}

/** Chạy một collector, không để lỗi của nguồn này làm chết nguồn kia. */
async function runSafe(name, fn) {
  try {
    const items = await fn();
    console.log(`\n===== ${name}: ${items.length} tin =====`);
    items.forEach((it, i) => printItem(it, i + 1));
    return items;
  } catch (err) {
    console.error(`\n===== ${name}: LỖI =====`);
    console.error(`  ${err.message}`);
    return [];
  }
}

async function main() {
  console.log("Bắt đầu thu thập tin AI (cột mốc 1)…");

  const [hn, arxiv] = await Promise.all([
    runSafe("Hacker News", collectHackerNews),
    runSafe("arXiv", collectArxiv),
  ]);

  const total = hn.length + arxiv.length;
  console.log(`\n\n>>> Tổng cộng: ${total} tin (HN: ${hn.length}, arXiv: ${arxiv.length})`);
  console.log(">>> Xong. Chưa lưu database, chưa tóm tắt AI — đúng phạm vi cột mốc 1.");
}

main();
