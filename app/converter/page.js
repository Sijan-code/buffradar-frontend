'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { takePendingFile } from '../converterStore';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const CONVERT_FORMATS = [
  { id: 'mp4', label: 'MP4', note: 'Universal', kind: 'video' },
  { id: 'webm', label: 'WEBM', note: 'Web', kind: 'video' },
  { id: 'mkv', label: 'MKV', note: 'Flexible', kind: 'video' },
  { id: 'mov', label: 'MOV', note: 'Apple', kind: 'video' },
  { id: 'avi', label: 'AVI', note: 'Legacy', kind: 'video' },
  { id: 'gif', label: 'GIF', note: '30s max', kind: 'gif' },
  { id: 'mp3', label: 'MP3', note: 'Universal', kind: 'audio' },
  { id: 'm4a', label: 'M4A', note: 'AAC', kind: 'audio' },
  { id: 'ogg', label: 'OGG', note: 'Vorbis', kind: 'audio' },
  { id: 'wav', label: 'WAV', note: 'Lossless', kind: 'audio', lossless: true },
  { id: 'flac', label: 'FLAC', note: 'Lossless', kind: 'audio', lossless: true },
];

const VIDEO_QUALITIES = [
  { id: '1080p', label: '1080p Full HD' },
  { id: '720p', label: '720p HD' },
  { id: '480p', label: '480p' },
  { id: '360p', label: '360p' },
  { id: '240p', label: '240p' },
];

const AUDIO_BITRATES = [
  { id: '320kbps', label: '320kbps HQ' },
  { id: '256kbps', label: '256kbps' },
  { id: '192kbps', label: '192kbps' },
  { id: '128kbps', label: '128kbps' },
  { id: '96kbps', label: '96kbps' },
];

const CONVERT_STEPS = [
  {
    title: 'Upload your file',
    desc: 'Drag & drop or browse a video/audio file from your device.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0-12 4 4m-4-4-4 4M4 20h16" />
    ),
  },
  {
    title: 'Pick a format',
    desc: 'Choose an output like MP4, WebM, MP3, WAV and more.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0 1 14.3-4.9M20 15a8 8 0 0 1-14.3 4.9" />
    ),
  },
  {
    title: 'Set quality',
    desc: 'Select a resolution or bitrate that fits your needs.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 21V9m8 12V3m8 18v-6" />
    ),
  },
  {
    title: 'Convert & download',
    desc: 'Hit convert and save the finished file straight to your device.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16" />
    ),
  },
];

