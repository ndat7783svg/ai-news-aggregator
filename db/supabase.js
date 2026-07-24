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
    // Chuẩn hoá "chịu đựng" các kiểu dán thừa hay gặp: lỡ dán cả "TÊN=" phía trước,
    // dấu nháy bao ngoài, khoảng trắng/xuống dòng thừa.
    const cleanSecret = (raw, name) =>
      raw
        .trim()
        .replace(new RegExp("^" + name + "\\s*=\\s*", "i"), "")
        .replace(/^["']|["']$/g, "")
        .trim();

    // URL: thêm bỏ dấu "/" cuối và phần "/rest/v1" thừa.
    const url = cleanSecret(rawUrl, "SUPABASE_URL")
      .replace(/\/+$/, "")
      .replace(/\/rest\/v1$/, "");
    const cleanKey = cleanSecret(key, "SUPABASE_SERVICE_ROLE_KEY");
    client = createClient(url, cleanKey, { auth: { persistSession: false } });
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
    title_vi: it.titleVi ?? null,
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

/**
 * (Backfill) Lấy các tin CHƯA có title_vi. Chỉ lấy cột cần cho việc dịch.
 * @param {number} limit số tin tối đa lấy về
 */
export async function fetchItemsMissingTitleVi(limit = 1000) {
  const { data, error } = await getClient()
    .from(TABLE)
    .select("id, source, title")
    .is("title_vi", null)
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Lỗi đọc Supabase: ${error.message}`);
  return data || [];
}

/**
 * (Backfill) Đếm số tin chưa có title_vi (không tải dữ liệu — để ước tính chi phí).
 */
export async function countItemsMissingTitleVi() {
  const { count, error } = await getClient()
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .is("title_vi", null);
  if (error) throw new Error(`Lỗi đọc Supabase: ${error.message}`);
  return count ?? 0;
}

/**
 * (Backfill) Cập nhật title_vi cho 1 tin theo id.
 */
export async function updateTitleVi(id, titleVi) {
  const { error } = await getClient()
    .from(TABLE)
    .update({ title_vi: titleVi })
    .eq("id", id);
  if (error) throw new Error(`Lỗi cập nhật id=${id}: ${error.message}`);
}
