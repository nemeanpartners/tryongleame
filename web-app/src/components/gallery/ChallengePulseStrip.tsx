import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Flame, Users, Heart } from 'lucide-react';
import { ChallengeSubmission } from '../../types';
import { useCountUp, useCountdown, endOfThisMonth, startOfThisMonth } from '../../lib/liveCounters';

interface ChallengePulseStripProps {
  submissions: ChallengeSubmission[];
  /** Ids the viewer has voted on, so the strip can show their own part in it. */
  votedIds: string[];
  onEnter: () => void;
}

/** Everyone gets ten votes a month to give away. */
const VOTE_GOAL = 10;

/**
 * How long is left in the challenge, as an hourglass of lip gloss.
 *
 * The clock used to be four numbers and a progress line, which reads as a
 * readout rather than a month running out. Here the top bulb holds what is
 * left of the month and the bottom holds what has gone, with a thread of gloss
 * running between them - so how long you have is a glance, not a sum. The
 * votes you still have to give are hearts, not a bar.
 */
export const ChallengePulseStrip: React.FC<ChallengePulseStripProps> = ({
  submissions,
  votedIds,
  onEnter
}) => {
  const deadline = useMemo(() => endOfThisMonth(), []);
  const opened = useMemo(() => startOfThisMonth(), []);
  const countdown = useCountdown(deadline, opened);

  const totalVotes = useMemo(
    () => submissions.reduce((sum, entry) => sum + (entry.votes || 0), 0),
    [submissions]
  );
  const animatedVotes = useCountUp(totalVotes);
  const animatedEntries = useCountUp(submissions.length);

  const votedCount = Math.min(votedIds.length, VOTE_GOAL);

  /* The gloss in each bulb, as paths.
     Top: a pile with the dip in the middle that a draining one always has.
     Bottom: a mound rising as it collects. Both are driven by `worn`, which is
     the real fraction of the month that has passed. */
  const TOP_FLOOR = 90;   // where the top bulb narrows into the waist
  const TOP_CEILING = 14; // a full bulb
  const BOTTOM_FLOOR = 160;
  const BOTTOM_CEILING = 86;
  const closingSoon = countdown.days <= 3;
  const worn = Math.min(0.92, Math.max(0, countdown.elapsed));

  const topLevel = TOP_FLOOR - (1 - worn) * (TOP_FLOOR - TOP_CEILING);
  const topSand =
    worn >= 0.995
      ? `M14 ${TOP_FLOOR} L86 ${TOP_FLOOR} Z`
      : `M10 ${topLevel} Q50 ${topLevel + 16} 90 ${topLevel} L90 ${TOP_FLOOR} L10 ${TOP_FLOOR} Z`;

  const moundTop = BOTTOM_FLOOR - worn * (BOTTOM_FLOOR - BOTTOM_CEILING);
  const bottomSand = `M6 ${BOTTOM_FLOOR} L94 ${BOTTOM_FLOOR} L94 ${moundTop + 18} Q50 ${moundTop - 10} 6 ${moundTop + 18} Z`;

  const closesOn = new Date(deadline).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="glass-card p-5 text-left relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
          <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Challenge live
          </span>
          {closingSoon && (
            <span className="px-2 py-0.5 rounded-full bg-[#FDF1F4] border border-[#F7C6D7] text-[9px] font-black uppercase tracking-wider text-[#E91E63] flex items-center gap-1">
              <Flame className="w-2.5 h-2.5" /> last days
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="neu-pill px-3.5 py-1.5 text-xs font-bold text-[#2A1715] hover:brightness-[1.03] active:scale-95 transition-all cursor-pointer"
        >
          Enter this month
        </button>
      </div>

      <div className="mt-4 flex items-end gap-4 relative z-10">
        {/* A real hourglass: two glass bulbs, a clear waist, and lip gloss
            instead of sand. How much sits in each bulb is how much of the
            month has actually gone. */}
        <div className="shrink-0 relative" style={{ width: 84, height: 132 }}>
          <svg width="84" height="132" viewBox="0 0 100 170">
            <defs>
              <linearGradient id="glossSand" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E7A9B4" />
                <stop offset="38%" stopColor="#D98B9B" />
                <stop offset="100%" stopColor="#BF6C7E" />
              </linearGradient>
              <radialGradient id="bulbGlass" cx="0.34" cy="0.28" r="0.85">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.72" />
                <stop offset="58%" stopColor="#ffffff" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#c9bdb8" stopOpacity="0.3" />
              </radialGradient>
              <clipPath id="topGlass">
                <ellipse cx="50" cy="52" rx="40" ry="42" />
              </clipPath>
              <clipPath id="bottomGlass">
                <ellipse cx="50" cy="120" rx="40" ry="42" />
              </clipPath>
            </defs>

            {/* Glass */}
            <ellipse cx="50" cy="52" rx="40" ry="42" fill="url(#bulbGlass)" />
            <ellipse cx="50" cy="120" rx="40" ry="42" fill="url(#bulbGlass)" />
            {/* The waist, where the two bulbs are drawn together */}
            <path
              d="M32 78 C40 84 44 84 46 88 L46 92 C44 96 40 96 32 102
                 L68 102 C60 96 56 96 54 92 L54 88 C56 84 60 84 68 78 Z"
              fill="#ffffff"
              opacity="0.55"
            />

            {/* What is left of the month, resting in the top bulb with the dip
                a draining pile always has in the middle */}
            <g clipPath="url(#topGlass)">
              <motion.path
                initial={false}
                animate={{ d: topSand }}
                transition={{ type: 'spring', stiffness: 70, damping: 22 }}
                fill="url(#glossSand)"
              />
            </g>

            {/* The thread running through the waist */}
            {!countdown.done && (
              <g>
                <rect x="48.6" y="88" width="2.8" height="34" fill="url(#glossSand)" opacity="0.6" />
                {[0, 1, 2].map((drop) => (
                  <motion.circle
                    key={drop}
                    cx="50"
                    r="2.2"
                    fill="#D98B9B"
                    initial={{ cy: 90, opacity: 0 }}
                    animate={{ cy: [90, 148], opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      delay: drop * 0.53,
                      ease: 'easeIn'
                    }}
                  />
                ))}
              </g>
            )}

            {/* What has gone, piled up in the bottom bulb */}
            <g clipPath="url(#bottomGlass)">
              <motion.path
                initial={false}
                animate={{ d: bottomSand }}
                transition={{ type: 'spring', stiffness: 70, damping: 22 }}
                fill="url(#glossSand)"
              />
            </g>

            {/* Glass edges and highlights, over everything */}
            <ellipse cx="50" cy="52" rx="40" ry="42" fill="none" stroke="rgba(120,104,98,0.3)" strokeWidth="1.6" />
            <ellipse cx="50" cy="120" rx="40" ry="42" fill="none" stroke="rgba(120,104,98,0.3)" strokeWidth="1.6" />
            <path d="M22 34 C16 46 16 60 22 72" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M22 102 C16 114 16 128 22 140" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M74 38 C78 46 79 54 77 62" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.5" />
          </svg>
        </div>

        {/* How long that is in days */}
        <div className="grow min-w-0">
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={countdown.days}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[38px] leading-none font-display font-black text-stone-900 tabular-nums"
            >
              {countdown.days}
            </motion.span>
            <span className="text-sm font-black text-stone-500">
              {countdown.days === 1 ? 'day' : 'days'} left to enter
            </span>
          </div>
          <p className="text-[11px] font-bold text-stone-400 mt-1 tabular-nums">
            closes {closesOn} · {countdown.days}d {countdown.hours}h{' '}
            {countdown.minutes}m left
          </p>

          {/* Who is in, without a table of figures */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="neu-pill px-2.5 py-1 text-[10px] font-bold text-stone-700 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-[#B8887A]" />
              <span className="tabular-nums">{animatedEntries}</span> in
            </span>
            <span className="neu-pill px-2.5 py-1 text-[10px] font-bold text-stone-700 flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-[#E91E63] fill-[#F7C6D7]" />
              <span className="tabular-nums">{animatedVotes.toLocaleString()}</span> votes
            </span>
          </div>
        </div>
      </div>

      {/* Your ten votes, as kisses to give away */}
      <div className="mt-4 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
            Your votes this month
          </span>
          <span className="text-[10px] font-black text-stone-400 tabular-nums">
            {votedCount}/{VOTE_GOAL}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {Array.from({ length: VOTE_GOAL }, (_, index) => {
            const given = index < votedCount;
            return (
              <motion.span
                key={index}
                className="grow"
                initial={false}
                animate={{ scale: given ? 1 : 0.86, opacity: given ? 1 : 0.4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18, delay: index * 0.02 }}
              >
                <svg viewBox="0 0 24 18" className="w-full h-4">
                  <path
                    d="M12 17C6.5 13.5 2 10.4 2 6.6 2 3.9 4.1 2 6.7 2 8.6 2 10.4 3 12 5.1 13.6 3 15.4 2 17.3 2 19.9 2 22 3.9 22 6.6 22 10.4 17.5 13.5 12 17Z"
                    fill={given ? '#E91E63' : 'none'}
                    stroke={given ? '#E91E63' : '#C9BDB6'}
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
            );
          })}
        </div>
        <p className="text-[9.5px] font-bold text-stone-400 mt-1.5">
          {votedCount >= VOTE_GOAL
            ? 'All ten given. Come back next month for more.'
            : `${VOTE_GOAL - votedCount} left to give before the month closes`}
        </p>
      </div>
    </div>
  );
};
