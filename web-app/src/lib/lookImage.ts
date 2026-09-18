/**
 * A picture for a look that has none of its own.
 *
 * Looks saved from the app carry a photo captured from the camera. Ones saved
 * from a card carry the card's photo. Anything else - an older saved look, or
 * one built shade by shade - used to show nothing at all, so this draws the
 * makeup itself: the eye shade, the blush and the lip colour it actually wears.
 */
type LookColours = {
  name?: string;
  lipColor?: string | null;
  blushColor?: string | null;
  eyeshadowColor?: string | null;
  eyelinerColor?: string | null;
  lipGloss?: boolean | null;
};

const FALLBACK_LIP = '#c4667f';
const FALLBACK_BLUSH = '#e6a4a4';
const FALLBACK_EYE = '#b08968';

const safeColour = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const hex = value.trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(hex) ? hex : fallback;
};

export function lookSwatchImage(look: LookColours): string {
  const lip = safeColour(look.lipColor, FALLBACK_LIP);
  const blush = safeColour(look.blushColor, FALLBACK_BLUSH);
  const eye = safeColour(look.eyeshadowColor, FALLBACK_EYE);
  const liner = safeColour(look.eyelinerColor, '#2e211c');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${eye}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${blush}" stop-opacity="0.45"/>
    </linearGradient>
    <radialGradient id="cheek" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${blush}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${blush}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="200" fill="url(#bg)"/>
  <circle cx="64" cy="132" r="54" fill="url(#cheek)"/>
  <circle cx="256" cy="132" r="54" fill="url(#cheek)"/>
  <path d="M42 62 q38 -30 76 0 q-38 16 -76 0 z" fill="${eye}" opacity="0.85"/>
  <path d="M202 62 q38 -30 76 0 q-38 16 -76 0 z" fill="${eye}" opacity="0.85"/>
  <path d="M42 62 q38 -30 76 0" fill="none" stroke="${liner}" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
  <path d="M202 62 q38 -30 76 0" fill="none" stroke="${liner}" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
  <path d="M120 138 q20 -18 40 -6 q20 -12 40 6 q-20 30 -40 30 q-20 0 -40 -30 z" fill="${lip}"/>
  ${look.lipGloss
    ? '<ellipse cx="160" cy="150" rx="15" ry="5" fill="#ffffff" opacity="0.45"/>'
    : ''}
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** The look's own picture when it has one, and a drawn one when it does not. */
export function lookCoverImage(look: LookColours & { coverImage?: string | null; image?: string | null }): string {
  return look.coverImage || look.image || lookSwatchImage(look);
}
