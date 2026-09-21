import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play } from 'lucide-react';
import { WantedLookItem } from './WantedQuickActionCard';
import { openLookInNative } from '../../lib/nativeLooks';

interface TargetBoardProps {
  items: WantedLookItem[];
  onSelect?: (item: WantedLookItem) => void;
}

/** How many land on the target. Six reads; ten was a pile. */
const SHOTS = 6;

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
 * is in the black, and the rest are as far out as they are behind. Tapping a
 * product opens what was proposed, and lets it be worn.
 */
export const TargetBoard: React.FC<TargetBoardProps> = ({ items, onSelect }) => {
  const [open, setOpen] = useState<WantedLookItem | null>(null);
  const top = items.slice(0, SHOTS);
  if (top.length === 0) return null;

  return (
    <div className="glass-card rounded-[24px] p-4 text-left font-montserrat h-full flex flex-col relative overflow-hidden">
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-500 block">
        On target
      </span>
      <h3 className="text-base font-display font-black text-stone-900 tracking-tight leading-tight mt-0.5">
        The Wanted Collection
      </h3>
      <p className="text-[9.5px] font-bold text-stone-400 leading-snug mt-0.5">
        The next filters we make
      </p>

      <div className="relative w-full mt-2" style={{ aspectRatio: '1 / 1' }}>
        {/* A plain target: three rings and a black centre, nothing else */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <circle cx="50" cy="50" r="49" fill="#f7f4f1" />
          {[49, 40].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#d5c9c0" strokeWidth="0.6" />
          ))}
          <circle cx="50" cy="50" r="30" fill="#1b1512" />
          <circle cx="50" cy="50" r="17" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
          <circle cx="50" cy="50" r="7" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
        </svg>

        {/* Where each one landed: rank sets the distance from the black */}
        {top.map((item, index) => {
          const radius = index === 0 ? 0 : 15 + (index - 1) * 7;
          const angle = (-90 + index * 61) * (Math.PI / 180);
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          const tilt = ((index * 53) % 60) - 30;

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
              style={{ left: `${x}%`, top: `${y}%`, height: '26%' }}
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
                className="absolute -top-1.5 -right-2 w-[15px] h-[15px] rounded-full text-[8px] font-black flex items-center justify-center shadow-md text-white"
                style={{ backgroundColor: item.colors[0] || '#E91E63' }}
              >
                {index + 1}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Who is where, because a target shows the gap but not the names */}
      <div className="mt-2.5 space-y-0.5">
        {top.slice(0, 4).map((item, index) => (
          <div key={item.id} className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9px] font-black text-stone-400 tabular-nums w-2.5 shrink-0">
              {index + 1}
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0 border border-white shadow-xs"
              style={{ backgroundColor: item.colors[0] }}
            />
            <span className="text-[9.5px] font-bold text-stone-700 truncate">{item.name}</span>
          </div>
        ))}
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