const FAQ_ITEMS = [
  {
    q: 'Is this video converter really free?',
    a: 'Yes. BuffRadar converter is completely free to use, with no hidden charges or watermarks added to your files.',
  },
  {
    q: 'Do you store my uploaded files?',
    a: 'No. Your file is processed just to create the converted output and is not kept on our servers afterward.',
  },
  {
    q: 'What is the maximum file length or size I can convert?',
    a: 'You can convert videos up to 15 minutes long at up to 1080p quality. Longer or larger files may take more time or fail depending on your connection.',
  },
  {
    q: 'How long does converting take?',
    a: 'Most short clips convert in under a minute. Longer videos or higher quality (like 1080p) can take a few minutes \u2014 keep the tab open while it processes.',
  },
  {
    q: 'Which formats can I convert between?',
    a: 'Video: MP4, WebM, MKV, MOV, AVI and GIF. Audio: MP3, M4A, OGG, WAV and FLAC you can also extract audio directly from a video file.',
  },
];

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function ConverterPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [bitrate, setBitrate] = useState('192kbps');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [doneMsg, setDoneMsg] = useState('');

  // হোমপেজ থেকে "Upload a file" দিয়ে আসা ফাইল থাকলে সেটা তুলে নেওয়া হচ্ছে
  useEffect(() => {
    const incoming = takePendingFile();
    if (incoming) setFile(incoming);
  }, []);

  const activeFormat = CONVERT_FORMATS.find((f) => f.id === format) || CONVERT_FORMATS[0];

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setErrorMsg('');
    setDoneMsg('');
  };

  const handleBrowse = (e) => {
    pickFile(e.target.files && e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    pickFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  };

  const handleConvert = async () => {
    if (!file || converting) return;
    setConverting(true);
    setErrorMsg('');
    setDoneMsg('');
    setProgress(0);

    let progressInterval;
    try {
      progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p === null || p >= 95) return p;
          return Math.min(95, p + Math.max(1, Math.round((95 - p) * 0.05)));
        });
      }, 500);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fmt', format);
      formData.append('quality', quality);
      formData.append('bitrate', bitrate);

      const response = await fetch(`${API_BASE}/api/convert-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let msg = 'কনভার্ট করা যায়নি। আবার চেষ্টা করুন।';
        try {
          const err = await response.json();
          if (err && err.detail) msg = err.detail;
        } catch (_) {}
        throw new Error(msg);
      }

      const blob = await response.blob();
      clearInterval(progressInterval);
      setProgress(100);

      const safeName =
        (file.name || 'converted')
          .replace(/\.[^/.]+$/, '')
          .replace(/[\\/:*?"<>|]+/g, '')
          .trim()
          .substring(0, 40) || 'converted';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${safeName}.${format}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);

      setDoneMsg('কনভার্ট সম্পন্ন! ডাউনলোড শুরু হয়ে গেছে।');
    } catch (error) {
      console.error('Convert failed:', error);
      clearInterval(progressInterval);
      setErrorMsg(error.message || 'কনভার্ট করা যায়নি।');
    } finally {
      setConverting(false);
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
        <span className="text-slate-600 text-xs">/ Video Converter</span>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 py-8 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Video Converter
          </h1>
          <p className="text-slate-400 text-xs">Upload a file, pick a format, and convert with AI-tuned quality.</p>
        </div>

        {/* 📤 ফাইল আপলোড / প্রিভিউ কার্ড */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer bg-slate-900/40 backdrop-blur-xl rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center transition-all mb-6 ${
              dragActive ? 'border-violet-500 bg-violet-500/5' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={handleBrowse}
            />
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0-12 4 4m-4-4-4 4M4 20h16" />
              </svg>
            </div>
            <p className="text-sm font-bold text-white mb-1">Drop a video or audio file here</p>
            <p className="text-[11px] text-slate-500">or click to browse — MP4, MOV, WebM, MKV, AVI, MP3 and more</p>
          </div>
        ) : (
          <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-2xl mb-6">
            {/* ফাইলের তথ্য */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-2xl mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h11m0 0-4-4m4 4-4 4M16 17H5m0 0 4 4m-4-4 4-4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{file.name}</p>
                <p className="text-[10px] text-slate-500">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-violet-400 hover:text-violet-300 px-2 py-1 whitespace-nowrap"
              >
                Change
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={handleBrowse}
              />
            </div>

            {/* 🔄 Format Converter প্রিভিউ স্ট্রিপ — হোমপেজের সাথে মিলিয়ে */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5 flex gap-3 items-center mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl border border-violet-500/20 shadow-lg shadow-violet-500/5">
                🔄
              </div>
              <div className="truncate flex-1">
                <p className="text-violet-400 font-bold uppercase text-[9px] tracking-wider">Format Converter</p>
                <p className="text-white font-bold truncate mt-0.5">{file.name}</p>
                <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                  Output: <span className="text-violet-400 font-bold">.{activeFormat.label}</span> | Quality:{' '}
                  <span className="text-slate-200 font-bold">
                    {activeFormat.kind === 'video' ? quality : activeFormat.lossless ? 'Lossless' : bitrate}
                  </span>
                </p>
              </div>
            </div>

            {/* 🎯 ফরম্যাট বাছাই — ভিডিও ও অডিও আলাদা গ্রুপে (হোমপেজের CONVERT ট্যাবের মতো) */}
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Video formats:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
              {CONVERT_FORMATS.filter((f) => f.kind === 'video' || f.kind === 'gif').map((f) => {
                const active = f.id === format;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-violet-500 border-violet-400 text-slate-950 shadow-md shadow-violet-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-xs font-black">{f.label}</p>
                    <p className={`text-[9px] ${active ? 'text-slate-900/70' : 'text-slate-500'}`}>{f.note}</p>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Audio formats:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
              {CONVERT_FORMATS.filter((f) => f.kind === 'audio').map((f) => {
                const active = f.id === format;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-violet-500 border-violet-400 text-slate-950 shadow-md shadow-violet-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-xs font-black">{f.label}</p>
                    <p className={`text-[9px] ${active ? 'text-slate-900/70' : 'text-slate-500'}`}>{f.note}</p>
                  </button>
                );
              })}
            </div>

            {/* ⚙️ কোয়ালিটি / বিটরেট */}
            {activeFormat.kind === 'video' && (
              <div className="mb-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Max resolution:</p>
                <div className="flex flex-wrap gap-1.5">
                  {VIDEO_QUALITIES.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuality(q.id)}
                      className={`px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all ${
                        quality === q.id
                          ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-md shadow-blue-500/20'
                          : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeFormat.kind === 'audio' && !activeFormat.lossless && (
              <div className="mb-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bitrate:</p>
                <div className="flex flex-wrap gap-1.5">
                  {AUDIO_BITRATES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBitrate(b.id)}
                      className={`px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all ${
                        bitrate === b.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 🚀 কনভার্ট বাটন / প্রোগ্রেস */}
            {progress !== null ? (
              <div className="mb-2">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  {progress >= 100 ? 'Done!' : `Converting… ${progress}%`}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConvert}
                disabled={converting}
                className="w-full bg-violet-500 hover:bg-violet-400 disabled:bg-violet-800 text-slate-950 font-black py-3 rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg shadow-violet-500/20"
              >
                🔄 Convert to {activeFormat.label} & Download
              </button>
            )}

            {errorMsg && (
              <p className="text-[11px] text-red-400 mt-3 text-center">{errorMsg}</p>
            )}
            {doneMsg && !errorMsg && (
              <p className="text-[11px] text-emerald-400 mt-3 text-center">{doneMsg}</p>
            )}
          </div>
        )}

        <p className="text-[10px] text-slate-600 text-center leading-relaxed">
          কনভার্ট হতে ফাইলের সাইজ অনুযায়ী কয়েক মিনিট লাগতে পারে — ট্যাব খোলা রাখুন।
        </p>

        {/* 🪜 How it works — ৪ ধাপ */}
        <section className="mt-16 pt-10 border-t border-slate-900">
          <h2 className="text-lg font-black text-white mb-5 text-center">How to Convert Videos Online</h2>
          <div className="grid grid-cols-2 gap-3">
            {CONVERT_STEPS.map((step, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-2.5">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* 📝 মূল আর্টিকেল — SEO-এর জন্য */}
        <section className="mt-14 pt-10 border-t border-slate-900 text-slate-300">
          <h2 className="text-lg font-black text-white mb-3">Free Online Video Converter,Convert to Any Format</h2>
          <p className="text-xs leading-relaxed mb-4">
            BuffRadar video converter lets you switch any video or audio file into the format you actually need
            right from your browser, with no software to install. Whether you preparing a clip for a specific
            device, shrinking a file to save space, or pulling the audio out of a video, you can do it here in a
            few clicks.
          </p>

          <h3 className="text-sm font-bold text-white mb-2">Which format should you choose?</h3>
          <ul className="text-xs leading-relaxed space-y-2 mb-4">
            <li>
              <span className="text-violet-400 font-bold">MP4</span> the safest, most universal choice. Plays on
              almost every phone, browser and platform.
            </li>
            <li>
              <span className="text-violet-400 font-bold">WebM</span> smaller file size, built for fast-loading web
              pages.
            </li>
            <li>
              <span className="text-violet-400 font-bold">MOV</span> the native format for Apple devices and most
              video editing apps.
            </li>
            <li>
              <span className="text-violet-400 font-bold">MKV / AVI</span> flexible containers useful for older
              players or archiving.
            </li>
            <li>
              <span className="text-violet-400 font-bold">MP3 / M4A / OGG</span> best when you only need the audio,
              like turning a video into a podcast-style file.
            </li>
            <li>
              <span className="text-violet-400 font-bold">WAV / FLAC</span> lossless audio, ideal when quality
              matters more than file size.
            </li>
          </ul>

          <h3 className="text-sm font-bold text-white mb-2">Picking the right quality</h3>
          <p className="text-xs leading-relaxed mb-4">
            For sharing on social media or messaging apps, 720p is usually sharp enough and converts faster. Save
            1080p for footage you plan to keep or re-upload elsewhere. On the audio side, 320kbps keeps music close
            to the original quality, while 128kbps is plenty for voice notes or podcasts and produces a much smaller
            file.
          </p>

          <p className="text-xs leading-relaxed text-slate-500">
            Note: to keep conversions fast and reliable for everyone, videos are limited to 15 minutes in length and
            up to 1080p quality.
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
                  {isOpen && (
                    <p className="px-4 pb-3.5 text-[11px] text-slate-400 leading-relaxed">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* সাইট নেভিগেশন পিল — উপরে Video Edits, নিচে Downloader + Converter */}
<div className="flex flex-col items-center gap-2.5 py-6">
  <Link
    href="/editor"
    className="px-5 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs"
  >
    Video Edits
  </Link>
  <div className="flex items-center gap-2.5">
    <Link
      href="/"
      className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs"
    >
      Video Downloader
    </Link>
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-[11px] sm:text-xs font-bold"
    >
      Video Converter
    </button>
  </div>
</div>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-600">
        <p>&copy; 2026 buffradar.com</p>
      </footer>
    </div>
  );
}
