'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// এই পেজে সর্বোচ্চ ভিডিও দৈর্ঘ্য (কনভার্টারের মতো ১৫ মিনিট), MP3 বানানো ভারী কাজ বলে
const MAX_MINUTES = 15;

// একটা লাইনে ৪টা করে দেখা যাবে, বাকিগুলো সোয়াইপ করে
const BITRATES = [
  { id: '320kbps', short: '320k', note: 'Best' },
  { id: '256kbps', short: '256k', note: 'High' },
  { id: '192kbps', short: '192k', note: 'Good' },
  { id: '160kbps', short: '160k', note: 'Standard' },
  { id: '128kbps', short: '128k', note: 'Balanced' },
  { id: '96kbps', short: '96k', note: 'Small' },
  { id: '64kbps', short: '64k', note: 'Voice' },
  { id: '48kbps', short: '48k', note: 'Lowest' },
];

const STEPS = [
  {
    title: 'Paste the link',
    desc: 'Copy the YouTube video link and paste it into the box above.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />,
  },
  {
    title: 'Fetch the video',
    desc: 'Press Fetch or the Enter key. You will see the title and length.',
    icon: (
      <>
        <circle cx="11" cy="11" r="7" strokeWidth="2" />
        <path strokeLinecap="round" strokeWidth="2" d="m21 21-4.3-4.3" />
      </>
    ),
  },
  {
    title: 'Choose a bitrate',
    desc: 'Swipe through 320k down to 48k. Pick 128k or higher for music.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
  },
  {
    title: 'Download the MP3',
    desc: 'Tap Download MP3 and the file saves to your device.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16" />,
  },
];

const FAQ_ITEMS = [
  {
    q: 'Is this YouTube to MP3 converter free?',
    a: 'Yes. BuffRadar is free to use, and it does not add watermarks or ask you to install anything.',
  },
  {
    q: 'Which MP3 bitrate should I pick?',
    a: '128kbps is a good balance for most music and small files. Use 192kbps or higher if you care about sound quality, and 64kbps or lower for talks and voice recordings.',
  },
  {
    q: 'Does 320kbps always sound better?',
    a: 'Not always. The MP3 can never be better than the audio in the original video. If the source audio is lower quality, a higher bitrate makes a bigger file without adding detail.',
  },
  {
    q: 'How long can the video be?',
    a: `Videos up to ${MAX_MINUTES} minutes are supported on this page. Longer videos are blocked so the conversion stays fast and reliable for everyone.`,
  },
  {
    q: 'Can I use this on my phone?',
    a: 'Yes. The page works in any modern mobile or desktop browser. Keep the tab open until the download finishes.',
  },
  {
    q: 'Is it okay to download any video?',
    a: 'Only download audio you own, that is free to use, or that you have permission to save. You are responsible for following the rights of the creator and the terms of the platform.',
  },
];

const formatDuration = (sec) => {
  const total = Math.round(Number(sec));
  if (!total || total <= 0) return 'Unknown length';
  const m = Math.floor(total / 60);
  const r = total % 60;
  if (m === 0) return `${r} sec`;
  return r === 0 ? `${m} min` : `${m} min ${r} sec`;
};

const safeFileName = (t) =>
  (t || 'buffradar')
    .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'buffradar';

