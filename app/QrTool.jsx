'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { buildPayload, contrastRatio, luminance, isFinder, matrixToSvg } from './qrCore';

// স্থায়ী (static) QR কোড জেনারেটর। সব কাজ ব্রাউজারে, আপনার লেখা আমাদের সার্ভারে যায় না।
// props: type = শুরুর ট্যাব (link|text|wifi|whatsapp|email|phone), placeholder = লিংকের ঘরের উদাহরণ
const TYPES = [
  { id: 'link', label: 'Link' },
  { id: 'text', label: 'Text' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
];
const SIZES = [256, 512, 1024, 2048];
const MAX_LEN = 1200;

function makeMatrix(text, ec) {
  const qr = QRCode.create(text, { errorCorrectionLevel: ec });
  const n = qr.modules.size;
  const m = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) row.push(!!qr.modules.get(r, c));
    m.push(row);
  }
  return m;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function paint(canvas, matrix, { size, margin, fg, bg, style, logoImg }) {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const n = matrix.length;
  const total = n + margin * 2;
  const cell = size / total;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c]) continue;
      const x0 = Math.round((c + margin) * cell);
      const x1 = Math.round((c + margin + 1) * cell);
      const y0 = Math.round((r + margin) * cell);
      const y1 = Math.round((r + margin + 1) * cell);
      if (style === 'square' || isFinder(r, c, n)) {
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      } else if (style === 'rounded') {
        roundRect(ctx, x0 + cell * 0.04, y0 + cell * 0.04, cell * 0.92, cell * 0.92, cell * 0.3);
      } else {
        ctx.beginPath();
        ctx.arc(x0 + cell / 2, y0 + cell / 2, cell * 0.46, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (logoImg) {
    const side = size * 0.2;
    const o = (size - side) / 2;
    const pad = side * 0.08;
    ctx.fillStyle = bg;
    roundRect(ctx, o - pad, o - pad, side + pad * 2, side + pad * 2, side * 0.12);
    const iw = logoImg.naturalWidth || logoImg.width || 1;
    const ih = logoImg.naturalHeight || logoImg.height || 1;
    const k = Math.min(side / iw, side / ih);
    ctx.drawImage(logoImg, o + (side - iw * k) / 2, o + (side - ih * k) / 2, iw * k, ih * k);
  }
}

const inputCls = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-lime-400';

export default function QrTool({ type = 'link', placeholder = 'https://example.com' }) {
  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const [tab, setTab] = useState(type);
  const [f, setF] = useState({ url: '', text: '', ssid: '', password: '', security: 'WPA', hidden: false, phone: '', message: '', email: '', subject: '', body: '' });
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [style, setStyle] = useState('square');
  const [ecUser, setEcUser] = useState('M');
  const [size, setSize] = useState(1024);
  const [logo, setLogo] = useState(null); // {dataUrl, img}
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');

  const set = (o) => setF((p) => ({ ...p, ...o }));
  const payload = buildPayload(tab, f);
  const ec = logo ? 'H' : ecUser;
  const ratio = contrastRatio(fg, bg);
  const inverted = luminance(fg) > luminance(bg);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    if (!payload) {
      setErr('');
      return;
    }
    if (payload.length > MAX_LEN) {
      setErr('That’s too much for one QR code. Try something shorter.');
      return;
    }
    try {
      const m = makeMatrix(payload, ec);
      paint(cv, m, { size: 640, margin: 4, fg, bg, style, logoImg: logo && logo.img });
      setErr('');
    } catch (e) {
      setErr('That’s too much for one QR code. Try something shorter.');
    }
  }, [payload, ec, fg, bg, style, logo]);

  const onLogo = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setNote('Please choose an image under 2 MB for the logo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setLogo({ dataUrl: String(reader.result), img });
        setNote('');
      };
      img.onerror = () => setNote('Couldn’t read that image.');
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const download = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  const savePng = () => {
    try {
      const cv = document.createElement('canvas');
      paint(cv, makeMatrix(payload, ec), { size, margin: 4, fg, bg, style, logoImg: logo && logo.img });
      cv.toBlob((b) => (b ? download(b, 'qr-code.png') : setNote('Couldn’t save the image.')), 'image/png');
      setNote('');
    } catch (_) {
      setNote('Couldn’t save the image.');
    }
  };
  const saveSvg = () => {
    try {
      const svg = matrixToSvg(makeMatrix(payload, ec), { size, margin: 4, fg, bg, style, logo: logo ? { dataUrl: logo.dataUrl, ratio: 0.2 } : null });
      download(new Blob([svg], { type: 'image/svg+xml' }), 'qr-code.svg');
      setNote('');
    } catch (_) {
      setNote('Couldn’t save the SVG.');
    }
  };

  const chip = 'rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95';
  const on = 'bg-lime-400 text-slate-950 border-lime-300';
  const off = 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500';
  const ready = !!payload && !err;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`${chip} ${tab === t.id ? on : off}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {tab === 'link' && <input value={f.url} onChange={(e) => set({ url: e.target.value })} placeholder={placeholder} maxLength={MAX_LEN} className={inputCls} aria-label="Link" />}
        {tab === 'text' && <textarea value={f.text} onChange={(e) => set({ text: e.target.value })} placeholder="Type your text" rows={3} maxLength={MAX_LEN} className={inputCls} aria-label="Text" />}
        {tab === 'wifi' && (
          <>
            <input value={f.ssid} onChange={(e) => set({ ssid: e.target.value })} placeholder="Network name (SSID)" maxLength={60} className={inputCls} aria-label="Network name" />
            <input value={f.password} onChange={(e) => set({ password: e.target.value })} placeholder="Password" maxLength={80} disabled={f.security === 'nopass'} className={`${inputCls} disabled:opacity-40`} aria-label="Wi-Fi password" />
            <div className="flex flex-wrap items-center gap-2">
              {['WPA', 'WEP', 'nopass'].map((k) => (
                <button key={k} type="button" onClick={() => set({ security: k })} className={`${chip} ${f.security === k ? on : off}`}>
                  {k === 'nopass' ? 'No password' : k === 'WPA' ? 'WPA/WPA2/WPA3' : 'WEP'}
                </button>
              ))}
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <input type="checkbox" checked={f.hidden} onChange={(e) => set({ hidden: e.target.checked })} className="accent-lime-400" />
                Hidden network
              </label>
            </div>
          </>
        )}
        {tab === 'whatsapp' && (
          <>
            <input value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Phone number with country code, e.g. 8801712345678" inputMode="tel" maxLength={25} className={inputCls} aria-label="WhatsApp number" />
            <input value={f.message} onChange={(e) => set({ message: e.target.value })} placeholder="Pre-filled message (optional)" maxLength={300} className={inputCls} aria-label="Message" />
          </>
        )}
        {tab === 'email' && (
          <>
            <input value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="Email address" inputMode="email" maxLength={120} className={inputCls} aria-label="Email address" />
            <input value={f.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="Subject (optional)" maxLength={150} className={inputCls} aria-label="Subject" />
            <textarea value={f.body} onChange={(e) => set({ body: e.target.value })} placeholder="Message (optional)" rows={2} maxLength={500} className={inputCls} aria-label="Message" />
          </>
        )}
        {tab === 'phone' && <input value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Phone number" inputMode="tel" maxLength={25} className={inputCls} aria-label="Phone number" />}
      </div>

      <div className="flex justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        {ready ? (
          <canvas ref={canvasRef} className="rounded-lg" style={{ width: 'min(100%, 320px)', height: 'auto', aspectRatio: '1 / 1' }} aria-label="Your QR code" />
        ) : (
          <>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex h-48 w-full max-w-[320px] items-center justify-center rounded-lg border border-dashed border-slate-700 px-4 text-center text-xs text-slate-500">
              {err || 'Fill in the details above to create your QR code.'}
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <label className="flex items-center gap-1.5">
            Code
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-7 w-9 rounded border border-slate-700 bg-transparent" aria-label="Code color" />
          </label>
          <label className="flex items-center gap-1.5">
            Background
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-7 w-9 rounded border border-slate-700 bg-transparent" aria-label="Background color" />
          </label>
          <button type="button" onClick={() => { setFg('#000000'); setBg('#ffffff'); }} className="underline underline-offset-2 hover:text-slate-200">Reset</button>
        </div>
        {(ratio < 3 || inverted) && (
          <p className="text-[11px] text-amber-300">
            {inverted ? 'A dark code on a light background scans most reliably.' : 'These colors are too close together; the code may not scan.'}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Style</span>
          {[['square', 'Square'], ['rounded', 'Rounded'], ['dots', 'Dots']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setStyle(k)} className={`${chip} ${style === k ? on : off}`}>{l}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Logo</span>
          <button type="button" onClick={() => logoRef.current && logoRef.current.click()} className={`${chip} ${off}`}>{logo ? 'Change logo' : '＋ Add a logo'}</button>
          {logo && <button type="button" onClick={() => setLogo(null)} className={`${chip} ${off}`}>Remove</button>}
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
        </div>
        {logo && <p className="text-[10px] text-slate-500">With a logo we use the highest error correction, so the code still scans. Always test it with your phone.</p>}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Error correction</span>
          {['L', 'M', 'Q', 'H'].map((k) => (
            <button key={k} type="button" disabled={!!logo} onClick={() => setEcUser(k)} className={`${chip} ${ec === k ? on : off} disabled:opacity-60`}>{k}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Size</span>
          {SIZES.map((v) => (
            <button key={v} type="button" onClick={() => setSize(v)} className={`${chip} ${size === v ? on : off}`}>{v}px</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={savePng} disabled={!ready} className="rounded-full bg-emerald-500 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400 disabled:opacity-50 active:scale-[0.98]">
          Download PNG
        </button>
        <button type="button" onClick={saveSvg} disabled={!ready} className="rounded-full border border-slate-700 py-3 text-sm font-bold text-slate-200 hover:border-slate-500 disabled:opacity-50">
          Download SVG
        </button>
      </div>
      {note && <p className="text-center text-xs text-amber-300">{note}</p>}
      <p className="text-center text-[10px] text-slate-500">
        Static QR codes: the information is stored inside the code, so it never expires and we don’t track scans. What you type stays in your browser.
      </p>
    </div>
  );
}