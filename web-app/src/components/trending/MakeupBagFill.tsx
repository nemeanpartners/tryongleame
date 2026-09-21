import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';

export interface BagCategory {
  name: string;
  percentage: number;
}

interface MakeupBagFillProps {
  totalVotes: number;
  votesToday: number;
  categories: BagCategory[];
  /** Runs the drop; false settles everything where it lands. */
  play: boolean;
  onFinished?: () => void;
}

/** How many pieces go in the bag. Enough to fill it, few enough to read. */
const PIECES = 12;
const PER_ROW = 4;
const BAG_W = 190;
const BAG_H = 148;

type ItemKind = 'lipstick' | 'compact' | 'gloss' | 'liner' | 'brush';

/** Which piece of makeup stands for each category. */
const KIND_FOR: Record<string, ItemKind> = {
  Lips: 'lipstick',
  Blush: 'compact',
  Eyes: 'liner',
  Highlight: 'gloss',
  'Full Face': 'brush',
  Other: 'gloss'
};

const COLOUR_FOR: Record<string, string> = {
  Lips: '#E91E63',
  Blush: '#B8887A',
  Eyes: '#2A1715',
  Highlight: '#D8A7B1',
  'Full Face': '#7A5C52',
  Other: '#C9BDB6'
};

/**
 * One piece of makeup, drawn rather than photographed so it works at any size
 * and in any colour. Swapping these for artwork later means replacing this
 * switch and nothing else.
 */
const Piece: React.FC<{ kind: ItemKind; colour: string }> = ({ kind, colour }) => {
  switch (kind) {
    case 'lipstick':
      return (
        <svg width="20" height="30" viewBox="0 0 20 30">
          <rect x="5" y="12" width="10" height="17" rx="2" fill={colour} opacity="0.35" />
          <rect x="5" y="12" width="10" height="4" rx="1.4" fill={colour} opacity="0.75" />
          <path d="M6.5 12V5.5c0-1.6 1.2-2.9 2.8-3.3l3-.8c.9-.2 1.7.5 1.7 1.4V12z" fill={colour} />
          <rect x="6.5" y="24" width="7" height="2" rx="1" fill="#fff" opacity="0.5" />
        </svg>
      );
    case 'compact':
      return (
        <svg width="26" height="26" viewBox="0 0 26 26">
          <circle cx="13" cy="13" r="12" fill={colour} opacity="0.3" />
          <circle cx="13" cy="13" r="12" fill="none" stroke={colour} strokeWidth="1.6" />
          <circle cx="13" cy="13" r="7" fill={colour} />
          <ellipse cx="10.5" cy="10" rx="2.6" ry="1.8" fill="#fff" opacity="0.45" />
        </svg>
      );
    case 'gloss':
      return (
        <svg width="18" height="30" viewBox="0 0 18 30">
          <rect x="4" y="10" width="10" height="19" rx="3.6" fill={colour} opacity="0.45" />
          <rect x="4" y="10" width="10" height="19" rx="3.6" fill="none" stroke={colour} strokeWidth="1.2" />
          <rect x="6.5" y="1.5" width="5" height="9" rx="1.6" fill={colour} />
          <rect x="5.5" y="18" width="7" height="9" rx="2.4" fill={colour} opacity="0.85" />
        </svg>
      );
    case 'liner':
      return (
        <svg width="14" height="32" viewBox="0 0 14 32">
          <rect x="4" y="6" width="6" height="24" rx="2" fill={colour} />
          <path d="M4 6 7 0l3 6z" fill={colour} opacity="0.55" />
          <rect x="4" y="20" width="6" height="3" fill="#fff" opacity="0.4" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="32" viewBox="0 0 16 32">
          <rect x="6" y="12" width="4" height="19" rx="2" fill={colour} opacity="0.5" />
          <rect x="4.5" y="9" width="7" height="4" rx="1.2" fill={colour} />
          <path d="M4 9c0-4 1.2-7.5 4-9 2.8 1.5 4 5 4 9z" fill={colour} opacity="0.8" />
        </svg>
      );
  }
};

/**
 * What the community is asking for, as a bag filling up.
 *
 * A ring and a row of percentages say the same thing, but you have to read
 * them. Here every piece that drops in is a share of the vote: more lipsticks
 * means lips are winning. It plays when the app is opened, then settles.
 */
