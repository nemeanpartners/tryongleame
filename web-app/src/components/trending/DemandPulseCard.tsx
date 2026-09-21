import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Play } from 'lucide-react';
import { MakeupBagFill } from './MakeupBagFill';
import { CategoryBars } from './CategorySquare';

export interface DemandCategoryStat {
  name: string;
  value: number;
  percentage: number;
}

interface DemandPulseCardProps {
  totalVotes: number;
  votesToday: number;
  proposalsToday: number;
  backedByYou: number;
  categories: DemandCategoryStat[];
  topRising: string;
  /** The board itself, for the demand curve and the ticker. */
  leaders: { title: string; votes: number }[];
  activeCategoryFilter: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectCategory: (name: string | null) => void;
  /** Wear the shade that is climbing, before deciding to vote for it. */
  onTryTopRising: () => void;
  onApplyHotFormula: () => void;
  onInspectTotal: () => void;
  toast: string | null;
  /** True the first time the board is opened in this app session. */
  playDrop: boolean;
  onDropFinished: () => void;
}

/** Each category keeps its own dot colour across the card. */
const CATEGORY_COLOURS: Record<string, string> = {
  Eyes: '#2A1715',
  Lips: '#E91E63',
  Blush: '#B8887A',
  Highlight: '#D8A7B1',
  'Full Face': '#7A5C52',
  Other: '#C9BDB6'
};

const colourFor = (name: string) => CATEGORY_COLOURS[name] || '#C9BDB6';

/**
 * The state of demand, as one instrument rather than a row of boxes: a ring
 * that fills as the leading category pulls ahead, a curve of the board behind
 * category bars that reorder as they move, and a ticker of what is
 * climbing. Everything on it is the real board - nothing here is decoration
 * standing in for data.
 */
export const DemandPulseCard: React.FC<DemandPulseCardProps> = ({
  totalVotes,
  votesToday,
  proposalsToday,
  backedByYou,
  categories,
  topRising,
  leaders,
  activeCategoryFilter,
  isRefreshing,
  onRefresh,
  onSelectCategory,
  onTryTopRising,
  onApplyHotFormula,
  onInspectTotal,
  toast,
  playDrop,
  onDropFinished
}) => {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastTotal = useRef(totalVotes);
  const [changedAt, setChangedAt] = useState(Date.now());

  // The clock only means something if it keeps running.
  useEffect(() => {
    if (lastTotal.current !== totalVotes) {
      lastTotal.current = totalVotes;
      setChangedAt(Date.now());
    }
  }, [totalVotes]);

  useEffect(() => {
    const tick = window.setInterval(
      () => setSecondsAgo(Math.floor((Date.now() - changedAt) / 1000)),
      1000
    );
    return () => window.clearInterval(tick);
  }, [changedAt]);

  const top = categories[0];
  const ringFraction = top && totalVotes > 0 ? Math.min(1, top.value / totalVotes) : 0;

  const ticker = leaders.slice(0, 5);

  return (
    <div className="glass-card rounded-[28px] p-5 sm:p-6 text-left relative overflow-hidden font-montserrat">
      {/* A slow wash behind the card, so it never looks switched off */}
      <motion.div
        aria-hidden
        className="absolute -top-16 -right-10 w-52 h-52 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(233,30,99,0.16) 0%, rgba(233,30,99,0) 70%)'
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block">
            Demand Pulse
          </span>
          <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight mt-0.5">
            What&apos;s wanted now
          </h3>
          <p className="text-[10px] font-bold text-stone-400 mt-1 flex flex-wrap items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
            <span>updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}</span>
            <span className="text-stone-300">·</span>
            <span className="tabular-nums">{proposalsToday} new today</span>
            {backedByYou > 0 && (
              <>
                <span className="text-stone-300">·</span>
                <span className="tabular-nums text-[#E91E63]">
                  you backed {backedByYou}
                </span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Sync the live tracker"
          className="neu-pill inline-flex items-center gap-1.5 px-3 py-1 text-stone-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        >
          {isRefreshing ? (
            <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#E91E63]" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
          )}
          <span>LIVE</span>
        </button>
      </div>

      {/* What is wanted, as a bag filling up */}
      <div className="mt-2 relative z-10">
        <MakeupBagFill
          totalVotes={totalVotes}
          votesToday={votesToday}
          categories={categories}
          play={playDrop}
          onFinished={onDropFinished}
        />
      </div>

      {/* Top rising, kept to one line so the bag is what the card is about */}
      <div className="mt-3 relative z-10">
        <button
          type="button"
          onClick={onTryTopRising}
          title={`Try on ${topRising}`}
          className="group neu-pill w-full px-3.5 py-2.5 text-left cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
              Top rising
            </span>
            {/* Wearing it is how you decide whether to vote for it */}
            <span className="text-[9px] font-black uppercase tracking-wider text-[#E91E63] flex items-center gap-1 shrink-0">
              <Play className="w-2.5 h-2.5 fill-current" />
              Try on
            </span>
          </div>
          <span className="block text-[12.5px] font-black text-stone-900 leading-snug mt-1">
            {topRising}
          </span>
        </button>

        {/* What is climbing, scrolling past */}
        {ticker.length > 0 && (
          <div className="mt-2 overflow-hidden relative h-5">
            <motion.div
              className="flex items-center gap-4 absolute whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
            >
              {[...ticker, ...ticker].map((entry, index) => (
                <span
                  key={`${entry.title}-${index}`}
                  className="text-[10.5px] font-bold text-stone-500 flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-[#E91E63]" />
                  <span className="text-stone-900">{entry.title}</span>
                  <span className="tabular-nums text-stone-400">
                    {entry.votes.toLocaleString()} votes
                  </span>
                </span>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* The tally: what is in the bag, product by product */}
      <div className="mt-4 relative z-10">
        <CategoryBars
          categories={categories}
          activeCategoryFilter={activeCategoryFilter}
          onSelectCategory={onSelectCategory}
        />
      </div>

      {/* Hot now */}
      <button
        type="button"
        onClick={onApplyHotFormula}
        title="Load this formula into the proposal builder"
        className="w-full mt-4 p-3 sm:p-3.5 neu-inset text-xs text-stone-700 font-medium flex items-center justify-between gap-2 text-left transition-all active:scale-[0.99] cursor-pointer group relative z-10"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#E91E63] shrink-0 text-sm group-hover:scale-110 transition-transform">
            ✦
          </span>
          <span className="leading-snug">Hot now: velvet plum + holographic pearl</span>
        </div>
        <span className="text-[10px] font-extrabold uppercase text-[#E91E63] tracking-wider opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline whitespace-nowrap">
          Try formula →
        </span>
      </button>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="mt-3 px-3 py-1.5 rounded-xl bg-[#2A1715]/10 border border-[#2A1715]/20 text-[11px] font-bold text-[#2A1715] flex items-center justify-center gap-1.5 relative z-10"
        >
          <span>{toast}</span>
        </motion.div>
      )}
    </div>
  );
};
