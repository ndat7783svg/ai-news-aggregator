// Kết nối Supabase và các thao tác đọc/ghi cho bảng news_items.
// Script dùng SERVICE ROLE key (toàn quyền, chạy phía server) — KHÔNG để lộ ra frontend.

import { createClient } from "@supabase/supabase-js";

const TABLE = "news_items";

let client = null;
function getClient() {
  if (!client) {
    const rawUrl = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!rawUrl || !key) {
      throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env");
    }
    // Chuẩn hoá URL cho "chịu đựng" các kiểu dán thừa hay gặp:
    // - lỡ dán cả "SUPABASE_URL=" phía trước
    // - lỡ dán kèm dấu nháy
    // - dấu "/" cuối hoặc phần "/rest/v1" thừa
    // Thư viện Supabase cần URL gốc (https://xxxx.supabase.co).
    const url = rawUrl
      .trim()
      .replace(/^SUPABASE_URL\s*=\s*/i, "")
      .replace(/["']/g, "")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/rest\/v1$/, "");
    client = createClient(url, key.trim(), { auth: { persistSession: false } });
  }
  return client;
}

/**
 * Trong số items truyền vào, trả về Set các khoá "source|source_id" ĐÃ có trong DB.
 * Dùng để lọc ra tin mới trước khi tóm tắt (tiết kiệm chi phí AI).
 */
export async function fetchExistingKeys(items) {
  if (items.length === 0) return new Set();

  const sourceIds = [...new Set(items.map((i) => i.sourceId))];
  const existing = new Set();
  const BATCH = 200; // chia lô để không tạo query quá dài

  for (let i = 0; i < sourceIds.length; i += BATCH) {
    const chunk = sourceIds.slice(i, i + BATCH);
    const { data, error } = await getClient()
      .from(TABLE)
      .select("source, source_id")
      .in("source_id", chunk);
    if (error) throw new Error(`Lỗi đọc Supabase: ${error.message}`);
    for (const row of data) existing.add(`${row.source}|${row.source_id}`);
  }
  return existing;
}

/**
 * Ghi các item (đã có tóm tắt) vào DB.
 * Dùng upsert bỏ qua trùng theo (source, source_id) để an toàn nếu chạy chồng lần.
 * @returns {Promise<number>} số dòng thực sự được thêm.
 */
export async function insertItems(items) {
  if (items.length === 0) return 0;

  const rows = items.map((it) => ({
    source: it.source,
    source_id: it.sourceId,
    title: it.title,
    url: it.url,
    author: it.author ?? null,
    published_at: it.publishedAt ?? null,
    score: it.score ?? null,
    summary_vi: it.summaryVi ?? null,
    summary_en: it.summaryEn ?? null,
    extra: it.extra ?? {},
  }));

  const { data, error } = await getClient()
    .from(TABLE)
    .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(`Lỗi ghi Supabase: ${error.message}`);
  return data ? data.length : 0;
}
