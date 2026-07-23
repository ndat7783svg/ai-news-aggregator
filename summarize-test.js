// Test cột mốc 2: thu thập vài tin rồi tóm tắt AI song ngữ, in ra để xem chất lượng.
// Chạy: node --env-file=.env summarize-test.js
// (cần có file .env chứa ANTHROPIC_API_KEY=... — xem hướng dẫn trong README)

import { collectHackerNews } from "./collectors/hackernews.js";
import { collectArxiv } from "./collectors/arxiv.js";
import { summarizeMany } from "./summarize/summarizer.js";

// Số tin lấy mỗi nguồn để test (giữ nhỏ cho nhanh và rẻ).
const PER_SOURCE = 3;

function printResult(item, idx) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`${idx}. [${item.source}] ${item.title}`);
  console.log(`   link: ${item.url}`);
  if (item.summaryError) {
    console.log(`   ⚠ LỖI tóm tắt: ${item.summaryError}`);
    return;
  }
  console.log(`\n   🇻🇳 ${item.summaryVi}`);
  console.log(`\n   🇬🇧 ${item.summaryEn}`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Thiếu ANTHROPIC_API_KEY. Hãy tạo file .env (xem README) rồi chạy:");
    console.error("  node --env-file=.env summarize-test.js");
    process.exit(1);
  }

  console.log("Thu thập vài tin để test tóm tắt…");

  // Lấy từng nguồn an toàn: 1 nguồn lỗi mạng không làm sập cả chương trình.
  async function safe(name, fn) {
    try {
      return await fn();
    } catch (err) {
      const reason = err?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ? "quá thời gian kết nối (mạng?)" : err.message;
      console.error(`  ⚠ Không lấy được ${name}: ${reason}`);
      return [];
    }
  }

  const [hn, arxiv] = await Promise.all([
    safe("Hacker News", collectHackerNews),
    safe("arXiv", collectArxiv),
  ]);

  // Lấy vài tin mỗi nguồn để chất lượng tóm tắt dễ so sánh.
  const sample = [...hn.slice(0, PER_SOURCE), ...arxiv.slice(0, PER_SOURCE)];
  if (sample.length === 0) {
    console.error("\nKhông thu được tin nào — thường do mất kết nối internet. Kiểm tra mạng rồi chạy lại: npm run summarize");
    process.exit(1);
  }
  console.log(`Đang tóm tắt ${sample.length} tin bằng Claude Haiku…\n`);

  const summarized = await summarizeMany(sample, { concurrency: 3 });
  summarized.forEach((it, i) => printResult(it, i + 1));

  const errors = summarized.filter((s) => s.summaryError).length;
  console.log(`\n${"─".repeat(70)}`);
  console.log(`Xong. ${summarized.length - errors}/${summarized.length} tin tóm tắt OK.`);
  if (errors) console.log(`${errors} tin lỗi — xem thông báo lỗi ở trên.`);
}

main();
