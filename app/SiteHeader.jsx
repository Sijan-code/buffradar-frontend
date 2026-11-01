'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CreditBadge from './CreditBadge';
import HistoryModal from './HistoryModal';
import { openCreditsPanel } from './creditsPanel';

// সব পেজের একই হেডার: BUFFRADAR লেখা + ক্রেডিট-ব্যাজ + মেনু। app/layout.js-এ একবার বসে।
// পূর্ণ-পর্দার এডিটর পেজে (নিজস্ব টপ-বার আছে) লুকিয়ে থাকে।
// ডাউনলোড চলাকালীন হোম পেজ 'bf-download-progress' ঘটনায় শতাংশ পাঠায়; তখন ব্যাজ+মেনুর জায়গায় সবুজ % পিল আর হেডারের নিচে সবুজ অগ্রগতি-রেখা দেখায়।
const HIDE_ON = ['/editor/manual', '/editor/text-to-edit'];

export default function SiteHeader() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onProgress = (e) => setProgress(typeof e.detail === 'number' ? e.detail : null);
    window.addEventListener('bf-download-progress', onProgress);
    return () => window.removeEventListener('bf-download-progress', onProgress);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [menuOpen]);

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  const isDownloading = progress !== null;
  const item = 'flex w-full px-4 py-3 text-sm text-left text-gray-200 hover:bg-slate-800';

  return (
    <>
      <header className="relative z-40 flex items-center justify-between border-b border-slate-900 bg-[#070d1f] px-5 py-2.5">
        <Link href="/" aria-label="BuffRadar home" className="text-xl font-black tracking-wide">
          <span className="text-emerald-400">BUFF</span>
          <span className="text-white">RADAR</span>
        </Link>

        <div className="flex items-center gap-2">
          {isDownloading ? (
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-black tabular-nums text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {progress}%
            </div>
          ) : (
            <>
          <CreditBadge />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="p-1.5 text-white hover:bg-slate-800 rounded-lg focus:outline-none transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setHistoryOpen(true);
                  }}
                  className={`${item} rounded-t-lg`}
                >
                  🕒 Download History
                </button>
                <hr className="border-t border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openCreditsPanel();
                  }}
                  className={item}
                >
                  ⚡ My credits
                </button>
                <hr className="border-t border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openCreditsPanel();
                  }}
                  className={item}
                >
                  🎁 Invite a friend
                </button>
                <hr className="border-t border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/premium');
                  }}
                  className={`${item} rounded-b-lg`}
                >
                  ⭐ Go Premium
                </button>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {isDownloading && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        )}
      </header>

      {historyOpen && <HistoryModal onClose={() => setHistoryOpen(false)} />}
    </>
  );
}
