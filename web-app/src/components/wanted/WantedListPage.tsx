import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  Heart, 
  Plus, 
  Sparkles, 
  X, 
  Check,
  RefreshCw
} from 'lucide-react';
import { WantedLookItem } from '../trending/WantedQuickActionCard';
import { WANTED_LOOKS_100 } from '../../data/wantedLooks100';
import { 
  subscribeWantedLooks, 
  voteWantedLookInFirestore, 
  createWantedLookInFirestore, 
  seedWantedLooksIfEmpty 
} from '../../services/wantedLooksService';

interface WantedListPageProps {
  onNavigate?: (tab: any) => void;
  onBack?: () => void;
  onLoadPreset?: (look: any) => void;
}

export const WantedListPage: React.FC<WantedListPageProps> = ({
  onNavigate,
  onBack,
  onLoadPreset
}) => {
  const [items, setItems] = useState<WantedLookItem[]>(WANTED_LOOKS_100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('tryon_beauty_wanted_voted_items');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Firestore Real-time Subscription
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeWantedLooks(
      (updatedLooks) => {
        setItems(updatedLooks);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Firestore subscription warning, fallback active:', err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // New Request Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Eyes');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newRequestedBy, setNewRequestedBy] = useState<string>(() => localStorage.getItem('tryon_beauty_username') || 'creator_vip');
  const [newColor1, setNewColor1] = useState<string>('#9333ea');
  const [newColor2, setNewColor2] = useState<string>('#db2777');
  const [isModalSubmitting, setIsModalSubmitting] = useState<boolean>(false);
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);

  const categories = ['All', 'Eyes', 'Lips', 'Blush', 'Highlight'];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('gallery-wanted');
    } else {
      window.history.back();
    }
  };

  const handleToggleWant = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isCurrentlyVoted = !votedMap[id];

    // Trigger expanding heart & particle animation
    setAnimatingId(id);
    setTimeout(() => {
      setAnimatingId(null);
    }, 800);

    // Update local state and storage optimistically
    const newMap = { ...votedMap, [id]: isCurrentlyVoted };
    setVotedMap(newMap);
    localStorage.setItem('tryon_beauty_wanted_voted_items', JSON.stringify(newMap));

    let updatedVotes = 0;
    let updatedLabel = '';

    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const delta = isCurrentlyVoted ? 1 : -1;
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

    if (isCurrentlyVoted) {
      showToast('Added to wanted list!');
    }

    // Persist vote to Firestore
    try {
      if (updatedLabel) {
        await voteWantedLookInFirestore(id, updatedVotes, updatedLabel);
      }
    } catch (err) {
      console.warn('Could not sync vote to Firestore:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsModalSubmitting(true);

    const newItem: WantedLookItem = {
      id: `w_custom_${Date.now()}`,
      name: newTitle.trim(),
      countLabel: '1 want this',
      numericVotes: 1,
      category: newCategory,
      swatchType: 'gradient',
      colors: [newColor1, newColor2],
      description: newDescription.trim() || 'Custom formulated shader request submitted by the community.',
      requestedBy: newRequestedBy.trim() || 'you'
    };

    // Optimistic UI update
    setItems(prev => [newItem, ...prev]);
    const updatedVoted = { ...votedMap, [newItem.id]: true };
    setVotedMap(updatedVoted);
    localStorage.setItem('tryon_beauty_wanted_voted_items', JSON.stringify(updatedVoted));

    // Save to Firestore
    try {
      await createWantedLookInFirestore(newItem);
    } catch (err) {
      console.warn('Could not save custom wanted look to Firestore:', err);
    }

    setIsModalSubmitting(false);
    setModalSuccess(true);

    setTimeout(() => {
      setModalSuccess(false);
      setIsRequestModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      showToast('Published to Wanted Looks in Firestore!');
    }, 700);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = search.trim() === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.requestedBy && item.requestedBy.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 pt-1 pb-16 text-left animate-in fade-in duration-150 relative">
      
      {/* STICKY TOP BAR WITH BACK ARROW ALWAYS ACCESSIBLE IN TOP LEFT */}
      <div className="sticky top-1 sm:top-2 z-40 flex items-center justify-between pointer-events-none mb-3 py-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md hover:bg-stone-100 text-stone-800 text-xs font-bold border border-[#EDE7E3] shadow-sm transition-all cursor-pointer active:scale-95 select-none"
        >
          <ArrowLeft className="w-4 h-4 text-stone-800" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2A1715] hover:bg-[#1C1917] active:scale-95 text-white text-xs font-bold rounded-full transition-all shadow-sm cursor-pointer select-none"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Request</span>
        </button>
      </div>

      {/* COMPACT INTRO & FILTER CARD */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 mb-3.5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-display font-bold text-stone-900 tracking-tight">
              Community Wanted List
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#2A1715]/10 text-[#2A1715] text-[11px] font-bold">
              {items.length} looks
            </span>
          </div>
        </div>

        {/* Compact Search & Category Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search requested shaders, formulas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#faf6f5] border border-[#B8887A]/25 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2A1715]/50 placeholder-stone-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-[#2A1715] text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOAST POPUP */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#2A1715] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 select-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WANTED LOOKS MAIN LIST (EXACT DESIGN MATCHING WANTED CONTENT FROM SCREENSHOT 3) */}
      <div className="glass-card rounded-3xl p-3 sm:p-5 divide-y divide-stone-100">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <p className="text-xs sm:text-sm font-bold text-stone-600">No requested looks found</p>
            <p className="text-xs">Try adjusting your search keywords or category filters.</p>
            <button
              type="button"
              onClick={() => { setSearch(''); setSelectedCategory('All'); }}
              className="mt-2 px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isVoted = !!votedMap[item.id];
            const isAnimating = animatingId === item.id;

            return (
              <div
                key={item.id}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group hover:bg-stone-50/70 -mx-1 sm:-mx-2 px-2 sm:px-3 rounded-2xl transition-colors"
              >
                {/* Left: Swatch Icon & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Rounded Square Swatch */}
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-2xs shrink-0 flex items-center justify-center border border-black/5">
                    {item.swatchType === 'concentric' ? (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: item.colors[0] }}
                      >
                        <div 
                          className="w-4.5 h-4.5 rounded-full shadow-inner border border-white/20"
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

                  {/* Title & Vote Count */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-[13.5px] font-bold text-stone-900 leading-snug group-hover:text-[#2A1715] transition-colors truncate">
                      {item.name}
                    </h3>
                    <p className="text-[11.5px] text-stone-400 font-medium mt-0.5">
                      {item.countLabel}
                    </p>
                  </div>
                </div>

                {/* Right: WANT / WANTED Pill Button */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleWant(e, item.id)}
                    aria-label={`Want ${item.name}`}
                    className={`px-3 sm:px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-2xs ${
                      isVoted
                        ? 'bg-[#2A1715] text-white border-[#2A1715]'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <motion.div
                      animate={
                        isAnimating 
                          ? { scale: [1, 1.5, 1.1, 1], rotate: [0, -10, 10, 0] } 
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 transition-colors ${
                          isVoted 
                            ? 'text-white fill-white' 
                            : 'text-stone-700'
                        }`} 
                      />
                    </motion.div>
                    <span className="tracking-wider uppercase text-[10px] sm:text-[11px] font-bold">
                      {isVoted ? 'WANTED' : 'WANT'}
                    </span>
                  </button>

                  {/* Floating particle burst on WANT click */}
                  <AnimatePresence>
                    {isAnimating && (
                      <motion.div
                        initial={{ opacity: 1, y: 0, scale: 0.6 }}
                        animate={{ opacity: 0, y: -20, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="absolute -top-3 right-3 pointer-events-none text-rose-500 font-extrabold text-[11px] flex items-center gap-0.5 z-20"
                      >
                        <span>♥</span>
                        <span>+1</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* NEW REQUEST MODAL */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card rounded-3xl p-5 sm:p-6 max-w-md w-full text-left relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-display font-bold text-[#2A1715]">
                    Propose Wanted Shade
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Submit your makeup formula to the community vote.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {modalSuccess && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Proposal submitted! First vote credited.</span>
                </div>
              )}

              <form onSubmit={handleCreateRequest} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1">Look Name / Concept</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Velvet Noir"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-[#B8887A]/35 rounded-xl font-semibold text-stone-800 bg-[#faf6f5] focus:outline-none focus:ring-1 focus:ring-[#2A1715]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full text-xs bg-[#faf6f5] border border-[#B8887A]/35 rounded-xl px-2.5 py-2 font-semibold text-stone-800 focus:outline-none"
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1">Your Handle</label>
                    <input
                      type="text"
                      placeholder="creator_99"
                      value={newRequestedBy}
                      onChange={(e) => setNewRequestedBy(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-[#B8887A]/35 rounded-xl font-semibold text-stone-800 bg-[#faf6f5] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1">Palette Swatches</label>
                  <div className="flex items-center gap-3 bg-[#faf6f5] p-2 border border-[#B8887A]/25 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="color" 
                        value={newColor1} 
                        onChange={(e) => setNewColor1(e.target.value)} 
                        className="w-6 h-6 rounded-full border border-stone-200 overflow-hidden cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-500 font-mono font-bold">{newColor1.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-stone-200 pl-3">
                      <input 
                        type="color" 
                        value={newColor2} 
                        onChange={(e) => setNewColor2(e.target.value)} 
                        className="w-6 h-6 rounded-full border border-stone-200 overflow-hidden cursor-pointer"
                      />
                      <span className="text-[10px] text-stone-500 font-mono font-bold">{newColor2.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1">Details</label>
                  <textarea
                    rows={2}
                    placeholder="Describe finish, sparkles, glossiness..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full text-xs px-3.5 py-1.5 border border-[#B8887A]/35 rounded-xl font-medium text-stone-800 bg-[#faf6f5] focus:outline-none"
                  />
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isModalSubmitting}
                    className="flex-1 py-2.5 bg-[#2A1715] hover:bg-[#1C1917] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isModalSubmitting ? 'Publishing...' : 'Publish'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
