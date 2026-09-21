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
 * readout rather than a month running out. The glass is the photograph, with
 * its own sand taken out of it; what sits in each bulb is drawn behind it at
 * the level the month is really at. The votes you still have to give are
 * hearts, not a bar.
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
  /** How much of the month has run out, which is what the glass shows. */
  const worn = Math.min(1, Math.max(0, countdown.elapsed));

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
        {/* The hourglass itself, photographed. Its glass was emptied so the
            gloss behind it can sit at the level the month is actually at. */}
        <div className="shrink-0 relative" style={{ width: 76, height: 150 }}>
          {/* What is left of the month, in the top bulb */}
          <div
            className="absolute overflow-hidden"
            style={{ left: '8%', top: '7%', width: '84%', height: '42%', borderRadius: '50%' }}
          >
            <motion.div
              className="absolute inset-x-0 bottom-0"
              initial={false}
              animate={{ height: `${Math.max(0, (1 - worn) * 100)}%` }}
              transition={{ type: 'spring', stiffness: 70, damping: 22 }}
              style={{ background: 'linear-gradient(180deg, #D98B9B 0%, #C2707F 100%)' }}
            />
          </div>

          {/* The thread through the waist */}
          {!countdown.done && (
            <div
              className="absolute overflow-hidden"
              style={{ left: '46%', top: '48%', width: '8%', height: '16%' }}
            >
              <div className="absolute inset-x-[42%] inset-y-0 bg-[#D98B9B] opacity-70" />
              {[0, 1, 2].map((drop) => (
                <motion.span
                  key={drop}
                  className="absolute left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-[#C2707F]"
                  initial={{ top: '0%', opacity: 0 }}
                  animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: drop * 0.5, ease: 'easeIn' }}
                />
              ))}
            </div>
          )}

          {/* What has gone, pooled in the bottom bulb */}
          <div
            className="absolute overflow-hidden"
            style={{ left: '8%', top: '58%', width: '84%', height: '37%', borderRadius: '50%' }}
          >
            <motion.div
              className="absolute inset-x-0 bottom-0"
              initial={false}
              animate={{ height: `${Math.max(4, worn * 100)}%` }}
              transition={{ type: 'spring', stiffness: 70, damping: 22 }}
              style={{ background: 'linear-gradient(180deg, #D98B9B 0%, #B9677A 100%)' }}
            />
          </div>

          {/* The glass, over the gloss */}
          <img
            src="/challenge/hourglass-glass.png"
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
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
