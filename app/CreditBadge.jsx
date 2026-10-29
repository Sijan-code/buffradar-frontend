'use client';

import React, { useEffect, useState } from 'react';
import { authHeaders } from './supabaseClient';
import { openCreditsPanel } from './creditsPanel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const bn = (n) => String(n ?? '').replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

// হেডারে বসানোর ক্রেডিট-ব্যাজ: <CreditBadge />  (যেমন ⚡ ৮/৮)
// ট্যাপ করলে "আমার ক্রেডিট" প্যানেল খোলে। প্রতি ২০ সেকেন্ডে, ট্যাবে ফিরলে, বা 'bf-usage-refresh' ঘটনায় হালনাগাদ হয়।
export default function CreditBadge({ className = '' }) {
  const [u, setU] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/usage`, { headers: await authHeaders() });
        const j = await r.json();
        if (alive) setU(j && j.enabled ? j : null);
      } catch (_) {}
    };
    load();
    const id = setInterval(load, 20000);
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', load);
    window.addEventListener('bf-usage-refresh', load);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', load);
      window.removeEventListener('bf-usage-refresh', load);
    };
  }, []);

  if (!u) return null;
  const minCost = Math.min(...Object.values(u.costs || { a: 1 }));
  const low = u.balance < minCost; // সবচেয়ে সস্তা কাজটাও আর করা যাবে না

  return (
    <button
      type="button"
      onClick={() => openCreditsPanel()}
      aria-label="আমার ক্রেডিট"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black tabular-nums transition active:scale-95 ${
        low
          ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      } ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
      </svg>
      {bn(u.balance)}/{bn(u.budget)}
    </button>
  );
}
