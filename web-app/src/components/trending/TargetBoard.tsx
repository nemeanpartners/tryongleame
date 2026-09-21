import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play } from 'lucide-react';
import { WantedLookItem } from './WantedQuickActionCard';
import { openLookInNative } from '../../lib/nativeLooks';

interface TargetBoardProps {
  items: WantedLookItem[];
  onSelect?: (item: WantedLookItem) => void;
}

/** The same seven as the list underneath, so the two agree. */
const SHOTS = 7;

/** The product that stands for each part of the face. */
const ART_FOR: Record<string, string> = {
  Lips: '/products/lipstick.png',
  Blush: '/products/blush.png',
  Eyes: '/products/eyeshadow.png',
  Highlight: '/products/bronzer.png',
  'Full Face': '/products/bronzer.png',
  Other: '/products/gloss.png'
};

const artFor = (item: WantedLookItem) => ART_FOR[item.category] || ART_FOR.Other;

/**
 * The shades closest to being made, as shots on a target.
 *
 * A list tells you the order. This tells you the gap: the one people want most
 * is in the black, and the rest are as far out as they are behind. The names
 * are on the board below it, so the target carries none - tapping a product
 * opens what was proposed, and lets it be worn.
 */
export const TargetBoard: React.FC<TargetBoardProps> = ({ items, onSelect }) => {
  const [open, setOpen] = useState<WantedLookItem | null>(null);
  const top = items.slice(0, SHOTS);
  if (top.length === 0) return null;

  return (
    <div className="neu-inset p-4 text-left font-montserrat relative overflow-hidden">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-500 block">
            On target
          </span>
          <h3 className="text-lg font-display font-black text-stone-900 tracking-tight leading-tight mt-0.5">
            The Wanted Collection
          </h3>
        </div>
        <p className="text-[9.5px] font-bold text-stone-400 leading-snug shrink-0">
          The next filters we make
        </p>
      </div>

      <div className="relative w-full mt-3 mx-auto" style={{ aspectRatio: '1 / 1', maxWidth: 340 }}>
        {/* A target in glass: white at the edge, grey, then black in the
            middle, the way a target actually reads */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="targetWhite" cx="0.36" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#efe9e5" />
            </radialGradient>
            <radialGradient id="targetGrey" cx="0.38" cy="0.32" r="0.8">
              <stop offset="0%" stopColor="#c8bfb9" />
              <stop offset="100%" stopColor="#a1968f" />
            </radialGradient>
            <radialGradient id="targetCore" cx="0.38" cy="0.32" r="0.82">
              <stop offset="0%" stopColor="#3d322d" />
              <stop offset="70%" stopColor="#221b18" />
              <stop offset="100%" stopColor="#100d0c" />
            </radialGradient>
          </defs>

          {/* The three bands */}
          <circle cx="50" cy="50" r="49" fill="url(#targetWhite)" />
          <circle cx="50" cy="50" r="36" fill="url(#targetGrey)" />
          <circle cx="50" cy="50" r="21" fill="url(#targetCore)" />

          {/* The scoring lines cut between them */}
          <circle cx="50" cy="50" r="43" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.8" />
          <circle cx="50" cy="50" r="36" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.65" />
          <circle cx="50" cy="50" r="28.5" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.5" />
          <circle cx="50" cy="50" r="21" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.5" />
          <circle cx="50" cy="50" r="9" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.4" />

          {/* The glass over all of it */}
          <circle cx="50" cy="50" r="49" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
          <circle cx="50" cy="50" r="49" fill="none" stroke="#b7aaa3" strokeWidth="0.4" opacity="0.65" />
          <ellipse cx="34" cy="25" rx="18" ry="10" fill="#ffffff" opacity="0.3" transform="rotate(-28 34 25)" />
          <path d="M14 66 A40 40 0 0 0 44 88" fill="none" stroke="#ffffff" strokeWidth="2.2" opacity="0.32" strokeLinecap="round" />
        </svg>

        {/* Where each one landed: rank sets the distance from the black */}
        {top.map((item, index) => {
          // One in the black, the rest evenly around it, further out by rank.
          const radius = index === 0 ? 0 : 18 + (index - 1) * 4.4;
          const angle = (-90 + (index - 1) * 60) * (Math.PI / 180);
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          const tilt = ((index * 53) % 44) - 22;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect?.(item);
                setOpen(item);
              }}
              title={`${index + 1}. ${item.name}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%`, height: '12%' }}
              initial={{ opacity: 0, scale: 0.5, rotate: tilt * 2 }}
              animate={{ opacity: 1, scale: 1, rotate: tilt }}
              transition={{ type: 'spring', stiffness: 190, damping: 16, delay: index * 0.07 }}
              whileTap={{ scale: 0.9 }}
            >
              <img
                src={artFor(item)}
                alt=""
                draggable={false}
                className="h-full w-auto drop-shadow-[0_4px_5px_rgba(40,28,24,0.45)]"
              />
              <span
                className="absolute -top-1 -right-1.5 w-[13px] h-[13px] rounded-full text-[7.5px] font-black flex items-center justify-center shadow-md text-white"
                style={{ backgroundColor: item.colors[0] || '#E91E63' }}
              >
                {index + 1}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* What was proposed, when one is tapped */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-[#f7f2ef]/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ scale: 0.85, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="w-full glass-sheet rounded-2xl p-3.5 text-left relative"
              style={{ aspectRatio: '1 / 1', maxWidth: 200 }}
            >
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 border border-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-3 h-3 text-stone-600" />
              </button>

              <img
                src={artFor(open)}
                alt=""
                draggable={false}
                className="h-12 w-auto mx-auto drop-shadow-[0_3px_4px_rgba(40,28,24,0.35)]"
              />
              <p className="text-[11px] font-black text-stone-900 leading-tight mt-2 line-clamp-2">
                {open.name}
              </p>
              <p className="text-[9px] font-bold text-stone-400 mt-0.5">
                {open.category} · {open.numericVotes.toLocaleString()} want this
              </p>
              <p className="text-[9px] font-medium text-stone-500 mt-1 line-clamp-2">
                {open.description || `Proposed by @${open.requestedBy || 'community'}`}
              </p>

              <button
                type="button"
                onClick={() =>
                  openLookInNative({
                    id: open.id,
                    name: open.name,
                    lipColor: open.colors[0] || '#E91E63'
                  })
                }
                className="absolute bottom-3 inset-x-3 py-2 rounded-full bg-[#E91E63] text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                Try it on
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
