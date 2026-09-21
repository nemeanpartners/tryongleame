import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowUpRight,
  Crown, 
  GalleryHorizontal, 
  Heart, 
  MessageSquare, 
  Sparkles, 
  Sparkle,
  Trophy, 
  Eye, 
  Video, 
  ExternalLink,
  Palette,
  Compass,
  Flame,
  Layers,
  Check,
  Bookmark,
  ScanFace,
  Blend,
  Users,
  ChevronRight
} from 'lucide-react';
import { auth } from '../../firebase';
import { saveLookToAccount, removeLookFromAccount } from '../../lib/nativeLooks';
import { SignatureLipsBoard } from './SignatureLipsBoard';

/** The hero look's picture, shared by the card and the saved copy. */
const HERO_LOOK_IMAGE =
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=85&w=1200';
import { PresetLook, ShadeProduct } from '../../types';
import { FEATURED_EXPLORE_SHADE_PRODUCTS } from '../../data/shadeProducts';
import { ShadeInterestModal } from '../shade-edit/ShadeInterestModal';
import { PopularChallengeCard } from '../common/PopularChallengeCard';
import { DailySeriesFeature } from './DailySeriesFeature';
import { SpinWheelSurpriseSection } from './SpinWheelSurpriseSection';
import { RecommendationsAndSavedSection } from './RecommendationsAndSavedSection';
import { TryOnEditWeeklyCard } from './TryOnEditWeeklyCard';
import { PostSaveDiscoverModal } from '../common/PostSaveDiscoverModal';

interface HomepageProps {
  onNavigate: (tab: any, extra?: any) => void;
  onLoadPreset?: (preset: PresetLook) => void;
  username?: string;
}

// 1. HERO PRESET: Golden Hour Velvet
const GOLDEN_HOUR_VELVET_PRESET: PresetLook = {
  id: 'golden_hour_velvet',
  name: 'Golden Hour Velvet',
  description: 'Soft gold eyes • nude gloss • warm blush',
  eyeshadowColor: '#d97706',
  eyeshadowOpacity: 0.75,
  eyelinerColor: '#78350f',
  eyelinerOpacity: 0.6,
  blushColor: '#e0836b',
  blushOpacity: 0.5,
  lipColor: '#b86b58',
  lipOpacity: 0.85,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 55,
  filter: 'warm-glow',
};

// 2. TRENDING RIGHT NOW PRESETS: Cherry Cola, Espresso, Pink Glaze
const CHERRY_COLA_PRESET: PresetLook = {
  id: 'cherry_cola_trending',
  name: 'Cherry Cola',
  description: 'Deep maroon high-shine lip lacquer, glazed blush & bronze wing',
  eyeshadowColor: '#7f1d1d',
  eyeshadowOpacity: 0.65,
  eyelinerColor: '#450a0a',
  eyelinerOpacity: 0.85,
  eyelinerStyle: 'winged',
  blushColor: '#be123c',
  blushOpacity: 0.55,
  lipColor: '#581c87',
  lipOpacity: 0.95,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 45,
  filter: 'warm-glow',
};

const ESPRESSO_PRESET: PresetLook = {
  id: 'espresso_trending',
  name: 'Espresso',
  description: 'Roasted cocoa lids, terracotta sculpted contour & satin mocha pout',
  eyeshadowColor: '#451a03',
  eyeshadowOpacity: 0.8,
  eyelinerColor: '#291003',
  eyelinerOpacity: 0.95,
  eyelinerStyle: 'cat-eye',
  blushColor: '#9a3412',
  blushOpacity: 0.45,
  lipColor: '#78350f',
  lipOpacity: 0.9,
  lipGloss: false,
  lashesStyle: 'glam',
  glitterLevel: 25,
  filter: 'warm-glow',
};

const PINK_GLAZE_PRESET: PresetLook = {
  id: 'pink_glaze_trending',
  name: 'Pink Glaze',
  description: 'Frosty lilac pastel wash, candy blush & ultra-high shine gloss',
  eyeshadowColor: '#f472b6',
  eyeshadowOpacity: 0.75,
  blushColor: '#ec4899',
  blushOpacity: 0.6,
  lipColor: '#db2777',
  lipOpacity: 0.85,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 70,
  filter: 'holographic',
};

// 3. MOOD PRESETS & VIBES
const MOOD_OPTIONS = [
  {
    id: 'soft-glam',
    label: 'Soft Glam',
    shortVibe: 'Golden Shimmer',
    colorHex: '#D4AF37',
    icon: '✨',
  },
  {
    id: '90s-nude',
    label: '90s Nude',
    shortVibe: 'Matte Caramel',
    colorHex: '#8D6E63',
    icon: '🤎',
  },
  {
    id: 'going-out',
    label: 'Going Out',
    shortVibe: 'Smoky Feline',
    colorHex: '#881337',
    icon: '🍸',
  },
  {
    id: 'clean',
    label: 'Clean',
    shortVibe: 'Glazed Dew',
    colorHex: '#F472B6',
    icon: '🌸',
  },
  {
    id: 'soft-grunge',
    label: 'Soft Grunge',
    shortVibe: 'Smudged Kohl',
    colorHex: '#4A3E3D',
    icon: '🖤',
  },
  {
    id: 'bronzed',
    label: 'Bronzed',
    shortVibe: 'Warm Amber',
    colorHex: '#D97706',
    icon: '☀️',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    shortVibe: 'Petal Flush',
    colorHex: '#BE123C',
    icon: '🌹',
  },
  {
    id: 'experimental',
    label: 'Experimental',
    shortVibe: 'Chrome Shift',
    colorHex: '#9333EA',
    icon: '⚡',
  }
];

