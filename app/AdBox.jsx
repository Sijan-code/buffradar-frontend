'use client';

import React from 'react';

// বিজ্ঞাপন একটা আলাদা, সীমাবদ্ধ iframe-এর ভেতরে চলে।
// allow-same-origin ইচ্ছে করে দেওয়া হয়নি: তাই বিজ্ঞাপনের স্ক্রিপ্ট আপনার সাইটের লগইন-তথ্য (localStorage) পড়তে পারে না।
export default function AdBox({ html, width = 300, height = 250, onLoaded }) {
  const doc =
    '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent;' +
    'display:flex;align-items:center;justify-content:center;min-height:100%}</style></head><body>' +
    html +
    '</body></html>';
  return (
    <iframe
      title="Advertisement"
      srcDoc={doc}
      width={width}
      height={height}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      onLoad={onLoaded}
      className="mx-auto block rounded-xl border border-slate-800 bg-slate-900/50"
    />
  );
}