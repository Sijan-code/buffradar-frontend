// সীমা শেষের বার্তা সব পেজ থেকে একটাই মোডালে (LimitModal) পাঠানোর ছোট ঘোষণা-ব্যবস্থা
const listeners = new Set();

export function onLimit(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function showLimit(info) {
  listeners.forEach((cb) => cb(info));
}

// response যদি 429 'limit' হয় তবে তথ্য ফেরত দেয়, নাহলে null (clone করে, তাই body আবার পড়া যায়)
export async function readLimit(response) {
  if (!response || response.status !== 429) return null;
  try {
    const j = await response.clone().json();
    return j && j.error === 'limit' ? j : null;
  } catch (_) {
    return null;
  }
}