const MIX_MATCH_PRESET: PresetLook = {
  id: 'sunset_silk',
  name: 'Golden Hour Silk',
  description: 'Our top-rated customized community blend. A warm, romantic sunset glow featuring rich coppery eyeshadow, vibrant rose cheeks, and a deep velvet plum lip glaze, set against our signature Golden Hour filter.',
  eyeshadowColor: '#d97706',
  eyeshadowOpacity: 0.75,
  blushColor: '#B8887A',
  blushOpacity: 0.55,
  lipColor: '#f43f5e',
  lipOpacity: 0.8,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 75,
  filter: 'warm-glow',
};

const NOIR_GLAMOUR_PRESET: PresetLook = {
  id: 'noir_glamour',
  name: 'Noir Glamour',
  description: 'A sophisticated red carpet aesthetic featuring smoky contouring, high-definition cat-eye lashes, and velvet berry lips.',
  eyeshadowColor: '#3b2f2f',
  eyeshadowOpacity: 0.8,
  eyelinerColor: '#000000',
  eyelinerOpacity: 0.95,
  eyelinerStyle: 'cat-eye',
  blushColor: '#9f1239',
  blushOpacity: 0.5,
  lipColor: '#881337',
  lipOpacity: 0.9,
  lipGloss: false,
  lashesStyle: 'glam',
  glitterLevel: 30,
  filter: 'none',
};

const ROSE_QUARTZ_PRESET: PresetLook = {
  id: 'rose_quartz',
  name: 'Dewy Rose Quartz',
  description: 'A clean-girl aesthetic highlighting a fresh, glassy rosewater sheen on the cheeks paired with a sheer, soft-pink collagen lip balm and ultra-natural curled lashes.',
  eyeshadowColor: '#fbcfe8',
  eyeshadowOpacity: 0.6,
  blushColor: '#fda4af',
  blushOpacity: 0.5,
  lipColor: '#f472b6',
  lipOpacity: 0.75,
  lipGloss: true,
  lashesStyle: 'natural',
  glitterLevel: 45,
  filter: 'vintage',
};

const GLOSS_ETHEREAL_PRESET: PresetLook = {
  id: 'gloss_ethereal',
  name: 'Ethereal Glaze',
  description: 'Ultra-luminous dewy skin pairing a crystal champagne shadow wash with a mirror-shine peach gloss.',
  eyeshadowColor: '#fef3c7',
  eyeshadowOpacity: 0.7,
  blushColor: '#fb923c',
  blushOpacity: 0.45,
  lipColor: '#f97316',
  lipOpacity: 0.7,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 80,
  filter: 'warm-glow',
};

const GLASS_NUDE_PRESET: PresetLook = {
  id: 'glass_nude_lips',
  name: 'Glass Nude Lips',
  description: 'Ultra-reflective glassy nude lip gloss with a subtle contour liner and fresh glowing skin.',
  eyeshadowColor: '#d6c7b2',
  eyeshadowOpacity: 0.4,
  eyelinerColor: '#7c5e4e',
  eyelinerOpacity: 0.6,
  blushColor: '#e8b4a2',
  blushOpacity: 0.35,
  lipColor: '#c88a7c',
  lipOpacity: 0.8,
  lipGloss: true,
  lashesStyle: 'natural',
  glitterLevel: 25,
  filter: 'warm-glow',
};

const CHERRY_FLUSH_PRESET: PresetLook = {
  id: 'cherry_flush',
  name: 'Cherry Flush',
  description: 'Vibrant cherry stained lips with high-pigment flushed doll cheeks and fluttery lashes.',
  eyeshadowColor: '#fecdd3',
  eyeshadowOpacity: 0.5,
  blushColor: '#f43f5e',
  blushOpacity: 0.65,
  lipColor: '#e11d48',
  lipOpacity: 0.9,
  lipGloss: true,
  lashesStyle: 'wispy',
  glitterLevel: 30,
  filter: 'none',
};

const SOFT_BRONZE_PRESET: PresetLook = {
  id: 'soft_bronze_smoke',
  name: 'Soft Bronze Smoke',
  description: 'Warm cocoa bronze eyeshadow melt with a diffused winged flick and velvet nude lips.',
  eyeshadowColor: '#926247',
  eyeshadowOpacity: 0.8,
  eyelinerColor: '#3d251e',
  eyelinerOpacity: 0.9,
  eyelinerStyle: 'cat-eye',
  blushColor: '#c27d58',
  blushOpacity: 0.45,
  lipColor: '#a16550',
  lipOpacity: 0.85,
  lipGloss: false,
  lashesStyle: 'glam',
  glitterLevel: 40,
  filter: 'vintage',
};

const CLEAN_GIRL_PRESET: PresetLook = {
  id: 'clean_girl_glow',
  name: 'Clean Girl Glow',
  description: 'Minimalist glazed skin finish, lifted sculpted brows, feathered natural lashes, and soft rose balm.',
  eyeshadowColor: '#fdf2e9',
  eyeshadowOpacity: 0.3,
  blushColor: '#fbb6ce',
  blushOpacity: 0.3,
  lipColor: '#f472b6',
  lipOpacity: 0.6,
  lipGloss: true,
  lashesStyle: 'natural',
  glitterLevel: 15,
  filter: 'none',
};

interface FeelingItem {
  phrase: string;
  color: string;
}

const FEELING_ITEMS: FeelingItem[] = [
  { phrase: 'a berry tint', color: '#9f1239' },          // Deep Berry Crimson
  { phrase: 'a brown lip', color: '#78350f' },           // Warm Cocoa Brown
  { phrase: 'something glossy', color: '#db2777' },      // Juicy Gloss Rose
  { phrase: 'mac grunge', color: '#4a2828' },            // Velvet 90s Espresso Plum
  { phrase: 'clean summer glow', color: '#d97706' },     // Golden Amber Bronze
  { phrase: 'a siren eye', color: '#1e1b4b' },           // Midnight Smoked Onyx
  { phrase: 'soft girl glam', color: '#ec4899' },        // Pastel Blossom Pink
  { phrase: 'cherry cola lips', color: '#881337' },      // Deep Cherry Cola
  { phrase: 'dewy glass skin', color: '#0d9488' },       // Luminous Dew Teal
  { phrase: 'a bronze smokey eye', color: '#92400e' },   // Roasted Bronze
  { phrase: 'festival makeup', color: '#9333ea' },       // Prismatic Violet Spark
  { phrase: 'bold graphic liner', color: '#0f172a' },    // Jet Black
  { phrase: 'golden hour glow', color: '#b45309' },      // Sunset Warm Gold
  { phrase: 'peach fuzz cheeks', color: '#ea580c' },     // Warm Peach Velvet
  { phrase: 'something new', color: '#be185d' },         // Vibrant Raspberry
];

