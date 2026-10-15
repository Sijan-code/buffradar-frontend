'use client';

import React, { useEffect, useState } from 'react';
import { supabase, authHeaders } from './supabaseClient';
import { onLimit } from './limitBus';
import { showRewardedAd } from './rewardedAd';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const KIND_LABEL = {
  download: 'ডাউনলোড',
  convert: 'কনভার্ট',
  edit_manual: 'ম্যানুয়াল এডিট',
  edit_ai: 'AI এডিট (Text to edit)',
};

function formatReset(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('bn-BD', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function LimitModal() {
  const [info, setInfo] = useState(null);
  const [usage, setUsage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState('');

  useEffect(
    () =>
      onLimit((i) => {
        setErr('');
        setDone('');
        setInfo(i);
      }),
    []
  );

  // মোডাল খুললে জানা দরকার বিজ্ঞাপন-ক্রেডিট চালু কিনা আর কত ক্রেডিট দেয়
  useEffect(() => {
    if (!info) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/usage`, { headers: await authHeaders() });
        const j = await r.json();
        if (alive) setUsage(j);
      } catch (_) {}
    })();
    return () => {
      alive = false;
    };
  }, [info]);

  useEffect(() => {
    if (!info) return;
    const onKey = (e) => e.key === 'Escape' && setInfo(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info]);

  if (!info) return null;

  const guest = info.tier !== 'member';
  const reset = formatReset(info.reset_at);
  const adsOn = !!(usage && usage.ads);
  const adCredits = (usage && usage.ad_credits) || 3;

  const signUp = async () => {
    setBusy(true);
    setErr('');
    try {
      const redirectTo = window.location.href;
      let { error } = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo } });
      if (error) {
        const r = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
        error = r.error;
      }
      if (error) setErr('Google সাইন-আপ এখনো চালু হয়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।');
    } catch (_) {
      setErr('সাইন-আপ শুরু করা যায়নি। আবার চেষ্টা করুন।');
    }
    setBusy(false);
  };

  // বিজ্ঞাপন দেখে ক্রেডিট: সার্ভার থেকে নম্বর নিন -> বিজ্ঞাপন দেখুন -> সার্ভারকে জানান
  const watchAd = async () => {
    setAdBusy(true);
    setErr('');
    try {
      const headers = await authHeaders({ 'Content-Type': 'application/json' });
      const s = await fetch(`${API_BASE}/api/ads/start`, { method: 'POST', headers });
      const sj = await s.json().catch(() => ({}));
      if (!s.ok) throw new Error(sj.detail || 'এখন বিজ্ঞাপন পাওয়া যাচ্ছে না।');
      const shown = await showRewardedAd({ minSeconds: sj.min_seconds });
      if (!shown) throw new Error('বিজ্ঞাপনটি পুরোটা দেখা হয়নি।');
      const c = await fetch(`${API_BASE}/api/ads/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nonce: sj.nonce }),
      });
      const cj = await c.json().catch(() => ({}));
      if (!c.ok) throw new Error(cj.detail || 'ক্রেডিট যোগ করা যায়নি।');
      setDone(`+${cj.credits} ক্রেডিট পেয়েছেন! এখন আপনার ${cj.balance} ক্রেডিট আছে। কাজটা আবার চেষ্টা করুন।`);
    } catch (e) {
      setErr(e.message || 'বিজ্ঞাপন চালানো যায়নি।');
    }
    setAdBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-5"
      onClick={() => setInfo(null)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <>
            <h2 className="text-lg font-black mb-3 text-emerald-400">ক্রেডিট যোগ হয়েছে</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">{done}</p>
            <button
              type="button"
              onClick={() => setInfo(null)}
              className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
            >
              ঠিক আছে
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-black mb-1">{guest ? 'আপনার ফ্রি ক্রেডিট শেষ' : 'আপনার ক্রেডিট শেষ'}</h2>
            <p className="text-[11px] text-slate-500 mb-4">
              {KIND_LABEL[info.kind] || 'এই কাজে'} {info.cost} ক্রেডিট লাগে। আপনার আছে {info.balance}/{info.budget}।
            </p>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {guest
                ? info.network
                  ? 'এই ইন্টারনেট সংযোগ থেকে অনেক ব্যবহার হয়েছে। Google দিয়ে সাইন-আপ করলে আপনার নিজের ক্রেডিট পাবেন।'
                  : `Google দিয়ে সাইন-আপ করে ৩ গুণ ক্রেডিট (${(info.budget || 8) * 3}) পান।`
                : 'কাজ চালিয়ে যেতে বিজ্ঞাপন দেখে ক্রেডিট নিন, অথবা Premium নিন।'}
              {reset && <span className="block text-xs text-slate-500 mt-2">কিছু ক্রেডিট ফিরবে: {reset}</span>}
            </p>

            {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

            <div className="flex flex-col gap-2">
              {guest ? (
                <button
                  type="button"
                  onClick={signUp}
                  disabled={busy}
                  className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
                >
                  {busy ? 'অপেক্ষা করুন...' : 'Google দিয়ে সাইন-আপ করুন'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={watchAd}
                    disabled={adBusy || !adsOn}
                    className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
                  >
                    {adBusy ? 'বিজ্ঞাপন চলছে...' : adsOn ? `বিজ্ঞাপন দেখে +${adCredits} ক্রেডিট নিন` : 'বিজ্ঞাপন (শীঘ্রই আসছে)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/premium';
                    }}
                    className="w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 text-white font-black py-3 text-sm transition active:scale-[0.98]"
                  >
                    Go Premium
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setInfo(null)}
                className="w-full rounded-full border border-slate-700 text-slate-300 hover:border-slate-500 py-2.5 text-xs font-bold transition"
              >
                পরে
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
