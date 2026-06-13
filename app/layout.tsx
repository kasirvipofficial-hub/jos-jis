import type { Metadata } from "next";
import { Inter, Amiri, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-naskh",
});

export const metadata: Metadata = {
  title: "MAktabah AI - Kaji Pustaka Klasik",
  description: "AI-powered progressive segmenter and alignment viewer for classical literature text.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${amiri.variable} ${notoNaskh.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
