import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Heart, 
  Plus, 
  TrendingUp, 
  Tag, 
  User, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  BarChart2, 
  Search, 
  X, 
  Lock, 
  Unlock, 
  Mail,
  ArrowUpRight,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { db, collection, getDocs, addDoc, updateDoc, doc, increment } from '../../firebase';
import { LookRequest } from '../../types';
import { GlitterConfetti } from '../common/GlitterConfetti';
import { DemandPulseCard } from './DemandPulseCard';
import { WantedQuickActionCard } from './WantedQuickActionCard';
import { WANTED_LOOKS_100 } from '../../data/wantedLooks100';
import { subscribeWantedLooks } from '../../services/wantedLooksService';
import { useCountUp } from '../../lib/liveCounters';

const CATEGORY_COVERS: Record<string, string> = {
  'Eyes': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
  'Lips': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
  'Blush': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'Highlight': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
  'Full Face': 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
  'Other': 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
};

const PRESET_REQUESTS: LookRequest[] = [
  {
    id: 'req_1',
    title: 'Holographic Liquid Chrome Liners',
    description: 'A multi-chrome eyeliner that shifts between violet, teal, and gold depending on the light angle.',
    category: 'Eyes',
    colors: ['#a78bfa', '#2dd4bf', '#fbbf24'],
    requestedBy: 'beauty_by_kat',
    votes: 48,
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

interface TrendingPageProps {
  externalSearchQuery?: string;
  onSelectProposalForFeed?: (requestId: string) => void;
  onNavigate?: (tab: any) => void;
}

export const TrendingPage: React.FC<TrendingPageProps> = ({ externalSearchQuery, onSelectProposalForFeed, onNavigate }) => {
  const [requests, setRequests] = useState<LookRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Eyes');
  const [requestedBy, setRequestedBy] = useState<string>(() => localStorage.getItem('tryon_beauty_username') || '');
  const [color1, setColor1] = useState<string>('#db2777');
  const [color2, setColor2] = useState<string>('#9333ea');
  const [color3, setColor3] = useState<string>('#f59e0b');
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Animation and Success State
  const [isAnimatingSubmit, setIsAnimatingSubmit] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  
  const [votedIds, setVotedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_voted_requests') || '[]');
    } catch {
      return [];
    }
  });

  // Interactive Tracker State
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<'live' | 'today' | 'week'>('live');
  const [isRefreshingPulse, setIsRefreshingPulse] = useState<boolean>(false);
  const [pulseToast, setPulseToast] = useState<string | null>(null);

  // 3D Badge & Glitter Confetti State
  const [isGlitterConfettiActive, setIsGlitterConfettiActive] = useState<boolean>(false);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [badgeBoostTrigger, setBadgeBoostTrigger] = useState<number>(0);
  const [recentlyVotedLookId, setRecentlyVotedLookId] = useState<string | null>(null);

  /** When the board last changed, and how long ago that reads as now. */
  const [pulseUpdatedAt, setPulseUpdatedAt] = useState<number>(Date.now());
  const [pulseSecondsAgo, setPulseSecondsAgo] = useState<number>(0);

  /**
   * The bag fills the first time this board is opened after the app is
   * launched. sessionStorage is cleared when the app is closed, so it plays
   * again on the next launch but not every time the tab is tapped.
   */
  /** The wanted board, for the target view. */
  const [wantedLooks, setWantedLooks] = useState(WANTED_LOOKS_100);

  useEffect(() => {
    const unsubscribe = subscribeWantedLooks(setWantedLooks);
    return () => unsubscribe();
  }, []);

  const [playBagDrop, setPlayBagDrop] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('tryon_bag_dropped')) return false;
      sessionStorage.setItem('tryon_bag_dropped', '1');
      return true;
    } catch {
      return true;
    }
  });

  const categories = ['Eyes', 'Lips', 'Blush', 'Highlight', 'Full Face', 'Other'];

  const currentUser = requestedBy.trim() || localStorage.getItem('tryon_beauty_username') || localStorage.getItem('kobella_username') || '';

  const fetchRequests = async () => {
    setLoading(true);
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
          isPublic: data.isPublic !== false, // default to true
          status: (data.status || 'requested') as 'requested' | 'selected' | 'being built' | 'released',
          createdAt: data.createdAt || Date.now()
        });
      });

      if (dbRequests.length === 0) {
        for (const preset of PRESET_REQUESTS) {
          const { id, ...data } = preset;
          await addDoc(collection(db, 'requests'), {
            ...data,
            createdAt: Date.now() - (preset.votes * 3600 * 1000)
          });
        }
        const newSnapshot = await getDocs(collection(db, 'requests'));
        const seededRequests: LookRequest[] = [];
        newSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          seededRequests.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            category: data.category,
            colors: data.colors || [],
            requestedBy: data.requestedBy || 'Anonymous',
            votes: data.votes || 0,
            votedUsers: data.votedUsers || [],
            isPublic: data.isPublic !== false,
            status: (data.status || 'requested') as 'requested' | 'selected' | 'being built' | 'released',
            createdAt: data.createdAt || Date.now()
          });
        });
        seededRequests.sort((a, b) => b.votes - a.votes);
        setRequests(seededRequests);
      } else {
        dbRequests.sort((a, b) => b.votes - a.votes);
        setRequests(dbRequests);
      }
    } catch (err) {
      console.error("Error loading requests from Firebase:", err);
      setRequests(PRESET_REQUESTS.sort((a, b) => b.votes - a.votes));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const finalUsername = requestedBy.trim() || 'Anonymous';
    localStorage.setItem('tryon_beauty_username', finalUsername);

    const newRequestData = {
      title: title.trim(),
      description: description.trim(),
      category,
      colors: [color1, color2, color3],
      requestedBy: finalUsername,
      votes: 1,
      votedUsers: [],
      isPublic,
      status: 'requested' as 'requested' | 'selected' | 'being built' | 'released',
      createdAt: Date.now()
    };

    try {
      // 1. Open the mailbox letter drop animation overlay!
      setIsAnimatingSubmit(true);

      // Save to Firebase (await)
      const docRef = await addDoc(collection(db, 'requests'), newRequestData);
      
      const addedRequest: LookRequest = {
        id: docRef.id,
        ...newRequestData
      };

      // Mark this proposal as voted by the user immediately
      const newVoted = [...votedIds, docRef.id];
      setVotedIds(newVoted);
      localStorage.setItem('tryon_beauty_voted_requests', JSON.stringify(newVoted));

      // 2. Wait for the animation to play beautifully (e.g. 2300ms) then refresh the page!
      setTimeout(() => {
        setIsAnimatingSubmit(false);
        setFormSuccess(true);
        setTitle('');
        setDescription('');
        
        // Reload page to show saved state at the top of ranking
        window.location.reload();
      }, 2350);

    } catch (err) {
      console.error("Error submitting custom request: ", err);
      setIsAnimatingSubmit(false);
    }
  };

  const handleUpvote = async (id: string) => {
    if (votedIds.includes(id)) return;

    // 1. Immediately activate 3-second full-screen glitter confetti
    setIsGlitterConfettiActive(true);
    setConfettiKey(prev => prev + 1);

    // 2. Accelerate 3D spinning votes badge
    setBadgeBoostTrigger(prev => prev + 1);

    // 3. Mark recently voted look for celebratory animation
    setRecentlyVotedLookId(id);

    // Auto-fade / reset confetti and highlight after 3000ms
    setTimeout(() => {
      setIsGlitterConfettiActive(false);
      setRecentlyVotedLookId(null);
    }, 3000);

    try {
      const docRef = doc(db, 'requests', id);
      await updateDoc(docRef, { votes: increment(1) });

      const newVoted = [...votedIds, id];
      setVotedIds(newVoted);
      localStorage.setItem('tryon_beauty_voted_requests', JSON.stringify(newVoted));

      setRequests(prev =>
        prev.map(req => req.id === id ? { ...req, votes: req.votes + 1 } : req)
            .sort((a, b) => b.votes - a.votes)
      );
    } catch (err) {
      console.error("Error casting request upvote: ", err);
    }
  };

  const calculateTrendingStats = () => {
    const totalVotes = requests.reduce((sum, req) => sum + req.votes, 0);
    
    const catCounts: Record<string, number> = {};
    categories.forEach(c => catCounts[c] = 0);
    
    requests.forEach(req => {
      if (catCounts[req.category] !== undefined) {
        catCounts[req.category] += req.votes;
      } else {
        catCounts['Other'] += req.votes;
      }
    });

    const categoryStats = Object.keys(catCounts).map(name => {
      const val = catCounts[name];
      const pct = totalVotes > 0 ? Math.round((val / totalVotes) * 100) : 0;
      return { name, value: val, percentage: pct };
    }).sort((a, b) => b.value - a.value);

    return { totalVotes, categories: categoryStats };
  };

  const trendingStats = calculateTrendingStats();
  const topRisingProposal = requests.length > 0
    ? [...requests].sort((a, b) => b.votes - a.votes)[0]?.title || 'Velvet Plum'
    : 'Velvet Plum';

  // What the tracker counts. The "today" figure used to be the number 18,
  // written into the page, which made a live tracker say the same thing
  // forever.
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const proposalsToday = requests.filter((req) => (req.createdAt || 0) >= startOfToday).length;
  const votesToday = requests
    .filter((req) => (req.createdAt || 0) >= startOfToday)
    .reduce((sum, req) => sum + (req.votes || 0), 0);
  const animatedTotalVotes = useCountUp(trendingStats.totalVotes);
  const backedByYou = requests.filter(
    (req) => currentUser && req.votedUsers?.includes(currentUser)
  ).length;

  // The board moving is the reason to keep looking, so say when it last did.
  useEffect(() => {
    setPulseUpdatedAt(Date.now());
  }, [trendingStats.totalVotes, requests.length]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setPulseSecondsAgo(Math.floor((Date.now() - pulseUpdatedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [pulseUpdatedAt]);

  // Filter requests based on privacy rules:
  // - Show public requests (isPublic !== false)
  // - Show private requests belonging to the CURRENT user only!
  const visibleRequests = requests.filter(req => {
    const isOwner = currentUser && req.requestedBy.toLowerCase() === currentUser.toLowerCase();
    return req.isPublic !== false || isOwner;
  });

  const effectiveSearch = (externalSearchQuery !== undefined ? externalSearchQuery : searchQuery).trim();

  const filteredRequests = visibleRequests.filter(req => {
    const matchesCategory = !activeCategoryFilter || 
      req.category.toLowerCase() === activeCategoryFilter.toLowerCase() ||
      (activeCategoryFilter === 'Highlight' && req.category.toLowerCase().includes('high')) ||
      (activeCategoryFilter === 'Full Face' && req.category.toLowerCase().includes('face'));

    const matchesSearch = effectiveSearch === '' || 
      req.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(effectiveSearch.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleRefreshPulse = async () => {
    setIsRefreshingPulse(true);
    setPulseToast('Syncing live demand votes...');
    await fetchRequests();
    setTimeout(() => {
      setIsRefreshingPulse(false);
      setPulseToast('✓ Demand tracker is up to date');
      setTimeout(() => setPulseToast(null), 2500);
    }, 600);
  };

  const handleApplyHotFormula = () => {
    setIsFormExpanded(true);
    setTitle('Velvet Plum + Holographic Pearl');
    setDescription('Ultra-pigmented velvet plum base with prismatic holographic shimmer pearl glaze.');
    setColor1('#4c1d95');
    setColor2('#c026d3');
    setColor3('#f5d0fe');
    setPulseToast('✨ Applied Hot Formula into proposal builder below!');
    setTimeout(() => setPulseToast(null), 3000);
    
    // Smooth scroll to form
    setTimeout(() => {
      const formEl = document.getElementById('proposal-form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div id="trending-page" className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-stone-800 animate-in fade-in duration-300 relative">
      
      {/* 3-SECOND FULL-SCREEN GLITTER CONFETTI SHOWER ON VOTE */}
      <GlitterConfetti 
        key={confettiKey} 
        active={isGlitterConfettiActive} 
        durationMs={3000} 
        onComplete={() => setIsGlitterConfettiActive(false)} 
      />

      {/* MAILBOX LETTER ANIMATION OVERLAY */}
      {isAnimatingSubmit && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-sheet rounded-[24px] p-8 text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-x-8 -top-20 h-44 bg-[#2A1715]/10 blur-3xl pointer-events-none" />
            
            {/* Mailbox Container with Slot and sliding letter */}
            <div className="relative h-48 flex flex-col items-center justify-center">
              
              {/* Box Slot */}
              <div className="absolute bottom-4 w-40 h-16 bg-[#2A1715] rounded-b-xl border-t border-[#B8887A]/50 flex items-center justify-center shadow-lg">
                <div className="absolute top-0 w-32 h-2.5 bg-stone-950 rounded-full mt-1.5 shadow-inner overflow-hidden flex justify-center">
                  {/* Flap flip rotation */}
                  <motion.div 
                    animate={{ rotateX: [0, -90, -90, 0] }}
                    transition={{ delay: 0.6, duration: 0.8, times: [0, 0.3, 0.7, 1] }}
                    className="w-full h-full bg-stone-800 origin-top"
                  />
                </div>
                <span className="text-[8px] font-black uppercase text-[#B8887A] tracking-widest mt-5">TryOnBeauty Lab Box</span>
              </div>

              {/* Envelope / Letter Card */}
              <motion.div
                initial={{ y: -120, scale: 0.9, opacity: 1, rotate: -5 }}
                animate={{ 
                  y: [null, -100, -90, 8], 
                  scale: [1, 1, 0.7, 0.25], 
                  opacity: [1, 1, 1, 0],
                  rotate: [null, -5, 5, 0]
                }}
                transition={{ 
                  duration: 1.8, 
                  times: [0, 0.2, 0.5, 1],
                  ease: "easeInOut" 
                }}
                className="w-56 bg-[#faf6f5] border border-[#B8887A]/30 p-4 rounded-xl shadow-md space-y-2 text-left z-10"
              >
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#B8887A]/20 border border-[#B8887A]/45 flex items-center justify-center font-display text-[10px] font-black text-[#2A1715]">
                  T
                </div>
                <div className="text-[8px] font-black text-[#B8887A] uppercase tracking-wider">New Look Proposal</div>
                <h4 className="text-xs font-bold text-stone-800 line-clamp-1">{title || 'Custom Shader'}</h4>
                <p className="text-[9px] text-stone-500 font-medium line-clamp-1">{category}</p>
                <div className="flex gap-1.5 pt-1">
                  <div style={{ backgroundColor: color1 }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                  <div style={{ backgroundColor: color2 }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                  <div style={{ backgroundColor: color3 }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                </div>
              </motion.div>

              {/* Star sparkles emanating on receipt */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 0, 1.3, 1], opacity: [0, 0, 1, 1] }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute bottom-16 flex items-center justify-center text-[#ff3f87] font-black text-xs"
              >
                ✨ Received!
              </motion.div>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-stone-900 text-lg uppercase tracking-wider">Depositing Proposal...</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto font-semibold">
                Your creative recipe card is sliding straight into our developer queue. Saving & refreshing board...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: Controls & Distribution Form (Cols: 4) */}
      <div className="xl:col-span-4 space-y-6">
        
        {/* 1. THE BAG - what is wanted right now, as it fills up */}
        <DemandPulseCard
          totalVotes={trendingStats.totalVotes}
          votesToday={votesToday}
          proposalsToday={proposalsToday}
          backedByYou={backedByYou}
          categories={trendingStats.categories}
          topRising={topRisingProposal}
          leaders={[...requests]
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 12)
            .map((req) => ({ title: req.title, votes: req.votes }))}
          activeCategoryFilter={activeCategoryFilter}
          isRefreshing={isRefreshingPulse}
          onRefresh={handleRefreshPulse}
          onSelectCategory={(name) => {
            setActiveCategoryFilter(name);
            setPulseToast(
              name ? `Filtered demand board to: ${name}` : "Cleared category filter"
            );
            setTimeout(() => setPulseToast(null), 2500);
          }}
          onSelectTopRising={() => {
            setSearchQuery(topRisingProposal);
            setPulseToast(`Filtered to Top Rising: ${topRisingProposal}`);
            setTimeout(() => setPulseToast(null), 2500);
          }}
          onApplyHotFormula={handleApplyHotFormula}
          onInspectTotal={() => {
            setActiveCategoryFilter(null);
            setPulseToast(`Tracking ${trendingStats.totalVotes} total community votes`);
            setTimeout(() => setPulseToast(null), 2500);
          }}
          toast={pulseToast}
          playDrop={playBagDrop}
          onDropFinished={() => setPlayBagDrop(false)}
        />

        {/* 2. WANTED QUICK ACTION CARD (MATCHING DESIGN WITH WANT BUTTONS, SWATCHES & SEE MORE) */}
        <WantedQuickActionCard
          onSeeMore={() => {
            if (onNavigate) {
              onNavigate('wanted-list');
            }
          }}
          onNavigate={onNavigate}
          onRequestClick={() => {
            setIsFormExpanded(true);
            setTimeout(() => {
              const formEl = document.getElementById('proposal-form');
              if (formEl) {
                formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }}
          onSelectLook={(item) => {
            setSearchQuery(item.name);
            setPulseToast(`Viewing community entries for "${item.name}"`);
            setTimeout(() => setPulseToast(null), 2500);
          }}
        />

        {/* 3. PROPOSE NEXT SHADES SUBMISSION FORM (COMPACT COLLAPSIBLE WITH X BUTTON) */}
        <div id="proposal-form" className="bg-white rounded-2xl border border-[#B8887A]/25 shadow-md text-left overflow-hidden transition-all duration-300">
          {!isFormExpanded ? (
            /* COMPACT COLLAPSED CARD */
            <div 
              onClick={() => setIsFormExpanded(true)}
              className="p-5 sm:p-6 hover:bg-[#faf6f5]/60 cursor-pointer transition-colors group flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#2A1715]/10 text-[#2A1715] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#2A1715] group-hover:text-white transition-all shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-display font-bold text-[#2A1715] group-hover:text-[#1C1917] transition-colors truncate">
                    Propose Next Shades
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium line-clamp-1">
                    Request a specific makeup shade or finishing formula to be modeled next.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFormExpanded(true);
                }}
                className="px-3 py-1.5 bg-[#2A1715] hover:bg-[#1C1917] text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Propose</span>
              </button>
            </div>
          ) : (
            /* EXPANDED COMPLETE FORM WITH COLLAPSE X BUTTON */
            <div className="p-5 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-[#B8887A]/15">
                <div>
                  <h3 className="text-base font-display font-bold text-[#2A1715]">Propose Next Shades</h3>
                  <p className="text-[11px] text-stone-500 font-semibold">Request a specific makeup shade or finishing filter formula to be modeled next.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormExpanded(false)}
                  title="Collapse proposal form"
                  className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                {formSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2 text-emerald-600 text-xs">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Proposed successfully! Initial vote credited.</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Look Name / Concept</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chrome Prism Violet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-[#B8887A]/35 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2A1715]/50 font-semibold text-stone-800 bg-[#faf6f5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs bg-[#faf6f5] border border-[#B8887A]/35 rounded-lg px-2.5 py-2.5 font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2A1715]/50"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat} className="bg-white text-stone-800">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Your Name</label>
                    <input
                      type="text"
                      placeholder="designer_99"
                      value={requestedBy}
                      onChange={(e) => setRequestedBy(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-[#B8887A]/35 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2A1715]/50 font-semibold text-stone-800 bg-[#faf6f5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Associated Palette Colors (Pick 3)</label>
                  <div className="flex items-center gap-3 bg-[#faf6f5] p-2.5 border border-[#B8887A]/25 rounded-xl justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="color" 
                        value={color1} 
                        onChange={(e) => setColor1(e.target.value)} 
                        className="w-6 h-6 rounded-full border border-stone-200 overflow-hidden cursor-pointer shrink-0"
                      />
                      <span className="text-[10px] text-stone-400 font-mono font-bold">{color1.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-[#B8887A]/15 pl-3">
                      <input 
                        type="color" 
                        value={color2} 
                        onChange={(e) => setColor2(e.target.value)} 
                        className="w-6 h-6 rounded-full border border-stone-200 overflow-hidden cursor-pointer shrink-0"
                      />
                      <span className="text-[10px] text-stone-400 font-mono font-bold">{color2.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-[#B8887A]/15 pl-3">
                      <input 
                        type="color" 
                        value={color3} 
                        onChange={(e) => setColor3(e.target.value)} 
                        className="w-6 h-6 rounded-full border border-stone-200 overflow-hidden cursor-pointer shrink-0"
                      />
                      <span className="text-[10px] text-stone-400 font-mono font-bold">{color3.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Describe your Finish Vision</label>
                  <textarea
                    required
                    placeholder="Describe texture specifications (e.g., high density chromatic glitter glaze, matte clay)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full text-xs px-3.5 py-2.5 border border-[#B8887A]/35 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2A1715]/50 font-semibold text-stone-800 bg-[#faf6f5]"
                  />
                </div>

                {/* PUBLICITY PRIVACY TOGGLE SETTING */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide">Visibility Option</label>
                  <div className="bg-[#faf6f5] p-3 rounded-xl border border-[#B8887A]/25 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4 text-[#2A1715] border-[#B8887A]/35 rounded focus:ring-[#2A1715]/50"
                      />
                      <span className="text-xs font-bold text-stone-800">Publish to Community Board</span>
                    </label>

                    {isPublic ? (
                      <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                        🌟 This look request will be displayed publicly on the community board so other users can view, share, and vote to increase its development priority.
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-700/80 font-bold leading-relaxed bg-amber-500/10 border border-amber-500/15 p-2 rounded-lg">
                        🔒 Private Submission: This request is set to private. Lab specialists will review your submission confidentially, but it will not appear on the public board for voting.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#2A1715] hover:bg-[#1C1917] text-white font-extrabold text-xs tracking-widest uppercase py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4" /> Submit Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormExpanded(false)}
                    className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Demand Board with 2x2 Cards Grid (Cols: 8) */}
      <div className="xl:col-span-8 glass-card rounded-2xl p-4 sm:p-6 min-h-[600px] text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#B8887A]/25 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-display font-bold text-[#2A1715]">Proposed Ideas & Vote Rankings</h3>
            <p className="text-xs text-stone-500">These concepts are actively designed based on community support. Upvote your favorites!</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Active Category Filter Tag if set */}
            {activeCategoryFilter && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2A1715] text-white text-xs font-bold shadow-xs">
                <span>Category: {activeCategoryFilter}</span>
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter(null)}
                  title="Clear category filter"
                  className="p-0.5 hover:bg-white/20 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search ideas or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-8 py-2 bg-[#faf6f5] border border-[#B8887A]/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2A1715]/50 font-semibold text-stone-800 placeholder-stone-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200/50 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <span className="text-xs font-bold text-[#2A1715] bg-[#B8887A]/10 border border-[#B8887A]/25 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">
              {filteredRequests.length} Proposals
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-stone-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2A1715]" />
            <span className="text-xs font-bold">Loading proposals from community registry...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[#B8887A]/40 rounded-2xl bg-[#faf6f5]/50 text-stone-400 space-y-3">
            <p className="text-sm font-bold">No proposals found matching your search.</p>
            <p className="text-xs">Try searching for something else or submit your own concept on the left!</p>
          </div>
        ) : (
          /* 2x2 RESPONSIVE GRID OF CARDS LIKE TRENDING */
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-4.5">
            {filteredRequests.map((req) => {
              const hasVoted = votedIds.includes(req.id);
              const isRecentlyVoted = recentlyVotedLookId === req.id;
              const cardCover = CATEGORY_COVERS[req.category] || CATEGORY_COVERS['Other'];
              const isPrivate = req.isPublic === false;

              return (
                <div
                  key={req.id}
                  onClick={() => onSelectProposalForFeed && onSelectProposalForFeed(req.id)}
                  className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer hover:-translate-y-0.5 relative ${
                    isRecentlyVoted 
                      ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.35)] scale-[1.01]' 
                      : 'border-[#B8887A]/20 hover:border-[#2A1715]/35 hover:shadow-[0_8px_16px_rgba(115,39,41,0.06)]'
                  }`}
                >
                  {/* Portrait Cover Image */}
                  <div className="relative h-28 sm:h-36 md:h-40 w-full overflow-hidden bg-stone-100 border-b border-[#B8887A]/15">
                    <img 
                      src={cardCover} 
                      alt={req.category}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/20 to-transparent" />

                    {/* Category Meta Tag */}
                    <div className="absolute top-2.5 left-2.5 bg-white/95 border border-[#B8887A]/25 backdrop-blur-md px-2 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-black uppercase text-[#2A1715] shadow-2xs">
                      {req.category}
                    </div>

                    {isPrivate && (
                      <div className="absolute top-2.5 right-2.5 bg-amber-600 border border-amber-500/30 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-xs">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2.5 right-2.5 text-[9.5px] sm:text-[10px] text-white/90 font-bold truncate">
                      @{req.requestedBy}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-[#2A1715] text-xs sm:text-sm group-hover:text-[#B8887A] transition-colors line-clamp-1 leading-snug">
                        {req.title}
                      </h4>
                      <p className="text-[10.5px] sm:text-xs text-stone-500 leading-relaxed font-medium line-clamp-2">
                        {req.description}
                      </p>

                      {isPrivate && (
                        <div className="mt-1 text-[9px] text-amber-700 bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg font-bold">
                          🔒 Private proposal
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {/* Swatches */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[8.5px] font-bold uppercase text-stone-400 tracking-wider">Palette</span>
                        <div className="flex gap-1">
                          {req.colors.slice(0, 3).map((color, idx) => (
                            <div
                              key={`${color}-${idx}`}
                              style={{ backgroundColor: color }}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-stone-200 shadow-2xs shrink-0"
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Vote Count & Action Button */}
                      <div className="flex items-center justify-between border-t border-[#B8887A]/15 pt-2.5 relative">
                        {/* Floating +1 Sparkle Pop Animation */}
                        {isRecentlyVoted && (
                          <motion.div
                            initial={{ opacity: 1, y: 0, scale: 0.8 }}
                            animate={{ opacity: [1, 1, 0], y: -20, scale: [0.8, 1.25, 1.1] }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute -top-3 left-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg pointer-events-none flex items-center gap-1 z-30"
                          >
                            <span>+1 Vote!</span>
                            <span>✨</span>
                          </motion.div>
                        )}

                        <div className="flex items-center gap-1">
                          <Heart 
                            className={`w-3.5 h-3.5 text-[#2A1715] transition-transform duration-300 ${
                              hasVoted ? 'fill-current' : ''
                            } ${isRecentlyVoted ? 'scale-125 text-[#f43f5e]' : ''}`} 
                          />
                          <span className={`text-[11px] sm:text-xs font-bold transition-colors duration-300 ${
                            isRecentlyVoted ? 'text-amber-700 font-extrabold' : 'text-stone-700'
                          }`}>
                            {req.votes} <span className="text-stone-400 font-normal hidden sm:inline">votes</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(req.id);
                          }}
                          disabled={hasVoted}
                          className={`text-[9.5px] sm:text-[10px] font-extrabold tracking-wider uppercase px-2.5 sm:px-3 py-1 rounded-lg cursor-pointer transition-all ${
                            hasVoted
                              ? 'bg-[#B8887A]/15 text-[#2A1715] border border-[#B8887A]/20 cursor-default'
                              : 'bg-[#2A1715] hover:bg-[#1C1917] text-white border border-transparent active:scale-95 shadow-2xs'
                          }`}
                        >
                          {hasVoted ? 'Voted' : 'WANT'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
