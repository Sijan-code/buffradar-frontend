'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FORMATS, fmtSize, baseName, isHeic, searchTarget } from './imageCore';

// ছবি রূপান্তর ও ছোট করার টুল। সব কাজ ব্যবহারকারীর ব্রাউজারে হয়; ছবি আমাদের সার্ভারে যায় না, ক্রেডিটও লাগে না।
// props: mode = 'convert' | 'compress', to = জেপিইজি/পিএনজি/ওয়েবপি ('jpeg'|'png'|'webp'), targetKB = ছোট করার লক্ষ্য (compress-এ)
const MAX_FILES = 20;
const MAX_BYTES = 40 * 1024 * 1024;
const DIMS = [
  { v: 0, label: 'Original size' },
  { v: 4000, label: 'Max 4000 px' },
  { v: 2000, label: 'Max 2000 px' },
  { v: 1080, label: 'Max 1080 px' },
  { v: 800, label: 'Max 800 px' },
];
const TARGETS = [20, 50, 100, 200, 300, 500];
let uid = 1;

const toBlob = (canvas, mime, q) => new Promise((res) => canvas.toBlob(res, mime, q));
const srcSize = (s) => ({ w: s.width || s.naturalWidth, h: s.height || s.naturalHeight });

async function decode(file) {
  let blob = file;
  if (isHeic(file.name, file.type)) {
    const mod = await import('heic2any');
    const heic2any = mod.default || mod;
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    blob = Array.isArray(out) ? out[0] : out;
  }
  try {
    return await createImageBitmap(blob);
  } catch (_) {
    const url = URL.createObjectURL(blob);
    try {
      return await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error('This image format isn’t supported by your browser.'));
        im.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function draw(src, w, h, mime) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'; // পিএনজি-র স্বচ্ছ অংশ জেপিইজি-তে সাদা হয়
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  return c;
}

async function processOne(file, s) {
  const src = await decode(file);
  try {
    const { w: sw, h: sh } = srcSize(src);
    const long = Math.max(sw, sh);
    const base = s.maxDim && long > s.maxDim ? s.maxDim / long : 1;
    const fmt = FORMATS[s.format];
    if (s.mode === 'compress' && fmt.lossy) {
      const res = await searchTarget({
        encodeAt: (scale, q) => toBlob(draw(src, Math.max(1, Math.round(sw * scale)), Math.max(1, Math.round(sh * scale)), fmt.mime), fmt.mime, q),
        startScale: base,
        targetBytes: s.targetKB * 1024,
        longSide: long,
      });
      if (!res || !res.blob) throw new Error('Couldn’t compress this image.');
      return { blob: res.blob, w: Math.round(sw * res.scale), h: Math.round(sh * res.scale), reached: res.reached };
    }
    const w = Math.max(1, Math.round(sw * base));
    const h = Math.max(1, Math.round(sh * base));
    const blob = await toBlob(draw(src, w, h, fmt.mime), fmt.mime, s.quality);
    if (!blob) throw new Error('Couldn’t save in this format.');
    return { blob, w, h, reached: true };
  } finally {
    if (src && src.close) src.close();
  }
}

export default function ImageTool({ mode = 'convert', to = 'jpeg', targetKB = 200 }) {
  const fileRef = useRef(null);
  const runRef = useRef(0);
  const [items, setItems] = useState([]);
  const [s, setS] = useState({ mode, format: to, quality: 0.9, maxDim: 0, targetKB });
  const [stale, setStale] = useState(false);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [webpOk, setWebpOk] = useState(true);
  const urlsRef = useRef(new Set());

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      setWebpOk(c.toDataURL('image/webp').startsWith('data:image/webp'));
    } catch (_) {
      setWebpOk(false);
    }
    const urls = urlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const setItem = (id, o) => setItems((a) => a.map((x) => (x.id === id ? { ...x, ...o } : x)));

  const run = useCallback(async (list, settings) => {
    const token = ++runRef.current;
    setBusy(true);
    setStale(false);
    for (const it of list) {
      if (runRef.current !== token) return;
      setItems((a) => a.map((x) => (x.id === it.id ? { ...x, status: 'working', error: '', note: isHeic(x.file.name, x.file.type) ? 'Loading HEIC support…' : '' } : x)));
      try {
        const out = await processOne(it.file, settings);
        const url = URL.createObjectURL(out.blob);
        urlsRef.current.add(url);
        setItems((a) =>
          a.map((x) => {
            if (x.id !== it.id) return x;
            if (x.url) {
              URL.revokeObjectURL(x.url);
              urlsRef.current.delete(x.url);
            }
            return {
              ...x, status: 'done', url, size: out.blob.size, w: out.w, h: out.h, reached: out.reached, note: '',
              outName: `${baseName(x.file.name)}.${FORMATS[settings.format].ext}`,
            };
          })
        );
      } catch (e) {
        setItem(it.id, { status: 'error', error: (e && e.message) || 'Something went wrong.', note: '' });
      }
    }
    if (runRef.current === token) setBusy(false);
  }, []);

  const addFiles = (fileList) => {
    setNote('');
    const incoming = Array.from(fileList || []);
    const room = MAX_FILES - items.length;
    if (room <= 0) {
      setNote(`You can add up to ${MAX_FILES} images at a time.`);
      return;
    }
    const accepted = [];
    incoming.slice(0, room).forEach((f) => {
      const looksImage = f.type.startsWith('image/') || isHeic(f.name, f.type);
      if (!looksImage) setNote('Some files were skipped because they aren’t images.');
      else if (f.size > MAX_BYTES) setNote('Some images were skipped because they’re larger than 40 MB.');
      else accepted.push({ id: uid++, file: f, status: 'queued', origSize: f.size });
    });
    if (incoming.length > room) setNote(`Only the first ${room} images were added (limit ${MAX_FILES}).`);
    if (!accepted.length) return;
    setItems((a) => [...a, ...accepted]);
    run(accepted, s);
  };

  const change = (o) => {
    setS((p) => ({ ...p, ...o }));
    if (items.length) setStale(true);
  };
  const reapply = () => run(items, s);

  const remove = (id) =>
    setItems((a) => {
      const x = a.find((q) => q.id === id);
      if (x && x.url) {
        URL.revokeObjectURL(x.url);
        urlsRef.current.delete(x.url);
      }
      return a.filter((q) => q.id !== id);
    });
  const clearAll = () => {
    runRef.current++;
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current.clear();
    setItems([]);
    setBusy(false);
    setStale(false);
    setNote('');
  };
  const save = (x) => {
    const a = document.createElement('a');
    a.href = x.url;
    a.download = x.outName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const saveAll = async () => {
    for (const x of items.filter((q) => q.status === 'done')) {
      save(x);
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  const doneCount = items.filter((x) => x.status === 'done').length;
  const chip = 'rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95';
  const on = 'bg-cyan-400 text-slate-950 border-cyan-300';
  const off = 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500';
  const lossy = FORMATS[s.format].lossy;
  const formatList = mode === 'compress' ? ['jpeg', 'webp'] : ['jpeg', 'png', 'webp'];

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Save as</span>
          {formatList.map((f) => (
            <button key={f} type="button" disabled={f === 'webp' && !webpOk} onClick={() => change({ format: f })} className={`${chip} ${s.format === f ? on : off} disabled:opacity-40`}>
              {FORMATS[f].label}
            </button>
          ))}
          {!webpOk && <span className="text-[10px] text-slate-500">WebP isn’t supported by this browser.</span>}
        </div>

        {mode === 'compress' ? (
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Target size</p>
            <div className="flex flex-wrap items-center gap-2">
              {TARGETS.map((k) => (
                <button key={k} type="button" onClick={() => change({ targetKB: k })} className={`${chip} ${s.targetKB === k ? on : off}`}>
                  {k} KB
                </button>
              ))}
              <label className="flex items-center gap-1 text-[11px] text-slate-400">
                or
                <input
                  type="number"
                  min="5"
                  max="5000"
                  value={s.targetKB}
                  onChange={(e) => change({ targetKB: Math.min(5000, Math.max(5, Number(e.target.value) || 5)) })}
                  className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                  aria-label="Target size in KB"
                />
                KB
              </label>
            </div>
          </div>
        ) : (
          lossy && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">Quality</span>
              <input type="range" min="40" max="100" value={Math.round(s.quality * 100)} onChange={(e) => change({ quality: Number(e.target.value) / 100 })} className="flex-1 accent-cyan-400" aria-label="Quality" />
              <span className="w-8 text-right text-[11px] tabular-nums text-slate-300">{Math.round(s.quality * 100)}</span>
            </div>
          )
        )}

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Size</span>
          <select value={s.maxDim} onChange={(e) => change({ maxDim: Number(e.target.value) })} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white" aria-label="Maximum dimension">
            {DIMS.map((d) => (
              <option key={d.v} value={d.v}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current && fileRef.current.click()}
        className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition ${drag ? 'border-cyan-400 bg-cyan-400/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'}`}
      >
        <p className="mb-1 text-sm font-bold text-white">{items.length ? 'Add more images' : mode === 'compress' ? 'Choose images to compress' : 'Choose images to convert'}</p>
        <p className="text-[11px] text-slate-500">or drop them here (JPG, PNG, WebP, HEIC and more, up to {MAX_FILES} at once)</p>
        <input ref={fileRef} type="file" multiple accept="image/*,.heic,.heif" className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>
      <p className="text-center text-[10px] text-slate-500">Your images are processed in your browser and are never uploaded.</p>
      {note && <p className="text-center text-xs text-amber-300">{note}</p>}

      {stale && (
        <button type="button" onClick={reapply} disabled={busy} className="w-full rounded-full border border-cyan-400 py-2.5 text-xs font-black text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-60">
          Settings changed — apply to all images
        </button>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((x) => (
            <li key={x.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-2.5">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-950">
                {x.url ? <img src={x.url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">…</div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{x.file.name}</p>
                <p className="text-[11px] text-slate-400">
                  {fmtSize(x.origSize)}
                  {x.status === 'done' && (
                    <>
                      {' → '}
                      <span className="font-bold text-cyan-300">{fmtSize(x.size)}</span>
                      {x.origSize > 0 && x.size < x.origSize && <span className="text-emerald-400"> (−{Math.round((1 - x.size / x.origSize) * 100)}%)</span>}
                      {` · ${x.w}×${x.h}`}
                    </>
                  )}
                </p>
                {x.status === 'working' && <p className="text-[11px] text-cyan-300">{x.note || 'Working…'}</p>}
                {x.status === 'queued' && <p className="text-[11px] text-slate-500">Waiting…</p>}
                {x.status === 'error' && <p className="text-[11px] text-red-400">{x.error}</p>}
                {x.status === 'done' && s.mode === 'compress' && x.reached === false && <p className="text-[11px] text-amber-300">Couldn’t reach {s.targetKB} KB; this is the smallest we could make it.</p>}
              </div>
              <div className="flex flex-shrink-0 flex-col gap-1.5">
                {x.status === 'done' && (
                  <button type="button" onClick={() => save(x)} className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-slate-950 hover:bg-emerald-400">
                    Download
                  </button>
                )}
                <button type="button" onClick={() => remove(x.id)} className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-bold text-slate-400 hover:border-slate-500">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="flex gap-2">
          {doneCount > 1 && (
            <button type="button" onClick={saveAll} className="flex-1 rounded-full bg-emerald-500 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400">
              Download all ({doneCount})
            </button>
          )}
          <button type="button" onClick={clearAll} className="flex-1 rounded-full border border-slate-700 py-3 text-xs font-bold text-slate-300 hover:border-slate-500">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}