import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ChevronUp, 
  ChevronDown, 
  Heart, 
  Share2, 
  Sparkles, 
  Check,
  Lock,
  Crown
} from 'lucide-react';
import { PresetLook } from '../../types';
import { InspirationItem, INITIAL_INSPIRATIONS } from '../../data/inspirationData';
import { ProPaywallModal } from '../common/ProPaywallModal';
import { checkIsProUser } from '../../services/looksSyncService';

interface InspirationLooksScrollFeedPageProps {
  onNavigate: (tab: any) => void;
  onLoadPreset: (preset: PresetLook) => void;
  initialLookId?: string | null;
  initialCategory?: string;
}

export const InspirationLooksScrollFeedPage: React.FC<InspirationLooksScrollFeedPageProps> = ({
  onNavigate,
  onLoadPreset,
  initialLookId,
  initialCategory = 'all'
}) => {
  const getOrderedInspirations = (targetId?: string | null): InspirationItem[] => {
    let baseList: InspirationItem[] = INITIAL_INSPIRATIONS;
    const saved = localStorage.getItem('gleame_inspiration_wall');
    if (saved) {
      try {
        baseList = JSON.parse(saved);
      } catch {
        baseList = INITIAL_INSPIRATIONS;
      }
    }

    if (!targetId) return baseList;

    const idx = baseList.findIndex(item => 
      item.id === targetId || 
      item.preset.id === targetId ||
      item.id.replace('insp_', '') === targetId.replace('insp_', '') ||
      item.id.replace('try_', '') === targetId.replace('try_', '') ||
      targetId.includes(item.id) ||
      item.id.includes(targetId)
    );

    if (idx > 0) {
      // Put the selected look at index 0 so it opens directly without auto-scrolling
      return [...baseList.slice(idx), ...baseList.slice(0, idx)];
    }
    return baseList;
  };

  const [inspirations, setInspirations] = useState<InspirationItem[]>(() => 
    getOrderedInspirations(initialLookId)
  );

  const [isProUser, setIsProUser] = useState<boolean>(() => checkIsProUser());
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallItem, setPaywallItem] = useState<InspirationItem | null>(null);
  const [pendingPreset, setPendingPreset] = useState<PresetLook | null>(null);

  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('gleame_inspiration_liked');
    return saved ? new Set(JSON.parse(saved)) : new Set(['insp_1', 'insp_3']);
  });
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [currentReelIndex, setCurrentReelIndex] = useState<number>(0);

  const feedContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Save liked states to localStorage
  useEffect(() => {
    localStorage.setItem('gleame_inspiration_liked', JSON.stringify(Array.from(likedIds)));
  }, [likedIds]);

  // When initialLookId changes, order feed directly starting at that look with zero auto-scrolling
  useEffect(() => {
    if (initialLookId) {
      const reordered = getOrderedInspirations(initialLookId);
      setInspirations(reordered);
      setCurrentReelIndex(0);
      if (feedContainerRef.current) {
        feedContainerRef.current.scrollTop = 0;
      }
    }
  }, [initialLookId]);

  // Smooth throttled scroll listener to calculate current active card index
  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      cancelAnimationFrame(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = requestAnimationFrame(() => {
      if (!feedContainerRef.current) return;
      const container = feedContainerRef.current;
      const scrollPos = container.scrollTop;
      const cards = container.querySelectorAll<HTMLElement>('[data-feed-card]');
      
      let closestIndex = 0;
      let minDiff = Infinity;
      
      cards.forEach((card, i) => {
        const offsetTop = card.offsetTop;
        const diff = Math.abs(offsetTop - scrollPos);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      });

      if (closestIndex !== currentReelIndex) {
        setCurrentReelIndex(closestIndex);
      }
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        onNavigate('gallery-inspiration');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentReelIndex, inspirations]);

  const handlePrev = () => {
    if (currentReelIndex > 0) {
      const nextIdx = currentReelIndex - 1;
      setCurrentReelIndex(nextIdx);
      const targetItem = inspirations[nextIdx];
      if (targetItem) {
        const el = document.getElementById(`feed-card-${targetItem.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const handleNext = () => {
    if (currentReelIndex < inspirations.length - 1) {
      const nextIdx = currentReelIndex + 1;
      setCurrentReelIndex(nextIdx);
      const targetItem = inspirations[nextIdx];
      if (targetItem) {
        const el = document.getElementById(`feed-card-${targetItem.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedIds(prev => {
      const next = new Set(prev);
      const isCurrentlyLiked = next.has(id);
      if (isCurrentlyLiked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setInspirations(curr => curr.map(item => {
        if (item.id === id) {
          return { ...item, likes: item.likes + (isCurrentlyLiked ? -1 : 1) };
        }
        return item;
      }));
      return next;
    });
  };

  const handleShare = (item: InspirationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const shareUrl = `${window.location.origin}/inspirationlooks-scrollfeed?look=${item.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedNotification(`Recipe link for "${item.title}" copied!`);
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  const handleTryOn = (item: InspirationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isLocked = (item.isLocked || item.preset.isLocked) && !checkIsProUser();
    if (isLocked) {
      setPaywallItem(item);
      setPendingPreset(item.preset);
      setIsPaywallOpen(true);
      return;
    }
    onLoadPreset(item.preset);
    onNavigate('sandbox');
  };

  return (
    <div 
      id="inspirationlooks-scrollfeed-page"
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-[100dvh] bg-[#121212] overflow-hidden flex items-center justify-center select-none"
    >
      {/* Scrollable Container with Instagram / TikTok style Snap Reel */}
      <div 
        ref={feedContainerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth flex flex-col items-center scrollbar-none"
        style={{ touchAction: 'pan-y' }}
      >
        {inspirations.map((item) => {
          const isLiked = likedIds.has(item.id);
          const creatorInitial = item.creator.replace('@', '').charAt(0).toUpperCase() || 'G';

          return (
            <div
              key={item.id}
              id={`feed-card-${item.id}`}
              data-feed-card
              className="w-full h-screen min-h-[100dvh] flex items-center justify-center p-2 sm:p-4 snap-start shrink-0"
            >
              {/* Full Immersion Reel Portrait Card */}
              <div className="relative w-full max-w-[420px] h-[calc(100vh-20px)] max-h-[860px] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-stone-900 flex flex-col justify-between p-5">
                
                {/* Background Image with Dark Legibility Gradients */}
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none z-[1]" />
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-[1]" />

                {/* Top Bar: Circle Back Button */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={() => onNavigate('gallery-inspiration')}
                    className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-white/15 shadow-lg aspect-square"
                    title="Back to Inspiration Wall"
                    aria-label="Back to Inspiration Wall"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>

                  {(item.isLocked || item.preset.isLocked) && !isProUser && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[10px] font-black tracking-wider uppercase text-white flex items-center gap-1.5 shadow-lg border border-amber-300/40">
                      <Lock className="w-3 h-3 stroke-[2.5]" />
                      <span>VIP PRO LOOK</span>
                    </span>
                  )}
                </div>

                {/* Bottom Overlay & Right-side Action Column */}
                <div className="relative z-10 flex items-end justify-between gap-3 w-full pb-1">
                  
                  {/* Left Bottom Details */}
                  <div className="flex-1 min-w-0 pr-2 space-y-2.5">
                    
                    {/* Creator Row */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-black ring-2 ring-[#ec4899] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm overflow-hidden">
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={item.creator} className="w-full h-full object-cover" />
                        ) : (
                          creatorInitial
                        )}
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight drop-shadow-md truncate">
                        {item.creator}
                      </span>
                    </div>

                    {/* Look Title */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-display font-black tracking-wider uppercase text-white drop-shadow-lg leading-tight">
                        {item.title}
                      </h2>
                      {(item.isLocked || item.preset.isLocked) && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[9px] font-black tracking-wider uppercase text-white flex items-center gap-1 shadow-md border border-amber-300/40">
                          <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>PRO</span>
                        </span>
                      )}
                    </div>

                    {/* Description Subtitle */}
                    <p className="text-xs sm:text-[13px] text-white/90 font-medium leading-snug drop-shadow-md line-clamp-2 max-w-xs">
                      {item.description || `A trending look designed by ${item.creator}`}
                    </p>

                    {/* Formula Color Recipe Pill Capsule */}
                    <div className="bg-black/45 backdrop-blur-md rounded-2xl p-2.5 px-3 border border-white/15 max-w-xs">
                      <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1.5 font-mono">
                        FORMULA COLOR RECIPE
                      </span>
                      <div className="flex items-center gap-3 text-xs text-white">
                        {/* Eyeshadow */}
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-2xs shrink-0" 
                            style={{ backgroundColor: item.preset.eyeshadowColor || '#d6c7b2' }} 
                          />
                          <span className="text-[11px] font-semibold text-white/95">Eyeshadow</span>
                        </div>

                        {/* Lips */}
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-2xs shrink-0" 
                            style={{ backgroundColor: item.preset.lipColor || '#e11d48' }} 
                          />
                          <span className="text-[11px] font-semibold text-white/95">Lips</span>
                        </div>

                        {/* Blush */}
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-2xs shrink-0" 
                            style={{ backgroundColor: item.preset.blushColor || '#f43f5e' }} 
                          />
                          <span className="text-[11px] font-semibold text-white/95">Blush</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Tag Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-bold text-white flex items-center gap-1.5 shadow-2xs">
                        ✨ GLITTER {item.preset.glitterLevel ? `${item.preset.glitterLevel}%` : '25%'}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-bold text-white uppercase shadow-2xs">
                        LASHES: {item.preset.lashesStyle || 'WISPY'}
                      </span>
                    </div>

                  </div>

                  {/* Right Side Vertical Action Column & Navigation Chevrons */}
                  <div className="flex flex-col items-center gap-3.5 shrink-0">
                    
                    {/* Like Action */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={(e) => toggleLike(item.id, e)}
                        className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg active:scale-90 transition-all cursor-pointer"
                        title={isLiked ? "Unlike" : "Like"}
                      >
                        <Heart className={`w-6 h-6 transition-transform ${isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white'}`} />
                      </button>
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {item.likes.toLocaleString()}
                      </span>
                    </div>

                    {/* Try On Action (White Circle with Pink Sparkles Icon / Lock for Pro) */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={(e) => handleTryOn(item, e)}
                        className={`w-12 h-12 rounded-full hover:scale-105 shadow-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                          (item.isLocked || item.preset.isLocked) && !isProUser
                            ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-stone-900 border border-amber-300'
                            : 'bg-white hover:bg-rose-50 text-[#ec4899]'
                        }`}
                        title={(item.isLocked || item.preset.isLocked) && !isProUser ? "Unlock PRO Look" : "Try On Look in Camera"}
                      >
                        {(item.isLocked || item.preset.isLocked) && !isProUser ? (
                          <Lock className="w-5 h-5 text-stone-900" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-[#ec4899] fill-[#fbcfe8]" />
                        )}
                      </button>
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {(item.isLocked || item.preset.isLocked) && !isProUser ? 'Unlock' : 'Try'}
                      </span>
                    </div>

                    {/* Share Action */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={(e) => handleShare(item, e)}
                        className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg active:scale-90 transition-all cursor-pointer"
                        title="Share Look"
                      >
                        <Share2 className="w-5 h-5 text-white" />
                      </button>
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        Share
                      </span>
                    </div>

                    {/* Up and Down Navigation Chevrons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={currentReelIndex <= 0}
                        className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-md cursor-pointer"
                        title="Previous Look"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={currentReelIndex >= inspirations.length - 1}
                        className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-md cursor-pointer"
                        title="Next Look"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Copy notification toast */}
      {copiedNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10001] px-5 py-2.5 rounded-full bg-black/90 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/10 animate-in slide-in-from-top-3 duration-200 backdrop-blur-md">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* VIP Pro Paywall Modal */}
      <ProPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUnlocked={() => {
          setIsProUser(true);
          if (pendingPreset) {
            onLoadPreset(pendingPreset);
            onNavigate('sandbox');
          }
        }}
        featureName={paywallItem?.title}
        lookImage={paywallItem?.imageUrl}
        lookTagline={paywallItem?.description}
        categoryLabel={paywallItem?.badge}
      />
    </div>
  );
};
