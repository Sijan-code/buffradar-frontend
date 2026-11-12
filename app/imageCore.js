// ছবি-টুলের হিসাবের অংশ (ব্রাউজার ছাড়াই পরীক্ষা করা যায়)। ImageTool.jsx এটা ব্যবহার করে।
export const FORMATS = {
  jpeg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', lossy: true },
  png: { mime: 'image/png', ext: 'png', label: 'PNG', lossy: false },
  webp: { mime: 'image/webp', ext: 'webp', label: 'WebP', lossy: true },
};

export function fmtSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export const baseName = (name) => (String(name || '').replace(/\.[^.]+$/, '') || 'image').slice(0, 80);

export const isHeic = (name, type) => /heic|heif/i.test(type || '') || /\.(heic|heif)$/i.test(name || '');

// লক্ষ্য-সাইজে (বাইট) পৌঁছানোর খোঁজ: প্রথমে মান (quality) কমিয়ে, না হলে মাপ ছোট করে।
// encodeAt(scale, quality) => Promise<Blob|null>; লক্ষ্যে পৌঁছালে {blob, scale, reached:true}, না পৌঁছালে সবচেয়ে ছোটটা {reached:false}
export async function searchTarget({ encodeAt, startScale = 1, targetBytes, longSide = 4000, minSide = 120, steps = 14 }) {
  let scale = startScale;
  let best = null;
  for (let i = 0; i < steps; i++) {
    const lowQ = 0.25;
    const lowBlob = await encodeAt(scale, lowQ);
    if (lowBlob && lowBlob.size <= targetBytes) {
      let found = lowBlob;
      let lo = lowQ;
      let hi = 0.95;
      for (let k = 0; k < 7; k++) {
        const mid = (lo + hi) / 2;
        const b = await encodeAt(scale, mid);
        if (b && b.size <= targetBytes) {
          found = b;
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return { blob: found, scale, reached: true };
    }
    if (lowBlob && (!best || lowBlob.size < best.blob.size)) best = { blob: lowBlob, scale, reached: false };
    // মাপ কমানোর ধাপ: ফাইলের সাইজ প্রায় ক্ষেত্রফলের (scale²) সমানুপাতিক, তাই দরকারি ভাগফলের বর্গমূল ধরে এগোই
    const need = lowBlob ? Math.sqrt(targetBytes / lowBlob.size) * 0.92 : 0.85;
    const factor = Math.min(0.9, Math.max(0.35, need));
    if (longSide * scale * factor < minSide) break;
    scale *= factor;
  }
  return best;
}