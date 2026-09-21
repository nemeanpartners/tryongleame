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
 * How long is left in the challenge, as a lipstick wearing down.
 *
 * The clock used to be four numbers and a progress line, which reads as a
 * readout rather than a month running out. Here the bullet is worn down by as
 * much of the month as has gone: near the start it is new, by the last days
 * there is barely any left. The votes you still have to give are hearts, not
 * a bar.
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

  // The bullet: full height when the month opens, a stub by the end of it.
  const BULLET_MAX = 58;
  const bulletHeight = Math.max(6, BULLET_MAX * (1 - worn));

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
        {/* The lipstick, worn down by however much of the month has gone */}
        <div className="shrink-0 relative" style={{ width: 66, height: 116 }}>
          <svg width="66" height="116" viewBox="0 0 66 116">
            <defs>
              <linearGradient id="bulletFace" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F7C6D7" />
                <stop offset="45%" stopColor="#E91E63" />
                <stop offset="100%" stopColor="#AD1457" />
              </linearGradient>
              <linearGradient id="tubeFace" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#efe7e2" />
                <stop offset="100%" stopColor="#cbbcb3" />
              </linearGradient>
            </defs>

            {/* What is left of the bullet. Its base stays at the tube's
                mouth and the top comes down as the month is used up. */}
            <motion.rect
              x="21"
              width="24"
              rx="5"
              fill="url(#bulletFace)"
              initial={false}
              animate={{ y: 62 - bulletHeight, height: bulletHeight }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            />
            <motion.ellipse
              cx="33"
              rx="12"
              ry="4.5"
              fill="#F7C6D7"
              initial={false}
              animate={{ cy: 62 - bulletHeight }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            />

            {/* The tube */}
            <rect x="17" y="60" width="32" height="50" rx="6" fill="url(#tubeFace)" />
            <rect x="17" y="60" width="32" height="7" rx="3" fill="#B8887A" opacity="0.35" />
            <rect x="22" y="74" width="4" height="26" rx="2" fill="#ffffff" opacity="0.75" />
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
              {countdown.days === 1 ? 'day' : 'days'} of wear left
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
