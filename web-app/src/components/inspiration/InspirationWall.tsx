import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Bookmark, 
  Share2, 
  Sparkles, 
  Camera, 
  SlidersHorizontal, 
  Search, 
  Grid, 
  List, 
  Plus, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Check, 
  Layers, 
  Palette, 
  Compass, 
  Flame, 
  UserCheck,
  Bell,
  Menu,
  Lock,
  Crown
} from 'lucide-react';
import { PresetLook } from '../../types';
import { InspirationItem, INITIAL_INSPIRATIONS } from '../../data/inspirationData';
import { ProPaywallModal } from '../common/ProPaywallModal';
import { checkIsProUser, fetchInspirationsFromFirestore } from '../../services/looksSyncService';

export type { InspirationItem };

interface InspirationWallProps {
  onNavigate?: (tab: any, lookId?: string) => void;
  onLoadPreset?: (preset: PresetLook) => void;
  embedded?: boolean;
  openAddModalTrigger?: number;
  externalSearchQuery?: string;
  externalCategory?: string;
  externalViewMode?: 'grid' | 'feed';
  onCategoryChange?: (category: string) => void;
  onViewModeChange?: (mode: 'grid' | 'feed') => void;
  onToggleReelsFeed?: (active: boolean) => void;
}

export const InspirationWall: React.FC<InspirationWallProps> = ({ 
  onNavigate, 
  onLoadPreset, 
  embedded = false, 
  openAddModalTrigger = 0,
  externalSearchQuery,
  externalCategory,
  externalViewMode,
  onCategoryChange,
  onViewModeChange,
  onToggleReelsFeed
}) => {
  const [inspirations, setInspirations] = useState<InspirationItem[]>(() => {
    const saved = localStorage.getItem('gleame_inspiration_wall');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_INSPIRATIONS;
      }
    }
    return INITIAL_INSPIRATIONS;
  });

  const [isProUser, setIsProUser] = useState<boolean>(() => checkIsProUser());
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallItem, setPaywallItem] = useState<InspirationItem | null>(null);
  const [pendingPreset, setPendingPreset] = useState<PresetLook | null>(null);

  useEffect(() => {
    fetchInspirationsFromFirestore().then((items) => {
      if (items && items.length > 0) {
        setInspirations(items);
      }
    });
  }, []);

  const [internalCategory, setInternalCategory] = useState<string>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'feed'>('grid');

  const selectedCategory = externalCategory !== undefined ? externalCategory : internalCategory;
  const setSelectedCategory = onCategoryChange || setInternalCategory;

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = setInternalSearchQuery;

  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Active look for detail modal
  const [activeItem, setActiveItem] = useState<InspirationItem | null>(null);
  
  // Likes & saves state
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('gleame_liked_inspirations');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('gleame_saved_inspirations');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // New inspiration submission modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (openAddModalTrigger > 0) {
      setIsAddModalOpen(true);
    }
  }, [openAddModalTrigger]);

  const [newTitle, setNewTitle] = useState<string>('');
  const [newCreator, setNewCreator] = useState<string>('@my_beauty_look');
  const [newImageUrl, setNewImageUrl] = useState<string>('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800');
  const [newCategory, setNewCategory] = useState<InspirationItem['category']>('user-creations');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newLipColor, setNewLipColor] = useState<string>('#e11d48');
  const [newBlushColor, setNewBlushColor] = useState<string>('#fb7185');
  const [newEyeshadowColor, setNewEyeshadowColor] = useState<string>('#fecdd3');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Moods' },
    { id: 'user-creations', label: 'User Creations' },
    { id: 'aspirational', label: 'Aspirational Moods' },
    { id: 'glass-skin', label: 'Glass Skin & Gloss' },
    { id: 'latte-bronze', label: 'Latte & Bronze' },
    { id: 'cherry-flush', label: 'Cherry Flush' },
    { id: 'clean-girl', label: 'Clean Girl' },
    { id: 'graphic-liner', label: 'Graphic Liner' },
    { id: 'lip-combos', label: 'Lip Combos' },
  ];

  // Filtered items
  const filteredInspirations = inspirations.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.products.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedIds(prev => {
      const next = new Set(prev);
      const isLiked = next.has(id);
      if (isLiked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('gleame_liked_inspirations', JSON.stringify(Array.from(next)));
      
      // Update inspiration counts
      setInspirations(curr => curr.map(item => {
        if (item.id === id) {
          return { ...item, likes: isLiked ? item.likes - 1 : item.likes + 1 };
        }
        return item;
      }));

      return next;
    });
  };

  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedIds(prev => {
      const next = new Set(prev);
      const isSaved = next.has(id);
      if (isSaved) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('gleame_saved_inspirations', JSON.stringify(Array.from(next)));
      
      // Update inspiration counts
      setInspirations(curr => curr.map(item => {
        if (item.id === id) {
          return { ...item, saves: isSaved ? item.saves - 1 : item.saves + 1 };
        }
        return item;
      }));

      return next;
    });
  };

  const handleCardClick = (item: InspirationItem) => {
    if (onNavigate) {
      onNavigate('inspirationlooks-scrollfeed', item.id);
    } else {
      setActiveItem(item);
    }
  };

  const handleTryOnLook = (presetOrLook: PresetLook | InspirationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    let targetPreset: PresetLook;
    let isItemLocked = false;
    let targetItem: InspirationItem | null = null;

    if ('preset' in presetOrLook) {
      targetItem = presetOrLook as InspirationItem;
      targetPreset = presetOrLook.preset;
      isItemLocked = Boolean(presetOrLook.isLocked || presetOrLook.preset?.isLocked) && !checkIsProUser();
    } else {
      targetPreset = presetOrLook as PresetLook;
      isItemLocked = Boolean(targetPreset.isLocked) && !checkIsProUser();
    }

    if (isItemLocked) {
      setPaywallItem(targetItem);
      setPendingPreset(targetPreset);
      setIsPaywallOpen(true);
      return;
    }

    if (onToggleReelsFeed) onToggleReelsFeed(false);
    setActiveItem(null);
    if (onLoadPreset) {
      onLoadPreset(targetPreset);
    }
    if (onNavigate) {
      onNavigate('sandbox');
    }
  };

  const handleShare = (item: InspirationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${item.title} by ${item.creator} on Gleame: ${url}`);
      setCopiedNotification(item.id);
      setTimeout(() => setCopiedNotification(null), 2500);
    }
  };

  const handleAddInspiration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: InspirationItem = {
      id: `insp_${Date.now()}`,
      title: newTitle.trim(),
      creator: newCreator.trim().startsWith('@') ? newCreator.trim() : `@${newCreator.trim()}`,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
      aspectRatio: 'tall',
      category: newCategory,
      badge: 'Community Upload',
      description: newDescription.trim() || 'Custom created look shared to the community inspiration board.',
      likes: 1,
      saves: 1,
      tags: ['CommunityLook', 'CustomCreation'],
      products: ['Custom Lip Stains', 'Blush Layer', 'Eyeshadow Veil'],
      preset: {
        id: `custom_preset_${Date.now()}`,
        name: newTitle.trim(),
        description: newDescription.trim() || 'Community shared makeup formula',
        eyeshadowColor: newEyeshadowColor,
        eyeshadowOpacity: 0.5,
        blushColor: newBlushColor,
        blushOpacity: 0.5,
        lipColor: newLipColor,
        lipOpacity: 0.85,
        lipGloss: true,
        lashesStyle: 'natural',
        glitterLevel: 30,
        filter: 'none',
      }
    };

    const updated = [newItem, ...inspirations];
    setInspirations(updated);
    localStorage.setItem('gleame_inspiration_wall', JSON.stringify(updated));
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  // Ref and active index for full-screen reels snap scroll feed
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const [currentReelIndex, setCurrentReelIndex] = useState<number>(0);

  // Initialize reel index and auto-scroll when activeItem changes
  useEffect(() => {
    if (activeItem) {
      const idx = filteredInspirations.findIndex(i => i.id === activeItem.id);
      const initialIdx = idx >= 0 ? idx : 0;
      setCurrentReelIndex(initialIdx);

      const timer = setTimeout(() => {
        const el = document.getElementById(`reel-card-${activeItem.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeItem]);

  // Handle scroll events in reels container to track current active card
  const handleReelScroll = () => {
    if (!feedContainerRef.current) return;
    const container = feedContainerRef.current;
    const cards = container.querySelectorAll('[data-reel-card]');
    const containerCenter = container.scrollTop + container.clientHeight / 2;

    cards.forEach((card, index) => {
      const htmlCard = card as HTMLElement;
      const top = htmlCard.offsetTop;
      const height = htmlCard.offsetHeight;
      if (containerCenter >= top && containerCenter <= top + height) {
        setCurrentReelIndex(index);
      }
    });
  };

  const handlePrevReel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentReelIndex > 0) {
      const prevItem = filteredInspirations[currentReelIndex - 1];
      if (prevItem) {
        const el = document.getElementById(`reel-card-${prevItem.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setCurrentReelIndex(currentReelIndex - 1);
        }
      }
    }
  };

  const handleNextReel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentReelIndex < filteredInspirations.length - 1) {
      const nextItem = filteredInspirations[currentReelIndex + 1];
      if (nextItem) {
        const el = document.getElementById(`reel-card-${nextItem.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setCurrentReelIndex(currentReelIndex + 1);
        }
      }
    }
  };

  // Keyboard navigation for reels
  useEffect(() => {
    if (!activeItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        handlePrevReel();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, currentReelIndex, filteredInspirations]);

  // Hide global app nav and banner when full-screen feed scroll is open
  useEffect(() => {
    if (onToggleReelsFeed) {
      onToggleReelsFeed(!!activeItem);
    }
    return () => {
      if (onToggleReelsFeed) {
        onToggleReelsFeed(false);
      }
    };
  }, [activeItem, onToggleReelsFeed]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 relative">
      
      {/* 1. STANDALONE TOP HEADER (Only if NOT embedded in Gallery tab) */}
      {!embedded && (
        <section className="-mt-1 sm:-mt-2 rounded-2xl sm:rounded-3xl border border-[#EDE7E3] bg-[#FAF6F4] p-3.5 sm:p-4.5 shadow-xs text-left">
          <div className="flex items-center justify-between gap-3">
            {/* Back Icon & Clean Title */}
            <div className="flex items-center gap-2.5">
              {onNavigate && (
                <button 
                  onClick={() => onNavigate('home')}
                  title="Back to Explore"
                  aria-label="Back to Explore"
                  className="w-8 h-8 rounded-full bg-white border border-[#EDE7E3] hover:border-black flex items-center justify-center text-stone-700 hover:text-black shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight font-sans">
                  Inspiration Wall
                </h1>
              </div>
            </div>

            {/* Filter Dropdown Popover */}
            <div className="relative shrink-0" ref={filterDropdownRef}>
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  selectedCategory !== 'all' 
                    ? 'bg-black text-white border-black shadow-xs' 
                    : 'bg-white text-stone-700 border-[#EDE7E3] hover:border-black'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter</span>
                <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-[#EDE7E3] shadow-2xl p-3 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">View Layout</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => { setViewMode('grid'); setIsFilterDropdownOpen(false); }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                          viewMode === 'grid' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        <Grid className="w-3 h-3" />
                        <span>Grid</span>
                      </button>
                      <button
                        onClick={() => { setViewMode('feed'); setIsFilterDropdownOpen(false); }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                          viewMode === 'feed' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        <List className="w-3 h-3" />
                        <span>Feed</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between border-t border-[#EDE7E3]/60 pt-2 mb-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Aesthetic Moods</span>
                      {selectedCategory !== 'all' && (
                        <button 
                          onClick={() => { setSelectedCategory('all'); setIsFilterDropdownOpen(false); }}
                          className="text-[10px] font-bold text-[#E91E63] hover:underline"
                        >
                          Reset All
                        </button>
                      )}
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5 no-scrollbar">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                            selectedCategory === cat.id
                              ? 'bg-[#FAF6F4] text-[#E91E63] font-bold'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <span>{cat.label}</span>
                          {selectedCategory === cat.id && <Check className="w-3.5 h-3.5 text-[#E91E63]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. TRY LOOKS FROM THE COMMUNITY CAROUSEL (LIPS & EYES CLOSEUPS) */}
      <div className="bg-[#e7dfd8] border border-[#d8cec5] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] font-thin text-stone-900 tracking-tight">
              Try Looks from the Community
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('inspirationlooks-scrollfeed')}
            className="text-xs font-bold text-[#6b5649] hover:text-black transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* Horizontal Scrollable Carousel of Square Closeup Tiles */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 -mx-1 px-1">
          {[
            {
              id: 'try_eye_gold',
              title: 'Peachy Dew',
              image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400',
              preset: {
                id: 'try_eye_gold',
                name: 'Peachy Dew',
                description: 'A trending look designed by @glam.xo with warm gold champagne shadow, soft peach flush, and dewy gloss.',
                eyeshadowColor: '#e07a5f',
                eyeshadowOpacity: 0.85,
                eyelinerColor: '#1c1917',
                eyelinerOpacity: 0.9,
                blushColor: '#f97316',
                blushOpacity: 0.45,
                lipColor: '#e11d48',
                lipOpacity: 0.85,
                lipGloss: true,
                lashesStyle: 'wispy',
                glitterLevel: 25,
                filter: 'warm-glow'
              }
            },
            {
              id: 'try_lip_glass',
              title: 'Plump Pink Glass',
              image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400',
              preset: {
                id: 'try_lip_glass',
                name: 'Plump Pink Glass',
                description: 'High-shine peptide gloss with soft flush blush.',
                eyeshadowColor: '#fed7aa',
                eyeshadowOpacity: 0.4,
                blushColor: '#fb7185',
                blushOpacity: 0.5,
                lipColor: '#f43f5e',
                lipOpacity: 0.95,
                lipGloss: true,
                lashesStyle: 'natural',
                glitterLevel: 25,
                filter: 'none'
              }
            },
            {
              id: 'try_eye_lilac',
              title: 'Lilac Duochrome Eye',
              image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
              preset: {
                id: 'try_eye_lilac',
                name: 'Lilac Duochrome Eye',
                description: 'Prismatic lavender chrome wash with fluttery wispy lashes.',
                eyeshadowColor: '#c084fc',
                eyeshadowOpacity: 0.8,
                blushColor: '#f472b6',
                blushOpacity: 0.4,
                lipColor: '#db2777',
                lipOpacity: 0.85,
                lipGloss: true,
                lashesStyle: 'wispy',
                glitterLevel: 65,
                filter: 'holographic'
              }
            },
            {
              id: 'try_skin_bronze',
              title: 'Dewy Peach Glow',
              image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400',
              preset: {
                id: 'try_skin_bronze',
                name: 'Dewy Peach Glow',
                description: 'Sunkissed warm apricot dusting with peach nectar shine.',
                eyeshadowColor: '#b45309',
                eyeshadowOpacity: 0.6,
                blushColor: '#ea580c',
                blushOpacity: 0.45,
                lipColor: '#c2410c',
                lipOpacity: 0.8,
                lipGloss: true,
                lashesStyle: 'natural',
                glitterLevel: 35,
                filter: 'warm-glow'
              }
            },
            {
              id: 'try_lip_berry',
              title: 'Velvet Berry Glaze',
              image: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=400',
              preset: {
                id: 'try_lip_berry',
                name: 'Velvet Berry Glaze',
                description: 'Deep plum-berry lacquer with glazed specular highlights.',
                eyeshadowColor: '#e2e8f0',
                eyeshadowOpacity: 0.3,
                blushColor: '#be123c',
                blushOpacity: 0.4,
                lipColor: '#9f1239',
                lipOpacity: 0.95,
                lipGloss: true,
                lashesStyle: 'glam',
                glitterLevel: 20,
                filter: 'vintage'
              }
            },
            {
              id: 'try_lip_crimson',
              title: 'Satin Crimson Noir',
              image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=400',
              preset: {
                id: 'try_lip_crimson',
                name: 'Satin Crimson Noir',
                description: 'Statement ruby red satin lip with soft porcelain blur.',
                eyeshadowColor: '#4b5563',
                eyeshadowOpacity: 0.35,
                blushColor: '#fda4af',
                blushOpacity: 0.3,
                lipColor: '#b91c1c',
                lipOpacity: 0.95,
                lipGloss: false,
                lashesStyle: 'glam',
                glitterLevel: 10,
                filter: 'none'
              }
            },
            {
              id: 'try_eye_cyber',
              title: 'Pastel Aqua Holo',
              image: 'https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&q=80&w=400',
              preset: {
                id: 'try_eye_cyber',
                name: 'Pastel Aqua Holo',
                description: 'Futuristic electric cyan shimmer with pearl luster.',
                eyeshadowColor: '#38bdf8',
                eyeshadowOpacity: 0.8,
                blushColor: '#f472b6',
                blushOpacity: 0.35,
                lipColor: '#ec4899',
                lipOpacity: 0.8,
                lipGloss: true,
                lashesStyle: 'wispy',
                glitterLevel: 70,
                filter: 'cool-cyber'
              }
            },
            {
              id: 'try_lip_rosewood',
              title: 'Rosewood Syrup',
              image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
              preset: {
                id: 'try_lip_rosewood',
                name: 'Rosewood Syrup',
                description: 'Gradient diffuse rose lip with dewy luminous blush.',
                eyeshadowColor: '#fed7aa',
                eyeshadowOpacity: 0.3,
                blushColor: '#fb7185',
                blushOpacity: 0.45,
                lipColor: '#e11d48',
                lipOpacity: 0.9,
                lipGloss: true,
                lashesStyle: 'natural',
                glitterLevel: 25,
                filter: 'none'
              }
            }
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate('inspirationlooks-scrollfeed', item.id)}
              className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden relative group cursor-pointer border border-stone-200/70 shadow-xs hover:scale-105 transition-all duration-300 bg-stone-100"
            >
              <img
                src={item.image}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              
              {/* Floating bottom-left sparkle badge */}
              <div className="absolute bottom-2 left-2 z-10 w-6 h-6 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-purple-600 shadow-xs border border-white/80 group-hover:scale-110 transition-transform">
                <Sparkles className="w-3 h-3 text-purple-600" />
              </div>

              {/* Tooltip text on hover */}
              <div className="absolute bottom-2 left-9 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MAIN DISPLAY: PINTEREST MOODBOARD GRID OR VERTICAL FEED */}
      {filteredInspirations.length === 0 ? (
        <div className="rounded-3xl border border-[#EDE7E3] bg-white p-12 text-center space-y-3">
          <p className="text-sm font-bold text-black">No inspiration looks found</p>
          <p className="text-xs text-stone-500">Try adjusting your search terms or filter category.</p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold mt-2"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* --- PROPER INSPIRATION WALL: MASONRY GRID OF DIFFERENT SIZED CARDS WITHOUT WHITE CARD BACKGROUND --- */
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3.5 sm:gap-4.5 [column-fill:_balance]">
          {filteredInspirations.map((item, index) => {
            const isLiked = likedIds.has(item.id);
            const isSaved = savedIds.has(item.id);

            // Varied card sizes for a genuine editorial inspiration wall of images
            const aspectRatios = [
              'aspect-[3/4.6]',  // Tall editorial portrait
              'aspect-[1/1]',    // Square macro texture / shade swatch
              'aspect-[3/3.9]',  // Medium studio look
              'aspect-[3/4.3]',  // Elongated beauty portrait
              'aspect-[4/5]'     // Classic editorial card
            ];
            const cardAspect = aspectRatios[index % aspectRatios.length];

            return (
              <div 
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="break-inside-avoid mb-4 sm:mb-5 group relative rounded-2xl bg-transparent overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image Container with Varied Card Size & No White Background */}
                <div className={`relative w-full ${cardAspect} overflow-hidden rounded-2xl bg-stone-900 shadow-xs`}>
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Subtle Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Top Floating Badge or Pro Lock Tag */}
                  {item.isLocked && !isProUser ? (
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/90 text-amber-300 backdrop-blur-md text-[9px] font-black uppercase tracking-wider shadow-sm border border-amber-400/40">
                      <Lock className="w-2.5 h-2.5 text-amber-300" />
                      <span>PRO</span>
                    </div>
                  ) : (
                    <div className="absolute top-2.5 left-2.5 z-10 max-w-[calc(100%-42px)]">
                      <span className="block truncate px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-bold text-black uppercase tracking-tight shadow-2xs">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Top Right Save & Share Floating Action (Stacked cleanly in top corner) */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-center gap-1.5">
                    <button
                      onClick={(e) => handleToggleSave(item.id, e)}
                      title={isSaved ? 'Pinned to your board (Click to unpin)' : 'Save Look to your board'}
                      aria-label={isSaved ? 'Saved look' : 'Save look'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                        isSaved 
                          ? 'bg-[#E91E63] text-white shadow-sm ring-1 ring-white/40' 
                          : 'bg-white/90 text-black hover:bg-white border border-stone-200/60'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleShare(item, e)}
                      title="Share Look"
                      aria-label="Share Look"
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center backdrop-blur-md transition-all shadow-xs cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Hover Quick Action: Try On Look Button (UI matches weekly edit card) */}
                  <div className="absolute inset-x-2.5 bottom-2.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                      type="button"
                      onClick={(e) => handleTryOnLook(item, e)}
                      className={`w-full py-2 px-3 rounded-full text-[10.5px] sm:text-xs font-black uppercase tracking-[0.14em] flex items-center justify-center gap-1.5 shadow-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer border ${
                        item.isLocked && !isProUser
                          ? 'bg-stone-900 hover:bg-black text-amber-300 border-amber-400/40'
                          : 'bg-[#f7f3f0] hover:bg-[#ede7e3] text-[#171515] border-white/80'
                      }`}
                    >
                      {item.isLocked && !isProUser ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>UNLOCK PRO</span>
                        </>
                      ) : (
                        <>
                          <span>TRY THIS LOOK</span>
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#ff2f68] text-[#ff2f68] shrink-0">
                            <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Meta & Bottom Details (Transparent background, no white card box) */}
                <div className="pt-2 px-1 pb-1 space-y-1 text-left bg-transparent grow">
                  {/* Like Count Above Username */}
                  <div className="flex items-center justify-start">
                    <button 
                      onClick={(e) => handleToggleLike(item.id, e)}
                      className={`flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
                        isLiked ? 'text-[#E91E63]' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{item.likes.toLocaleString()}</span>
                    </button>
                  </div>

                  {/* Creator Info: Avatar & Full @ Username */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img 
                      src={item.avatarUrl} 
                      alt={item.creator}
                      className="w-5 h-5 rounded-full object-cover border border-[#EDE7E3] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[11px] font-bold text-stone-700 leading-tight">
                      {item.creator.startsWith('@') ? item.creator : `@${item.creator}`}
                    </span>
                  </div>

                  {/* Look Title (Fully visible, allowed to wrap across 2 lines) */}
                  <h3 className="text-xs sm:text-[13px] font-bold text-black line-clamp-2 leading-snug group-hover:text-[#E91E63] transition-colors min-h-[2rem]">
                    {item.title}
                  </h3>

                  {/* Product Recipe Swatch Previews */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs shrink-0" 
                      style={{ backgroundColor: item.preset.lipColor }} 
                      title="Lip Shade"
                    />
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs shrink-0" 
                      style={{ backgroundColor: item.preset.blushColor }} 
                      title="Blush Shade"
                    />
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs shrink-0" 
                      style={{ backgroundColor: item.preset.eyeshadowColor }} 
                      title="Eyeshadow Shade"
                    />
                    <span className="text-[10px] text-stone-400 font-medium ml-1 truncate">
                      {item.preset.lashesStyle !== 'none' ? `${item.preset.lashesStyle} lashes` : 'natural'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- SCROLLABLE VERTICAL FEED VIEW (IN-PAGE) --- */
        <div className="max-w-md sm:max-w-xl mx-auto space-y-6 sm:space-y-8">
          {filteredInspirations.map((item) => {
            const isLiked = likedIds.has(item.id);
            const isSaved = savedIds.has(item.id);

            return (
              <article 
                key={item.id}
                id={`insp-feed-${item.id}`}
                className="rounded-3xl border border-[#EDE7E3] bg-white overflow-hidden shadow-md text-left transition-all"
              >
                {/* Image Header with Aspect Ratio & Badges */}
                <div className="relative aspect-[16/11] w-full bg-stone-100 overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Category Badge or Pro Lock on Top-Left */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
                    {item.isLocked && !isProUser ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/90 text-amber-300 backdrop-blur-md text-[10.5px] font-black uppercase tracking-wider shadow-sm border border-amber-400/40">
                        <Lock className="w-3 h-3 text-amber-300" />
                        <span>PRO EXCLUSIVE</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-white text-[10.5px] font-black uppercase tracking-wider shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Top-Right Save & Share Action Icons */}
                  <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleSave(item.id, e)}
                      title={isSaved ? 'Saved to board' : 'Save look'}
                      aria-label="Save look"
                      className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                        isSaved 
                          ? 'bg-[#E91E63] text-white shadow-sm ring-1 ring-white/40' 
                          : 'bg-white/90 text-black hover:bg-white border border-stone-200/60'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleShare(item, e)}
                      title="Share Look"
                      aria-label="Share Look"
                      className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center backdrop-blur-md transition-all shadow-xs cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content Section Underneath in the same frame */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Creator Info */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.avatarUrl} 
                      alt={item.creator}
                      className="w-10 h-10 rounded-full object-cover border border-[#EDE7E3]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-black">
                        {item.creator.startsWith('@') ? item.creator : `@${item.creator}`}
                      </h4>
                      <p className="text-xs text-stone-400 font-medium">Inspiration Contributor</p>
                    </div>
                  </div>

                  {/* Look Title */}
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
                    {item.title}
                  </h2>

                  {/* Look Description */}
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Two Action Pill Buttons: Likes & Save to Moodboard */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={(e) => handleToggleLike(item.id, e)}
                      className={`py-2.5 px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isLiked
                          ? 'border-[#E91E63] text-[#E91E63] bg-[#E91E63]/5'
                          : 'border-[#EDE7E3] text-stone-700 bg-white hover:border-black'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-[#E91E63]' : 'text-stone-500'}`} />
                      <span>{item.likes.toLocaleString()} Likes</span>
                    </button>

                    <button
                      onClick={(e) => handleToggleSave(item.id, e)}
                      className={`py-2.5 px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSaved
                          ? 'border-[#E91E63] text-[#E91E63] bg-[#E91E63]/5'
                          : 'border-[#EDE7E3] text-stone-700 bg-white hover:border-black'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-[#E91E63]' : 'text-stone-500'}`} />
                      <span>{isSaved ? 'Saved' : 'Save to Moodboard'}</span>
                    </button>
                  </div>

                  {/* MAKEUP RECIPE FORMULA Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6F4] border border-[#EDE7E3] space-y-3.5">
                    <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E91E63]" />
                      Makeup Recipe Formula
                    </h4>

                    {/* 3 Swatch Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-white border border-[#EDE7E3] space-y-1.5 text-center shadow-2xs">
                        <div 
                          className="w-6 h-6 mx-auto rounded-full border border-black/10 shadow-2xs" 
                          style={{ backgroundColor: item.preset.lipColor }} 
                        />
                        <p className="text-[11px] font-bold text-black">Lip Shade</p>
                        <p className="text-[9.5px] text-stone-400 font-mono">{item.preset.lipColor}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#EDE7E3] space-y-1.5 text-center shadow-2xs">
                        <div 
                          className="w-6 h-6 mx-auto rounded-full border border-black/10 shadow-2xs" 
                          style={{ backgroundColor: item.preset.blushColor }} 
                        />
                        <p className="text-[11px] font-bold text-black">Blush Tone</p>
                        <p className="text-[9.5px] text-stone-400 font-mono">{item.preset.blushColor}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#EDE7E3] space-y-1.5 text-center shadow-2xs">
                        <div 
                          className="w-6 h-6 mx-auto rounded-full border border-black/10 shadow-2xs" 
                          style={{ backgroundColor: item.preset.eyeshadowColor }} 
                        />
                        <p className="text-[11px] font-bold text-black">Eyeshadow</p>
                        <p className="text-[9.5px] text-stone-400 font-mono">{item.preset.eyeshadowColor}</p>
                      </div>
                    </div>

                    {/* Spec details row */}
                    <div className="grid grid-cols-3 text-[11px] text-stone-600 pt-2 border-t border-[#EDE7E3] text-center">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Lash Style</span>
                        <strong className="text-black capitalize">{item.preset.lashesStyle !== 'none' ? item.preset.lashesStyle : 'Natural'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Finish</span>
                        <strong className="text-black">{item.preset.lipGloss ? 'Glass Gloss' : 'Velvet Satin'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Shimmer</span>
                        <strong className="text-black">{item.preset.glitterLevel}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Key Products List */}
                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-xs font-black text-black uppercase tracking-wider">Key Products:</h5>
                    <ul className="space-y-1 text-xs text-stone-600">
                      {item.products.map((prod, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#E91E63] shrink-0" />
                          <span>{prod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Try On Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleTryOnLook(item)}
                      className={`w-full py-3.5 px-6 rounded-full font-black text-xs sm:text-sm uppercase tracking-[0.16em] flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border ${
                        item.isLocked && !isProUser
                          ? 'bg-stone-900 hover:bg-black text-amber-300 border-amber-400/40'
                          : 'bg-[#f7f3f0] hover:bg-[#ede7e3] text-[#171515] border-white/80'
                      }`}
                    >
                      {item.isLocked && !isProUser ? (
                        <>
                          <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>UNLOCK PRO LOOK</span>
                        </>
                      ) : (
                        <>
                          <span>TRY THIS LOOK</span>
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#ff2f68] text-[#ff2f68] shrink-0">
                            <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 3. 100% FULL-SCREEN INSTAGRAM SNAP SCROLL REELS FEED */}
      {activeItem && (
        <div 
          ref={feedContainerRef}
          onScroll={handleReelScroll}
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-[100dvh] bg-[#FAF7F5] overflow-y-auto snap-y snap-mandatory scroll-smooth select-none"
          style={{ touchAction: 'pan-y' }}
        >
          {/* Fixed Top-Left Back Button */}
          <div className="fixed top-4 left-4 z-[10000]">
            <button 
              type="button"
              onClick={() => setActiveItem(null)}
              className="w-11 h-11 rounded-full bg-white text-black border border-stone-200 shadow-xl flex items-center justify-center transition-all active:scale-90 hover:scale-105 cursor-pointer backdrop-blur-md"
              title="Back to Inspiration Grid"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Fixed Bottom-Right Side-by-Side Up and Down Arrow Controls (Feed view only) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-6 right-6 z-[10000] flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-[#EDE7E3] shadow-xl text-stone-700 pointer-events-auto"
          >
            <button
              type="button"
              onClick={handlePrevReel}
              disabled={currentReelIndex <= 0}
              className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white text-stone-700 flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs border border-[#EDE7E3] select-none"
              title="Previous Look (Up)"
              aria-label="Previous Look"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextReel}
              disabled={currentReelIndex >= filteredInspirations.length - 1}
              className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white text-stone-700 flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs border border-[#EDE7E3] select-none"
              title="Next Look (Down)"
              aria-label="Next Look"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Vertical Snap Reel Cards */}
          {filteredInspirations.map((item, idx) => {
            const isLiked = likedIds.has(item.id);
            const isSaved = savedIds.has(item.id);

            return (
              <section 
                key={item.id}
                id={`reel-card-${item.id}`}
                data-reel-card
                className="min-h-screen w-full snap-start snap-always flex flex-col items-center justify-start pt-16 pb-20 px-3 sm:px-4 bg-[#FAF7F5] shrink-0"
              >
                <article 
                  className="w-full max-w-md bg-white rounded-3xl border border-[#EDE7E3] shadow-xl overflow-hidden text-left transition-all animate-in fade-in zoom-in-95 duration-200"
                >
                  {/* Image Header with Aspect Ratio & Badges */}
                  <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full bg-stone-100 overflow-hidden shrink-0">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Category Badge on Top-Left */}
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <span className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-white text-[10.5px] font-black uppercase tracking-wider shadow-sm">
                        {item.badge}
                      </span>
                    </div>

                    {/* Top-Right Save & Share Action Icons */}
                    <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(item.id, e)}
                        title={isSaved ? 'Saved to board' : 'Save look'}
                        aria-label="Save look"
                        className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                          isSaved 
                            ? 'bg-[#E91E63] text-white shadow-sm ring-1 ring-white/40' 
                            : 'bg-white/90 text-black hover:bg-white border border-stone-200/60'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleShare(item, e)}
                        title="Share Look"
                        aria-label="Share Look"
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center backdrop-blur-md transition-all shadow-xs cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content Section Underneath */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Creator Info */}
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.avatarUrl} 
                        alt={item.creator}
                        className="w-10 h-10 rounded-full object-cover border border-[#EDE7E3]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-black">
                          {item.creator.startsWith('@') ? item.creator : `@${item.creator}`}
                        </h4>
                        <p className="text-xs text-stone-400 font-medium">Inspiration Contributor</p>
                      </div>
                    </div>

                    {/* Look Title */}
                    <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
                      {item.title}
                    </h2>

                    {/* Look Description */}
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Two Action Pill Buttons: Likes & Save to Moodboard */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(item.id, e)}
                        className={`py-2.5 px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isLiked
                            ? 'border-[#E91E63] text-[#E91E63] bg-[#E91E63]/5'
                            : 'border-[#EDE7E3] text-stone-700 bg-white hover:border-black'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-[#E91E63]' : 'text-stone-500'}`} />
                        <span>{item.likes.toLocaleString()} Likes</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(item.id, e)}
                        className={`py-2.5 px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSaved
                            ? 'border-[#E91E63] text-[#E91E63] bg-[#E91E63]/5'
                            : 'border-[#EDE7E3] text-stone-700 bg-white hover:border-black'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-[#E91E63]' : 'text-stone-500'}`} />
                        <span>{isSaved ? 'Saved' : 'Save to Moodboard'}</span>
                      </button>
                    </div>

                    {/* MAKEUP RECIPE FORMULA Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6F4] border border-[#EDE7E3] space-y-3.5">
                      <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E91E63]" />
                        Makeup Recipe Formula
                      </h4>

                      {/* 3 Swatch Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-white border border-[#EDE7E3] space-y-1.5 text-center shadow-2xs">
                          <div 
                            className="w-6 h-6 mx-auto rounded-full border border-black/10 shadow-2xs" 
                            style={{ backgroundColor: item.preset.lipColor }} 
                          />
                          <p className="text-[11px] font-bold text-black">Lip Shade</p>
                          <p className="text-[9.5px] text-stone-400 font-mono">{item.preset.lipColor}</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-[#EDE7E3] space-y-1.5 text-center shadow-2xs">
                          <div 
                            className="w-6 h-6 mx-auto rounded-full border border-black/10 shadow-2xs" 
                            style={{ backgroundColor: item.preset.blushColor }} 
                          />
                          <p className="text-[11px] font-bold text-black">Blush Tone</p>
                          <p className="text-[9.5px] text-stone-400 font-mono">{item.preset.blushColor}</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-[#EDE7E3] space-y-1.5 text-center shadow-2xs">
                          <div 
                            className="w-6 h-6 mx-auto rounded-full border border-black/10 shadow-2xs" 
                            style={{ backgroundColor: item.preset.eyeshadowColor }} 
                          />
                          <p className="text-[11px] font-bold text-black">Eyeshadow</p>
                          <p className="text-[9.5px] text-stone-400 font-mono">{item.preset.eyeshadowColor}</p>
                        </div>
                      </div>

                      {/* Spec details row */}
                      <div className="grid grid-cols-3 text-[11px] text-stone-600 pt-2 border-t border-[#EDE7E3] text-center">
                        <div>
                          <span className="text-stone-400 block text-[10px]">Lash Style</span>
                          <strong className="text-black capitalize">{item.preset.lashesStyle !== 'none' ? item.preset.lashesStyle : 'Natural'}</strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Finish</span>
                          <strong className="text-black">{item.preset.lipGloss ? 'Glass Gloss' : 'Velvet Satin'}</strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Shimmer</span>
                          <strong className="text-black">{item.preset.glitterLevel}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Key Products List */}
                    <div className="space-y-1.5 pt-1">
                      <h5 className="text-xs font-black text-black uppercase tracking-wider">Key Products:</h5>
                      <ul className="space-y-1 text-xs text-stone-600">
                        {item.products.map((prod, pIdx) => (
                          <li key={pIdx} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#E91E63] shrink-0" />
                            <span>{prod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Try On Button */}
                    <div className="pt-2 pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleTryOnLook(item.preset);
                          setActiveItem(null);
                        }}
                        className="w-full py-3.5 px-6 rounded-full bg-[#f7f3f0] hover:bg-[#ede7e3] text-[#171515] font-black text-xs sm:text-sm uppercase tracking-[0.16em] flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-white/80"
                      >
                        <span>TRY THIS LOOK</span>
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#ff2f68] text-[#ff2f68] shrink-0">
                          <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              </section>
            );
          })}
        </div>
      )}

      {/* 4. PIN NEW LOOK / INSPIRATION MODAL */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 text-left space-y-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EDE7E3] pb-4">
              <div>
                <h3 className="text-lg font-bold text-black">Pin a Look to Inspiration Wall</h3>
                <p className="text-xs text-stone-500">Share your custom beauty aesthetic with the community.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddInspiration} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">Look Title</label>
                <input 
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Amber Glaze & Winged Lash"
                  className="w-full p-2.5 rounded-xl border border-[#EDE7E3] focus:outline-none focus:border-[#E91E63]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Creator Handle</label>
                  <input 
                    type="text"
                    required
                    value={newCreator}
                    onChange={(e) => setNewCreator(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full p-2.5 rounded-xl border border-[#EDE7E3] focus:outline-none focus:border-[#E91E63]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as InspirationItem['category'])}
                    className="w-full p-2.5 rounded-xl border border-[#EDE7E3] focus:outline-none focus:border-[#E91E63] bg-white"
                  >
                    <option value="user-creations">User Creation</option>
                    <option value="aspirational">Aspirational Mood</option>
                    <option value="glass-skin">Glass Skin & Gloss</option>
                    <option value="latte-bronze">Latte & Bronze</option>
                    <option value="cherry-flush">Cherry Flush</option>
                    <option value="clean-girl">Clean Girl</option>
                    <option value="graphic-liner">Graphic Liner</option>
                    <option value="lip-combos">Lip Combos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Photo Image URL</label>
                <input 
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-[#EDE7E3] focus:outline-none focus:border-[#E91E63]"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Briefly describe the aesthetic and application..."
                  className="w-full p-2.5 rounded-xl border border-[#EDE7E3] focus:outline-none focus:border-[#E91E63]"
                />
              </div>

              {/* Color Formula Pickers */}
              <div className="p-3.5 rounded-2xl bg-[#FAF6F4] border border-[#EDE7E3] space-y-2">
                <span className="font-bold text-black block">Formula Color Swatches:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 block mb-1">Lip Color</span>
                    <input 
                      type="color" 
                      value={newLipColor} 
                      onChange={(e) => setNewLipColor(e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-[#EDE7E3] bg-white p-1"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block mb-1">Blush Tone</span>
                    <input 
                      type="color" 
                      value={newBlushColor} 
                      onChange={(e) => setNewBlushColor(e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-[#EDE7E3] bg-white p-1"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block mb-1">Eyeshadow</span>
                    <input 
                      type="color" 
                      value={newEyeshadowColor} 
                      onChange={(e) => setNewEyeshadowColor(e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-[#EDE7E3] bg-white p-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE7E3]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#EDE7E3] text-stone-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-black text-white hover:bg-[#E91E63] font-bold shadow-xs transition-colors"
                >
                  Pin to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy notification toast */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-full bg-black text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-[#E91E63]" />
          <span>Look link copied to clipboard!</span>
        </div>
      )}

      {/* Pro Paywall Modal */}
      <ProPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        lookTitle={paywallItem?.title || pendingPreset?.name || 'Exclusive Pro Look'}
        lookImage={paywallItem?.imageUrl}
        onUnlocked={() => {
          setIsProUser(true);
          setIsPaywallOpen(false);
          if (pendingPreset && onLoadPreset) {
            onLoadPreset(pendingPreset);
            if (onNavigate) onNavigate('sandbox');
          }
        }}
      />

    </div>
  );
};
