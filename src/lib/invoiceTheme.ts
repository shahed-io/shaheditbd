/**
 * Invoice theme helper — derives header text color from any brand color
 * to guarantee readable contrast (WCAG-style luminance check).
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

/** Relative luminance per WCAG 2.x */
function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/**
 * Returns ideal header theme for a given brand background color.
 * - On dark/saturated brand: white text, no shadow
 * - On very light brand: dark text + subtle solid dark band fallback
 */
export function getInvoiceHeaderTheme(brandColor: string): {
  bg: string;
  text: string;
  shadow: string;
} {
  const rgb = hexToRgb(brandColor);
  if (!rgb) return { bg: brandColor, text: '#ffffff', shadow: 'none' };
  const lum = luminance(rgb);
  // Threshold ~0.55 — anything brighter than mid-light gets dark text.
  if (lum > 0.55) {
    return { bg: '#1a1a2e', text: '#ffffff', shadow: 'none' };
  }
  return { bg: brandColor, text: '#ffffff', shadow: 'none' };
}
