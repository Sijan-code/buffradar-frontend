'use client';

import React, { useEffect, useRef, useState } from 'react';
import ToolCards from '../ToolCards';
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
    title: "How to Edit a Video Online with BuffRadar",
    intro:
      "BuffRadar is a free-to-start online video editor that runs in your browser on any phone, tablet or computer. Upload a clip, then edit it by hand with a visual timeline or simply type what you want, and download the result as an MP4, a GIF or an MP3. There is nothing to install, and your exported videos carry no watermark.",
    cards: [
      { title: "Basic edits", text: "Trim, cut, crop, rotate and change the speed of any clip.", target: "manually" },
      { title: "Manually", text: "A phone-style timeline with filters, text, music and stickers.", target: "manually" },
      { title: "Text to edit", text: "Describe the edit in plain English and AI sets it up for you.", target: "text-to-edit" },
    ],
  },
  manual: {
    id: "manually",
    title: "Edit Videos Manually: Trim, Crop, Speed & Text",
    image: "",
    imageAlt: "BuffRadar manual video editor with preview, timeline and tool bar",
    intro:
      "The manual editor works like a simple video app on your phone. Your clip plays in a live preview with a frame-by-frame timeline underneath and a tool bar at the bottom. Drag the blue handles to trim, tap a tool to change a setting, and check the result in the preview before you export. Every change can be undone and redone, so you can experiment freely.",
    features: [
      {
        title: "Trim & Cut",
        text: "Drag the handles to keep only the part you want, or cut a section out of the middle and the rest joins up automatically.",
      },
      {
        title: "Crop & Resize",
        text: "Switch to 9:16, 1:1 or 16:9 for Reels, Shorts, TikTok and YouTube. Fill the frame by cropping, or keep the whole video on a blurred background. Rotate, flip, and export at 1080p, 720p, 480p or 360p.",
      },
      {
        title: "Speed & Reverse",
        text: "Play from 0.5x slow motion up to 2x fast forward, or play a short clip backwards.",
      },
      {
        title: "Audio & Music",
        text: "Mute the original sound, set the volume anywhere from 0 to 200%, or add your own audio file as background music and loop it to fill the video.",
      },
      {
        title: "Text & Stickers",
        text: "Add a caption with your choice of size, colour, position and background box, plus emoji or your own image as stickers. Choose exactly when each one appears.",
      },
      {
        title: "Filters & Effects",
        text: "Black and white, warm, cool, vintage and vivid looks, brightness, contrast and saturation sliders, plus blur, sharpen, vignette and grain.",
      },
      {
        title: "Fade & Cover",
        text: "Fade the picture and sound in and out, and save any frame of your video as a JPG cover image.",
      },
      {
        title: "Export as MP4, GIF or MP3",
        text: "Download a standard MP4, a GIF of up to 30 seconds, or just the audio as an MP3.",
      },
    ],
    stepsTitle: "How to edit a video manually",
    steps: [
      "Upload your video on this page. MP4, MOV, WebM, MKV and most other common video formats work.",
      "Select Manually and tap Let's go to open the editor.",
      "Drag the blue handles on the timeline to trim, then open the tools at the bottom: Cut, Resize, Speed, Filter, Effect, Fade, Audio, Music, Text and Sticker.",
      "Press play to check the result in the preview. Use Undo or Redo if you change your mind.",
      "Open Export, choose MP4, GIF or MP3, and tap Export to download your finished file.",
    ],
  },
  ai: {
    id: "text-to-edit",
    title: "Edit Videos with AI: Just Type What You Want",
    image: "",
    imageAlt: "BuffRadar Text to edit: describe your video edit and AI applies it",
    intro:
      "Don't want to fiddle with a timeline? Text to edit lets you describe the change in your own words. The AI turns your sentence into the right editing settings, applies them to your video and shows the result with a download button. It can trim and cut, crop to vertical or square, change speed, rotate, flip or reverse, mute or adjust the volume, add captions, apply filters and effects, add fades, and export a GIF or MP3. You can keep adding instructions, and each new request builds on the previous result. Adding music or stickers is done in the manual editor.",
    examples: [
      "Cut the first 5 seconds",
      "Make it vertical 9:16 with a blurred background",
      "Speed up 2x and add a fade out",
      "Add the text “Summer 2026” at the top in yellow",
      "Turn it black and white",
      "Convert this clip to a GIF",
    ],
    stepsTitle: "How to edit with a text prompt",
    steps: [
      "Upload your video, select Text to edit, and tap Let's go.",
      "Type what you want, for example: “Remove the first 3 seconds and make it 9:16”.",
      "Wait a few seconds while the AI sets up the edit and your video is processed.",
      "Preview the result, download it, or type another instruction to refine it further.",
    ],
  },
  faq: [
    {
      q: "Is the BuffRadar video editor free?",
      a: "You can start for free. Every visitor gets daily credits to use the downloader, converter and editor, and signing in with Google gives you more. You can also earn extra credits by inviting a friend. Exported videos have no watermark.",
    },
    {
      q: "Do I need to install anything or create an account?",
      a: "No installation is needed. The editor runs in your browser on phones, tablets and computers. You can try it without an account, and signing in with Google is only needed if you want a larger daily allowance.",
    },
    {
      q: "Which video formats can I upload?",
      a: "Most common formats work, including MP4, MOV, WebM and MKV. Your finished video is exported as an MP4, and you can also export a GIF or an MP3.",
    },
    {
      q: "What can the AI (Text to edit) do?",
      a: "It can trim and cut, crop to 9:16, 1:1 or 16:9, change speed, rotate, flip or reverse, mute or change the volume, add text, apply filters and effects, add fades, and export as a GIF or MP3. Adding music or stickers, adding subtitles and joining several clips are not part of Text to edit. Use the manual editor for music and stickers.",
    },
    {
      q: "Can I edit a video for Instagram Reels, TikTok or YouTube Shorts?",
      a: "Yes. Choose the 9:16 aspect ratio to make a vertical video. You can either crop the frame to fill the screen or keep the whole video on a blurred background, then add text and trim it to the length you want.",
    },
    {
      q: "Can I add music or text to my video?",
      a: "Yes. In the manual editor you can add a caption with your own size, colour and position, choose when it appears, and upload your own audio file as background music. Please only use music you have the right to use.",
    },
    {
      q: "Are my videos kept on your server?",
      a: "Your video is uploaded for processing and the temporary files are removed afterwards. Please only edit videos you have the right to use.",
    },
    {
      q: "How long can my video be?",
      a: "The editor is built for short and medium-length clips such as social videos. Very long or very large files may be slow or rejected. GIF exports are limited to 30 seconds, and reversing works on clips of up to 60 seconds.",
    },
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
      </article>

        <ToolCards exclude={['editor']} />
    </div>
  );
}
