import { fetchItems } from "../../lib/supabaseServer";
import GithubAiList from "../../components/GithubAiList";

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
    <main className="wrap">
      <header className="site-header">
        <div>
          <h1 className="site-title">
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
              BAI News
            </a>
          </h1>
          <p className="tagline">Tổng hợp &amp; tóm tắt tin tức, kèm nguồn.</p>
        </div>
      </header>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          GitHub AI nổi bật
        </h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
          Tổng hợp các repo AI nổi bật trên GitHub — bao gồm GitHub trending AI hàng ngày, hàng
          tuần, hàng tháng và các dự án mã nguồn mở kinh điển được cộng đồng đánh dấu sao nhiều
          nhất. Nội dung được tóm tắt tự động bằng AI, cập nhật liên tục.
        </p>
      </section>

      <GithubAiList items={items} lang="vi" />
    </main>
  );
}
