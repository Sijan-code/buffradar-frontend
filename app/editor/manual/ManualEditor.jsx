'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { takePendingFile } from '../../converterStore';
import { takePendingEditorFile } from '../../editorStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const ASPECTS = [
  { id: 'original', label: 'Original' },
  { id: '9:16', label: '9:16' },
  { id: '1:1', label: '1:1' },
  { id: '16:9', label: '16:9' },
];
const RESOLUTIONS = [
  { id: 'original', label: 'Original' },
  { id: '1080p', label: '1080p' },
  { id: '720p', label: '720p' },
  { id: '480p', label: '480p' },
  { id: '360p', label: '360p' },
];
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const TEXT_COLORS = ['white', 'black', 'yellow', 'red', '#22d3ee', '#a78bfa'];
const EMOJIS = ['😀', '😂', '😍', '🔥', '❤️', '⭐', '👍', '🎉', '💯', '😎', '🙏', '✨'];
const MAX_STICKERS = 8;
const EFFECTS = [
  { id: 'none', label: 'None' },
  { id: 'blur', label: 'Blur' },
  { id: 'sharpen', label: 'Sharpen' },
  { id: 'vignette', label: 'Vignette' },
  { id: 'grain', label: 'Grain' },
];
const FLIPS = [
  { id: 'none', label: 'None' },
  { id: 'h', label: 'Horizontal' },
  { id: 'v', label: 'Vertical' },
  { id: 'both', label: 'Both' },
];
const FORMATS = [
  { id: 'mp4', label: 'MP4 video', ext: 'mp4' },
  { id: 'gif', label: 'GIF', ext: 'gif' },
  { id: 'mp3', label: 'MP3 audio', ext: 'mp3' },
];
const PRESETS = [
  { id: 'none', label: 'None' },
  { id: 'bw', label: 'B&W' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'vivid', label: 'Vivid' },
];
// প্রিভিউয়ের জন্য CSS (এক্সপোর্টে ffmpeg-এর ফিল্টার চলে, তাই হুবহু এক নাও হতে পারে)
const PRESET_CSS = {
  none: '',
  bw: 'grayscale(1)',
  warm: 'sepia(0.3) saturate(1.2) hue-rotate(-10deg)',
  cool: 'hue-rotate(15deg) saturate(1.1)',
  vintage: 'sepia(0.5) contrast(0.9) brightness(1.05)',
  vivid: 'saturate(1.4) contrast(1.08)',
};

