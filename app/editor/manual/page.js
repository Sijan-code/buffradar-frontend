import ManualEditor from "./ManualEditor";

export const metadata = {
  title: "Edit Video Manually",
  description:
    "Trim, resize, change speed, adjust audio and add text to your video online for free. No signup needed.",
  alternates: { canonical: "/editor/manual" },
};

export default function ManualEditorPage() {
  return <ManualEditor />;
}