import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Flame, Timer, Users, TrendingUp } from 'lucide-react';
import { ChallengeSubmission } from '../../types';
import {
  useCountUp,
  useCountdown,
  endOfThisMonth,
  startOfThisMonth
} from '../../lib/liveCounters';

interface ChallengePulseStripProps {
  submissions: ChallengeSubmission[];
  /** Ids the viewer has voted on, so the strip can show their own part in it. */
  votedIds: string[];
  onEnter: () => void;
}

const pad = (value: number) => value.toString().padStart(2, '0');

/**
 * The state of this month's challenge at a glance: how long is left, how many
 * people are in, how the votes are moving, and where the viewer stands in it.
 * It ticks, so there is always something new to come back to.
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
  const entrants = useMemo(
    () => new Set(submissions.map((entry) => entry.username || entry.id)).size,
    [submissions]
  );

  const animatedVotes = useCountUp(totalVotes);
  const animatedEntries = useCountUp(submissions.length);
  const animatedEntrants = useCountUp(entrants);

  const votedCount = votedIds.length;
  // Something to finish: everyone starts the month with ten votes to give.
  const voteGoal = 10;
  const voteProgress = Math.min(100, Math.round((votedCount / voteGoal) * 100));
  const closingSoon = countdown.days <= 3;

  const stats = [
    { icon: Users, label: 'entries', value: animatedEntries },
    { icon: TrendingUp, label: 'votes cast', value: animatedVotes },
    { icon: Flame, label: 'creators in', value: animatedEntrants }
  ];

  return (
    <div className="glass-card p-4 sm:p-5 text-left relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
          <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Challenge live
          </span>
          {closingSoon && (
            <span className="px-2 py-0.5 rounded-full bg-[#FDF1F4] border border-[#F7C6D7] text-[9px] font-black uppercase tracking-wider text-[#E91E63] flex items-center gap-1">
              <Flame className="w-2.5 h-2.5" /> closing soon
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

      {/* The clock */}
      <div className="mt-3 flex items-end gap-2">
        <Timer className="w-4 h-4 text-[#E91E63] mb-1.5 shrink-0" />
        <div className="flex items-end gap-1.5">
          {[
            { value: countdown.days, unit: 'd' },
            { value: countdown.hours, unit: 'h' },
            { value: countdown.minutes, unit: 'm' },
            { value: countdown.seconds, unit: 's' }
          ].map((part) => (
            <div key={part.unit} className="flex items-end">
              <span
                key={`${part.unit}-${part.value}`}
                className="text-xl sm:text-2xl font-display font-black text-stone-900 tabular-nums count-pop leading-none"
              >
                {pad(part.value)}
              </span>
              <span className="text-[10px] font-black text-stone-400 ml-0.5 mb-0.5">
                {part.unit}
              </span>
            </div>
          ))}
        </div>
        <span className="text-[10px] font-bold text-stone-400 mb-1">until entries close</span>
      </div>

      {/* How much of the month has gone */}
      <div className="mt-2.5 h-1.5 rounded-full bg-white/70 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#F7C6D7] to-[#E91E63]"
          initial={false}
          animate={{ width: `${Math.round(countdown.elapsed * 100)}%` }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
        />
      </div>

      {/* The numbers */}
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="neu-inset px-2.5 py-2 text-center">
            <stat.icon className="w-3.5 h-3.5 text-[#B8887A] mx-auto" />
            <p className="text-base sm:text-lg font-display font-black text-stone-900 tabular-nums leading-tight mt-0.5">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* The viewer's own part in it */}
      <div className="mt-3 flex items-center gap-3">
        <div className="grow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Your votes this month
            </span>
            <span className="text-[10px] font-black text-stone-500 tabular-nums">
              {Math.min(votedCount, voteGoal)}/{voteGoal}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-white/70 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#B8887A] to-[#2A1715]"
              initial={false}
              animate={{ width: `${voteProgress}%` }}
              transition={{ type: 'spring', stiffness: 130, damping: 20 }}
            />
            {voteProgress >= 100 && (
              <div className="absolute inset-0 shimmer-sweep pointer-events-none" />
            )}
          </div>
          <p className="text-[9.5px] font-bold text-stone-400 mt-1">
            {voteProgress >= 100
              ? 'All ten given. Come back tomorrow for the next round.'
              : `${voteGoal - votedCount} left to give before the month closes`}
          </p>
        </div>
      </div>
    </div>
  );
};
