import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"; // এই লাইনটি যোগ করা হয়েছে
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://buffradar.com"),
  title: {
    default: "BuffRadar - Free Online Video Downloader, Converter & Editor",
    template: "%s | BuffRadar",
  },
  description:
    "Download videos and audio in 4K, MP3 and more. Convert video formats and edit videos online with BuffRadar. Fast, free, no signup needed.",
  keywords: [
    "video downloader",
    "youtube video downloader",
    "youtube to mp3",
    "4k video download",
    "online video converter",
    "online video editor",
    "download thumbnail",
    "download subtitles",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "BuffRadar - Free Video Downloader, Converter & Editor",
    description:
      "Download videos in 4K, convert formats and edit online. Fast and free.",
    url: "/",
    siteName: "BuffRadar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuffRadar - Free Video Downloader",
    description: "Download, convert and edit videos online. Fast and free.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <div className="min-h-full flex flex-col">
          {children}
        </div>
        <Analytics /> {/* এই লাইনটি যোগ করা হয়েছে */}
      </body>
    </html>
  );
}
