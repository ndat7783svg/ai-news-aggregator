import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "SAI News — tổng hợp & tóm tắt tin song ngữ",
  description: "Tổng hợp & tóm tắt tin tức, song ngữ Việt–Anh, kèm nguồn.",
};

// Đặt chế độ sáng/tối TRƯỚC khi vẽ để không bị nháy: ưu tiên lựa chọn đã lưu,
// nếu chưa có thì theo cài đặt hệ thống của thiết bị.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
