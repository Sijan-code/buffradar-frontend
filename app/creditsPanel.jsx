import { authHeaders } from './supabaseClient';
import { showLimit } from './limitBus';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ব্যাজ বা মেনু থেকে "আমার ক্রেডিট" প্যানেল খোলে (সীমা-মোডালের একই কাঠামো, শুধু শিরোনাম অন্য)
export async function openCreditsPanel() {
  try {
    const r = await fetch(`${API_BASE}/api/usage`, { headers: await authHeaders() });
    const u = await r.json();
    if (!u || !u.enabled) return;
    showLimit({
      mode: 'badge',
      kind: null,
      tier: u.tier,
      cost: 0,
      balance: u.balance,
      budget: u.budget,
      reset_at: u.reset_at,
      hours: u.hours,
      costs: u.costs,
    });
  } catch (_) {}
}