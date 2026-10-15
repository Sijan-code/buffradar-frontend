'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../supabaseClient';

export default function PremiumPage() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | busy | done | dup | error
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setMsg('সঠিক ইমেইল ঠিকানা লিখুন।');
      setStatus('error');
      return;
    }
    setStatus('busy');
    setMsg('');
    try {
      const { data } = await supabase.auth.getSession();
      const user_id = (data && data.session && data.session.user && data.session.user.id) || null;
      const { error } = await supabase.from('premium_waitlist').insert({ email: clean, consent, user_id });
      if (error) {
        if (error.code === '23505') setStatus('dup');
        else {
          setMsg('এখন যোগ করা যায়নি। একটু পরে আবার চেষ্টা করুন।');
          setStatus('error');
        }
        return;
      }
      setStatus('done');
    } catch (_) {
      setMsg('এখন যোগ করা যায়নি। একটু পরে আবার চেষ্টা করুন।');
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <header className="border-b border-slate-900 px-6 py-4">
        <Link href="/" className="text-lg font-black tracking-wider text-emerald-400">
          BUFF
        </Link>
      </header>

      <div className="flex-1 max-w-md w-full mx-auto px-5 py-10">
        <h1 className="text-2xl font-black mb-2">BuffRadar Premium</h1>
        <p className="text-sm text-slate-400 mb-6">
          Premium এখনো চালু হয়নি। চালু হলে আপনাকে আগে জানাতে ইমেইল দিন।
        </p>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 mb-6">
          <p className="text-xs font-bold text-slate-300 mb-2">পরিকল্পিত সুবিধা (চূড়ান্ত নয়)</p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li>বিজ্ঞাপন ছাড়া ব্যবহার</li>
            <li>১৪৪০p ও 4K ডাউনলোড</li>
            <li>বড় ও লম্বা ভিডিও এডিট</li>
            <li>অগ্রাধিকার সারি, বেশি ক্রেডিট</li>
          </ul>
        </div>

        {status === 'done' || status === 'dup' ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {status === 'done' ? 'ধন্যবাদ! আপনি তালিকায় যোগ হয়েছেন।' : 'আপনি আগেই তালিকায় আছেন। ধন্যবাদ!'}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="আপনার ইমেইল"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <label className="flex items-start gap-3 text-xs text-slate-400 leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-emerald-500"
              />
              <span>
                আমি Premium চালু হওয়ার খবর ও অফার ইমেইলে পেতে সম্মত। যেকোনো সময় আনসাবস্ক্রাইব করা যাবে।
              </span>
            </label>
            {msg && <p className="text-xs text-red-400">{msg}</p>}
            <button
              type="submit"
              disabled={status === 'busy'}
              className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
            >
              {status === 'busy' ? 'অপেক্ষা করুন...' : 'তালিকায় যোগ হোন'}
            </button>
          </form>
        )}

        <Link href="/" className="block text-center text-xs text-slate-500 hover:text-slate-300 mt-8">
          হোমে ফিরুন
        </Link>
      </div>
    </main>
  );
}