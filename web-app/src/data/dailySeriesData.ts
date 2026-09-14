import { PresetLook } from '../types';

export interface DailySeriesItem {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  shortDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  seriesKey: string;
  seriesTitle: string;
  tagline: string;
  badge: string;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  heroImage: string;
  description: string;
  type: 'new_drop' | 'try_it' | 'shade_battle' | 'build_look' | 'tonight_face' | 'viral_skip' | 'challenge';
  preset: PresetLook;
  
  // Specific interactive payloads:
  shadeBattleData?: {
    title: string;
    subtitle: string;
    shadeA: {
      id: string;
      name: string;
      colorHex: string;
      finish: string;
      img: string;
      preset: PresetLook;
    };
    shadeB: {
      id: string;
      name: string;
      colorHex: string;
      finish: string;
      img: string;
      preset: PresetLook;
    };
  };

  viralOrSkipData?: {
    trendName: string;
    platformSource: string;
    hackDescription: string;
    verdictStats: { viral: number; skip: number };
  };

  buildMyLookData?: {
    recipeName: string;
    layers: {
      step: number;
      name: string;
      product: string;
      colorHex: string;
      note: string;
    }[];
  };

  newDropData?: {
    dropName: string;
    formulaType: string;
    swatches: { name: string; hex: string; finish: string }[];
    perks: string[];
  };

  challengeData?: {
    challengeTitle: string;
    hashtag: string;
    guidelines: string;
    deadline: string;
    prize: string;
  };
}

