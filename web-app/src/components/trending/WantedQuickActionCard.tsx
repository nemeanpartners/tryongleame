import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, ChevronRight, Flame, ArrowUp, ArrowDown, Crown } from 'lucide-react';
import { WantedListViewModal } from './WantedListViewModal';
import { WANTED_LOOKS_100 } from '../../data/wantedLooks100';
import { subscribeWantedLooks, voteWantedLookInFirestore } from '../../services/wantedLooksService';
import { useCountUp } from '../../lib/liveCounters';

export interface WantedLookItem {
  id: string;
  name: string;
  countLabel: string;
  numericVotes: number;
  category: string;
  swatchType: 'concentric' | 'gradient' | 'solid';
  colors: string[];
  description?: string;
  requestedBy?: string;
  createdAt?: number;
}

export const INITIAL_WANTED_LOOKS: WantedLookItem[] = WANTED_LOOKS_100;

interface WantedQuickActionCardProps {
  onRequestClick: () => void;
  onSelectLook?: (item: WantedLookItem) => void;
  onSeeMore?: () => void;
  onNavigate?: (tab: any) => void;
}

/** Votes needed for the next production milestone. */
const MILESTONE_STEP = 250;

const formatVotes = (votes: number) =>
  votes >= 1000 ? `${(votes / 1000).toFixed(1)}k` : `${votes}`;

