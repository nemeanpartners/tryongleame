import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface RevealCardProps {
  /** Stable id, so a card stays open once it has been opened. */
  id: string;
  /** The picture behind the tiles. */
  image: string;
  /** Shown on the tiles: the place and the teaser. */
  rankLabel: string;
  teaser: string;
  accent?: string;
  children: React.ReactNode;
}

const COLUMNS = 5;
const ROWS = 4;
const TILE_COUNT = COLUMNS * ROWS;
/** Once this much has been taken away, the rest falls on its own. */
const CASCADE_AT = 0.45;
const STORAGE_KEY = 'tryon_revealed_podium';

const readRevealed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * A place on the podium, tiled over until the viewer takes the tiles off.
 *
 * The leaderboard was readable at a glance, so there was nothing to come back
 * for. Here the entry sits behind a grid of glass tiles: touch them and they
 * turn away one by one, and once enough are gone the rest fall by themselves.
 * Opened cards stay open - the reveal is the moment, not a gate.
 */
export const RevealCard: React.FC<RevealCardProps> = ({
  id,
  image,
  rankLabel,
  teaser,
  accent = '#E91E63',
  children
}) => {
  const alreadyOpen = useMemo(() => readRevealed().includes(id), [id]);
  const [taken, setTaken] = useState<Set<number>>(
    () => new Set(alreadyOpen ? Array.from({ length: TILE_COUNT }, (_, i) => i) : [])
  );
  const [revealed, setRevealed] = useState<boolean>(alreadyOpen);
  const [justOpened, setJustOpened] = useState(false);

  const remaining = TILE_COUNT - taken.size;

  // Enough tiles gone: let the rest go, in the order they sit on the grid.
  useEffect(() => {
    if (revealed) return;
    if (taken.size / TILE_COUNT < CASCADE_AT) return;

    setRevealed(true);
    setJustOpened(true);
    window.setTimeout(() => setJustOpened(false), 1600);
    setTaken(new Set(Array.from({ length: TILE_COUNT }, (_, i) => i)));
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(new Set([...readRevealed(), id])))
      );
    } catch {
      /* the card simply tiles over again next time */
    }
  }, [taken, revealed, id]);

  const takeTile = (index: number) => {
    setTaken((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/70 bg-[#f5f2ee] shadow-[3px_3px_10px_rgba(0,0,0,0.05),-3px_-3px_10px_rgba(255,255,255,0.9)]">
      {/* The picture underneath everything */}
      <img
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-[#f7f2ef]/82" />

      {/* What the tiles are covering */}
      <motion.div
        className="relative p-4 flex flex-col justify-between gap-3 min-h-[188px]"
        initial={false}
        animate={{ opacity: revealed ? 1 : 0.12 }}
        transition={{ duration: 0.45, delay: revealed ? 0.25 : 0 }}
      >
        {children}
      </motion.div>

      {/* The tiles */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.45 }}
          >
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                perspective: 900
              }}
              // A finger keeps its pointer events on the tile it landed on, so
              // brushing across only works if the point is tested directly.
              onPointerMove={(event) => {
                const element = document.elementFromPoint(
                  event.clientX,
                  event.clientY
                ) as HTMLElement | null;
                const index = element?.dataset?.tile;
                if (index !== undefined) takeTile(Number(index));
              }}
            >
              {Array.from({ length: TILE_COUNT }, (_, index) => {
                const gone = taken.has(index);
                return (
                  <motion.button
                    key={index}
                    type="button"
                    aria-label="Lift a tile"
                    data-tile={index}
                    onPointerEnter={() => takeTile(index)}
                    onPointerDown={() => takeTile(index)}
                    onFocus={() => takeTile(index)}
                    className="relative cursor-pointer"
                    initial={false}
                    animate={{
                      rotateY: gone ? -96 : 0,
                      opacity: gone ? 0 : 1,
                      scale: gone ? 0.86 : 1
                    }}
                    transition={{
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                      // Once it cascades, the tiles go in a wave rather than
                      // all at once.
                      delay: revealed ? (index % COLUMNS) * 0.03 : 0
                    }}
                    style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
                  >
                    <span
                      className="absolute inset-[1.5px] rounded-[6px] glass-sheet pointer-events-none"
                      style={{ backdropFilter: 'blur(14px) saturate(120%)' }}
                    />
                    <span
                      className="absolute inset-[1.5px] rounded-[6px] pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${accent}1f, transparent 60%)`
                      }}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* What to do, and how far in you are */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1.5">
              <span className="text-[9.5px] font-black uppercase tracking-[0.2em] text-stone-500">
                {rankLabel}
              </span>
              <span className="text-xs font-bold text-stone-900 px-6 text-center leading-snug">
                {teaser}
              </span>
              <span className="mt-1 px-3 py-1 rounded-full bg-white/80 border border-white text-[9px] font-black uppercase tracking-wider text-stone-500">
                {taken.size === 0
                  ? 'Brush the tiles away'
                  : `${remaining} tiles left`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* A small burst the moment it opens */}
      <AnimatePresence>
        {justOpened && (
          <motion.span
            className="absolute top-3 right-3 pointer-events-none z-10"
            initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
            animate={{ opacity: 1, scale: 1.1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Sparkles className="w-5 h-5" style={{ color: accent }} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
