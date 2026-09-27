'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { takePendingFile } from '../converterStore';
import Link from 'next/link';

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function EditorPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [duration, setDuration] = useState(null);

  // হোমপেজ থেকে "Online video editing" কার্ড দিয়ে আসা ফাইল থাকলে সেটা তুলে নেওয়া হচ্ছে
  useEffect(() => {
    const incoming = takePendingFile();
    if (incoming) setFile(incoming);
  }, []);

  // ফাইল বসানোর পর তার দৈর্ঘ্য (মিনিট:সেকেন্ড) বের করা হচ্ছে
  useEffect(() => {
    if (!file) {
      setDuration(null);
      return;
    }
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    const url = URL.createObjectURL(file);
    videoEl.src = url;
    videoEl.onloadedmetadata = () => {
      const total = Math.round(videoEl.duration || 0);
      const mins = Math.floor(total / 60);
      const secs = total % 60;
      setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      URL.revokeObjectURL(url);
    };
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
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

  const handleLetsGo = () => {
    // 🚧 এডিটিং ফিচার এখনো বানানো হয়নি — পরে এখানে পরের স্টেপে নিয়ে যাওয়া হবে
    alert('এই ফিচারটা শীঘ্রই আসছে!');
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
        <span className="text-slate-600 text-xs">/ Video Editor</span>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 py-8 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
            Online Video Editing
          </h1>
          <p className="text-slate-400 text-xs">Upload a video to get started.</p>
        </div>

        {/* 📤 ফাইল না থাকলে আপলোড ড্রপজোন */}
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
              dragActive ? 'border-sky-500 bg-sky-500/5' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleBrowse}
            />
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0-12 4 4m-4-4-4 4M4 20h16" />
              </svg>
            </div>
            <p className="text-sm font-bold text-white mb-1">Drop a video file here</p>
            <p className="text-[11px] text-slate-500">or click to browse — MP4, MOV, WebM, MKV and more</p>
          </div>
        ) : (
          /* 🪪 ফাইল থাকলে — শুধু ডিটেইলস + Let's go */
          <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-2xl mb-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h11m0 0-4-4m4 4-4 4M16 17H5m0 0 4 4m-4-4 4-4" />
              </svg>
            </div>
            <p className="text-sm font-bold text-white mb-1 truncate">{file.name}</p>
            <p className="text-[11px] text-slate-500">
              {formatBytes(file.size)}
              {duration ? ` · ${duration}` : ''}
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-bold text-sky-400 hover:text-sky-300 mt-2 mb-6"
            >
              Change file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleBrowse}
            />

            <button
              type="button"
              onClick={handleLetsGo}
              className="w-full max-w-[220px] mx-auto block bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 rounded-full text-sm transition-all active:scale-[0.98] shadow-lg shadow-sky-500/20"
            >
              Let's go
            </button>
          </div>
        )}
      </main>

      {/* সাইট নেভিগেশন পিল — উপরে Video Edits (active), নিচে Downloader + Converter */}
<div className="flex flex-col items-center gap-2.5 py-6">
  <button
    type="button"
    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}
    className="px-5 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-[11px] sm:text-xs font-bold"
  >
    Video Edits
  </button>
  <div className="flex items-center gap-2.5">
    <Link
      href="/"
      className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs"
    >
      Video Downloader
    </Link>
    <Link
      href="/converter"
      className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs"
    >
      Video Converter
    </Link>
  </div>
</div>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-600">
        <p>&copy; 2026 buffradar.com</p>
      </footer>
    </div>
  );
}
