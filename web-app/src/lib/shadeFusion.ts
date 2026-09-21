/**
 * Shade Fusion: two wanted shades, blended into one that nobody has asked for
 * yet.
 *
 * The board tells a brand what people want. Fusion lets the people asking
 * build the thing they are asking for: pick two shades off the board, see what
 * they make together, wear it on your own face, and put it back on the board
 * as a request of its own.
 */

export type Fusion = {
  hex: string;
  name: string;
  /** How many people wanted the two shades it came from. */
  inheritedVotes: number;
  parents: [string, string];
};

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const toRgb = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0
  ];
};

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;

/**
 * Mixed the way pigment mixes rather than the way light does: a straight
 * average of two colours goes muddy and grey, so the result keeps the stronger
 * parent's saturation.
 */
export function mixShades(a: string, b: string): string {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  const r = (r1 + r2) / 2;
  const g = (g1 + g2) / 2;
  const bl = (b1 + b2) / 2;

  const mid = (r + g + bl) / 3;
  // Push each channel away from the midpoint, which is what the average took
  // out of it.
  const lift = 1.18;
  return toHex(mid + (r - mid) * lift, mid + (g - mid) * lift, mid + (bl - mid) * lift);
}

/** The family a colour lands in, which is what the blend gets named after. */
function familyOf(hex: string): string {
  const [r, g, b] = toRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const delta = max - min;

  if (delta < 22) return lightness > 0.62 ? 'Porcelain' : lightness > 0.35 ? 'Ash' : 'Onyx';

  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;

  if (hue < 12 || hue >= 344) return lightness < 0.34 ? 'Oxblood' : 'Crimson';
  if (hue < 26) return lightness < 0.4 ? 'Cocoa' : 'Terracotta';
  if (hue < 46) return lightness < 0.42 ? 'Bronze' : 'Amber';
  if (hue < 66) return 'Champagne';
  if (hue < 160) return lightness < 0.4 ? 'Moss' : 'Sage';
  if (hue < 200) return 'Glacier';
  if (hue < 250) return lightness < 0.42 ? 'Midnight' : 'Periwinkle';
  if (hue < 290) return lightness < 0.42 ? 'Plum' : 'Lilac';
  if (hue < 322) return lightness < 0.42 ? 'Mulberry' : 'Orchid';
  return lightness < 0.4 ? 'Merlot' : 'Rose';
}

/** What the two parents were for, so the blend is named for the same place. */
function placeOf(a: string, b: string): string {
  const text = `${a} ${b}`.toLowerCase();
  if (text.includes('liner')) return 'Liner';
  if (text.includes('lash')) return 'Lash';
  if (text.includes('lip') || text.includes('balm') || text.includes('gloss')) return 'Lip';
  if (text.includes('eye') || text.includes('shadow') || text.includes('halo')) return 'Eye';
  if (text.includes('blush') || text.includes('cheek')) return 'Cheek';
  if (text.includes('glow') || text.includes('highlight')) return 'Glow';
  return 'Blend';
}

/** The finish, taken from whichever parent has one. */
function finishOf(a: string, b: string): string {
  const text = `${a} ${b}`.toLowerCase();
  if (text.includes('glossy') || text.includes('gloss')) return 'Gloss';
  if (text.includes('matte')) return 'Matte';
  if (text.includes('satin')) return 'Satin';
  if (text.includes('smoke') || text.includes('smoked')) return 'Smoke';
  if (text.includes('chrome') || text.includes('holographic')) return 'Chrome';
  if (text.includes('velvet')) return 'Velvet';
  return '';
}

export function fuseShades(
  a: { name: string; colour: string; votes: number },
  b: { name: string; colour: string; votes: number }
): Fusion {
  const hex = mixShades(a.colour, b.colour);
  const finish = finishOf(a.name, b.name);
  const name = [familyOf(hex), finish, placeOf(a.name, b.name)]
    .filter(Boolean)
    .join(' ');

  return {
    hex,
    name,
    inheritedVotes: a.votes + b.votes,
    parents: [a.name, b.name]
  };
}
