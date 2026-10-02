import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import ClickTracker from "../components/ClickTracker";
import { Be_Vietnam_Pro, Source_Serif_4 } from "next/font/google";

// Chữ thân: Be Vietnam Pro (thiết kế riêng cho tiếng Việt, dấu đẹp, dễ đọc trên điện thoại).
// Chữ tiêu đề: Source Serif 4 (có chân, cảm giác "báo chí", có bộ dấu tiếng Việt).
// next/font tự tải về lúc build và phục vụ từ chính domain → không gọi Google Fonts khi người dùng xem.
const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});
const serif = Source_Serif_4({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-serif",
});

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

// Màu thanh trình duyệt trên điện thoại khớp nền trang (Next 14 yêu cầu khai báo ở `viewport`).
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#121210" },
  ],
};

// Đặt chế độ sáng/tối TRƯỚC khi vẽ để không bị nháy: ưu tiên lựa chọn đã lưu,
// nếu chưa có thì theo cài đặt hệ thống của thiết bị.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4228692528546788"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {children}
        <Analytics />
        <ClickTracker />
      </body>
    </html>
  );
}
