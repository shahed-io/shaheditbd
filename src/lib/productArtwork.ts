const PALETTES = [
  ['#17102f', '#7c3aed', '#c4b5fd'],
  ['#160d28', '#db2777', '#f9a8d4'],
  ['#091d2d', '#0891b2', '#67e8f9'],
  ['#10251f', '#059669', '#6ee7b7'],
  ['#26150a', '#d97706', '#fcd34d'],
  ['#1d1329', '#9333ea', '#e9d5ff'],
] as const;

const escapeXml = (value: string) => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const hash = (value: string) => {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) result = ((result << 5) - result + value.charCodeAt(index)) | 0;
  return Math.abs(result);
};

const shortName = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 12);
  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
};

export const getProductArtwork = (name: string, category = 'Digital Service') => {
  const [background, accent, foreground] = PALETTES[hash(`${category}:${name}`) % PALETTES.length];
  const title = escapeXml(name.length > 26 ? `${name.slice(0, 25)}...` : name);
  const categoryLabel = escapeXml(category.toUpperCase().slice(0, 24));
  const mark = escapeXml(shortName(name));
  const id = `art-${hash(`${name}:${category}`)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="#070511"/></linearGradient><radialGradient id="glow-${id}" cx="75%" cy="18%" r="65%"><stop stop-color="${accent}" stop-opacity=".5"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="800" height="800" fill="url(#${id})"/><rect width="800" height="800" fill="url(#glow-${id})"/><path d="M0 610C180 510 260 710 430 590s260-80 370 10v200H0Z" fill="${accent}" opacity=".13"/><g opacity=".14" stroke="${foreground}" stroke-width="1"><path d="M0 160h800M0 320h800M0 480h800M0 640h800M160 0v800M320 0v800M480 0v800M640 0v800"/></g><circle cx="400" cy="310" r="118" fill="${accent}" opacity=".16"/><circle cx="400" cy="310" r="92" fill="none" stroke="${foreground}" stroke-opacity=".7" stroke-width="2"/><text x="400" y="350" text-anchor="middle" fill="${foreground}" font-family="Arial,sans-serif" font-size="84" font-weight="800" letter-spacing="3">${mark}</text><text x="54" y="90" fill="${foreground}" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="4">SHAHED IT</text><text x="54" y="650" fill="${foreground}" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="2" opacity=".8">${categoryLabel}</text><text x="54" y="700" fill="#fff" font-family="Arial,sans-serif" font-size="28" font-weight="700">${title}</text><text x="54" y="746" fill="${foreground}" font-family="Arial,sans-serif" font-size="15" letter-spacing="3" opacity=".8">GENUINE DIGITAL PRODUCT</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
