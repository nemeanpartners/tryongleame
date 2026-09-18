import React, { useState, useEffect, useMemo } from 'react';
import { Heart, RefreshCw, Trophy, ExternalLink, Filter, Grid, List, Sparkles, Sparkle, Search, X, Upload, Plus, SquarePlus, ArrowLeft, Share2, ChevronUp, ChevronDown, MessageSquare, LayoutGrid, SlidersHorizontal, Bookmark, Play, ArrowRight, Eye, ChevronRight, Check, Crown, Video, Flame, Award, Wand2, Lock } from 'lucide-react';
import { auth } from '../../firebase';
import { saveLookToAccount, removeLookFromAccount } from '../../lib/nativeLooks';
import { db, collection, getDocs, updateDoc, doc, increment, addDoc, handleFirestoreError, OperationType } from '../../firebase';
import { ChallengeSubmission, PresetLook } from '../../types';
import { InspirationWall } from '../inspiration/InspirationWall';
import { CommunityRequestsView } from './CommunityRequestsView';
import { CommunityChallengesView } from './CommunityChallengesView';
import { TrendingPage } from '../trending/TrendingPage';
import { AppleWandSparklesIcon } from '../common/AppleWandSparklesIcon';
import { DiscoverSculpturalText } from './DiscoverSculpturalText';
import { PopularChallengeCard } from '../common/PopularChallengeCard';
import { trackLookOpened, trackLookShared } from '../../lib/analytics';
import { CURATED_20_LOOKS } from '../../data/curatedLooksData';
import { INITIAL_INSPIRATIONS } from '../../data/inspirationData';
import { checkIsProUser, syncLooksToFirestore, fetchGalleryLooksFromFirestore } from '../../lib/looksSyncService';
import { ProPaywallModal } from '../common/ProPaywallModal';

// Premium high-res beauty cover images representing different makeup styles
const COSMETIC_COVERS: Record<string, string> = {
  'Clean Girl': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'Soft Grunge': 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
  'Cherry Cola': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
  'Espresso Makeup': 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
  'Date Night': 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
  'Cool Girl Pink': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
  'Bronze Summer': 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600',
  '90s Brown': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  'Glass Skin Glam': 'https://images.unsplash.com/photo-1588665798934-8c83e78ff6a9?auto=format&fit=crop&q=80&w=600',
  'Holo Pink Horizon': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
  'Cyber Aura Matrix': 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
  'Golden Hour Sparkle': 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600',
  'Ethereal Siren': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'Electric Orchid': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
};

// 20 Curated Iconic Look Cards for the Looks Gallery
export interface GalleryIconicLook {
  id: string;
  name: string;
  creator: string;
  tagline: string;
  category: string;
  categoryLabel: string;
  likes: string;
  votesCount: number;
  image: string;
  hasVideo?: boolean;
  isLocked?: boolean;
  tier?: 'free' | 'pro';
  swatches: { name: string; hex: string }[];
  config: {
    eyeshadowColor: string;
    eyeshadowOpacity: number;
    eyelinerColor?: string;
    eyelinerOpacity?: number;
    eyelinerStyle?: 'none' | 'classic' | 'cat-eye' | 'winged';
    blushColor: string;
    blushOpacity: number;
    lipColor: string;
    lipOpacity: number;
    lipGloss: boolean;
    lashesStyle: 'none' | 'natural' | 'glam' | 'wispy';
    glitterLevel: number;
    selectedFilter: 'none' | 'vintage' | 'warm-glow' | 'cool-cyber' | 'holographic';
  };
}

export const CURATED_ICONIC_LOOKS: GalleryIconicLook[] = CURATED_20_LOOKS;

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
];

const SEED_SUBMISSIONS: ChallengeSubmission[] = [
  ...CURATED_ICONIC_LOOKS.map(look => ({
    id: look.id,
    username: look.creator,
    lookName: look.name,
    description: look.tagline,
    makeupConfig: {
      eyeshadowColor: look.config.eyeshadowColor,
      eyeshadowOpacity: look.config.eyeshadowOpacity,
      eyelinerColor: look.config.eyelinerColor,
      eyelinerOpacity: look.config.eyelinerOpacity,
      eyelinerStyle: look.config.eyelinerStyle,
      blushColor: look.config.blushColor,
      blushOpacity: look.config.blushOpacity,
      lipColor: look.config.lipColor,
      lipOpacity: look.config.lipOpacity,
      lipGloss: look.config.lipGloss,
      lashesStyle: look.config.lashesStyle,
      glitterLevel: look.config.glitterLevel,
      selectedFilter: look.config.selectedFilter
    },
    votes: look.votesCount,
    createdAt: Date.now() - 3600000 * 18
  })),
  {
    id: 'sub_1',
    username: 'cosmic_queen',
    lookName: 'Holo Pink Horizon',
    description: 'A futuristic pink eye combined with holographic lilac glimmers and heavy gloss. Optimized for late-night virtual concerts!',
    makeupConfig: {
      eyeshadowColor: '#ec4899',
      eyeshadowOpacity: 0.8,
      blushColor: '#fb7185',
      blushOpacity: 0.4,
      lipColor: '#db2777',
      lipOpacity: 0.9,
      lipGloss: true,
      lashesStyle: 'glam',
      glitterLevel: 80,
      selectedFilter: 'holographic'
    },
    votes: 42,
    createdAt: Date.now() - 3600000 * 24
  },
  {
    id: 'sub_2',
    username: 'makeup_artist_tim',
    lookName: 'Cyber Aura Matrix',
    description: 'Earthy matte copper blush but electric cybernetic violet eyes with low-intensity glitter, blended with our custom Matrix cyan filter overlay.',
    makeupConfig: {
      eyeshadowColor: '#8b5cf6',
      eyeshadowOpacity: 0.75,
      blushColor: '#cb997e',
      blushOpacity: 0.35,
      lipColor: '#7c2d12',
      lipOpacity: 0.8,
      lipGloss: false,
      lashesStyle: 'wispy',
      glitterLevel: 30,
      selectedFilter: 'cool-cyber'
    },
    votes: 31,
    createdAt: Date.now() - 3600000 * 12
  },
  {
    id: 'sub_3',
    username: 'lily_rose',
    lookName: 'Golden Hour Sparkle',
    description: 'A pure bronzed golden sunset style with deep cherry glossy lips, natural lashes, and shimmering cheek highlights.',
    makeupConfig: {
      eyeshadowColor: '#eab308',
      eyeshadowOpacity: 0.65,
      blushColor: '#f43f5e',
      blushOpacity: 0.45,
      lipColor: '#be123c',
      lipOpacity: 0.85,
      lipGloss: true,
      lashesStyle: 'natural',
      glitterLevel: 55,
      selectedFilter: 'warm-glow'
    },
    votes: 19,
    createdAt: Date.now() - 3600000 * 6
  }
];

const TRENDING_LOOKS_LIST = [
  {
    id: 'trend_1',
    name: 'Peachy Dew',
    creator: 'glam.xo',
    likes: '2.4K',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
    hasVideo: false,
    config: { eyeshadowColor: '#ff8a7a', blushColor: '#ffa07a', lipColor: '#ff6b81', lipGloss: true, lashesStyle: 'wispy', glitterLevel: 25 }
  },
  {
    id: 'trend_2',
    name: 'Holo Lavender',
    creator: 'mua.luna',
    likes: '1.8K',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
    hasVideo: true,
    config: { eyeshadowColor: '#c084fc', blushColor: '#f472b6', lipColor: '#e879f9', lipGloss: true, lashesStyle: 'glam', glitterLevel: 60, selectedFilter: 'holographic' }
  },
  {
    id: 'trend_3',
    name: 'Glass Nude',
    creator: 'beauty.by.j',
    likes: '3.1K',
    image: 'https://images.unsplash.com/photo-1588665798934-8c83e78ff6a9?auto=format&fit=crop&q=80&w=600',
    hasVideo: false,
    config: { eyeshadowColor: '#d6a894', blushColor: '#e2a99d', lipColor: '#c48b71', lipGloss: true, lashesStyle: 'natural', glitterLevel: 10 }
  },
  {
    id: 'trend_4',
    name: 'Bronze Eclipse',
    creator: 'faceit.maya',
    likes: '2.7K',
    image: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
    hasVideo: false,
    config: { eyeshadowColor: '#ca8a04', blushColor: '#ea580c', lipColor: '#9a3412', lipGloss: true, lashesStyle: 'cat-eye', glitterLevel: 40 }
  },
  {
    id: 'trend_5',
    name: 'Plump Pink Glass',
    creator: 'cherry_glam',
    likes: '4.2K',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
    hasVideo: true,
    config: { eyeshadowColor: '#fed7aa', blushColor: '#fb7185', lipColor: '#f43f5e', lipGloss: true, lashesStyle: 'natural', glitterLevel: 25 }
  },
  {
    id: 'trend_6',
    name: 'Cyber Aura Matrix',
    creator: 'matrix_neo',
    likes: '1.9K',
    image: 'https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&q=80&w=600',
    hasVideo: true,
    config: { eyeshadowColor: '#8b5cf6', blushColor: '#cb997e', lipColor: '#7c2d12', lipGloss: false, lashesStyle: 'wispy', glitterLevel: 30, selectedFilter: 'cool-cyber' }
  },
  {
    id: 'trend_7',
    name: 'Golden Hour Sparkle',
    creator: 'sol_glow',
    likes: '3.5K',
    image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600',
    hasVideo: false,
    config: { eyeshadowColor: '#eab308', blushColor: '#f43f5e', lipColor: '#be123c', lipGloss: true, lashesStyle: 'natural', glitterLevel: 55, selectedFilter: 'warm-glow' }
  },
  {
    id: 'trend_8',
    name: 'Satin Crimson Noir',
    creator: 'velvet_luxe',
    likes: '2.8K',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
    hasVideo: false,
    config: { eyeshadowColor: '#4b5563', blushColor: '#fda4af', lipColor: '#b91c1c', lipGloss: false, lashesStyle: 'glam', glitterLevel: 10 }
  }
];

