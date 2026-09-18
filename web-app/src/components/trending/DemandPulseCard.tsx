import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, RefreshCw, X } from 'lucide-react';
import { useCountUp } from '../../lib/liveCounters';

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
  onSelectTopRising: () => void;
  onApplyHotFormula: () => void;
  onInspectTotal: () => void;
  toast: string | null;
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

/** A ring that fills to a fraction, drawn as a stroked circle. */
const RING_SIZE = 132;
const RING_STROKE = 9;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * The state of demand, as one instrument rather than a row of boxes: a ring
 * that fills as the leading category pulls ahead, a curve of the board behind
 * it, category bars that reorder as they move, and a ticker of what is
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
  onSelectTopRising,
  onApplyHotFormula,
  onInspectTotal,
  toast
}) => {
  const animatedTotal = useCountUp(totalVotes);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [ripples, setRipples] = useState<number[]>([]);
  const lastTotal = useRef(totalVotes);
  const [changedAt, setChangedAt] = useState(Date.now());

  // The clock only means something if it keeps running.
  useEffect(() => {
    if (lastTotal.current !== totalVotes) {
      lastTotal.current = totalVotes;
      setChangedAt(Date.now());
      // Every change leaves a ring behind it, so movement is visible even if
      // you look away for a second.
      const id = Date.now();
      setRipples((prev) => [...prev, id]);
      window.setTimeout(
        () => setRipples((prev) => prev.filter((r) => r !== id)),
        1200
      );
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

  // The board's leading proposals as bars. A line looked broken whenever
  // several proposals sat on the same count, which is most of the time.
  const bars = useMemo(() => {
    const points = leaders.slice(0, 14).map((entry) => entry.votes);
    const max = Math.max(...points, 1);
    return points.map((value) => Math.max(0.12, value / max));
  }, [leaders]);

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

      {/* The instrument: ring, curve, ticker */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 relative z-10">
        {/* Ring */}
        <button
          type="button"
          onClick={onInspectTotal}
          className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
          style={{ width: RING_SIZE, height: RING_SIZE }}
          title="Tap to track the whole board"
        >
          {/* Each new vote leaves a ring expanding out of the dial */}
          <AnimatePresence>
            {ripples.map((id) => (
              <motion.span
                key={id}
                className="absolute inset-0 rounded-full border border-[#E91E63]/50 pointer-events-none"
                initial={{ scale: 0.82, opacity: 0.8 }}
                animate={{ scale: 1.25, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>

          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
          >
            <defs>
              <linearGradient id="pulseRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F7C6D7" />
                <stop offset="55%" stopColor="#E91E63" />
                <stop offset="100%" stopColor="#2A1715" />
              </linearGradient>
            </defs>
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth={RING_STROKE}
            />
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="url(#pulseRing)"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              initial={false}
              animate={{ strokeDashoffset: RING_LENGTH * (1 - ringFraction) }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
              Total votes
            </span>
            <span className="text-2xl font-display font-black text-stone-900 tabular-nums leading-none mt-0.5">
              {animatedTotal.toLocaleString()}
            </span>
            <span className="text-[9.5px] font-bold text-[#E91E63] tabular-nums mt-1">
              +{votesToday} today
            </span>
            {/* Say what the ring is measuring, or it is just a shape. */}
            {top && top.percentage > 0 && (
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-stone-400 mt-1">
                {top.name} leads {top.percentage}%
              </span>
            )}
          </div>
        </button>

        {/* Curve and ticker */}
        <div className="grow min-w-0 w-full">
          <button
            type="button"
            onClick={onSelectTopRising}
            title={`Filter the board for '${topRising}'`}
            className="group neu-inset w-full px-3.5 py-3 text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-stone-400 tracking-wider uppercase">
                Top rising
              </span>
              <ArrowUpRight className="w-3 h-3 text-stone-400 group-hover:text-[#E91E63] transition-colors" />
            </div>
            <div className="text-sm sm:text-base font-black text-stone-900 tracking-tight leading-snug mt-1 line-clamp-2">
              {topRising}
            </div>

            {/* The shape of the board behind it */}
            {bars.length > 1 && (
              <div className="flex items-end gap-[3px] h-8 mt-2.5">
                {bars.map((height, index) => (
                  <motion.span
                    key={index}
                    className="grow rounded-full bg-gradient-to-t from-[#F7C6D7] to-[#E91E63]"
                    initial={{ height: 2, opacity: 0.35 }}
                    animate={{ height: `${height * 100}%`, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 140,
                      damping: 18,
                      delay: index * 0.035
                    }}
                  />
                ))}
              </div>
            )}
          </button>

          {/* What is climbing, scrolling past */}
          {ticker.length > 0 && (
            <div className="mt-2.5 overflow-hidden relative h-5">
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
      </div>

      {/* Category bars: they move, so the order is worth watching */}
      <div className="mt-5 space-y-2 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 block">
            Cosmetic category popularity
          </span>
          {activeCategoryFilter && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="text-[10px] font-bold text-[#2A1715] hover:text-[#E91E63] cursor-pointer flex items-center gap-0.5"
            >
              <span>Reset filter</span>
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {categories.slice(0, 4).map((stat) => {
            const isSelected = activeCategoryFilter === stat.name;
            return (
              <motion.button
                key={stat.name}
                layout
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : stat.name)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  isSelected ? 'bg-white/80' : 'hover:bg-white/60'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: colourFor(stat.name) }}
                />
                <span className="text-[11px] font-bold text-stone-700 w-16 shrink-0 text-left">
                  {stat.name}
                </span>
                <span className="grow h-2 rounded-full bg-white/70 overflow-hidden relative">
                  <motion.span
                    className="block h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${colourFor(stat.name)}55, ${colourFor(stat.name)})`
                    }}
                    initial={false}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ type: 'spring', stiffness: 110, damping: 20 }}
                  />
                  {isSelected && (
                    <span className="absolute inset-0 shimmer-sweep pointer-events-none" />
                  )}
                </span>
                <span className="text-[11px] font-black text-stone-900 tabular-nums w-9 text-right shrink-0">
                  {stat.percentage}%
                </span>
              </motion.button>
            );
          })}
        </div>
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
