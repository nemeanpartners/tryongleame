import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  ChevronUp, 
  ChevronDown, 
  Heart, 
  Share2, 
  Sparkles, 
  Check,
  Mail,
  Wand2,
  Lock
} from 'lucide-react';
import { PresetLook, LookRequest } from '../../types';
import { db, collection, getDocs, updateDoc, doc, increment } from '../../firebase';
import { GlitterConfetti } from '../common/GlitterConfetti';

const CATEGORY_COVERS: Record<string, string> = {
  'Eyes': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
  'Lips': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
  'Blush': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'Highlight': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
  'Full Face': 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
  'Other': 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
};

const DEFAULT_PROPOSALS: LookRequest[] = [
  {
    id: 'req_1',
    title: 'Holographic Liquid Chrome Liners',
    description: 'A multi-chrome eyeliner that shifts between violet, teal, and gold depending on the light angle.',
    category: 'Eyes',
    colors: ['#a78bfa', '#2dd4bf', '#fbbf24'],
    requestedBy: 'beauty_by_kat',
    votes: 49,
    votedUsers: [],
    isPublic: true,
    createdAt: Date.now() - 3600000 * 48
  },
  {
    id: 'req_2',
    title: 'Hydrating Glass Skin Cheek Glaze',
    description: 'A clear, dewy balm blush infused with fine peach pearls for a glass-skin wet gloss look.',
    category: 'Blush',
    colors: ['#f43f5e', '#fed7aa', '#ffffff'],
    requestedBy: 'glow_expert',
    votes: 35,
    votedUsers: [],
    isPublic: true,
    createdAt: Date.now() - 3600000 * 35
  },
  {
    id: 'req_3',
    title: 'Sultry Velvet Plum Lip Clay',
    description: 'An ultra-matte lip cream with zero transfer, in a deep vampy plum red shade.',
    category: 'Lips',
    colors: ['#581c87', '#701a75', '#881337'],
    requestedBy: 'vamp_glam',
    votes: 29,
    votedUsers: [],
    isPublic: true,
    createdAt: Date.now() - 3600000 * 29
  },
  {
    id: 'req_4',
    title: 'Ethereal Moon Dust Sparkle Highlighter',
    description: 'A sheer body and face glitter powder with silver diamond dust reflections and no chalky base.',
    category: 'Highlight',
    colors: ['#e2e8f0', '#ffffff', '#e0f2fe'],
    requestedBy: 'moonchild_99',
    votes: 24,
    votedUsers: [],
    isPublic: true,
    createdAt: Date.now() - 3600000 * 24
  }
];

interface WantedLooksScrollFeedPageProps {
  onNavigate: (tab: any) => void;
  onLoadPreset: (preset: PresetLook) => void;
  initialRequestId?: string | null;
}