interface GalleryPageProps {
  onTryOnSubmission: (preset: PresetLook) => void;
  refreshTrigger: number;
  onToggleReelsFeed?: (active: boolean) => void;
  initialSubTab?: 'looks' | 'inspiration' | 'requests' | 'challenges';
  onNavigate?: (tab: any, param?: any) => void;
  onSelectWantedFeed?: (requestId: string) => void;
  initialMoodFilter?: string | null;
  onClearMoodFilter?: () => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ 
  onTryOnSubmission, 
  refreshTrigger, 
  onToggleReelsFeed,
  initialSubTab = 'looks',
  onNavigate,
  onSelectWantedFeed,
  initialMoodFilter,
  onClearMoodFilter
}) => {
  const [activeCommunityTab, setActiveCommunityTab] = useState<'looks' | 'inspiration' | 'requests' | 'challenges'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveCommunityTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [activeMoodFilter, setActiveMoodFilter] = useState<string | null>(initialMoodFilter || null);

  useEffect(() => {
    if (initialMoodFilter !== undefined) {
      setActiveMoodFilter(initialMoodFilter);
    }
  }, [initialMoodFilter]);
  const [inspirationOpenAddModalTrigger, setInspirationOpenAddModalTrigger] = useState<number>(0);
  const [inspirationCategory, setInspirationCategory] = useState<string>('all');
  const [inspirationViewMode, setInspirationViewMode] = useState<'grid' | 'feed'>('grid');
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [galleryLooks, setGalleryLooks] = useState<GalleryIconicLook[]>(CURATED_20_LOOKS);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallTriggerLook, setPaywallTriggerLook] = useState<{
    name: string;
    image?: string;
    tagline?: string;
    categoryLabel?: string;
  } | null>(null);
  const [pendingPresetAfterUnlock, setPendingPresetAfterUnlock] = useState<PresetLook | null>(null);
  const [isProUser, setIsProUser] = useState<boolean>(() => checkIsProUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [votedSubIds, setVotedSubIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_voted_submissions') || '[]');
    } catch {
      return [];
    }
  });

  const [bookmarkedSubIds, setBookmarkedSubIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_bookmarked_looks') || '["sub_1", "sub_3"]');
    } catch {
      return ["sub_1", "sub_3"];
    }
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  /** Confirmation for a save, shown as a small tick rather than a message. */
  const [saveToast, setSaveToast] = useState<{ ok: boolean; text: string } | null>(null);

  const flashSaveToast = (ok: boolean, text: string) => {
    setSaveToast({ ok, text });
    window.setTimeout(() => setSaveToast(null), 2200);
  };

  /**
   * A saved look belongs to the account, not to this browser, so it is written
   * to the user's saved looks as well as remembered locally. It lands in the
   * Discover bucket of the Saved page in Settings.
   */
  const toggleBookmark = (id: string, e?: React.MouseEvent, look?: GalleryIconicLook) => {
    if (e) {
      e.stopPropagation();
    }
    const wasBookmarked = bookmarkedSubIds.includes(id);
    const newBookmarked = wasBookmarked
      ? bookmarkedSubIds.filter(bId => bId !== id)
      : [...bookmarkedSubIds, id];
    setBookmarkedSubIds(newBookmarked);
    localStorage.setItem('tryon_beauty_bookmarked_looks', JSON.stringify(newBookmarked));

    if (!auth.currentUser) {
      flashSaveToast(false, 'Sign in to save looks to your account');
      return;
    }

    const request = wasBookmarked
      ? removeLookFromAccount(id)
      : saveLookToAccount(
          {
            id,
            name: look?.name || 'Saved look',
            description: look?.tagline || 'Saved from Discover.',
            image: look?.image,
            filterId: (look as any)?.filterId,
            lipColor: look?.config?.lipColor,
            blushColor: look?.config?.blushColor,
            eyeshadowColor: look?.config?.eyeshadowColor,
            eyelinerColor: look?.config?.eyelinerColor,
            lipGloss: look?.config?.lipGloss,
            lashesStyle: look?.config?.lashesStyle,
            glitterLevel: look?.config?.glitterLevel
          },
          'discover'
        );

    request
      .then(() => flashSaveToast(true, wasBookmarked ? 'Removed' : 'Saved'))
      .catch((err) => {
        console.error('Could not sync the saved look:', err);
        flashSaveToast(false, 'Could not save that look');
      });
  };

  // Instagram Reels State
  const [selectedReelSub, setSelectedReelSub] = useState<ChallengeSubmission | null>(null);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);

  // Active reel list combining curated iconic looks and community submissions
  const activeFeedList: ChallengeSubmission[] = useMemo(() => {
    const curatedSubs: ChallengeSubmission[] = galleryLooks.map(look => ({
      id: look.id,
      username: look.creator,
      lookName: look.name,
      description: look.tagline,
      makeupConfig: {
        eyeshadowColor: look.config.eyeshadowColor,
        eyeshadowOpacity: look.config.eyeshadowOpacity,
        eyelinerColor: look.config.eyelinerColor,
        eyelinerOpacity: look.config.eyelinerOpacity,
        eyelinerStyle: look.config.eyelinerStyle,
        blushColor: look.config.blushColor,
        blushOpacity: look.config.blushOpacity,
        lipColor: look.config.lipColor,
        lipOpacity: look.config.lipOpacity,
        lipGloss: look.config.lipGloss || false,
        lashesStyle: look.config.lashesStyle || 'glam',
        glitterLevel: look.config.glitterLevel || 0,
        selectedFilter: look.config.selectedFilter || 'none'
      },
      votes: look.votesCount,
      createdAt: Date.now(),
      isLocked: look.isLocked,
      tier: look.tier,
      category: look.category,
      categoryLabel: look.categoryLabel
    }));

    const curatedIds = new Set(curatedSubs.map(c => c.id));
    const extraSubs = submissions.filter(s => !curatedIds.has(s.id));
    return [...curatedSubs, ...extraSubs];
  }, [galleryLooks, submissions]);

  const handleOpenLookReel = (look: GalleryIconicLook) => {
    trackLookOpened(look.name, look.categoryLabel || look.category || 'Curated', look.creator);
    const matchSub: ChallengeSubmission = {
      id: look.id,
      username: look.creator,
      lookName: look.name,
      description: look.tagline,
      makeupConfig: {
        eyeshadowColor: look.config.eyeshadowColor,
        eyeshadowOpacity: look.config.eyeshadowOpacity,
        eyelinerColor: look.config.eyelinerColor,
        eyelinerOpacity: look.config.eyelinerOpacity,
        eyelinerStyle: look.config.eyelinerStyle,
        blushColor: look.config.blushColor,
        blushOpacity: look.config.blushOpacity,
        lipColor: look.config.lipColor,
        lipOpacity: look.config.lipOpacity,
        lipGloss: look.config.lipGloss || false,
        lashesStyle: look.config.lashesStyle || 'glam',
        glitterLevel: look.config.glitterLevel || 0,
        selectedFilter: look.config.selectedFilter || 'none'
      },
      votes: look.votesCount,
      createdAt: Date.now(),
      isLocked: look.isLocked,
      tier: look.tier,
      category: look.category,
      categoryLabel: look.categoryLabel
    };
    setSelectedReelSub(matchSub);
  };

  // Handle scrolling/navigating between reels reliably on single click/press
  const handleNextReel = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!activeFeedList || activeFeedList.length === 0) return;
    setSelectedReelSub(prev => {
      if (!prev) return activeFeedList[0] || null;
      const currentIndex = activeFeedList.findIndex(s => s.id === prev.id || s.lookName === prev.lookName);
      if (currentIndex >= 0 && currentIndex < activeFeedList.length - 1) {
        return activeFeedList[currentIndex + 1];
      }
      return activeFeedList[0]; // Wrap around to first
    });
  };

  const handlePrevReel = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!activeFeedList || activeFeedList.length === 0) return;
    setSelectedReelSub(prev => {
      if (!prev) return activeFeedList[0] || null;
      const currentIndex = activeFeedList.findIndex(s => s.id === prev.id || s.lookName === prev.lookName);
      if (currentIndex > 0) {
        return activeFeedList[currentIndex - 1];
      }
      return activeFeedList[activeFeedList.length - 1]; // Wrap around to last
    });
  };

  // Toggle Reels feed display state in parent to hide global bottom navigation bar
  useEffect(() => {
    if (onToggleReelsFeed) {
      onToggleReelsFeed(!!selectedReelSub);
    }
  }, [selectedReelSub, onToggleReelsFeed]);

  // Immersive keyboard, wheel scroll, and touch swipe event handlers for Reels feed scrolling
  useEffect(() => {
    if (!selectedReelSub) return;

    // Standard body scroll freeze when in full screen Reels
    document.body.style.overflow = 'hidden';

    // Keyboard navigation (ArrowUp/ArrowDown)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevReel();
      } else if (e.key === 'Escape') {
        setSelectedReelSub(null);
      }
    };

    // Throttle mouse wheel event for smooth transition without scrolling past many entries
    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 800) return; // 800ms debounce
      
      if (e.deltaY > 0) {
        handleNextReel();
        lastWheelTime = now;
      } else if (e.deltaY < 0) {
        handlePrevReel();
        lastWheelTime = now;
      }
    };

    // Mobile touch swiping gesture tracker
    let touchStartY = 0;
    let touchStartedOnInteractive = false;
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      touchStartedOnInteractive = !!target?.closest('button, input, textarea, a, select');
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartedOnInteractive) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY - touchEndY;
      
      if (Math.abs(diffY) > 50) { // 50px swipe gesture threshold
        if (diffY > 0) {
          // Swiped upwards -> Go to next reel
          handleNextReel();
        } else {
          // Swiped downwards -> Go to previous reel
          handlePrevReel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [selectedReelSub, activeFeedList]);

  // Challenge Submission Form States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>(() => {
    return localStorage.getItem('tryon_beauty_username') || '';
  });
  const [newLookName, setNewLookName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newSelectedFilter, setNewSelectedFilter] = useState<string>('holographic');
  const [newEyeshadowColor, setNewEyeshadowColor] = useState<string>('#ec4899');
  const [newLipColor, setNewLipColor] = useState<string>('#be123c');
  const [newBlushColor, setNewBlushColor] = useState<string>('#f43f5e');
  const [newGlitterLevel, setNewGlitterLevel] = useState<number>(50);
  const [newLashesStyle, setNewLashesStyle] = useState<string>('natural');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const handleSubmitNewLook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newLookName.trim()) {
      return;
    }

    setIsPublishing(true);
    localStorage.setItem('tryon_beauty_username', newUsername.trim());

    try {
      await addDoc(collection(db, 'submissions'), {
        username: newUsername.trim(),
        lookName: newLookName.trim(),
        description: newDescription.trim() || 'A beautiful customized look created for TryON Beauty.',
        makeupConfig: {
          eyeshadowColor: newEyeshadowColor,
          eyeshadowOpacity: 0.8,
          blushColor: newBlushColor,
          blushOpacity: 0.45,
          lipColor: newLipColor,
          lipOpacity: 0.85,
          lipGloss: true,
          lashesStyle: newLashesStyle,
          glitterLevel: newGlitterLevel,
          selectedFilter: newSelectedFilter
        },
        votes: 0,
        createdAt: Date.now()
      }).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, 'submissions');
      });

      // Clear non-persistent form fields
      setNewLookName('');
      setNewDescription('');
      setIsSubmitModalOpen(false);
      
      // Refresh list
      fetchSubmissions();
    } catch (err) {
      console.error('Error submitting challenge look: ', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'submissions')).catch(error => {
        handleFirestoreError(error, OperationType.LIST, 'submissions');
      });
      const list: ChallengeSubmission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          username: data.username || 'Anonymous',
          lookName: data.lookName || 'Untitled Look',
          description: data.description || '',
          makeupConfig: data.makeupConfig || {},
          votes: data.votes || 0,
          createdAt: data.createdAt || Date.now()
        });
      });

      if (list.length === 0) {
        for (const seed of SEED_SUBMISSIONS) {
          const { id, ...data } = seed;
          await addDoc(collection(db, 'submissions'), data).catch(error => {
            handleFirestoreError(error, OperationType.CREATE, 'submissions');
          });
        }
        const nextSnapshot = await getDocs(collection(db, 'submissions')).catch(error => {
          handleFirestoreError(error, OperationType.LIST, 'submissions');
        });
        const seededList: ChallengeSubmission[] = [];
        nextSnapshot.forEach((doc) => {
          const data = doc.data();
          seededList.push({
            id: doc.id,
            username: data.username || 'Anonymous',
            lookName: data.lookName || 'Untitled Look',
            description: data.description || '',
            makeupConfig: data.makeupConfig || {},
            votes: data.votes || 0,
            createdAt: data.createdAt || Date.now()
          });
        });
        setSubmissions(seededList.sort((a, b) => b.votes - a.votes));
      } else {
        setSubmissions(list.sort((a, b) => b.votes - a.votes));
      }
    } catch (err) {
      console.error('Error fetching gallery submissions: ', err);
      if (err instanceof Error && err.message.includes('{')) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    async function initFirestoreLooks() {
      try {
        const looks = await fetchGalleryLooksFromFirestore(CURATED_20_LOOKS);
        if (looks && looks.length > 0) {
          setGalleryLooks(looks);
        }
        await syncLooksToFirestore(CURATED_20_LOOKS, INITIAL_INSPIRATIONS);
      } catch (err) {
        console.warn('Looks init notice:', err);
      }
    }
    initFirestoreLooks();
  }, [refreshTrigger]);

  const handleTryOnLook = (look: GalleryIconicLook | ChallengeSubmission) => {
    const isLockedLook = 'isLocked' in look && look.isLocked;
    const currentPro = checkIsProUser();

    const preset: PresetLook = 'config' in look ? {
      id: look.id,
      name: look.name,
      description: look.tagline,
      eyeshadowColor: look.config.eyeshadowColor,
      eyeshadowOpacity: look.config.eyeshadowOpacity,
      eyelinerColor: look.config.eyelinerColor,
      eyelinerOpacity: look.config.eyelinerOpacity,
      eyelinerStyle: look.config.eyelinerStyle,
      blushColor: look.config.blushColor,
      blushOpacity: look.config.blushOpacity,
      lipColor: look.config.lipColor,
      lipOpacity: look.config.lipOpacity,
      lipGloss: look.config.lipGloss,
      lashesStyle: look.config.lashesStyle as any,
      glitterLevel: look.config.glitterLevel,
      filter: (look.config.selectedFilter as any) || 'none',
      isLocked: look.isLocked,
      tier: look.tier
    } : {
      id: look.id,
      name: look.lookName,
      description: look.description,
      eyeshadowColor: look.makeupConfig.eyeshadowColor,
      eyeshadowOpacity: look.makeupConfig.eyeshadowOpacity,
      eyelinerColor: look.makeupConfig.eyelinerColor,
      eyelinerOpacity: look.makeupConfig.eyelinerOpacity,
      eyelinerStyle: look.makeupConfig.eyelinerStyle,
      blushColor: look.makeupConfig.blushColor,
      blushOpacity: look.makeupConfig.blushOpacity,
      lipColor: look.makeupConfig.lipColor,
      lipOpacity: look.makeupConfig.lipOpacity,
      lipGloss: look.makeupConfig.lipGloss,
      lashesStyle: look.makeupConfig.lashesStyle as any,
      glitterLevel: look.makeupConfig.glitterLevel,
      filter: (look.makeupConfig.selectedFilter as any) || 'none'
    };

    if (isLockedLook && !currentPro) {
      const isIconic = 'config' in look;
      setPaywallTriggerLook({
        name: isIconic ? (look as GalleryIconicLook).name : (look as ChallengeSubmission).lookName,
        image: isIconic ? (look as GalleryIconicLook).image : undefined,
        tagline: isIconic ? (look as GalleryIconicLook).tagline : (look as ChallengeSubmission).description,
        categoryLabel: isIconic ? (look as GalleryIconicLook).categoryLabel : 'VIP Pro Look'
      });
      setPendingPresetAfterUnlock(preset);
      setIsPaywallOpen(true);
      return;
    }

    onTryOnSubmission(preset);
  };

  const handleVote = async (id: string) => {
    if (votedSubIds.includes(id)) return;
    try {
      const docRef = doc(db, 'submissions', id);
      await updateDoc(docRef, { votes: increment(1) }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `submissions/${id}`);
      });
      
      const newVoted = [...votedSubIds, id];
      setVotedSubIds(newVoted);
      localStorage.setItem('tryon_beauty_voted_submissions', JSON.stringify(newVoted));

      setSubmissions(prev =>
        prev.map(sub => sub.id === id ? { ...sub, votes: sub.votes + 1 } : sub)
            .sort((a, b) => b.votes - a.votes)
      );
    } catch (err) {
      console.error('Error recording vote: ', err);
      if (err instanceof Error && err.message.includes('{')) {
        throw err;
      }
    }
  };

  const loadIntoSandbox = (sub: ChallengeSubmission) => {
    const config = sub.makeupConfig;
    const preset: PresetLook = {
      id: sub.id,
      name: sub.lookName,
      description: sub.description,
      eyeshadowColor: config.eyeshadowColor || '#ff0000',
      eyeshadowOpacity: config.eyeshadowOpacity || 0.5,
      blushColor: config.blushColor || '#ff0000',
      blushOpacity: config.blushOpacity || 0.5,
      lipColor: config.lipColor || '#ff0000',
      lipOpacity: config.lipOpacity || 0.5,
      lipGloss: config.lipGloss || false,
      lashesStyle: (config.lashesStyle as any) || 'none',
      glitterLevel: config.glitterLevel || 0,
      filter: (config.selectedFilter as any) || 'none'
    };
    onTryOnSubmission(preset);
  };

  // Filter submissions by selected Filter style and search query (name or creator)
  const filteredSubmissions = submissions.filter(sub => {
    const matchesCategory = categoryFilter === 'all' || sub.makeupConfig.selectedFilter === categoryFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      sub.lookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Retrieve matching makeup cover or fallback gracefully
  const getCoverImage = (lookName: string, index: number) => {
    if (COSMETIC_COVERS[lookName]) {
      return COSMETIC_COVERS[lookName];
    }
    return DEFAULT_COVERS[index % DEFAULT_COVERS.length];
  };

  return (
    <div id="gallery-page" className="relative space-y-4 sm:space-y-6 animate-in fade-in duration-300 text-stone-800 -mt-1 sm:-mt-2">
      
      {saveToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-white border border-stone-200 text-stone-900 px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {saveToast.ok ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <X className="w-4 h-4 text-rose-500" />
          )}
          <span>{saveToast.text}</span>
        </div>
      )}

      {/* Soft Luminous Warm Background Ambient Glow */}
      <div className="absolute top-12 left-10 w-96 h-96 bg-[#F7F2EF] rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-64 right-10 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Main Foreground Content Layer */}
      <div className="relative z-10 space-y-4 sm:space-y-6">

      {/* ARCHITECTURAL SLIT-LIGHT SCULPTED BANNER: "DISCOVER" (CLICKABLE TO LOAD COMMUNITY LOOKS) */}
      <DiscoverSculpturalText 
        onClick={() => {
          if (onNavigate) {
            onNavigate('gallery-looks');
          } else {
            setActiveCommunityTab('looks');
          }
          setCategoryFilter('all');
          setSearchQuery('');
        }}
      />

      {/* TOP SEARCH & FILTER BAR (Clean Side-by-Side Search Feature with Icon-Only Filter) */}
      <div className="flex items-center gap-2.5 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder={
              activeCommunityTab === 'inspiration'
                ? "Search inspiration moodboards, aesthetics, tags (#GlassSkin, #Latte)..."
                : activeCommunityTab === 'requests'
                ? "Search look requests, creators, ideas..."
                : activeCommunityTab === 'challenges'
                ? "Search challenges, themes, leaderboard..."
                : "Search looks, creators, tags..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-8 py-2.5 bg-white border border-stone-200/80 rounded-full focus:outline-none focus:ring-2 focus:ring-[#ff4e7e]/20 focus:border-[#ff4e7e] font-medium text-stone-800 placeholder-stone-400 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
          aria-label="Filter"
          title="Filter and Refine"
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center cursor-pointer shadow-xs transition-all shrink-0 ${
            isFilterDrawerOpen 
              ? 'bg-[#ff4e7e] text-white border-[#ff4e7e]' 
              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200/80'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* FILTER POPUP MODAL (Universal for all tabs with layout toggles and category refinements) */}
      {isFilterDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-100 space-y-5 animate-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#ff4e7e]/10 flex items-center justify-center text-[#ff4e7e]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 leading-tight">
                    {activeCommunityTab === 'inspiration' ? 'Filter Inspiration Wall' : 'Filter Community Looks'}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {activeCommunityTab === 'inspiration' ? 'Choose display layout & moodboard themes' : 'Refine community formulas & styles'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View Layout Toggle (Grid vs List/Feed) */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-stone-500">View Layout</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInspirationViewMode('grid')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    inspirationViewMode === 'grid'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Moodboard Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspirationViewMode('feed')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    inspirationViewMode === 'feed'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Scroll Feed</span>
                </button>
              </div>
            </div>

            {/* Filter Section: Depends on active tab */}
            {activeCommunityTab === 'inspiration' ? (
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-stone-500">Aesthetic Moods</span>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {[
                    { id: 'all', label: 'All Moods' },
                    { id: 'user-creations', label: 'User Creations' },
                    { id: 'aspirational', label: 'Aspirational Moods' },
                    { id: 'glass-skin', label: 'Glass Skin & Gloss' },
                    { id: 'latte-bronze', label: 'Latte & Bronze' },
                    { id: 'cherry-flush', label: 'Cherry Flush' },
                    { id: 'clean-girl', label: 'Clean Girl' },
                    { id: 'graphic-liner', label: 'Graphic Liner' },
                    { id: 'lip-combos', label: 'Lip Combos' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setInspirationCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        inspirationCategory === cat.id
                          ? 'bg-[#ff4e7e] text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Filter Section: Category */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-500">Category & Theme</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'All Looks' },
                      { id: 'trending', label: 'Trending' },
                      { id: 'new', label: 'New' },
                      { id: 'following', label: 'Following' },
                      { id: 'holographic', label: 'Holographic' },
                      { id: 'warm-glow', label: 'Warm Glow' },
                      { id: 'cool-cyber', label: 'Cool Cyber' },
                      { id: 'vintage', label: 'Vintage' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCategoryFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-inter font-[600] transition-all cursor-pointer ${
                          categoryFilter === tab.id
                            ? 'bg-[#ff4e7e] text-white shadow-xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Section: Formula Style */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-500">Formula Finish</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['All Finishes', 'High Gloss', 'Glitter Sparkle', 'Matte Finish', 'E-Girl Liner', 'Natural Glow', 'Dewy Glass'].map((style, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (style !== 'All Finishes') {
                            setSearchQuery(style.toLowerCase());
                          } else {
                            setSearchQuery('');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          (style === 'All Finishes' && searchQuery === '') || (searchQuery.toLowerCase() === style.toLowerCase())
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setInspirationCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-full text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="px-6 py-2.5 bg-[#ff4e7e] hover:bg-[#ff3b6f] text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU SECTION: 4 COMPACT GLASS SUB-SECTION TILES ACROSS THE PAGE */}
      <div className="w-full flex justify-center py-1 sm:py-2">
        <section className="preview !w-full !max-w-none">
          <div className="menu-grid">

            {/* 1. LOOKS */}
            <button
              type="button"
              onClick={() => {
                setActiveCommunityTab('looks');
                if (onNavigate) {
                  onNavigate('gallery-looks');
                }
              }}
              className={`menu-card ${activeCommunityTab === 'looks' ? 'selected' : ''}`}
              title="Signature & Community Looks"
            >
              <span className="icon">
                <svg viewBox="0 0 48 48">
                  <path d="
                    M24 8
                    C25.8 17 31 22.2 40 24
                    C31 25.8 25.8 31 24 40
                    C22.2 31 17 25.8 8 24
                    C17 22.2 22.2 17 24 8Z
                  "/>
                </svg>
              </span>
              <span className="label">Looks</span>
            </button>

            {/* 2. INSPIRATION */}
            <button
              type="button"
              onClick={() => {
                setActiveCommunityTab('inspiration');
                if (onNavigate) {
                  onNavigate('gallery-inspiration');
                }
              }}
              className={`menu-card ${activeCommunityTab === 'inspiration' ? 'selected' : ''}`}
              title="Inspiration Moodboard"
            >
              <span className="icon">
                <svg viewBox="0 0 48 48">
                  <rect
                    x="8"
                    y="8"
                    width="12"
                    height="12"
                    rx="2"
                  />
                  <rect
                    x="28"
                    y="8"
                    width="12"
                    height="12"
                    rx="2"
                  />
                  <rect
                    x="8"
                    y="28"
                    width="12"
                    height="12"
                    rx="2"
                  />
                  <rect
                    x="28"
                    y="28"
                    width="12"
                    height="12"
                    rx="2"
                  />
                </svg>
              </span>
              <span className="label">Inspiration</span>
            </button>

            {/* 3. WANTED */}
            <button
              type="button"
              onClick={() => {
                setActiveCommunityTab('requests');
                if (onNavigate) {
                  onNavigate('gallery-wanted');
                }
              }}
              className={`menu-card ${activeCommunityTab === 'requests' ? 'selected' : ''}`}
              title="Wanted Board & Demands"
            >
              <span className="icon">
                <svg viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="12.5"/>
                  <line x1="24" y1="4" x2="24" y2="9.5"/>
                  <line x1="24" y1="38.5" x2="24" y2="44"/>
                  <line x1="4" y1="24" x2="9.5" y2="24"/>
                  <line x1="38.5" y1="24" x2="44" y2="24"/>
                  <path d="
                    M24 28.5
                    C24 28.5 17.5 24.2 17.5 20.8
                    C17.5 18.6 19.1 17.2 21 17.2
                    C22.6 17.2 23.6 18.1 24 19.2
                    C24.4 18.1 25.4 17.2 27 17.2
                    C28.9 17.2 30.5 18.6 30.5 20.8
                    C30.5 24.2 24 28.5 24 28.5
                    Z
                  "/>
                </svg>
              </span>
              <span className="label">Wanted™</span>
            </button>

            {/* 4. CHALLENGES */}
            <button
              type="button"
              onClick={() => {
                setActiveCommunityTab('challenges');
                if (onNavigate) {
                  onNavigate('gallery-challenges');
                }
              }}
              className={`menu-card ${activeCommunityTab === 'challenges' ? 'selected' : ''}`}
              title="Community Challenges"
            >
              <span className="icon">
                <svg viewBox="0 0 48 48">
                  <path d="
                    M16 9h16v9
                    C32 27 27.5 31 24 31
                    C20.5 31 16 27 16 18Z
                  "/>
                  <path d="
                    M16 13H9
                    C9 21 12.5 25 18 25
                  "/>
                  <path d="
                    M32 13h7
                    C39 21 35.5 25 30 25
                  "/>
                  <path d="M24 31v6"/>
                  <path d="M17 41h14"/>
                </svg>
              </span>
              <span className="label">Challenges</span>
            </button>

          </div>
        </section>
      </div>

      {/* SUB-PAGES LOADED UNDERNEATH BANNER */}
      {activeCommunityTab === 'looks' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Active Mood Filter Pill Banner */}
          {activeMoodFilter && (
            <div className="flex items-center justify-between bg-[#F7F2EF] border border-[#EDE7E3] rounded-2xl px-4 py-2.5 shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Mood Aesthetic:</span>
                <span className="px-3 py-1 rounded-full bg-[#2A1715] text-white text-xs font-black tracking-wide flex items-center gap-1.5 shadow-xs">
                  <span>✦</span>
                  <span>{activeMoodFilter}</span>
                </span>
                <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
                  Showing curated formulas and looks matching this vibe
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveMoodFilter(null);
                  if (onClearMoodFilter) onClearMoodFilter();
                }}
                className="text-xs font-bold text-[#E91E63] hover:text-[#c2185b] flex items-center gap-1 cursor-pointer transition-colors shrink-0 ml-2"
              >
                <span>Clear</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* HORIZONTAL CATEGORY PILLS (CRISP GLASS TABS WITH CLEAR CONTRAST) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5 -mx-1 px-1">
            {[
              { id: 'all', label: 'For You' },
              { id: 'trending', label: 'Trending' },
              { id: 'new', label: 'New' },
              { id: 'following', label: 'Following' },
              { id: 'holographic', label: 'Holographic' },
              { id: 'warm-glow', label: 'Warm Glow' },
              { id: 'cool-cyber', label: 'Cool Cyber' },
              { id: 'vintage', label: 'Vintage' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-white text-black border border-white shadow-[0_2px_8px_rgba(135,107,93,0.15)] ring-1 ring-[#876b5d]/10'
                    : 'bg-[#6b5649] hover:bg-[#574337] text-[#fdfaf7] border border-[#5d4a3e] shadow-[0_2px_6px_rgba(65,40,25,0.12)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CATEGORY: TRENDING -> RENDER ICONIC LOOKS CARDS */}
          {categoryFilter === 'trending' ? (
            <div className="space-y-4 pt-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] font-thin text-stone-900 tracking-tight text-left">
                    Trending Looks Gallery
                  </h3>
                  <p className="text-xs text-stone-600 text-left">
                    The {galleryLooks.length} signature looks setting beauty trends this season
                  </p>
                </div>
                <span className="text-xs font-bold text-[#876b5d] bg-[#f2ede9] px-3 py-1 rounded-full border border-[#d8cec5]">
                  {galleryLooks.length} Iconic Looks
                </span>
              </div>

              {/* Responsive Grid of All Curated Look Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-5">
                {galleryLooks.map((look) => {
                  const isBookmarked = bookmarkedSubIds.includes(look.id);
                  const isLocked = look.isLocked && !isProUser;
                  return (
                    <div
                      key={look.id}
                      onClick={() => handleOpenLookReel(look)}
                      className="group relative h-72 sm:h-84 md:h-96 w-full rounded-3xl overflow-hidden shadow-md cursor-pointer text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl border border-stone-200/60 bg-stone-900"
                    >
                      {/* Portrait Image */}
                      <img 
                        src={look.image} 
                        alt={look.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/25" />

                      {/* Top Badges: Category Pill & Bookmark / Video & VIP Locked badge */}
                      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isLocked ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[9.5px] font-black tracking-wider uppercase text-white flex items-center gap-1 shadow-md border border-amber-300/40 shrink-0">
                              <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                              <span>PRO</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9.5px] font-bold tracking-wide uppercase text-white/95 border border-white/20 shadow-xs truncate max-w-[110px]">
                              {look.categoryLabel}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
                          {look.hasVideo && (
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xs shrink-0">
                              <Play className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-current ml-0.5" />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => toggleBookmark(look.id, e, look)}
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer ${
                              isBookmarked 
                                ? 'bg-[#ff4e7e] text-white' 
                                : 'bg-black/50 text-white/80 hover:text-white border border-white/30'
                            }`}
                          >
                            <Bookmark className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Look Details */}
                      <div className="absolute bottom-3 sm:bottom-3.5 left-3 sm:left-3.5 right-3 sm:right-3.5 z-10 space-y-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight drop-shadow-md truncate">
                              {look.name}
                            </h4>
                            {isLocked && (
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-xs" />
                            )}
                          </div>
                          <p className="text-[10.5px] sm:text-[11px] text-white/85 line-clamp-1 leading-snug font-medium hidden sm:block">
                            {look.tagline}
                          </p>
                          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-white/80 font-medium pt-0.5">
                            <span className="truncate max-w-[65%]">@{look.creator}</span>
                            <span className="flex items-center gap-1 text-[#ff7a9e] font-bold shrink-0">
                              ♥ {look.likes}
                            </span>
                          </div>
                        </div>

                        {/* Swatches dots */}
                        <div className="flex items-center gap-1.5">
                          {look.swatches.map((swatch, idx) => (
                            <div 
                              key={idx}
                              title={swatch.name}
                              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-white/80 shadow-xs"
                              style={{ backgroundColor: swatch.hex }}
                            />
                          ))}
                        </div>

                        {/* TRY ON pill button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTryOnLook(look);
                          }}
                          className={`w-full py-2 px-2.5 text-[10.5px] sm:text-xs font-black rounded-full shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap overflow-hidden select-none ${
                            isLocked
                              ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-stone-950 hover:brightness-105'
                              : 'bg-white hover:bg-stone-100 text-stone-900'
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-stone-950 shrink-0 stroke-[2.5]" />
                              <span className="tracking-wider">UNLOCK PRO</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#ff4e7e]" />
                              <span className="tracking-wider">TRY ON</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : categoryFilter === 'all' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 1. SECTION: ICONIC LOOKS GALLERY */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] font-thin text-stone-900 tracking-tight text-left">
                    Iconic Looks Collection
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setCategoryFilter('trending')}
                    className="text-xs font-inter font-semibold uppercase tracking-wider text-stone-700 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>EXPLORE ALL</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 20 PORTRAIT CARDS IN RESPONSIVE 3-COLUMN GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-5">
                  {galleryLooks.map((look) => {
                    const isBookmarked = bookmarkedSubIds.includes(look.id);
                    const isLocked = look.isLocked && !isProUser;
                    return (
                      <div
                        key={look.id}
                        onClick={() => handleOpenLookReel(look)}
                        className="group relative h-72 sm:h-84 md:h-96 w-full rounded-3xl overflow-hidden shadow-md cursor-pointer text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl border border-stone-200/60 bg-stone-900"
                      >
                        {/* Portrait Image */}
                        <img 
                          src={look.image} 
                          alt={look.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/25" />

                        {/* Top Badges: Category Pill & Bookmark / Video & VIP Locked badge */}
                        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isLocked ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[9.5px] font-black tracking-wider uppercase text-white flex items-center gap-1 shadow-md border border-amber-300/40 shrink-0">
                                <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                                <span>PRO</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9.5px] font-bold tracking-wide uppercase text-white/95 border border-white/20 shadow-xs truncate max-w-[110px]">
                                {look.categoryLabel}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
                            {look.hasVideo && (
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xs shrink-0">
                                <Play className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-current ml-0.5" />
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => toggleBookmark(look.id, e, look)}
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer ${
                                isBookmarked 
                                ? 'bg-[#ff4e7e] text-white' 
                                : 'bg-black/50 text-white/80 hover:text-white border border-white/30'
                              }`}
                            >
                              <Bookmark className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Look Details */}
                        <div className="absolute bottom-3 sm:bottom-3.5 left-3 sm:left-3.5 right-3 sm:right-3.5 z-10 space-y-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight drop-shadow-md truncate">
                                {look.name}
                              </h4>
                              {isLocked && (
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-xs" />
                              )}
                            </div>
                            <p className="text-[10.5px] sm:text-[11px] text-white/85 line-clamp-1 leading-snug font-medium hidden sm:block">
                              {look.tagline}
                            </p>
                            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-white/80 font-medium pt-0.5">
                              <span className="truncate max-w-[65%]">@{look.creator}</span>
                              <span className="flex items-center gap-1 text-[#ff7a9e] font-bold shrink-0">
                                ♥ {look.likes}
                              </span>
                            </div>
                          </div>

                          {/* Swatches dots */}
                          <div className="flex items-center gap-1.5">
                            {look.swatches.map((swatch, idx) => (
                              <div 
                                key={idx}
                                title={swatch.name}
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-white/80 shadow-xs"
                                style={{ backgroundColor: swatch.hex }}
                              />
                            ))}
                          </div>

                          {/* TRY ON pill button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTryOnLook(look);
                            }}
                            className={`w-full py-2 px-2.5 text-[10.5px] sm:text-xs font-black rounded-full shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap overflow-hidden select-none ${
                              isLocked
                                ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-stone-950 hover:brightness-105'
                                : 'bg-white hover:bg-stone-100 text-stone-900'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-stone-950 shrink-0 stroke-[2.5]" />
                                <span className="tracking-wider">UNLOCK PRO</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#ff4e7e]" />
                                <span className="tracking-wider">TRY ON</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. ACTION CARDS ROW: POST YOUR LOOK & CREATE YOUR LOOK (UNDER ICONIC LOOKS) */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* CARD 1: POST YOUR LOOK */}
                <div 
                  onClick={() => {
                    setActiveCommunityTab('inspiration');
                    setInspirationOpenAddModalTrigger(prev => prev + 1);
                  }}
                  className="relative overflow-hidden bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_8px_25px_rgba(31,38,135,0.03)] text-left cursor-pointer hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="w-8 h-8 rounded-full bg-[#e7dfd8] border border-[#d8cec5] flex items-center justify-center text-[#5a4537] shadow-2xs">
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-base sm:text-lg font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] font-thin text-stone-900 tracking-tight">
                          Post Your Look
                        </h4>
                        <p className="text-[11px] sm:text-xs text-stone-500 font-medium leading-tight">
                          Share your vibe. Inspire the community.
                        </p>
                      </div>
                    </div>

                    {/* Right column: Image preview + Button directly underneath */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border border-[#d8cec5] shadow-xs bg-gradient-to-tr from-[#f3ece6] to-[#e7dfd8] flex items-center justify-center">
                        <img 
                          src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=200" 
                          alt="Look preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute inset-0 bg-[#5a4537]/10 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-[#6b5649] text-white flex items-center justify-center shadow-xs">
                            <Plus className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCommunityTab('inspiration');
                          setInspirationOpenAddModalTrigger(prev => prev + 1);
                        }}
                        className="px-3 py-1 bg-[#e7dfd8] hover:bg-[#ded5cd] border border-[#d8cec5] text-[#4a3b32] text-[10.5px] font-bold rounded-full transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                      >
                        <span>Share Look</span>
                        <Plus className="w-3 h-3 text-[#5a4537] stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CARD 2: CREATE YOUR LOOK */}
                <div 
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('sandbox');
                    }
                  }}
                  className="relative overflow-hidden bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_8px_25px_rgba(31,38,135,0.03)] text-left cursor-pointer hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="w-8 h-8 rounded-full bg-[#e7dfd8] border border-[#d8cec5] flex items-center justify-center text-[#5a4537] shadow-2xs">
                        <Sparkles className="w-4 h-4 stroke-[2.2]" />
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-base sm:text-lg font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] font-thin text-stone-900 tracking-tight">
                          Create Your Look
                        </h4>
                        <p className="text-[11px] sm:text-xs text-stone-500 font-medium leading-tight">
                          Create your custom look. Save to your memories.
                        </p>
                      </div>
                    </div>

                    {/* Right column: Image preview + Button directly underneath */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border border-[#d8cec5] shadow-xs bg-gradient-to-tr from-[#f3ece6] to-[#e7dfd8] flex items-center justify-center">
                        <img 
                          src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=200" 
                          alt="Custom look preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute inset-0 bg-[#5a4537]/10 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-[#6b5649] text-white flex items-center justify-center shadow-xs">
                            <Sparkles className="w-3 h-3" />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) {
                            onNavigate('sandbox');
                          }
                        }}
                        className="px-3 py-1 bg-[#e7dfd8] hover:bg-[#ded5cd] border border-[#d8cec5] text-[#4a3b32] text-[10.5px] font-bold rounded-full transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                      >
                        <span>Create Look</span>
                        <Plus className="w-3 h-3 text-[#5a4537] stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. HERO CARD: POPULAR CHALLENGE (UNDER ACTION CARDS) */}
              <PopularChallengeCard onEnter={() => setIsSubmitModalOpen(true)} />

              {/* SQUARE CAROUSEL: "TRY LOOKS FROM THE COMMUNITY" (LIPS & EYES CLOSEUPS) */}
              <div className="my-6 sm:my-8 bg-[#e7dfd8] border border-[#d8cec5] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] font-thin text-stone-900 tracking-tight">
                      Try Looks from the Community
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCommunityTab('inspiration')}
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
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('inspirationlooks-scrollfeed', item.id);
                        } else {
                          onTryOnSubmission(item.preset as PresetLook);
                        }
                      }}
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

              {/* CARD: HALL OF FAME & LEGENDS (MOVED UNDER TRENDING LOOKS) */}
              <div 
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('hall-of-fame');
                  }
                }}
                className="my-6 sm:my-8 relative overflow-hidden bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-[0_8px_25px_rgba(31,38,135,0.03)] text-left cursor-pointer hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-200/60 flex items-center justify-center text-pink-500 shadow-2xs">
                      <Crown className="w-5 h-5 text-pink-500" />
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-base sm:text-lg font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] font-thin text-stone-900 tracking-tight">
                        Hall of Fame & Legends
                      </h4>
                      <p className="text-xs text-stone-500 font-medium leading-normal">
                        Iconic looks. Top creators. Beauty history.
                      </p>
                    </div>
                  </div>

                  {/* Overlapping circular portraits + delicate sparkle */}
                  <div className="relative flex items-center shrink-0 pr-2 pt-1">
                    <div className="flex -space-x-3 overflow-visible">
                      <img className="h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-xs" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" alt="Legend" referrerPolicy="no-referrer" />
                      <img className="h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-xs" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150" alt="Legend" referrerPolicy="no-referrer" />
                      <img className="h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-xs" src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150" alt="Legend" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="w-4 h-4 text-purple-400 fill-purple-200 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigate) {
                        onNavigate('hall-of-fame');
                      }
                    }}
                    className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Explore Legends</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-600" />
                  </button>
                </div>
              </div>

              {/* SECTION 3: BOTTOM 4 FEATURED CARDS */}
              <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                
                {/* CARD A: "PEOPLE WANT THIS" (Espresso Glam) */}
                <div 
                  onClick={() => {
                    setActiveCommunityTab('requests');
                  }}
                  className="relative overflow-hidden bg-[#f3e8ff] rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_25px_rgba(168,85,247,0.06)] text-left cursor-pointer hover:shadow-md transition-all duration-300 group min-h-[170px] font-montserrat"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 z-10 font-montserrat">
                      <div className="text-[10px] font-black uppercase text-purple-800 tracking-wider flex items-center gap-1.5 font-montserrat">
                        <Eye className="w-3.5 h-3.5 text-purple-800" />
                        <span className="font-montserrat font-bold">People Want This</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-montserrat font-black text-stone-900 leading-snug">
                        Espresso Office Glam
                      </h3>

                      <div className="flex items-center gap-2 pt-1 font-montserrat">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[11px] font-bold text-stone-700 font-montserrat">1,842 want this look</span>
                      </div>
                    </div>

                    {/* Collage preview on right */}
                    <div className="grid grid-cols-2 gap-1 w-20 shrink-0">
                      <img src="https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=120" alt="Eyes" referrerPolicy="no-referrer" className="w-full h-10 object-cover rounded-lg" />
                      <img src="https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=120" alt="Lips" referrerPolicy="no-referrer" className="w-full h-10 object-cover rounded-lg" />
                      <img src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=120" alt="Coffee" referrerPolicy="no-referrer" className="col-span-2 w-full h-7 object-cover rounded-lg" />
                    </div>
                  </div>

                  <div className="mt-4 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSubmitModalOpen(true);
                      }}
                      className="px-4 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold font-montserrat rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="font-montserrat">Create This Look</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#ff4e7e]" />
                    </button>
                  </div>
                </div>

                {/* CARD B: "CHALLENGE SPOTLIGHT" (Clean Girl Aesthetic) */}
                <div 
                  onClick={() => {
                    setActiveCommunityTab('challenges');
                  }}
                  className="relative overflow-hidden bg-[#ffe7db] rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_25px_rgba(249,115,22,0.06)] text-left cursor-pointer hover:shadow-md transition-all duration-300 group min-h-[170px] font-montserrat"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 z-10 font-montserrat">
                      <div className="text-[10px] font-black uppercase text-orange-800 tracking-wider flex items-center gap-1.5 font-montserrat">
                        <Trophy className="w-3.5 h-3.5 text-orange-800" />
                        <span className="font-montserrat font-bold">Challenge Spotlight</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-montserrat font-black text-stone-900 leading-snug">
                        Clean Girl Aesthetic
                      </h3>
                      <p className="text-[11px] font-semibold text-orange-700 font-montserrat">
                        4 days left to enter
                      </p>

                      <div className="flex items-center gap-2 pt-1 font-montserrat">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[11px] font-bold text-stone-700 font-montserrat">896 entered</span>
                      </div>
                    </div>

                    {/* Model preview on right */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xs shrink-0 border-2 border-white">
                      <img src="https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&q=80&w=200" alt="Clean Girl" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="mt-4 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCommunityTab('challenges');
                      }}
                      className="px-4 py-1.5 bg-[#ff4e7e] hover:bg-[#ff3b6f] text-white text-xs font-bold font-montserrat rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="font-montserrat">View Challenge</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* CARD C: "LEGENDS / HALL OF FAME" */}
                <div 
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('hall-of-fame');
                    }
                  }}
                  className="relative overflow-hidden bg-[#f5dda4] rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_25px_rgba(245,158,11,0.06)] text-left cursor-pointer hover:shadow-md transition-all duration-300 group min-h-[170px] font-montserrat"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 z-10 font-montserrat">
                      <div className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5 font-montserrat">
                        <Crown className="w-3.5 h-3.5 text-amber-800" />
                        <span className="font-montserrat font-bold">Beauty Legends</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-montserrat font-black text-stone-900 leading-snug">
                        Hall of Fame & Legends
                      </h3>
                      <p className="text-[11px] font-semibold text-amber-900 font-montserrat">
                        All-time iconic formulas & top creators
                      </p>

                      <div className="flex items-center gap-2 pt-1 font-montserrat">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[11px] font-bold text-stone-800 font-montserrat">Top voted looks</span>
                      </div>
                    </div>

                    {/* Trophy & Crown visual preview on right */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xs shrink-0 border-2 border-white bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center relative">
                      <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200" alt="Legends" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-amber-900/25 flex items-center justify-center">
                        <Crown className="w-7 h-7 text-amber-100 drop-shadow-md" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) {
                          onNavigate('hall-of-fame');
                        }
                      }}
                      className="px-4 py-1.5 bg-amber-900 hover:bg-black text-white text-xs font-bold font-montserrat rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="font-montserrat">Explore Legends</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* CARD D: "TIKTOK EFFECTS" (AR TikTok Filter) */}
                <div 
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('tiktok-effects');
                    }
                  }}
                  className="relative overflow-hidden bg-gradient-to-br from-[#f0fdfa] via-[#fdf2f8] to-[#faf5ff] rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_25px_rgba(236,72,153,0.06)] text-left cursor-pointer hover:shadow-md transition-all duration-300 group min-h-[170px] font-montserrat"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 z-10 font-montserrat">
                      <div className="text-[10px] font-black uppercase text-[#ff2d55] tracking-wider flex items-center gap-1.5 font-montserrat">
                        <Video className="w-3.5 h-3.5 text-[#ff2d55]" />
                        <span className="font-montserrat font-bold">TikTok Effects</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-montserrat font-black text-stone-900 leading-snug">
                        Viral AR Beauty Filters
                      </h3>
                      <p className="text-[11px] font-semibold text-pink-600 font-montserrat">
                        Real-time face shaders & trending filters
                      </p>

                      <div className="flex items-center gap-2 pt-1 font-montserrat">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="Avatar" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[11px] font-bold text-stone-600 font-montserrat">48.2K creators using</span>
                      </div>
                    </div>

                    {/* TikTok FX preview on right */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xs shrink-0 border-2 border-white relative">
                      <img src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=200" alt="TikTok FX" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-white/95 flex items-center justify-center text-[#ff2d55] shadow-sm">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) {
                          onNavigate('tiktok-effects');
                        }
                      }}
                      className="px-4 py-1.5 bg-[#ff2d55] hover:bg-[#e0264b] text-white text-xs font-bold font-montserrat rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="font-montserrat">Explore TikTok Effects</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* SEARCH RESULTS ON FOR YOU TAB */}
              {searchQuery.trim() !== '' && (
                <div className="space-y-4 pt-4 border-t border-stone-200/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider text-left">
                      Search Results ({filteredSubmissions.length})
                    </h4>
                  </div>

                  {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center text-stone-400 space-y-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff4e7e]" />
                      <span className="text-xs font-bold">Loading submissions...</span>
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-stone-300 rounded-2xl bg-white/50 text-stone-400 space-y-2">
                      <p className="text-sm font-bold">No looks found matching your search.</p>
                      <p className="text-xs">Try clearing the search query or selecting a different category.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredSubmissions.map((sub, index) => {
                        const hasVoted = votedSubIds.includes(sub.id);
                        const coverImage = getCoverImage(sub.lookName, index);

                        return (
                          <div
                            key={sub.id}
                            onClick={() => setSelectedReelSub(sub)}
                            className="group relative bg-white/70 backdrop-blur-md border border-stone-200/80 hover:bg-white hover:border-[#ff4e7e]/40 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between shadow-xs cursor-pointer overflow-hidden"
                          >
                            <div className="relative h-48 w-full overflow-hidden border-b border-stone-100">
                              <img 
                                src={coverImage} 
                                alt={sub.lookName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              
                              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-stone-900 shadow-xs">
                                @{sub.username}
                              </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-1 text-left">
                                <h4 className="font-display font-black text-stone-900 text-sm group-hover:text-[#ff4e7e] transition-colors leading-snug">
                                  {sub.lookName}
                                </h4>
                                <p className="text-xs text-stone-600 leading-relaxed font-medium line-clamp-2">
                                  {sub.description || 'A beautiful customized formula designed for the TryON Beauty community.'}
                                </p>
                              </div>

                              <div className="flex items-center justify-between border-t border-stone-100 pt-3 gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); loadIntoSandbox(sub); }}
                                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Sparkles className="w-3 h-3 text-[#ff4e7e]" />
                                  <span>Try On</span>
                                </button>

                                <button
                                  onClick={(e) => { e.stopPropagation(); handleVote(sub.id); }}
                                  disabled={hasVoted}
                                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                                    hasVoted
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                      : 'bg-[#ff4e7e] hover:bg-[#ff3b6f] text-white shadow-xs cursor-pointer'
                                  }`}
                                >
                                  <Heart className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
                                  <span>{sub.votes}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* OTHER CATEGORIES: 'new', 'following', 'holographic', 'warm-glow', 'cool-cyber', 'vintage' */
            <div className="space-y-4 pt-2 border-t border-stone-200/60 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider text-left">
                  Category: {categoryFilter} ({filteredSubmissions.length})
                </h4>
              </div>

              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-stone-400 space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#ff4e7e]" />
                  <span className="text-xs font-bold">Loading submissions...</span>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-stone-300 rounded-2xl bg-white/50 text-stone-400 space-y-2">
                  <p className="text-sm font-bold">No looks found matching this category.</p>
                  <p className="text-xs">Try selecting a different category or clearing the filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSubmissions.map((sub, index) => {
                    const hasVoted = votedSubIds.includes(sub.id);
                    const coverImage = getCoverImage(sub.lookName, index);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedReelSub(sub)}
                        className="group relative bg-white/70 backdrop-blur-md border border-stone-200/80 hover:bg-white hover:border-[#ff4e7e]/40 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between shadow-xs cursor-pointer overflow-hidden"
                      >
                        <div className="relative h-48 w-full overflow-hidden border-b border-stone-100">
                          <img 
                            src={coverImage} 
                            alt={sub.lookName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          
                          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-stone-900 shadow-xs">
                            @{sub.username}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1 text-left">
                            <h4 className="font-display font-black text-stone-900 text-sm group-hover:text-[#ff4e7e] transition-colors leading-snug">
                              {sub.lookName}
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed font-medium line-clamp-2">
                              {sub.description || 'A beautiful customized formula designed for the TryON Beauty community.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-stone-100 pt-3 gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); loadIntoSandbox(sub); }}
                              className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Sparkles className="w-3 h-3 text-[#ff4e7e]" />
                              <span>Try On</span>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleVote(sub.id); }}
                              disabled={hasVoted}
                              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                                hasVoted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                  : 'bg-[#ff4e7e] hover:bg-[#ff3b6f] text-white shadow-xs cursor-pointer'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
                              <span>{sub.votes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* SUB-PAGE 2: INSPIRATION WALL */}
      {activeCommunityTab === 'inspiration' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* HORIZONTAL INSPIRATION CATEGORY PILLS (MATCHING LOOKS TAB UI DESIGN) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5 -mx-1 px-1">
            {[
              { id: 'all', label: 'All Moods' },
              { id: 'user-creations', label: 'User Creations' },
              { id: 'aspirational', label: 'Aspirational Moods' },
              { id: 'glass-skin', label: 'Glass Skin' },
              { id: 'latte-bronze', label: 'Latte Bronze' },
              { id: 'cherry-flush', label: 'Cherry Flush' },
              { id: 'clean-girl', label: 'Clean Girl' },
              { id: 'graphic-liner', label: 'Graphic Liner' },
              { id: 'lip-combos', label: 'Lip Combos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setInspirationCategory(tab.id)}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  inspirationCategory === tab.id
                    ? 'bg-white text-black border border-white shadow-[0_2px_8px_rgba(135,107,93,0.15)] ring-1 ring-[#876b5d]/10'
                    : 'bg-[#EFEAE4]/85 hover:bg-white text-[#876b5d] hover:text-black border border-[#D6C7BA]/70 shadow-2xs'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <InspirationWall 
            onLoadPreset={onTryOnSubmission} 
            onNavigate={onNavigate}
            embedded={true}
            openAddModalTrigger={inspirationOpenAddModalTrigger}
            externalSearchQuery={searchQuery}
            externalCategory={inspirationCategory}
            externalViewMode={inspirationViewMode}
            onCategoryChange={setInspirationCategory}
            onViewModeChange={setInspirationViewMode}
            onToggleReelsFeed={onToggleReelsFeed}
          />
        </div>
      )}

      {/* SUB-PAGE 3: REQUESTS / WANTED BOARD (HOUSES TRENDING DEMAND METRICS & LOOK PROPOSALS) */}
      {activeCommunityTab === 'requests' && (
        <div className="animate-in fade-in duration-300">
          <TrendingPage 
            externalSearchQuery={searchQuery}
            onSelectProposalForFeed={onSelectWantedFeed}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* SUB-PAGE 4: CHALLENGES & LEADERBOARD */}
      {activeCommunityTab === 'challenges' && (
        <div className="animate-in fade-in duration-300">
          <CommunityChallengesView 
            onLoadPreset={onTryOnSubmission} 
          />
        </div>
      )}

      {/* SUBMIT CHALLENGE LOOK MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative bg-white/95 backdrop-blur-md rounded-[20px] border border-white/80 p-5 w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left text-stone-800">
            <button 
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-sans font-black text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff4e7e]" /> Submit Challenge Look
              </h3>
              <p className="text-[10px] sm:text-xs text-stone-500 font-medium leading-normal">
                Fill out your look details to feature your creation in the interactive community feed!
              </p>
            </div>
            
            <form onSubmit={handleSubmitNewLook} className="space-y-3">
              {/* Username Input */}
              <div className="space-y-0.5">
                <label className="block text-[8px] font-bold uppercase text-stone-500 tracking-wider">Your Username</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[11px] text-stone-400 font-bold">@</span>
                  <input 
                    type="text" 
                    required
                    placeholder="makeup_guru"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full text-[11px] pl-6 pr-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff4e7e]/20 focus:border-[#ff4e7e]/40 font-semibold text-stone-800"
                  />
                </div>
              </div>

              {/* Look Name Input */}
              <div className="space-y-0.5">
                <label className="block text-[8px] font-bold uppercase text-stone-500 tracking-wider">Look Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Celestial Horizon"
                  value={newLookName}
                  onChange={(e) => setNewLookName(e.target.value)}
                  className="w-full text-[11px] px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff4e7e]/20 focus:border-[#ff4e7e]/40 font-semibold text-stone-800"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-0.5">
                <label className="block text-[8px] font-bold uppercase text-stone-500 tracking-wider">Formula Description</label>
                <textarea 
                  placeholder="Describe your styling techniques and vibe..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full text-[11px] px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff4e7e]/20 focus:border-[#ff4e7e]/40 font-semibold text-stone-800 resize-none"
                />
              </div>

              {/* Custom Color Selection Swatches */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-0.5">
                  <label className="block text-[8px] font-bold uppercase text-stone-500 tracking-wider">Eyeshadow</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="color" 
                      value={newEyeshadowColor}
                      onChange={(e) => setNewEyeshadowColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-stone-200 bg-white p-0.5 animate-pulse"
                    />
                    <span className="text-[8px] font-mono font-bold text-stone-500 uppercase">{newEyeshadowColor}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[8px] font-bold uppercase text-stone-500 tracking-wider">Lip Color</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="color" 
                      value={newLipColor}
                      onChange={(e) => setNewLipColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-stone-200 bg-white p-0.5"
                    />
                    <span className="text-[8px] font-mono font-bold text-stone-500 uppercase">{newLipColor}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[8px] font-bold uppercase text-stone-500 tracking-wider">Blush</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="color" 
                      value={newBlushColor}
                      onChange={(e) => setNewBlushColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-stone-200 bg-white p-0.5"
                    />
                    <span className="text-[8px] font-mono font-bold text-stone-500 uppercase">{newBlushColor}</span>
                  </div>
                </div>
              </div>

              {/* Style & Lashes settings */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="space-y-0.5">
                  <label className="block text-[8px] font-bold uppercase text-stone-500 tracking-wider">Style Category</label>
                  <select 
                    value={newSelectedFilter}
                    onChange={(e) => setNewSelectedFilter(e.target.value)}
                    className="w-full text-[10px] font-bold bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-700 focus:outline-none"
                  >
                    <option value="holographic">Holographic</option>
                    <option value="cool-cyber">Cool Cyber</option>
                    <option value="warm-glow">Warm Glow</option>
                    <option value="vintage">Vintage</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[8px] font-bold uppercase text-stone-500 tracking-wider">Lashes Style</label>
                  <select 
                    value={newLashesStyle}
                    onChange={(e) => setNewLashesStyle(e.target.value)}
                    className="w-full text-[10px] font-bold bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-700 focus:outline-none"
                  >
                    <option value="natural">Natural</option>
                    <option value="wispy">Wispy</option>
                    <option value="glam">Glam</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-1.5 border border-stone-200 rounded-lg text-[9px] font-bold text-stone-600 uppercase hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPublishing}
                  className="flex-1 py-1.5 bg-gradient-to-r from-[#ff4e7e] to-[#ff7a50] text-white rounded-lg text-[9px] font-black tracking-wider uppercase transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Look</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMMERSIVE INSTAGRAM REELS-STYLE VIEWPORT OVERLAY */}
      {selectedReelSub && (() => {
        const hasVoted = votedSubIds.includes(selectedReelSub.id);
        const matchLook = galleryLooks.find(l => l.id === selectedReelSub.id || l.name === selectedReelSub.lookName);
        const isReelLocked = ((matchLook?.isLocked ?? selectedReelSub.isLocked) || selectedReelSub.tier === 'pro' || matchLook?.tier === 'pro') && !isProUser;
        const subIndex = activeFeedList.findIndex(s => s.id === selectedReelSub.id || s.lookName === selectedReelSub.lookName);
        const coverImage = matchLook?.image || getCoverImage(selectedReelSub.lookName, subIndex >= 0 ? subIndex : 0);

        return (
          <div className="fixed inset-0 z-50 flex flex-col md:flex-row items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            
            {/* Desktop Side Chevron Navigation Controls (Left of Smartphone Frame) */}
            <div className="hidden md:flex flex-col gap-4 mr-6 z-10">
              <button 
                onClick={handlePrevReel}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all"
                title="Previous Reel (Arrow Up or Scroll Up)"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <div className="text-center text-stone-500 text-[9px] font-black uppercase tracking-wider select-none">
                Feed
              </div>
              <button 
                onClick={handleNextReel}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all"
                title="Next Reel (Arrow Down or Scroll Down)"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            {/* Reels Smartphone Frame Container */}
            <div className="relative w-full h-full sm:max-h-[85vh] sm:max-w-[400px] sm:aspect-[9/16] bg-stone-950 overflow-hidden sm:rounded-[32px] sm:border-4 sm:border-stone-800 sm:shadow-2xl flex flex-col justify-between animate-in zoom-in-95 duration-200">
              
              {/* Cover Image Background (9:16 portrait style) */}
              <img 
                src={coverImage} 
                alt={selectedReelSub.lookName}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              
              {/* Vignettes for crisp text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 z-1" />

              {/* 1. TOP HEADER NAVIGATION - INSTAGRAM REELS STYLE BACK BUTTON & PRO BADGE */}
              <div className="relative z-10 flex items-center justify-between p-4 text-white">
                <button 
                  onClick={() => setSelectedReelSub(null)}
                  className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md transition-all cursor-pointer text-white flex items-center justify-center shadow-lg active:scale-90"
                  title="Back to Gallery"
                  aria-label="Back to Gallery"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {isReelLocked && (
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[10px] font-black tracking-wider uppercase text-white flex items-center gap-1.5 shadow-lg border border-amber-300/40">
                    <Lock className="w-3 h-3 stroke-[2.5]" />
                    <span>VIP PRO LOOK</span>
                  </span>
                )}
              </div>

              {/* Spacing inside center */}
              <div className="flex-1" />

              {/* 2. REELS ROW: SIDEBAR ACTIONS + BOTTOM INFORMATION PANEL */}
              <div className="relative z-10 flex items-end justify-between p-4 pb-5 gap-3">
                
                {/* A. BOTTOM INFO OVERLAY (LEFT SIDE) - MOVED UP WITH PADDING */}
                <div className="flex-1 space-y-2.5 text-left text-white drop-shadow-md pb-1">
                  
                  {/* Creator Profile */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-stone-900 border border-pink-500 rounded-full flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm">
                      {selectedReelSub.username.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-black tracking-wide text-white">@{selectedReelSub.username}</span>
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full ml-1.5 animate-ping" />
                    </div>
                  </div>

                  {/* Look Name and Caption */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-display font-black tracking-wide uppercase leading-tight text-white drop-shadow-md">
                        {selectedReelSub.lookName}
                      </h3>
                      {isReelLocked && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[9px] font-black tracking-wider uppercase text-white flex items-center gap-1 shadow-md border border-amber-300/40">
                          <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>PRO</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-white/90 leading-relaxed font-semibold line-clamp-3">
                      {selectedReelSub.description || 'A stunning custom beauty formulation curated for the Look LAB community.'}
                    </p>
                  </div>

                  {/* Dynamic Color Palette Swatch Badges */}
                  <div className="flex flex-col gap-1 pt-1 bg-black/30 p-2 rounded-xl border border-white/10 backdrop-blur-xs">
                    <span className="text-[7px] font-black uppercase text-stone-300 tracking-wider">Formula Color Recipe</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[8px] font-extrabold">
                        <span style={{ backgroundColor: selectedReelSub.makeupConfig.eyeshadowColor }} className="w-3.5 h-3.5 rounded-full border border-white/30 block shadow-xs" />
                        <span className="text-white/85">Eyeshadow</span>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-extrabold">
                        <span style={{ backgroundColor: selectedReelSub.makeupConfig.lipColor }} className="w-3.5 h-3.5 rounded-full border border-white/30 block shadow-xs" />
                        <span className="text-white/85">Lips</span>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-extrabold">
                        <span style={{ backgroundColor: selectedReelSub.makeupConfig.blushColor }} className="w-3.5 h-3.5 rounded-full border border-white/30 block shadow-xs" />
                        <span className="text-white/85">Blush</span>
                      </div>
                    </div>
                  </div>

                  {/* Lashes and Filter Badges */}
                  <div className="flex flex-wrap gap-1">
                    {selectedReelSub.makeupConfig.selectedFilter && selectedReelSub.makeupConfig.selectedFilter !== 'none' && (
                      <span className="bg-white/15 border border-white/20 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                        🎬 {selectedReelSub.makeupConfig.selectedFilter}
                      </span>
                    )}
                    {selectedReelSub.makeupConfig.glitterLevel > 0 && (
                      <span className="bg-white/15 border border-white/20 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                        ✨ Glitter {selectedReelSub.makeupConfig.glitterLevel}%
                      </span>
                    )}
                    <span className="bg-white/15 border border-white/20 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                      Lashes: {selectedReelSub.makeupConfig.lashesStyle}
                    </span>
                  </div>

                </div>

                {/* B. INSTAGRAM REELS FLOATING RIGHT SIDEBAR + BOTTOM RIGHT NAVIGATION BUTTONS */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  
                  {/* Heart / Vote Action */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleVote(selectedReelSub.id)}
                      disabled={hasVoted}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 shadow-md cursor-pointer ${
                        hasVoted
                          ? 'bg-[#ff4e7e] border-[#ff4e7e] text-white animate-pulse'
                          : 'bg-white/10 hover:bg-white/25 border-white/20 text-white hover:scale-110 active:scale-95'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${hasVoted ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-[10px] font-black text-white mt-1 drop-shadow-xs">
                      {hasVoted ? 'Voted' : selectedReelSub.votes}
                    </span>
                  </div>

                  {/* Try / Unlock Look Action */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        const targetLook = galleryLooks.find(l => l.id === selectedReelSub.id || l.name === selectedReelSub.lookName);
                        if (targetLook) {
                          handleTryOnLook(targetLook);
                        } else {
                          handleTryOnLook(selectedReelSub);
                        }
                        if (!isReelLocked) {
                          setSelectedReelSub(null);
                        }
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all ${
                        isReelLocked
                          ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-stone-950 border-amber-300 shadow-amber-500/20'
                          : 'bg-white text-stone-950 hover:bg-stone-100 border-white/10'
                      }`}
                      title={isReelLocked ? 'Unlock PRO Look' : 'Try Look'}
                    >
                      {isReelLocked ? (
                        <Lock className="w-5 h-5 text-stone-950 stroke-[2.5]" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-[#ff4e7e]" />
                      )}
                    </button>
                    <span className="text-[10px] font-black text-white mt-1 drop-shadow-xs uppercase tracking-wider">
                      {isReelLocked ? 'Unlock' : 'Try'}
                    </span>
                  </div>

                  {/* Share Action */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        // Simulated share and copy recipe link
                        navigator.clipboard.writeText(`TryON Beauty: Check out ${selectedReelSub.lookName} by @${selectedReelSub.username}!`);
                        setShowShareToast(true);
                        setTimeout(() => setShowShareToast(false), 2500);
                      }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-black text-white mt-1 drop-shadow-xs">Share</span>
                  </div>

                  {/* UP AND DOWN BUTTONS PLACED SIDE BY SIDE IN BOTTOM RIGHT CORNER */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xl mt-1 z-30"
                  >
                    <button
                      type="button"
                      onClick={(e) => handlePrevReel(e)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 active:bg-white/50 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-sm select-none"
                      title="Previous Look"
                      aria-label="Previous Look"
                    >
                      <ChevronUp className="w-4 h-4 pointer-events-none" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleNextReel(e)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 active:bg-white/50 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-sm select-none"
                      title="Next Look"
                      aria-label="Next Look"
                    >
                      <ChevronDown className="w-4 h-4 pointer-events-none" />
                    </button>
                  </div>

                </div>

              </div>

            </div>

            {/* Simulated Recipe Copied Toast */}
            {showShareToast && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-55 bg-stone-900 border border-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff4e7e]" />
                <span>Cosmetic recipe sharing link copied!</span>
              </div>
            )}
          </div>
        );
      })()}
      </div>

      {/* VIP Pro Paywall Modal for Locked 5 Looks */}
      <ProPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUnlocked={() => {
          setIsProUser(true);
          if (pendingPresetAfterUnlock) {
            onTryOnSubmission(pendingPresetAfterUnlock);
            setPendingPresetAfterUnlock(null);
          }
        }}
        featureName={paywallTriggerLook?.name}
        lookImage={paywallTriggerLook?.image}
        lookTagline={paywallTriggerLook?.tagline}
        categoryLabel={paywallTriggerLook?.categoryLabel}
      />
    </div>
  );
};
