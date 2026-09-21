import React from 'react';
import { motion } from 'motion/react';
import { WantedLookItem } from './WantedQuickActionCard';
import { openLookInNative } from '../../lib/nativeLooks';

interface TargetBoardProps {
  items: WantedLookItem[];
  onSelect?: (item: WantedLookItem) => void;
}

/** A lipstick lying where it landed, in the shade it is. */
const Bullet: React.FC<{ colour: string }> = ({ colour }) => (
  <svg
    viewBox="0 0 26 54"
    className="w-full h-full overflow-visible drop-shadow-[0_3px_4px_rgba(60,44,38,0.4)]"
  >
    <defs>
      <linearGradient id={`bullet-${colour.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={colour} stopOpacity="0.72" />
        <stop offset="42%" stopColor={colour} />
        <stop offset="100%" stopColor={colour} stopOpacity="0.62" />
      </linearGradient>
    </defs>
    {/* case */}
    <rect x="6" y="20" width="14" height="32" rx="2.5" fill="#e8ded6" stroke="#9c8b80" strokeWidth="1" />
    <rect x="6" y="20" width="14" height="5" rx="2" fill="#b7a89d" />
    <rect x="8.5" y="27" width="2.5" height="20" rx="1.2" fill="#fff" opacity="0.8" />
    {/* bullet */}
    <path
      d="M7 20 V8.5 C7 4 10.5 1 15 1 L19 1 L19 20 Z"
      fill={`url(#bullet-${colour.replace('#', '')})`}
    />
  </svg>
);

/**
 * The top ten, as shots on a target.
 *
 * A list tells you the order. This tells you the gap: the most wanted shade is
 * in the black, and everything else is as far out as it is behind. Tap one to
 * wear it.
 */
export const TargetBoard: React.FC<TargetBoardProps> = ({ items, onSelect }) => {
  const top = items.slice(0, 10);
  if (top.length === 0) return null;

  return (
    <div className="glass-card rounded-[28px] p-5 sm:p-6 text-left font-montserrat">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
        On target
      </span>
      <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight mt-0.5">
        The top ten
      </h3>
      <p className="text-[11px] text-stone-500 font-medium mt-1">
        Closer to the black is closer to being made. Tap one to wear it.
      </p>

      <div className="relative w-full mt-4" style={{ aspectRatio: '1 / 1' }}>
        {/* The target */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <rect width="100" height="100" rx="6" fill="#f7f4f1" />
          {[48, 42, 36, 30].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#cbbfb6" strokeWidth="0.4" />
          ))}
          <circle cx="50" cy="50" r="27" fill="#1b1512" />
          {[20, 13, 6].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.4"
              opacity="0.7"
            />
          ))}
          {/* The numbers along the middle, as a target carries them */}
          {[
            { x: 4, n: '1' },
            { x: 12, n: '2' },
            { x: 20, n: '3' },
            { x: 32, n: '5' },
            { x: 40, n: '7' },
            { x: 60, n: '7' },
            { x: 68, n: '5' },
            { x: 80, n: '3' },
            { x: 88, n: '2' },
            { x: 96, n: '1' }
          ].map((mark) => (
            <text
              key={`${mark.x}-${mark.n}`}
              x={mark.x}
              y="52"
              textAnchor="middle"
              fontSize="4.6"
              fontWeight="700"
              fill={mark.x > 26 && mark.x < 74 ? '#ffffff' : '#8d7f76'}
              opacity="0.75"
            >
              {mark.n}
            </text>
          ))}
        </svg>

        {/* Where each one landed */}
        {top.map((item, index) => {
          // Rank sets the distance out; the golden angle keeps them apart.
          const radius = 9 + index * 3.9;
          const angle = (-70 + index * 137.5) * (Math.PI / 180);
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          const tilt = ((index * 47) % 90) - 45;
          const colour = item.colors[0] || '#E91E63';

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect?.(item);
                openLookInNative({ id: item.id, name: item.name, lipColor: colour });
              }}
              title={`${index + 1}. ${item.name} · ${item.numericVotes.toLocaleString()} want this`}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%`, width: '12%', height: '24%' }}
              initial={{ opacity: 0, scale: 0.4, rotate: tilt * 3 }}
              animate={{ opacity: 1, scale: 1, rotate: tilt }}
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 15,
                delay: index * 0.06
              }}
              whileTap={{ scale: 0.92 }}
            >
              <Bullet colour={colour} />
              <span className="absolute -top-1.5 -left-1.5 w-[16px] h-[16px] rounded-full bg-white text-[8px] font-black text-stone-900 flex items-center justify-center shadow-md">
                {index + 1}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Who is where, in words */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
        {top.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-black text-stone-400 tabular-nums w-4 shrink-0">
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
