import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from '../firebase';

export type AnalyticsEventType = 
  | 'look_opened'
  | 'shade_tried'
  | 'dwell_time'
  | 'product_compared'
  | 'look_shared'
  | 'shop_clicked'
  | 'try_it_feedback'
  | 'daily_series_remix'
  | 'series_checkin';

export interface AnalyticsEvent {
  id?: string;
  eventType: AnalyticsEventType;
  timestamp: number;
  lookId?: string;
  lookName?: string;
  shadeName?: string;
  shadeHex?: string;
  category?: string;
  durationSeconds?: number;
  page?: string;
  productA?: string;
  productB?: string;
  productId?: string;
  productName?: string;
  brand?: string;
  price?: string;
  retailer?: string;
  platform?: string;
  userId?: string;
  seriesKey?: string;
  dayName?: string;
  wearChoice?: 'absolutely' | 'maybe' | 'not_for_me';
  metadata?: Record<string, any>;
}

export interface LookOpenMetric {
  lookId: string;
  lookName: string;
  category: string;
  opensCount: number;
  uniqueUsers: number;
  avgDwellSeconds: number;
  conversionToTryOnRate: number;
  lastOpened: number;
  coverImage?: string;
}

export interface ShadeTryMetric {
  shadeName: string;
  shadeHex: string;
  category: 'eyeshadow' | 'lipstick' | 'blush' | 'eyeliner' | 'lashes' | 'highlighter';
  tryCount: number;
  associatedLook?: string;
  finish?: string;
  sharePercentage: number;
}

export interface DwellTimeMetric {
  lookId?: string;
  lookName?: string;
  page: string;
  totalSeconds: number;
  sessionsCount: number;
  avgSeconds: number;
}

export interface ProductComparisonMetric {
  id: string;
  productA: string;
  productB: string;
  category: string;
  compareCount: number;
  preferredProduct: string;
  winRateA: number; // percentage
  winRateB: number;
  lastCompared: number;
}

export interface LookShareMetric {
  lookId: string;
  lookName: string;
  totalShares: number;
  platforms: {
    instagram: number;
    tiktok: number;
    copyLink: number;
    webShare: number;
    pinterest: number;
  };
  lastShared: number;
}

export interface ShopClickMetric {
  productId: string;
  productName: string;
  brand: string;
  price: string;
  retailer: 'Sephora' | 'Ulta Beauty' | 'Brand Official' | 'Nordstrom' | 'Glossier';
  clicksCount: number;
  estimatedRevenue: number;
  lookSource: string;
  conversionRate: number; // percentage
  lastClicked: number;
}

export interface TryItTuesdayMetric {
  seriesKey: string;
  lookName: string;
  totalTriedCount: number;
  wearRatings: {
    absolutely: number;
    maybe: number;
    not_for_me: number;
  };
  wearabilityScore: number; // percentage (absolutely + 0.5*maybe)
  remixCount: number;
  lastFeedbackTime: number;
}

export interface AnalyticsSummary {
  totalLookOpens: number;
  totalShadeTryOns: number;
  totalSecondsSpent: number;
  totalComparisons: number;
  totalShares: number;
  totalShopClicks: number;
  totalTryItResponses: number;
  avgSessionSeconds: number;
  activeLiveUsers: number;
  lastUpdated: number;
}

