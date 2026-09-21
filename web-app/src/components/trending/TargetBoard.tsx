import React from 'react';
import { motion } from 'motion/react';
import { WantedLookItem } from './WantedQuickActionCard';
import { openLookInNative } from '../../lib/nativeLooks';

interface TargetBoardProps {
  items: WantedLookItem[];
  onSelect?: (item: WantedLookItem) => void;
}

/** How many land on the target. Six reads; ten was a pile. */
const SHOTS = 6;

/**
 * The most wanted shades, as shots on a target.
 *
 * A list tells you the order. This tells you the gap: the one people want most
 * is in the black, and the rest are as far out as they are behind. Tap one to
 * wear it.
 */
export const TargetBoard: React.FC<TargetBoardProps> = ({ items, onSelect }) => {
  const top = items.slice(0, SHOTS);
  if (top.length === 0) return null;

  return (
    <div className="glass-card rounded-[28px] p-5 text-left font-montserrat h-full flex flex-col">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
        On target
      </span>
      <h3 className="text-lg font-display font-black text-stone-900 tracking-tight leading-tight mt-0.5">
        Closest to being made
      </h3>

      <div className="relative w-full mt-3" style={{ aspectRatio: '1 / 1' }}>
        {/* A plain target: four rings and a black centre, nothing else */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <circle cx="50" cy="50" r="49" fill="#f7f4f1" />
          {[49, 41, 33].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#d5c9c0" strokeWidth="0.5" />
          ))}
          <circle cx="50" cy="50" r="25" fill="#1b1512" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.65" />
          <circle cx="50" cy="50" r="6" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.65" />
        </svg>

        {/* Where each one landed: rank sets the distance from the black */}
        {top.map((item, index) => {
          const radius = index === 0 ? 0 : 13 + (index - 1) * 7.6;
          const angle = (-90 + index * 61) * (Math.PI / 180);
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          const tilt = ((index * 53) % 70) - 35;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect?.(item);
                openLookInNative({
                  id: item.id,
                  name: item.name,
                  lipColor: item.colors[0] || '#E91E63'
                });
              }}
              title={`${index + 1}. ${item.name} · ${item.numericVotes.toLocaleString()} want this`}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%`, height: '23%' }}
              initial={{ opacity: 0, scale: 0.5, rotate: tilt * 2 }}
              animate={{ opacity: 1, scale: 1, rotate: tilt }}
              transition={{ type: 'spring', stiffness: 190, damping: 16, delay: index * 0.07 }}
              whileTap={{ scale: 0.92 }}
            >
              <img
                src="/products/lipstick.png"
                alt=""
                draggable={false}
                className="h-full w-auto drop-shadow-[0_4px_5px_rgba(40,28,24,0.45)]"
              />
              <span
                className="absolute -top-1.5 -right-2 w-[16px] h-[16px] rounded-full text-[8.5px] font-black flex items-center justify-center shadow-md"
                style={{ backgroundColor: item.colors[0] || '#E91E63', color: '#fff' }}
              >
                {index + 1}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Who is where, because a target shows the gap but not the names */}
      <div className="mt-3 space-y-1">
        {top.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-black text-stone-400 tabular-nums w-3 shrink-0">
              {index + 1}
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-white shadow-xs"
              style={{ backgroundColor: item.colors[0] }}
            />
            <span className="text-[10px] font-bold text-stone-700 truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
