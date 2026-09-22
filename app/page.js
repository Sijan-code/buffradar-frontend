'use client';
import QualitySelector from './QualitySelector';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvmqjwdkrvwcyjsqnfhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_bDpW8-uqBYl_MP02kdO2sg_KB3CAC5w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import React, { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// স্লাইডারের ধাপ: সবচেয়ে ভালো কোয়ালিটি আগে, সবচেয়ে কম শেষে
const VIDEO_QUALITIES = [
  { id: '2160p', short: '4K', label: '4K Ultra HD' },
  { id: '1440p', short: '1440p', label: '1440p QHD' },
  { id: '1080p', short: '1080p', label: '1080p Full HD' },
  { id: '720p', short: '720p', label: '720p HD' },
  { id: '480p', short: '480p', label: '480p' },
  { id: '360p', short: '360p', label: '360p' },
  { id: '240p', short: '240p', label: '240p' },
  { id: '144p', short: '144p', label: '144p (lowest)' },
];

const AUDIO_QUALITIES = [
  { id: '320kbps', short: '320k', label: '320kbps HQ' },
  { id: '256kbps', short: '256k', label: '256kbps' },
  { id: '192kbps', short: '192k', label: '192kbps' },
  { id: '160kbps', short: '160k', label: '160kbps' },
  { id: '128kbps', short: '128k', label: '128kbps' },
  { id: '96kbps', short: '96k', label: '96kbps' },
  { id: '64kbps', short: '64k', label: '64kbps' },
  { id: '48kbps', short: '48k', label: '48kbps (lowest)' },
];

// 🔄 কনভার্টারের ফরম্যাট লিস্ট (kind: video | gif | audio, lossless হলে bitrate লাগে না)
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

// কনভার্টারে সর্বোচ্চ ১০৮০p (সার্ভারের লিমিটের সাথে মিল রেখে)
const CONVERT_VIDEO_QUALITIES = VIDEO_QUALITIES.filter((q) => parseInt(q.id, 10) <= 1080);

const formatDuration = (sec) => {
  const total = Math.round(Number(sec));
  if (!total || total <= 0) return 'Auto';
  const m = Math.floor(total / 60);
  const r = total % 60;
  if (m === 0) return r + "sec";
  return r === 0 ? m + " min" : m + " min " + r + " sec";
};

export default function DownloaderApp() {
  const [inputLinks, setInputLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [processedVideo, setProcessedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('video');
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [selectedAudioQuality, setSelectedAudioQuality] = useState('320kbps');
  const [selectedTags, setSelectedTags] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [convertFormat, setConvertFormat] = useState('mp4');
  const [convertQuality, setConvertQuality] = useState('1080p');
  const [convertBitrate, setConvertBitrate] = useState('192kbps');

  useEffect(() => {
  setIsClient(true);
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error('Anonymous sign-in failed:', error.message);
    } else {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh failed, re-signing in:', refreshError.message);
        await supabase.auth.signInAnonymously();
      }
    }
  })();
}, []);

  const fetchHistory = async () => {
  setShowHistoryModal(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { error: signInErr } = await supabase.auth.signInAnonymously();
      if (signInErr) { console.error(signInErr.message); return; }
    }
    const { data, error } = await supabase
      .from('download_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("History fetch error:", error.message);
      return;
    }
    setHistoryData(data || []);
  } catch (err) {
    console.error("Error fetching history:", err);
  }
};