const TOOLS = [
  { id: 'trim', label: 'Trim', d: 'M6 6l12 12M6 18L18 6M6 6v4M6 6h4M18 18v-4M18 18h-4' },
  { id: 'cut', label: 'Cut', d: 'M6 3v6m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 6v0M18 3v6m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM9 12h6' },
  { id: 'resize', label: 'Resize', d: 'M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4' },
  { id: 'speed', label: 'Speed', d: 'M12 8v4l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z' },
  { id: 'filter', label: 'Filter', d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 3v18M12 3a9 9 0 0 1 0 18' },
  { id: 'effect', label: 'Effect', d: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z' },
  { id: 'fade', label: 'Fade', d: 'M3 12h4l3-7 4 14 3-7h4' },
  { id: 'audio', label: 'Audio', d: 'M11 5 6 9H3v6h3l5 4V5ZM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14' },
  { id: 'music', label: 'Music', d: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
  { id: 'text', label: 'Text', d: 'M5 5h14M12 5v14' },
  { id: 'sticker', label: 'Sticker', d: 'M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V9l-6-6ZM15 3v6h6M9 14h.01M15 14h.01M9.5 17.5c1.5 1 3.5 1 5 0' },
  { id: 'cover', label: 'Cover', d: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5' },
  { id: 'export', label: 'Export', d: 'M12 4v11m0 0 4-4m-4 4-4-4M5 20h14' },
];

function fmt(t) {
  const s = Math.max(0, t || 0);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, '0')}`;
}

function Icon({ d, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
        active
          ? 'bg-sky-500 border-sky-400 text-slate-950'
          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-bold text-slate-400">{label}</p>
        <p className="text-xs font-bold text-slate-300 tabular-nums">
          {value}
          {unit}
        </p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-500"
      />
    </div>
  );
}

function TimingRow({ from, to, onFromHere, onToHere, onAlways }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-slate-400">
        Visible: {!from && !to ? 'whole clip' : `${fmt(from)} to ${to ? fmt(to) : 'end'}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Chip onClick={onFromHere}>Show from here</Chip>
        <Chip onClick={onToHere}>Hide after here</Chip>
        <Chip onClick={onAlways}>Whole clip</Chip>
      </div>
    </div>
  );
}

export default function ManualEditor() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const tlRef = useRef(null);
  const ppsRef = useRef(80);
  const lastLeft = useRef(0);
  const startRef = useRef(0);
  const endRef = useRef(0);
  const dragRef = useRef(null);
  const histRef = useRef({ list: [], idx: -1 });
  const cutsRef = useRef([]);
  const audioRef = useRef(null);
  const musicInputRef = useRef(null);
  const stickerInputRef = useRef(null);
  const stickerDrag = useRef(null);

  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [vdim, setVdim] = useState({ w: 0, h: 0 });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [tlW, setTlW] = useState(0);
  const [thumbs, setThumbs] = useState([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTool, setActiveTool] = useState(null);

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState('original');
  const [resolution, setResolution] = useState('original');
  const [speed, setSpeed] = useState(1);
  const [mute, setMute] = useState(false);
  const [volume, setVolume] = useState(100);
  const [text, setText] = useState('');
  const [textPosition, setTextPosition] = useState('bottom');
  const [textColor, setTextColor] = useState('white');
  const [preset, setPreset] = useState('none');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [flip, setFlip] = useState('none');
  const [reverse, setReverse] = useState(false);
  const [effect, setEffect] = useState('none');
  const [effectAmount, setEffectAmount] = useState(50);
  const [textSize, setTextSize] = useState(36);
  const [textBg, setTextBg] = useState(false);
  const [textFrom, setTextFrom] = useState(0);
  const [textTo, setTextTo] = useState(0);
  const [cuts, setCuts] = useState([]); // [[from, to], ...] সোর্স-সময়ে
  const [cutFrom, setCutFrom] = useState(null);
  const [cutTo, setCutTo] = useState(null);
  const [fit, setFit] = useState('crop');
  const [outputFormat, setOutputFormat] = useState('mp4');
  const [hv, setHv] = useState(0); // history বদলালে রি-রেন্ডারের জন্য
  const [musicFile, setMusicFile] = useState(null);
  const [musicUrl, setMusicUrl] = useState('');
  const [musicVolume, setMusicVolume] = useState(100);
  const [musicLoop, setMusicLoop] = useState(false);
  const [stickers, setStickers] = useState([]);
  const [selSticker, setSelSticker] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [notice, setNotice] = useState(null);

  startRef.current = start;
  endRef.current = end;
  cutsRef.current = cuts;

  // টাইমলাইনের স্কেল: ছোট ভিডিওতে বড়, লম্বা ভিডিওতে ছোট
  const pps = duration
    ? Math.max(240 / duration, Math.min(80, Math.max(6, 3000 / duration)))
    : 80;
  ppsRef.current = pps;
  const stripW = duration * pps;
  const tileCount = Math.min(36, Math.max(1, Math.ceil(stripW / 56)));

  // মিউজিক ফাইলের URL ও প্রিভিউয়ের সেটিংস
  useEffect(() => {
    if (!musicFile) {
      setMusicUrl('');
      return;
    }
    const url = URL.createObjectURL(musicFile);
    setMusicUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [musicFile]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = musicLoop;
    a.volume = Math.min(1, Math.max(0, musicVolume / 100));
  }, [musicVolume, musicLoop, musicUrl]);

  // ---- Undo / Redo: সব সেটিংয়ের ছবি (snapshot) রাখা ----
  const settings = {
    start, end, rotate, aspect, resolution, speed, mute, volume,
    text, textPosition, textColor, preset, brightness, contrast, saturation, fadeIn, fadeOut,
    flip, reverse, effect, effectAmount, textSize, textBg, textFrom, textTo, cuts, fit, outputFormat,
  };
  const settingsKey = JSON.stringify(settings);

  const applySettings = (sn) => {
    setStart(sn.start);
    setEnd(sn.end);
    setRotate(sn.rotate);
    setAspect(sn.aspect);
    setResolution(sn.resolution);
    setSpeed(sn.speed);
    setMute(sn.mute);
    setVolume(sn.volume);
    setText(sn.text);
    setTextPosition(sn.textPosition);
    setTextColor(sn.textColor);
    setPreset(sn.preset);
    setBrightness(sn.brightness);
    setContrast(sn.contrast);
    setSaturation(sn.saturation);
    setFadeIn(sn.fadeIn);
    setFadeOut(sn.fadeOut);
    setFlip(sn.flip ?? 'none');
    setReverse(sn.reverse ?? false);
    setEffect(sn.effect ?? 'none');
    setEffectAmount(sn.effectAmount ?? 50);
    setTextSize(sn.textSize ?? 36);
    setTextBg(sn.textBg ?? false);
    setTextFrom(sn.textFrom ?? 0);
    setTextTo(sn.textTo ?? 0);
    setCuts(sn.cuts ?? []);
    setFit(sn.fit ?? 'crop');
    setOutputFormat(sn.outputFormat ?? 'mp4');
  };

  useEffect(() => {
    if (!duration) return;
    const id = setTimeout(() => {
      const h = histRef.current;
      if (h.list[h.idx] === settingsKey) return;
      h.list = h.list.slice(0, h.idx + 1);
      h.list.push(settingsKey);
      if (h.list.length > 60) h.list.shift();
      h.idx = h.list.length - 1;
      setHv((n) => n + 1);
    }, 350);
    return () => clearTimeout(id);
  }, [settingsKey, duration]);

  const stepHistory = (dir) => {
    const h = histRef.current;
    // এখনো জমা না হওয়া বদলও আগে সেভ করে নিই
    if (dir < 0 && duration && h.list[h.idx] !== settingsKey) {
      h.list = h.list.slice(0, h.idx + 1);
      h.list.push(settingsKey);
      h.idx = h.list.length - 1;
    }
    const next = h.idx + dir;
    if (next < 0 || next >= h.list.length) return;
    h.idx = next;
    applySettings(JSON.parse(h.list[next]));
    setHv((n) => n + 1);
  };
  const canUndo = hv >= 0 && histRef.current.idx > 0;
  const canRedo = hv >= 0 && histRef.current.idx < histRef.current.list.length - 1;

  useEffect(() => {
    const incoming = takePendingFile() || takePendingEditorFile();
    if (incoming) setFile(incoming);
  }, []);

  // ফাইল বদলালে URL বানানো
  useEffect(() => {
    if (!file) {
      setVideoUrl('');
      setDuration(0);
      setThumbs([]);
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setThumbs([]);
    setCurrentTime(0);
    setIsPlaying(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // প্রিভিউ ও টাইমলাইনের মাপ
  useEffect(() => {
    if (!file) return;
    const observe = (el, cb) => {
      if (!el) return () => {};
      const read = () => cb(el.getBoundingClientRect());
      read();
      const ro = new ResizeObserver(read);
      ro.observe(el);
      return () => ro.disconnect();
    };
    const off1 = observe(previewRef.current, (r) => setBox({ w: r.width, h: r.height }));
    const off2 = observe(tlRef.current, (r) => setTlW(r.width));
    return () => {
      off1();
      off2();
    };
  }, [file]);

  // টাইমলাইনের ফ্রেম (থাম্বনেইল) বানানো
  useEffect(() => {
    if (!videoUrl || !duration || !vdim.w) return;
    let cancelled = false;
    const n = tileCount;
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.src = videoUrl;
    const ready = new Promise((res) => {
      v.onloadeddata = res;
      v.onerror = res;
    });
    (async () => {
      await ready;
      if (cancelled) return;
      const tileW = (duration * ppsRef.current) / n;
      const cw = Math.max(40, Math.round(tileW * 1.5));
      const ch = 84;
      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      const ctx = c.getContext('2d');
      const out = [];
      for (let i = 0; i < n && !cancelled; i++) {
        const t = Math.max(0, Math.min(duration - 0.05, ((i + 0.5) / n) * duration));
        await new Promise((res) => {
          const done = () => {
            v.removeEventListener('seeked', done);
            res();
          };
          v.addEventListener('seeked', done);
          v.currentTime = t;
          setTimeout(done, 1500);
        });
        if (cancelled || !v.videoWidth) return;
        const vr = v.videoWidth / v.videoHeight;
        const cr = cw / ch;
        let sw = v.videoWidth;
        let sh = v.videoHeight;
        let sx = 0;
        let sy = 0;
        if (vr > cr) {
          sw = v.videoHeight * cr;
          sx = (v.videoWidth - sw) / 2;
        } else {
          sh = v.videoWidth / cr;
          sy = (v.videoHeight - sh) / 2;
        }
        try {
          ctx.drawImage(v, sx, sy, sw, sh, 0, 0, cw, ch);
          out[i] = c.toDataURL('image/jpeg', 0.6);
        } catch (_) {}
        if (i % 4 === 3 || i === n - 1) setThumbs(out.slice());
      }
    })();
    return () => {
      cancelled = true;
      v.removeAttribute('src');
    };
  }, [videoUrl, duration, vdim.w, tileCount]);

  // প্রিভিউয়ের স্পিড/ভলিউম
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    v.muted = mute;
    v.volume = Math.min(1, Math.max(0, volume / 100));
  }, [speed, mute, volume, videoUrl]);

  const syncScroll = (t) => {
    const el = tlRef.current;
    if (!el) return;
    el.scrollLeft = t * ppsRef.current;
    lastLeft.current = el.scrollLeft;
  };

  // প্লে চলার সময় প্লেহেড ও স্ক্রল মসৃণভাবে আপডেট
  useEffect(() => {
    if (!isPlaying) return;
    let raf;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        let t = v.currentTime;
        const hit = cutsRef.current.find((c) => t >= c[0] - 0.02 && t < c[1]);
        if (hit) {
          t = hit[1];
          v.currentTime = t;
        }
        if (t >= endRef.current - 0.03) {
          t = endRef.current;
          v.pause();
          v.currentTime = t;
        }
        setCurrentTime(t);
        syncScroll(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // সফল এডিটের মেসেজ কিছুক্ষণ পর মুছে যায়
  useEffect(() => {
    if (!notice || notice.type !== 'done') return;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setStart(0);
    setEnd(0);
    setRotate(0);
    setAspect('original');
    setResolution('original');
    setSpeed(1);
    setMute(false);
    setVolume(100);
    setText('');
    setTextPosition('bottom');
    setTextColor('white');
    setPreset('none');
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setFadeIn(0);
    setFadeOut(0);
    setFlip('none');
    setReverse(false);
    setEffect('none');
    setEffectAmount(50);
    setTextSize(36);
    setTextBg(false);
    setTextFrom(0);
    setTextTo(0);
    setCuts([]);
    setCutFrom(null);
    setCutTo(null);
    setFit('crop');
    setOutputFormat('mp4');
    setDuration(0);
    setMusicFile(null);
    setStickers((list) => {
      list.forEach((st) => URL.revokeObjectURL(st.url));
      return [];
    });
    setSelSticker(null);
    histRef.current = { list: [], idx: -1 };
    setHv((n) => n + 1);
    setActiveTool(null);
    setProgress(null);
    setNotice(null);
  };

  const handleBrowse = (e) => {
    pickFile(e.target.files && e.target.files[0]);
    e.target.value = '';
  };

  const onMeta = (e) => {
    const v = e.currentTarget;
    const d = Number.isFinite(v.duration) ? v.duration : 0;
    setDuration(d);
    setStart(0);
    setEnd(d);
    setVdim({ w: v.videoWidth, h: v.videoHeight });
    v.playbackRate = speed;
  };

  const seekTo = (t, scroll = true) => {
    const v = videoRef.current;
    const tt = Math.min(Math.max(0, t), duration || 0);
    if (v) v.currentTime = tt;
    setCurrentTime(tt);
    if (scroll) syncScroll(tt);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime < startRef.current || v.currentTime >= endRef.current - 0.05) {
        seekTo(startRef.current);
      }
      const inCut = cutsRef.current.find((c) => v.currentTime >= c[0] && v.currentTime < c[1]);
      if (inCut) seekTo(inCut[1]);
      v.play();
    } else {
      v.pause();
    }
  };

  const onTimelineScroll = (e) => {
    const el = e.currentTarget;
    if (Math.abs(el.scrollLeft - lastLeft.current) < 1.5) return;
    lastLeft.current = el.scrollLeft;
    const t = Math.min(duration, Math.max(0, el.scrollLeft / ppsRef.current));
    const v = videoRef.current;
    if (v && !v.paused) v.pause();
    if (v) v.currentTime = t;
    setCurrentTime(t);
  };

  // ট্রিম হ্যান্ডেল টানা
  const startDrag = (which) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const v = videoRef.current;
    if (v && !v.paused) v.pause();
    dragRef.current = { which, x: e.clientX, from: which === 'start' ? startRef.current : endRef.current };
  };
  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dt = (e.clientX - d.x) / ppsRef.current;
    if (d.which === 'start') {
      const n = Math.max(0, Math.min(d.from + dt, endRef.current - 0.2));
      setStart(n);
      seekTo(n, false);
    } else {
      const n = Math.min(duration, Math.max(d.from + dt, startRef.current + 0.2));
      setEnd(n);
      seekTo(n, false);
    }
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    syncScroll(videoRef.current ? videoRef.current.currentTime : 0);
  };

  const goFullscreen = () => {
    const el = previewRef.current;
    if (el && el.requestFullscreen) el.requestFullscreen();
  };

  const handleExport = () => {
    if (!file || processing) return;
    if (end > 0 && end <= start) {
      setNotice({ type: 'error', text: 'End time অবশ্যই Start time-এর চেয়ে বেশি হতে হবে।' });
      return;
    }
    const v = videoRef.current;
    if (v && !v.paused) v.pause();
    setProcessing(true);
    setNotice(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('start', String(start));
    formData.append('end', String(end >= duration - 0.05 ? 0 : end));
    formData.append('rotate', String(rotate));
    formData.append('aspect', aspect);
    formData.append('resolution', resolution);
    formData.append('speed', String(speed));
    formData.append('mute', mute ? 'true' : 'false');
    formData.append('volume', String(volume));
    formData.append('text', text);
    formData.append('text_position', textPosition);
    formData.append('text_size', String(textSize));
    formData.append('text_color', textColor);
    formData.append('filter_preset', preset);
    formData.append('brightness', String(brightness));
    formData.append('contrast', String(contrast));
    formData.append('saturation', String(saturation));
    formData.append('fade_in', String(fadeIn));
    formData.append('fade_out', String(fadeOut));
    formData.append('flip', flip);
    formData.append('reverse', reverse ? 'true' : 'false');
    formData.append('effect', effect);
    formData.append('effect_amount', String(effectAmount));
    formData.append('text_bg', textBg ? 'true' : 'false');
    formData.append('text_from', String(textFrom));
    formData.append('text_to', String(textTo));
    formData.append('cuts', JSON.stringify(cuts));
    formData.append('fit', fit);
    formData.append('output_format', outputFormat);
    if (musicFile) {
      formData.append('music', musicFile);
      formData.append('music_volume', String(musicVolume));
      formData.append('music_loop', musicLoop ? 'true' : 'false');
    }
    stickers.forEach((st, i) => formData.append('stickers', st.blob, `sticker${i}.png`));
    formData.append(
      'sticker_meta',
      JSON.stringify(stickers.map((st) => ({ x: st.x, y: st.y, w: st.w, from: st.from || 0, to: st.to || 0 })))
    );

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/edit-upload`);
    xhr.responseType = 'blob';

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 50));
    };
    const fakeInterval = setInterval(() => {
      setProgress((p) => (p === null || p < 50 || p >= 92 ? p : p + 1));
    }, 600);

    const fail = (msg) => {
      setProgress(null);
      setNotice({ type: 'error', text: msg });
    };

    xhr.onload = () => {
      clearInterval(fakeInterval);
      setProcessing(false);
      if (xhr.status !== 200) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            fail(JSON.parse(reader.result).detail || 'এডিট করা যায়নি।');
          } catch (_) {
            fail('এডিট করা যায়নি।');
          }
        };
        reader.onerror = () => fail('এডিট করা যায়নি।');
        reader.readAsText(xhr.response);
        return;
      }
      setProgress(100);
      const safeName =
        (file.name || 'edited').replace(/\.[^/.]+$/, '').replace(/[\\/:*?"<>|]+/g, '').trim().substring(0, 40) ||
        'edited';
      const url = window.URL.createObjectURL(xhr.response);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${safeName}_edited.${(FORMATS.find((f) => f.id === outputFormat) || FORMATS[0]).ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
      setNotice({ type: 'done', text: 'এডিট সম্পন্ন! ডাউনলোড শুরু হয়ে গেছে।' });
      setTimeout(() => setProgress(null), 800);
    };
    xhr.onerror = () => {
      clearInterval(fakeInterval);
      setProcessing(false);
      fail('নেটওয়ার্ক সমস্যা, এডিট করা যায়নি।');
    };
    xhr.send(formData);
  };

  // ---- প্রিভিউয়ের মাপ (ঘোরানো হলেও ফিট) ----
  const vw = vdim.w;
  const vh = vdim.h;
  const rotated = rotate === 90 || rotate === 270;
  let s = 0;
  if (vw && vh && box.w && box.h) {
    s = rotated ? Math.min(box.w / vh, box.h / vw) : Math.min(box.w / vw, box.h / vh);
  }
  const dispW = (rotated ? vh : vw) * s;
  const dispH = (rotated ? vw : vh) * s;

  const cssFilter =
    [
      PRESET_CSS[preset],
      effect === 'blur' ? `blur(${(1 + effectAmount * 0.2) * s}px)` : '',
      brightness || contrast || saturation
        ? `brightness(${1 + brightness / 150}) contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100})`
        : '',
    ]
      .filter(Boolean)
      .join(' ') || 'none';

  const saveCover = () => {
    const v = videoRef.current;
    if (!v || !vw) return;
    const c = document.createElement('canvas');
    c.width = rotated ? vh : vw;
    c.height = rotated ? vw : vh;
    const ctx = c.getContext('2d');
    if (cssFilter !== 'none') ctx.filter = cssFilter;
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.drawImage(v, -vw / 2, -vh / 2, vw, vh);
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const base = (file.name || 'video').replace(/\.[^/.]+$/, '').replace(/[\\/:*?"<>|]+/g, '').trim().substring(0, 40) || 'video';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${base}_cover.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice({ type: 'done', text: 'Cover ছবি সেভ হয়েছে।' });
      },
      'image/jpeg',
      0.92
    );
  };

  // ---- স্টিকার ----
  const addStickerBlob = (blob) => {
    if (stickers.length >= MAX_STICKERS) {
      setNotice({ type: 'error', text: `সর্বোচ্চ ${MAX_STICKERS}টি স্টিকার দেওয়া যায়।` });
      return;
    }
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setStickers((list) => [...list, { id, url: URL.createObjectURL(blob), blob, x: 0.5, y: 0.5, w: 0.25, from: 0, to: 0 }]);
    setSelSticker(id);
  };

  const addEmoji = (emoji) => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.font = '200px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 128, 140);
    c.toBlob((b) => b && addStickerBlob(b), 'image/png');
  };

  const addImageSticker = (f) => {
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 1024 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => b && addStickerBlob(b), 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setNotice({ type: 'error', text: 'ছবিটি পড়া যায়নি।' });
    };
    img.src = url;
  };

  const updateSticker = (id, patch) =>
    setStickers((list) => list.map((st) => (st.id === id ? { ...st, ...patch } : st)));

  const removeSticker = (id) => {
    setStickers((list) => {
      const t = list.find((st) => st.id === id);
      if (t) URL.revokeObjectURL(t.url);
      return list.filter((st) => st.id !== id);
    });
    setSelSticker(null);
  };

  const onStickerDown = (id) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const st = stickers.find((x) => x.id === id);
    if (!st) return;
    setSelSticker(id);
    stickerDrag.current = { id, px: e.clientX, py: e.clientY, x: st.x, y: st.y };
  };
  const onStickerMove = (e) => {
    const d = stickerDrag.current;
    if (!d || !dispW || !dispH) return;
    const nx = Math.min(1, Math.max(0, d.x + (e.clientX - d.px) / dispW));
    const ny = Math.min(1, Math.max(0, d.y + (e.clientY - d.py) / dispH));
    updateSticker(d.id, { x: nx, y: ny });
  };
  const onStickerUp = () => {
    stickerDrag.current = null;
  };
  const selected = stickers.find((st) => st.id === selSticker) || null;

  // কোনো ওভারলে (টেক্সট/স্টিকার) এখন দেখানোর সময় কিনা
  const inWindow = (a, b) => (!a && !b) || (currentTime >= a && (!b || currentTime <= b));

  // ---- Cut: মাঝখানের অংশ বাদ দেওয়া ----
  const addCut = () => {
    if (cutFrom == null || cutTo == null) return;
    const a = Math.max(Math.min(cutFrom, cutTo), start);
    const b = Math.min(Math.max(cutFrom, cutTo), end);
    if (b - a < 0.1) {
      setNotice({ type: 'error', text: 'কাটার অংশ Trim-এর ভেতরে অন্তত ০.১ সেকেন্ড হতে হবে।' });
      return;
    }
    const all = [...cuts, [a, b]].sort((x, y) => x[0] - y[0]);
    const merged = [];
    all.forEach((c) => {
      if (merged.length && c[0] <= merged[merged.length - 1][1]) {
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], c[1]);
      } else {
        merged.push([c[0], c[1]]);
      }
    });
    setCuts(merged);
    setCutFrom(null);
    setCutTo(null);
  };
  const cutTotal = cuts.reduce((acc, c) => acc + Math.max(0, Math.min(c[1], end) - Math.max(c[0], start)), 0);
  const resultLength = Math.max(0, end - start - cutTotal) / speed;

  const changed = {
    trim: duration > 0 && (start > 0.05 || end < duration - 0.05),
    resize: aspect !== 'original' || rotate !== 0 || resolution !== 'original',
    speed: speed !== 1,
    audio: mute || volume !== 100,
    text: !!text.trim(),
    filter: preset !== 'none' || brightness !== 0 || contrast !== 0 || saturation !== 0,
    fade: fadeIn > 0 || fadeOut > 0,
    cover: false,
    music: !!musicFile,
    cut: cuts.length > 0,
    effect: effect !== 'none' || flip !== 'none' || reverse,
    export: outputFormat !== 'mp4',
    sticker: stickers.length > 0,
  };

  // ---- রুলারের দাগ ----
  const labelStep = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600].find((st) => st * pps >= 60) || 600;
  const ticks = [];
  if (duration) {
    const minor = pps >= 20 ? 1 : labelStep;
    for (let t = 0; t <= duration + 0.001; t += minor) {
      ticks.push({ t, major: Math.abs(t / labelStep - Math.round(t / labelStep)) < 1e-6 });
    }
  }

  return (
    <div className="relative h-[100dvh] flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      `}</style>
      <h1 className="sr-only">Edit Video Manually</h1>
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleBrowse} />
      <input
        ref={musicInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) setMusicFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={stickerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) addImageSticker(f);
          e.target.value = '';
        }}
      />
      {musicUrl && <audio ref={audioRef} src={musicUrl} preload="auto" />}

      {/* উপরের বার */}
      <header className="relative flex items-center justify-between gap-3 px-3 h-14 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push('/editor')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-800 transition"
          aria-label="Close editor"
        >
          <Icon d="M6 6l12 12M18 6L6 18" />
        </button>
        {file && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:border-slate-500 text-[11px] font-bold transition"
          >
            Change video
          </button>
        )}
        <button
          type="button"
          onClick={handleExport}
          disabled={!file || !duration || processing}
          className="min-w-[88px] px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-black transition active:scale-95"
        >
          {progress !== null && progress < 100 ? `${progress}%` : outputFormat === 'mp4' ? 'Export' : `Export ${outputFormat.toUpperCase()}`}
        </button>
        {progress !== null && (
          <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-slate-900">
            <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      {notice && (
        <button
          type="button"
          onClick={() => setNotice(null)}
          className={`absolute z-30 left-1/2 -translate-x-1/2 top-16 max-w-[92%] px-4 py-2.5 rounded-xl text-[11px] font-bold shadow-xl ${
            notice.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-slate-950'
          }`}
        >
          {notice.text}
        </button>
      )}

      {!file ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-800 hover:border-sky-500/60 p-10 text-center transition-colors"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Icon d="M12 4v12m0-12 4 4m-4-4-4 4M4 20h16" className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-white mb-1">Choose a video to edit</p>
            <p className="text-[11px] text-slate-500">MP4, MOV, WebM, MKV and more</p>
          </button>
        </div>
      ) : (
        <>
          {/* প্রিভিউ */}
          <div
            ref={previewRef}
            onClick={togglePlay}
            className="flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden"
          >
            <div className="relative" style={{ width: dispW || 1, height: dispH || 1 }}>
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                preload="auto"
                onLoadedMetadata={onMeta}
                onPlay={() => {
                  setIsPlaying(true);
                  const a = audioRef.current;
                  const v = videoRef.current;
                  if (a && v && musicUrl) {
                    try {
                      a.currentTime = Math.max(0, (v.currentTime - startRef.current) / speed);
                    } catch (_) {}
                    a.play().catch(() => {});
                  }
                }}
                onPause={() => {
                  setIsPlaying(false);
                  if (audioRef.current) audioRef.current.pause();
                }}
                onEnded={() => setIsPlaying(false)}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: vw * s || 1,
                  height: vh * s || 1,
                  transform: `translate(-50%, -50%) scale(${flip === 'h' || flip === 'both' ? -1 : 1}, ${flip === 'v' || flip === 'both' ? -1 : 1}) rotate(${rotate}deg)`,
                  filter: cssFilter,
                }}
              />
              {text.trim() && s > 0 && inWindow(textFrom, textTo) && (
                <div
                  className={`absolute inset-0 flex justify-center text-center pointer-events-none ${
                    textPosition === 'top' ? 'items-start' : textPosition === 'center' ? 'items-center' : 'items-end'
                  }`}
                  style={{ padding: '5%' }}
                >
                  <span
                    className="font-bold leading-tight"
                    style={{
                      color: textColor,
                      fontSize: textSize * s,
                      whiteSpace: 'pre-wrap',
                      textShadow: textBg ? 'none' : '0 1px 4px rgba(0,0,0,.7)',
                      ...(textBg ? { background: 'rgba(0,0,0,.6)', padding: '0.4em', borderRadius: '0.3em' } : {}),
                    }}
                  >
                    {text}
                  </span>
                </div>
              )}
              {stickers.map((st) => (
                <img
                  key={st.id}
                  src={st.url}
                  alt=""
                  draggable={false}
                  onPointerDown={onStickerDown(st.id)}
                  onPointerMove={onStickerMove}
                  onPointerUp={onStickerUp}
                  onPointerCancel={onStickerUp}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute cursor-move ${selSticker === st.id ? 'outline outline-2 outline-sky-400 outline-offset-2' : ''}`}
                  style={{
                    left: `${st.x * 100}%`,
                    top: `${st.y * 100}%`,
                    width: `${st.w * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none',
                    opacity: inWindow(st.from, st.to) ? 1 : selSticker === st.id ? 0.3 : 0,
                    pointerEvents: inWindow(st.from, st.to) || selSticker === st.id ? 'auto' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* প্লে কন্ট্রোল */}
          <div className="flex items-center justify-between gap-2 px-3 h-14 flex-shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => seekTo(start)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-800 transition"
                aria-label="Go to start"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 5h2v14H6zM20 5v14L9 12z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center active:scale-95 transition"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs font-bold tabular-nums text-slate-300">
              {fmt(currentTime)} <span className="text-slate-600">/</span> {fmt(duration)}
            </p>
            <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => stepHistory(-1)}
              disabled={!canUndo}
              className="w-9 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-transparent transition"
              aria-label="Undo"
            >
              <Icon d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
            </button>
            <button
              type="button"
              onClick={() => stepHistory(1)}
              disabled={!canRedo}
              className="w-9 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-transparent transition"
              aria-label="Redo"
            >
              <Icon d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />
            </button>
            <button
              type="button"
              onClick={goFullscreen}
              className="w-9 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-800 transition"
              aria-label="Fullscreen preview"
            >
              <Icon d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </button>
            </div>
          </div>

          {/* টাইমলাইন */}
          <div className="relative flex-shrink-0 border-t border-slate-900 bg-slate-900/40" style={{ height: 112 }}>
            <div ref={tlRef} onScroll={onTimelineScroll} className="no-scrollbar h-full overflow-x-auto overflow-y-hidden">
              <div className="flex h-full" style={{ width: stripW + tlW }}>
                <div className="flex-shrink-0" style={{ width: tlW / 2 }} />
                <div className="relative flex-shrink-0 pt-1" style={{ width: stripW }}>
                  {/* রুলার */}
                  <div className="relative h-6">
                    {ticks.map((tk) => (
                      <div key={tk.t} className="absolute top-0" style={{ left: tk.t * pps }}>
                        <div className={`w-px ${tk.major ? 'h-2.5 bg-slate-500' : 'h-1.5 bg-slate-700'}`} />
                        {tk.major && (
                          <span className="absolute top-3 left-1 text-[10px] text-slate-500 whitespace-nowrap">
                            {fmt(tk.t).replace(/\.0$/, '')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ফ্রেমের স্ট্রিপ */}
                  <div className="relative mt-1" style={{ height: 56 }}>
                    <div className="absolute inset-0 flex overflow-hidden rounded-md bg-slate-800">
                      {Array.from({ length: tileCount }).map((_, i) => (
                        <div key={i} className="h-full flex-shrink-0 bg-slate-800" style={{ width: stripW / tileCount }}>
                          {thumbs[i] && <img src={thumbs[i]} alt="" draggable={false} className="w-full h-full object-cover" />}
                        </div>
                      ))}
                    </div>

                    {/* ট্রিমের বাইরের অংশ ঝাপসা */}
                    <div className="absolute left-0 top-0 bottom-0 bg-black/65 pointer-events-none" style={{ width: start * pps }} />
                    <div className="absolute top-0 bottom-0 bg-black/65 pointer-events-none" style={{ left: end * pps, right: 0 }} />
                    {cuts.map((c, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 bg-red-500/45 border-x border-red-300 pointer-events-none"
                        style={{ left: c[0] * pps, width: Math.max(1, (c[1] - c[0]) * pps) }}
                      />
                    ))}
                    {cutFrom != null && cutTo != null && (
                      <div
                        className="absolute top-0 bottom-0 border-2 border-dashed border-amber-300 pointer-events-none"
                        style={{ left: Math.min(cutFrom, cutTo) * pps, width: Math.abs(cutTo - cutFrom) * pps }}
                      />
                    )}
                    <div
                      className="absolute top-0 bottom-0 border-y-2 border-sky-400 pointer-events-none"
                      style={{ left: start * pps, width: Math.max(0, (end - start) * pps) }}
                    />

                    {/* হ্যান্ডেল */}
                    <div
                      onPointerDown={startDrag('start')}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className="absolute top-0 bottom-0 flex justify-end cursor-ew-resize z-10"
                      style={{ left: start * pps - 22, width: 22, touchAction: 'none' }}
                      aria-label="Trim start"
                    >
                      <div className="w-3 h-full rounded-l-md bg-sky-400 flex items-center justify-center">
                        <div className="w-0.5 h-4 rounded bg-slate-950/70" />
                      </div>
                    </div>
                    <div
                      onPointerDown={startDrag('end')}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className="absolute top-0 bottom-0 flex justify-start cursor-ew-resize z-10"
                      style={{ left: end * pps, width: 22, touchAction: 'none' }}
                      aria-label="Trim end"
                    >
                      <div className="w-3 h-full rounded-r-md bg-sky-400 flex items-center justify-center">
                        <div className="w-0.5 h-4 rounded bg-slate-950/70" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0" style={{ width: tlW / 2 }} />
              </div>
            </div>

            {/* মাঝের স্থির প্লেহেড */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -ml-px bg-sky-300 pointer-events-none z-20">
              <div className="absolute -top-0 -left-1 w-2.5 h-2.5 rounded-full bg-sky-300" />
            </div>
          </div>

          {/* টুল প্যানেল */}
          {activeTool && (
            <div className="flex-shrink-0 max-h-[38vh] overflow-y-auto border-t border-slate-900 bg-slate-900 px-4 py-4">
              {activeTool === 'trim' && (
                <div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Start</p>
                      <p className="text-sm font-bold tabular-nums">{fmt(start)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">End</p>
                      <p className="text-sm font-bold tabular-nums">{fmt(end)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Length</p>
                      <p className="text-sm font-bold tabular-nums">{fmt(Math.max(0, end - start))}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Chip onClick={() => currentTime < end - 0.2 && setStart(currentTime)}>Set start here</Chip>
                    <Chip onClick={() => currentTime > start + 0.2 && setEnd(currentTime)}>Set end here</Chip>
                    <Chip
                      onClick={() => {
                        setStart(0);
                        setEnd(duration);
                      }}
                    >
                      Reset
                    </Chip>
                  </div>
                  <p className="text-[11px] text-slate-500 text-center mt-3">
                    টাইমলাইনের নীল হ্যান্ডেল টেনেও শুরু ও শেষ ঠিক করা যায়।
                  </p>
                </div>
              )}

              {activeTool === 'cut' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">From</p>
                      <p className="text-sm font-bold tabular-nums">{cutFrom == null ? '--' : fmt(cutFrom)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">To</p>
                      <p className="text-sm font-bold tabular-nums">{cutTo == null ? '--' : fmt(cutTo)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Result length</p>
                      <p className="text-sm font-bold tabular-nums">{fmt(resultLength)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Chip onClick={() => setCutFrom(currentTime)}>Set from here</Chip>
                    <Chip onClick={() => setCutTo(currentTime)}>Set to here</Chip>
                    <Chip active={cutFrom != null && cutTo != null} onClick={addCut}>
                      Cut out this part
                    </Chip>
                  </div>
                  {cuts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400">Removed parts</p>
                      {cuts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                          <span className="text-xs tabular-nums text-slate-200">
                            {fmt(c[0])} to {fmt(c[1])}
                          </span>
                          <Chip onClick={() => setCuts((l) => l.filter((_, k) => k !== i))}>Restore</Chip>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    টাইমলাইনে লাল অংশ বাদ যাবে। প্লে করলে ওই অংশ লাফ দিয়ে পার হয়, এক্সপোর্টেও থাকবে না।
                  </p>
                </div>
              )}

              {activeTool === 'effect' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Effect</p>
                    <div className="flex flex-wrap gap-2">
                      {EFFECTS.map((e) => (
                        <Chip key={e.id} active={effect === e.id} onClick={() => setEffect(e.id)}>
                          {e.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  {effect !== 'none' && (
                    <Slider label="Intensity" value={effectAmount} min={0} max={100} step={5} unit="%" onChange={setEffectAmount} />
                  )}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Flip</p>
                    <div className="flex flex-wrap gap-2">
                      {FLIPS.map((f) => (
                        <Chip key={f.id} active={flip === f.id} onClick={() => setFlip(f.id)}>
                          {f.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Reverse</p>
                    <Chip active={reverse} onClick={() => setReverse((r) => !r)}>
                      {reverse ? 'Reversed' : 'Play backwards'}
                    </Chip>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    প্রিভিউতে শুধু Blur আর Flip দেখা যায়। বাকি ইফেক্ট ও Reverse এক্সপোর্টে কাজ করবে। Reverse সর্বোচ্চ ৬০ সেকেন্ডের ক্লিপে চলে।
                  </p>
                </div>
              )}

              {activeTool === 'export' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Export as</p>
                    <div className="flex flex-wrap gap-2">
                      {FORMATS.map((f) => (
                        <Chip key={f.id} active={outputFormat === f.id} onClick={() => setOutputFormat(f.id)}>
                          {f.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {outputFormat === 'mp4' && 'ভিডিও ও অডিওসহ সাধারণ MP4।'}
                    {outputFormat === 'gif' && 'অডিও ছাড়া চলমান ছবি, সর্বোচ্চ ৩০ সেকেন্ড, চওড়া সর্বোচ্চ ৪৮০ পিক্সেল।'}
                    {outputFormat === 'mp3' && 'শুধু অডিও। ভিডিও বা মিউজিকে অডিও থাকতে হবে, আর অডিও মিউট করা থাকলে চলবে না।'}
                  </p>
                  <p className="text-[11px] text-slate-500">ওপরের Export বাটন চাপলে এই ফরম্যাটে ডাউনলোড হবে।</p>
                </div>
              )}

              {activeTool === 'resize' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Aspect ratio</p>
                    <div className="flex flex-wrap gap-2">
                      {ASPECTS.map((a) => (
                        <Chip key={a.id} active={aspect === a.id} onClick={() => setAspect(a.id)}>
                          {a.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  {aspect !== 'original' && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 mb-2">Fit</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip active={fit === 'crop'} onClick={() => setFit('crop')}>
                          Crop to fill
                        </Chip>
                        <Chip active={fit === 'blur'} onClick={() => setFit('blur')}>
                          Blur background
                        </Chip>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Blur background-এ পুরো ভিডিও থাকে, বাকি জায়গা ঝাপসা ব্যাকগ্রাউন্ডে ভরে। প্রিভিউতে দেখা যায় না, এক্সপোর্টে কাজ করে।
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Resolution</p>
                    <div className="flex flex-wrap gap-2">
                      {RESOLUTIONS.map((r) => (
                        <Chip key={r.id} active={resolution === r.id} onClick={() => setResolution(r.id)}>
                          {r.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Rotate</p>
                    <Chip onClick={() => setRotate((r) => (r + 90) % 360)}>Rotate 90° (now {rotate}°)</Chip>
                  </div>
                </div>
              )}

              {activeTool === 'speed' && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-2">Playback speed</p>
                  <div className="flex flex-wrap gap-2">
                    {SPEEDS.map((sp) => (
                      <Chip key={sp} active={speed === sp} onClick={() => setSpeed(sp)}>
                        {sp}x
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'music' && (
                <div className="space-y-4">
                  {!musicFile ? (
                    <div className="text-center space-y-3">
                      <Chip onClick={() => musicInputRef.current?.click()}>Choose audio file</Chip>
                      <p className="text-[11px] text-slate-500">
                        MP3, WAV, M4A। নিজের বা ফ্রি-লাইসেন্সের অডিও ব্যবহার করুন। অডিও ভিডিওর শুরু থেকে বাজবে।
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-white truncate">{musicFile.name}</p>
                      <Slider label="Music volume" value={musicVolume} min={0} max={200} step={5} unit="%" onChange={setMusicVolume} />
                      <div className="flex flex-wrap gap-2">
                        <Chip active={musicLoop} onClick={() => setMusicLoop((l) => !l)}>
                          Loop to fill video
                        </Chip>
                        <Chip onClick={() => musicInputRef.current?.click()}>Change</Chip>
                        <Chip onClick={() => setMusicFile(null)}>Remove</Chip>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        আসল অডিওর ভলিউম ঠিক করতে Audio টুল ব্যবহার করুন। প্রিভিউতে ১০০%-এর বেশি শোনা যায় না, এক্সপোর্টে কাজ করবে।
                      </p>
                    </>
                  )}
                </div>
              )}

              {activeTool === 'sticker' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Emoji</p>
                    <div className="flex flex-wrap gap-2">
                      {EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => addEmoji(em)}
                          className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-sky-500/50 text-xl transition"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Chip onClick={() => stickerInputRef.current?.click()}>Add your own image</Chip>
                  {selected ? (
                    <div className="space-y-3">
                      <Slider
                        label="Size"
                        value={Math.round(selected.w * 100)}
                        min={5}
                        max={90}
                        step={1}
                        unit="%"
                        onChange={(v) => updateSticker(selected.id, { w: v / 100 })}
                      />
                      <TimingRow
                        from={selected.from}
                        to={selected.to}
                        onFromHere={() => updateSticker(selected.id, { from: currentTime })}
                        onToHere={() => updateSticker(selected.id, { to: currentTime })}
                        onAlways={() => updateSticker(selected.id, { from: 0, to: 0 })}
                      />
                      <Chip onClick={() => removeSticker(selected.id)}>Delete sticker</Chip>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      স্টিকার যোগ করে প্রিভিউতে আঙুল দিয়ে টেনে সরান। সাইজ বদলাতে স্টিকারে ট্যাপ করুন। সর্বোচ্চ {MAX_STICKERS}টি।
                    </p>
                  )}
                </div>
              )}

              {activeTool === 'filter' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-2">Preset</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p) => (
                        <Chip key={p.id} active={preset === p.id} onClick={() => setPreset(p.id)}>
                          {p.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <Slider label="Brightness" value={brightness} min={-100} max={100} step={5} onChange={setBrightness} />
                  <Slider label="Contrast" value={contrast} min={-100} max={100} step={5} onChange={setContrast} />
                  <Slider label="Saturation" value={saturation} min={-100} max={100} step={5} onChange={setSaturation} />
                  <Chip
                    onClick={() => {
                      setPreset('none');
                      setBrightness(0);
                      setContrast(0);
                      setSaturation(0);
                    }}
                  >
                    Reset filter
                  </Chip>
                  <p className="text-[11px] text-slate-500">প্রিভিউয়ের রঙ আন্দাজি, এক্সপোর্টে সামান্য আলাদা দেখাতে পারে।</p>
                </div>
              )}

              {activeTool === 'fade' && (
                <div className="space-y-4">
                  <Slider label="Fade in" value={fadeIn} min={0} max={3} step={0.5} unit="s" onChange={setFadeIn} />
                  <Slider label="Fade out" value={fadeOut} min={0} max={3} step={0.5} unit="s" onChange={setFadeOut} />
                  <p className="text-[11px] text-slate-500">
                    ভিডিও ও অডিও দুটোই ধীরে আসবে এবং ধীরে মিলিয়ে যাবে। প্রিভিউতে দেখা যায় না, এক্সপোর্টে কাজ করবে।
                  </p>
                </div>
              )}

              {activeTool === 'cover' && (
                <div className="space-y-3 text-center">
                  <p className="text-xs text-slate-300">
                    টাইমলাইনে পছন্দের ফ্রেমে গিয়ে নিচের বাটন চাপুন, ওই ফ্রেমটা ছবি (JPG) হয়ে ডাউনলোড হবে।
                  </p>
                  <Chip onClick={saveCover}>Save current frame as JPG</Chip>
                </div>
              )}

              {activeTool === 'audio' && (
                <div className="space-y-4">
                  <Chip active={mute} onClick={() => setMute((m) => !m)}>
                    {mute ? 'Muted' : 'Mute audio'}
                  </Chip>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={200}
                      step={5}
                      value={volume}
                      disabled={mute}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="flex-1 accent-sky-500 disabled:opacity-30"
                    />
                    <span className="text-xs font-bold text-slate-300 w-11 text-right tabular-nums">{volume}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">প্রিভিউয়ে ১০০%-এর বেশি শোনা যায় না, এক্সপোর্টে কাজ করবে।</p>
                </div>
              )}

              {activeTool === 'text' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 200))}
                    placeholder="Type a caption..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex gap-2">
                    {['top', 'center', 'bottom'].map((p) => (
                      <Chip key={p} active={textPosition === p} onClick={() => setTextPosition(p)}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Chip>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        style={{ background: c }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          textColor === c ? 'border-sky-400 scale-110' : 'border-slate-700'
                        }`}
                        aria-label={`Text color ${c}`}
                      />
                    ))}
                  </div>
                  <Slider label="Size" value={textSize} min={12} max={120} step={2} onChange={setTextSize} />
                  <Chip active={textBg} onClick={() => setTextBg((b) => !b)}>
                    Background box
                  </Chip>
                  <TimingRow
                    from={textFrom}
                    to={textTo}
                    onFromHere={() => setTextFrom(currentTime)}
                    onToHere={() => setTextTo(currentTime)}
                    onAlways={() => {
                      setTextFrom(0);
                      setTextTo(0);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* নিচের টুলবার */}
          <nav
            className="no-scrollbar flex-shrink-0 flex overflow-x-auto border-t border-slate-900 bg-slate-950"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {TOOLS.map((t) => {
              const on = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActiveTool(on ? null : t.id)}
                  className={`relative flex-1 min-w-[72px] flex flex-col items-center gap-1 py-3 transition-colors ${
                    on ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="relative">
                    <Icon d={t.d} className="w-6 h-6" />
                    {changed[t.id] && <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-sky-400" />}
                  </span>
                  <span className="text-[11px] font-semibold">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}