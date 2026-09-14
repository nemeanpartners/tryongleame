import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, ChevronRight, Sparkles } from 'lucide-react';
import { WantedListViewModal } from './WantedListViewModal';
import { WANTED_LOOKS_100 } from '../../data/wantedLooks100';
import { subscribeWantedLooks, voteWantedLookInFirestore } from '../../services/wantedLooksService';

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

  useEffect(() => {
    const unsubscribe = subscribeWantedLooks((updatedLooks) => {
      setItems(updatedLooks);
    });
    return () => unsubscribe();
  }, []);

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
          const formatted = newVotes >= 1000 ? `${(newVotes / 1000).toFixed(1)}k` : `${newVotes}`;
          updatedVotes = newVotes;
          updatedLabel = `${formatted} want this`;
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

  const visibleItems = items.slice(0, 7);

  return (
    <>
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-5 sm:p-6 border border-[#bc8381]/20 shadow-xs text-left relative overflow-hidden font-montserrat">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900 tracking-tight">
              Wanted
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
              Vote on what TryOn Beauty should add next.
            </p>
          </div>

          <button
            type="button"
            onClick={onRequestClick}
            className="px-3.5 py-1.5 bg-[#e7dfd8] hover:bg-[#ded5cd] active:scale-95 border border-[#d8cec5] text-[#4a3b32] text-xs font-bold rounded-full transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#5a4537] stroke-[2.5]" />
            <span>Request</span>
          </button>
        </div>

        {/* List of 7 items with dividers */}
        <div className="mt-5 divide-y divide-stone-100">
          {visibleItems.map((item) => {
            const isVoted = !!votedMap[item.id];
            const isAnimating = animatingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectLook && onSelectLook(item)}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group hover:bg-stone-50/70 -mx-2 px-2 rounded-2xl transition-colors cursor-pointer"
              >
                {/* Left: Swatch Icon & Title */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Swatch Icon Preview */}
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
                  </div>

                  {/* Title & Count */}
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate leading-snug group-hover:text-[#732729] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-stone-400 font-medium leading-normal">
                      {item.countLabel}
                    </p>
                  </div>
                </div>

                {/* Right: WANT button with animated heart */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleWant(e, item.id)}
                    aria-label={`Want ${item.name}`}
                    className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-2xs ${
                      isVoted
                        ? 'bg-[#732729] text-white border-[#732729]'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <motion.div
                      animate={
                        isAnimating 
                          ? { scale: [1, 1.6, 1.2, 1], rotate: [0, -12, 12, 0] } 
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 transition-colors ${
                          isVoted 
                            ? 'text-white fill-white' 
                            : 'text-stone-700'
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
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute -top-3 right-4 pointer-events-none text-rose-500 font-extrabold text-[10px] flex items-center gap-0.5 z-20"
                      >
                        <span>♥</span>
                        <span>+1</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: See more link */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 font-medium">
            Showing top 7 of {items.length} requested shades
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
            className="text-xs font-bold text-[#732729] hover:text-[#5a1e20] flex items-center gap-1 hover:underline cursor-pointer transition-colors"
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
