// QR টুলের হিসাবের অংশ (ব্রাউজার ছাড়াই পরীক্ষা করা যায়)। QrTool.jsx এটা ব্যবহার করে।

const hasScheme = (s) => /^[a-z][a-z0-9+.-]*:/i.test(s);
const escWifi = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');

// type: link | text | wifi | whatsapp | email | phone। ফাঁকা বা অসম্পূর্ণ হলে '' ফেরত।
export function buildPayload(type, f = {}) {
  const t = (v) => String(v == null ? '' : v).trim();
  switch (type) {
    case 'link': {
      const u = t(f.url);
      if (!u) return '';
      return hasScheme(u) ? u : `https://${u}`;
    }
    case 'text':
      return String(f.text == null ? '' : f.text).trim() ? String(f.text) : '';
    case 'wifi': {
      const ssid = t(f.ssid);
      if (!ssid) return '';
      const sec = f.security === 'WEP' || f.security === 'nopass' ? f.security : 'WPA';
      const pass = sec === 'nopass' ? '' : `P:${escWifi(t(f.password))};`;
      return `WIFI:T:${sec};S:${escWifi(ssid)};${pass}H:${f.hidden ? 'true' : 'false'};;`;
    }
    case 'whatsapp': {
      const digits = t(f.phone).replace(/\D/g, '');
      if (digits.length < 7) return '';
      const msg = t(f.message);
      return `https://wa.me/${digits}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
    }
    case 'email': {
      const to = t(f.email);
      if (!to) return '';
      const q = [];
      if (t(f.subject)) q.push(`subject=${encodeURIComponent(t(f.subject))}`);
      if (t(f.body)) q.push(`body=${encodeURIComponent(t(f.body))}`);
      return `mailto:${to}${q.length ? `?${q.join('&')}` : ''}`;
    }
    case 'phone': {
      const p = t(f.phone).replace(/[^\d+]/g, '');
      return p.length >= 3 ? `tel:${p}` : '';
    }
    default:
      return '';
  }
}

export function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  const n = parseInt(v.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// কোণের তিনটা বড় বর্গ (স্ক্যানারের জন্য), এগুলো সবসময় বর্গাকার আঁকা হয়
export const isFinder = (r, c, n) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

// matrix: boolean[][]; opts: {size, margin, fg, bg, style: square|rounded|dots, logo?: {dataUrl, ratio}}
export function matrixToSvg(matrix, { size = 512, margin = 4, fg = '#000000', bg = '#ffffff', style = 'square', logo = null } = {}) {
  const n = matrix.length;
  const total = n + margin * 2;
  const parts = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c]) continue;
      const x = c + margin;
      const y = r + margin;
      if (style === 'square' || isFinder(r, c, n)) parts.push(`<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`);
      else if (style === 'rounded') parts.push(`<rect x="${x + 0.04}" y="${y + 0.04}" width="0.92" height="0.92" rx="0.3"/>`);
      else parts.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.46"/>`);
    }
  }
  let logoSvg = '';
  if (logo && logo.dataUrl) {
    const side = total * (logo.ratio || 0.2);
    const o = (total - side) / 2;
    const pad = side * 0.08;
    logoSvg =
      `<rect x="${o - pad}" y="${o - pad}" width="${side + pad * 2}" height="${side + pad * 2}" rx="${side * 0.12}" fill="${bg}"/>` +
      `<image href="${logo.dataUrl}" x="${o}" y="${o}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="${bg}"/><g fill="${fg}">${parts.join('')}</g>${logoSvg}</svg>`
  );
}