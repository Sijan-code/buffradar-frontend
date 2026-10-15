'use client';

import React, { useEffect, useState } from 'react';
import { authHeaders } from './supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// হেডারে বসানোর ছোট ব্যালেন্স ব্যাজ: <CreditBadge />
// প্রতি ২০ সেকেন্ডে আর ট্যাবে ফিরে এলে নিজে হালনাগাদ হয়।
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
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', load);
    };
  }, []);

  if (!u) return null;
  const low = u.balance <= Math.min(...Object.values(u.costs || { a: 1 }));
  return (
    <span
      title={`২৪ ঘণ্টার ক্রেডিট। ডাউনলোড ${u.costs.download}, কনভার্ট ${u.costs.convert}, এডিট ${u.costs.edit_manual}, AI ${u.costs.edit_ai}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
        low ? 'border-amber-500/50 text-amber-300' : 'border-slate-700 text-slate-300'
      } ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
      </svg>
      {u.balance}/{u.budget}
    </span>
  );
}