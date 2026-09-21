import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Send, Check } from 'lucide-react';
import { openLookInNative } from '../../lib/nativeLooks';
import { db, collection as firestoreCollection, setDoc, doc, auth } from '../../firebase';

/** A shade someone can claim as theirs. */
export type SignatureShade = { id: string; name: string; hex: string };

/** The two kiss prints, photographed and turned into masks so any shade can
    be stamped with them. */
export const PRINT_STYLES = [
  { id: 'print-1', label: 'Classic', src: '/lips/print-1.png' },
  { id: 'print-2', label: 'Soft', src: '/lips/print-2.png' }
] as const;

export type PrintStyle = (typeof PRINT_STYLES)[number]['id'];

/** The blank lips a collection is filled in on. */
export const LIP_OUTLINE = '/lips/outline.png';

/**
 * A kiss print in one shade. The print is a photograph used as a mask, so the
 * texture is real ink and the colour is whatever shade it stands for.
 */
export const KissPrint: React.FC<{
  hex: string;
  style?: PrintStyle;
  width?: number;
  className?: string;
}> = ({ hex, style = 'print-1', width = 64, className = '' }) => {
  const src = PRINT_STYLES.find((entry) => entry.id === style)?.src || PRINT_STYLES[0].src;
  return (
    <span
      aria-hidden
      className={`block ${className}`}
      style={{
        width,
        height: width * 0.74,
        backgroundColor: hex,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center'
      }}
    />
  );
};

/** The shades the wall starts from, so a signature can be claimed on day one. */
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
const COLLECTION_KEY = 'tryon_lipstick_collection';
const STYLE_KEY = 'tryon_signature_print_style';
const MAX_SIGNATURES = 3;

/** The collection ladder: something to fill in, and a reason to keep trying
    shades on. */
export const LEVELS = [
  { level: 1, target: 50, title: 'Collector' },
  { level: 2, target: 100, title: 'Curator' }
];

export type CollectedShade = SignatureShade & { collectedAt: number };

export const readCollection = (): CollectedShade[] => {
  try {
    return JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]');
  } catch {
    return [];
  }
};

interface SignatureShadeWallProps {
  /** Shades the person has saved, offered alongside the curated wall. */
  savedShades?: SignatureShade[];
}

/**
 * Signature Shades: the two or three lip colours someone is known for, plus
 * the collection they are filling in.
 *
 * A saved look is a thing you made; a signature is a thing you are. Stamping
 * one puts it on your wall, posting it puts it on everyone's, and every shade
 * you try on fills another pair of lips on the board.
 */
