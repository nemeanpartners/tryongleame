import React from 'react';
import { motion } from 'motion/react';

export interface DemandOrb {
  id: string;
  name: string;
  votes: number;
  colour: string;
}

interface DemandOrbsProps {
  orbs: DemandOrb[];
  /** The one or two orbs currently in the fusion tray. */
  selectedIds?: string[];
  onSelect: (orb: DemandOrb) => void;
}

/**
 * The tracked looks as orbs: the more people want one, the bigger it is.
 *
 * A ranked list says the same thing, but you have to read it. Here the board
 * is a shape - one glance and you know what is pulling ahead - and each orb
 * drifts on its own, so the cluster is never quite the same twice.
 */
const ORB_MIN = 54;
const ORB_MAX = 104;

/** Fixed seats around the middle, so the cluster never overlaps itself. */
const SEATS = [
  { x: 50, y: 52 },
  { x: 20, y: 34 },
  { x: 79, y: 31 },
  { x: 84, y: 68 },
  { x: 17, y: 74 },
  { x: 50, y: 90 },
  // Kept clear of the top edge: the largest orb is drawn from its centre, so
  // a seat any higher pushes it up into the heading above the field.
  { x: 50, y: 15 }
];

export const DemandOrbs: React.FC<DemandOrbsProps> = ({
  orbs,
  selectedIds = [],
  onSelect
}) => {
  if (orbs.length === 0) return null;

  const max = Math.max(...orbs.map((orb) => orb.votes), 1);
  const min = Math.min(...orbs.map((orb) => orb.votes), 0);
  const span = Math.max(1, max - min);

  return (
    <div className="relative w-full h-[228px] sm:h-[244px] mt-1">
      {orbs.slice(0, SEATS.length).map((orb, index) => {
        const seat = SEATS[index];
        const weight = (orb.votes - min) / span;
        const size = ORB_MIN + weight * (ORB_MAX - ORB_MIN);
        const pick = selectedIds.indexOf(orb.id);
        const isOn = pick >= 0;

        return (
          <motion.button
            key={orb.id}
            type="button"
            onClick={() => onSelect(orb)}
            title={`${orb.name} · ${orb.votes.toLocaleString()} want this`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-center cursor-pointer"
            style={{
              left: `${seat.x}%`,
              top: `${seat.y}%`,
              width: size,
              height: size,
              background: `radial-gradient(circle at 32% 26%, ${orb.colour}f2 0%, ${orb.colour}c4 42%, ${orb.colour}80 100%)`,
              boxShadow: isOn
                ? `0 0 0 2px #ffffff, 0 0 30px ${orb.colour}cc, inset 0 6px 16px rgba(255,255,255,0.45)`
                : `0 10px 24px ${orb.colour}59, inset 0 6px 16px rgba(255,255,255,0.4), inset 0 -8px 18px rgba(0,0,0,0.12)`
            }}
            // Each orb breathes on its own timing, so the cluster never looks
            // like a static diagram.
            animate={{
              y: [0, -7, 0, 5, 0],
              scale: isOn ? 1.06 : 1
            }}
            transition={{
              y: {
                duration: 7 + index * 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.5
              },
              scale: { type: 'spring', stiffness: 260, damping: 18 }
            }}
            whileTap={{ scale: 0.94 }}
          >
            {isOn && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[10px] font-black text-[#E91E63] flex items-center justify-center shadow-md">
                {pick + 1}
              </span>
            )}
            <span className="px-1.5">
              {/* The whole name: a shade you cannot read is not a choice */}
              <span
                className="block text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-tight leading-[1.15] text-white break-words"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
              >
                {orb.name}
              </span>
              {size > 74 && (
                <span
                  className="block text-[8.5px] font-bold text-white/85 tabular-nums mt-0.5"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
                >
                  {orb.votes >= 1000
                    ? `${(orb.votes / 1000).toFixed(1)}k`
                    : orb.votes}
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
