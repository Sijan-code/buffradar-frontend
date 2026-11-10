import MemeMaker from '../MemeMaker';
import ToolCards from '../ToolCards';

export const metadata = {
  title: 'Free Meme Maker: Add Text to Any Photo | BuffRadar',
  description:
    'Make a meme online in seconds. Add top and bottom text to your own photo or an original template, drag it into place and download a PNG. No sign-up needed.',
  alternates: { canonical: '/meme-maker' },
};

const FAQ = [
  {
    q: 'Is the BuffRadar meme maker free?',
    a: 'Yes. Making a meme with your own photo or one of our templates is free. The “Suggest captions” helper uses credits, because it relies on an AI service.',
  },
  {
    q: 'Do I need to sign up?',
    a: 'No. You can add text and download your meme without an account.',
  },
  {
    q: 'Are my photos uploaded to your server?',
    a: 'No. Your picture is processed in your browser and stays on your device. If you use “Suggest captions”, only the idea text you type is sent, never your picture.',
  },
  {
    q: 'Can I use famous meme templates?',
    a: 'We only include original artwork made for BuffRadar. You can upload your own pictures, but please make sure you have the right to use any image you upload.',
  },
  {
    q: 'Is there a watermark on my meme?',
    a: 'A small buffradar.com watermark is on by default. You can switch it off with one tap before you download.',
  },
];

export default function MemeMakerPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <div className="bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />

      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <div className="mb-4 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
            Free Meme Maker
          </h1>
          <p className="text-xs text-slate-400">Add text to any photo, drag it into place and download. No sign-up needed.</p>
        </div>
        <MemeMaker />
      </main>

      <article className="mx-auto w-full max-w-2xl space-y-10 px-4 pb-10 pt-6">
        <section aria-labelledby="how-title" className="border-t border-slate-900 pt-8">
          <h2 id="how-title" className="mb-3 text-xl font-black sm:text-2xl">How to make a meme online</h2>
          <ol className="space-y-3 text-sm leading-relaxed text-slate-300">
            <li><strong className="text-white">1. Pick a picture.</strong> Upload your own photo, or choose an original template for Global or USA-style humor.</li>
            <li><strong className="text-white">2. Add your text.</strong> Type the top and bottom lines, or tap “Add text” for more. Drag any line to move it.</li>
            <li><strong className="text-white">3. Style it.</strong> Choose a bold or clean font, change the size and color, and switch between the Classic layout and the Caption bar.</li>
            <li><strong className="text-white">4. Save or share.</strong> Download your meme as a PNG, or share it straight from your phone.</li>
          </ol>
        </section>

        <section aria-labelledby="features-title" className="border-t border-slate-900 pt-8">
          <h2 id="features-title" className="mb-3 text-xl font-black sm:text-2xl">What you can do</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300">
            <li>Classic top and bottom text with a bold outline, or a clean caption bar above the picture.</li>
            <li>Drag text anywhere, resize it and pick its color.</li>
            <li>Use your own photo, or start from our original templates.</li>
            <li>Get caption ideas from AI by describing your meme in a few words.</li>
            <li>Your picture is processed in your browser and is not uploaded.</li>
          </ul>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-slate-900 pt-8">
          <h2 id="faq-title" className="mb-4 text-xl font-black sm:text-2xl">Frequently asked questions</h2>
          <div className="divide-y divide-slate-800 border-y border-slate-800">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-white">
                  {f.q}
                  <span className="text-amber-300 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>

      <ToolCards exclude={['meme']} />
    </div>
  );
}