export const SignatureShadeWall: React.FC<SignatureShadeWallProps> = ({ savedShades = [] }) => {
  const [mine, setMine] = useState<SignatureShade[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [style, setStyle] = useState<PrintStyle>(() => {
    const saved = localStorage.getItem(STYLE_KEY);
    return saved === 'print-2' ? 'print-2' : 'print-1';
  });
  const [collection, setCollection] = useState<CollectedShade[]>(() => readCollection());
  const [posted, setPosted] = useState<string | null>(null);

  const wall = useMemo(() => {
    const seen = new Set<string>();
    return [...savedShades, ...CURATED].filter((shade) => {
      const key = shade.hex.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [savedShades]);

  const level = collection.length >= LEVELS[1].target ? LEVELS[1] : LEVELS[0];
  const progress = Math.min(100, Math.round((collection.length / level.target) * 100));

  const remember = (shade: SignatureShade) => {
    // Every shade that goes on the wall also goes in the collection.
    setCollection((prev) => {
      if (prev.some((entry) => entry.hex.toLowerCase() === shade.hex.toLowerCase())) return prev;
      const next = [...prev, { ...shade, collectedAt: Date.now() }];
      try {
        localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
      } catch {
        /* the collection still shows, it just will not be remembered */
      }
      return next;
    });
  };

  const toggle = (shade: SignatureShade) => {
    remember(shade);
    setMine((prev) => {
      const without = prev.filter((entry) => entry.id !== shade.id);
      const next =
        without.length === prev.length ? [...prev, shade].slice(-MAX_SIGNATURES) : without;
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* nothing to remember it with */
      }
      return next;
    });
  };

  const wear = (shade: SignatureShade) => {
    openLookInNative({ id: shade.id, name: shade.name, lipColor: shade.hex });
  };

  /** Puts a print on the board everyone sees, under the person who made it. */
  const post = async (shade: SignatureShade) => {
    const user = auth.currentUser;
    const creator =
      user?.displayName ||
      localStorage.getItem('kobella_username') ||
      localStorage.getItem('tryon_beauty_username') ||
      'anonymous';
    const id = `${creator}_${shade.hex.replace('#', '')}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
    try {
      await setDoc(doc(firestoreCollection(db, 'signature_lips'), id), {
        id,
        name: shade.name,
        hex: shade.hex,
        printStyle: style,
        creator,
        userId: user?.uid || null,
        postedAt: Date.now()
      });
      setPosted(shade.id);
      window.setTimeout(() => setPosted(null), 2400);
    } catch (error) {
      console.error('Could not post the signature:', error);
    }
  };

  return (
    <div className="glass-card rounded-[28px] p-5 sm:p-6 text-left font-montserrat">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
            Signature Lips
          </span>
          <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight mt-0.5">
            The lips you&apos;re known for
          </h3>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            Pick up to {MAX_SIGNATURES}. Post one to the board on Discover.
          </p>
        </div>

        {/* Which print the stamp is made with */}
        <div className="neu-pill flex items-center gap-1 p-1 shrink-0">
          {PRINT_STYLES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                setStyle(entry.id);
                localStorage.setItem(STYLE_KEY, entry.id);
              }}
              title={`${entry.label} print`}
              className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                style === entry.id ? 'bg-[#2A1715] text-white' : 'text-stone-500'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {/* Your own, stamped */}
      <div className="mt-4 neu-inset px-4 py-4 min-h-[140px] flex items-center justify-center">
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
            <div className="flex flex-col items-center -space-y-6">
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
                    rotate: index === 1 ? 4 : index === 2 ? -5 : 0
                  }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="cursor-pointer"
                >
                  <KissPrint hex={shade.hex} style={style} width={96} />
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {mine.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {mine.map((shade) => (
            <div key={shade.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => wear(shade)}
                className="neu-pill grow px-3 py-1.5 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform min-w-0"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-xs shrink-0"
                  style={{ backgroundColor: shade.hex }}
                />
                <span className="text-[10.5px] font-black text-stone-900 truncate">
                  {shade.name}
                </span>
                <span className="text-[9.5px] font-bold text-stone-400 tabular-nums ml-auto shrink-0">
                  {shade.hex.toUpperCase()}
                </span>
                <Play className="w-2.5 h-2.5 fill-current text-[#E91E63] shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => void post(shade)}
                title="Post to the Signature Lips board"
                className="w-9 h-9 rounded-full bg-[#2A1715] text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform shrink-0"
              >
                {posted === shade.id ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* The collection ladder */}
      <div className="mt-5 neu-inset px-3.5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
            My lipstick collection · Level {level.level} {level.title}
          </span>
          <span className="text-[10px] font-black text-stone-500 tabular-nums">
            {collection.length}/{level.target}
          </span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-white/70 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#F7C6D7] to-[#E91E63]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>

        {/* The blank lips the collection fills in */}
        <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 gap-1.5">
          {Array.from({ length: 24 }, (_, index) => {
            const filled = collection[index];
            return (
              <div key={index} className="flex flex-col items-center gap-0.5">
                {filled ? (
                  <button
                    type="button"
                    onClick={() => wear(filled)}
                    title={`${filled.name} · ${filled.hex.toUpperCase()}`}
                    className="cursor-pointer active:scale-95 transition-transform"
                  >
                    <KissPrint hex={filled.hex} style={style} width={34} />
                  </button>
                ) : (
                  <span
                    aria-hidden
                    className="block opacity-30"
                    style={{
                      width: 34,
                      height: 25,
                      backgroundColor: '#8b7d75',
                      WebkitMaskImage: `url(${LIP_OUTLINE})`,
                      maskImage: `url(${LIP_OUTLINE})`,
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[9.5px] font-bold text-stone-400 mt-2">
          {collection.length >= level.target
            ? 'Level complete. The next one needs 100.'
            : `${level.target - collection.length} more shades to reach Level ${level.level} ${level.title}`}
        </p>
      </div>

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
              <KissPrint hex={shade.hex} style={style} width={48} />
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
