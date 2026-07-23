import Feed from "../components/Feed";
import { fetchItems, fetchAvailableSources } from "../lib/supabaseServer";
import { PAGE_SIZE } from "../lib/filters";

// ISR: trang được dựng lại tối đa mỗi 5 phút (khớp với nhịp thu thập tin).
export const revalidate = 300;

export default async function Page() {
  // Tải trang đầu (tất cả nguồn) + danh sách nguồn thực có (để hiện đúng nút lọc).
  const [{ items, hasMore, configMissing, error }, availableSources] = await Promise.all([
    fetchItems({ filter: "all", offset: 0, limit: PAGE_SIZE }),
    fetchAvailableSources(),
  ]);

  return (
    <Feed
      initialItems={items}
      initialHasMore={hasMore}
      availableSources={availableSources}
      error={error || null}
      configMissing={!!configMissing}
    />
  );
}
