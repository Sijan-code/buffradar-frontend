'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { takePendingFile } from '../converterStore';
import { setPendingEditorFile } from '../editorStore';
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

function formatTime(sec) {
  const s = Math.max(0, sec || 0);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function fileExt(f) {
  const m = /\.([a-z0-9]+)$/i.exec(f?.name || '');
  if (m) return m[1].toUpperCase();
  return (f?.type || '').split('/')[1]?.toUpperCase() || '';
}


// ============================================================
//  ✍️ আর্টিকেলের লেখা শুধু এই অংশে বদলান। নিচের কোডে হাত দিতে হবে না।
//  [ ] দিয়ে ঘেরা লেখাগুলো placeholder। image-এ /public ফোল্ডারের পাথ দিন (যেমন '/editor-manual.png')।
//  FAQ-এর যে প্রশ্ন '[' দিয়ে শুরু, সেটা Google schema-তে যাবে না।
// ============================================================
const ARTICLE = {
  summary: {
    title: 'How to Edit a Video Online with BuffRadar',
    intro: '[আপনার লেখা: ২-৩ লাইনের সারাংশ]',
    cards: [
      { title: 'Basic edits', text: '[এক লাইন]', target: 'manually' },
      { title: 'Manually', text: '[এক লাইন]', target: 'manually' },
      { title: 'Text to edit', text: '[এক লাইন]', target: 'text-to-edit' },
    ],
  },
  manual: {
    id: 'manually',
    title: 'Edit Videos Manually: Trim, Crop, Speed & Text',
    image: '',
    imageAlt: '',
    intro: '[আপনার লেখা: Manually edits-এর পরিচয়]',
    features: [
      { title: 'Trim', text: '[এক লাইন]' },
      { title: 'Crop and resize', text: '[এক লাইন]' },
      { title: 'Speed', text: '[এক লাইন]' },
      { title: 'Audio', text: '[এক লাইন]' },
      { title: 'Text', text: '[এক লাইন]' },
    ],
    stepsTitle: 'How to edit manually',
    steps: ['[ধাপ ১]', '[ধাপ ২]', '[ধাপ ৩]'],
  },
  ai: {
    id: 'text-to-edit',
    title: 'Edit Videos with AI: Just Type What You Want',
    image: '',
    imageAlt: '',
    intro: '[আপনার লেখা: Text to edit-এর পরিচয়]',
    examples: ['Cut the first 5 seconds', 'Make it 9:16', 'Speed up 2x', 'Add the text "Hello" at the bottom'],
    stepsTitle: 'How to edit with a text prompt',
    steps: ['[ধাপ ১]', '[ধাপ ২]', '[ধাপ ৩]'],
  },
  faq: [
    { q: '[প্রশ্ন ১]', a: '[উত্তর ১]' },
    { q: '[প্রশ্ন ২]', a: '[উত্তর ২]' },
    { q: '[প্রশ্ন ৩]', a: '[উত্তর ৩]' },
    { q: '[প্রশ্ন ৪]', a: '[উত্তর ৪]' },
  ],
  tools: [
    { href: '/', title: 'Video Downloader', text: '[এক লাইন]' },
    { href: '/converter', title: 'Video Converter', text: '[এক লাইন]' },
    { href: '/youtube-to-mp3', title: 'YouTube to MP3', text: '[এক লাইন]' },
  ],
};

function ImageSlot({ src, alt }) {
  if (src) {
    return <img src={src} alt={alt || ''} loading="lazy" className="w-full rounded-2xl border border-slate-800 mb-6" />;
  }
  return (
    <div className="aspect-video rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-center text-[11px] text-slate-600 mb-6">
      [Screenshot slot]
    </div>
  );
}

function Steps({ title, steps }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-3">{title}</h3>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 flex-shrink-0 rounded-full bg-sky-500/15 text-sky-400 text-xs font-black flex items-center justify-center">
              {i + 1}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function EditorPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [thumb, setThumb] = useState('');
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState('manual'); // 'manual' (default) | 'ai'
  const [notice, setNotice] = useState('');
  const [openFaq, setOpenFaq] = useState(-1);

  useEffect(() => {
    const incoming = takePendingFile();
    if (incoming) setFile(incoming);
  }, []);

  // ভিডিওর মেটাডেটা + থাম্বনেইল (ব্রাউজারেই, সার্ভার লাগে না)
  useEffect(() => {
    if (!file) {
      setDuration(0);
      setThumb('');
      setVideoSize({ w: 0, h: 0 });
      return;
    }
    const url = URL.createObjectURL(file);
    setThumb('');
    let cancelled = false;

    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    v.onloadedmetadata = () => {
      const total = Number.isFinite(v.duration) ? v.duration : 0;
      setDuration(total);
      setVideoSize({ w: v.videoWidth, h: v.videoHeight });
      try {
        v.currentTime = Math.min(1, total / 3) || 0.1;
      } catch (_) {}
    };
    v.onseeked = () => {
      if (cancelled || !v.videoWidth) return;
      try {
        const ratio = Math.min(1, 320 / v.videoWidth);
        const c = document.createElement('canvas');
        c.width = Math.round(v.videoWidth * ratio);
        c.height = Math.round(v.videoHeight * ratio);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        setThumb(c.toDataURL('image/jpeg', 0.75));
      } catch (_) {}
    };

    return () => {
      cancelled = true;
      v.removeAttribute('src');
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setNotice('');
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

  // এডিটিং টুলগুলো আলাদা পেজে আসবে — আপাতত শুধু বার্তা
  const handleLetsGo = () => {
    if (!file) return;
    setPendingEditorFile(file);
    router.push(mode === 'ai' ? '/editor/text-to-edit' : '/editor/manual');
    
  };

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Google-এর জন্য FAQ schema (placeholder প্রশ্ন বাদ)
  const faqItems = ARTICLE.faq.filter((f) => f.q && !f.q.startsWith('['));
  const faqSchema = faqItems.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
        />
      )}
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
            Online Free Video Editor with AI
          </h1>
          <p className="text-slate-400 text-xs">
            {file ? 'Choose how you want to edit.' : 'Upload a video to get started.'}
          </p>
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleBrowse} />

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
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0-12 4 4m-4-4-4 4M4 20h16" />
              </svg>
            </div>
            <p className="text-sm font-bold text-white mb-1">Drop a video file here</p>
            <p className="text-[11px] text-slate-500">or click to browse — MP4, MOV, WebM, MKV and more</p>
          </div>
        ) : (
          <div className="mb-6 space-y-4">
            {/* Content card */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-3xl border border-slate-800/80 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-400">Content</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-full border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 text-[11px] font-bold transition"
                >
                  Change
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-28 h-20 sm:w-36 sm:h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                  {thumb ? (
                    <img src={thumb} alt="Video thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-500/20 to-blue-500/10" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-black/55 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{file.name}</p>
                  <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
                    <span className="text-slate-500">Size</span>
                    <span className="text-slate-300">{formatBytes(file.size)}</span>
                    {duration > 0 && (
                      <>
                        <span className="text-slate-500">Duration</span>
                        <span className="text-slate-300">{formatTime(duration)}</span>
                      </>
                    )}
                    {videoSize.w > 0 && (
                      <>
                        <span className="text-slate-500">Resolution</span>
                        <span className="text-slate-300">
                          {videoSize.w}×{videoSize.h}
                        </span>
                      </>
                    )}
                    {fileExt(file) && (
                      <>
                        <span className="text-slate-500">Format</span>
                        <span className="text-slate-300">{fileExt(file)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode: Manually (default) | Text to edit */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'manual',
                  title: 'Manually',
                  note: 'Default',
                  icon: 'M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6',
                },
                {
                  id: 'ai',
                  title: 'Text to edit',
                  note: 'Describe it, AI edits',
                  icon: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z',
                },
              ].map((m) => {
                const on = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setMode(m.id);
                      setNotice('');
                    }}
                    className={`rounded-2xl border px-3 py-3.5 text-left transition-all active:scale-[0.98] ${
                      on
                        ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-lg shadow-sky-500/20'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={m.icon} />
                    </svg>
                    <p className="text-sm font-black">{m.title}</p>
                    <p className={`text-[10px] font-semibold ${on ? 'text-slate-900/70' : 'text-slate-500'}`}>{m.note}</p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLetsGo}
              className="w-full max-w-[260px] mx-auto block bg-sky-500 hover:bg-sky-400 disabled:bg-sky-900 disabled:text-slate-500 text-slate-950 font-black py-3 rounded-full text-sm transition-all active:scale-[0.98] shadow-lg shadow-sky-500/20"
            >
              Let's go
            </button>
            {notice && <p className="text-[11px] text-sky-300 text-center">{notice}</p>}
          </div>
        )}
      </main>

      <article className="max-w-2xl w-full mx-auto px-4 pb-12 space-y-14">
        {/* ১) সারাংশ */}
        <section aria-labelledby="how-to-edit" className="border-t border-slate-900 pt-10">
          <h2 id="how-to-edit" className="text-xl sm:text-2xl font-black text-white mb-3">
            {ARTICLE.summary.title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">{ARTICLE.summary.intro}</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {ARTICLE.summary.cards.map((c) => (
              <button
                key={c.title}
                type="button"
                onClick={() => scrollToId(c.target)}
                className="text-left rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-sky-500/50 p-4 transition-colors"
              >
                <p className="text-sm font-black text-white mb-1">{c.title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{c.text}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ২) Manually */}
        <section id={ARTICLE.manual.id} aria-labelledby="manual-title" className="scroll-mt-6 border-t border-slate-900 pt-10">
          <h2 id="manual-title" className="text-xl sm:text-2xl font-black text-white mb-3">
            {ARTICLE.manual.title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">{ARTICLE.manual.intro}</p>
          <ImageSlot src={ARTICLE.manual.image} alt={ARTICLE.manual.imageAlt} />
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-8">
            {ARTICLE.manual.features.map((f) => (
              <div key={f.title} className="border-l-2 border-sky-500/40 pl-3">
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{f.text}</p>
              </div>
            ))}
          </div>
          <Steps title={ARTICLE.manual.stepsTitle} steps={ARTICLE.manual.steps} />
        </section>

        {/* ৩) Text to edit */}
        <section id={ARTICLE.ai.id} aria-labelledby="ai-title" className="scroll-mt-6 border-t border-slate-900 pt-10">
          <h2 id="ai-title" className="text-xl sm:text-2xl font-black text-white mb-3">
            {ARTICLE.ai.title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">{ARTICLE.ai.intro}</p>
          <ImageSlot src={ARTICLE.ai.image} alt={ARTICLE.ai.imageAlt} />
          <h3 className="text-sm font-bold text-white mb-3">Example prompts</h3>
          <ul className="flex flex-wrap gap-2 mb-8">
            {ARTICLE.ai.examples.map((ex) => (
              <li key={ex} className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/40 text-slate-300 text-[11px] font-semibold">
                {ex}
              </li>
            ))}
          </ul>
          <Steps title={ARTICLE.ai.stepsTitle} steps={ARTICLE.ai.steps} />
        </section>

        {/* ৪) FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-6 border-t border-slate-900 pt-10">
          <h2 id="faq-title" className="text-xl sm:text-2xl font-black text-white mb-5">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-slate-800 border-y border-slate-800">
            {ARTICLE.faq.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-white">{f.q}</span>
                    <svg
                      className={`w-4 h-4 flex-shrink-0 text-sky-400 transition-transform ${open ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div hidden={!open} className="pb-4">
                    <p className="text-sm text-slate-400 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ৫) অন্য টুল */}
        <section aria-labelledby="other-tools" className="border-t border-slate-900 pt-10">
          <h2 id="other-tools" className="text-xl sm:text-2xl font-black text-white mb-5">
            More BuffRadar Tools
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {ARTICLE.tools.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-sky-500/50 p-4 transition-colors"
              >
                <p className="text-sm font-black text-white mb-1">{t.title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{t.text}</p>
              </Link>
            ))}
          </div>
        </section>
      </article>

      <div className="flex flex-col items-center gap-2.5 py-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-5 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-[11px] sm:text-xs font-bold"
        >
          Video Edits
        </button>
        <div className="flex items-center gap-2.5">
          <Link href="/" className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs">
            Video Downloader
          </Link>
          <Link href="/converter" className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 text-[11px] sm:text-xs">
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
