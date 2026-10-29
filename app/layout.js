import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "./SiteHeader";
import { Analytics } from "@vercel/analytics/next"; 
import LimitModal from "./LimitModal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// এই metadata অবজেক্টে লোগো আইকন এবং কিছু কিওয়ার্ড আপডেট করা হয়েছে
export const metadata = {
  metadataBase: new URL("https://buffradar.com"),
  title: {
    default: "BuffRadar - Free Online Video Downloader, Converter & Editor",
    template: "%s | BuffRadar",
  },
  description:
    "BuffRadar is an all-in-one free online video downloader, converter and editor. Download or convert videos and audio from 40+ platforms in 4K, MP4, MP3 with AI tools. Fast, free, and secure.",
  
  // ১. আপনার নতুন লোগোকে ব্রাউজার এবং গুগলের জন্য সেট করা হলো (নতুন যোগ করা হয়েছে)
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  keywords: [
    "video downloader",
    "youtube video downloader",
    "youtube to mp3",
    "4k video download",
    "online video converter",
    "online video editor",
    "download thumbnail",
    "download subtitles",
    "tiktok downloader no watermark", // নতুন কিওয়ার্ড
    "facebook video downloader",      // নতুন কিওয়ার্ড
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "BuffRadar - Free Video Downloader, Converter & Editor",
    description:
      "BuffRadar is an all-in-one free online video downloader, converter and editor. Download or convert videos from 40+ platforms instantly.",
    url: "/",
    siteName: "BuffRadar",
    type: "website",
    images: [
      {
        url: "/logo.png", // সোশ্যাল মিডিয়ায় শেয়ার করলে যেন আপনার B লোগোটি দেখায়
        width: 512,
        height: 512,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuffRadar - Free Video Downloader",
    description: "Download, convert and edit videos online. Fast and free.",
    images: ["/logo.png"], // টুইটারে শেয়ার করলে যেন আপনার B লোগোটি দেখায়
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
          <SiteHeader />
          {children}
          <LimitModal />
        </div>
        <Analytics /> 
      </body>
    </html>
  );
}