// Initial Comprehensive Seed Data for Admin Intelligence
export const SEED_LOOK_OPENS: LookOpenMetric[] = [
  {
    lookId: 'look_clean_girl',
    lookName: 'Clean Girl',
    category: 'Clean Aesthetic',
    opensCount: 14820,
    uniqueUsers: 11200,
    avgDwellSeconds: 184,
    conversionToTryOnRate: 88.4,
    lastOpened: Date.now() - 1000 * 60 * 3,
    coverImage: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600'
  },
  {
    lookId: 'look_glass_skin_glam',
    lookName: 'Glass Skin Glam',
    category: 'Glass Skin',
    opensCount: 12940,
    uniqueUsers: 9840,
    avgDwellSeconds: 215,
    conversionToTryOnRate: 91.2,
    lastOpened: Date.now() - 1000 * 60 * 7,
    coverImage: 'https://images.unsplash.com/photo-1588665798934-8c83e78ff6a9?auto=format&fit=crop&q=80&w=600'
  },
  {
    lookId: 'look_cherry_cola',
    lookName: 'Cherry Cola',
    category: 'Viral Syrup',
    opensCount: 11650,
    uniqueUsers: 8790,
    avgDwellSeconds: 168,
    conversionToTryOnRate: 84.7,
    lastOpened: Date.now() - 1000 * 60 * 12,
    coverImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600'
  },
  {
    lookId: 'look_espresso_makeup',
    lookName: 'Espresso Makeup',
    category: 'Monochrome Mocha',
    opensCount: 9420,
    uniqueUsers: 7210,
    avgDwellSeconds: 152,
    conversionToTryOnRate: 79.5,
    lastOpened: Date.now() - 1000 * 60 * 18,
    coverImage: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600'
  },
  {
    lookId: 'look_soft_grunge',
    lookName: 'Soft Grunge',
    category: 'Moody Grunge',
    opensCount: 8930,
    uniqueUsers: 6850,
    avgDwellSeconds: 174,
    conversionToTryOnRate: 82.1,
    lastOpened: Date.now() - 1000 * 60 * 25,
    coverImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600'
  },
  {
    lookId: 'look_cool_girl_pink',
    lookName: 'Cool Girl Pink',
    category: 'Y2K Chrome',
    opensCount: 7850,
    uniqueUsers: 5930,
    avgDwellSeconds: 146,
    conversionToTryOnRate: 76.8,
    lastOpened: Date.now() - 1000 * 60 * 32,
    coverImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600'
  },
  {
    lookId: 'look_date_night',
    lookName: 'Date Night',
    category: 'Romantic Glam',
    opensCount: 7420,
    uniqueUsers: 5610,
    avgDwellSeconds: 190,
    conversionToTryOnRate: 85.3,
    lastOpened: Date.now() - 1000 * 60 * 45,
    coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600'
  },
  {
    lookId: 'look_bronze_summer',
    lookName: 'Bronze Summer',
    category: 'Golden Sunset',
    opensCount: 6980,
    uniqueUsers: 5120,
    avgDwellSeconds: 138,
    conversionToTryOnRate: 74.2,
    lastOpened: Date.now() - 1000 * 60 * 50,
    coverImage: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600'
  },
  {
    lookId: 'look_90s_brown',
    lookName: '90s Brown',
    category: '90s Runway',
    opensCount: 6410,
    uniqueUsers: 4890,
    avgDwellSeconds: 162,
    conversionToTryOnRate: 80.6,
    lastOpened: Date.now() - 1000 * 60 * 58,
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'
  }
];

