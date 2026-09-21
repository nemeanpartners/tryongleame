import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, ChevronRight, Flame, ArrowUp, ArrowDown, Crown, Sparkles, X, Play, Lock } from 'lucide-react';
import { WantedListViewModal } from './WantedListViewModal';
import { WANTED_LOOKS_100 } from '../../data/wantedLooks100';
import {
  subscribeWantedLooks,
  voteWantedLookInFirestore,
  pledgeWantedLookInFirestore
} from '../../services/wantedLooksService';
import { useCountUp } from '../../lib/liveCounters';
import { DemandOrbs } from './DemandOrbs';
import { TargetBoard } from './TargetBoard';
import { fuseShades, Fusion } from '../../lib/shadeFusion';
import { openLookInNative, openMixAndMatchInNative } from '../../lib/nativeLooks';


export interface WantedLookItem {
  id: string;
  name: string;
  countLabel: string;
  numericVotes: number;
  /** How many people have said they would buy it, not just want it. */
  pledges?: number;
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
  /** Used in a browser, where there is no native Mix & Match to open. */
  onOpenMixMatch?: () => void;
  /** Something has just been wanted, so it can drop into the bag above. */
  onWant?: (item: WantedLookItem) => void;
  onSelectLook?: (item: WantedLookItem) => void;
  onSeeMore?: () => void;
  onNavigate?: (tab: any) => void;
}

/** Votes needed for the next production milestone. */
const MILESTONE_STEP = 250;

/** Pledges that turn a wanted shade into one that actually gets made. */
const ESCROW_GOAL = 500;

const formatVotes = (votes: number) =>
  votes >= 1000 ? `${(votes / 1000).toFixed(1)}k` : `${votes}`;

