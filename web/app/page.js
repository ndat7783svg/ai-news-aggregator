import Feed from "../components/Feed";
import { fetchItems, fetchAvailableSources } from "../lib/supabaseServer";
import { PAGE_SIZE } from "../lib/filters";

// ISR: trang được dựng lại tối đa mỗi 5 phút (khớp với nhịp thu thập tin).
export const revalidate = 300;

export const metadata = {
  title: "BAI News — Tin AI mới nhất, tóm tắt tiếng Việt",
  description:
    "Tổng hợp tin tức AI từ Hacker News, arXiv, GitHub và các blog công nghệ hàng đầu, tóm tắt song ngữ Việt–Anh, kèm link nguồn. Cập nhật liên tục, không cần đọc tiếng Anh.",
  keywords: [
    "tin AI",
    "tin tức AI tiếng Việt",
    "tóm tắt tin AI",
    "trí tuệ nhân tạo",
    "AI news",
    "công nghệ AI",
  ],
  alternates: {
    canonical: "https://bainews.site",
    languages: {
      vi: "https://bainews.site",
      en: "https://bainews.site/en",
    },
  },
  openGraph: {
    title: "BAI News — Tin AI mới nhất, tóm tắt tiếng Việt",
    description:
      "Tổng hợp & tóm tắt tin tức AI song ngữ Việt–Anh, kèm nguồn gốc.",
    url: "https://bainews.site",
    siteName: "BAI News",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BAI News — Tin AI mới nhất, tóm tắt tiếng Việt",
    description:
      "Tổng hợp & tóm tắt tin tức AI song ngữ Việt–Anh, kèm nguồn gốc.",
  },
};

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
      initialLang="vi"
    />
  );
}