export const SEED_SHADES_TRIED: ShadeTryMetric[] = [
  { shadeName: 'Peptide Glass Glaze', shadeHex: '#fb7185', category: 'lipstick', tryCount: 9420, associatedLook: 'Glass Skin Glam', finish: 'High-Shine Glaze', sharePercentage: 18.5 },
  { shadeName: 'Cola Syrup Lacquer', shadeHex: '#581c87', category: 'lipstick', tryCount: 8810, associatedLook: 'Cherry Cola', finish: 'Glossy Vinyl', sharePercentage: 17.3 },
  { shadeName: 'Petal Flush Balm', shadeHex: '#fbb6ce', category: 'blush', tryCount: 7650, associatedLook: 'Clean Girl', finish: 'Dewy Satin', sharePercentage: 15.0 },
  { shadeName: 'Rose Dew Tint', shadeHex: '#f472b6', category: 'lipstick', tryCount: 6940, associatedLook: 'Clean Girl', finish: 'Sheer Stain', sharePercentage: 13.6 },
  { shadeName: 'Dark Roast Matte', shadeHex: '#451a03', category: 'eyeshadow', tryCount: 5820, associatedLook: 'Espresso Makeup', finish: 'Velvet Matte', sharePercentage: 11.4 },
  { shadeName: 'Ash Charcoal Smoke', shadeHex: '#3f3f46', category: 'eyeshadow', tryCount: 5120, associatedLook: 'Soft Grunge', finish: 'Diffused Matte', sharePercentage: 10.0 },
  { shadeName: 'Champagne Shimmer', shadeHex: '#d97706', category: 'highlighter', tryCount: 4790, associatedLook: 'Date Night', finish: 'Micro-Sparkle', sharePercentage: 9.4 },
  { shadeName: 'Velvet Berry Crimson', shadeHex: '#8c3a4f', category: 'lipstick', tryCount: 4320, associatedLook: 'Soft Grunge', finish: 'Powder Matte', sharePercentage: 8.5 },
  { shadeName: 'Lilac Frost Pastel', shadeHex: '#f472b6', category: 'eyeshadow', tryCount: 3890, associatedLook: 'Cool Girl Pink', finish: 'Duo-Chrome', sharePercentage: 7.6 },
  { shadeName: '90s Chocolate Contour', shadeHex: '#592813', category: 'lipstick', tryCount: 3650, associatedLook: '90s Brown', finish: 'Satin Cream', sharePercentage: 7.1 },
  { shadeName: 'Gold Dust Mineral', shadeHex: '#d97706', category: 'eyeshadow', tryCount: 3410, associatedLook: 'Bronze Summer', finish: 'Metallic Foil', sharePercentage: 6.7 },
  { shadeName: 'Sunlit Amber Tint', shadeHex: '#ea580c', category: 'blush', tryCount: 2980, associatedLook: 'Bronze Summer', finish: 'Gelée Flush', sharePercentage: 5.8 }
];

export const SEED_PRODUCT_COMPARISONS: ProductComparisonMetric[] = [
  {
    id: 'comp_1',
    productA: 'Peptide Glass Glaze',
    productB: 'Rose Dew Tint',
    category: 'Lip Formulas',
    compareCount: 3480,
    preferredProduct: 'Peptide Glass Glaze',
    winRateA: 64,
    winRateB: 36,
    lastCompared: Date.now() - 1000 * 60 * 5
  },
  {
    id: 'comp_2',
    productA: 'Dark Roast Matte',
    productB: 'Ash Charcoal Smoke',
    category: 'Smoky Eye Pigments',
    compareCount: 2890,
    preferredProduct: 'Dark Roast Matte',
    winRateA: 58,
    winRateB: 42,
    lastCompared: Date.now() - 1000 * 60 * 15
  },
  {
    id: 'comp_3',
    productA: 'Petal Flush Cream',
    productB: 'Sunlit Amber Gelée',
    category: 'Blush Textures',
    compareCount: 2410,
    preferredProduct: 'Petal Flush Cream',
    winRateA: 71,
    winRateB: 29,
    lastCompared: Date.now() - 1000 * 60 * 22
  },
  {
    id: 'comp_4',
    productA: 'Cola Syrup Lacquer',
    productB: 'Velvet Berry Crimson',
    category: 'Statement Red / Berry',
    compareCount: 2190,
    preferredProduct: 'Cola Syrup Lacquer',
    winRateA: 55,
    winRateB: 45,
    lastCompared: Date.now() - 1000 * 60 * 35
  },
  {
    id: 'comp_5',
    productA: 'Champagne Shimmer Lids',
    productB: 'Gold Dust Mineral Foil',
    category: 'Gleam Highlighters',
    compareCount: 1840,
    preferredProduct: 'Champagne Shimmer Lids',
    winRateA: 62,
    winRateB: 38,
    lastCompared: Date.now() - 1000 * 60 * 48
  }
];

