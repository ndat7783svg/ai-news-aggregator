import { fetchItems } from "../../lib/supabaseServer";
import GithubAiList from "../../components/GithubAiList";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

const LANG_LINKS = { vi: "/github-ai", en: "/en/github-ai" };

export const revalidate = 300;

export const metadata = {
  title: "GitHub AI nổi bật — BAI News",
  description:
    "Tổng hợp các repo AI nổi bật trên GitHub: từ GitHub trending AI đến các dự án mã nguồn mở được cộng đồng đánh dấu sao nhiều nhất. Cập nhật tự động, kèm tóm tắt tiếng Việt.",
  alternates: {
    canonical: "https://bainews.site/github-ai",
    languages: {
      vi: "https://bainews.site/github-ai",
      en: "https://bainews.site/en/github-ai",
    },
  },
};

export default async function GithubAiPageVI() {
  const { items = [] } = await fetchItems({
    filter: "github",
    sort: "hot",
    time: "all",
    offset: 0,
    limit: 60,
  });

  return (
    <>
      <SiteHeader lang="vi" langLinks={LANG_LINKS} active="github" />
      <main className="page-narrow">
        <div className="page-head">
          <p className="page-kicker">Mã nguồn mở</p>
          <h1 className="page-title">GitHub AI nổi bật</h1>
          <p className="page-desc">
            Tổng hợp các repo AI nổi bật trên GitHub — bao gồm GitHub trending AI hàng ngày, hàng
          tuần, hàng tháng và các dự án mã nguồn mở kinh điển được cộng đồng đánh dấu sao nhiều
          nhất. Nội dung được tóm tắt tự động bằng AI, cập nhật liên tục.
          </p>
        </div>

        <GithubAiList items={items} lang="vi" />
      </main>
      <SiteFooter lang="vi" />
    </>
  );
}
