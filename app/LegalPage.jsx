import React from 'react';
import { SITE } from './siteConfig';

// আইনি পাতাগুলোর একই কাঠামো। সার্ভার-কম্পোনেন্ট, তাই Google সরাসরি লেখা পড়তে পারে।
export function H2({ children }) {
  return <h2 className="text-lg font-black text-white mt-9 mb-2">{children}</h2>;
}
export function P({ children }) {
  return <p className="text-sm text-slate-300 leading-relaxed mb-3">{children}</p>;
}
export function UL({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 mb-3 text-sm text-slate-300 leading-relaxed">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}
export function ContactMail() {
  if (!SITE.contactEmail) return <>our contact page</>;
  return (
    <a href={`mailto:${SITE.contactEmail}`} className="text-emerald-400 underline underline-offset-2">
      {SITE.contactEmail}
    </a>
  );
}

export default function LegalPage({ title, children }) {
  return (
    <div className="bg-slate-950 text-white">
      <main className="max-w-2xl w-full mx-auto px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-black mb-1">{title}</h1>
        <p className="text-[11px] text-slate-500 mb-6">Last updated: {SITE.updated}</p>
        {children}
      </main>
    </div>
  );
}