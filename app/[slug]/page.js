import Link from 'next/link';
import { notFound } from 'next/navigation';
import ImageTool from '../ImageTool';
import QrTool from '../QrTool';
import ToolCards from '../ToolCards';
import { PAGES, getPage, STEPS, COMMON_FAQ } from '../toolPages';

// একটাই ফাইল থেকে সব ছবি-টুল ও QR পাতা (toolPages.js-এর তালিকা অনুযায়ী)। তালিকার বাইরের ঠিকানা 404 হয়।
export const dynamicParams = false;

export function generateStaticParams() {
  return PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = getPage(slug);
  if (!p) return {};
  return { title: p.title, description: p.description, alternates: { canonical: `/${p.slug}` } };
}

export default async function ToolSlugPage({ params }) {
  const { slug } = await params;
  const p = getPage(slug);
  if (!p) notFound();

  const faq = [...p.faq, ...COMMON_FAQ[p.group]];
  const related = p.related.map((s) => getPage(s)).filter(Boolean);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const accent = p.group === 'image' ? 'from-cyan-300 to-sky-400' : 'from-lime-300 to-emerald-400';

  return (
    <div className="bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />

      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <div className="mb-5 text-center">
          <h1 className={`mb-2 bg-gradient-to-r ${accent} bg-clip-text text-2xl font-black text-transparent sm:text-3xl`}>{p.h1}</h1>
          <p className="text-xs text-slate-400">{p.subtitle}</p>
        </div>
        {p.group === 'image' ? <ImageTool {...p.tool} /> : <QrTool {...p.tool} />}
      </main>

      <article className="mx-auto w-full max-w-2xl space-y-10 px-4 pb-10 pt-6">
        <section aria-labelledby="about-title" className="border-t border-slate-900 pt-8">
          <h2 id="about-title" className="mb-3 text-xl font-black sm:text-2xl">{p.h1}: how it works</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-300">{p.intro}</p>
          <ol className="space-y-2 text-sm leading-relaxed text-slate-300">
            {STEPS[p.group].map((s, i) => (
              <li key={i}><strong className="text-white">{i + 1}.</strong> {s}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="why-title" className="border-t border-slate-900 pt-8">
          <h2 id="why-title" className="mb-3 text-xl font-black sm:text-2xl">What you get</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300">
            {p.points.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-slate-900 pt-8">
          <h2 id="faq-title" className="mb-4 text-xl font-black sm:text-2xl">Frequently asked questions</h2>
          <div className="divide-y divide-slate-800 border-y border-slate-800">
            {faq.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-white">
                  {f.q}
                  <span className="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="border-t border-slate-900 pt-8">
            <h2 id="related-title" className="mb-3 text-lg font-black">Related tools</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/${r.slug}`} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-500 hover:text-white">
                  {r.short}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <ToolCards exclude={[p.group === 'image' ? 'image' : 'qr']} />
    </div>
  );
}