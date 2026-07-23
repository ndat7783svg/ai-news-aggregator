import Feed from "../components/Feed";
import { fetchItems } from "../lib/supabaseServer";
import { PAGE_SIZE } from "../lib/filters";

// ISR: trang được dựng lại tối đa mỗi 5 phút (khớp với nhịp thu thập tin).
export const revalidate = 300;

export default async function Page() {
  // Tải trang đầu (tất cả nguồn) phía server để hiển thị nhanh; phần còn lại
  // client tự tải thêm khi cuộn (infinite scroll).
  const { items, hasMore, configMissing, error } = await fetchItems({
    filter: "all",
    offset: 0,
    limit: PAGE_SIZE,
  });

  return (
    <Feed
      initialItems={items}
      initialHasMore={hasMore}
      error={error || null}
      configMissing={!!configMissing}
    />
  );
}
