'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';

// ভিডিও (blue) ও অডিও (emerald) — দুটোর জন্য একই কম্পোনেন্ট
const THEMES = {
  blue: 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20',
  emerald: 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20',
};
const OFF =
  'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700';

const GAP_REM = 0.5; // Tailwind gap-2 = 0.5rem

export default function QualitySelector({
  items,          // [{ id, short, label }]
  value,          // selected id
  onChange,       // (id) => void
  theme = 'emerald',
  visible = 4,    // একসাথে কয়টা দেখাবে
  label = 'Quality',
}) {
  const rowRef = useRef(null);
  const drag = useRef({ moved: false, startX: 0, startLeft: 0 });
  const [edge, setEdge] = useState({ left: false, right: false });

  const scrollable = items.length > visible;

  // বাম/ডান দিকে আরও বাটন আছে কিনা
  const updateEdges = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdge((p) => (p.left === left && p.right === right ? p : { left, right }));
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateEdges);
      ro.observe(el);
    } else {
      window.addEventListener('resize', updateEdges);
    }
    return () => {
      el.removeEventListener('scroll', updateEdges);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges, items.length]);

  // সিলেক্ট করা বাটন যদি দেখা না যায়, স্ক্রল করে সামনে আনবে
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const btn = el.querySelector(`[data-id="${value}"]`);
    if (!btn) return;
    const c = el.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    if (b.left < c.left) {
      el.scrollTo({ left: el.scrollLeft - (c.left - b.left), behavior: 'smooth' });
    } else if (b.right > c.right) {
      el.scrollTo({ left: el.scrollLeft + (b.right - c.right), behavior: 'smooth' });
    }
  }, [value]);

  // PC: মাউস দিয়ে ড্র্যাগ করে স্ক্রল (টাচ ডিভাইসে ব্রাউজার নিজেই swipe করে)
  const onMouseDown = (e) => {
    if (e.button !== 0 || !scrollable) return;
    const el = rowRef.current;
    drag.current = { moved: false, startX: e.clientX, startLeft: el.scrollLeft };

    const onMove = (ev) => {
      const d = drag.current;
      const dx = ev.clientX - d.startX;
      if (!d.moved && Math.abs(dx) > 5) {
        d.moved = true;
        el.style.scrollSnapType = 'none'; // ড্র্যাগের সময় snap বন্ধ
      }
      if (d.moved) el.scrollLeft = d.startLeft - dx;
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      requestAnimationFrame(() => {
        el.style.scrollSnapType = ''; // snap আবার চালু
      });
      // click ইভেন্ট শেষ হওয়ার পর reset
      setTimeout(() => {
        drag.current.moved = false;
      }, 0);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ড্র্যাগ শেষে ভুল করে বাটন সিলেক্ট হওয়া আটকায়
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const nudge = (dir) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const arrowCls =
    'hidden sm:flex shrink-0 w-6 h-9 items-center justify-center rounded-lg text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition';

  return (
    <div className="flex items-center gap-1">
      {scrollable && (
        <button
          type="button"
          aria-label="Scroll left"
          disabled={!edge.left}
          onClick={() => nudge(-1)}
          className={arrowCls}
        >
          ‹
        </button>
      )}

      <div
        ref={rowRef}
        role="radiogroup"
        aria-label={label}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
        className={`flex-1 min-w-0 flex gap-2 overflow-x-auto snap-x snap-mandatory py-1 select-none overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          scrollable ? 'sm:cursor-grab' : ''
        }`}
      >
        {items.map((item) => {
          const on = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={on}
              data-id={item.id}
              title={item.label}
              onClick={() => onChange(item.id)}
              style={{
                flexBasis: `calc((100% - ${(visible - 1) * GAP_REM}rem) / ${visible})`,
              }}
              className={`snap-start shrink-0 py-2.5 rounded-xl border font-bold text-[11px] transition-all ${
                on ? THEMES[theme] : OFF
              }`}
            >
              {item.short}
            </button>
          );
        })}
      </div>

      {scrollable && (
        <button
          type="button"
          aria-label="Scroll right"
          disabled={!edge.right}
          onClick={() => nudge(1)}
          className={arrowCls}
        >
          ›
        </button>
      )}
    </div>
  );
}
