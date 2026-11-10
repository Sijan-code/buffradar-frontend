'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Anton, Inter } from 'next/font/google';
import { authHeaders } from './supabaseClient';
import { showLimit, readLimit } from './limitBus';
import { TEMPLATES, COUNTRIES } from './memeTemplates';

// ক্লাসিক মিমের মোটা ফন্ট: Anton (খোলা লাইসেন্স)। Impact ফন্ট ব্যবহার করা হয়নি (লাইসেন্স-সীমা আছে)।
const anton = Anton({ weight: '400', subsets: ['latin'], display: 'swap' });
const inter = Inter({ weight: ['700'], subsets: ['latin'], display: 'swap' });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const MAX_W = 1080;
const MAX_UPLOAD = 20 * 1024 * 1024;
const COLORS = ['#ffffff', '#000000', '#facc15', '#ef4444', '#22d3ee'];
const LABELS = ['Top text', 'Bottom text'];

let nextId = 3;
const makeText = (over = {}) => ({
  id: nextId++, text: '', x: 0.5, y: 0.5, size: 0.085, color: '#ffffff', stroke: true, font: 'impact', upper: true, ...over,
});
const initialTexts = () => [
  { id: 1, text: 'WHEN THE WIFI FINALLY WORKS', x: 0.5, y: 0.13, size: 0.085, color: '#ffffff', stroke: true, font: 'impact', upper: true },
  { id: 2, text: 'BUT YOU HAVE NOTHING TO DO', x: 0.5, y: 0.87, size: 0.085, color: '#ffffff', stroke: true, font: 'impact', upper: true },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('Couldn’t load this image.'));
    im.src = src;
  });
}