export const MakeupBagFill: React.FC<MakeupBagFillProps> = ({
  totalVotes,
  votesToday,
  categories,
  play,
  onFinished
}) => {
  const [dropped, setDropped] = useState(!play);

  // Hand out the pieces in proportion to the vote, largest share first, so the
  // bag reads as the board does.
  const pieces = useMemo(() => {
    const ranked = [...categories].filter((c) => c.percentage > 0);
    if (ranked.length === 0) {
      return Array.from({ length: 6 }, (_, i) => ({
        kind: 'compact' as ItemKind,
        colour: '#C9BDB6',
        name: 'Other',
        index: i
      }));
    }

    const out: { kind: ItemKind; colour: string; name: string; index: number }[] = [];
    ranked.forEach((category) => {
      const count = Math.max(1, Math.round((category.percentage / 100) * PIECES));
      for (let i = 0; i < count && out.length < PIECES; i++) {
        out.push({
          kind: KIND_FOR[category.name] || 'gloss',
          colour: COLOUR_FOR[category.name] || '#C9BDB6',
          name: category.name,
          index: out.length
        });
      }
    });
    return out.slice(0, PIECES);
  }, [categories]);

  // Held in a ref: the card above re-renders every second to tick its clock,
  // and depending on the callback itself would restart the drop each time -
  // leaving the page scroll-locked and the drop never finishing.
  const finishRef = useRef(onFinished);
  finishRef.current = onFinished;

  useEffect(() => {
    if (!play) return;

    // The drop is the point, so the page holds still until it has landed.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const done = window.setTimeout(() => {
      document.body.style.overflow = previousOverflow;
      setDropped(true);
      finishRef.current?.();
    }, 2400);

    return () => {
      window.clearTimeout(done);
      document.body.style.overflow = previousOverflow;
    };
  }, [play]);

  return (
    <div className="relative w-full flex items-end justify-center" style={{ height: 212 }}>
      {/* The pink stage the pieces fall onto */}
      <div
        className="absolute inset-x-3 bottom-0 rounded-[26px]"
        style={{
          top: 18,
          background:
            'linear-gradient(160deg, rgba(247,198,215,0.55) 0%, rgba(233,30,99,0.16) 100%)'
        }}
      />

      <div className="relative" style={{ width: BAG_W, height: BAG_H + 16 }}>
        {/* Behind the glass */}
        <svg
          width={BAG_W}
          height={BAG_H}
          viewBox={`0 0 ${BAG_W} ${BAG_H}`}
          className="absolute bottom-0 left-0"
        >
          <defs>
            <linearGradient id="bagBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.22" />
            </linearGradient>
          </defs>
          <path
            d={`M14 34 Q14 24 26 24 H${BAG_W - 26} Q${BAG_W - 14} 24 ${BAG_W - 14} 34
                L${BAG_W - 24} ${BAG_H - 12} Q${BAG_W - 26} ${BAG_H - 2} ${BAG_W - 38} ${BAG_H - 2}
                H52 Q40 ${BAG_H - 2} 38 ${BAG_H - 12} Z`}
            fill="url(#bagBack)"
          />
        </svg>

        {/* The pieces */}
        {pieces.map((piece) => {
          const row = Math.floor(piece.index / PER_ROW);
          const column = piece.index % PER_ROW;
          const settleX = 34 + column * 32 + (row % 2) * 9;
          const settleY = BAG_H - 34 - row * 30;
          // Deterministic scatter, so it looks thrown rather than placed.
          const tilt = ((piece.index * 47) % 50) - 25;

          return (
            <motion.div
              key={piece.index}
              className="absolute"
              style={{ left: settleX, top: settleY }}
              initial={
                play
                  ? { y: -180 - (piece.index % 4) * 40, opacity: 0, rotate: tilt * 2 }
                  : false
              }
              animate={{ y: 0, opacity: 1, rotate: tilt * 0.35 }}
              transition={{
                type: 'spring',
                stiffness: 150,
                damping: 13,
                delay: play ? piece.index * 0.085 : 0
              }}
            >
              <Piece kind={piece.kind} colour={piece.colour} />
            </motion.div>
          );
        })}

        {/* The glass in front, which is what makes them look inside it */}
        <svg
          width={BAG_W}
          height={BAG_H}
          viewBox={`0 0 ${BAG_W} ${BAG_H}`}
          className="absolute bottom-0 left-0 pointer-events-none"
        >
          <defs>
            <linearGradient id="bagFront" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            d={`M14 34 Q14 24 26 24 H${BAG_W - 26} Q${BAG_W - 14} 24 ${BAG_W - 14} 34
                L${BAG_W - 24} ${BAG_H - 12} Q${BAG_W - 26} ${BAG_H - 2} ${BAG_W - 38} ${BAG_H - 2}
                H52 Q40 ${BAG_H - 2} 38 ${BAG_H - 12} Z`}
            fill="url(#bagFront)"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.6"
          />
          {/* Zip */}
          <rect x="14" y="22" width={BAG_W - 28} height="9" rx="4.5" fill="#ffffff" opacity="0.75" />
          <line
            x1="22"
            y1="26.5"
            x2={BAG_W - 22}
            y2="26.5"
            stroke="#B8887A"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.7"
          />
          <circle cx={BAG_W - 30} cy="26.5" r="4" fill="#fff" stroke="#B8887A" strokeWidth="1" />
          {/* Highlight down the left */}
          <path
            d={`M30 36 L44 ${BAG_H - 18}`}
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>

        {/* The count, once everything has landed */}
        <motion.div
          className="absolute inset-x-0 flex flex-col items-center pointer-events-none"
          style={{ top: -6 }}
          initial={play ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: dropped ? 1 : 0, y: 0 }}
          transition={{ duration: 0.4, delay: play ? 2.15 : 0 }}
        >
          <span className="px-3 py-1 rounded-full bg-white/90 border border-white shadow-xs flex items-baseline gap-1.5">
            <span className="text-base font-display font-black text-stone-900 tabular-nums leading-none">
              {totalVotes.toLocaleString()}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
              votes in the bag
            </span>
          </span>
          {votesToday > 0 && (
            <span className="mt-1 text-[9.5px] font-bold text-[#E91E63] tabular-nums">
              +{votesToday} dropped in today
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
};
