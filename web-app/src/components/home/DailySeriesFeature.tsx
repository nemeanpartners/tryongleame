import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Layers, 
  Trophy, 
  Sparkle, 
  RotateCcw, 
  Eye, 
  Calendar,
  Clock,
  ExternalLink,
  Heart,
  Palette,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { DailySeriesItem, DAILY_SERIES_LIST, getTodaySeriesItem } from '../../data/dailySeriesData';
import { PresetLook } from '../../types';
import { db, doc, onSnapshot, setDoc, increment, handleFirestoreError, OperationType } from '../../firebase';
import { 
  trackProductCompared, 
  trackShadeTried, 
  trackLookOpened, 
  trackLookShared,
  trackTryItFeedback,
  trackDailySeriesRemix,
  trackSeriesCheckIn
} from '../../lib/analytics';

interface DailySeriesFeatureProps {
  onTryOn: (preset: PresetLook) => void;
  onNavigate: (tab: 'sandbox' | 'votes' | 'gallery' | 'built-looks' | 'trending' | 'shade-edit') => void;
  username?: string;
}

interface SeriesFirestoreStats {
  votesA?: number;
  votesB?: number;
  totalTryOns?: number;
  totalCheckIns?: number;
  viralVotes?: number;
  skipVotes?: number;
  wear_rating_absolutely?: number;
  wear_rating_maybe?: number;
  wear_rating_not_for_me?: number;
  remixCount?: number;
  lastUpdated?: number;
}

// Initial baseline mock data so UI looks rich immediately even before first cloud write
const DEFAULT_METRICS: Record<string, SeriesFirestoreStats> = {
  monday_new_drop: { totalTryOns: 1420, totalCheckIns: 890 },
  tuesday_try_it: { totalTryOns: 2180, totalCheckIns: 1640 },
  wednesday_shade_battle: { votesA: 1840, votesB: 1290, totalTryOns: 3100 },
  thursday_build_look: { totalTryOns: 1530, totalCheckIns: 980 },
  friday_tonights_face: { totalTryOns: 2890, totalCheckIns: 2120 },
  saturday_viral_skip: { viralVotes: 2450, skipVotes: 410, totalTryOns: 3820 },
  sunday_challenge: { totalTryOns: 1980, totalCheckIns: 1350 }
};

