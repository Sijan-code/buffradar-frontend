// page.js 'use client' হওয়ায় সেখানে metadata দেওয়া যায় না, তাই এই layout.js আলাদা রাখা হয়েছে।
export const metadata = {
  title: 'YouTube to MP3 Converter – Free Online MP3 Downloader | BuffRadar',
  description:
    'Convert a YouTube video to an MP3 file online for free. Choose a bitrate from 320k to 48k, no software to install. Works on mobile and desktop.',
  openGraph: {
    title: 'YouTube to MP3 Converter | BuffRadar',
    description: 'Paste a YouTube link, pick a bitrate and download the audio as an MP3 file.',
    type: 'website',
  },
};

export default function YoutubeToMp3Layout({ children }) {
  return children;
}
