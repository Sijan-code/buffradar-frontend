import TextToEditor from "./TextToEditor";

export const metadata = {
  title: "Edit Video with AI",
  description:
    "Just type what you want and AI edits your video: trim, crop, speed, filters, text and more. Free, no signup.",
  alternates: { canonical: "/editor/text-to-edit" },
};

export default function TextToEditPage() {
  return <TextToEditor />;
}