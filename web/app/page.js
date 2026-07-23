import { createClient } from "@supabase/supabase-js";
import Feed from "../components/Feed";

// ISR: trang được dựng lại tối đa mỗi 5 phút (khớp với nhịp thu thập tin).
export const revalidate = 300;

// Làm sạch giá trị biến môi trường (lỡ dán cả "TÊN=", dấu nháy, khoảng trắng thừa).
function cleanSecret(raw, name) {
  return raw
    .trim()
    .replace(new RegExp("^" + name + "\\s*=\\s*", "i"), "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

async function getItems() {
  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_ANON_KEY;
  if (!rawUrl || !rawKey) return { items: [], error: null, configMissing: true };

  const url = cleanSecret(rawUrl, "SUPABASE_URL")
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
  const key = cleanSecret(rawKey, "SUPABASE_ANON_KEY");
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("news_items")
      .select("id, source, title, url, author, published_at, score, summary_vi, summary_en")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) return { items: [], error: error.message, configMissing: false };
    return { items: data || [], error: null, configMissing: false };
  } catch (e) {
    return { items: [], error: e.message, configMissing: false };
  }
}

export default async function Page() {
  const { items, error, configMissing } = await getItems();
  return <Feed items={items} error={error} configMissing={configMissing} />;
}
