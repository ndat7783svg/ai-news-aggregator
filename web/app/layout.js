import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import RenameBanner from "../components/RenameBanner";

export const metadata = {
  metadataBase: new URL("https://bainews.site"),
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

// Đặt chế độ sáng/tối TRƯỚC khi vẽ để không bị nháy: ưu tiên lựa chọn đã lưu,
// nếu chưa có thì theo cài đặt hệ thống của thiết bị.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4228692528546788"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <RenameBanner />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