export default function MemeMaker() {
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const rectsRef = useRef([]);
  const metaRef = useRef({ W: 1, imgH: 1, barH: 0, scale: 1 });
  const dragRef = useRef(null);
  const uploadUrlRef = useRef('');

  const [country, setCountry] = useState('global');
  const [tplId, setTplId] = useState(TEMPLATES[0].id);
  const [img, setImg] = useState(null);
  const [uploadThumb, setUploadThumb] = useState('');
  const [layout, setLayout] = useState('classic'); // classic | bar
  const [texts, setTexts] = useState(initialTexts);
  const [selId, setSelId] = useState(1);
  const [watermark, setWatermark] = useState(true);
  const [fontsReady, setFontsReady] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [idea, setIdea] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fontFamily = (f) => (f === 'impact' ? anton.style.fontFamily : inter.style.fontFamily);
  const fontCss = useCallback((f, px) => `${f === 'impact' ? 400 : 700} ${px}px ${f === 'impact' ? anton.style.fontFamily : inter.style.fontFamily}`, []);

  // ফন্ট লোড হলে আবার আঁকা
  useEffect(() => {
    let alive = true;
    if (typeof document === 'undefined' || !document.fonts) {
      setFontsReady(true);
      return;
    }
    Promise.all([
      document.fonts.load(`400 40px ${anton.style.fontFamily}`),
      document.fonts.load(`700 40px ${inter.style.fontFamily}`),
    ])
      .catch(() => {})
      .finally(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // টেমপ্লেট ছবি
  const pickTemplate = useCallback(async (t) => {
    setNote('');
    try {
      const im = await loadImage(t.src);
      setImg(im);
      setTplId(t.id);
    } catch (e) {
      setNote(e.message);
    }
  }, []);

  useEffect(() => {
    pickTemplate(TEMPLATES[0]);
    return () => {
      if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    };
  }, [pickTemplate]);

  const onCountry = (id) => {
    setCountry(id);
    const first = TEMPLATES.find((t) => t.country === id);
    if (first) pickTemplate(first);
  };

  const onUpload = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setNote('Please choose an image file.');
      return;
    }
    if (f.size > MAX_UPLOAD) {
      setNote('That image is too large (max 20 MB).');
      return;
    }
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    const url = URL.createObjectURL(f);
    uploadUrlRef.current = url;
    try {
      const im = await loadImage(url);
      setImg(im);
      setUploadThumb(url);
      setTplId('upload');
      setNote('');
    } catch (err) {
      setNote(err.message);
    }
  };

  // ---------- আঁকা ----------
  const render = useCallback(
    (cv, overlay) => {
      if (!cv || !img) return;
      const iw = img.naturalWidth || img.width || 1200;
      const ih = img.naturalHeight || img.height || 900;
      const W = Math.min(iw, MAX_W);
      const imgH = Math.round((W * ih) / iw);
      const ctx = cv.getContext('2d');
      const upper = (t) => (t.upper ? t.text.toUpperCase() : t.text);

      const wrap = (txt, maxW) => {
        const out = [];
        String(txt).split('\n').forEach((para) => {
          let cur = '';
          para.split(' ').forEach((w) => {
            const trial = cur ? `${cur} ${w}` : w;
            if (cur && ctx.measureText(trial).width > maxW) {
              out.push(cur);
              cur = w;
            } else cur = trial;
          });
          out.push(cur);
        });
        return out;
      };

      // ক্যাপশন-বারের উচ্চতা
      let barH = 0;
      const first = texts[0];
      if (layout === 'bar' && first && first.text.trim()) {
        const px = Math.max(10, Math.round(first.size * W));
        ctx.font = fontCss(first.font, px);
        const lines = wrap(upper(first), W * 0.92);
        barH = Math.round(lines.length * px * 1.15 + px * 0.9);
      }

      cv.width = W;
      cv.height = imgH + barH;
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (barH) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, barH);
      }
      ctx.drawImage(img, 0, barH, W, imgH);

      const rects = [];
      texts.forEach((t, i) => {
        if (!t.text.trim()) return;
        const isBar = layout === 'bar' && i === 0;
        const px = Math.max(10, Math.round(t.size * W));
        ctx.font = fontCss(t.font, px);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = wrap(upper(t), W * 0.92);
        const lh = px * 1.12;
        const total = lh * lines.length;
        const cx = isBar ? W / 2 : t.x * W;
        const cy = isBar ? barH / 2 : barH + t.y * imgH;
        let widest = 0;
        lines.forEach((ln, k) => {
          const y = cy - total / 2 + lh * (k + 0.5);
          if (!isBar && t.stroke) {
            ctx.lineJoin = 'round';
            ctx.lineWidth = Math.max(2, px * 0.16);
            ctx.strokeStyle = '#000000';
            ctx.strokeText(ln, cx, y);
          }
          ctx.fillStyle = isBar && t.color === '#ffffff' ? '#111827' : t.color;
          ctx.fillText(ln, cx, y);
          widest = Math.max(widest, ctx.measureText(ln).width);
        });
        rects.push({ id: t.id, x: cx - widest / 2 - 10, y: cy - total / 2 - 10, w: widest + 20, h: total + 20, fixed: isBar });
      });

      if (watermark) {
        const px = Math.max(12, Math.round(W * 0.026));
        ctx.font = fontCss('clean', px);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'alphabetic';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(2, px * 0.2);
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText('buffradar.com', W - px * 0.6, cv.height - px * 0.6);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('buffradar.com', W - px * 0.6, cv.height - px * 0.6);
      }

      if (overlay) {
        const r = rects.find((q) => q.id === selId);
        if (r) {
          ctx.save();
          ctx.setLineDash([10, 8]);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(r.x, r.y, r.w, r.h);
          ctx.restore();
        }
        rectsRef.current = rects;
        metaRef.current = { W, imgH, barH };
      }
    },
    [img, texts, layout, watermark, selId, fontCss]
  );

  useEffect(() => {
    if (!fontsReady) return;
    render(canvasRef.current, true);
  }, [render, fontsReady]);

  // ---------- টেনে সরানো ----------
  const toCanvas = (e) => {
    const cv = canvasRef.current;
    const b = cv.getBoundingClientRect();
    return { x: ((e.clientX - b.left) * cv.width) / b.width, y: ((e.clientY - b.top) * cv.height) / b.height };
  };
  const onDown = (e) => {
    const p = toCanvas(e);
    const hit = [...rectsRef.current].reverse().find((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
    if (!hit) return;
    setSelId(hit.id);
    if (hit.fixed) return;
    const t = texts.find((q) => q.id === hit.id);
    const { W, imgH, barH } = metaRef.current;
    dragRef.current = { id: hit.id, dx: p.x - t.x * W, dy: p.y - (barH + t.y * imgH) };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toCanvas(e);
    const { W, imgH, barH } = metaRef.current;
    const x = clamp((p.x - d.dx) / W, 0.02, 0.98);
    const y = clamp((p.y - d.dy - barH) / imgH, 0.02, 0.98);
    setTexts((arr) => arr.map((t) => (t.id === d.id ? { ...t, x, y } : t)));
  };
  const onUp = () => {
    dragRef.current = null;
  };

  // ---------- লেখা সম্পাদনা ----------
  const sel = texts.find((t) => t.id === selId) || null;
  const patch = (id, o) => setTexts((arr) => arr.map((t) => (t.id === id ? { ...t, ...o } : t)));
  const addText = () => {
    if (texts.length >= 6) return;
    const t = makeText({ text: 'NEW TEXT', y: 0.5 });
    setTexts((a) => [...a, t]);
    setSelId(t.id);
  };
  const removeSel = () => {
    if (!sel) return;
    setTexts((a) => a.filter((t) => t.id !== sel.id));
    setSelId(null);
  };

  // ---------- AI ক্যাপশন ----------
  const suggest = async () => {
    if (!idea.trim()) {
      setAiError('Describe your meme idea first.');
      return;
    }
    setAiBusy(true);
    setAiError('');
    setSuggestions([]);
    try {
      const res = await fetch(`${API_BASE}/api/meme-captions`, {
        method: 'POST',
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ idea: idea.trim(), style: country === 'usa' ? 'american' : 'global' }),
      });
      if (!res.ok) {
        const lim = await readLimit(res);
        if (lim) {
          showLimit(lim);
          return;
        }
        let msg = 'Couldn’t get suggestions. Please try again.';
        try {
          const j = await res.json();
          if (j && j.detail) msg = j.detail;
        } catch (_) {}
        throw new Error(msg);
      }
      const j = await res.json();
      setSuggestions(Array.isArray(j.captions) ? j.captions : []);
      window.dispatchEvent(new Event('bf-usage-refresh'));
    } catch (e) {
      setAiError(e.message || 'Couldn’t get suggestions. Please try again.');
    } finally {
      setAiBusy(false);
    }
  };
  const applySuggestion = (c) => {
    setTexts((arr) => {
      const a = [...arr];
      while (a.length < 2) a.push(makeText({ y: a.length === 0 ? 0.13 : 0.87 }));
      a[0] = { ...a[0], text: c.top || '' };
      a[1] = { ...a[1], text: c.bottom || '' };
      return a;
    });
    setSelId(texts[0] ? texts[0].id : null);
  };

  // ---------- সেভ ও শেয়ার ----------
  const makeBlob = () =>
    new Promise((resolve) => {
      const cv = document.createElement('canvas');
      render(cv, false);
      cv.toBlob(resolve, 'image/png');
    });
  const download = async () => {
    setBusy(true);
    setNote('');
    try {
      const blob = await makeBlob();
      if (!blob) throw new Error('Couldn’t create the image.');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'buffradar-meme.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setNote('Saved! Check your downloads.');
    } catch (e) {
      setNote(e.message || 'Couldn’t save the image.');
    }
    setBusy(false);
  };
  const share = async () => {
    setNote('');
    try {
      const blob = await makeBlob();
      const file = new File([blob], 'buffradar-meme.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My meme' });
      } else {
        setNote('Sharing isn’t supported in this browser. Use Download instead.');
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') setNote('Couldn’t share the image.');
    }
  };

  const list = TEMPLATES.filter((t) => t.country === country);
  const btn = 'rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95';
  const on = 'bg-amber-400 text-slate-950 border-amber-300';
  const off = 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500';

  return (
    <div className="space-y-4">
      {/* ফন্ট চালু করার লুকানো উপাদান (canvas-এর জন্য) */}
      <span aria-hidden="true" className={`${anton.className} ${inter.className}`} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        Aa
      </span>

      {/* প্রিভিউ: মোবাইলে ওপরে আটকে থাকে, যাতে লেখার সময় ফল দেখা যায় */}
      <div className="sticky top-0 z-30 -mx-4 bg-slate-950/95 px-4 py-2 backdrop-blur">
        <div className="flex justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
          <canvas
            ref={canvasRef}
            width={1080}
            height={810}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="rounded-lg"
            style={{ maxWidth: '100%', maxHeight: '42vh', width: 'auto', height: 'auto', touchAction: 'none' }}
            aria-label="Meme preview. Drag the text to move it."
          />
        </div>
      </div>

      {/* দেশ + লেআউট */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="meme-country">Templates for</label>
        <select
          id="meme-country"
          value={country}
          onChange={(e) => onCountry(e.target.value)}
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white"
        >
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <button type="button" onClick={() => setLayout('classic')} className={`${btn} ${layout === 'classic' ? on : off}`}>Classic</button>
        <button type="button" onClick={() => setLayout('bar')} className={`${btn} ${layout === 'bar' ? on : off}`}>Caption bar</button>
      </div>

      {/* টেমপ্লেট-সারি */}
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Image</p>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => fileRef.current && fileRef.current.click()}
            className={`flex h-16 w-20 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-dashed text-[10px] font-bold ${
              tplId === 'upload' ? 'border-amber-300 text-amber-300' : 'border-slate-600 text-slate-300'
            }`}
          >
            {uploadThumb ? <img src={uploadThumb} alt="Your image" className="h-full w-full rounded-xl object-cover" /> : <>＋<span>Upload</span></>}
          </button>
          {list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => pickTemplate(t)}
              aria-label={t.name}
              className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 ${tplId === t.id ? 'border-amber-300' : 'border-slate-800'}`}
            >
              <img src={t.src} alt={t.name} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
      </div>

      {/* লেখা */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Text</p>
        {texts.map((t, i) => (
          <input
            key={t.id}
            value={t.text}
            onChange={(e) => patch(t.id, { text: e.target.value })}
            onFocus={() => setSelId(t.id)}
            placeholder={LABELS[i] || `Text ${i + 1}`}
            maxLength={120}
            className={`w-full rounded-xl border bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none ${
              selId === t.id ? 'border-amber-300' : 'border-slate-800'
            }`}
          />
        ))}
        <div className="flex gap-2">
          <button type="button" onClick={removeSel} disabled={!sel} className={`${btn} ${off} disabled:opacity-40`}>Remove text</button>
          <button type="button" onClick={addText} disabled={texts.length >= 6} className={`${btn} ${off} disabled:opacity-40`}>＋ Add text</button>
        </div>

        {sel && (
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => patch(sel.id, { font: 'impact' })} className={`${btn} ${sel.font === 'impact' ? on : off}`}>Bold</button>
              <button type="button" onClick={() => patch(sel.id, { font: 'clean' })} className={`${btn} ${sel.font === 'clean' ? on : off}`}>Clean</button>
              <button type="button" onClick={() => patch(sel.id, { stroke: !sel.stroke })} className={`${btn} ${sel.stroke ? on : off}`}>Outline</button>
              <button type="button" onClick={() => patch(sel.id, { upper: !sel.upper })} className={`${btn} ${sel.upper ? on : off}`}>ABC</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">Size</span>
              <input
                type="range"
                min="4"
                max="18"
                value={Math.round(sel.size * 100)}
                onChange={(e) => patch(sel.id, { size: Number(e.target.value) / 100 })}
                className="flex-1 accent-amber-400"
                aria-label="Text size"
              />
            </div>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => patch(sel.id, { color: c })}
                  className={`h-7 w-7 rounded-full border-2 ${sel.color === c ? 'border-amber-300' : 'border-slate-600'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI ক্যাপশন */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Need an idea?</p>
        <div className="flex gap-2">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !aiBusy && suggest()}
            placeholder="e.g. Monday morning at the office"
            maxLength={200}
            className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-300"
          />
          <button
            type="button"
            onClick={suggest}
            disabled={aiBusy}
            className="flex-shrink-0 rounded-xl bg-violet-500 px-3 text-xs font-black text-white transition hover:bg-violet-400 disabled:opacity-60 active:scale-95"
          >
            {aiBusy ? 'Thinking...' : '✨ Suggest captions'}
          </button>
        </div>
        {aiError && <p className="mt-2 text-xs text-red-400">{aiError}</p>}
        {suggestions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {suggestions.map((c, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => applySuggestion(c)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-left text-xs text-slate-200 hover:border-violet-400"
                >
                  {c.top && <span className="block font-bold">{c.top}</span>}
                  {c.bottom && <span className="block text-slate-400">{c.bottom}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10px] text-slate-500">Suggestions use credits. Only your idea text is sent, never your picture.</p>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-400">
        <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} className="accent-amber-400" />
        Show the small buffradar.com watermark
      </label>

      {/* সেভ */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={download}
          disabled={busy || !img}
          className="w-full rounded-full bg-emerald-500 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60 active:scale-[0.98]"
        >
          {busy ? 'Preparing...' : 'Download meme (PNG)'}
        </button>
        <button
          type="button"
          onClick={share}
          disabled={!img}
          className="w-full rounded-full border border-slate-700 py-2.5 text-xs font-bold text-slate-200 transition hover:border-slate-500 disabled:opacity-60"
        >
          Share
        </button>
        {note && <p className="text-center text-xs text-amber-300">{note}</p>}
        <p className="text-center text-[10px] text-slate-500">
          Your picture stays on your device. Only upload images you have the right to use.
        </p>
      </div>
    </div>
  );
}