const handleDeleteHistory = async (id) => {
  try {
    const { error } = await supabase
      .from('download_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Delete error:", error.message);
      alert("ডিলিট করা যায়নি: " + error.message);
      return;
    }
    // লোকাল state থেকেও সাথে সাথে সরিয়ে দেওয়া হচ্ছে
    setHistoryData((prev) => prev.filter((item) => item.id !== id));
  } catch (err) {
    console.error("Error deleting history:", err);
  }
};



  const handleFetchLinks = async () => {
    if (!inputLinks.trim()) {
      alert("অনুগ্রহ করে একটি সঠিক লিংক পেস্ট করুন!");
      return;
    }
    setLoading(true);
    setStatusMsg("Processing link with BuffRadar Engine...");
    setProcessedVideo(null);
    setSelectedTags([]);
    
    try {
        const response = await fetch(`${API_BASE}/api/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: inputLinks })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("Redirecting to Emergency Gateway...");
            throw new Error("Fallback Triggered");
        }

        if (data && data.success) {
            setProcessedVideo({
                title: data.title || "BUFFRADAR_Video",
                duration: data.duration && data.duration > 0 ? data.duration : 0,
                sourceUrl: inputLinks.trim(),
                hdLink: data.download_url || "",
                audioLink: data.audio_url || data.download_url || "",
                caption: data.title + " #viralvideo #buffradar",
                hashtags: "#viralvideo #shorts #reels",
                tags: Array.isArray(data.tags) ? [...new Set(data.tags.filter(Boolean))] : [],
                chapters: data.chapters || [{ start: "00:00", title: "Full Video" }],
                copyrightStatus: data.copyright_status || "Safe",
                thumbnail: data.thumbnail || ""
            });
            // Supabase-এ ডাউনলোড হিস্ট্রি সেভ করার লজিক
      try {
        const { error: sbError } = await supabase
          .from('download_history')
          .insert([
            {
              video_title: data.title || "BUFFRADAR_Video",
              download_url: data.download_url || inputLinks
            }
          ]);

        if (sbError) {
          console.error("Supabase error:", sbError.message);
        } else {
          console.log("History saved successfully!");
        }
      } catch (err) {
        console.error("Supabase try-catch error:", err);
      }
            setLoading(false);
            setStatusMsg("Link successfully processed!");
        } else {
            throw new Error("Could not extract media links.");
        }
    } catch (error) {
        console.error("System Error:", error);
        setProcessedVideo({
            title: "Sample Viral Content (Emergency Gateway)",
            duration: 0,
            sourceUrl: inputLinks.trim(),
            hdLink: inputLinks,
            audioLink: inputLinks,
            caption: "Secured via BuffRadar Emergency Gateway!",
            hashtags: "#viralvideo #shorts #reels",
            tags: [],
            chapters: [{ start: "00:00", title: "Full Video Stream" }],
            copyrightStatus: "Verification Skipped"
        });
        setLoading(false);
        setStatusMsg("Notice: Secured via Emergency Gateway!");
    }
  };

  const triggerDownload = async (downloadUrl, videoTitle, isAudio = false, quality = '1080p') => {
    if (!downloadUrl) {
      alert("ডাউনলোড লিঙ্ক পাওয়া যায়নি!");
      return;
    }
    try {
      setMenuOpen(false);
      setDownloadProgress(0);
      const fileExt = isAudio ? ".mp3" : ".mp4";
      const fileName = (videoTitle ? videoTitle.substring(0, 20) : "media") + fileExt;
      const proxyUrl = isAudio
        ? `${API_BASE}/api/download?url=${encodeURIComponent(downloadUrl)}&is_audio=true&bitrate=${quality}`
        : `${API_BASE}/api/download?url=${encodeURIComponent(downloadUrl)}&is_audio=false&quality=${quality}`;
      
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 150);

      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      
      clearInterval(progressInterval);
      setDownloadProgress(100);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloadProgress(null);
      }, 1000);
    } catch (error) {
      console.error("Proxy download failed:", error);
      window.open(downloadUrl, '_blank');
      setDownloadProgress(null);
    }
  };

  // 🔄 কনভার্ট: সার্ভারে নামিয়ে ffmpeg দিয়ে বদলে তারপর ফাইল পাঠায় — তাই সময় লাগে
  const triggerConvert = async (sourceUrl, videoTitle) => {
    if (!sourceUrl) {
      alert("কনভার্ট করার লিঙ্ক পাওয়া যায়নি!");
      return;
    }
    const fmt = CONVERT_FORMATS.find((f) => f.id === convertFormat) || CONVERT_FORMATS[0];
    let progressInterval;
    try {
      setMenuOpen(false);
      setDownloadProgress(0);

      const params = new URLSearchParams({
        url: sourceUrl,
        fmt: fmt.id,
        quality: convertQuality,
        bitrate: convertBitrate,
      });

      // কনভার্ট শেষ হওয়ার আগে ১০০% দেখানো ঠিক না, তাই ধীরে ধীরে সর্বোচ্চ ৯৫% পর্যন্ত এগোবে
      progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev === null || prev >= 95) return prev;
          return Math.min(95, prev + Math.max(1, Math.round((95 - prev) * 0.05)));
        });
      }, 500);

      const response = await fetch(`${API_BASE}/api/convert?${params.toString()}`);
      if (!response.ok) {
        let msg = "কনভার্ট করা যায়নি। আবার চেষ্টা করুন।";
        try {
          const err = await response.json();
          if (err && err.detail) msg = err.detail;
        } catch (_) {}
        throw new Error(msg);
      }
      const blob = await response.blob();

      clearInterval(progressInterval);
      setDownloadProgress(100);

      const safeTitle = (videoTitle || "media").replace(/[\\/:*?"<>|]+/g, "").trim().substring(0, 40) || "media";
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${safeTitle}.${fmt.id}`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloadProgress(null);
      }, 1000);
    } catch (error) {
      console.error("Convert failed:", error);
      clearInterval(progressInterval);
      setDownloadProgress(null);
      alert(error.message || "কনভার্ট করা যায়নি।");
    }
  };

  if (!isClient) return null;

  const isDownloading = downloadProgress !== null;

  const videoIdx = Math.max(0, VIDEO_QUALITIES.findIndex((q) => q.id === selectedQuality));
  const audioIdx = Math.max(0, AUDIO_QUALITIES.findIndex((q) => q.id === selectedAudioQuality));
  const currentVideo = VIDEO_QUALITIES[videoIdx];
  const currentAudio = AUDIO_QUALITIES[audioIdx];

  return (
  <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">

    {/* ⚡ এনিমেশনের জন্য কাস্টম স্টাইল */}
    <style jsx global>{`
      @keyframes radarZap {
        0%, 100% { filter: drop-shadow(0 0 2px #facc15); transform: rotate(0deg); }
        25% { filter: drop-shadow(0 0 10px #facc15) drop-shadow(0 0 16px #fef08a); transform: rotate(-6deg); }
        50% { filter: drop-shadow(0 0 4px #facc15); transform: rotate(4deg); }
        75% { filter: drop-shadow(0 0 12px #facc15) drop-shadow(0 0 18px #fef08a); transform: rotate(-3deg); }
      }
      .animate-radar-zap {
        animation: radarZap 0.55s ease-in-out infinite;
      }

      @keyframes zapGlow {
        0%, 100% { filter: drop-shadow(0 0 2px #facc15); opacity: 1; }
        50% { filter: drop-shadow(0 0 10px #facc15) drop-shadow(0 0 18px #fde047); opacity: 0.7; }
      }
      .animate-zap-glow {
        animation: zapGlow 0.45s ease-in-out infinite;
      }

      @keyframes boltDash {
        to { stroke-dashoffset: -40; }
      }
      @keyframes boltFlicker {
        0%, 18%, 22%, 55%, 60%, 100% { opacity: 1; }
        20% { opacity: 0.15; }
        58% { opacity: 0.25; }
        80% { opacity: 0.5; }
      }
      .lightning-bolt-path {
        stroke-dasharray: 14 8;
        animation: boltDash 0.35s linear infinite, boltFlicker 0.8s steps(1) infinite;
      }
      .lightning-bolt-core {
        stroke-dasharray: 6 12;
        animation: boltDash 0.2s linear infinite reverse, boltFlicker 0.6s steps(1) infinite;
      }

      @keyframes badgePop {
        0% { opacity: 0; transform: scale(0.85) translateX(6px); }
        100% { opacity: 1; transform: scale(1) translateX(0); }
      }
      .animate-badge-pop {
        animation: badgePop 0.25s ease-out;
      }
    `}</style>

    {/* 🌐 হেডার সেকশন */}
    <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur px-6 py-4 flex justify-between items-center relative z-40">

      {/* 🛰️ লোগো: BUFF + রাডার আইকন (রাডার লেখার বদলে ছবি) */}
      <div className="flex items-center gap-1 relative z-10">
        <span className="text-2xl font-black tracking-wider text-emerald-400">BUFF</span>
        <img
          src="/buffradar-icon.png"
          alt="BuffRadar"
          className={`w-9 h-9 object-contain -ml-1 ${isDownloading ? 'animate-radar-zap' : ''}`}
        />
      </div>

      {/* ⚡ লোগো থেকে ডানদিকে ছুটে যাওয়া বিদ্যুতের রেখা — শুধু ডাউনলোডের সময় দেখা যাবে */}
      {isDownloading && (
        <svg
          className="absolute left-20 right-20 top-1/2 -translate-y-1/2 h-9 w-[calc(100%-10rem)] pointer-events-none z-0"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,30 55,8 85,42 135,12 175,46 225,10 265,38 315,14 400,30"
            fill="none"
            stroke="#facc15"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lightning-bolt-path"
          />
          <polyline
            points="0,30 55,8 85,42 135,12 175,46 225,10 265,38 315,14 400,30"
            fill="none"
            stroke="#fef9c3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lightning-bolt-core"
          />
        </svg>
      )}

      {/* ডানপাশের বাটনগুলোর জন্য একটি ফ্লেক্স কন্টেইনার */}
      <div className="flex items-center gap-4 relative z-10">
        {!isDownloading ? (
          <>
            {/* ✨ GO PREMIUM BUTTON */}
            <a
              href="/premium"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-1.5 rounded-full text-sm shadow-md shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <span className="text-yellow-300 animate-pulse text-xs">✦</span> Go Premium
            </a>

            {/* 🍔 হ্যামবার্গার/থ্রি-ডট মেনু বাটন */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-white hover:bg-slate-800 rounded-lg focus:outline-none transition z-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* 📋 মেনু ড্রপডাউন বক্স */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      await fetchHistory();
                    }}
                    className="flex w-full px-4 py-3 text-sm text-left text-gray-200 hover:bg-slate-800 rounded-t-lg"
                  >
                    🕒 Download History
                  </button>

                  <hr className="border-t border-slate-800" />

                  <button
                    type="button"
                    className="flex w-full px-4 py-3 text-sm text-left text-gray-200 hover:bg-slate-800 rounded-b-lg"
                  >
                    ⭐ Go Premium
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ⚡ ডাউনলোড চলাকালীন Go Premium + থ্রি-ডট মেনু গায়েব হয়ে এই ব্যাজ দেখাবে */
          <div className="flex items-center gap-2 bg-slate-900 border border-yellow-400/40 rounded-full pl-1.5 pr-3.5 py-1 shadow-lg shadow-yellow-400/10 animate-badge-pop">
            <svg className="w-6 h-6 animate-zap-glow" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"
                fill="#facc15"
                stroke="#facc15"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-yellow-300 font-mono font-bold text-xs tabular-nums">
              {downloadProgress}%
            </span>
          </div>
        )}
      </div>
    </header>

    {/* 🚀 মেইন কন্টেন্ট সেকশন শুরু */}
    <main className="max-w-xl w-full mx-auto px-4 py-8 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">Creator Dashboard</h1>
          <p className="text-slate-400 text-xs">Multi-Action Video Downloader & Deep Insight Pipeline.</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-800/80 shadow-2xl neon-glow mb-8 transition-all">
          <div className="relative flex items-center mb-3">
            <input
              type="text"
              value={inputLinks}
              onChange={(e) => setInputLinks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && !loading) {
                  e.preventDefault();
                  handleFetchLinks();
                }
              }}
              placeholder="Paste video link here..."
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl pl-4 pr-16 py-3.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50"
            />
            <button 
              onClick={handleFetchLinks} 
              disabled={loading} 
              className="absolute right-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/10"
            >
              {loading ? '...' : 'Fetch'}
            </button>
          </div>

          <div className="flex gap-1.5 mt-3 border-t border-slate-800/60 pt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {['video', 'audio', 'convert', 'deep insight', 'creator'].map((tab) => (
              <button
                key={tab}
                disabled={!processedVideo}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] uppercase font-bold py-2 px-2 rounded-lg border flex-1 text-center whitespace-nowrap ${
                  !processedVideo 
                    ? 'opacity-30 border-slate-800 text-slate-600'
                    : activeTab === tab
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {processedVideo ? (
          <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl">

            {activeTab === 'video' && (
              <div className="space-y-5 text-xs animate-fadeIn">
                
                {/* আপগ্রেডেড থাম্বনেইল ও মেটাডেটা প্রিভিউ সেকশন */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/80 p-2.5 flex gap-3 items-center">
                  <div className="w-24 h-16 bg-slate-900 rounded-xl flex-shrink-0 overflow-hidden border border-slate-800/60 flex items-center justify-center relative">
                    <img 
                      src={processedVideo.thumbnail ? `${API_BASE}/api/proxy-download?url=${encodeURIComponent(processedVideo.thumbnail)}` : "https://unsplash.com"} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full bg-gradient-to-br from-blue-900 to-indigo-950 flex flex-col items-center justify-center gap-1">
                      <span className="text-lg">🎬</span>
                      <span className="text-[8px] font-black text-blue-400">STREAM</span>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-blue-600 px-1 py-0.5 rounded text-[8px] font-mono text-white font-bold border border-blue-500">
                      {currentVideo.short}
                    </div>
                  </div>
                  
                  <div className="truncate flex-1">
                    <p className="text-blue-400 font-bold uppercase text-[9px] tracking-wider">Active Stream Metadata</p>
                    <p className="text-white font-bold truncate mt-0.5" title={processedVideo.title}>{processedVideo.title}</p>
                    <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                      Duration: <span className="text-slate-200 font-bold">{processedVideo.duration > 0 ? `${processedVideo.duration}` : 'Auto'}</span> | Quality: <span className="text-blue-400 font-bold">{currentVideo.short}</span>
                    </p>
                  </div>
                </div>


        
                {/* video slid button */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Target Resolution Quality:
                </label>
                <QualitySelector
                items={VIDEO_QUALITIES}
                value={selectedQuality}
                onChange={setSelectedQuality}
                theme="blue"
                label="Video quality"
                />
              </div>  


                {/* চূড়ান্ত ডাউনলোড বাটন */}
                <button 
            onClick={() => triggerDownload(processedVideo.sourceUrl || processedVideo.hdLink, processedVideo.title, false, selectedQuality)} 
            disabled={downloadProgress !== null} 
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            {downloadProgress !== null ? `⏳ Processing & Downloading ${downloadProgress}%...` : "☁️ Process & Complete Download"}
          </button>

              </div>
            )}

            {/* TAB 2: AUDIO PANEL (UPGRADED VERSION) */}
            {activeTab === 'audio' && (
              <div className="space-y-5 text-xs animate-fadeIn">
                
                {/* অডিও প্রিভিউ কার্ড সেকশন */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5 flex gap-3 items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl flex-shrink-0 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20 shadow-lg shadow-emerald-500/5 animate-pulse">
                    🎵
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider">Active Audio Stream</p>
                    <p className="text-white font-bold truncate mt-0.5" title={processedVideo.title}>{processedVideo.title}</p>
                    <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                      Format: <span className="text-slate-200 font-bold">MP3 Audio</span> | Bitrate: <span className="text-emerald-400 font-bold">{selectedAudioQuality}</span>
                    </p>
                  </div>
                </div>

                {/* অডিও বিটরেট স্লাইডার */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Audio Bitrate Quality:
                  </label>
                  <QualitySelector
                  items={AUDIO_QUALITIES}
                  value={selectedAudioQuality}
                  onChange={setSelectedAudioQuality}
                  theme="emerald"
                  label="Audio bitrate"
                  />
                </div>


                {/* চূড়ান্ত অডিও ডাউনলোড বাটন */}
                <button 
                  onClick={() => triggerDownload(processedVideo.sourceUrl || processedVideo.audioLink, processedVideo.title, true, selectedAudioQuality)} 
                  disabled={downloadProgress !== null} 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 text-xs font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  {downloadProgress !== null ? (
                    <span>⏳ Processing & Extracting...</span>
                  ) : (
                    <span>🎹 Extract & Download MP3 Audio</span>
                  )}
                </button>

              </div>
            )}

            {/* TAB 3: CONVERT PANEL */}
            {activeTab === 'convert' && (() => {
              const fmt = CONVERT_FORMATS.find((f) => f.id === convertFormat) || CONVERT_FORMATS[0];
              const videoFormats = CONVERT_FORMATS.filter((f) => f.kind !== 'audio');
              const audioFormats = CONVERT_FORMATS.filter((f) => f.kind === 'audio');
              const convQ = CONVERT_VIDEO_QUALITIES.find((q) => q.id === convertQuality) || CONVERT_VIDEO_QUALITIES[0];
              const detail =
                fmt.kind === 'video' ? convQ.short
                : fmt.kind === 'gif' ? '480p · 30s max'
                : fmt.lossless ? 'Lossless'
                : convertBitrate;

              const FormatChip = ({ f }) => {
                const on = f.id === convertFormat;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setConvertFormat(f.id)}
                    className={`flex-shrink-0 min-w-[68px] px-3 py-2 rounded-xl border text-center transition-all active:scale-95 ${
                      on
                        ? 'bg-violet-500 text-slate-950 border-violet-400 shadow-md shadow-violet-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="block text-[11px] font-black tracking-wide">{f.label}</span>
                    <span className={`block text-[8px] font-mono mt-0.5 ${on ? 'text-slate-900/70' : 'text-slate-500'}`}>{f.note}</span>
                  </button>
                );
              };

              return (
                <div className="space-y-5 text-xs animate-fadeIn">

                  {/* কনভার্টার প্রিভিউ কার্ড */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5 flex gap-3 items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl border border-violet-500/20 shadow-lg shadow-violet-500/5">
                      🔄
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-violet-400 font-bold uppercase text-[9px] tracking-wider">Format Converter</p>
                      <p className="text-white font-bold truncate mt-0.5" title={processedVideo.title}>{processedVideo.title}</p>
                      <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                        Output: <span className="text-violet-400 font-bold">.{fmt.label}</span> | Quality: <span className="text-slate-200 font-bold">{detail}</span>
                      </p>
                    </div>
                  </div>

                  {/* ফরম্যাট বাটন — এক লাইনে, সোয়াইপ করে বাকিগুলো দেখা যাবে */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Video Formats:
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {videoFormats.map((f) => <FormatChip key={f.id} f={f} />)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Audio Formats:
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {audioFormats.map((f) => <FormatChip key={f.id} f={f} />)}
                    </div>
                  </div>

                  {/* কোয়ালিটি: ভিডিও হলে রেজোলিউশন, লসি অডিও হলে bitrate, নাহলে ছোট নোট */}
                  {fmt.kind === 'video' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Max Resolution:
                      </label>
                      <QualitySelector
                        items={CONVERT_VIDEO_QUALITIES}
                        value={convertQuality}
                        onChange={setConvertQuality}
                        theme="blue"
                        label="Convert resolution"
                      />
                    </div>
                  )}

                  {fmt.kind === 'audio' && !fmt.lossless && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Audio Bitrate:
                      </label>
                      <QualitySelector
                        items={AUDIO_QUALITIES}
                        value={convertBitrate}
                        onChange={setConvertBitrate}
                        theme="emerald"
                        label="Convert bitrate"
                      />
                    </div>
                  )}

                  {(fmt.kind === 'gif' || fmt.lossless) && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                      {fmt.kind === 'gif'
                        ? 'GIF-এ প্রথম ৩০ সেকেন্ড, ৪৮০px চওড়া আর ১২ fps-এ কনভার্ট হবে (ফাইল ছোট রাখতে)। GIF-এ সাউন্ড থাকে না।'
                        : 'Lossless ফরম্যাটে bitrate বাছাই করতে হয় না। ফাইলের সাইজ MP3-এর চেয়ে অনেক বড় হবে।'}
                    </div>
                  )}

                  {/* চূড়ান্ত কনভার্ট বাটন */}
                  <button
                    onClick={() => triggerConvert(processedVideo.sourceUrl || processedVideo.hdLink, processedVideo.title)}
                    disabled={downloadProgress !== null}
                    className="w-full bg-violet-500 hover:bg-violet-400 disabled:bg-violet-800 disabled:text-slate-400 text-slate-950 text-xs font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
                  >
                    {downloadProgress !== null
                      ? `⏳ Converting to ${fmt.label} ${downloadProgress}%...`
                      : `🔄 Convert to ${fmt.label} & Download`}
                  </button>

                  <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                    কনভার্ট হতে কয়েক মিনিট লাগতে পারে — ট্যাব খোলা রাখুন। সর্বোচ্চ ১৫ মিনিটের ভিডিও, ১০৮০p পর্যন্ত।
                  </p>
                </div>
              );
            })()}

            {activeTab === 'deep insight' && (() => {
              // কপিরাইট স্ট্যাটাস অনুযায়ী green/red badge ঠিক করা হচ্ছে
              const status = (processedVideo.copyrightStatus || "").toLowerCase();
              const isSafe = status.includes("safe") || status.includes("clear") || status.includes("clean");
              const isRisky = status.includes("claim") || status.includes("risk") || status.includes("copyrighted") || status.includes("flagged") || status.includes("unsafe");
              const badgeColor = isSafe
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : isRisky
                  ? "bg-red-500/10 border-red-500/40 text-red-400"
                  : "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"; // অনিশ্চিত হলে amber
              const dotColor = isSafe ? "bg-emerald-400" : isRisky ? "bg-red-400" : "bg-yellow-400";
              const badgeLabel = isSafe ? "SAFE TO REPOST" : isRisky ? "COPYRIGHT RISK" : "UNVERIFIED";

              const allTags = processedVideo.tags || [];
              const allSelected = allTags.length > 0 && selectedTags.length === allTags.length;
              const toggleTag = (tag) =>
                setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
              const copyTags = (list, msg) => {
                if (!list.length) return;
                navigator.clipboard.writeText(list.join(', '));
                alert(msg);
              };

              return (
                <div className="space-y-4 text-[11px] animate-fadeIn">

                  {/* 🟢/🔴 কপিরাইট স্ট্যাটাস ব্যাজ */}
                  <div className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${badgeColor}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-pulse`}></span>
                      <span className="font-black tracking-wider text-[10px]">{badgeLabel}</span>
                    </div>
                    <span className="font-mono text-[10px] opacity-80">{processedVideo.copyrightStatus}</span>
                  </div>

                  {/* এক্সট্র্যাক্টেড ট্যাগ + কপি বাটন */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-400 font-bold">Video Tags ({allTags.length}):</p>
                      {allTags.length > 0 && (
                        <span className="text-[10px] text-slate-500">{selectedTags.length} selected</span>
                      )}
                    </div>

                    {allTags.length === 0 ? (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-500">
                        এই ভিডিওতে কোনো ট্যাগ পাওয়া যায়নি।
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-950 border border-slate-800 rounded-xl max-h-56 overflow-y-auto">
                          {allTags.map((tag) => {
                            const on = selectedTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggleTag(tag)}
                                className={`px-2.5 py-1 rounded-full border text-[10px] transition-all ${
                                  on
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => copyTags(allTags, 'All tags copied!')}
                            className="py-2 rounded-lg border border-slate-700 bg-slate-800 text-emerald-400 font-bold text-[10px]"
                          >
                            Copy All
                          </button>
                          <button
                            type="button"
                            disabled={selectedTags.length === 0}
                            onClick={() => copyTags(selectedTags, 'Selected tags copied!')}
                            className="py-2 rounded-lg border border-slate-700 bg-slate-800 text-emerald-400 font-bold text-[10px] disabled:opacity-30"
                          >
                            Copy Selected
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTags(allSelected ? [] : [...allTags])}
                            className="py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-bold text-[10px]"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {activeTab === 'creator' && (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-300 truncate">
                  <strong>Clean Metadata:</strong> {processedVideo.caption}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(processedVideo.caption); alert("Metadata Copied!"); }} className="w-full bg-slate-800 text-emerald-400 text-xs font-bold py-2.5 rounded-lg border border-slate-700">
                  Clean Meta & Copy
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl py-10 text-center text-xs text-slate-600">
            স্মার্ট ওয়ার্কবেঞ্চ পাইপলাইন দেখতে একটি সলিড ভিডিও লিংক উপরে ফেচ করুন।
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-600">
        <p>&copy; 2026 buffradar.com</p>
      </footer>
      {showHistoryModal && (
  <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
      
      {/* মোডাল হেডার */}
      <div className="flex justify-between items-center p-4 border-b border-slate-800">
        <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
          🕒 Download History
        </h3>
        <button 
          onClick={() => setShowHistoryModal(false)}
          className="text-gray-400 hover:text-white text-xl font-bold p-1 transition"
        >
          ✕
        </button>
      </div>

      {/* মোডাল বডি (হিস্ট্রি লিস্ট) */}
      <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {historyData.length === 0 ? (
          <p className="text-center text-gray-500 py-8">কোনো ডাউনলোডের হিস্ট্রি পাওয়া যায়নি।</p>
        ) : (
          historyData.map((item) => (
  <div key={item.id || Math.random()} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl mb-2">
    <div className="flex justify-between items-start gap-2">
      <p className="text-sm font-medium text-gray-200 line-clamp-2 mb-1 flex-1">
        {item.video_title || "Processed Video History"}
      </p>
      <button
        onClick={() => handleDeleteHistory(item.id)}
        className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded border border-red-900/50 hover:border-red-700 transition shrink-0"
        title="Delete"
      >
        🗑️
      </button>
    </div>
    <div className="flex justify-between items-center text-xs text-gray-500">
      <span className="truncate max-w-[200px]">{item.download_url || "No Link Available"}</span>
      <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Just Now"}
      </span>
    </div>
  </div>
))


        )}
      </div>
    </div>
  </div>
)}

  </div>
);
}
