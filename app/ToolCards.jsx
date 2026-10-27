import React from 'react';
import Link from 'next/link';

// "More BuffRadar Tools" কার্ড-গ্রিড। সব পেজে একই কম্পোনেন্ট: নিজের পেজের কার্ড exclude করে দিন।
//   <ToolCards exclude={['converter']} />      // কনভার্টার পেজে
// কী: downloader | converter | mp3 | editor
// নতুন টুল যোগ করতে শুধু নিচের TOOLS তালিকায় একটা সারি বাড়ান।
// কার্ডগুলো সাধারণ <Link> (HTML <a>), তাই Google লিংক ধরতে পারে, আর কোনো ছবির ফাইল লাগে না (SVG)।

const TOOLS = [
  {
    key: 'downloader',
    href: '/',
    title: 'Video Downloader',
    desc: 'Save from any URL',
    tile: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    hover: 'hover:border-emerald-500/50',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />,
  },
  {
    key: 'converter',
    href: '/converter',
    title: 'Video Converter',
    desc: 'Change formats easily',
    tile: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    hover: 'hover:border-violet-500/50',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h11m0 0-4-4m4 4-4 4M16 17H5m0 0 4 4m-4-4 4-4" />,
  },
  {
    key: 'mp3',
    href: '/youtube-to-mp3',
    title: 'YouTube to MP3',
    desc: 'Convert music instantly',
    tile: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    hover: 'hover:border-pink-500/50',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    ),
  },
  {
    key: 'editor',
    href: '/editor',
    title: 'AI Video Editor',
    desc: 'Trim, crop & edit with AI',
    badge: 'AI',
    tile: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    hover: 'hover:border-sky-500/50',
    icon: (
      <>
        <circle cx="6" cy="6" r="3" strokeWidth="2" />
        <circle cx="6" cy="18" r="3" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.1 8.1 12 12M20 4 8.1 15.9M14.8 14.8 20 20" />
      </>
    ),
  },
];

export default function ToolCards({ exclude = [], heading = 'More BuffRadar Tools', className = '' }) {
  const items = TOOLS.filter((t) => !exclude.includes(t.key));
  if (items.length === 0) return null;
  // বেজোড় সংখ্যায় (যেমন ৩টা) শেষ কার্ড পুরো চওড়ায়, যাতে একটা ঘর ফাঁকা না থাকে
  const oddLast = items.length % 2 === 1;

  return (
    <section aria-labelledby="more-tools-heading" className={`w-full max-w-xl mx-auto px-4 mt-10 mb-6 ${className}`}>
      <h2 id="more-tools-heading" className="text-lg sm:text-xl font-black text-white mb-4">
        {heading}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((t, i) => {
          const wide = oddLast && i === items.length - 1;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`group relative flex min-h-[112px] items-center rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition active:scale-[0.98] ${t.hover} ${
                wide ? 'col-span-2 flex-row gap-4 text-left' : 'flex-col justify-center text-center'
              }`}
            >
              {t.badge && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-sky-500/15 px-2 py-0.5 text-[9px] font-black text-sky-300">
                  {t.badge}
                </span>
              )}
              <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${t.tile} ${wide ? '' : 'mb-2.5'}`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {t.icon}
                </svg>
              </span>
              <span className="block">
                <span className="block text-sm font-bold text-white">{t.title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">{t.desc}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}