export const WantedQuickActionCard: React.FC<WantedQuickActionCardProps> = ({
  onRequestClick,
  onOpenMixMatch,
  onWant,
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
  /** Shades this person has pledged to buy, by id. */
  const [pledgedMap, setPledgedMap] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_shade_escrow') || '{}');
    } catch {
      return {};
    }
  });

  /** The one or two shades in the fusion tray, by id. */
  const [fusionIds, setFusionIds] = useState<string[]>([]);
  const [fusionSaved, setFusionSaved] = useState<string | null>(null);
  /** The opening wave runs once; after that a row only turns on a change. */
  const [hasSettled, setHasSettled] = useState(false);
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

  useEffect(() => {
    const settle = window.setTimeout(() => setHasSettled(true), 900);
    return () => window.clearTimeout(settle);
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

  /** The shades picked out of the field, in the order they were picked. */
  const fusionPicks = useMemo(
    () =>
      fusionIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is WantedLookItem => Boolean(item)),
    [fusionIds, items]
  );

  /** What those two make together. */
  const fusion: Fusion | null = useMemo(() => {
    if (fusionPicks.length < 2) return null;
    const [a, b] = fusionPicks;
    return fuseShades(
      { name: a.name, colour: a.colors[0] || '#E91E63', votes: a.numericVotes },
      { name: b.name, colour: b.colors[0] || '#E91E63', votes: b.numericVotes }
    );
  }, [fusionPicks]);

  /** One pick filters the board; two make a shade. */
  const toggleFusion = (id: string) => {
    setFusionSaved(null);
    setFusionIds((prev) => {
      if (prev.includes(id)) return prev.filter((entry) => entry !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const wearFusion = () => {
    if (!fusion) return;
    const handled = openLookInNative({
      id: `fusion_${fusion.hex.replace('#', '')}`,
      name: fusion.name,
      lipColor: fusion.hex,
      blushColor: fusion.hex
    });
    if (!handled) setFusionSaved('Open the app to wear it on your own face');
  };

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
    // Wanting something puts it in the bag at the top of the page.
    if (newVotedState) {
      const wanted = items.find((entry) => entry.id === id);
      if (wanted) onWant?.(wanted);
    }
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

  /**
   * Shade Escrow. A want is an opinion; a pledge is an order book. Once enough
   * people have said they would buy one, it stops being a request.
   */
  const handleTogglePledge = async (e: React.MouseEvent, item: WantedLookItem) => {
    e.stopPropagation();
    const pledging = !pledgedMap[item.id];
    const next = { ...pledgedMap, [item.id]: pledging };
    setPledgedMap(next);
    localStorage.setItem('tryon_shade_escrow', JSON.stringify(next));

    const count = Math.max(0, (item.pledges || 0) + (pledging ? 1 : -1));
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, pledges: count } : entry))
    );
    try {
      await pledgeWantedLookInFirestore(item.id, count);
    } catch (error) {
      console.warn('Could not sync the pledge:', error);
    }
  };

  const visibleItems = useMemo(() => {
    // One shade picked filters the board to its category, which is what makes
    // the field a control rather than a picture.
    if (fusionPicks.length === 1) {
      const category = fusionPicks[0].category;
      const inCategory = ranked.filter((item) => item.category === category);
      return (inCategory.length > 0 ? inCategory : ranked).slice(0, 7);
    }
    return ranked.slice(0, 7);
  }, [ranked, fusionPicks]);
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
  const leaderPledges = leader?.pledges || 0;
  const escrowProgress = Math.min(100, Math.round((leaderPledges / ESCROW_GOAL) * 100));

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
              Vote for what you want
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

        {/* What is wanted and what is winning, before the list to vote on */}
        <div className="mt-4">
          <TargetBoard items={ranked} />
        </div>

        {/* What the front runner still needs to get made */}
        {leader && (
          <div className="mt-4 neu-inset px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#E91E63]" />
                In the lead
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-stone-500 tabular-nums">
                  {Math.max(0, leaderNextMilestone - leader.numericVotes)} to go
                </span>
                {/* Wear the one that is winning, without hunting for it */}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openLookInNative({
                      id: leader.id,
                      name: leader.name,
                      lipColor: leader.colors[0]
                    });
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#E91E63] text-white text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  Try on
                </button>
              </div>
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

            {/* SHADE ESCROW - what the wanting is actually worth */}
            <div className="mt-3 pt-3 border-t border-white/70">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#2A1715]" />
                  Shade Escrow
                </span>
                <span className="text-[10px] font-black text-stone-500 tabular-nums">
                  {leaderPledges}/{ESCROW_GOAL} would buy
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-white/70 overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#B8887A] to-[#2A1715]"
                  initial={false}
                  animate={{ width: `${escrowProgress}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
                {escrowProgress >= 100 && (
                  <div className="absolute inset-0 shimmer-sweep pointer-events-none" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-[9.5px] font-bold text-stone-400 leading-snug">
                  {escrowProgress >= 100
                    ? 'Funded. This one gets made.'
                    : `${ESCROW_GOAL - leaderPledges} more pledges and it goes into production`}
                </p>
                <button
                  type="button"
                  onClick={(e) => void handleTogglePledge(e, leader)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-all border ${
                    pledgedMap[leader.id]
                      ? 'bg-[#2A1715] text-white border-[#2A1715]'
                      : 'bg-white text-[#2A1715] border-stone-200 hover:border-[#2A1715]'
                  }`}
                >
                  {pledgedMap[leader.id] ? 'Pledged' : "I'd buy this"}
                </button>
              </div>
            </div>
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
                className={`py-2.5 px-2 -mx-2 group rounded-2xl transition-colors cursor-pointer ${
                  fusionIds.includes(item.id) ? 'bg-white/70' : 'hover:bg-white/60'
                }`}
                style={{ perspective: 760 }}
              >
                {/* Each row turns over when its count changes, and the board
                    turns over in a wave when it first opens. */}
                <AnimatePresence mode="wait" initial>
                <motion.div
                  key={`${item.id}-${item.numericVotes}`}
                  initial={{ rotateX: -88, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: 88, opacity: 0 }}
                  transition={{
                    duration: 0.34,
                    ease: [0.22, 1, 0.36, 1],
                    delay: hasSettled ? 0 : index * 0.07
                  }}
                  style={{ transformOrigin: 'center top', transformStyle: 'preserve-3d' }}
                  className="flex items-center justify-between gap-3"
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
                      {(item.pledges || 0) > 0 && (
                        <span className="text-[#2A1715]">
                          {' '}· {item.pledges} would buy
                        </span>
                      )}
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
                </AnimatePresence>
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

      {/* SHADE FUSION - its own card, after the board it is built from */}
      <div className="glass-card p-5 sm:p-6 text-left relative overflow-hidden font-montserrat">
        {/* SHADE FUSION - the field is where you pick, not just look */}
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E91E63]" />
            Shade Fusion
          </span>
          <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight mt-0.5">
            Make one of your own
          </h3>
          <p className="text-[11px] text-stone-500 font-medium mt-1 leading-relaxed">
            Blend two shades from the board above into a look of your own and
            wear it. It is yours to try, not another request on the board.
          </p>
          <p className="text-[10px] font-black uppercase tracking-wider text-[#E91E63] mt-2">
            {fusionPicks.length === 0
              ? 'Tap one to filter · two to fuse'
              : fusionPicks.length === 1
                ? 'Tap a second to fuse them'
                : 'Wear what the two make'}
          </p>
        </div>

        <DemandOrbs
          orbs={ranked.slice(0, 7).map((item) => ({
            id: item.id,
            name: item.name,
            votes: item.numericVotes,
            colour: item.colors[0] || '#E91E63'
          }))}
          selectedIds={fusionIds}
          onSelect={(orb) => toggleFusion(orb.id)}
        />

        {/* Where a blend can be built properly, shade by shade */}
        <button
          type="button"
          onClick={() => {
            if (!openMixAndMatchInNative()) onOpenMixMatch?.();
          }}
          className="w-full neu-pill px-4 py-2.5 mt-1 flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <span className="text-[10.5px] font-black uppercase tracking-wider text-[#2A1715]">
            Build one shade by shade
          </span>
          <span className="text-[9.5px] font-black uppercase tracking-wider text-[#E91E63] flex items-center gap-1">
            Mix &amp; Match
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        {/* The tray: what is picked, and what it makes */}
        {fusionPicks.length > 0 && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="neu-inset px-3.5 py-3 mt-1"
          >
            <div className="flex items-center gap-2.5">
              {fusionPicks.map((pick, index) => (
                <React.Fragment key={pick.id}>
                  {index > 0 && (
                    <span className="text-xs font-black text-stone-400">+</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFusion(pick.id)}
                    title={`Take ${pick.name} out`}
                    className="flex items-center gap-1.5 cursor-pointer group/pick min-w-0"
                  >
                    <span
                      className="w-6 h-6 rounded-full border-2 border-white shadow-xs shrink-0"
                      style={{ backgroundColor: pick.colors[0] }}
                    />
                    <span className="text-[10.5px] font-bold text-stone-700 truncate max-w-[74px]">
                      {pick.name}
                    </span>
                    <X className="w-3 h-3 text-stone-300 group-hover/pick:text-stone-600 shrink-0" />
                  </button>
                </React.Fragment>
              ))}

              {fusion && (
                <>
                  <span className="text-xs font-black text-stone-400">=</span>
                  <motion.span
                    key={fusion.hex}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 16 }}
                    className="w-9 h-9 rounded-full shrink-0"
                    style={{
                      background: `radial-gradient(circle at 32% 26%, ${fusion.hex}ff 0%, ${fusion.hex}cc 55%, ${fusion.hex}88 100%)`,
                      boxShadow: `0 0 18px ${fusion.hex}99, inset 0 4px 10px rgba(255,255,255,0.45)`
                    }}
                  />
                </>
              )}
            </div>

            {fusion && (
              <>
                <div className="mt-2.5">
                  <p className="text-sm font-display font-black text-stone-900 leading-tight">
                    {fusion.name}
                  </p>
                  <p className="text-[10px] font-bold text-stone-400 tabular-nums">
                    {fusion.hex.toUpperCase()} · born of{' '}
                    {fusion.inheritedVotes.toLocaleString()} votes
                  </p>
                </div>

                <button
                  type="button"
                  onClick={wearFusion}
                  className="w-full mt-3 py-2.5 rounded-full bg-[#E91E63] text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Wear this blend
                </button>
              </>
            )}

            {!fusion && (
              <p className="text-[10px] font-bold text-stone-400 mt-2">
                Showing everything in {fusionPicks[0].category}. Pick a second
                shade to fuse them into one nobody has asked for yet.
              </p>
            )}

            {fusionSaved && (
              <p className="text-[10px] font-black text-[#E91E63] mt-2">{fusionSaved}</p>
            )}
          </motion.div>
        )}

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
