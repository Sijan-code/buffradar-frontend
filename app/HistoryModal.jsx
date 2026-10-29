'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Download History: হোম পেজ থেকে সরিয়ে এখানে আনা হয়েছে, যাতে সব পেজের মেনু থেকে একই জিনিস খোলে।
// SiteHeader খোলার সময় <HistoryModal onClose={...} /> বসায়; খোলা মাত্র তালিকা আনে।
export default function HistoryModal({ onClose }) {
  const [historyData, setHistoryData] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const ensureFreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInAnonymously();
      return;
    }
    const { error } = await supabase.auth.refreshSession();
    if (error) await supabase.auth.signInAnonymously();
  };

  const runQuery = async (fn) => {
    await ensureFreshSession();
    return await fn();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('download_history')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('History fetch error:', error.message);
          return;
        }
        if (alive) setHistoryData(data || []);
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const deleteItem = async (item) => {
    if (!item || item.id === undefined || item.id === null) return;
    if (!window.confirm('এই হিস্ট্রি আইটেমটা কি স্থায়ীভাবে মুছে ফেলতে চান? এটা আর ফেরত আনা যাবে না।')) return;
    setDeletingId(item.id);
    try {
      const { error } = await runQuery(() => supabase.from('download_history').delete().eq('id', item.id));
      if (error) {
        console.error('Delete error:', error.message);
        alert('মুছে ফেলা যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      setHistoryData((prev) => prev.filter((h) => h.id !== item.id));
    } catch (err) {
      console.error('Delete try-catch error:', err);
      alert('মুছে ফেলা যায়নি। ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।');
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    if (historyData.length === 0) return;
    if (!window.confirm(`সব (${historyData.length}টা) হিস্ট্রি আইটেম কি স্থায়ীভাবে মুছে ফেলতে চান?`)) return;
    setClearing(true);
    try {
      const ids = historyData.map((h) => h.id).filter((id) => id !== undefined && id !== null);
      const { error } = await runQuery(() => supabase.from('download_history').delete().in('id', ids));
      if (error) {
        console.error('Clear all error:', error.message);
        alert('সব মুছে ফেলা যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      setHistoryData([]);
    } catch (err) {
      console.error('Clear all try-catch error:', err);
      alert('সব মুছে ফেলা যায়নি। ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[90] p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">🕒 Download History</h3>
          <div className="flex items-center gap-3">
            {historyData.length > 0 && (
              <button
                onClick={clearAll}
                disabled={clearing}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 disabled:opacity-40 transition"
              >
                {clearing ? 'মুছছে...' : 'সব মুছুন'}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl font-bold p-1 transition" aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {historyData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">কোনো ডাউনলোডের হিস্ট্রি পাওয়া যায়নি।</p>
          ) : (
            historyData.map((item) => (
              <div key={item.id} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl mb-2 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 line-clamp-2 mb-1">
                    {item.video_title || 'Processed Video History'}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="truncate max-w-[160px]">{item.download_url || 'No Link Available'}</span>
                    <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just Now'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item)}
                  disabled={deletingId === item.id}
                  className="text-red-400 hover:text-red-300 disabled:opacity-40 text-sm px-1.5 py-0.5 flex-shrink-0"
                  aria-label="Delete history item"
                >
                  {deletingId === item.id ? '…' : '🗑️'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}