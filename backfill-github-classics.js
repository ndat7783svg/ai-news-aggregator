// Script backfill: Thu thập, tóm tắt và ghi các repo GitHub "Kinh điển" vào DB. Chạy 1 lần.
//
// Cách chạy:
//   node --env-file=.env backfill-github-classics.js --count   # Chỉ đếm số repo thu được & chưa có trong DB (xem trước)
//   node --env-file=.env backfill-github-classics.js           # Thu thập, tóm tắt & ghi DB thật sự

import { collectGithubClassics } from "./collectors/github.js";
import { summarizeMany } from "./summarize/summarizer.js";
import { fetchExistingKeys, insertItems } from "./db/supabase.js";
import { itemKey } from "./lib/keys.js";

// Giá Claude Haiku 4.5 (USD / 1 triệu token).
const PRICE_IN = 1.0;
const PRICE_OUT = 5.0;

const COUNT_ONLY = process.argv.includes("--count");

async function main() {
  for (const k of ["ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[k]) {
      console.error(`Thiếu ${k} trong .env`);
      process.exit(1);
    }
  }

  console.log("1) Thu thập repo GitHub Kinh điển…");
  const collected = await collectGithubClassics();
  console.log(`   Tìm thấy ${collected.length} repo kinh điển.`);

  console.log("2) Kiểm tra trùng lặp với DB…");
  const existingKeys = await fetchExistingKeys(collected);
  const freshItems = collected.filter((it) => !existingKeys.has(itemKey(it)));
  // Lưu ý: dedupe theo (source, source_id) — 1 repo đã có ở nguồn GitHub KHÁC (vd github_trending)
  // vẫn tính là mới cho nguồn github_classics. Web sẽ gộp lại khi hiển thị "Tất cả GitHub".
  console.log(`   Đã có đúng nguồn github_classics: ${collected.length - freshItems.length} repo.`);
  console.log(`   Cần tóm tắt mới: ${freshItems.length} repo.`);
  const estimate = freshItems.length * 0.0018;
  console.log(`   Chi phí ước tính: ≈ $${estimate.toFixed(2)} (~$0.0018/repo).`);

  if (COUNT_ONLY || freshItems.length === 0) {
    if (freshItems.length === 0) console.log("Không có repo mới nào cần thêm. Xong.");
    else console.log("\n[--count] Chỉ đếm, chưa tóm tắt hay ghi DB.");
    return;
  }

  console.log(`\n3) Tóm tắt song ngữ AI cho ${freshItems.length} repo (concurrency 3)…`);
  let inTok = 0;
  let outTok = 0;
  const summarized = await summarizeMany(freshItems, {
    concurrency: 3,
    onUsage: (u) => {
      inTok += u.input_tokens || 0;
      outTok += u.output_tokens || 0;
      inTok += u.cache_creation_input_tokens || 0;
      inTok += u.cache_read_input_tokens || 0;
    },
  });

  // CHỈ ghi repo tóm tắt THÀNH CÔNG. Ghi cả bản lỗi sẽ tạo thẻ trống vĩnh viễn trên web:
  // dedupe theo (source, source_id) + upsert ignoreDuplicates khiến chạy lại KHÔNG sửa được.
  const ok = summarized.filter((s) => s.summaryVi && s.summaryEn && !s.summaryError);
  const failed = summarized.length - ok.length;
  if (failed) {
    console.log(`   ⚠ ${failed} repo tóm tắt lỗi — BỎ QUA (chạy lại script để thử tiếp).`);
    const firstErr = summarized.find((s) => s.summaryError);
    if (firstErr) console.log(`   ↳ Lỗi đầu tiên: status=${firstErr.summaryErrorStatus} — ${firstErr.summaryError}`);
  }

  // Hỏng TOÀN BỘ = lỗi hệ thống (key sai/hết credit), không phải vài tin lỗi lẻ.
  if (ok.length === 0) {
    console.error("LỖI: không tóm tắt được repo nào. Kiểm tra ANTHROPIC_API_KEY hoặc credit ở console.anthropic.com.");
    process.exit(1);
  }

  console.log(`\n4) Ghi ${ok.length} repo vào DB…`);
  const insertedCount = await insertItems(ok);
  const cost = (inTok / 1e6) * PRICE_IN + (outTok / 1e6) * PRICE_OUT;

  console.log(`\n>>> Xong! Đã ghi thành công ${insertedCount} repo kinh điển vào DB.`);
  console.log(`    Token: vào=${inTok} ra=${outTok} → chi phí ≈ $${cost.toFixed(4)}`);
  if (failed) console.log(`    (${failed} repo lỗi chưa ghi — chạy lại script để thử tiếp.)`);
}

main().catch((err) => {
  console.error("Lỗi script backfill-github-classics:", err);
  process.exit(1);
});
