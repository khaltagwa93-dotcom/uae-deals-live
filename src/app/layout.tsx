import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "عروض الإمارات اللحظية | UAE Live Deals",
  description: "تخفيضات وعروض الإمارات لحظة بلحظة — مرتبة حسب الإمارة والمتجر. تحديث كل دقيقة.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