export const WantedLooksScrollFeedPage: React.FC<WantedLooksScrollFeedPageProps> = ({
  onNavigate,
  onLoadPreset,
  initialRequestId
}) => {
  const [requests, setRequests] = useState<LookRequest[]>(() => {
    return DEFAULT_PROPOSALS;
  });

  const [votedIds, setVotedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('tryon_beauty_voted_requests');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('tryon_beauty_liked_wanted');
      return saved ? new Set(JSON.parse(saved)) : new Set(['req_1']);
    } catch {
      return new Set();
    }
  });

  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [currentReelIndex, setCurrentReelIndex] = useState<number>(0);
  const [isGlitterConfettiActive, setIsGlitterConfettiActive] = useState<boolean>(false);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [recentlyVotedId, setRecentlyVotedId] = useState<string | null>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Fetch live requests from Firestore
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'requests'));
        const dbRequests: LookRequest[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          dbRequests.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            category: data.category,
            colors: data.colors || [],
            requestedBy: data.requestedBy || 'Anonymous',
            votes: data.votes || 0,
            votedUsers: data.votedUsers || [],
            isPublic: data.isPublic !== false,
            createdAt: data.createdAt || Date.now()
          });
        });

        if (dbRequests.length > 0) {
          dbRequests.sort((a, b) => (b.votes || 0) - (a.votes || 0));
          reorderAndSet(dbRequests, initialRequestId);
        } else {
          reorderAndSet(DEFAULT_PROPOSALS, initialRequestId);
        }
      } catch (err) {
        console.error('Error loading wanted proposals:', err);
        reorderAndSet(DEFAULT_PROPOSALS, initialRequestId);
      }
    };

    fetchRequests();
  }, [initialRequestId]);

  const reorderAndSet = (list: LookRequest[], targetId?: string | null) => {
    if (!targetId) {
      setRequests(list);
      return;
    }
    const idx = list.findIndex(r => r.id === targetId || targetId.includes(r.id) || r.id.includes(targetId));
    if (idx > 0) {
      setRequests([...list.slice(idx), ...list.slice(0, idx)]);
    } else {
      setRequests(list);
    }
    setCurrentReelIndex(0);
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTop = 0;
    }
  };

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
        onNavigate('gallery-wanted');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentReelIndex, requests]);

  const handlePrev = () => {
    if (currentReelIndex > 0) {
      const nextIdx = currentReelIndex - 1;
      setCurrentReelIndex(nextIdx);
      const targetItem = requests[nextIdx];
      if (targetItem) {
        const el = document.getElementById(`feed-wanted-${targetItem.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleNext = () => {
    if (currentReelIndex < requests.length - 1) {
      const nextIdx = currentReelIndex + 1;
      setCurrentReelIndex(nextIdx);
      const targetItem = requests[nextIdx];
      if (targetItem) {
        const el = document.getElementById(`feed-wanted-${targetItem.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleUpvote = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (votedIds.has(id)) return;

    // Trigger 3-second glitter confetti falling from top
    setIsGlitterConfettiActive(true);
    setConfettiKey(prev => prev + 1);
    setRecentlyVotedId(id);

    setTimeout(() => {
      setIsGlitterConfettiActive(false);
      setRecentlyVotedId(null);
    }, 3000);

    setVotedIds(prev => {
      const next = new Set(prev).add(id);
      localStorage.setItem('tryon_beauty_voted_requests', JSON.stringify(Array.from(next)));
      return next;
    });

    setRequests(curr => curr.map(r => r.id === id ? { ...r, votes: (r.votes || 0) + 1 } : r));

    try {
      const docRef = doc(db, 'requests', id);
      await updateDoc(docRef, { votes: increment(1) });
    } catch (err) {
      console.warn('Local vote registered for', id);
    }
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('tryon_beauty_liked_wanted', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleShare = (item: LookRequest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const shareUrl = `${window.location.origin}/wanted-scrollfeed?look=${item.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedNotification(`Wanted proposal link for "${item.title}" copied!`);
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  const createPresetFromRequest = (req: LookRequest): PresetLook => {
    const c1 = req.colors[0] || '#a78bfa';
    const c2 = req.colors[1] || '#f43f5e';
    const c3 = req.colors[2] || '#fbbf24';

    return {
      id: `wanted_${req.id}`,
      name: req.title,
      description: req.description,
      eyeshadowColor: c1,
      eyeshadowOpacity: 0.85,
      blushColor: c2,
      blushOpacity: 0.65,
      lipColor: c3,
      lipOpacity: 0.9,
      lipGloss: true,
      lashesStyle: 'wispy',
      glitterLevel: 35,
      filter: req.category === 'Eyes' ? 'holographic' : 'warm-glow'
    };
  };

  const handleTryOn = (req: LookRequest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const preset = createPresetFromRequest(req);
    onLoadPreset(preset);
    onNavigate('sandbox');
  };

  const handleRemix = (req: LookRequest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const preset = createPresetFromRequest(req);
    onLoadPreset(preset);
    onNavigate('sandbox');
  };

  return (
    <div 
      id="wanted-scrollfeed-page"
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-[100dvh] bg-[#121212] overflow-hidden flex items-center justify-center select-none"
    >
      {/* 3-SECOND FULL-SCREEN GLITTER CONFETTI SHOWER */}
      <GlitterConfetti 
        key={confettiKey} 
        active={isGlitterConfettiActive} 
        durationMs={3000} 
        onComplete={() => setIsGlitterConfettiActive(false)} 
      />

      {/* Scrollable Container with Snap Reel */}
      <div 
        ref={feedContainerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth flex flex-col items-center scrollbar-none"
        style={{ touchAction: 'pan-y' }}
      >
        {requests.map((item) => {
          const isUpvoted = votedIds.has(item.id);
          const isLiked = likedIds.has(item.id);
          const isRecentlyVoted = recentlyVotedId === item.id;
          const coverUrl = CATEGORY_COVERS[item.category] || CATEGORY_COVERS['Other'];

          return (
            <div
              key={item.id}
              id={`feed-wanted-${item.id}`}
              data-feed-card
              className="w-full h-screen min-h-[100dvh] flex items-center justify-center p-2 sm:p-4 snap-start shrink-0"
            >
              {/* Full Immersion Reel Card */}
              <div className="relative w-full max-w-[420px] h-[calc(100vh-20px)] max-h-[860px] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-stone-900 flex flex-col justify-between p-5">
                
                {/* Background Cover */}
                <img 
                  src={coverUrl} 
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90 pointer-events-none z-[1]" />
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-[1]" />

                {/* Top Navigation Bar */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={() => onNavigate('gallery-wanted')}
                    className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-white/15 shadow-lg aspect-square"
                    title="Back to Wanted Looks"
                    aria-label="Back to Wanted Looks"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="bg-[#732729]/90 border border-[#bc8381]/40 backdrop-blur-md text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-md">
                      {item.category}
                    </span>
                    {!item.isPublic && (
                      <span className="bg-amber-600/90 border border-amber-400/40 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Overlay & Actions */}
                <div className="relative z-10 flex items-end justify-between gap-3 w-full pb-1">
                  
                  {/* Left Concept Details */}
                  <div className="flex-1 space-y-3 text-left">
                    
                    {/* Creator Tag */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#732729] to-[#bc8381] flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/30">
                        {item.requestedBy.replace('@', '').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-white/90 drop-shadow">
                        @{item.requestedBy}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight drop-shadow-md">
                        {item.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-200/90 mt-1 line-clamp-3 font-medium leading-relaxed drop-shadow">
                        {item.description}
                      </p>
                    </div>

                    {/* Swatches */}
                    {item.colors && item.colors.length > 0 && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[10px] font-extrabold uppercase text-stone-300 tracking-wider">Concept Palette:</span>
                        <div className="flex gap-1.5">
                          {item.colors.map((col, idx) => (
                            <div
                              key={`${col}-${idx}`}
                              style={{ backgroundColor: col }}
                              className="w-5 h-5 rounded-full border border-white/40 shadow-sm"
                              title={col}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar: TRY ON & REMIX */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleTryOn(item, e)}
                        className="py-2.5 px-3 bg-white text-stone-950 hover:bg-white/90 rounded-full font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#ff4e7e]" />
                        <span>TRY ON</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRemix(item, e)}
                        className="py-2.5 px-3 bg-[#732729] hover:bg-[#5c1d1f] text-white border border-[#bc8381]/50 rounded-full font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                      >
                        <Wand2 className="w-4 h-4 text-amber-300" />
                        <span>REMIX</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Floating Actions (Vote Envelope, Like, Share & Side-by-Side Up/Down Chevrons) */}
                  <div className="flex flex-col items-center gap-2.5 shrink-0">
                    
                    {/* Vote Button (Envelope Icon) */}
                    <div className="flex flex-col items-center gap-0.5 relative">
                      {isRecentlyVoted && (
                        <motion.div
                          initial={{ opacity: 1, y: 0, scale: 0.8 }}
                          animate={{ opacity: [1, 1, 0], y: -26, scale: [0.8, 1.25, 1.1] }}
                          transition={{ duration: 2.2, ease: "easeOut" }}
                          className="absolute -top-4 right-0 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-xl pointer-events-none flex items-center gap-1 z-30 whitespace-nowrap"
                        >
                          <span>+1 Vote!</span>
                          <span>✨</span>
                        </motion.div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleUpvote(item.id, e)}
                        className={`w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                          isRecentlyVoted ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-white/20 shadow-lg'
                        }`}
                        title={isUpvoted ? 'Voted!' : 'Vote for concept'}
                      >
                        <Mail className={`w-5 h-5 transition-transform ${isUpvoted ? 'text-amber-400 fill-amber-400/30 scale-110' : 'text-white'}`} />
                      </button>
                      <span className={`text-[11px] font-black drop-shadow-md transition-colors ${isRecentlyVoted ? 'text-amber-300 scale-110 font-black' : 'text-white'}`}>
                        {item.votes || 0}
                      </span>
                    </div>

                    {/* Heart / Like Button */}
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => toggleLike(item.id, e)}
                        className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg active:scale-90 transition-all cursor-pointer"
                        title={isLiked ? "Unlike" : "Like"}
                      >
                        <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-[#ff4e7e] text-[#ff4e7e] scale-110' : 'text-white'}`} />
                      </button>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {isLiked ? 'Liked' : 'Like'}
                      </span>
                    </div>

                    {/* Share Button */}
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleShare(item, e)}
                        className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg active:scale-90 transition-all cursor-pointer"
                        title="Share Proposal"
                      >
                        <Share2 className="w-5 h-5 text-white" />
                      </button>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        Share
                      </span>
                    </div>

                    {/* Up and Down Navigation Chevrons (Side by Side Inline with TRY ON & REMIX) */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={currentReelIndex <= 0}
                        className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-md cursor-pointer"
                        title="Previous Wanted Look"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={currentReelIndex >= requests.length - 1}
                        className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-md cursor-pointer"
                        title="Next Wanted Look"
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

      {/* Toast Notification for share link copy */}
      {copiedNotification && (
        <div className="fixed top-8 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}
    </div>
  );
};
