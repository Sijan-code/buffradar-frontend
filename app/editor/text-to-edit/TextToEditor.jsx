'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { takePendingEditorFile } from '../../editorStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const PLAN_FIELDS = [
  'start', 'end', 'rotate', 'aspect', 'resolution', 'speed', 'volume',
  'text', 'text_position', 'text_color', 'text_size', 'text_from', 'text_to',
  'filter_preset', 'brightness', 'contrast', 'saturation', 'fade_in', 'fade_out',
  'flip', 'effect', 'effect_amount', 'fit', 'output_format',
];

const KIND_INFO = {
  mp4: { ext: 'mp4', mime: 'video/mp4' },
  gif: { ext: 'gif', mime: 'image/gif' },
  mp3: { ext: 'mp3', mime: 'audio/mpeg' },
};

function fmt(t) {
  const s = Math.max(0, t || 0);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ভিডিওর দৈর্ঘ্য, মাপ ও একটা থাম্বনেইল বের করে (ব্রাউজারেই)
function probeMeta(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    const out = { duration: 0, w: 0, h: 0, thumb: '' };
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      v.removeAttribute('src');
      URL.revokeObjectURL(url);
      resolve(out);
    };
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.onloadedmetadata = () => {
      out.duration = Number.isFinite(v.duration) ? v.duration : 0;
      out.w = v.videoWidth;
      out.h = v.videoHeight;
      try {
        v.currentTime = Math.min(1, out.duration / 3) || 0.1;
      } catch (_) {
        finish();
      }
    };
    v.onseeked = () => {
      try {
        const ratio = Math.min(1, 240 / (v.videoWidth || 240));
        const c = document.createElement('canvas');
        c.width = Math.round(v.videoWidth * ratio);
        c.height = Math.round(v.videoHeight * ratio);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        out.thumb = c.toDataURL('image/jpeg', 0.7);
      } catch (_) {}
      finish();
    };
    v.onerror = finish;
    setTimeout(finish, 8000);
    v.src = url;
  });
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function TextToEditor() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const curRef = useRef(null); // এখন যে ভিডিওর ওপর এডিট চলছে (প্রতিবার আগের ফলাফল)
  const urlsRef = useRef([]);

  const [orig, setOrig] = useState(null); // { file, thumb, duration, w, h }
  const [ready, setReady] = useState(false);
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const loadFile = async (file) => {
    setReady(false);
    setTurns([]);
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setOrig({ file, thumb: '', duration: 0, w: 0, h: 0 });
    const m = await probeMeta(file);
    setOrig({ file, ...m });
    curRef.current = { file, duration: m.duration, w: m.w, h: m.h };
    setReady(true);
  };

  useEffect(() => {
    const incoming = takePendingEditorFile();
    if (incoming) loadFile(incoming);
    return () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const handleBrowse = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) loadFile(f);
    e.target.value = '';
  };

  const autoGrow = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || busy || !ready || !curRef.current) return;
    setInput('');
    requestAnimationFrame(autoGrow);
    setBusy(true);

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setTurns((t) => [...t, { id, prompt, status: 'planning' }]);
    const upd = (patch) => setTurns((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));

    try {
      const cur = curRef.current;

      // ধাপ ১: AI লেখাটা বুঝে সেটিংস বানায়
      const pr = await fetch(`${API_BASE}/api/ai-edit-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration: cur.duration, width: cur.w, height: cur.h }),
      });
      const pj = await pr.json().catch(() => ({}));
      if (!pr.ok) throw new Error(pj.detail || 'AI এখন কাজ করছে না।');
      if (!pj.changed) {
        upd({
          status: 'info',
          note: pj.unsupported || 'এই লেখা থেকে কোনো এডিট বোঝা যায়নি। অন্যভাবে লিখে দেখুন।',
        });
        return;
      }
      upd({ status: 'editing', summary: pj.summary, note: pj.unsupported });

      // ধাপ ২: সেটিংস অনুযায়ী ভিডিও এডিট
      const p = pj.plan;
      const fd = new FormData();
      fd.append('file', cur.file);
      PLAN_FIELDS.forEach((k) => fd.append(k, String(p[k])));
      fd.append('mute', p.mute ? 'true' : 'false');
      fd.append('reverse', p.reverse ? 'true' : 'false');
      fd.append('text_bg', p.text_bg ? 'true' : 'false');
      fd.append('cuts', JSON.stringify(p.cuts || []));
      const er = await fetch(`${API_BASE}/api/edit-upload`, { method: 'POST', body: fd });
      if (!er.ok) {
        const ej = await er.json().catch(() => ({}));
        throw new Error(ej.detail || 'এডিট করা যায়নি।');
      }
      const blob = await er.blob();
      const base =
        (orig?.file?.name || 'video').replace(/\.[^/.]+$/, '').replace(/[\\/:*?"<>|]+/g, '').trim().substring(0, 40) ||
        'video';
      const kind = KIND_INFO[p.output_format] ? p.output_format : 'mp4';
      const out = new File([blob], `${base}_edited.${KIND_INFO[kind].ext}`, { type: KIND_INFO[kind].mime });
      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      // GIF ও MP3 শেষ ফলাফল; পরের নির্দেশ আগের ভিডিওর ওপরেই চলবে
      if (kind === 'mp4') {
        const m = await probeMeta(out);
        curRef.current = { file: out, duration: m.duration, w: m.w, h: m.h };
      }
      upd({ status: 'done', url, name: out.name, size: out.size, kind });
    } catch (e) {
      const msg = e instanceof TypeError ? 'সার্ভার সাড়া দেয়নি। ফ্রি সার্ভার ঘুমিয়ে থাকলে বা ভিডিও ভারী হলে এমন হয়। ১ মিনিট পরে আবার চেষ্টা করুন।' : e.message || 'কিছু একটা সমস্যা হয়েছে।';
      upd({ status: 'error', error: msg });
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-950 text-white font-sans overflow-hidden">
      <h1 className="sr-only">Edit Video with AI</h1>
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleBrowse} />

      <header className="flex items-center justify-between px-3 h-14 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push('/editor')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {orig && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="px-3.5 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-40 text-[11px] font-bold transition"
          >
            Change video
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4">
        <div className="max-w-xl mx-auto min-h-full flex flex-col gap-5 py-4">
          {!orig ? (
            <div className="flex-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-sm bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-800 hover:border-sky-500/60 p-10 text-center transition-colors"
              >
                <p className="text-sm font-bold text-white mb-1">Choose a video to edit</p>
                <p className="text-[11px] text-slate-500">MP4, MOV, WebM, MKV and more</p>
              </button>
            </div>
          ) : (
            <>
              {/* ভিডিওর পরিচয় */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-2.5 pr-4">
                <div className="w-16 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-slate-950">
                  {orig.thumb && <img src={orig.thumb} alt="Video thumbnail" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{orig.file.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatBytes(orig.file.size)}
                    {orig.duration > 0 && ` · ${fmt(orig.duration)}`}
                    {orig.w > 0 && ` · ${orig.w}×${orig.h}`}
                  </p>
                </div>
              </div>

              {turns.length === 0 && (
                <div className="flex-1 flex items-center justify-center px-2">
                  <p className="text-center text-2xl sm:text-3xl font-light text-slate-200 leading-snug">
                    What would you like to do with this video?
                  </p>
                </div>
              )}

              {turns.map((t) => (
                <div key={t.id} className="space-y-3">
                  <div className="ml-auto max-w-[85%] rounded-3xl rounded-br-lg bg-slate-800 px-4 py-2.5 text-sm whitespace-pre-wrap break-words">
                    {t.prompt}
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                    {t.status === 'planning' && (
                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        <Spinner /> Understanding your request...
                      </p>
                    )}
                    {t.summary && <p className="text-sm text-slate-200">{t.summary}</p>}
                    {t.status === 'editing' && (
                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        <Spinner /> Editing your video...
                      </p>
                    )}
                    {t.note && <p className="text-xs text-amber-300/90">{t.note}</p>}
                    {t.status === 'error' && <p className="text-xs text-red-400">{t.error}</p>}
                    {t.status === 'done' && (
                      <>
                        {t.kind === 'gif' && (
                          <img src={t.url} alt="GIF result" className="w-full max-h-[50vh] object-contain rounded-2xl bg-black" />
                        )}
                        {t.kind === 'mp3' && <audio src={t.url} controls className="w-full" />}
                        {(!t.kind || t.kind === 'mp4') && (
                          <video
                            src={t.url}
                            controls
                            playsInline
                            className="w-full max-h-[50vh] rounded-2xl bg-black"
                          />
                        )}
                        {t.kind && t.kind !== 'mp4' && (
                          <p className="text-[11px] text-slate-500">
                            এটা শেষ ফাইল। পরের নির্দেশ আগের ভিডিওর ওপর কাজ করবে।
                          </p>
                        )}
                        <a
                          href={t.url}
                          download={t.name}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition active:scale-95"
                        >
                          Download ({formatBytes(t.size)})
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {orig && (
        <div className="flex-shrink-0 px-3 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
          <div className="max-w-xl mx-auto flex items-end gap-2 rounded-[28px] border border-slate-700 bg-slate-900 pl-5 pr-2 py-2 focus-within:border-sky-500/70 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value.slice(0, 500));
                autoGrow();
              }}
              onKeyDown={onKeyDown}
              placeholder={ready ? 'Describe the edit...' : 'Loading video...'}
              disabled={!ready}
              className="flex-1 bg-transparent resize-none py-2 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || busy || !ready}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 flex items-center justify-center transition active:scale-95"
              aria-label="Send"
            >
              {busy ? (
                <Spinner />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
