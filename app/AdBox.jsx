'use client';

import React, { useEffect, useRef } from 'react';

// বিজ্ঞাপন আপনার নিজের ডোমেইনের আলাদা পেজে (/ad-frame.html) চলে, একটা সুরক্ষিত iframe-এর ভেতরে।
// - পেজের ঠিকানা buffradar.com থাকায় বিজ্ঞাপন-নেটওয়ার্ক সাইটটা চিনতে পারে।
// - allow-same-origin দেওয়া হয়নি: বিজ্ঞাপনের স্ক্রিপ্ট আপনার সাইটের লগইন-তথ্য (localStorage) পড়তে পারে না।
// - ad-frame.html বিজ্ঞাপন আসলে দেখা গেলে postMessage পাঠায়; না এলে ১০ সেকেন্ড পরে onFailed ডাকা হয় (ক্রেডিট মেলে না)।
export default function AdBox({ src, width = 300, height = 250, onLoaded, onFailed, timeoutMs = 10000 }) {
  const ref = useRef(null);

  useEffect(() => {
    let done = false;
    let timer = null;
    const onMsg = (e) => {
      if (done || !ref.current || e.source !== ref.current.contentWindow) return;
      if (e.data && e.data.type === 'bf-ad-rendered') {
        done = true;
        clearTimeout(timer);
        if (onLoaded) onLoaded();
      }
    };
    window.addEventListener('message', onMsg);
    timer = setTimeout(() => {
      if (!done) {
        done = true;
        if (onFailed) onFailed();
      }
    }, timeoutMs);
    return () => {
      done = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMsg);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <iframe
      ref={ref}
      title="Advertisement"
      src={src}
      width={width}
      height={height}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      className="mx-auto block rounded-xl border border-slate-800 bg-slate-900/50"
    />
  );
}
