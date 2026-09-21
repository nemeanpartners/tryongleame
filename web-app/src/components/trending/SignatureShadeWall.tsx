import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';
import { openLookInNative } from '../../lib/nativeLooks';

/** A shade anyone can claim as theirs. */
export type SignatureShade = { id: string; name: string; hex: string };

/**
 * The wall people pick from. Real lip colours rather than invented ones, so a
 * signature means something outside the app too.
 */
const CURATED: SignatureShade[] = [
  { id: 'sig_ruby', name: 'Ruby Woo', hex: '#C3172B' },
  { id: 'sig_pillow', name: 'Pillow Talk', hex: '#C08272' },
  { id: 'sig_diva', name: 'Diva', hex: '#7B1F2B' },
  { id: 'sig_velvet', name: 'Velvet Teddy', hex: '#A9736B' },
  { id: 'sig_whirl', name: 'Whirl', hex: '#9A6A63' },
  { id: 'sig_999', name: 'Rouge 999', hex: '#C4162A' },
  { id: 'sig_pbj', name: 'PB&J', hex: '#B4736B' },
  { id: 'sig_raspberry', name: 'Raspberry Jelly', hex: '#B94A63' },
  { id: 'sig_soar', name: 'Soar', hex: '#A97C79' },
  { id: 'sig_mehr', name: 'Mehr', hex: '#B4707A' },
  { id: 'sig_chili', name: 'Chili', hex: '#A8402F' },
  { id: 'sig_bronx', name: 'Bronx Baby', hex: '#B76A72' }
];

const STORE_KEY = 'tryon_signature_shades';
const MAX_SIGNATURES = 3;

/**
 * A kiss print in one shade.
 *
 * A round swatch tells you the colour; a print tells you what it looks like
 * worn. The gloss lines are what make it a print rather than a shape.
 */
const KissPrint: React.FC<{ hex: string; size?: number }> = ({ hex, size = 64 }) => (
  <svg width={size} height={size * 0.78} viewBox="0 0 100 78" aria-hidden>
    <defs>
      <linearGradient id={`kiss-${hex.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={hex} stopOpacity="0.95" />
        <stop offset="48%" stopColor={hex} />
        <stop offset="100%" stopColor={hex} stopOpacity="0.82" />
      </linearGradient>
      <mask id={`gloss-${hex.replace('#', '')}`}>
        <rect width="100" height="78" fill="#fff" />
        {/* The creases a real print leaves */}
        {Array.from({ length: 13 }, (_, i) => (
          <rect
            key={i}
            x={9 + i * 6.4}
            y="4"
            width="1.5"
            height="70"
            fill="#000"
            opacity={i % 2 ? 0.55 : 0.32}
          />
        ))}
        <path d="M6 38 Q50 30 94 38 Q50 46 6 38 Z" fill="#000" opacity="0.85" />
      </mask>
    </defs>
    <g mask={`url(#gloss-${hex.replace('#', '')})`}>
      {/* Upper lip */}
      <path
        d="M50 12 C58 -2 78 0 86 10 C92 18 88 28 78 33 C68 37 56 36 50 34 C44 36 32 37 22 33 C12 28 8 18 14 10 C22 0 42 -2 50 12 Z"
        fill={`url(#kiss-${hex.replace('#', '')})`}
      />
      {/* Lower lip */}
      <path
        d="M50 38 C60 36 74 36 84 40 C90 43 88 56 78 66 C68 75 56 77 50 77 C44 77 32 75 22 66 C12 56 10 43 16 40 C26 36 40 36 50 38 Z"
        fill={`url(#kiss-${hex.replace('#', '')})`}
      />
    </g>
  </svg>
);

interface SignatureShadeWallProps {
  /** Shades the person has saved, offered alongside the curated wall. */
  savedShades?: SignatureShade[];
}

/**
 * Signature Shades: the two or three lip colours someone is known for.
 *
 * A saved look is a thing you made; a signature is a thing you are. Picking
 * one stamps it as a kiss print, and a print can be worn straight away or left
 * on the wall for other people to find.
 */
export const SignatureShadeWall: React.FC<SignatureShadeWallProps> = ({ savedShades = [] }) => {
  const [mine, setMine] = useState<SignatureShade[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const wall = useMemo(() => {
    const seen = new Set<string>();
    return [...savedShades, ...CURATED].filter((shade) => {
      const key = shade.hex.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [savedShades]);

  const toggle = (shade: SignatureShade) => {
    setMine((prev) => {
      const without = prev.filter((entry) => entry.id !== shade.id);
      // Already a signature: tapping again takes it off the shelf.
      const next =
        without.length === prev.length
          ? [...prev, shade].slice(-MAX_SIGNATURES)
          : without;
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* the wall still works, it just will not be remembered */
      }
      return next;
    });
  };

  const wear = (shade: SignatureShade) => {
    openLookInNative({ id: shade.id, name: shade.name, lipColor: shade.hex });
  };

  return (
    <div className="glass-card rounded-[28px] p-5 sm:p-6 text-left font-montserrat">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
            Signature Shades
          </span>
          <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight mt-0.5">
            The lips you&apos;re known for
          </h3>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            Pick up to {MAX_SIGNATURES}. They stay on your wall.
          </p>
        </div>
      </div>

      {/* Your own, stamped */}
      <div className="mt-4 neu-inset px-4 py-4 min-h-[132px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {mine.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-bold text-stone-400 text-center"
            >
              No signature yet. Tap a shade below to stamp it here.
            </motion.p>
          ) : (
            <div className="flex flex-col items-center -space-y-5">
              {mine.map((shade, index) => (
                <motion.button
                  key={shade.id}
                  type="button"
                  onClick={() => wear(shade)}
                  title={`Wear ${shade.name}`}
                  initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: index === 1 ? 3 : index === 2 ? -4 : 0
                  }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="cursor-pointer"
                >
                  <KissPrint hex={shade.hex} size={78} />
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {mine.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {mine.map((shade) => (
            <button
              key={shade.id}
              type="button"
              onClick={() => wear(shade)}
              className="neu-pill px-3 py-1.5 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: shade.hex }}
              />
              <span className="text-[10.5px] font-black text-stone-900">{shade.name}</span>
              <span className="text-[9.5px] font-bold text-stone-400 tabular-nums">
                {shade.hex.toUpperCase()}
              </span>
              <Play className="w-2.5 h-2.5 fill-current text-[#E91E63]" />
            </button>
          ))}
        </div>
      )}

      {/* The wall to pick from */}
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-5">
        The wall
      </p>
      <div className="mt-2.5 grid grid-cols-4 sm:grid-cols-6 gap-2">
        {wall.map((shade) => {
          const picked = mine.some((entry) => entry.id === shade.id);
          return (
            <button
              key={shade.id}
              type="button"
              onClick={() => toggle(shade)}
              title={`${shade.name} · ${shade.hex.toUpperCase()}`}
              className={`rounded-2xl py-2 flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                picked ? 'bg-white/80 ring-2 ring-[#E91E63]' : 'hover:bg-white/60'
              }`}
            >
              <KissPrint hex={shade.hex} size={44} />
              <span className="text-[8.5px] font-bold text-stone-500 leading-tight text-center px-1 truncate w-full">
                {shade.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
