// Thống kê lượt bấm vào tin theo LOẠI TIN (bảng click_events) để biết người đọc quan tâm gì nhất.
// Chạy: npm run click-stats            (mặc định 14 ngày gần nhất)
//       npm run click-stats -- 30      (30 ngày)
// Dùng SERVICE ROLE key trong .env (bảng chỉ cho web GHI, không cho đọc công khai).

import { getClient } from "./db/supabase.js";

const LABELS = {
  github: "GitHub",
  blog_labs: "Blog hãng AI",
  blog_press: "Báo công nghệ",
  hackernews: "Hacker News",
  arxiv: "arXiv",
  blog_news: "Newsletter",
  reddit: "Reddit",
  other: "Khác",
};
const PLACES = {
  feed: "Danh sách tin trang chủ",
  github_strip: "Khối GitHub đầu trang",
  rail_top: "Cột Nổi bật tuần",
  detail: "Trang chi tiết (nút đọc bài gốc)",
  related: "Trang chi tiết (Tin mới khác)",
  github_page: "Trang /github-ai",
  saved: "Trang Tin đã lưu",
};

function table(title, counts, labels, total) {
  console.log(`\n${title}`);
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return console.log("  (chưa có dữ liệu)");
  for (const [k, n] of rows) {
    const pct = ((n / total) * 100).toFixed(1).padStart(5);
    console.log(`  ${(labels[k] || k).padEnd(34)} ${String(n).padStart(6)}  ${pct}%`);
  }
}

async function main() {
const days = Number(process.argv[2]) || 14;
const since = new Date(Date.now() - days * 86400000).toISOString();
const supabase = getClient();

// Lấy theo trang 1000 dòng (giới hạn mặc định của Supabase).
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from("click_events")
    .select("item_id, category, placement, device")
    .gte("created_at", since)
    .range(from, from + 999);
  if (error) {
    console.error("Lỗi đọc click_events:", error.message);
    process.exitCode = 1;
    return;
  }
  rows.push(...data);
  if (data.length < 1000) break;
}

const total = rows.length;
console.log(`Lượt bấm vào tin trong ${days} ngày gần nhất: ${total}`);
if (!total) return;

const count = (key) =>
  rows.reduce((acc, r) => ((acc[r[key]] = (acc[r[key]] || 0) + 1), acc), {});
table("Theo LOẠI TIN:", count("category"), LABELS, total);
table("Theo VỊ TRÍ bấm:", count("placement"), PLACES, total);
table("Theo THIẾT BỊ:", count("device"), { mobile: "Điện thoại", desktop: "Máy tính" }, total);

// 10 tin được bấm nhiều nhất (kèm tiêu đề).
const byItem = count("item_id");
delete byItem.null;
const top = Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 10);
if (top.length) {
  const { data: items } = await supabase
    .from("news_items")
    .select("id, title, title_vi, source")
    .in("id", top.map(([id]) => Number(id)));
  const map = new Map((items || []).map((i) => [String(i.id), i]));
  console.log("\n10 tin được bấm nhiều nhất:");
  for (const [id, n] of top) {
    const it = map.get(id);
    console.log(`  ${String(n).padStart(4)}  [${it?.source || "?"}] ${(it?.title_vi || it?.title || id).slice(0, 80)}`);
  }
}
}

// Dùng return thay process.exit() — process.exit đột ngột trên Windows hay gây lỗi "Assertion failed".
main();
