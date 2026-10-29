'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CreditBadge from './CreditBadge';
import HistoryModal from './HistoryModal';
import { openCreditsPanel } from './creditsPanel';

// সব পেজের একই হেডার: লোগো + ক্রেডিট-ব্যাজ + মেনু। app/layout.js-এ একবার বসালেই হয়।
// পূর্ণ-পর্দার এডিটর পেজে (নিজস্ব টপ-বার আছে) এটা লুকিয়ে থাকে।
// ডাউনলোড চলাকালীন হোম পেজ 'bf-download-progress' ঘটনায় শতাংশ পাঠায়; তখন ব্যাজ+মেনুর জায়গায় বিদ্যুৎ-চিহ্ন দেখায়।
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
      <style jsx global>{`
        @keyframes radarZap {
          0%, 100% { filter: drop-shadow(0 0 2px #facc15); transform: rotate(0deg); }
          25% { filter: drop-shadow(0 0 10px #facc15) drop-shadow(0 0 16px #fef08a); transform: rotate(-6deg); }
          50% { filter: drop-shadow(0 0 4px #facc15); transform: rotate(4deg); }
          75% { filter: drop-shadow(0 0 12px #facc15) drop-shadow(0 0 18px #fef08a); transform: rotate(-3deg); }
        }
        .animate-radar-zap { animation: radarZap 0.55s ease-in-out infinite; }
        @keyframes zapGlow {
          0%, 100% { filter: drop-shadow(0 0 2px #facc15); opacity: 1; }
          50% { filter: drop-shadow(0 0 10px #facc15) drop-shadow(0 0 18px #fde047); opacity: 0.7; }
        }
        .animate-zap-glow { animation: zapGlow 0.45s ease-in-out infinite; }
        @keyframes boltDash { to { stroke-dashoffset: -40; } }
        @keyframes boltFlicker {
          0%, 18%, 22%, 55%, 60%, 100% { opacity: 1; }
          20% { opacity: 0.15; }
          58% { opacity: 0.25; }
          80% { opacity: 0.5; }
        }
        .lightning-bolt-path { stroke-dasharray: 14 8; animation: boltDash 0.35s linear infinite, boltFlicker 0.8s steps(1) infinite; }
        .lightning-bolt-core { stroke-dasharray: 6 12; animation: boltDash 0.2s linear infinite reverse, boltFlicker 0.6s steps(1) infinite; }
        @keyframes badgePop {
          0% { opacity: 0; transform: scale(0.85) translateX(6px); }
          100% { opacity: 1; transform: scale(1) translateX(0); }
        }
        .animate-badge-pop { animation: badgePop 0.25s ease-out; }
      `}</style>

      <header className="border-b border-slate-900 bg-[#070d1f] px-5 py-2.5 flex justify-between items-center relative z-40">
        <Link href="/" className="flex items-center gap-1 relative z-10" aria-label="BuffRadar home">
          <span className="text-xl font-black tracking-wider text-emerald-400">BUFF</span>
          <img
            src="/buffradar-icon.png"
            alt="BuffRadar"
            className={`w-8 h-8 object-contain -ml-1 ${isDownloading ? 'animate-radar-zap' : ''}`}
          />
        </Link>

        {isDownloading && (
          <svg
            className="absolute left-20 right-20 top-1/2 -translate-y-1/2 h-9 w-[calc(100%-10rem)] pointer-events-none z-0"
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
          >
            <polyline
              points="0,30 55,8 85,42 135,12 175,46 225,10 265,38 315,14 400,30"
              fill="none"
              stroke="#facc15"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lightning-bolt-path"
            />
            <polyline
              points="0,30 55,8 85,42 135,12 175,46 225,10 265,38 315,14 400,30"
              fill="none"
              stroke="#fef9c3"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lightning-bolt-core"
            />
          </svg>
        )}

        <div className="flex items-center gap-2 relative z-10">
          {!isDownloading ? (
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
                      ⚡ আমার ক্রেডিট
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
                      🎁 বন্ধুকে আমন্ত্রণ করুন
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
          ) : (
            <div className="flex items-center gap-2 bg-slate-900 border border-yellow-400/40 rounded-full pl-1.5 pr-3.5 py-1 shadow-lg shadow-yellow-400/10 animate-badge-pop">
              <svg className="w-6 h-6 animate-zap-glow" viewBox="0 0 24 24" fill="none">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill="#facc15" stroke="#facc15" strokeWidth="1" strokeLinejoin="round" />
              </svg>
              <span className="text-yellow-300 font-mono font-bold text-xs tabular-nums">{progress}%</span>
            </div>
          )}
        </div>
      </header>

      {historyOpen && <HistoryModal onClose={() => setHistoryOpen(false)} />}
    </>
  );
}
