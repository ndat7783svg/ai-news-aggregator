// Backfill: dịch tiêu đề (title_vi) cho các tin CŨ chưa có. Chạy 1 lần.
// KHÔNG tạo lại tóm tắt (chỉ dịch tiêu đề → rẻ). Cần cột title_vi đã tồn tại trong DB.
//
// Cách chạy:
//   node --env-file=.env backfill-titles.js --count        # chỉ đếm số tin cần dịch (ước tính)
//   node --env-file=.env backfill-titles.js --limit 5      # dịch thử 5 tin
//   node --env-file=.env backfill-titles.js                # dịch tất cả tin còn thiếu

import { translateTitles } from "./summarize/summarizer.js";
import {
  fetchItemsMissingTitleVi,
  countItemsMissingTitleVi,
  updateTitleVi,
} from "./db/supabase.js";

// Giá Claude Haiku 4.5 (USD / 1 triệu token).
const PRICE_IN = 1.0;
const PRICE_OUT = 5.0;

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const COUNT_ONLY = process.argv.includes("--count");
const LIMIT = parseInt(argValue("--limit") || "0", 10) || null;

async function main() {
  for (const k of ["ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[k]) {
      console.error(`Thiếu ${k} trong .env`);
      process.exit(1);
    }
  }

  const total = await countItemsMissingTitleVi();
  console.log(`Tổng số tin CHƯA có title_vi: ${total}`);
  if (COUNT_ONLY || total === 0) {
    if (total === 0) console.log("Không có gì để backfill. Xong.");
    return;
  }

  let items = await fetchItemsMissingTitleVi(LIMIT || 5000);
  if (LIMIT) items = items.slice(0, LIMIT);
  console.log(`Dịch tiêu đề cho ${items.length} tin (concurrency 3)…\n`);

  let inTok = 0;
  let outTok = 0;
  const results = await translateTitles(items, {
    concurrency: 3,
    onUsage: (u) => {
      inTok += u.input_tokens || 0;
      outTok += u.output_tokens || 0;
      inTok += u.cache_creation_input_tokens || 0;
      inTok += u.cache_read_input_tokens || 0;
    },
  });

  let ok = 0;
  let failed = 0;
  for (const r of results) {
    if (r.titleVi && !r.titleError) {
      await updateTitleVi(r.id, r.titleVi);
      ok++;
      console.log(`  ✓ [${r.id}] ${r.title.slice(0, 44)}\n        → ${r.titleVi.slice(0, 60)}`);
    } else {
      failed++;
      console.log(`  ✗ [${r.id}] lỗi: ${r.titleError}`);
    }
  }

  const cost = (inTok / 1e6) * PRICE_IN + (outTok / 1e6) * PRICE_OUT;
  console.log(`\n>>> Xong. Cập nhật ${ok} tin, lỗi ${failed}.`);
  console.log(`    Token: vào=${inTok} ra=${outTok} → chi phí ≈ $${cost.toFixed(4)}`);
  if (failed) console.log("    (Chạy lại script để thử tiếp các tin còn thiếu.)");
}

main();