export const SEED_LOOK_SHARES: LookShareMetric[] = [
  {
    lookId: 'look_clean_girl',
    lookName: 'Clean Girl',
    totalShares: 4320,
    platforms: { instagram: 1980, tiktok: 1450, copyLink: 520, webShare: 240, pinterest: 130 },
    lastShared: Date.now() - 1000 * 60 * 2
  },
  {
    lookId: 'look_cherry_cola',
    lookName: 'Cherry Cola',
    totalShares: 3890,
    platforms: { instagram: 1210, tiktok: 2040, copyLink: 390, webShare: 160, pinterest: 90 },
    lastShared: Date.now() - 1000 * 60 * 8
  },
  {
    lookId: 'look_glass_skin_glam',
    lookName: 'Glass Skin Glam',
    totalShares: 3410,
    platforms: { instagram: 1720, tiktok: 1080, copyLink: 360, webShare: 150, pinterest: 100 },
    lastShared: Date.now() - 1000 * 60 * 14
  },
  {
    lookId: 'look_soft_grunge',
    lookName: 'Soft Grunge',
    totalShares: 2780,
    platforms: { instagram: 980, tiktok: 1340, copyLink: 270, webShare: 110, pinterest: 80 },
    lastShared: Date.now() - 1000 * 60 * 20
  },
  {
    lookId: 'look_espresso_makeup',
    lookName: 'Espresso Makeup',
    totalShares: 2340,
    platforms: { instagram: 1140, tiktok: 790, copyLink: 240, webShare: 100, pinterest: 70 },
    lastShared: Date.now() - 1000 * 60 * 30
  },
  {
    lookId: 'look_cool_girl_pink',
    lookName: 'Cool Girl Pink',
    totalShares: 1980,
    platforms: { instagram: 780, tiktok: 920, copyLink: 160, webShare: 70, pinterest: 50 },
    lastShared: Date.now() - 1000 * 60 * 42
  }
];

export const SEED_SHOP_CLICKS: ShopClickMetric[] = [
  {
    productId: 'prod_lip_glaze_01',
    productName: 'Glazed Peptide Lip Glaze (Peptide Rose)',
    brand: 'KOBELLA Studio Lab',
    price: '$26.00',
    retailer: 'Sephora',
    clicksCount: 4890,
    estimatedRevenue: 127140,
    lookSource: 'Clean Girl & Glass Skin',
    conversionRate: 14.8,
    lastClicked: Date.now() - 1000 * 60 * 1
  },
  {
    productId: 'prod_cola_vinyl_02',
    productName: 'Syrup Vinyl Lip Lacquer (Dark Cherry)',
    brand: 'Fenty Beauty / Rare Beauty',
    price: '$28.00',
    retailer: 'Ulta Beauty',
    clicksCount: 4120,
    estimatedRevenue: 115360,
    lookSource: 'Cherry Cola',
    conversionRate: 13.2,
    lastClicked: Date.now() - 1000 * 60 * 6
  },
  {
    productId: 'prod_cheek_dew_03',
    productName: 'Dewy Melt Cheek Gel Tint (Petal Peach)',
    brand: 'Saie / Rhode',
    price: '$24.00',
    retailer: 'Brand Official',
    clicksCount: 3670,
    estimatedRevenue: 88080,
    lookSource: 'Clean Girl',
    conversionRate: 12.5,
    lastClicked: Date.now() - 1000 * 60 * 11
  },
  {
    productId: 'prod_espresso_palette_04',
    productName: '90s Roasted Cocoa Shadow Palette',
    brand: 'Patrick Ta Beauty',
    price: '$68.00',
    retailer: 'Nordstrom',
    clicksCount: 2940,
    estimatedRevenue: 199920,
    lookSource: 'Espresso Makeup',
    conversionRate: 9.8,
    lastClicked: Date.now() - 1000 * 60 * 19
  },
  {
    productId: 'prod_grunge_smoke_05',
    productName: 'Soft Charcoal Velvet Liner Stick',
    brand: 'Make Up For Ever',
    price: '$22.00',
    retailer: 'Sephora',
    clicksCount: 2430,
    estimatedRevenue: 53460,
    lookSource: 'Soft Grunge',
    conversionRate: 11.4,
    lastClicked: Date.now() - 1000 * 60 * 28
  },
  {
    productId: 'prod_chrome_highlighter_06',
    productName: 'Prismatic Hologram Highlighter Gel',
    brand: 'Glossier Play',
    price: '$30.00',
    retailer: 'Glossier',
    clicksCount: 1890,
    estimatedRevenue: 56700,
    lookSource: 'Cool Girl Pink & Holographic',
    conversionRate: 10.6,
    lastClicked: Date.now() - 1000 * 60 * 37
  }
];

