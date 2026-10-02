import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchItemById, fetchItems } from "../../../lib/supabaseServer";
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
  const [item, latest] = await Promise.all([
    fetchItemById(params.id),
    fetchItems({ filter: "all", sort: "new", limit: 7 }),
  ]);
  if (!item) notFound();
  // "Tin mới khác": tin mới nhất (bỏ chính tin đang xem) → giữ người đọc từ Facebook ở lại trang.
  const related = (latest.items || []).filter((r) => r.id !== item.id).slice(0, 6);

  return (
    <Suspense fallback={<div className="detail"><p className="loadmore">...</p></div>}>
      <DetailContent item={item} related={related} />
    </Suspense>
  );
}
