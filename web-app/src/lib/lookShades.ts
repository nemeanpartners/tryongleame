/**
 * What a saved look is actually wearing, in words: the product and the shade
 * name behind each region. A saved look used to be shown as a drawn face,
 * which said less than the shade names it was built from.
 */
export type LookShadeLine = {
  /** The product, e.g. Lipstick or Lip liner. */
  label: string;
  /** The shade the look wears there, when the look recorded one. */
  shade?: string;
  /** Its colour, for the dot beside the line. */
  hex?: string;
};

type SavedShade = { region?: string; name?: string; swatch?: string };

type LookLike = {
  shades?: SavedShade[] | null;
  lipColor?: string | null;
  blushColor?: string | null;
  eyeshadowColor?: string | null;
  eyelinerColor?: string | null;
  lashesStyle?: string | null;
  lipGloss?: boolean | null;
};

/** The product each region of the face belongs to. */
const REGION_LABELS: Record<string, string> = {
  lips: 'Lipstick',
  lipliner: 'Lip liner',
  lipgloss: 'Lip gloss',
  cheeks: 'Blush',
  eyes: 'Eyeshadow',
  liner: 'Eyeliner',
  lashes: 'Lashes',
  glitter: 'Glitter',
  brows: 'Brows'
};

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export function lookShadeLines(look: LookLike): LookShadeLine[] {
  // A look saved from the app records the shade it wore in each region, which
  // is the most exact thing we can show.
  const saved = Array.isArray(look.shades) ? look.shades : [];
  if (saved.length > 0) {
    return saved
      .filter((shade) => shade && (shade.region || shade.name))
      .map((shade) => ({
        label: REGION_LABELS[shade.region || ''] || titleCase(shade.region || 'Shade'),
        shade: shade.name || undefined,
        hex: shade.swatch || undefined
      }));
  }

  // Anything else - a look saved from a card, or an older one - is described
  // by the colours it carries.
  const lines: LookShadeLine[] = [];
  if (look.lipColor) {
    lines.push({
      label: look.lipGloss ? 'Lip gloss' : 'Lipstick',
      hex: look.lipColor
    });
  }
  if (look.blushColor) lines.push({ label: 'Blush', hex: look.blushColor });
  if (look.eyeshadowColor) lines.push({ label: 'Eyeshadow', hex: look.eyeshadowColor });
  if (look.eyelinerColor) lines.push({ label: 'Eyeliner', hex: look.eyelinerColor });
  if (look.lashesStyle && look.lashesStyle !== 'none') {
    lines.push({ label: 'Lashes', shade: `${look.lashesStyle} style` });
  }
  return lines;
}
