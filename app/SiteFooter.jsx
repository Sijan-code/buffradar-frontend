'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from './siteConfig';

// সব পেজের একই ফুটার (app/layout.js-এ একবার বসে)। পূর্ণ-পর্দার এডিটরে লুকিয়ে থাকে।
const HIDE_ON = ['/editor/manual', '/editor/text-to-edit'];

const TOOLS = [
  { href: '/', label: 'Video Downloader' },
  { href: '/converter', label: 'Video Converter' },
  { href: '/youtube-to-mp3', label: 'YouTube to MP3' },
  { href: '/editor', label: 'AI Video Editor' },
];

export default function SiteFooter() {
  const pathname = usePathname() || '';
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  const legal = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/copyright', label: 'Copyright & DMCA' },
    ...(SITE.contactEmail ? [{ href: '/contact', label: 'Contact' }] : []),
  ];
  const link = 'block py-1.5 text-sm text-slate-400 hover:text-emerald-400 transition-colors';

  return (
    <footer className="border-t border-slate-900 bg-[#070d1f] px-6 pt-8 pb-6">
      <div className="max-w-2xl mx-auto">
        <p className="text-lg font-black tracking-wider text-emerald-400 mb-1">BUFF</p>
        <p className="text-xs text-slate-500 mb-6">Download, convert and edit videos online.</p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <nav aria-label="Tools">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">Tools</p>
            {TOOLS.map((t) => (
              <Link key={t.href} href={t.href} className={link}>
                {t.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Legal">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">Legal</p>
            {legal.map((t) => (
              <Link key={t.href} href={t.href} className={link}>
                {t.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-900 pt-4 mb-3">
          {SITE.name} is an independent tool and is not affiliated with, endorsed by or sponsored by YouTube, Facebook,
          Instagram, TikTok, X or any other platform. All trademarks belong to their respective owners. Please download and
          convert only content you own or have permission to use.
        </p>
        <p className="text-[11px] text-slate-600">&copy; {new Date().getFullYear()} {SITE.domain}</p>
      </div>
    </footer>
  );
}