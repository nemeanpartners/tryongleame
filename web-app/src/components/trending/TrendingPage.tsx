import React, { useState, useEffect, useMemo } from 'react';
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
import { productTally, PRODUCTS } from '../../lib/wantedProducts';
import { openLookInNative } from '../../lib/nativeLooks';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
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

/** Every field in the proposal form, so they are all exactly the same box. */
const fieldBox =
  'w-full h-11 rounded-2xl bg-white/70 border border-white/80 px-3.5 text-[13px] font-semibold text-stone-800 placeholder-stone-400 appearance-none focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30';
/** What a proposal can be for: the products, not parts of the face. */
const PROPOSAL_CATEGORIES = [...PRODUCTS, 'Other'];

const fieldLabel =
  'block text-[9.5px] font-black text-stone-400 uppercase tracking-widest mb-1.5';

export const TrendingPage: React.FC<TrendingPageProps> = ({ externalSearchQuery, onSelectProposalForFeed, onNavigate }) => {
  const [requests, setRequests] = useState<LookRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Lipstick');
  const [requestedBy, setRequestedBy] = useState<string>(
    () =>
      auth.currentUser?.displayName ||
      localStorage.getItem('kobella_username') ||
      localStorage.getItem('tryon_beauty_username') ||
      ''
  );

  // The name arrives with the account, which may sign in after this mounts.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const name = user?.displayName || user?.email?.split('@')[0] || '';
      if (name) setRequestedBy((current) => current || name);
    });
    return () => unsubscribe();
  }, []);
  const [color1, setColor1] = useState<string>('#db2777');
  const [color2, setColor2] = useState<string>('#9333ea');
  const [color3, setColor3] = useState<string>('#f59e0b');
  const [isPublic] = useState<boolean>(true);
  /** A proposal always goes to the board; the choice is whose name is on it. */
  const [postAnonymously, setPostAnonymously] = useState<boolean>(false);

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

    const finalUsername = postAnonymously
      ? 'Anonymous'
      : requestedBy.trim() || 'Anonymous';
    if (!postAnonymously && requestedBy.trim()) {
      localStorage.setItem('tryon_beauty_username', requestedBy.trim());
    }

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

  /** The four products being asked for most, which is what the bag holds. */
  const wantedProducts = useMemo(() => productTally(wantedLooks, 4), [wantedLooks]);

  /** The shade climbing fastest, which is what Top rising names and wears. */
  const wantedLeader = useMemo(
    () => [...wantedLooks].sort((a, b) => b.numericVotes - a.numericVotes)[0],
    [wantedLooks]
  );
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
          categories={wantedProducts}
          topRising={wantedLeader?.name || topRisingProposal}
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
          onTryTopRising={() => {
            if (!wantedLeader) return;
            openLookInNative({
              id: wantedLeader.id,
              name: wantedLeader.name,
              lipColor: wantedLeader.colors[0]
            });
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
          onOpenMixMatch={() => onNavigate?.('sandbox')}
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
        <div id="proposal-form" className="glass-card rounded-[28px] text-left overflow-hidden transition-all duration-300">
          {!isFormExpanded ? (
            /* COMPACT COLLAPSED CARD */
            <div
              onClick={() => setIsFormExpanded(true)}
              className="p-5 sm:p-6 cursor-pointer group"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E91E63]" />
                Propose next shades
              </span>
              <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight mt-0.5">
                Ask for the one you want
              </h3>
              <p className="text-[11px] text-stone-500 font-medium mt-1 leading-relaxed">
                Name a shade nobody has made yet. It goes on the board for
                everyone to vote on.
              </p>

              {/* Whose it will be, so it is clearly yours before you start */}
              <div className="flex items-center gap-2.5 mt-4">
                <span className="w-8 h-8 rounded-full bg-[#2A1715] text-white text-[10px] font-black flex items-center justify-center shrink-0 uppercase">
                  {(currentUser || 'you').slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-stone-900 truncate">
                    {currentUser ? `Proposing as ${currentUser}` : 'Proposing as you'}
                  </p>
                  <p className="text-[10px] font-bold text-stone-400">
                    {requests.length} shades proposed so far
                  </p>
                </div>
              </div>

              {/* The colours it starts from, which is most of the work done */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-stone-400">
                  Starts with
                </span>
                {[color1, color2, color3].map((hex, index) => (
                  <span
                    key={index}
                    className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFormExpanded(true);
                }}
                className="w-full mt-4 h-12 rounded-full bg-[#E91E63] text-white text-[11.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Propose a shade
              </button>
            </div>
          ) : (
            /* EXPANDED FORM */
            <div className="p-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-display font-black text-stone-900 tracking-tight">Ask for the one you want</h3>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">Name it, colour it, and it goes on the board.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormExpanded(false)}
                  title="Close"
                  className="w-8 h-8 rounded-full neu-pill text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-3.5">
                {formSuccess && (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 flex items-center gap-2 text-emerald-700 text-[11px] font-bold">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>On the board. Your own vote is counted.</span>
                  </div>
                )}

                <div>
                  <label className={fieldLabel}>Look name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chrome Prism Violet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={fieldBox}
                  />
                </div>

                {/* Two fields, one height: a select and an input do not agree
                    on their own, so both are set explicitly. */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="min-w-0">
                    <label className={fieldLabel}>Category</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`${fieldBox} pr-8`}
                      >
                        {PROPOSAL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className="bg-white text-stone-800">{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className={fieldLabel}>Your name</label>
                    {requestedBy ? (
                      <input
                        type="text"
                        placeholder="designer_99"
                        value={requestedBy}
                        onChange={(e) => setRequestedBy(e.target.value)}
                        className={fieldBox}
                      />
                    ) : (
                      /* No account, no name to put on it: offer the way in
                         rather than an empty box. */
                      <button
                        type="button"
                        onClick={() => onNavigate?.('profile')}
                        className={`${fieldBox} bg-[#2A1715] text-white font-black text-[11px] uppercase tracking-wider cursor-pointer active:scale-95`}
                      >
                        Sign in
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className={fieldLabel}>Palette</label>
                  <div className="flex items-center gap-2">
                    {[
                      { value: color1, set: setColor1 },
                      { value: color2, set: setColor2 },
                      { value: color3, set: setColor3 }
                    ].map((swatch, index) => (
                      <label
                        key={index}
                        className="grow h-11 rounded-2xl bg-white/70 border border-white/80 flex items-center gap-2 px-3 cursor-pointer min-w-0"
                      >
                        <input
                          type="color"
                          value={swatch.value}
                          onChange={(e) => swatch.set(e.target.value)}
                          className="w-5 h-5 rounded-full border border-stone-200 overflow-hidden cursor-pointer shrink-0 bg-transparent p-0"
                        />
                        <span className="text-[9.5px] font-bold text-stone-400 tabular-nums truncate">
                          {swatch.value.toUpperCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={fieldLabel}>The finish you want</label>
                  <textarea
                    rows={2}
                    placeholder="Glitter glaze, matte clay, glass shine…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl bg-white/70 border border-white/80 px-3.5 py-2.5 text-[13px] font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/30 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setPostAnonymously(!postAnonymously)}
                  className="w-full flex items-center gap-2.5 rounded-2xl bg-white/70 border border-white/80 px-3.5 py-2.5 text-left cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      postAnonymously ? 'bg-[#E91E63]' : 'bg-white border border-stone-300'
                    }`}
                  >
                    {postAnonymously && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-black text-stone-900 leading-tight">
                      Post anonymously
                    </span>
                    <span className="block text-[10px] font-medium text-stone-400 leading-snug">
                      It still goes on the board, just without your name.
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="submit"
                    className="grow h-12 rounded-full bg-[#E91E63] text-white text-[11.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    Submit proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormExpanded(false)}
                    className="h-12 px-5 rounded-full neu-pill text-stone-600 font-black text-[11.5px] uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
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
