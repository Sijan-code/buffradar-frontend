'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { onLimit } from './limitBus';

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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => onLimit((i) => { setErr(''); setInfo(i); }), []);

  useEffect(() => {
    if (!info) return;
    const onKey = (e) => e.key === 'Escape' && setInfo(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info]);

  if (!info) return null;

  const guest = info.tier !== 'member';
  const reset = formatReset(info.reset_at);

  // বেনামি অ্যাকাউন্টের সাথে Google জুড়ে দেওয়া (ইতিহাস থেকে যায়); সম্ভব না হলে সরাসরি Google সাইন-ইন
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
        <h2 className="text-lg font-black mb-1">{guest ? 'আপনার ফ্রি সীমা শেষ' : 'আপনার সীমা শেষ'}</h2>
        <p className="text-[11px] text-slate-500 mb-4">
          {KIND_LABEL[info.kind] || 'ব্যবহার'}: {info.used}/{info.limit} ({info.hours || 24} ঘণ্টায়)
        </p>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          {guest
            ? info.network
              ? 'এই ইন্টারনেট সংযোগ থেকে অনেক ব্যবহার হয়েছে। Google দিয়ে সাইন-আপ করলে আপনার নিজের সীমা (৩ গুণ) পাবেন।'
              : 'Google দিয়ে সাইন-আপ করে ৩ গুণ ব্যবহার করুন।'
            : 'আপনার ২৪ ঘণ্টার সীমা শেষ হয়েছে।'}
          {reset && <span className="block text-xs text-slate-500 mt-2">নতুন সীমা শুরু: {reset}</span>}
        </p>

        {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

        <div className="flex flex-col gap-2">
          {guest && (
            <button
              type="button"
              onClick={signUp}
              disabled={busy}
              className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
            >
              {busy ? 'অপেক্ষা করুন...' : 'Google দিয়ে সাইন-আপ করুন'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setInfo(null)}
            className="w-full rounded-full border border-slate-700 text-slate-300 hover:border-slate-500 py-2.5 text-xs font-bold transition"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
}