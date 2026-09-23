'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { takePendingFile } from '../converterStore';

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
          <h1 className="text-2xl sm:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">
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
              dragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={handleBrowse}
            />
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 whitespace-nowrap"
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

            {/* 🎯 ফরম্যাট বাছাই */}
            <p className="text-[11px] font-bold text-slate-400 mb-2">Convert to</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
              {CONVERT_FORMATS.map((f) => {
                const active = f.id === format;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
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
                <p className="text-[11px] font-bold text-slate-400 mb-2">Quality</p>
                <div className="flex flex-wrap gap-1.5">
                  {VIDEO_QUALITIES.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuality(q.id)}
                      className={`px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all ${
                        quality === q.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
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
                <p className="text-[11px] font-bold text-slate-400 mb-2">Bitrate</p>
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
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
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
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 font-black py-3 rounded-xl text-sm transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10"
              >
                Convert to {activeFormat.label}
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
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-600">
        <p>&copy; 2026 buffradar.com</p>
      </footer>
    </div>
  );
}
