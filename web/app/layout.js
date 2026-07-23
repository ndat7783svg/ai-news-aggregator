import "./globals.css";

export const metadata = {
  title: "AI News — tóm tắt tin AI song ngữ",
  description: "Tổng hợp & tóm tắt tin tức AI, song ngữ Việt–Anh, kèm nguồn.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