export const DAILY_SERIES_LIST: DailySeriesItem[] = [
  // 1. MONDAY: NEW DROP
  {
    dayIndex: 1,
    dayName: 'Monday',
    shortDay: 'Mon',
    seriesKey: 'monday_new_drop',
    seriesTitle: 'New Drop Monday',
    tagline: 'Fresh Pigment Formulas & Limited Edition Finishes',
    badge: 'NEW DROP',
    themeColor: '#732729',
    badgeBg: '#FFF0F3',
    badgeText: '#E91E63',
    heroImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=85&w=800',
    description: 'Kickstart the week with our newest lab-formulated pigment release: Prism Orchid Chrome & Velvet Glaze.',
    type: 'new_drop',
    preset: {
      id: 'drop_prism_orchid',
      name: 'Prism Orchid Chrome',
      description: 'New Drop Monday exclusive: holographic orchid shadow with mirror-shine glass berry lips and wispy doll lashes.',
      eyeshadowColor: '#c026d3',
      eyeshadowOpacity: 0.85,
      eyelinerColor: '#701a75',
      eyelinerOpacity: 0.9,
      eyelinerStyle: 'winged',
      blushColor: '#f43f5e',
      blushOpacity: 0.5,
      lipColor: '#db2777',
      lipOpacity: 0.9,
      lipGloss: true,
      lashesStyle: 'wispy',
      glitterLevel: 85,
      filter: 'holographic'
    },
    newDropData: {
      dropName: 'Prism Orchid Collection',
      formulaType: 'Holographic Liquid Chrome & Glaze Lip Stain',
      swatches: [
        { name: 'Prism Violet', hex: '#c026d3', finish: 'Multi-Chrome' },
        { name: 'Berry Glaze', hex: '#db2777', finish: 'Glass Shimmer' },
        { name: 'Rose Quartz', hex: '#f43f5e', finish: 'Velvet Satin' },
        { name: 'Opal Dust', hex: '#fdf4ff', finish: 'Prismatic Pearl' }
      ],
      perks: ['Exclusive Monday Pigment', 'Instant AR Camera Preview', 'One-Click Formula Load']
    }
  },

  // 2. TUESDAY: TRY IT TUESDAY
  {
    dayIndex: 2,
    dayName: 'Tuesday',
    shortDay: 'Tue',
    seriesKey: 'tuesday_try_it',
    seriesTitle: 'Try It Tuesday',
    tagline: 'Community Spotlight Formula to Test Live',
    badge: 'TRY IT TUESDAY',
    themeColor: '#be123c',
    badgeBg: '#FFF1F2',
    badgeText: '#E11D48',
    heroImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=85&w=800',
    description: 'This Tuesday we spotlight the viral "Golden Hour Velvet" formula created by community creator @sophia_glam.',
    type: 'try_it',
    preset: {
      id: 'try_it_golden_velvet',
      name: 'Golden Hour Velvet',
      description: 'Curated for Try It Tuesday: rich copper gold eyelid wash, peach petal blush, and plush velvet mahogany lips.',
      eyeshadowColor: '#d97706',
      eyeshadowOpacity: 0.75,
      eyelinerColor: '#78350f',
      eyelinerOpacity: 0.8,
      eyelinerStyle: 'cat-eye',
      blushColor: '#fb923c',
      blushOpacity: 0.5,
      lipColor: '#b91c1c',
      lipOpacity: 0.85,
      lipGloss: false,
      lashesStyle: 'glam',
      glitterLevel: 60,
      filter: 'warm-glow'
    }
  },

  // 3. WEDNESDAY: SHADE BATTLE
  {
    dayIndex: 3,
    dayName: 'Wednesday',
    shortDay: 'Wed',
    seriesKey: 'wednesday_shade_battle',
    seriesTitle: 'Wednesday Shade Battle',
    tagline: 'Head-to-Head Shade Showdown & Live Community Vote',
    badge: 'SHADE BATTLE',
    themeColor: '#732729',
    badgeBg: '#FFF6F7',
    badgeText: '#E91E63',
    heroImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=85&w=800',
    description: 'Which shade rules this week? Compare both shades directly on your live camera and cast your vote.',
    type: 'shade_battle',
    preset: {
      id: 'battle_shade_a',
      name: 'Black Cherry Noir',
      description: 'Deep moody wine velvet lip with smoky bronze shadow.',
      eyeshadowColor: '#78350f',
      eyeshadowOpacity: 0.7,
      blushColor: '#881337',
      blushOpacity: 0.45,
      lipColor: '#4c0519',
      lipOpacity: 0.95,
      lipGloss: false,
      lashesStyle: 'glam',
      glitterLevel: 30,
      filter: 'none'
    },
    shadeBattleData: {
      title: 'Deep Cherry Noir vs Peach Glaze Glow',
      subtitle: 'Try both live on your camera to decide the winner',
      shadeA: {
        id: 'shade_a',
        name: 'Black Cherry Noir',
        colorHex: '#4c0519',
        finish: 'Ultra-Matte Velvet',
        img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400',
        preset: {
          id: 'battle_shade_a',
          name: 'Black Cherry Noir',
          description: 'Deep moody wine velvet lip with smoky bronze shadow.',
          eyeshadowColor: '#78350f',
          eyeshadowOpacity: 0.7,
          blushColor: '#881337',
          blushOpacity: 0.45,
          lipColor: '#4c0519',
          lipOpacity: 0.95,
          lipGloss: false,
          lashesStyle: 'glam',
          glitterLevel: 30,
          filter: 'none'
        }
      },
      shadeB: {
        id: 'shade_b',
        name: 'Honey Peach Glaze',
        colorHex: '#f97316',
        finish: 'High-Gloss Glass',
        img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=400',
        preset: {
          id: 'battle_shade_b',
          name: 'Honey Peach Glaze',
          description: 'Dewy peach gloss with champagne shimmer wash.',
          eyeshadowColor: '#fef3c7',
          eyeshadowOpacity: 0.6,
          blushColor: '#fb923c',
          blushOpacity: 0.5,
          lipColor: '#ea580c',
          lipOpacity: 0.8,
          lipGloss: true,
          lashesStyle: 'wispy',
          glitterLevel: 75,
          filter: 'warm-glow'
        }
      }
    }
  },

  // 4. THURSDAY: BUILD MY LOOK
  {
    dayIndex: 4,
    dayName: 'Thursday',
    shortDay: 'Thu',
    seriesKey: 'thursday_build_look',
    seriesTitle: 'Build My Look',
    tagline: 'Deconstructed Layer Recipe & Step-by-Step Mix',
    badge: 'BUILD MY LOOK',
    themeColor: '#8f6a51',
    badgeBg: '#FDF4EC',
    badgeText: '#C2410C',
    heroImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=85&w=800',
    description: 'Learn the exact 4-layer cosmetic blueprint behind the "Espresso Glaze" look and customize it in the studio.',
    type: 'build_look',
    preset: {
      id: 'build_espresso_glaze',
      name: 'Espresso Glaze Blueprint',
      description: 'Layered espresso eyeshadow with cocoa contour, warm terracotta flush, and glossy mocha lips.',
      eyeshadowColor: '#451a03',
      eyeshadowOpacity: 0.75,
      eyelinerColor: '#1c1917',
      eyelinerOpacity: 0.85,
      eyelinerStyle: 'cat-eye',
      blushColor: '#b45309',
      blushOpacity: 0.45,
      lipColor: '#78350f',
      lipOpacity: 0.85,
      lipGloss: true,
      lashesStyle: 'wispy',
      glitterLevel: 40,
      filter: 'warm-glow'
    },
    buildMyLookData: {
      recipeName: 'Espresso Glaze 4-Step Recipe',
      layers: [
        { step: 1, name: 'Skin Sheen Base', product: 'Golden Dewy Filter', colorHex: '#fef3c7', note: 'Warm radiance bounce across cheekbones' },
        { step: 2, name: 'Warm Flush', product: 'Terracotta Petal Blush', colorHex: '#b45309', note: 'Diffused high on the temples at 45% opacity' },
        { step: 3, name: 'Smoky Espresso Lid', product: 'Roasted Mocha Pigment', colorHex: '#451a03', note: 'Melted wash with winged lash definition' },
        { step: 4, name: 'Mirror Mocha Gloss', product: 'Collagen Brown Lip Gloss', colorHex: '#78350f', note: 'High-shine topcoat with contour lip liner' }
      ]
    }
  },

  // 5. FRIDAY: TONIGHT'S FACE
  {
    dayIndex: 5,
    dayName: 'Friday',
    shortDay: 'Fri',
    seriesKey: 'friday_tonights_face',
    seriesTitle: 'Tonight’s Face',
    tagline: 'Weekend Evening Glam & Night-Out Red Carpet Look',
    badge: "TONIGHT'S FACE",
    themeColor: '#000000',
    badgeBg: '#1c1917',
    badgeText: '#F472B6',
    heroImage: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=85&w=800',
    description: 'Friday night signature: Sultry smoked burgundy liner, diamond holographic lid topper, and statement ruby pout.',
    type: 'tonight_face',
    preset: {
      id: 'tonights_face_ruby_siren',
      name: 'Midnight Ruby Siren',
      description: 'Friday Night special: Sultry winged smoked shadow, high-definition flutter lashes, and ultra-saturated ruby lacquer.',
      eyeshadowColor: '#262626',
      eyeshadowOpacity: 0.8,
      eyelinerColor: '#be123c',
      eyelinerOpacity: 0.95,
      eyelinerStyle: 'winged',
      blushColor: '#9f1239',
      blushOpacity: 0.5,
      lipColor: '#991b1b',
      lipOpacity: 0.95,
      lipGloss: true,
      lashesStyle: 'glam',
      glitterLevel: 80,
      filter: 'none'
    }
  },

  // 6. SATURDAY: VIRAL OR SKIP
  {
    dayIndex: 6,
    dayName: 'Saturday',
    shortDay: 'Sat',
    seriesKey: 'saturday_viral_skip',
    seriesTitle: 'Viral or Skip',
    tagline: 'Testing Social Media Beauty Hacks Live on Camera',
    badge: 'VIRAL OR SKIP',
    themeColor: '#db2777',
    badgeBg: '#FDF2F8',
    badgeText: '#DB2777',
    heroImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=85&w=800',
    description: 'Testing the viral TikTok "Sunset Under-Eye Blush Sandwich" filter effect. Is it certified Viral or a Skip?',
    type: 'viral_skip',
    preset: {
      id: 'viral_sunset_sandwich',
      name: 'Sunset Blush Sandwich',
      description: 'Viral TikTok technique: Gradient coral and magenta blush blended seamlessly into golden champagne shimmer shadow.',
      eyeshadowColor: '#f59e0b',
      eyeshadowOpacity: 0.7,
      eyelinerColor: '#881337',
      eyelinerOpacity: 0.6,
      eyelinerStyle: 'classic',
      blushColor: '#f43f5e',
      blushOpacity: 0.65,
      lipColor: '#f43f5e',
      lipOpacity: 0.75,
      lipGloss: true,
      lashesStyle: 'wispy',
      glitterLevel: 65,
      filter: 'warm-glow'
    },
    viralOrSkipData: {
      trendName: 'Sunset Under-Eye Blush Sandwich',
      platformSource: 'TikTok · 14.8M Views #BlushSandwich',
      hackDescription: 'Layering warm liquid coral blush under concealer and topping with luminous pink powder for an all-day filtered glow.',
      verdictStats: { viral: 86, skip: 14 }
    }
  },

  // 0. SUNDAY: TRYON CHALLENGE
  {
    dayIndex: 0,
    dayName: 'Sunday',
    shortDay: 'Sun',
    seriesKey: 'sunday_challenge',
    seriesTitle: 'TryOn Challenge',
    tagline: 'Weekly Creator Theme Kickoff & Contest Leaderboard',
    badge: 'TRYON CHALLENGE',
    themeColor: '#732729',
    badgeBg: '#FFF1F2',
    badgeText: '#BE123C',
    heroImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=85&w=800',
    description: 'Weekly Challenge Kickoff: Build and submit your best "Clean Girl Summer Glow" look for community votes & Hall of Fame entry.',
    type: 'challenge',
    preset: {
      id: 'challenge_clean_glow',
      name: 'Clean Girl Glow Entry',
      description: 'Sunday Challenge starter base: Dewy glassy cheeks, rosewater lip oil, and feathered natural lashes.',
      eyeshadowColor: '#fdf2e9',
      eyeshadowOpacity: 0.35,
      blushColor: '#fda4af',
      blushOpacity: 0.4,
      lipColor: '#fb7185',
      lipOpacity: 0.7,
      lipGloss: true,
      lashesStyle: 'natural',
      glitterLevel: 25,
      filter: 'vintage'
    },
    challengeData: {
      challengeTitle: 'Clean Summer Glow Contest',
      hashtag: '#TryOnCleanGlow',
      guidelines: 'Design a radiant, natural summer formula. Submit in the studio and rally votes from the community!',
      deadline: 'Sunday 11:59 PM EST',
      prize: 'Crowned in Hall of Fame + Featured on TryOn Beauty Home'
    }
  }
];

export function getTodaySeriesItem(): DailySeriesItem {
  const currentDayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const found = DAILY_SERIES_LIST.find(item => item.dayIndex === currentDayIndex);
  return found || DAILY_SERIES_LIST[1]; // default Monday if not found
}
