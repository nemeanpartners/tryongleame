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
  const closingSoon = countdown.days <= 3;
  const worn = Math.min(0.92, Math.max(0, countdown.elapsed));

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
        {/* An hourglass of lip gloss: the top bulb empties as the month
            goes, the bottom fills, and it keeps running while you watch. */}
        <div className="shrink-0 relative" style={{ width: 74, height: 124 }}>
          <svg width="74" height="124" viewBox="0 0 70 120">
            <defs>
              <linearGradient id="glossPink" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F9C9D8" />
                <stop offset="42%" stopColor="#F4A6BE" />
                <stop offset="100%" stopColor="#E0819F" />
              </linearGradient>
              <linearGradient id="capPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBD5E0" />
                <stop offset="55%" stopColor="#F2A9C0" />
                <stop offset="100%" stopColor="#D98AA5" />
              </linearGradient>
              <linearGradient id="glassBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#e7dcd8" stopOpacity="0.55" />
              </linearGradient>
              <clipPath id="topBulb">
                <path d="M12 15 H58 C58 39 45 53 36 61 C27 53 12 39 12 15 Z" />
              </clipPath>
              <clipPath id="bottomBulb">
                <path d="M36 61 C45 69 58 83 58 105 H12 C12 83 27 69 36 61 Z" />
              </clipPath>
            </defs>

            {/* Glass */}
            <path
              d="M12 15 H58 C58 39 45 53 36 61 C27 53 12 39 12 15 Z"
              fill="url(#glassBody)"
            />
            <path
              d="M36 61 C45 69 58 83 58 105 H12 C12 83 27 69 36 61 Z"
              fill="url(#glassBody)"
            />

            {/* What is left of the month, still in the top */}
            <g clipPath="url(#topBulb)">
              <motion.rect
                x="10"
                width="50"
                fill="url(#glossPink)"
                initial={false}
                animate={{ y: 15 + worn * 46, height: Math.max(0, 46 - worn * 46) + 2 }}
                transition={{ type: 'spring', stiffness: 70, damping: 22 }}
              />
            </g>

            {/* The thread of gloss running through the neck */}
            {!countdown.done && (
              <g clipPath="url(#bottomBulb)">
                <rect x="34.4" y="61" width="3.2" height="30" fill="url(#glossPink)" opacity="0.55" />
                {[0, 1, 2].map((drop) => (
                  <motion.circle
                    key={drop}
                    cx="36"
                    r="2.4"
                    fill="#F2A9C0"
                    initial={{ cy: 62, opacity: 0 }}
                    animate={{ cy: [62, 100], opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: drop * 0.5,
                      ease: 'easeIn'
                    }}
                  />
                ))}
              </g>
            )}

            {/* What has already gone, pooled in the bottom */}
            <g clipPath="url(#bottomBulb)">
              <motion.rect
                x="10"
                width="50"
                fill="url(#glossPink)"
                initial={false}
                animate={{ y: 105 - worn * 42, height: worn * 42 + 2 }}
                transition={{ type: 'spring', stiffness: 70, damping: 22 }}
              />
              <motion.ellipse
                rx="21"
                ry="7"
                fill="url(#glossPink)"
                initial={false}
                animate={{ cx: 35, cy: 105 - worn * 42 }}
                transition={{ type: 'spring', stiffness: 70, damping: 22 }}
              />
            </g>

            {/* Caps */}
            <rect x="5" y="2" width="60" height="12" rx="6" fill="url(#capPink)" />
            <rect x="3" y="104" width="64" height="14" rx="7" fill="url(#capPink)" />
            <rect x="12" y="4.5" width="22" height="3" rx="1.5" fill="#fff" opacity="0.6" />
            <rect x="10" y="107" width="26" height="3.5" rx="1.75" fill="#fff" opacity="0.55" />

            {/* Glass highlights */}
            <path d="M17 18 C17 34 24 45 30 52" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75" />
            <path d="M17 100 C17 86 23 74 29 68" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
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
            closes {closesOn} · {String(countdown.hours).padStart(2, '0')}h{' '}
            {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
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
