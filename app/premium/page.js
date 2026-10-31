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
      setMsg('Please enter a valid email address.');
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
          setMsg('We couldn’t add you right now. Please try again in a moment.');
          setStatus('error');
        }
        return;
      }
      setStatus('done');
    } catch (_) {
      setMsg('We couldn’t add you right now. Please try again in a moment.');
      setStatus('error');
    }
  };

  const linkCls = 'text-emerald-400 underline underline-offset-2';

  return (
    <div className="bg-slate-950 text-white">
      <main className="max-w-md w-full mx-auto px-5 py-10">
        <span className="inline-block rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-black text-violet-300 mb-3">
          Coming soon
        </span>
        <h1 className="text-2xl font-black mb-2">BuffRadar Premium</h1>
        <p className="text-sm text-slate-400 mb-6">
          Premium isn’t available yet. Join the waiting list and we’ll email you as soon as it launches.
        </p>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 mb-6">
          <p className="text-xs font-bold text-slate-300 mb-2">Planned benefits (not final)</p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li>Ad-free experience</li>
            <li>1440p and 4K downloads</li>
            <li>Longer and larger video edits</li>
            <li>Priority processing and more daily credits</li>
          </ul>
        </div>

        {status === 'done' || status === 'dup' ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {status === 'done'
              ? 'Thank you! You’re on the waiting list.'
              : 'You’re already on the waiting list. Thank you!'}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
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
                I’d like to receive news and offers about Premium by email. I can unsubscribe at any time.
              </span>
            </label>
            {msg && <p className="text-xs text-red-400">{msg}</p>}
            <button
              type="submit"
              disabled={status === 'busy'}
              className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black py-3 text-sm transition active:scale-[0.98]"
            >
              {status === 'busy' ? 'Please wait...' : 'Join the waiting list'}
            </button>
            <p className="text-[11px] text-slate-500 leading-relaxed text-center">
              By submitting your email you agree to our{' '}
              <Link href="/privacy" className={linkCls}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" className={linkCls}>
                Terms of Service
              </Link>
              .
            </p>
          </form>
        )}

        <Link href="/" className="block text-center text-xs text-slate-500 hover:text-slate-300 mt-8">
          Back to home
        </Link>
      </main>
    </div>
  );
}