export const Homepage: React.FC<HomepageProps> = ({ onNavigate, onLoadPreset, username }) => {
  const displayName = username?.trim() ? (username.trim().charAt(0).toUpperCase() + username.trim().slice(1)) : 'Bella';
  const [selectedShadeProduct, setSelectedShadeProduct] = useState<ShadeProduct | null>(null);
  const [isShadeModalOpen, setIsShadeModalOpen] = useState<boolean>(false);
  const [feelingIndex, setFeelingIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeelingIndex((prev) => (prev + 1) % FEELING_ITEMS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);
  const [isHeroSaved, setIsHeroSaved] = useState<boolean>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tryon_hero_saved_looks') || '[]');
      return saved.includes('golden_hour_velvet');
    } catch {
      return false;
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState<boolean>(false);
  const [savedLookNameForModal, setSavedLookNameForModal] = useState<string>('Golden Hour Velvet');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleTryOn = (preset: PresetLook) => {
    if (onLoadPreset) {
      onLoadPreset(preset);
    } else {
      onNavigate('built-looks');
    }
  };

  const handleToggleSaveHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !isHeroSaved;
    setIsHeroSaved(nextSaved);
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('tryon_hero_saved_looks') || '[]');
      const updated = nextSaved ? [...new Set([...saved, 'golden_hour_velvet'])] : saved.filter(id => id !== 'golden_hour_velvet');
      localStorage.setItem('tryon_hero_saved_looks', JSON.stringify(updated));

      // Also persist to favorites & personal looks list so it is in My Looks
      const favsStr = localStorage.getItem('tryon_favourites');
      const favs: string[] = favsStr ? JSON.parse(favsStr) : [];
      const updatedFavs = nextSaved ? [...new Set([...favs, 'golden_hour_velvet'])] : favs.filter(id => id !== 'golden_hour_velvet');
      localStorage.setItem('tryon_favourites', JSON.stringify(updatedFavs));

      const myLooksStr = localStorage.getItem('tryon_saved_looks');
      const myLooks: any[] = myLooksStr ? JSON.parse(myLooksStr) : [];
      if (nextSaved) {
        if (!myLooks.some(item => item.id === 'golden_hour_velvet')) {
          myLooks.unshift({
            id: 'golden_hour_velvet',
            name: 'Golden Hour Velvet',
            description: 'Soft gold eyes • nude gloss • warm blush',
            eyeshadowColor: '#d4af37',
            eyeshadowOpacity: 0.65,
            eyelinerColor: '#3a2518',
            eyelinerOpacity: 0.75,
            eyelinerStyle: 'cat-eye',
            blushColor: '#e07a5f',
            blushOpacity: 0.45,
            lipColor: '#a75d5d',
            lipOpacity: 0.8,
            lipGloss: true,
            lashesStyle: 'natural',
            glitterLevel: 15,
            filter: 'none',
            createdAt: Date.now()
          });
          localStorage.setItem('tryon_saved_looks', JSON.stringify(myLooks));
        }
      }
    } catch (err) {
      console.error(err);
    }

    // The account copy is what the Saved page in Settings reads, so the look
    // follows the user rather than staying in this browser.
    if (auth.currentUser) {
      const request = nextSaved
        ? saveLookToAccount(
            {
              id: 'golden_hour_velvet',
              name: 'Golden Hour Velvet',
              description: 'Soft gold eyes • nude gloss • warm blush',
              image: HERO_LOOK_IMAGE,
              eyeshadowColor: '#d4af37',
              eyelinerColor: '#3a2518',
              blushColor: '#e07a5f',
              lipColor: '#a75d5d',
              lipGloss: true,
              lashesStyle: 'natural',
              glitterLevel: 15
            },
            'home'
          )
        : removeLookFromAccount('golden_hour_velvet');
      request.catch((err) => console.error('Could not sync the saved look:', err));
    }

    if (nextSaved) {
      setSavedLookNameForModal('Golden Hour Velvet');
      setIsPostSaveModalOpen(true);
    } else {
      showToast('Removed from saved collection');
    }
  };

  const handleOpenShadeProduct = (product: ShadeProduct) => {
    setSelectedShadeProduct(product);
    setIsShadeModalOpen(true);
  };

  const handleSelectMood = (moodLabel: string) => {
    onNavigate('gallery', { mood: moodLabel });
  };

  return (
    <div id="homepage-container" className="relative space-y-9 animate-in fade-in duration-500 text-stone-900 pb-20 w-full max-w-5xl mx-auto">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#2A1715] text-white text-xs font-bold shadow-xl border border-white/20 flex items-center gap-2 pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F7C6D7]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GREETING HEADER */}
      <section className="text-left pt-1 sm:pt-2 space-y-3">
        <div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-inter font-[800] font-extrabold tracking-[-0.03em] text-[#1F1412] leading-[1.06] max-w-2xl">
            What are we<br />trying on today?
          </h2>
          <p className="text-sm sm:text-base text-[#7A5E54] font-inter font-[500] font-medium tracking-normal mt-1.5 sm:mt-2">
            Try it on, with TryOn.
          </p>
        </div>

        {/* CYCLING INSPIRATION TITLE (3D Raised Tactile Typography, Dynamic Color, Inter ExtraBold 800) */}
        <div className="pt-1 pb-1">
          <div className="text-xl sm:text-2xl md:text-3xl font-inter font-[500] font-medium text-stone-800 tracking-tight select-none flex items-baseline gap-2 sm:gap-2.5 whitespace-nowrap overflow-visible flex-nowrap">
            <span className="shrink-0 text-stone-700 font-inter font-[500] font-medium">I’m feeling</span>
            <div className="relative inline-flex items-baseline overflow-visible py-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.span
                  key={FEELING_ITEMS[feelingIndex].phrase}
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{
                    color: FEELING_ITEMS[feelingIndex].color,
                    textShadow: `
                      -0.5px -0.5px 0.5px rgba(255, 255, 255, 0.9),
                      0 1px 0 rgba(175, 168, 160, 0.42),
                      0 2px 0 rgba(160, 152, 144, 0.32),
                      0 3px 1px rgba(150, 142, 134, 0.2),
                      0 4px 5px rgba(140, 132, 124, 0.14),
                      0 6px 12px rgba(130, 122, 114, 0.08)
                    `
                  }}
                  className="text-raised-3d text-xl sm:text-2xl md:text-3xl whitespace-nowrap inline-block lowercase font-inter font-[800] font-extrabold"
                >
                  {FEELING_ITEMS[feelingIndex].phrase}.
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. FIRST SCREEN: IMMEDIATE TEMPTATION (FOR YOU - GOLDEN HOUR VELVET)     */}
      {/* ========================================================================= */}
      <section id="hero-immediate-temptation" className="text-left">
        <div 
          onClick={() => handleTryOn(GOLDEN_HOUR_VELVET_PRESET)}
          className="group relative w-full min-h-[340px] sm:min-h-[380px] md:min-h-[420px] rounded-[32px] overflow-hidden border border-[#EDE7E3] shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col justify-end p-6 sm:p-8 md:p-10 text-left bg-stone-900"
        >
          {/* Big Beautiful Editorial Makeup Look Photo */}
          <img 
            src={HERO_LOOK_IMAGE} 
            alt="Golden Hour Velvet Makeup Look" 
            className="absolute inset-0 w-full h-full object-cover object-[70%_25%] transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          
          {/* Cinematic warm gradient overlay for high contrast legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F100E]/95 via-[#1F100E]/45 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1F100E]/80 via-transparent to-transparent pointer-events-none hidden sm:block" />

          {/* Hero Content Left Aligned */}
          <div className="relative z-10 space-y-3.5 max-w-lg">
            
            {/* Top EYEBROW TAG: FOR YOU */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#2A1715] text-[10.5px] font-inter font-[700] uppercase tracking-[0.16em] border border-white/40 shadow-xs flex items-center gap-1.5">
                <Sparkle className="w-2.5 h-2.5 fill-[#E91E63] text-[#E91E63]" />
                <span>FOR YOU</span>
              </span>
            </div>

            {/* Big Beautiful Makeup Look Title */}
            <div className="space-y-1">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight font-sans drop-shadow-sm">
                Golden Hour Velvet
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium tracking-wide">
                Soft gold eyes • nude gloss • warm blush
              </p>
            </div>

            {/* Actions Row: One Primary Behavior TRY + One Tiny Secondary Action ♡ Save */}
            <div className="flex items-center gap-2.5 pt-1.5">
              
              {/* PRIMARY ACTION: TRY THIS LOOK (Matches Weekly Edit button UI) */}
              <button 
                id="btn-hero-try-look"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTryOn(GOLDEN_HOUR_VELVET_PRESET);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-full bg-[#f7f3f0] hover:bg-[#ede7e3] text-[#171515] text-xs sm:text-[13px] font-black uppercase tracking-[0.16em] transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer border border-white/80"
              >
                <span>TRY THIS LOOK</span>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#ff2f68] text-[#ff2f68] shrink-0">
                  <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>
                </svg>
              </button>

              {/* SECONDARY ACTION: ♡ Save (Compact, Less Fat, Beige Aesthetic) */}
              <button
                id="btn-hero-save-look"
                type="button"
                onClick={handleToggleSaveHero}
                className={`inline-flex items-center gap-1 px-3 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border shadow-xs ${
                  isHeroSaved 
                    ? 'bg-[#E5DDD4] text-[#2A1715] border-[#D0C5BA]' 
                    : 'bg-[#F2ECE4]/95 hover:bg-[#F2ECE4] text-[#2A1715] border-[#E0D7CE]'
                }`}
                title={isHeroSaved ? 'Saved to your collection' : 'Save to your collection'}
              >
                <Heart className={`w-3.5 h-3.5 ${isHeroSaved ? 'fill-[#E91E63] text-[#E91E63]' : 'text-[#2A1715]'}`} />
                <span>{isHeroSaved ? 'Saved' : 'Save'}</span>
              </button>

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DIRECTLY UNDERNEATH: “ONE MORE” (TRENDING RIGHT NOW - 3 CARDS)        */}
      {/* ========================================================================= */}
      <section id="trending-right-now" className="space-y-3.5 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-black tracking-tight">
              Trending right now
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Curated viral aesthetics ready for immediate live camera testing
            </p>
          </div>
          <button 
            onClick={() => onNavigate('built-looks')}
            className="text-xs font-bold text-[#E91E63] hover:text-[#c2185b] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Horizontal Cards: Cherry Cola, Espresso, Pink Glaze */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {[
            {
              id: 'trending-cherry-cola',
              preset: CHERRY_COLA_PRESET,
              title: 'Cherry Cola',
              vibe: 'Glossy cherry syrup • deep liner',
              image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
              accentHex: '#7f1d1d'
            },
            {
              id: 'trending-espresso',
              preset: ESPRESSO_PRESET,
              title: 'Espresso',
              vibe: 'Rich cocoa melt • satin mocha pout',
              image: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
              accentHex: '#451a03'
            },
            {
              id: 'trending-pink-glaze',
              preset: PINK_GLAZE_PRESET,
              title: 'Pink Glaze',
              vibe: 'Jelly pink lips • dewy glass skin',
              image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
              accentHex: '#ec4899'
            }
          ].map((item) => (
            <div 
              key={item.id}
              onClick={() => handleTryOn(item.preset)}
              className="group relative rounded-3xl overflow-hidden aspect-[16/11] sm:aspect-[4/5] border border-[#EDE7E3] bg-stone-900 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-end p-4 text-left"
            >
              {/* Card Photo */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

              {/* Content */}
              <div className="relative z-10 flex items-end justify-between gap-2">
                <div className="space-y-0.5 max-w-[70%]">
                  <h4 className="text-base sm:text-lg font-black text-white leading-tight font-sans">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-white/80 line-clamp-1 font-medium">
                    {item.vibe}
                  </p>
                </div>

                {/* Tiny TRY → Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTryOn(item.preset);
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-white hover:bg-[#F7F2EF] text-[#2A1715] text-[11px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md transition-all group-hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>TRY</span>
                  <ArrowRight className="w-3 h-3 text-[#E91E63]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION DIVIDER & WHAT'S YOUR MOOD (TACTILE NEUMORPHIC PILL UI)        */}
      {/* ========================================================================= */}
      <div className="pt-0.5">
        <div className="h-px bg-[#E8E2DC] w-full" />
      </div>

      <section id="whats-your-mood" className="space-y-3 text-left pt-0 -mt-1 sm:-mt-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
            What's your mood?
          </h3>
          <button
            onClick={() => onNavigate('gallery')}
            className="text-xs font-bold text-[#E91E63] hover:text-[#c2185b] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>Open Discover</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 8 Curated Mood Aesthetic Tactile Pills (Matching Image 2 UI) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleSelectMood(mood.label)}
              className="tactile-pill-btn group py-3 px-3.5 sm:px-4 rounded-full text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all duration-200 active:scale-95 font-inter"
            >
              <div className="flex items-center gap-1.5 justify-center">
                <span className="text-xs sm:text-sm">{mood.icon}</span>
                <span className="text-xs sm:text-[13px] font-inter font-[700] text-[#2D2422] tracking-wider uppercase group-hover:text-[#E91E63] transition-colors">
                  {mood.label}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-inter font-[500] text-stone-500 tracking-tight whitespace-nowrap">
                {mood.shortVibe}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ALL REMAINING HOMEPAGE CONTENT (PRESERVED IN PRISTINE ORDER)            */}
      {/* ========================================================================= */}

      {/* 4A. 7-DAY RECURRING WEEKLY SIGNATURE SERIES (TRY IT TUESDAY, SHADE BATTLE, ETC.) */}
      <DailySeriesFeature
        onTryOn={(preset) => handleTryOn(preset)}
        onNavigate={(tab) => onNavigate(tab as any)}
        username={username}
      />

      {/* 4A-1. DONT KNOW WHAT TO TRY? SUPRISE ME (8-LOOK SPIN THE WHEEL) */}
      <SpinWheelSurpriseSection
        onTryOn={(preset) => handleTryOn(preset)}
        onNavigate={(tab) => onNavigate(tab as any)}
      />

      {/* 4A-2. RECOMMENDATIONS & SAVED LOOKS ("BECAUSE YOU TRIED ESPRESSO" & "YOUR SAVED LOOKS") */}
      <div className="mb-10 sm:mb-12">
        <RecommendationsAndSavedSection
          onTryOn={(preset) => handleTryOn(preset)}
          onNavigate={(tab) => onNavigate(tab as any)}
        />
      </div>

      {/* 4B. THE TRYON EDIT : WEEKLY EDITION (CURATED WEEKLY CAPSULE & TREND FORECAST) */}
      <TryOnEditWeeklyCard
        onTryOn={(preset) => handleTryOn(preset)}
        onNavigate={(tab) => onNavigate(tab as any)}
        username={username}
      />

      {/* 4C. UNIFIED TRENDING NOW MASTER SECTION */}
      <section className="space-y-6 text-left">
        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-base sm:text-lg font-bold text-black uppercase tracking-wider">
              Trending Now
            </h3>
          </div>
          <button 
            onClick={() => onNavigate('built-looks')}
            className="text-xs font-bold text-[#E91E63] hover:text-[#c2185b] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Trending Now Looks Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
          {[
            {
              preset: NOIR_GLAMOUR_PRESET,
              styleCategory: 'Velvet Noir',
              likes: '1.2K',
              img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
            },
            {
              preset: ROSE_QUARTZ_PRESET,
              styleCategory: 'Rose Quartz',
              likes: '1.5K',
              img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
            },
            {
              preset: MIX_MATCH_PRESET,
              styleCategory: 'Golden Glam',
              likes: '892',
              img: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600',
            },
            {
              preset: GLOSS_ETHEREAL_PRESET,
              styleCategory: 'Clean Girl',
              likes: '1.1K',
              img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
            },
          ].map((item) => {
            const p = item.preset;
            return (
              <button
                key={p.id}
                onClick={() => handleTryOn(p)}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer text-left border border-[#EDE7E3] bg-stone-900 block w-full"
              >
                <img 
                  src={item.img} 
                  alt={p.name} 
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Likes pill top right */}
                <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-medium flex items-center gap-1 border border-white/10">
                  <span className="text-[#E91E63]">♥</span> {item.likes}
                </div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-3 z-10 flex flex-col items-start gap-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    {p.name}
                  </h4>
                  <span className="text-[9px] text-[#F7C6D7] font-inter font-[500] uppercase tracking-wider">
                    {item.styleCategory}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. Sub-Section: Trending This Week (with same UI style as Trending Now above) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-black uppercase tracking-[0.14em]">
              Trending This Week
            </h4>
            <button
              onClick={() => onNavigate('trending')}
              className="text-xs font-bold text-[#E91E63] hover:text-[#c2185b] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 group"
            >
              <span>Explore more</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
            {[
              {
                id: 'glass_nude_lips',
                name: 'Glass Nude Lips',
                styleCategory: 'Nude Gloss',
                likes: '2.1K',
                img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=600',
                preset: GLASS_NUDE_PRESET
              },
              {
                id: 'cherry_flush',
                name: 'Cherry Flush',
                styleCategory: 'Velvet Tint',
                likes: '1.8K',
                img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
                preset: CHERRY_FLUSH_PRESET
              },
              {
                id: 'soft_bronze_smoke',
                name: 'Soft Bronze Smoke',
                styleCategory: 'Bronze Glam',
                likes: '2.4K',
                img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
                preset: SOFT_BRONZE_PRESET
              },
              {
                id: 'clean_girl_glow',
                name: 'Clean Girl Glow',
                styleCategory: 'Dewy Finish',
                likes: '3.2K',
                img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
                preset: CLEAN_GIRL_PRESET
              }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleTryOn(item.preset)}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer text-left border border-[#EDE7E3] bg-stone-900 block w-full"
              >
                <img 
                  src={item.img} 
                  alt={item.name} 
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Likes pill top right */}
                <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-medium flex items-center gap-1 border border-white/10">
                  <span className="text-[#E91E63]">♥</span> {item.likes}
                </div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-3 z-10 flex flex-col items-start gap-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    {item.name}
                  </h4>
                  <span className="text-[9px] text-[#F7C6D7] font-inter font-[500] uppercase tracking-wider">
                    {item.styleCategory}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Sub-Section: Shade Edit (moved into Trending Now with small title, without white container) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-black uppercase tracking-[0.14em]">
              Shade Edit
            </h4>
            <button
              onClick={() => onNavigate('shade-edit')}
              className="text-xs font-bold text-[#E91E63] hover:text-[#c2185b] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 group"
            >
              <span>Explore all shades</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* 4 Individual Single Product Cards: Eyelashes, Lips, Lip Liner, Eyeliner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {FEATURED_EXPLORE_SHADE_PRODUCTS.map((product) => (
              <div 
                key={product.id}
                onClick={() => handleOpenShadeProduct(product)}
                className="group relative cursor-pointer space-y-2 text-left"
              >
                {/* Product Box Container */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F7F2EF] border border-[#EDE7E3] p-1 shadow-xs group-hover:shadow-md transition-all">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none rounded-xl" />

                  {/* Top Left Category Pill */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[8.5px] font-inter font-[700] text-white uppercase tracking-wider border border-white/10">
                      {product.categoryLabel}
                    </span>
                  </div>

                  {/* TOP RIGHT CORNER: TRY ON BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTryOn(product.presetConfig);
                    }}
                    className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] text-[9px] font-black uppercase tracking-wider shadow-xs border border-[#EBC9D6] flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                    title={`Try on ${product.name}`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[#2A1715] animate-pulse" />
                    <span>Try On</span>
                  </button>

                  {/* Bottom Swatch Pip */}
                  <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[9px] font-bold text-black shadow-xs truncate max-w-[80%]">
                      {product.shadeName}
                    </span>
                    {product.colorHex && (
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow-xs shrink-0" 
                        style={{ backgroundColor: product.colorHex }}
                      />
                    )}
                  </div>
                </div>

                {/* Product Info & Micro Demand Note */}
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-black group-hover:text-[#E91E63] transition-colors leading-tight line-clamp-1">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
                    <span className="truncate">{product.finish}</span>
                    <span className="text-[#E91E63] font-bold text-[9px] shrink-0 ml-1">
                      {product.currentInterests} votes
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4D. POPULAR CHALLENGE CARD */}
      <section>
        <PopularChallengeCard onEnter={() => onNavigate('votes')} />
      </section>

      {/* 4H. CORE PILLARS (TRY ON, CREATE, EXPLORE, CONNECT) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-left">
          <h3 className="text-sm sm:text-base font-inter font-bold text-black uppercase tracking-[0.16em]">
            Core Pillars
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('built-looks')}
            className="text-xs font-inter font-semibold uppercase tracking-wider text-stone-700 hover:text-black flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4.5">
          {[
            {
              num: '01',
              title: 'TRY ON',
              desc: 'Live makeup try-on with instant camera results.',
              icon: ScanFace,
              tab: 'built-looks' as const,
              action: 'TRY CATALOG',
              image: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&q=80&w=700'
            },
            {
              num: '02',
              title: 'CREATE',
              desc: 'Build custom looks with endless formula blends.',
              icon: Blend,
              tab: 'sandbox' as const,
              action: 'MIX & MATCH',
              image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=700'
            },
            {
              num: '03',
              title: 'EXPLORE',
              desc: 'Discover curated trends, styles and shades.',
              icon: Compass,
              tab: 'gallery' as const,
              action: 'VIEW GALLERY',
              image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=700'
            },
            {
              num: '04',
              title: 'CONNECT',
              desc: 'Join challenges, share, vote and get inspired.',
              icon: Users,
              tab: 'votes' as const,
              action: 'VOTE NOW',
              image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=700'
            }
          ].map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div 
                key={pillar.num}
                onClick={() => onNavigate(pillar.tab)}
                className="relative group overflow-hidden rounded-[26px] sm:rounded-[30px] border border-white/90 bg-[#f9f5f1]/90 backdrop-blur-md p-5 sm:p-6 flex flex-col justify-between min-h-[195px] sm:min-h-[210px] text-left cursor-pointer transition-all duration-300 shadow-[0_10px_26px_rgba(72,57,49,0.06),0_2px_6px_rgba(72,57,49,0.03)] hover:shadow-[0_16px_34px_rgba(72,57,49,0.11)] hover:border-white select-none"
              >
                {/* Right Side Background Image with Smooth Frosted Dissolve */}
                <div className="absolute right-0 top-0 bottom-0 w-[55%] sm:w-[50%] overflow-hidden pointer-events-none">
                  <img
                    src={pillar.image}
                    alt={pillar.title}
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  {/* Soft Frosted Dissolve Gradient from Left to Right */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#f9f5f1] via-[#f9f5f1]/80 via-35% to-transparent" />
                  
                  {/* Top Subtle Specular Sheen */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 mix-blend-overlay" />

                  {/* Connect Pillar Watermark Graphic (04) */}
                  {pillar.num === '04' && (
                    <div className="absolute bottom-4 right-14 pointer-events-none opacity-30 flex items-center justify-center">
                      <Users className="w-11 h-11 text-stone-700 stroke-[1.2]" />
                    </div>
                  )}
                </div>

                {/* Card Foreground Content */}
                <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                  {/* Top Row: Icon on Left, Number on Right */}
                  <div className="flex items-start justify-between">
                    <div className="text-[#171515]">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
                    </div>
                    <span className="text-xs sm:text-[13px] font-inter font-medium text-stone-500 tracking-wider">
                      {pillar.num}
                    </span>
                  </div>

                  {/* Middle Block: Title & Description */}
                  <div className="space-y-1.5 max-w-[200px] sm:max-w-[230px]">
                    <h4 className="text-base sm:text-[17px] font-inter font-bold tracking-[0.05em] text-[#171515] uppercase leading-tight">
                      {pillar.title}
                    </h4>
                    <p className="text-xs sm:text-[13px] font-inter font-normal text-stone-600 leading-snug">
                      {pillar.desc}
                    </p>
                  </div>

                  {/* Bottom Row: Action Link Text on Left, Circular Tactile Button on Right */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs sm:text-[12.5px] font-inter font-bold uppercase tracking-[0.12em] text-[#171515] group-hover:text-black transition-colors">
                      {pillar.action}
                    </span>
                    
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 backdrop-blur-md border border-white shadow-[0_3px_10px_rgba(72,57,49,0.08)] flex items-center justify-center text-[#171515] group-hover:bg-[#171515] group-hover:text-white transition-all duration-300">
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4I. APP VISION BANNER */}
      <section className="rounded-3xl border border-[#EDE7E3] bg-black text-white p-6 sm:p-8 text-center space-y-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F7C6D7]">
          App Vision
        </span>
        <h3 className="text-base sm:text-lg font-bold text-white max-w-xl mx-auto leading-snug">
          The ultimate beauty playground where you can try, mix, and match makeup in real-time, discover new looks, join challenges, and connect with a global beauty community.
        </h3>
        <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest pt-2">
          TRY MAKEUP BEFORE YOU WEAR IT.
        </p>
      </section>

      {/* 4J. INSPIRATION WALL: GRID OF INSPIRATION LOOKS */}
      <section 
        className="space-y-4 text-left pt-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-black uppercase tracking-[0.14em] hover:text-[#E91E63] transition-colors">
              Inspiration Wall
            </h3>
          </div>
          <button
            onClick={() => onNavigate('inspiration-wall')}
            className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-stone-500 hover:text-[#E91E63] transition-colors uppercase tracking-wider cursor-pointer group"
          >
            <span>Community Mood Board</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Dynamic Bento Inspiration Wall Grid of Varied Card Sizes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-[140px] sm:auto-rows-[160px] gap-2.5 sm:gap-3.5 [grid-auto-flow:dense]">
          {/* 1. Tall Hero Editorial Portrait (Left) */}
          <div
            onClick={() => handleTryOn(CLEAN_GIRL_PRESET)}
            className="group/card relative col-span-1 row-span-2 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-[#EDE7E3] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-left"
          >
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=700" 
              alt="Soft Rose Dew"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

            <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="px-2.5 py-1 rounded-full bg-white/95 text-black text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#E91E63]" />
                <span>Try Look</span>
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-10 flex flex-col items-start gap-1">
              <span className="px-2 py-0.5 rounded-full bg-[#fde8ee] text-[#ff2f68] text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider">
                Luminous Glow
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                Soft Rose Dew
              </h4>
              <p className="text-[11px] text-white/80 line-clamp-1 hidden sm:block">
                Ultra-sheer dewy skin & flushed rose cheek
              </p>
            </div>
          </div>

          {/* 2. Compact / Square Detail (Top Right) */}
          <div
            onClick={() => handleTryOn(CHERRY_COLA_PRESET)}
            className="group/card relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-[#EDE7E3] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-left"
          >
            <img 
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600" 
              alt="Cherry Cola Glaze"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="px-2 py-0.5 rounded-full bg-white/95 text-black text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2 h-2 text-[#E91E63]" />
                <span>Try</span>
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 z-10 flex flex-col items-start gap-0.5">
              <span className="text-[8.5px] sm:text-[9px] font-extrabold text-[#F7C6D7] uppercase tracking-wider">
                Vinyl Lacquer
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                Cherry Cola Glaze
              </h4>
            </div>
          </div>

          {/* 3. Compact / Square Portrait (Bottom Right) */}
          <div
            onClick={() => handleTryOn(SOFT_BRONZE_PRESET)}
            className="group/card relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-[#EDE7E3] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-left"
          >
            <img 
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600" 
              alt="Sunlit Bronze"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="px-2 py-0.5 rounded-full bg-white/95 text-black text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2 h-2 text-[#E91E63]" />
                <span>Try</span>
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 z-10 flex flex-col items-start gap-0.5">
              <span className="text-[8.5px] sm:text-[9px] font-extrabold text-[#F7C6D7] uppercase tracking-wider">
                Golden Hour
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                Sunlit Bronze
              </h4>
            </div>
          </div>

          {/* 4. Wide Feature Moodboard Banner (Spans 2 cols) */}
          <div
            onClick={() => handleTryOn(GLOSS_ETHEREAL_PRESET)}
            className="group/card relative col-span-2 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-[#EDE7E3] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-left flex items-center"
          >
            <img 
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200" 
              alt="Modern Luxe Silk"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30 pointer-events-none" />

            <div className="relative z-10 p-3.5 sm:p-5 flex items-center justify-between w-full">
              <div className="space-y-0.5 max-w-[70%]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[8.5px] font-extrabold uppercase tracking-widest border border-white/25">
                    EDITORIAL MOOD
                  </span>
                  <span className="text-[9px] font-bold text-[#F7C6D7] uppercase tracking-wider hidden sm:inline">
                    Curated Aesthetic
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                  Modern Luxe Silk & Shimmer
                </h4>
                <p className="text-[11px] text-stone-300 font-medium line-clamp-1">
                  Liquid gold champagne wash with glossy peptide lips
                </p>
              </div>

              <div className="shrink-0">
                <span className="px-3 py-1.5 rounded-full bg-white text-[#171515] text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md group-hover/card:bg-[#ff2f68] group-hover/card:text-white transition-colors">
                  <span>TRY LOOK</span>
                  <Sparkles className="w-3 h-3 text-[#ff2f68] group-hover/card:text-white transition-colors" />
                </span>
              </div>
            </div>
          </div>

          {/* 5. Compact / Square Gloss Macro (Left Top) */}
          <div
            onClick={() => handleTryOn(GLASS_NUDE_PRESET)}
            className="group/card relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-[#EDE7E3] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-left"
          >
            <img 
              src="https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=600" 
              alt="Glass Nude Petal"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="px-2 py-0.5 rounded-full bg-white/95 text-black text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2 h-2 text-[#E91E63]" />
                <span>Try</span>
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 z-10 flex flex-col items-start gap-0.5">
              <span className="text-[8.5px] sm:text-[9px] font-extrabold text-[#F7C6D7] uppercase tracking-wider">
                Satin Plump
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                Glass Nude Petal
              </h4>
            </div>
          </div>

          {/* 6. Compact / Square Mood Shot (Left Bottom) */}
          <div
            onClick={() => handleTryOn(ESPRESSO_PRESET)}
            className="group/card relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-[#EDE7E3] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-left"
          >
            <img 
              src="https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600" 
              alt="Espresso Velvet"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="px-2 py-0.5 rounded-full bg-white/95 text-black text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2 h-2 text-[#E91E63]" />
                <span>Try</span>
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 z-10 flex flex-col items-start gap-0.5">
              <span className="text-[8.5px] sm:text-[9px] font-extrabold text-[#F7C6D7] uppercase tracking-wider">
                Smoky Mocha
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                Espresso Velvet
              </h4>
            </div>
          </div>

          {/* 7. Tall Dramatic Portrait (Right) */}
          <div
            onClick={() => handleTryOn(PINK_GLAZE_PRESET)}
            className="group/card relative col-span-1 row-span-2 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-[#EDE7E3] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-left"
          >
            <img 
              src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=700" 
              alt="Pink Glaze Frost"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

            <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="px-2.5 py-1 rounded-full bg-white/95 text-black text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#E91E63]" />
                <span>Try Look</span>
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-10 flex flex-col items-start gap-1">
              <span className="px-2 py-0.5 rounded-full bg-[#fde8ee] text-[#ff2f68] text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider">
                Dewy Lilac
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                Pink Glaze Frost
              </h4>
              <p className="text-[11px] text-white/80 line-clamp-1 hidden sm:block">
                Pastel wash with high-shine glazed candy lips
              </p>
            </div>
          </div>

          {/* 8. Wide Pigment Lab Mood Banner (Spans 2 cols) */}
          <div
            onClick={() => handleTryOn(ROSE_QUARTZ_PRESET)}
            className="group/card relative col-span-2 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-[#EDE7E3] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-left flex items-center"
          >
            <img 
              src="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=1200" 
              alt="Crushed Petal Shimmer"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30 pointer-events-none" />

            <div className="relative z-10 p-3.5 sm:p-5 flex items-center justify-between w-full">
              <div className="space-y-0.5 max-w-[70%]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#ff2f68]/30 backdrop-blur-xs text-[#fde8ee] text-[8.5px] font-extrabold uppercase tracking-widest border border-[#ff2f68]/40">
                    PIGMENT LAB
                  </span>
                  <span className="text-[9px] font-bold text-[#F7C6D7] uppercase tracking-wider hidden sm:inline">
                    Hand-Blended
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                  Crushed Rose & Velvet Smoke
                </h4>
                <p className="text-[11px] text-stone-300 font-medium line-clamp-1">
                  Rich ruby petals with soft diffused satin contour
                </p>
              </div>

              <div className="shrink-0">
                <span className="px-3 py-1.5 rounded-full bg-white text-[#171515] text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md group-hover/card:bg-[#ff2f68] group-hover/card:text-white transition-colors">
                  <span>TRY LOOK</span>
                  <Sparkles className="w-3 h-3 text-[#ff2f68] group-hover/card:text-white transition-colors" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE LIPS - the wall of kisses, under the inspiration wall */}
      <section id="signature-lips-board">
        <SignatureLipsBoard />
      </section>

      {/* Shade Interest Modal for Explore page */}
      <ShadeInterestModal
        product={selectedShadeProduct}
        isOpen={isShadeModalOpen}
        onClose={() => setIsShadeModalOpen(false)}
        onTryOn={(preset) => handleTryOn(preset)}
      />

      {/* Post-Save Discover Modal: SAVE → DISCOVER AGAIN */}
      <PostSaveDiscoverModal
        isOpen={isPostSaveModalOpen}
        onClose={() => setIsPostSaveModalOpen(false)}
        savedLookName={savedLookNameForModal}
        onTryOn={(preset) => handleTryOn(preset)}
        onNavigateToMyLooks={() => onNavigate('profile')}
      />

    </div>
  );
};