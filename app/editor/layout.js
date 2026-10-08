// এই ফাইলটা app/editor/layout.js নামে রাখুন (page.js-এর পাশে)
export const metadata = {
  title: "Free Online Video Editor with AI",
  description:
    "Edit videos online for free. Trim, crop, change speed and add text manually, or just type what you want and let AI do it. No signup needed.",
  alternates: { canonical: "/editor" },
  openGraph: {
    title: "Free Online Video Editor with AI | BuffRadar",
    description: "Trim, crop, speed up and add text to your videos online.",
    url: "/editor",
    type: "website",
  },
};

export default function EditorLayout({ children }) {
  return children;
}