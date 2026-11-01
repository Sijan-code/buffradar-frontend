'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase, authHeaders } from './supabaseClient';
import { onLimit } from './limitBus';
import AdBox from './AdBox';
import { AD_FRAME_URL } from './adConfig';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
// পরীক্ষার জন্য: Vercel-এ NEXT_PUBLIC_ADS_TEST=1 দিলে আসল বিজ্ঞাপন ছাড়াই অপেক্ষা-পর্দা চলে। আসল সাইটে চালু রাখবেন না।
const ADS_TEST = process.env.NEXT_PUBLIC_ADS_TEST === '1';

const KIND_LABEL = {
  download: 'Downloading',
  convert: 'Converting',
  edit_manual: 'Manual editing',
  edit_ai: 'AI editing (Text to edit)',
};

const KIND_NAME = { download: 'Download', convert: 'Convert', edit_manual: 'Manual edit', edit_ai: 'AI edit' };

const bn = (n) => String(n ?? '').replace(/\d/g, (d) => d);

function formatReset(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function LimitModal() {
  const [info, setInfo] = useState(null);
  const [usage, setUsage] = useState(null);
  const [view, setView] = useState('main'); // main | ad | done
  const [busy, setBusy] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [secs, setSecs] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);
  const [refBusy, setRefBusy] = useState(false);
  const [refInfo, setRefInfo] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState('');
  const [toast, setToast] = useState('');
  const adRef = useRef(null);

  const close = () => {
    adRef.current = null;
    setInfo(null);
  };

  useEffect(
    () =>
      onLimit((i) => {
        adRef.current = null;
        setErr('');
        setNote('');
        setDone('');
        setView('main');
        setAdLoaded(false);
        setInfo(i);
      }),
    []
  );

  // মোডাল খুললে: বিজ্ঞাপন চালু কিনা, কত ক্রেডিট দেয়, রেফারেলে কত পাওয়া যায়
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
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info]);

  // অপেক্ষা-পর্দার কাউন্টডাউন: আসল বিজ্ঞাপন লোড না হলে গোনা শুরু হয় না
  useEffect(() => {
    if (view !== 'ad' || secs <= 0) return;
    if (!adLoaded && !ADS_TEST) return;
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [view, secs, adLoaded]);

  // কাউন্টডাউন শেষ হলে সার্ভারকে জানানো; সময়, কুলডাউন ও ঘণ্টার সীমা সার্ভারই যাচাই করে
  useEffect(() => {
    if (view !== 'ad' || secs !== 0 || !adRef.current || adRef.current.finishing) return;
    adRef.current.finishing = true;
    const { nonce, headers } = adRef.current;
    (async () => {
      try {
        const c = await fetch(`${API_BASE}/api/ads/complete`, { method: 'POST', headers, body: JSON.stringify({ nonce }) });
        const cj = await c.json().catch(() => ({}));
        if (!c.ok) throw new Error(cj.detail || 'Credits couldn’t be added.');
        setDone(`+${bn(cj.credits)} credits added! You now have ${bn(cj.balance)}. Please try your task again.`);
        setView('done');
      } catch (e) {
        setErr(e.message || 'Couldn’t play the ad.');
        setView('main');
      }
      adRef.current = null;
    })();
  }, [view, secs]);

  // রেফারেল: ?ref=কোড মনে রাখা, আর সাইন-আপ করা সদস্য হলে দাবি করা (শর্ত পূরণ না হলে পরে আবার চেষ্টা)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const incoming = (params.get('ref') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 12).toUpperCase();
      if (incoming) localStorage.setItem('bf_ref', incoming);
    } catch (_) {}

    const tryClaim = async () => {
      let code = '';
      try {
        code = localStorage.getItem('bf_ref') || '';
      } catch (_) {}
      if (!code) return;
      try {
        const { data } = await supabase.auth.getSession();
        const user = data && data.session && data.session.user;
        if (!user || user.is_anonymous) return;
        const r = await fetch(`${API_BASE}/api/referral/claim`, {
          method: 'POST',
          headers: await authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ code }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return;
        if (j.status === 'rewarded') {
          localStorage.removeItem('bf_ref');
          setToast(`Referral reward: +${bn(j.credits)} credits!`);
          setTimeout(() => setToast(''), 6000);
        } else if (['invalid', 'self', 'already'].includes(j.status)) {
          localStorage.removeItem('bf_ref');
        }
      } catch (_) {}
    };

    tryClaim();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      tryClaim();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const guest = info ? info.tier !== 'member' : true;
  const costs = (usage && usage.costs) || (info && info.costs) || null;
  const reset = info ? formatReset(info.reset_at) : '';
  const adCredits = (usage && usage.ad_credits) || 3;
  const refCredits = (usage && usage.referral_credits) || 5;
  const adsReady = !!(usage && usage.ads && (AD_FRAME_URL || ADS_TEST));

  // বিজ্ঞাপন সত্যিই দেখা না গেলে (ব্লকার, নেটওয়ার্ক থেকে বিজ্ঞাপন না আসা) ক্রেডিট দেওয়া হয় না
  const adFailed = () => {
    adRef.current = null;
    setErr('The ad didn’t load. Turn off your ad blocker or try another browser.');
    setView('main');
  };

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
      if (error) setErr('Google sign-in isn’t available yet. Please try again later.');
    } catch (_) {
      setErr('Couldn’t start sign-in. Please try again.');
    }
    setBusy(false);
  };

  // বিজ্ঞাপন দেখে ক্রেডিট: সার্ভার থেকে নম্বর নিন, অপেক্ষা-পর্দা দেখান (ক্লিক চাওয়া হয় না)
  const startAd = async () => {
    setAdBusy(true);
    setErr('');
    try {
      const headers = await authHeaders({ 'Content-Type': 'application/json' });
      const s = await fetch(`${API_BASE}/api/ads/start`, { method: 'POST', headers });
      const sj = await s.json().catch(() => ({}));
      if (!s.ok) throw new Error(sj.detail || 'No ad is available right now.');
      adRef.current = { nonce: sj.nonce, headers, finishing: false };
      setAdLoaded(false);
      setSecs((sj.min_seconds || 15) + 1);
      setView('ad');
    } catch (e) {
      setErr(e.message || 'Couldn’t play the ad.');
    }
    setAdBusy(false);
  };

  // বন্ধুকে আমন্ত্রণ: নিজের লিংক শেয়ার (ফোনে শেয়ার-মেনু, না থাকলে কপি)
  const invite = async () => {
    setRefBusy(true);
    setErr('');
    setNote('');
    try {
      const r = await fetch(`${API_BASE}/api/referral/me`, { headers: await authHeaders() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.detail || 'Couldn’t create your invite link right now.');
      setRefInfo(j);
      const link = `${window.location.origin}/?ref=${j.code}`;
      const text = `Download, convert and edit videos for free on BuffRadar. Join with my link and we both get +${bn(j.credits)} credits: ${link}`;
      if (navigator.share) {
        try {
          await navigator.share({ text });
        } catch (_) {}
      } else {
        await navigator.clipboard.writeText(text);
        setNote('Invite message copied. Send it to a friend.');
      }
    } catch (e) {
      setErr(e.message || 'Couldn’t send the invite.');
    }
    setRefBusy(false);
  };

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] max-w-[90%] rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-xl">
          {toast}
        </div>
      )}

      {info && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-5"
          onClick={() => view !== 'ad' && close()}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {view === 'done' && (
              <>
                <h2 className="text-lg font-black mb-3 text-emerald-400">Credits added</h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">{done}</p>
                <button
                  type="button"
                  onClick={close}
                  className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
                >
                  OK
                </button>
              </>
            )}

            {view === 'ad' && (
              <>
                <h2 className="text-lg font-black mb-1">Ad in progress</h2>
                <p className="text-[11px] text-slate-500 mb-4">You don’t need to click the ad. Credits are added when the timer ends.</p>
                {AD_FRAME_URL ? (
                  <AdBox src={AD_FRAME_URL} onLoaded={() => setAdLoaded(true)} onFailed={adFailed} />
                ) : (
                  <div className="mx-auto flex h-[250px] w-[300px] items-center justify-center rounded-xl border border-dashed border-slate-700 text-xs text-slate-500">
                    Ad (test)
                  </div>
                )}
                <p className="mt-4 text-center text-sm font-bold text-emerald-300">
                  {adLoaded || ADS_TEST ? `Please wait ${bn(secs)} seconds...` : 'Loading ad...'}
                </p>
                <p className="mt-1 text-center text-[11px] text-slate-500">
                  If no ad appears, turn off your ad blocker and try again.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    adRef.current = null;
                    setView('main');
                  }}
                  className="mt-4 w-full rounded-full border border-slate-700 text-slate-300 hover:border-slate-500 py-2.5 text-xs font-bold transition"
                >
                  Cancel
                </button>
              </>
            )}

            {view === 'main' && (
              <>
                <h2 className="text-lg font-black mb-1">{info.mode === 'badge' ? 'Your credits' : guest ? 'You’ve used your free credits' : 'You’re out of credits'}</h2>
                <p className="text-[11px] text-slate-500 mb-4">
                  {info.mode === 'badge'
                    ? `You have ${bn(info.balance)}/${bn(info.budget)} credits (per 24 hours).`
                    : `${KIND_LABEL[info.kind] || 'This action'} costs ${bn(info.cost)} ${Number(info.cost) === 1 ? 'credit' : 'credits'}. You have ${bn(info.balance)}/${bn(info.budget)}.`}
                </p>

                {info.mode === 'badge' && costs && (
                  <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                    {Object.keys(KIND_NAME).map((k) => (
                      <div key={k} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
                        <span className="text-slate-400">{KIND_NAME[k]}</span>
                        <span className="font-bold text-emerald-300">{bn(costs[k])}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {guest
                    ? info.network
                      ? 'This connection has been used a lot. Sign in with Google to get your own credits.'
                      : `Sign in with Google to get 3x the credits (${bn((info.budget || 8) * 3)}).`
                    : info.mode === 'badge'
                    ? 'When you run low, you can earn more by watching an ad, inviting a friend, or going Premium.'
                    : 'To keep going, watch an ad for credits, invite a friend, or go Premium.'}
                  {reset && <span className="block text-xs text-slate-500 mt-2">Some credits return: {reset}</span>}
                </p>

                {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
                {note && <p className="text-xs text-emerald-300 mb-3">{note}</p>}
                {refInfo && !guest && (
                  <p className="text-[11px] text-slate-500 mb-3">
                    Invited: {bn(refInfo.invited)} · Joined: {bn(refInfo.rewarded)}
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {guest ? (
                    <button
                      type="button"
                      onClick={signUp}
                      disabled={busy}
                      className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
                    >
                      {busy ? 'Please wait...' : 'Sign in with Google'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startAd}
                        disabled={adBusy || !adsReady}
                        className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
                      >
                        {adBusy
                          ? 'Please wait...'
                          : adsReady
                          ? `Watch an ad for +${bn(adCredits)} credits`
                          : 'Watch an ad (coming soon)'}
                      </button>
                      <button
                        type="button"
                        onClick={invite}
                        disabled={refBusy}
                        className="w-full rounded-full border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60 font-black py-3 text-sm transition active:scale-[0.98]"
                      >
                        {refBusy ? 'Please wait...' : `Invite a friend (you both get +${bn(refCredits)})`}
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
                    onClick={close}
                    className="w-full rounded-full border border-slate-700 text-slate-300 hover:border-slate-500 py-2.5 text-xs font-bold transition"
                  >
                    Not now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
