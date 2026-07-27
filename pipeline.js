// Pipeline chính (cột mốc 3): thu thập → lọc tin mới → tóm tắt → ghi Supabase.
// Đây là script sẽ được GitHub Actions chạy tự động ở cột mốc 5.
// Chạy: node --env-file=.env pipeline.js   (hoặc: npm run pipeline)

import { collectHackerNews } from "./collectors/hackernews.js";
import { collectArxiv } from "./collectors/arxiv.js";
import { collectBlogs } from "./collectors/blogs.js";
import {
  collectGithubReleases,
  collectGithubTrending,
  collectGithubTrendingScrape,
} from "./collectors/github.js";
import { collectReddit } from "./collectors/reddit.js";
import { summarizeMany } from "./summarize/summarizer.js";
import { fetchExistingKeys, insertItems } from "./db/supabase.js";
import { itemKey } from "./lib/keys.js";

// Các collector đang bật. Reddit tự bỏ qua nếu chưa có credential.
const COLLECTORS = [
  ["Hacker News", collectHackerNews],
  ["arXiv", collectArxiv],
  ["Blog", collectBlogs],
  ["GitHub Releases", collectGithubReleases],
  ["GitHub Trending", collectGithubTrending],
  ["GitHub Trending Daily", () => collectGithubTrendingScrape("daily")],
  ["GitHub Trending Weekly", () => collectGithubTrendingScrape("weekly")],
  ["GitHub Trending Monthly", () => collectGithubTrendingScrape("monthly")],
  ["Reddit", collectReddit],
];

async function safeCollect(name, fn) {
  try {
    return await fn();
  } catch (err) {
    const reason =
      err?.cause?.code === "UND_ERR_CONNECT_TIMEOUT"
        ? "quá thời gian kết nối (mạng?)"
        : err.message;
    console.error(`  ⚠ Không lấy được ${name}: ${reason}`);
    return [];
  }
}

async function main() {
  // Kiểm tra biến môi trường cần thiết.
  for (const k of ["ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[k]) {
      console.error(`Thiếu ${k} trong .env`);
      process.exit(1);
    }
  }

  console.log("1) Thu thập tin…");
  const collected = await Promise.all(
    COLLECTORS.map(([name, fn]) => safeCollect(name, fn))
  );
  const all = collected.flat();
  const counts = COLLECTORS.map(([name], i) => `${name} ${collected[i].length}`).join(", ");
  console.log(`   Thu được ${all.length} tin (${counts}).`);
  if (all.length === 0) {
    console.error("Không có tin nào (mạng?). Dừng.");
    process.exit(1);
  }

  console.log("2) Lọc tin đã có trong DB…");
  const existing = await fetchExistingKeys(all);
  const fresh = all.filter((it) => !existing.has(itemKey(it)));
  console.log(`   ${fresh.length} tin mới (bỏ qua ${all.length - fresh.length} tin đã có).`);
  if (fresh.length === 0) {
    console.log("Không có tin mới. Xong.");
    return;
  }

  console.log(`3) Tóm tắt ${fresh.length} tin mới bằng Claude Haiku…`);
  const summarized = await summarizeMany(fresh, { concurrency: 3 });
  const ok = summarized.filter((s) => s.summaryVi && s.summaryEn && !s.summaryError);
  const failed = summarized.length - ok.length;
  if (failed) {
    console.log(`   ⚠ ${failed} tin tóm tắt lỗi — sẽ thử lại lần chạy sau.`);
    const firstErr = summarized.find((s) => s.summaryError);
    if (firstErr) console.log(`   ↳ Lỗi đầu tiên: status=${firstErr.summaryErrorStatus} — ${firstErr.summaryError}`);
  }

  // Nếu CÓ tin mới mà tóm tắt hỏng TOÀN BỘ → lỗi hệ thống (key sai/hết hạn/hết credit).
  // Thoát mã 1 để GitHub Actions báo ĐỎ, tránh "success" giả che mất lỗi.
  if (fresh.length > 0 && ok.length === 0) {
    console.error("LỖI: không tóm tắt được tin nào. Kiểm tra ANTHROPIC_API_KEY (sai/hết hạn) hoặc credit ở console.anthropic.com.");
    process.exit(1);
  }

  console.log(`4) Ghi ${ok.length} tin vào Supabase…`);
  const inserted = await insertItems(ok);
  console.log(`   Đã ghi ${inserted} tin.`);

  console.log("\n>>> Xong pipeline.");
}

main();