export default function YoutubeToMp3Page() {
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [info, setInfo] = useState(null); // { title, duration, thumbnail, sourceUrl }
  const [bitrate, setBitrate] = useState('192kbps');
  const [phase, setPhase] = useState('idle'); // 'idle' | 'preparing' | 'downloading'
  const [progress, setProgress] = useState(null); // ডাউনলোডের আসল % (সাইজ জানা থাকলে)
  const [errorMsg, setErrorMsg] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const busy = phase !== 'idle';
  const tooLong = !!(info && info.duration && info.duration > MAX_MINUTES * 60);

  const handleFetch = async () => {
    const link = url.trim();
    if (!link || fetching || busy) return;
    setFetching(true);
    setErrorMsg('');
    setDoneMsg('');
    setInfo(null);
    try {
      const res = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        throw new Error('লিঙ্কটি প্রসেস করা যায়নি। লিংকটি ঠিক আছে কিনা দেখে আবার চেষ্টা করুন।');
      }
      setInfo({
        title: data.title || 'BuffRadar audio',
        duration: data.duration && data.duration > 0 ? data.duration : 0,
        thumbnail: data.thumbnail || '',
        sourceUrl: link,
      });
    } catch (err) {
      setErrorMsg(err.message || 'লিঙ্কটি প্রসেস করা যায়নি।');
    } finally {
      setFetching(false);
    }
  };

  const handleDownload = async () => {
    if (!info || busy) return;
    if (tooLong) {
      setErrorMsg(`এই পেজে সর্বোচ্চ ${MAX_MINUTES} মিনিটের ভিডিও করা যায়।`);
      return;
    }
    setErrorMsg('');
    setDoneMsg('');
    setProgress(null);
    setPhase('preparing'); // সার্ভার আগে MP3 বানায়, তাই এই ধাপে % নেই

    try {
      const res = await fetch(
        `${API_BASE}/api/download?url=${encodeURIComponent(info.sourceUrl)}&is_audio=true&bitrate=${bitrate}`
      );
      if (!res.ok) {
        let msg = 'MP3 বানানো যায়নি। আবার চেষ্টা করুন।';
        try {
          const j = await res.json();
          if (j && j.detail) msg = j.detail;
        } catch (_) {}
        throw new Error(msg);
      }

      const total = Number(res.headers.get('Content-Length')) || 0;
      let blob;
      if (res.body && res.body.getReader) {
        setPhase('downloading');
        setProgress(total ? 0 : null);
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total) setProgress(Math.min(100, Math.round((received / total) * 100)));
        }
        blob = new Blob(chunks, { type: 'audio/mpeg' });
      } else {
        blob = await res.blob();
      }

      const href = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = href;
      a.download = `${safeFileName(info.title)}.mp3`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(href);
        document.body.removeChild(a);
      }, 1000);
      setDoneMsg('MP3 তৈরি! ডাউনলোড শুরু হয়ে গেছে।');
    } catch (err) {
      setErrorMsg(err.message || 'ডাউনলোড করা যায়নি।');
    } finally {
      setPhase('idle');
      setTimeout(() => setProgress(null), 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* 🌐 হেডার */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur px-6 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <span className="text-lg font-black tracking-wider text-emerald-400">BUFF</span>
          <img src="/buffradar-icon.png" alt="BuffRadar" className="w-7 h-7 object-contain -ml-1" />
        </div>
        <span className="text-slate-600 text-xs">/ YouTube to MP3</span>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 py-8 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            YouTube to MP3 Converter
          </h1>
          <p className="text-slate-400 text-xs">Paste a link, pick a bitrate, and save the audio as an MP3 file.</p>
        </div>

        {/* 🔗 লিংক বক্স + ফলাফল কার্ড */}
        <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-2xl mb-6">
          <div className="flex gap-2">
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFetch();
              }}
              placeholder="Paste a YouTube link here"
              className="flex-1 min-w-0 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              onClick={handleFetch}
              disabled={fetching || busy || !url.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-slate-500 text-slate-950 font-black px-4 rounded-xl text-xs transition-all active:scale-[0.98]"
            >
              {fetching ? '…' : 'Fetch'}
            </button>
          </div>

          {info && (
            <div className="mt-5">
              {/* 🎬 ভিডিওর তথ্য */}
              <div className="flex gap-3 items-center p-2.5 rounded-2xl border border-slate-800 bg-slate-950/80 mb-5">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                  {info.thumbnail && (
                    <img
                      src={`${API_BASE}/api/thumbnail?url=${encodeURIComponent(info.thumbnail)}`}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white line-clamp-2">{info.title}</p>
                  <p className={`font-mono text-[10px] mt-1 ${tooLong ? 'text-red-400' : 'text-slate-400'}`}>
                    {formatDuration(info.duration)}
                    {tooLong ? ` (max ${MAX_MINUTES} min)` : ''}
                  </p>
                </div>
              </div>

              {/* 🎚️ বিটরেট: এক লাইনে ৪টা, বাকিগুলো সোয়াইপ */}
              <p className="text-[10px] font-bold text-slate-500 mb-2">MP3 bitrate (swipe for more)</p>
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 mb-4 [scrollbar-width:none]">
                {BITRATES.map((b) => {
                  const active = bitrate === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBitrate(b.id)}
                      disabled={busy}
                      className={`snap-start shrink-0 basis-[calc(25%-6px)] px-1 py-2 rounded-xl border text-center transition-all disabled:opacity-60 ${
                        active
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-xs font-black">{b.short}</p>
                      <p className={`text-[9px] ${active ? 'text-slate-900/70' : 'text-slate-500'}`}>{b.note}</p>
                    </button>
                  );
                })}
              </div>

              {/* 🚀 ডাউনলোড বাটন / প্রোগ্রেস */}
              {busy ? (
                <div className="mb-1">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-emerald-500 rounded-full transition-all duration-300 ${
                        phase === 'downloading' && progress !== null ? '' : 'w-full animate-pulse opacity-60'
                      }`}
                      style={phase === 'downloading' && progress !== null ? { width: `${progress}%` } : undefined}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                    {phase === 'preparing'
                      ? 'Preparing your MP3… this can take a minute.'
                      : progress !== null
                        ? `Downloading… ${progress}%`
                        : 'Downloading…'}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={tooLong}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-slate-500 text-slate-950 font-black py-3 rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                >
                  Download MP3 ({bitrate.replace('kbps', 'k')})
                </button>
              )}
            </div>
          )}

          {errorMsg && <p className="text-[11px] text-red-400 mt-3 text-center">{errorMsg}</p>}
          {doneMsg && !errorMsg && <p className="text-[11px] text-emerald-400 mt-3 text-center">{doneMsg}</p>}
        </div>

        <p className="text-[10px] text-slate-600 text-center leading-relaxed">
          MP3 বানাতে কিছুক্ষণ সময় লাগতে পারে। ডাউনলোড শেষ না হওয়া পর্যন্ত ট্যাব খোলা রাখুন।
        </p>

        {/* 🪜 How it works */}
        <section className="mt-16 pt-10 border-t border-slate-900">
          <h2 className="text-lg font-black text-white mb-5 text-center">How to Convert YouTube to MP3</h2>
          <div className="grid grid-cols-2 gap-3">
            {STEPS.map((step, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {step.icon}
                  </svg>
                </div>
                <p className="text-xs font-bold text-white mb-0.5">
                  {i + 1}. {step.title}
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 📝 আর্টিকেল — SEO */}
        <section className="mt-14 pt-10 border-t border-slate-900 text-slate-300">
          <h2 className="text-lg font-black text-white mb-3">Free YouTube to MP3, Right in Your Browser</h2>
          <p className="text-xs leading-relaxed mb-4">
            BuffRadar turns the sound of a YouTube video into an MP3 file you can keep on your phone or computer.
            There is nothing to install: paste the link, choose a bitrate and download. It is handy for lectures,
            talks, podcasts, and music you have the right to save for offline listening.
          </p>

          <h3 className="text-sm font-bold text-white mb-2">Choosing the right bitrate</h3>
          <ul className="text-xs leading-relaxed space-y-2 mb-4">
            <li>
              <span className="text-emerald-400 font-bold">320k and 256k</span> the largest files. Worth it only when
              the original audio is high quality.
            </li>
            <li>
              <span className="text-emerald-400 font-bold">192k and 160k</span> clear sound for most music at a
              moderate file size.
            </li>
            <li>
              <span className="text-emerald-400 font-bold">128k</span> a popular balance of quality and size.
            </li>
            <li>
              <span className="text-emerald-400 font-bold">96k to 48k</span> small files that suit speech, lectures
              and audiobooks.
            </li>
          </ul>

          <p className="text-xs leading-relaxed mb-4">
            One thing worth knowing: a higher bitrate cannot improve the original recording. It only helps if the
            source audio is good enough to begin with.
          </p>

          <p className="text-xs leading-relaxed text-slate-500">
            Note: to keep conversions fast for everyone, videos are limited to {MAX_MINUTES} minutes on this page.
            Please download only content you own or have permission to use.
          </p>
        </section>

        {/* ❓ FAQ */}
        <section className="mt-14 pt-10 border-t border-slate-900 mb-4">
          <h2 className="text-lg font-black text-white mb-4 text-center">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3"
                  >
                    <h3 className="text-xs font-bold text-white">{item.q}</h3>
                    <svg
                      className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && <p className="px-4 pb-3.5 text-[11px] text-slate-400 leading-relaxed">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ স্ট্রাকচার্ড ডেটা — Google rich snippet-এর জন্য */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ_ITEMS.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            }),
          }}
        />
      </main>

      {/* সাইট নেভিগেশন পিল */}
      <div className="flex flex-col items-center gap-2.5 py-6">
        <Link
          href="/editor"
          className="px-5 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs font-bold hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
        >
          Video Edits
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/"
            className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs font-bold hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
          >
            Video Downloader
          </Link>
          <Link
            href="/converter"
            className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs font-bold hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
          >
            Video Converter
          </Link>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-[11px] sm:text-xs font-bold"
          >
            YouTube to MP3
          </button>
        </div>
      </div>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-600">
        <p>&copy; 2026 buffradar.com</p>
      </footer>
    </div>
  );
}