// Helper to get local analytics memory store
const getLocalEvents = (): AnalyticsEvent[] => {
  try {
    const raw = localStorage.getItem('kobella_analytics_events');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalEvent = (event: AnalyticsEvent) => {
  try {
    const events = getLocalEvents();
    events.unshift(event);
    if (events.length > 500) events.pop();
    localStorage.setItem('kobella_analytics_events', JSON.stringify(events));
  } catch (e) {
    console.error('Error saving local analytics event:', e);
  }
};

// Main Tracker Functions
export const trackLookOpened = async (lookId: string, lookName: string, category?: string) => {
  const event: AnalyticsEvent = {
    eventType: 'look_opened',
    timestamp: Date.now(),
    lookId,
    lookName,
    category: category || 'Editorial',
    userId: localStorage.getItem('kobella_username') || 'guest_user'
  };

  saveLocalEvent(event);
  
  // Try sending to Firestore asynchronously
  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch (err) {
    // Non-blocking telemetry
    console.debug('Analytics logged locally:', event.eventType);
  }
};

export const trackShadeTried = async (shadeName: string, shadeHex: string, category: string, lookId?: string) => {
  const event: AnalyticsEvent = {
    eventType: 'shade_tried',
    timestamp: Date.now(),
    shadeName,
    shadeHex,
    category,
    lookId,
    userId: localStorage.getItem('kobella_username') || 'guest_user'
  };

  saveLocalEvent(event);
  
  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch {
    // Local fallback
  }
};

export const trackDwellTime = async (durationSeconds: number, page: string, lookId?: string, lookName?: string) => {
  if (durationSeconds <= 0) return;
  const event: AnalyticsEvent = {
    eventType: 'dwell_time',
    timestamp: Date.now(),
    durationSeconds,
    page,
    lookId,
    lookName,
    userId: localStorage.getItem('kobella_username') || 'guest_user'
  };

  saveLocalEvent(event);

  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch {
    // Local fallback
  }
};

export const trackProductCompared = async (productA: string, productB: string, category: string, preferredProduct?: string) => {
  const event: AnalyticsEvent = {
    eventType: 'product_compared',
    timestamp: Date.now(),
    productA,
    productB,
    category,
    metadata: { preferredProduct },
    userId: localStorage.getItem('kobella_username') || 'guest_user'
  };

  saveLocalEvent(event);

  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch {
    // Local fallback
  }
};

export const trackLookShared = async (lookId: string, lookName: string, platform: string) => {
  const event: AnalyticsEvent = {
    eventType: 'look_shared',
    timestamp: Date.now(),
    lookId,
    lookName,
    platform,
    userId: localStorage.getItem('kobella_username') || 'guest_user'
  };

  saveLocalEvent(event);

  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch {
    // Local fallback
  }
};

export const trackShopClick = async (
  productId: string, 
  productName: string, 
  brand: string, 
  price: string, 
  retailer: string, 
  lookId?: string
) => {
  const event: AnalyticsEvent = {
    eventType: 'shop_clicked',
    timestamp: Date.now(),
    productId,
    productName,
    brand,
    price,
    retailer,
    lookId,
    userId: localStorage.getItem('kobella_username') || 'guest_user'
  };

  saveLocalEvent(event);

  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch {
    // Local fallback
  }
};

// Track Try It Tuesday "Would you wear it?" feedback
export const trackTryItFeedback = async (
  seriesKey: string,
  lookName: string,
  choice: 'absolutely' | 'maybe' | 'not_for_me'
) => {
  const event: AnalyticsEvent = {
    eventType: 'try_it_feedback',
    timestamp: Date.now(),
    seriesKey,
    lookName,
    wearChoice: choice,
    category: 'Try It Tuesday Feedback',
    userId: localStorage.getItem('kobella_username') || 'guest_user',
    metadata: { choice, seriesKey, lookName }
  };

  saveLocalEvent(event);

  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch (err) {
    console.debug('TryItFeedback logged locally:', choice);
  }
};

// Track "Make Your Version" remix action
export const trackDailySeriesRemix = async (
  seriesKey: string,
  lookName: string
) => {
  const event: AnalyticsEvent = {
    eventType: 'daily_series_remix',
    timestamp: Date.now(),
    seriesKey,
    lookName,
    category: 'Daily Series Studio Remix',
    userId: localStorage.getItem('kobella_username') || 'guest_user',
    metadata: { seriesKey, lookName }
  };

  saveLocalEvent(event);

  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch (err) {
    console.debug('SeriesRemix logged locally:', lookName);
  }
};

// Track Daily Series Check-In
export const trackSeriesCheckIn = async (
  seriesKey: string,
  dayName: string,
  lookName: string
) => {
  const event: AnalyticsEvent = {
    eventType: 'series_checkin',
    timestamp: Date.now(),
    seriesKey,
    dayName,
    lookName,
    category: `${dayName} Check-In`,
    userId: localStorage.getItem('kobella_username') || 'guest_user'
  };

  saveLocalEvent(event);

  try {
    await addDoc(collection(db, 'analytics_events'), event);
  } catch {
    // Local fallback
  }
};

// Seed Benchmark for Try It Tuesday
export const SEED_TRY_IT_TUESDAY: TryItTuesdayMetric = {
  seriesKey: 'tuesday_try_it',
  lookName: 'Golden Hour Velvet',
  totalTriedCount: 3840,
  wearRatings: {
    absolutely: 2790,
    maybe: 760,
    not_for_me: 290
  },
  wearabilityScore: 82.5,
  remixCount: 1420,
  lastFeedbackTime: Date.now() - 1000 * 60 * 4
};

// Summary metrics getter with real-time merges
export const getAggregatedAnalytics = () => {
  const localEvents = getLocalEvents();

  // Dynamic calculations merged with seeded benchmarks
  let liveLookOpens = [...SEED_LOOK_OPENS];
  let liveShades = [...SEED_SHADES_TRIED];
  let liveComparisons = [...SEED_PRODUCT_COMPARISONS];
  let liveShares = [...SEED_LOOK_SHARES];
  let liveShopClicks = [...SEED_SHOP_CLICKS];
  let liveTryIt = { ...SEED_TRY_IT_TUESDAY, wearRatings: { ...SEED_TRY_IT_TUESDAY.wearRatings } };

  let extraSeconds = 0;
  let localTryItCount = 0;

  localEvents.forEach(evt => {
    if (evt.eventType === 'look_opened' && evt.lookName) {
      const match = liveLookOpens.find(l => l.lookName.toLowerCase() === evt.lookName?.toLowerCase() || l.lookId === evt.lookId);
      if (match) {
        match.opensCount += 1;
        match.lastOpened = Math.max(match.lastOpened, evt.timestamp);
      } else {
        liveLookOpens.unshift({
          lookId: evt.lookId || 'custom_look',
          lookName: evt.lookName,
          category: evt.category || 'User Look',
          opensCount: 1,
          uniqueUsers: 1,
          avgDwellSeconds: 90,
          conversionToTryOnRate: 85,
          lastOpened: evt.timestamp
        });
      }
    } else if (evt.eventType === 'shade_tried' && evt.shadeName) {
      const match = liveShades.find(s => s.shadeName.toLowerCase() === evt.shadeName?.toLowerCase());
      if (match) {
        match.tryCount += 1;
      } else {
        liveShades.unshift({
          shadeName: evt.shadeName,
          shadeHex: evt.shadeHex || '#f472b6',
          category: (evt.category as any) || 'lipstick',
          tryCount: 1,
          associatedLook: evt.lookId || 'Custom Palette',
          finish: 'Custom Finish',
          sharePercentage: 5
        });
      }
    } else if (evt.eventType === 'dwell_time' && evt.durationSeconds) {
      extraSeconds += evt.durationSeconds;
    } else if (evt.eventType === 'look_shared' && evt.lookName) {
      const match = liveShares.find(s => s.lookName.toLowerCase() === evt.lookName?.toLowerCase());
      if (match) {
        match.totalShares += 1;
        if (evt.platform === 'tiktok') match.platforms.tiktok += 1;
        else if (evt.platform === 'instagram') match.platforms.instagram += 1;
        else match.platforms.copyLink += 1;
      }
    } else if (evt.eventType === 'shop_clicked' && evt.productName) {
      const match = liveShopClicks.find(p => p.productName.toLowerCase() === evt.productName?.toLowerCase());
      if (match) {
        match.clicksCount += 1;
        match.lastClicked = evt.timestamp;
      }
    } else if (evt.eventType === 'product_compared' && evt.productA && evt.productB) {
      const match = liveComparisons.find(c => (c.productA === evt.productA && c.productB === evt.productB) || (c.productA === evt.productB && c.productB === evt.productA));
      if (match) {
        match.compareCount += 1;
        match.lastCompared = evt.timestamp;
      }
    } else if (evt.eventType === 'try_it_feedback' && evt.wearChoice) {
      localTryItCount += 1;
      liveTryIt.totalTriedCount += 1;
      liveTryIt.wearRatings[evt.wearChoice] = (liveTryIt.wearRatings[evt.wearChoice] || 0) + 1;
      liveTryIt.lastFeedbackTime = Math.max(liveTryIt.lastFeedbackTime, evt.timestamp);
    } else if (evt.eventType === 'daily_series_remix') {
      liveTryIt.remixCount += 1;
    } else if (evt.eventType === 'series_checkin') {
      liveTryIt.totalTriedCount += 1;
    }
  });

  const totalAbs = liveTryIt.wearRatings.absolutely;
  const totalMay = liveTryIt.wearRatings.maybe;
  const totalNot = liveTryIt.wearRatings.not_for_me;
  const totalVotes = totalAbs + totalMay + totalNot || 1;
  liveTryIt.wearabilityScore = Math.round(((totalAbs + totalMay * 0.5) / totalVotes) * 100);

  const totalLookOpens = liveLookOpens.reduce((acc, curr) => acc + curr.opensCount, 0);
  const totalShadeTryOns = liveShades.reduce((acc, curr) => acc + curr.tryCount, 0);
  const baseSeconds = 148520; // benchmark seconds spent across users
  const totalSecondsSpent = baseSeconds + extraSeconds;
  const totalComparisons = liveComparisons.reduce((acc, curr) => acc + curr.compareCount, 0);
  const totalShares = liveShares.reduce((acc, curr) => acc + curr.totalShares, 0);
  const totalShopClicks = liveShopClicks.reduce((acc, curr) => acc + curr.clicksCount, 0);
  const totalTryItResponses = liveTryIt.totalTriedCount;

  const summary: AnalyticsSummary = {
    totalLookOpens,
    totalShadeTryOns,
    totalSecondsSpent,
    totalComparisons,
    totalShares,
    totalShopClicks,
    totalTryItResponses,
    avgSessionSeconds: 172,
    activeLiveUsers: Math.floor(Math.random() * 8) + 18, // 18-25 concurrent live testers
    lastUpdated: Date.now()
  };

  return {
    summary,
    lookOpens: liveLookOpens,
    shadesTried: liveShades,
    productComparisons: liveComparisons,
    lookShares: liveShares,
    shopClicks: liveShopClicks,
    tryItTuesday: liveTryIt,
    recentEvents: localEvents.slice(0, 50)
  };
};
