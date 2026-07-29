import { notFound } from "next/navigation";
import { fetchItemById } from "../../../lib/supabaseServer";
import { sourceMeta, relativeTime, formatStars } from "../../../lib/format";
import DetailContent from "./DetailContent";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const item = await fetchItemById(params.id);
  if (!item) {
    return { title: "Không tìm thấy tin — BAI News" };
  }
  // Metadata dùng VI làm mặc định (đa số traffic Việt — xem AGENTS.md mục 6).
  const title = item.title_vi || item.title;
  const description = item.summary_vi || item.summary_en || "";
  const url = `https://bainews.site/tin/${item.id}`;
  return {
    title: `${title} — BAI News`,
    description: description.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      siteName: "BAI News",
      images: [{ url: "https://bainews.site/og-banner.png", width: 1200, height: 630 }],
    },
  };
}

export default async function TinDetailPage({ params }) {
  const item = await fetchItemById(params.id);
  if (!item) notFound();

  return <DetailContent item={item} />;
}
