import Feed from "../../components/Feed";
import { fetchItems, fetchAvailableSources } from "../../lib/supabaseServer";
import { PAGE_SIZE } from "../../lib/filters";

// ISR: trang được dựng lại tối đa mỗi 5 phút (khớp với nhịp thu thập tin).
export const revalidate = 300;

export const metadata = {
  title: "BAI News — Latest AI News, Summarized",
  description:
    "Curated AI news from Hacker News, arXiv, GitHub, and top tech blogs, auto-summarized in English and Vietnamese with source links. Updated continuously.",
  keywords: [
    "AI news",
    "AI news aggregator",
    "artificial intelligence",
    "tech news",
    "AI summaries",
  ],
  alternates: {
    canonical: "https://bainews.site/en",
    languages: {
      vi: "https://bainews.site",
      en: "https://bainews.site/en",
    },
  },
  openGraph: {
    title: "BAI News — Latest AI News, Summarized",
    description:
      "Curated AI news summarized in English and Vietnamese, with source links.",
    url: "https://bainews.site/en",
    siteName: "BAI News",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BAI News — Latest AI News, Summarized",
    description:
      "Curated AI news summarized in English and Vietnamese, with source links.",
  },
};

export default async function EnglishPage() {
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
      initialLang="en"
      respectStoredLang={false}
    />
  );
}