export const WantedQuickActionCard: React.FC<WantedQuickActionCardProps> = ({
  onRequestClick,
  onSelectLook,
  onSeeMore,
  onNavigate
}) => {
  const [items, setItems] = useState<WantedLookItem[]>(WANTED_LOOKS_100);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('tryon_beauty_wanted_voted_items');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [isSeeMoreModalOpen, setIsSeeMoreModalOpen] = useState<boolean>(false);

  /** How far each look has just moved up or down the board. */
  const [rankMoves, setRankMoves] = useState<Record<string, number>>({});
  /** Looks whose count changed a moment ago, so the number can pop. */
  const [justChanged, setJustChanged] = useState<Record<string, boolean>>({});
  const [lastUpdateAt, setLastUpdateAt] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const previousRanks = useRef<Record<string, number>>({});
  const previousVotes = useRef<Record<string, number>>({});

  useEffect(() => {
    const unsubscribe = subscribeWantedLooks((updatedLooks) => {
      setItems(updatedLooks);
    });
    return () => unsubscribe();
  }, []);

  /** The board, highest first, which is what makes a rank mean anything. */
  const ranked = useMemo(
    () => [...items].sort((a, b) => b.numericVotes - a.numericVotes),
    [items]
  );

  const totalVotes = useMemo(
    () => items.reduce((sum, item) => sum + (item.numericVotes || 0), 0),
    [items]
  );
  const animatedTotal = useCountUp(totalVotes);

  // Watch the board for movement: what climbed, what changed, and when.
  useEffect(() => {
    const nextRanks: Record<string, number> = {};
    ranked.forEach((item, index) => {
      nextRanks[item.id] = index;
    });

    const moves: Record<string, number> = {};
    const changed: Record<string, boolean> = {};
    let sawChange = false;

    ranked.forEach((item) => {
      const was = previousRanks.current[item.id];
      const now = nextRanks[item.id];
      if (was !== undefined && was !== now) moves[item.id] = was - now;

      const wasVotes = previousVotes.current[item.id];
      if (wasVotes !== undefined && wasVotes !== item.numericVotes) {
        changed[item.id] = true;
        sawChange = true;
      }
      previousVotes.current[item.id] = item.numericVotes;
    });

    const isFirstRun = Object.keys(previousRanks.current).length === 0;
    previousRanks.current = nextRanks;
    if (isFirstRun) return;

    if (Object.keys(moves).length > 0) {
      setRankMoves((prev) => ({ ...prev, ...moves }));
      window.setTimeout(() => {
        setRankMoves((prev) => {
          const next = { ...prev };
          Object.keys(moves).forEach((id) => delete next[id]);
          return next;
        });
      }, 9000);
    }

    if (sawChange) {
      setLastUpdateAt(Date.now());
      setJustChanged(changed);
      window.setTimeout(() => setJustChanged({}), 600);
    }
  }, [ranked]);

  // "Updated 4s ago" only means something if it keeps counting.
  useEffect(() => {
    setSecondsAgo(0);
    const tick = window.setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdateAt) / 1000));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [lastUpdateAt]);

  const handleToggleWant = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isCurrentlyVoted = !votedMap[id];
    const newVotedState = isCurrentlyVoted;

    // Trigger expanding heart animation
    setAnimatingId(id);
    setTimeout(() => {
      setAnimatingId(null);
    }, 900);

    // Update local state and localStorage
    const newMap = { ...votedMap, [id]: newVotedState };
    setVotedMap(newMap);
    localStorage.setItem('tryon_beauty_wanted_voted_items', JSON.stringify(newMap));

    let updatedVotes = 0;
    let updatedLabel = '';

    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const delta = newVotedState ? 1 : -1;
          const newVotes = Math.max(0, item.numericVotes + delta);
          updatedVotes = newVotes;
          updatedLabel = `${formatVotes(newVotes)} want this`;
          return {
            ...item,
            numericVotes: newVotes,
            countLabel: updatedLabel
          };
        }
        return item;
      })
    );

    try {
      if (updatedLabel) {
        await voteWantedLookInFirestore(id, updatedVotes, updatedLabel);
      }
    } catch (err) {
      console.warn('Could not sync vote to Firestore:', err);
    }
  };

  const visibleItems = ranked.slice(0, 7);
  const leader = ranked[0];
  const leaderNextMilestone = leader
    ? Math.max(
        MILESTONE_STEP,
        (Math.floor(leader.numericVotes / MILESTONE_STEP) + 1) * MILESTONE_STEP
      )
    : MILESTONE_STEP;
  const leaderProgress = leader
    ? Math.min(100, Math.round((leader.numericVotes / leaderNextMilestone) * 100))
    : 0;
  const votedCount = Object.values(votedMap).filter(Boolean).length;

  return (
    <>
      <div className="glass-card p-5 sm:p-6 text-left relative overflow-hidden font-montserrat">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
              <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Live
              </span>
              <span className="text-[9.5px] font-bold text-stone-400">
                updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-stone-900 tracking-tight">
              What&apos;s Wanted Now
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
              <span className="font-black text-stone-900 tabular-nums">
                {animatedTotal.toLocaleString()}
              </span>{' '}
              votes cast · you have backed{' '}
              <span className="font-black text-[#E91E63] tabular-nums">{votedCount}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onRequestClick}
            className="neu-pill px-3.5 py-1.5 hover:brightness-[1.03] active:scale-95 text-[#2A1715] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Request</span>
          </button>
        </div>

        {/* What the front runner still needs to get made */}
        {leader && (
          <div className="mt-4 neu-inset px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#E91E63]" />
                In the lead
              </span>
              <span className="text-[10px] font-bold text-stone-500 tabular-nums">
                {Math.max(0, leaderNextMilestone - leader.numericVotes)} to go
              </span>
            </div>
            <p className="text-xs font-black text-stone-900 mt-1.5 truncate">{leader.name}</p>
            <div className="mt-2 h-2 rounded-full bg-white/70 overflow-hidden relative">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#F7C6D7] via-[#E91E63] to-[#AD1457]"
                initial={false}
                animate={{ width: `${leaderProgress}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
              <div className="absolute inset-0 shimmer-sweep pointer-events-none" />
            </div>
            <p className="text-[9.5px] font-bold text-stone-400 mt-1.5">
              {leaderProgress}% of the way to {leaderNextMilestone} votes
            </p>
          </div>
        )}

        {/* The board */}
        <div className="mt-4 space-y-1">
          {visibleItems.map((item, index) => {
            const isVoted = !!votedMap[item.id];
            const isAnimating = animatingId === item.id;
            const move = rankMoves[item.id] || 0;
            const popped = !!justChanged[item.id];

            return (
              <motion.div
                key={item.id}
                layout
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                onClick={() => onSelectLook && onSelectLook(item)}
                className="py-2.5 px-2 -mx-2 flex items-center justify-between gap-3 group hover:bg-white/60 rounded-2xl transition-colors cursor-pointer"
              >
                {/* Rank, swatch and name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 shrink-0 flex flex-col items-center">
                    <span
                      className={`text-[11px] font-black tabular-nums ${
                        index === 0
                          ? 'text-[#E91E63]'
                          : index < 3
                            ? 'text-stone-700'
                            : 'text-stone-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <AnimatePresence>
                      {move !== 0 && (
                        <motion.span
                          initial={{ opacity: 0, y: move > 0 ? 4 : -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`text-[8px] font-black flex items-center leading-none ${
                            move > 0 ? 'text-emerald-600' : 'text-stone-400'
                          }`}
                        >
                          {move > 0 ? (
                            <ArrowUp className="w-2 h-2 stroke-[3]" />
                          ) : (
                            <ArrowDown className="w-2 h-2 stroke-[3]" />
                          )}
                          {Math.abs(move)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-xs shrink-0 flex items-center justify-center border border-black/5">
                    {item.swatchType === 'concentric' ? (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: item.colors[0] }}
                      >
                        <div
                          className="w-5 h-5 rounded-full shadow-inner border border-white/20"
                          style={{ backgroundColor: item.colors[1] || '#ffffff' }}
                        />
                      </div>
                    ) : item.swatchType === 'gradient' ? (
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(135deg, ${item.colors[0]} 0%, ${item.colors[1] || item.colors[0]} 100%)`
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: item.colors[0] }}
                      />
                    )}
                    {index === 0 && (
                      <div className="absolute inset-0 shimmer-sweep pointer-events-none" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate leading-snug group-hover:text-[#E91E63] transition-colors flex items-center gap-1.5">
                      <span className="truncate">{item.name}</span>
                      {move > 0 && (
                        <Flame className="w-3 h-3 text-[#E91E63] fill-[#F7C6D7] shrink-0" />
                      )}
                    </h3>
                    <p
                      key={`${item.id}-${item.numericVotes}`}
                      className={`text-[11px] text-stone-400 font-bold leading-normal tabular-nums ${
                        popped ? 'count-pop text-[#E91E63]' : ''
                      }`}
                    >
                      {formatVotes(item.numericVotes)} want this
                    </p>
                  </div>
                </div>

                {/* WANT button with animated heart */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleWant(e, item.id)}
                    aria-label={`Want ${item.name}`}
                    className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-2xs ${
                      isVoted
                        ? 'bg-[#E91E63] text-white border-[#E91E63]'
                        : 'bg-white/90 hover:bg-white text-stone-800 border-stone-200 hover:border-[#F7C6D7]'
                    }`}
                  >
                    <motion.div
                      animate={
                        isAnimating
                          ? { scale: [1, 1.6, 1.2, 1], rotate: [0, -12, 12, 0] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          isVoted ? 'text-white fill-white' : 'text-stone-700'
                        }`}
                      />
                    </motion.div>
                    <span className="tracking-wide uppercase text-[10.5px]">
                      {isVoted ? 'WANTED' : 'WANT'}
                    </span>
                  </button>

                  {/* Floating particle burst on WANT click */}
                  <AnimatePresence>
                    {isAnimating && (
                      <motion.div
                        initial={{ opacity: 1, y: 0, scale: 0.6 }}
                        animate={{ opacity: 0, y: -24, scale: 1.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute -top-3 right-4 pointer-events-none text-[#E91E63] font-extrabold text-[10px] flex items-center gap-0.5 z-20"
                      >
                        <span>♥</span>
                        <span>+1</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer: See more link */}
        <div className="mt-4 pt-3 border-t border-white/70 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 font-medium">
            Top 7 of {items.length} requested shades
          </span>
          <button
            type="button"
            onClick={() => {
              if (onSeeMore) {
                onSeeMore();
              } else if (onNavigate) {
                onNavigate('wanted-list');
              } else {
                setIsSeeMoreModalOpen(true);
              }
            }}
            className="text-xs font-bold text-[#2A1715] hover:text-[#E91E63] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>See more</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SEE MORE WANTED LOOKS LIST VIEW MODAL / DRAWER */}
      {isSeeMoreModalOpen && (
        <WantedListViewModal
          items={items}
          votedMap={votedMap}
          onToggleWant={handleToggleWant}
          onRequestClick={() => {
            setIsSeeMoreModalOpen(false);
            onRequestClick();
          }}
          onClose={() => setIsSeeMoreModalOpen(false)}
        />
      )}
    </>
  );
};