export const DailySeriesFeature: React.FC<DailySeriesFeatureProps> = ({ onTryOn, onNavigate, username }) => {
  const todayItem = useMemo(() => getTodaySeriesItem(), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => todayItem.dayIndex);
  const [firestoreStats, setFirestoreStats] = useState<Record<string, SeriesFirestoreStats>>(DEFAULT_METRICS);
  
  // Local interaction states per series for instant visual confirmation
  const [votedBattles, setVotedBattles] = useState<Record<string, 'A' | 'B'>>(() => {
    try {
      const saved = localStorage.getItem('kobella_series_voted_battles');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [votedViralSkip, setVotedViralSkip] = useState<Record<string, 'viral' | 'skip'>>(() => {
    try {
      const saved = localStorage.getItem('kobella_series_voted_viral');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [checkedInSeries, setCheckedInSeries] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('kobella_series_checkins');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [wearRatings, setWearRatings] = useState<Record<string, 'absolutely' | 'maybe' | 'not_for_me'>>(() => {
    try {
      const saved = localStorage.getItem('kobella_series_wear_ratings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeStepTab, setActiveStepTab] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active series is the currently selected day (defaults to today's series rotating on a 24h cycle)
  const activeSeries = useMemo(() => {
    return DAILY_SERIES_LIST.find(item => item.dayIndex === selectedDayIndex) || todayItem;
  }, [selectedDayIndex, todayItem]);

  // Real-time Firestore sync for the active series metrics
  useEffect(() => {
    const seriesKey = activeSeries.seriesKey;
    const seriesDocRef = doc(db, 'daily_series', seriesKey);

    const unsubscribe = onSnapshot(
      seriesDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SeriesFirestoreStats;
          setFirestoreStats(prev => ({
            ...prev,
            [seriesKey]: {
              ...DEFAULT_METRICS[seriesKey],
              ...data
            }
          }));
        }
      },
      (err) => {
        console.warn('Firestore daily_series sync notice (using local cache):', err);
      }
    );

    return () => unsubscribe();
  }, [activeSeries.seriesKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // 1. Handle Try-On click & track counter
  const handlePerformTryOn = (preset: PresetLook, label?: string) => {
    trackShadeTried(preset.name, activeSeries.seriesTitle, preset.eyeshadowColor || preset.lipColor || '#E91E63');
    onTryOn(preset);
    showToast(`Loaded ${preset.name} into Live Try-On!`);

    // Increment try-on counter in Firestore
    const seriesKey = activeSeries.seriesKey;
    try {
      const seriesDocRef = doc(db, 'daily_series', seriesKey);
      setDoc(seriesDocRef, {
        seriesKey: seriesKey,
        dayName: activeSeries.dayName,
        totalTryOns: increment(1),
        lastUpdated: Date.now()
      }, { merge: true }).catch((err) => {
        console.log('Stats sync cached:', err);
      });
      // Optimistic update
      setFirestoreStats(prev => ({
        ...prev,
        [seriesKey]: {
          ...prev[seriesKey],
          totalTryOns: (prev[seriesKey]?.totalTryOns || 1000) + 1
        }
      }));
    } catch {
      // Ignored
    }
  };

  // 2. Handle Shade Battle Vote
  const handleVoteShadeBattle = async (choice: 'A' | 'B') => {
    const seriesKey = activeSeries.seriesKey;
    if (votedBattles[seriesKey]) {
      showToast(`You already cast your vote for this battle!`);
      return;
    }

    const nextVoted = { ...votedBattles, [seriesKey]: choice };
    setVotedBattles(nextVoted);
    localStorage.setItem('kobella_series_voted_battles', JSON.stringify(nextVoted));

    if (activeSeries.shadeBattleData) {
      trackProductCompared(
        activeSeries.shadeBattleData.shadeA.name,
        activeSeries.shadeBattleData.shadeB.name,
        'Daily Series: Shade Battle',
        choice === 'A' ? activeSeries.shadeBattleData.shadeA.name : activeSeries.shadeBattleData.shadeB.name
      );
    }

    const shadeName = choice === 'A' 
      ? activeSeries.shadeBattleData?.shadeA.name 
      : activeSeries.shadeBattleData?.shadeB.name;
    showToast(`✦ Vote cast for ${shadeName}!`);

    // Optimistic
    setFirestoreStats(prev => {
      const current = prev[seriesKey] || DEFAULT_METRICS[seriesKey];
      return {
        ...prev,
        [seriesKey]: {
          ...current,
          votesA: choice === 'A' ? (current.votesA || 0) + 1 : current.votesA,
          votesB: choice === 'B' ? (current.votesB || 0) + 1 : current.votesB,
        }
      };
    });

    try {
      const seriesDocRef = doc(db, 'daily_series', seriesKey);
      await setDoc(seriesDocRef, {
        seriesKey: seriesKey,
        dayName: activeSeries.dayName,
        votesA: choice === 'A' ? increment(1) : increment(0),
        votesB: choice === 'B' ? increment(1) : increment(0),
        lastUpdated: Date.now()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore vote update error:', error);
    }
  };

  // 3. Handle Viral or Skip Vote
  const handleVoteViralSkip = async (verdict: 'viral' | 'skip') => {
    const seriesKey = activeSeries.seriesKey;
    if (votedViralSkip[seriesKey]) {
      showToast(`You already voted on this trend!`);
      return;
    }

    const nextVoted = { ...votedViralSkip, [seriesKey]: verdict };
    setVotedViralSkip(nextVoted);
    localStorage.setItem('kobella_series_voted_viral', JSON.stringify(nextVoted));

    showToast(verdict === 'viral' ? '🔥 Voted VIRAL!' : '❌ Voted SKIP!');

    // Optimistic
    setFirestoreStats(prev => {
      const current = prev[seriesKey] || DEFAULT_METRICS[seriesKey];
      return {
        ...prev,
        [seriesKey]: {
          ...current,
          viralVotes: verdict === 'viral' ? (current.viralVotes || 0) + 1 : current.viralVotes,
          skipVotes: verdict === 'skip' ? (current.skipVotes || 0) + 1 : current.skipVotes,
        }
      };
    });

    try {
      const seriesDocRef = doc(db, 'daily_series', seriesKey);
      await setDoc(seriesDocRef, {
        seriesKey: seriesKey,
        dayName: activeSeries.dayName,
        viralVotes: verdict === 'viral' ? increment(1) : increment(0),
        skipVotes: verdict === 'skip' ? increment(1) : increment(0),
        lastUpdated: Date.now()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore viral/skip error:', error);
    }
  };

  // 4. Handle General Check-In / "Tried It" / "Unlock"
  const handleSeriesCheckIn = async (actionLabel: string) => {
    const seriesKey = activeSeries.seriesKey;
    const isAlreadyChecked = checkedInSeries[seriesKey];

    const nextState = { ...checkedInSeries, [seriesKey]: !isAlreadyChecked };
    setCheckedInSeries(nextState);
    localStorage.setItem('kobella_series_checkins', JSON.stringify(nextState));

    if (!isAlreadyChecked) {
      showToast(`✨ ${actionLabel} recorded!`);
      // Optimistic
      setFirestoreStats(prev => {
        const current = prev[seriesKey] || DEFAULT_METRICS[seriesKey];
        return {
          ...prev,
          [seriesKey]: {
            ...current,
            totalCheckIns: (current.totalCheckIns || 0) + 1
          }
        };
      });

      // Telemetry tracking
      trackSeriesCheckIn(seriesKey, activeSeries.dayName, activeSeries.preset?.name || activeSeries.seriesTitle);

      try {
        const seriesDocRef = doc(db, 'daily_series', seriesKey);
        await setDoc(seriesDocRef, {
          seriesKey: seriesKey,
          dayName: activeSeries.dayName,
          totalCheckIns: increment(1),
          lastUpdated: Date.now()
        }, { merge: true });
      } catch (error) {
        console.warn('Firestore check-in error:', error);
      }
    } else {
      showToast(`Removed check-in.`);
    }
  };

  // 5. Handle Try It Tuesday "Would you wear it?" feedback
  const handleSelectWearRating = async (choice: 'absolutely' | 'maybe' | 'not_for_me') => {
    const seriesKey = activeSeries.seriesKey;
    const lookName = activeSeries.preset?.name || activeSeries.seriesTitle || 'Try It Tuesday Look';
    const nextState = { ...wearRatings, [seriesKey]: choice };
    setWearRatings(nextState);
    localStorage.setItem('kobella_series_wear_ratings', JSON.stringify(nextState));

    const labels = {
      absolutely: '“Absolutely!” ✨',
      maybe: '“Maybe” 🤔',
      not_for_me: '“Not for me”'
    };
    showToast(`Recorded: ${labels[choice]}`);

    // Update optimistic stats
    setFirestoreStats(prev => {
      const current = prev[seriesKey] || DEFAULT_METRICS[seriesKey];
      const ratingKey = `wear_rating_${choice}` as keyof SeriesFirestoreStats;
      return {
        ...prev,
        [seriesKey]: {
          ...current,
          [ratingKey]: ((current[ratingKey] as number) || 0) + 1,
          totalCheckIns: (current.totalCheckIns || 0) + 1
        }
      };
    });

    // Telemetry and Firebase recording
    trackTryItFeedback(seriesKey, lookName, choice);

    try {
      const seriesDocRef = doc(db, 'daily_series', seriesKey);
      await setDoc(seriesDocRef, {
        seriesKey: seriesKey,
        dayName: activeSeries.dayName,
        [`wear_rating_${choice}`]: increment(1),
        lastUpdated: Date.now()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore wear rating sync error:', error);
    }
  };

  // Handle Make Your Version click
  const handleMakeYourVersion = async () => {
    const seriesKey = activeSeries.seriesKey;
    const lookName = activeSeries.preset?.name || activeSeries.seriesTitle || 'Try It Tuesday Look';
    
    // Telemetry & Firebase recording
    trackDailySeriesRemix(seriesKey, lookName);
    
    try {
      const seriesDocRef = doc(db, 'daily_series', seriesKey);
      await setDoc(seriesDocRef, {
        seriesKey: seriesKey,
        dayName: activeSeries.dayName,
        remixCount: increment(1),
        lastUpdated: Date.now()
      }, { merge: true });
    } catch (err) {
      console.debug('Firestore remix count update skipped');
    }

    handlePerformTryOn(activeSeries.preset);
    onNavigate('sandbox');
  };

  // Calculate Shade Battle percentages
  const currentStats = firestoreStats[activeSeries.seriesKey] || DEFAULT_METRICS[activeSeries.seriesKey];
  const votesA = currentStats.votesA ?? 1840;
  const votesB = currentStats.votesB ?? 1290;
  const totalBattleVotes = votesA + votesB || 1;
  const percentA = Math.round((votesA / totalBattleVotes) * 100);
  const percentB = 100 - percentA;

  // Calculate Viral or Skip percentages
  const viralVotes = currentStats.viralVotes ?? 2450;
  const skipVotes = currentStats.skipVotes ?? 410;
  const totalViralVotes = viralVotes + skipVotes || 1;
  const percentViral = Math.round((viralVotes / totalViralVotes) * 100);
  const percentSkip = 100 - percentViral;

  return (
    <section id="daily-recurring-series" className="w-full max-w-full overflow-hidden space-y-3 text-left relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-4 right-4 z-40 px-3.5 py-1.5 rounded-full bg-black/90 text-white text-xs font-bold shadow-lg flex items-center gap-2 border border-white/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E91E63] animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION HEADER & DIVIDER: LIVE NOW (Top Left Section Header for the cards) */}
      <div className="flex items-center gap-2.5 pt-1 pb-0.5 px-0.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50/95 border border-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.4)] text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-[0.16em] text-emerald-800 animate-pulse transition-all">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            {/* Outer rapid ping wave */}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90 duration-500" />
            {/* Second wider ambient ping wave */}
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-300 opacity-60 duration-1000" />
            {/* Luminous beacon core */}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_#10B981,0_0_16px_#34D399]" />
          </span>
          <span className="tracking-wider">LIVE NOW</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-emerald-300/40 via-[#EDE7E3]/60 to-transparent" />
      </div>

      {/* 1. TRY IT TUESDAY: SHORTER SLEEK LANDSCAPE CARD */}
      <div 
        onClick={() => handlePerformTryOn(activeSeries.preset)}
        className="group relative w-full max-w-full rounded-2xl sm:rounded-3xl overflow-hidden aspect-[2.4/1] sm:aspect-[3/1] min-h-[140px] sm:min-h-[160px] max-h-[195px] bg-stone-900 border border-[#EDE7E3] shadow-sm cursor-pointer flex flex-col justify-between p-3.5 sm:p-5 select-none transition-transform duration-300 hover:shadow-md"
      >
        {/* Background Look Image */}
        <img 
          src={activeSeries.heroImage} 
          alt={activeSeries.seriesTitle} 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {/* Ambient Dark Scrim Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none" />

        {/* Top Badges Row */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span 
              className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs backdrop-blur-md"
              style={{ 
                backgroundColor: activeSeries.badgeBg, 
                color: activeSeries.badgeText,
              }}
            >
              ✦ {activeSeries.badge}
            </span>
          </div>

          {/* Preset Formula Tag */}
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[9.5px] sm:text-[10px] font-bold border border-white/20 hidden sm:inline-block">
            {activeSeries.preset.name}
          </span>
        </div>

        {/* Bottom Content & Try-On Action Row */}
        <div className="relative z-10 flex items-end justify-between gap-2 pt-2">
          <div className="space-y-0.5 max-w-[72%]">
            <p className="text-[9.5px] sm:text-[10.5px] text-[#F7C6D7] font-extrabold uppercase tracking-widest font-satoshi">
              Formula Feature
            </p>
            <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-tight drop-shadow-sm font-satoshi truncate">
              {activeSeries.preset.name || activeSeries.seriesTitle}
            </h3>
          </div>

          {/* Arrow Try-On Button */}
          <button
            id="btn-try-tuesday-arrow"
            onClick={(e) => {
              e.stopPropagation();
              handlePerformTryOn(activeSeries.preset);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 shadow-sm hover:scale-105 active:scale-95 cursor-pointer shrink-0 border border-[#EBC9D6]"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2A1715]" />
            <span className="hidden xs:inline">TRY ON</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2A1715] stroke-[2.5]" />
          </button>
        </div>
      </div>

          {/* DYNAMIC INTERACTIVE MODULE PER SERIES TYPE */}
          <div className="pt-2 border-t border-[#EDE7E3]/80">
            
            {/* 1. WEDNESDAY: SHADE BATTLE INTERACTIVE HEAD-TO-HEAD */}
            {activeSeries.type === 'shade_battle' && activeSeries.shadeBattleData && (
              <div className="space-y-4 bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE7E3]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-extrabold text-[#E91E63] uppercase tracking-widest">
                      ✦ LIVE SHADE SHOWDOWN
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-black">
                      {activeSeries.shadeBattleData.title}
                    </h5>
                    <p className="text-xs text-stone-500 font-medium">
                      {activeSeries.shadeBattleData.subtitle}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-stone-600">
                    Total Community Votes: <span className="text-black font-extrabold">{totalBattleVotes.toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#881337] flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#4c0519] inline-block border border-stone-200" />
                      {activeSeries.shadeBattleData.shadeA.name} ({percentA}%)
                    </span>
                    <span className="text-[#ea580c] flex items-center gap-1.5">
                      {activeSeries.shadeBattleData.shadeB.name} ({percentB}%)
                      <span className="w-3 h-3 rounded-full bg-[#f97316] inline-block border border-stone-200" />
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-stone-100 overflow-hidden flex border border-[#EDE7E3]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentA}%` }}
                      transition={{ duration: 0.6 }}
                      className="bg-gradient-to-r from-[#4c0519] to-[#881337] h-full" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentB}%` }}
                      transition={{ duration: 0.6 }}
                      className="bg-gradient-to-r from-[#ea580c] to-[#fb923c] h-full" 
                    />
                  </div>
                </div>

                {/* Side-by-Side 2 Shade Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Shade A Card */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    votedBattles[activeSeries.seriesKey] === 'A' 
                      ? 'border-[#881337] bg-[#FFF0F3] ring-2 ring-[#881337]/20' 
                      : 'border-[#EDE7E3] bg-[#FAF6F4]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl shadow-xs border-2 border-white shrink-0 flex items-center justify-center text-white"
                        style={{ backgroundColor: activeSeries.shadeBattleData.shadeA.colorHex }}
                      >
                        <Sparkles className="w-4 h-4 opacity-80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h6 className="text-xs sm:text-sm font-bold text-black truncate">
                            {activeSeries.shadeBattleData.shadeA.name}
                          </h6>
                          {votedBattles[activeSeries.seriesKey] === 'A' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#881337] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium">
                          Finish: {activeSeries.shadeBattleData.shadeA.finish}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EDE7E3]">
                      <button
                        onClick={() => handlePerformTryOn(activeSeries.shadeBattleData!.shadeA.preset, 'Shade A')}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-black border border-[#EDE7E3] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-[#E91E63]" />
                        <span>Try Shade A</span>
                      </button>
                      <button
                        onClick={() => handleVoteShadeBattle('A')}
                        disabled={!!votedBattles[activeSeries.seriesKey]}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          votedBattles[activeSeries.seriesKey] === 'A'
                            ? 'bg-[#881337] text-white shadow-xs'
                            : votedBattles[activeSeries.seriesKey]
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              : 'bg-[#2A1715] hover:bg-black text-white'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{votedBattles[activeSeries.seriesKey] === 'A' ? 'Voted' : 'Vote A'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Shade B Card */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    votedBattles[activeSeries.seriesKey] === 'B' 
                      ? 'border-[#ea580c] bg-[#FFF7ED] ring-2 ring-[#ea580c]/20' 
                      : 'border-[#EDE7E3] bg-[#FAF6F4]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl shadow-xs border-2 border-white shrink-0 flex items-center justify-center text-white"
                        style={{ backgroundColor: activeSeries.shadeBattleData.shadeB.colorHex }}
                      >
                        <Sparkles className="w-4 h-4 opacity-80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h6 className="text-xs sm:text-sm font-bold text-black truncate">
                            {activeSeries.shadeBattleData.shadeB.name}
                          </h6>
                          {votedBattles[activeSeries.seriesKey] === 'B' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium">
                          Finish: {activeSeries.shadeBattleData.shadeB.finish}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EDE7E3]">
                      <button
                        onClick={() => handlePerformTryOn(activeSeries.shadeBattleData!.shadeB.preset, 'Shade B')}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-black border border-[#EDE7E3] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-[#E91E63]" />
                        <span>Try Shade B</span>
                      </button>
                      <button
                        onClick={() => handleVoteShadeBattle('B')}
                        disabled={!!votedBattles[activeSeries.seriesKey]}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          votedBattles[activeSeries.seriesKey] === 'B'
                            ? 'bg-[#ea580c] text-white shadow-xs'
                            : votedBattles[activeSeries.seriesKey]
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              : 'bg-[#2A1715] hover:bg-black text-white'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{votedBattles[activeSeries.seriesKey] === 'B' ? 'Voted' : 'Vote B'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. SATURDAY: VIRAL OR SKIP INTERACTIVE VERDICT */}
            {activeSeries.type === 'viral_skip' && activeSeries.viralOrSkipData && (
              <div className="space-y-4 bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE7E3]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-extrabold text-[#db2777] uppercase tracking-widest">
                      ✦ BEAUTY TREND DEBUNK & TEST
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-black">
                      {activeSeries.viralOrSkipData.trendName}
                    </h5>
                    <p className="text-xs text-stone-500 font-medium">
                      Source: {activeSeries.viralOrSkipData.platformSource}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-stone-600">
                    Community Verdict: <span className="text-[#db2777] font-black">{percentViral}% Viral</span> vs <span className="text-stone-500 font-bold">{percentSkip}% Skip</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF6F4] border border-[#EDE7E3] text-xs text-stone-700 font-medium leading-relaxed">
                  <span className="font-bold text-black">How to recreate this hack: </span>
                  {activeSeries.viralOrSkipData.hackDescription}
                </div>

                {/* Progress verdict bar */}
                <div className="h-3 rounded-full bg-stone-100 overflow-hidden flex border border-[#EDE7E3]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentViral}%` }}
                    transition={{ duration: 0.6 }}
                    className="bg-gradient-to-r from-[#db2777] to-[#f43f5e] h-full" 
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentSkip}%` }}
                    transition={{ duration: 0.6 }}
                    className="bg-stone-400 h-full" 
                  />
                </div>

                {/* Interactive Verdict Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => handlePerformTryOn(activeSeries.preset)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-black border border-[#EDE7E3] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#E91E63]" />
                    <span>Test Technique on Camera</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVoteViralSkip('viral')}
                      disabled={!!votedViralSkip[activeSeries.seriesKey]}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        votedViralSkip[activeSeries.seriesKey] === 'viral'
                          ? 'bg-[#db2777] text-white shadow-md'
                          : votedViralSkip[activeSeries.seriesKey]
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-[#db2777] hover:bg-[#be185d] text-white'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-white" />
                      <span>{votedViralSkip[activeSeries.seriesKey] === 'viral' ? 'Voted Viral 🔥' : 'Rate: VIRAL 🔥'}</span>
                    </button>

                    <button
                      onClick={() => handleVoteViralSkip('skip')}
                      disabled={!!votedViralSkip[activeSeries.seriesKey]}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        votedViralSkip[activeSeries.seriesKey] === 'skip'
                          ? 'bg-stone-800 text-white shadow-md'
                          : votedViralSkip[activeSeries.seriesKey]
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-white hover:bg-stone-100 text-stone-800 border border-[#EDE7E3]'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{votedViralSkip[activeSeries.seriesKey] === 'skip' ? 'Voted Skip ❌' : 'Rate: SKIP ❌'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. THURSDAY: BUILD MY LOOK LAYER RECIPE */}
            {activeSeries.type === 'build_look' && activeSeries.buildMyLookData && (
              <div className="space-y-4 sm:space-y-5 rounded-[26px] sm:rounded-[30px] p-5 sm:p-7 bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_10px_30px_rgba(180,140,120,0.06),inset_0_1px_2px_rgba(255,255,255,0.95)]">
                {/* Header & Save Pill */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#A85A3C] uppercase tracking-[0.2em] block">
                      DECONSTRUCTED FORMULA LAYERS
                    </span>
                    <h4 className="font-ultra-disney font-editorial font-serif text-2xl sm:text-[30px] font-normal text-[#1F1916] tracking-tight leading-tight">
                      {activeSeries.buildMyLookData.recipeName}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSeriesCheckIn('Recipe Saved')}
                    className={`shrink-0 self-start px-4 sm:px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center gap-2 border transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.9)] ${
                      checkedInSeries[activeSeries.seriesKey]
                        ? 'bg-[#A85A3C] text-white border-[#A85A3C]'
                        : 'bg-white/60 hover:bg-white/85 text-[#3D2E28] border-white/90 hover:border-[#E8DDD4]'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${checkedInSeries[activeSeries.seriesKey] ? 'fill-white text-white' : 'text-[#3D2E28] stroke-[1.75]'}`} />
                    <span>{checkedInSeries[activeSeries.seriesKey] ? 'SAVED TO BOOK' : 'SAVE RECIPE'}</span>
                  </button>
                </div>

                {/* 2x2 Grid of Layer Tiles */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
                  {activeSeries.buildMyLookData.layers.map((layer, idx) => {
                    const isSelected = activeStepTab === idx;
                    
                    // Specific spherical gloss gradient for each layer marble
                    const marbleGradients: Record<number, string> = {
                      1: 'radial-gradient(circle at 35% 30%, #FFF5D8 0%, #F6CF82 45%, #D4983E 100%)',
                      2: 'radial-gradient(circle at 35% 30%, #E9A286 0%, #C86846 45%, #8C391E 100%)',
                      3: 'radial-gradient(circle at 35% 30%, #764C3C 0%, #462215 45%, #1C0C07 100%)',
                      4: 'radial-gradient(circle at 35% 30%, #D8916F 0%, #9C5029 45%, #58210A 100%)',
                    };

                    return (
                      <div 
                        key={layer.step}
                        onClick={() => setActiveStepTab(idx)}
                        className={`p-4 sm:p-5 rounded-[22px] text-left cursor-pointer transition-all duration-300 relative select-none overflow-hidden ${
                          isSelected
                            ? 'bg-[#FFF9F3]/60 backdrop-blur-xl border border-[#F0C9AC] shadow-[0_2px_12px_rgba(180,140,120,0.05),inset_0_1px_2px_rgba(255,255,255,0.95)]'
                            : 'bg-white/40 hover:bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_2px_10px_rgba(180,140,120,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.9)]'
                        }`}
                      >
                        {/* Top row: Tracked uppercase layer label & 3D sphere swatch */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-[11px] font-semibold text-[#A85A3C] uppercase tracking-[0.18em]">
                            LAYER {layer.step}
                          </span>
                          <span 
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/50 relative shadow-[0_3px_6px_rgba(0,0,0,0.18),inset_0_1px_2px_rgba(255,255,255,0.85),inset_0_-1.5px_2px_rgba(0,0,0,0.25)] shrink-0" 
                            style={{ 
                              background: marbleGradients[layer.step] || layer.colorHex 
                            }}
                          />
                        </div>

                        {/* Layer title & subtitle */}
                        <h5 className="font-ultra-disney font-serif text-[16px] sm:text-[18px] font-normal text-[#1F1916] leading-snug mt-2.5">
                          {layer.name}
                        </h5>
                        <p className="text-[11px] sm:text-xs text-[#7A6B64] font-normal leading-snug mt-0.5 sm:mt-1">
                          {layer.product}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Glass Pro Tip & Open Editor Banner */}
                <div className="rounded-[22px] p-3.5 sm:p-4 bg-white/50 backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(180,140,120,0.04),inset_0_1px_2px_rgba(255,255,255,0.95)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/70 border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.02)] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 fill-[#A85A3C] text-[#A85A3C]" viewBox="0 0 24 24">
                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                      </svg>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-ultra-disney font-serif text-[13px] sm:text-[14px] font-semibold text-[#A85A3C] block leading-tight">
                        Layer {activeSeries.buildMyLookData.layers[activeStepTab].step} Pro Tip:
                      </span>
                      <p className="text-[11px] sm:text-xs text-[#4A3B35] font-normal leading-snug">
                        {activeSeries.buildMyLookData.layers[activeStepTab].note}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      handlePerformTryOn(activeSeries.preset);
                      onNavigate('sandbox');
                    }}
                    className="shrink-0 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#EBDDCF]/65 hover:bg-[#EBDDCF]/85 active:scale-95 text-[#633420] text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_2px_8px_rgba(140,90,60,0.08)] transition-all cursor-pointer border border-[#D5C1AE]/80 text-center"
                  >
                    OPEN LAYER EDITOR
                  </button>
                </div>
              </div>
            )}

            {/* 4. MONDAY: NEW DROP SWATCHES & WISHLIST */}
            {activeSeries.type === 'new_drop' && activeSeries.newDropData && (
              <div className="space-y-4 bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE7E3]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-extrabold text-[#E91E63] uppercase tracking-widest">
                      ✦ LABORATORY COLOR RELEASE
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-black">
                      {activeSeries.newDropData.dropName} · {activeSeries.newDropData.formulaType}
                    </h5>
                  </div>
                  <button
                    onClick={() => handleSeriesCheckIn('Added to Drop Wishlist')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                      checkedInSeries[activeSeries.seriesKey]
                        ? 'bg-[#EBC9D6] text-[#2A1715] border-[#EBC9D6]'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-[#EDE7E3]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{checkedInSeries[activeSeries.seriesKey] ? 'Wishlist Added ✨' : 'Wishlist Drop'}</span>
                  </button>
                </div>

                {/* Swatches Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeSeries.newDropData.swatches.map((swatch) => (
                    <div 
                      key={swatch.name}
                      onClick={() => handlePerformTryOn(activeSeries.preset)}
                      className="group/swatch p-3 rounded-xl border border-[#EDE7E3] bg-[#FAF6F4] hover:bg-stone-100 transition-all cursor-pointer text-left flex items-center gap-2.5"
                    >
                      <span 
                        className="w-8 h-8 rounded-lg shadow-2xs border border-white shrink-0 group-hover/swatch:scale-105 transition-transform"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <div className="min-w-0">
                        <h6 className="text-xs font-bold text-black truncate leading-tight">{swatch.name}</h6>
                        <span className="text-[9.5px] text-stone-500 font-medium block">{swatch.finish}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. TUESDAY: TRY IT TUESDAY - SKINNY SKINNY AFTER TRYING WORKFLOW */}
            {activeSeries.type === 'try_it' && (
              <div className="space-y-2">
                {!checkedInSeries[activeSeries.seriesKey] ? (
                  /* PRE-TRY STATE: Skinny Compact Prompt */
                  <div className="flex items-center justify-between gap-3 bg-white rounded-2xl p-3 sm:p-3.5 border border-[#EDE7E3] shadow-2xs">
                    <div className="space-y-0.5 text-left">
                      <h6 className="text-xs sm:text-[13px] font-bold text-stone-900 leading-tight">
                        Tested this formula?
                      </h6>
                      <p className="text-[11px] text-stone-500 font-medium">
                        Rate if you'd wear it with the community
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSeriesCheckIn('Checked in: Tried Today Look')}
                        className="px-3.5 py-1.5 rounded-full bg-[#2A1715] hover:bg-black text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#E91E63]" />
                        <span>I Tried It ✨</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* AFTER TRYING STATE: Skinny, Sleek, Rounded Card */
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#EDE7E3] space-y-3 text-left shadow-2xs"
                  >
                    {/* Header: AFTER TRYING & Small Round ✓ Tried badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                        AFTER TRYING
                      </span>
                      <button
                        onClick={() => handleSeriesCheckIn('Checked in: Tried Today Look')}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Click to toggle status"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Tried</span>
                      </button>
                    </div>

                    {/* Question: Would you wear it? */}
                    <div className="space-y-2">
                      <h5 className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight">
                        Would you wear it?
                      </h5>

                      {/* 3 Small, Round, Skinny Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'absolutely', label: 'Absolutely' },
                          { key: 'maybe', label: 'Maybe' },
                          { key: 'not_for_me', label: 'Not for me' }
                        ].map(({ key, label }) => {
                          const isSelected = wearRatings[activeSeries.seriesKey] === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleSelectWearRating(key as 'absolutely' | 'maybe' | 'not_for_me')}
                              className={`py-1.5 px-2 rounded-full border text-[11px] sm:text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center whitespace-nowrap ${
                                isSelected
                                  ? 'bg-[#2A1715] text-white border-[#2A1715] shadow-xs'
                                  : 'bg-[#FAF6F4] hover:bg-stone-100 text-stone-700 border-[#EDE7E3]'
                              }`}
                            >
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action: Skinny MAKE YOUR VERSION → */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={handleMakeYourVersion}
                        className="w-full py-2 sm:py-2.5 px-4 rounded-full bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer border border-[#EBC9D6]"
                      >
                        <span>MAKE YOUR VERSION</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* 6. FRIDAY / SUNDAY: CHECK-IN & COMMUNITY PARTICIPATION */}
            {(activeSeries.type === 'tonight_face' || activeSeries.type === 'challenge') && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE7E3]">
                <div className="space-y-0.5">
                  <h6 className="text-xs sm:text-sm font-bold text-black">
                    {activeSeries.type === 'tonight_face' && "Friday Night Glam Check-In"}
                    {activeSeries.type === 'challenge' && "Sunday Weekly Challenge Registration"}
                  </h6>
                  <p className="text-xs text-stone-500 font-medium">
                    {activeSeries.type === 'tonight_face' && "Rock this look tonight and tag @TryOnBeauty for repost features."}
                    {activeSeries.type === 'challenge' && "Submit your look before Sunday midnight to qualify for the Hall of Fame."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSeriesCheckIn(
                      activeSeries.type === 'tonight_face' ? 'Checked in for Tonight' : 'Registered for Challenge'
                    )}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      checkedInSeries[activeSeries.seriesKey]
                        ? 'bg-[#2A1715] text-white shadow-md'
                        : 'bg-white hover:bg-stone-50 text-stone-900 border border-[#EDE7E3]'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${checkedInSeries[activeSeries.seriesKey] ? 'text-[#E91E63]' : 'text-stone-400'}`} />
                    <span>
                      {checkedInSeries[activeSeries.seriesKey] 
                        ? 'Checked In ✨' 
                        : (activeSeries.type === 'tonight_face' ? 'Check In 🍸' : 'Enter Contest 🏆')}
                    </span>
                  </button>

                  <button
                    onClick={() => handlePerformTryOn(activeSeries.preset)}
                    className="px-4 py-2 rounded-xl bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs border border-[#EBC9D6]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Live Try On</span>
                  </button>
                </div>
              </div>
            )}

          </div>

    </section>
  );
};
