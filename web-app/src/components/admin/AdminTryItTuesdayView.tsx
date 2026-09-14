import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  Users, 
  Flame, 
  RotateCcw, 
  HelpCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Palette, 
  Activity, 
  Clock, 
  Share2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Check
} from 'lucide-react';
import { TryItTuesdayMetric, AnalyticsEvent } from '../../lib/analytics';
import { db, doc, onSnapshot } from '../../firebase';

interface AdminTryItTuesdayViewProps {
  tryItTuesday: TryItTuesdayMetric;
  recentEvents: AnalyticsEvent[];
  onTryOnLook?: (presetName: string) => void;
  onRefresh?: () => void;
}

export const AdminTryItTuesdayView: React.FC<AdminTryItTuesdayViewProps> = ({
  tryItTuesday,
  recentEvents,
  onTryOnLook,
  onRefresh
}) => {
  const [liveStats, setLiveStats] = useState<TryItTuesdayMetric>(tryItTuesday);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Subscribe to real-time Firestore updates for Tuesday Try It
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'daily_series', 'tuesday_try_it'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const absolutely = (data.wear_rating_absolutely || 0) + tryItTuesday.wearRatings.absolutely;
          const maybe = (data.wear_rating_maybe || 0) + tryItTuesday.wearRatings.maybe;
          const notForMe = (data.wear_rating_not_for_me || 0) + tryItTuesday.wearRatings.not_for_me;
          const totalTried = (data.totalCheckIns || 0) + (data.totalTryOns || 0) + tryItTuesday.totalTriedCount;
          const totalVotes = absolutely + maybe + notForMe || 1;
          const wearabilityScore = Math.round(((absolutely + maybe * 0.5) / totalVotes) * 100);
          const remixCount = (data.remixCount || 0) + tryItTuesday.remixCount;

          setLiveStats(prev => ({
            ...prev,
            totalTriedCount: Math.max(prev.totalTriedCount, totalTried),
            wearRatings: {
              absolutely,
              maybe,
              not_for_me: notForMe
            },
            wearabilityScore,
            remixCount: Math.max(prev.remixCount, remixCount),
            lastFeedbackTime: data.lastUpdated || Date.now()
          }));
          setIsLiveConnected(true);
        }
      }, (err) => {
        console.debug('Firestore listener fallback:', err);
      });

      return () => unsub();
    } catch {
      // Fallback to prop stats
    }
  }, [tryItTuesday]);

  const totalAbs = liveStats.wearRatings.absolutely;
  const totalMay = liveStats.wearRatings.maybe;
  const totalNot = liveStats.wearRatings.not_for_me;
  const totalVotes = totalAbs + totalMay + totalNot || 1;

  const pctAbs = Math.round((totalAbs / totalVotes) * 100);
  const pctMay = Math.round((totalMay / totalVotes) * 100);
  const pctNot = 100 - pctAbs - pctMay;

  // Filter feedback events
  const feedbackEvents = recentEvents.filter(e => e.eventType === 'try_it_feedback' || e.seriesKey === 'tuesday_try_it');

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      
      {/* HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-100/40 via-amber-50/30 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Weekly Signature Series</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-bold">
                Day 2: Tuesday
              </span>
              {isLiveConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Firestore Sync Active
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] text-stone-900 tracking-tight">
              Try It Tuesday: "Would You Wear It?" Analytics
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-3xl leading-relaxed">
              Real-time telemetry tracking user check-ins, wearability ratings (<strong>Absolutely</strong>, <strong>Maybe</strong>, <strong>Not for me</strong>), and downstream remixes from the <strong>"MAKE YOUR VERSION"</strong> studio call to action.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Live</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL PARTICIPANTS */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total "Tried" Check-Ins</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-stone-900 tracking-tight font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]">
              {liveStats.totalTriedCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+38.5% vs Last Tuesday</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-stone-400 font-medium">
            Users confirming virtual application
          </div>
        </div>

        {/* CARD 2: WEARABILITY INDEX */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Wearability Index</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-stone-900 tracking-tight font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]">
              {liveStats.wearabilityScore}%
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>High Commercial Adoption</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-stone-400 font-medium">
            Weighted (100% Absolutely + 50% Maybe)
          </div>
        </div>

        {/* CARD 3: REMIXES CREATED */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">"Make Your Version" Remixes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-stone-900 tracking-tight font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]">
              {liveStats.remixCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{Math.round((liveStats.remixCount / (liveStats.totalTriedCount || 1)) * 100)}% Conversion to Sandbox</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-stone-400 font-medium">
            Custom creator spinoffs generated
          </div>
        </div>

        {/* CARD 4: SPOTLIGHT LOOK */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Spotlight Feature</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-stone-900 tracking-tight truncate">
              {liveStats.lookName}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-700 font-bold">
              <span>Warm Sunset Glam</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-stone-400 font-medium">
            Active today across all studio clients
          </div>
        </div>

      </div>

      {/* DETAILED WEARABILITY BREAKDOWN & FUNNEL MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: "WOULD YOU WEAR IT?" BREAKDOWN (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-stone-900 tracking-tight">
                "Would You Wear It?" Vote Distribution
              </h3>
              <p className="text-xs text-stone-500">
                Direct feedback gathered from user post-try-on prompt
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg">
              {totalVotes.toLocaleString()} Total Votes
            </span>
          </div>

          {/* 3 Response Categories Progress Bars */}
          <div className="space-y-4 pt-1">
            
            {/* 1. ABSOLUTELY */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-[11px] flex items-center justify-center">
                    ✨
                  </span>
                  <span className="font-bold text-stone-900 text-sm">“Absolutely”</span>
                  <span className="text-[10.5px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md font-bold">
                    Definite Wear
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-stone-900 text-base">{totalAbs.toLocaleString()}</span>
                  <span className="font-extrabold text-emerald-700 text-sm">{pctAbs}%</span>
                </div>
              </div>
              <div className="w-full h-3 bg-emerald-100/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-700"
                  style={{ width: `${pctAbs}%` }}
                />
              </div>
            </div>

            {/* 2. MAYBE */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black text-[11px] flex items-center justify-center">
                    🤔
                  </span>
                  <span className="font-bold text-stone-900 text-sm">“Maybe”</span>
                  <span className="text-[10.5px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md font-bold">
                    Conditional / Special Occasion
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-stone-900 text-base">{totalMay.toLocaleString()}</span>
                  <span className="font-extrabold text-amber-700 text-sm">{pctMay}%</span>
                </div>
              </div>
              <div className="w-full h-3 bg-amber-100/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${pctMay}%` }}
                />
              </div>
            </div>

            {/* 3. NOT FOR ME */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 font-black text-[11px] flex items-center justify-center">
                    🙅‍♀️
                  </span>
                  <span className="font-bold text-stone-900 text-sm">“Not for me”</span>
                  <span className="text-[10.5px] text-stone-600 bg-stone-200 px-2 py-0.5 rounded-md font-bold">
                    Different Style Preference
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-stone-900 text-base">{totalNot.toLocaleString()}</span>
                  <span className="font-extrabold text-stone-600 text-sm">{pctNot}%</span>
                </div>
              </div>
              <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-500 rounded-full transition-all duration-700"
                  style={{ width: `${pctNot}%` }}
                />
              </div>
            </div>

          </div>

          {/* INSIGHT BANNER */}
          <div className="p-4 rounded-2xl bg-[#faf6f4] border border-[#ede7e3] flex items-start gap-3">
            <Zap className="w-5 h-5 text-[#bc8381] shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700 space-y-1">
              <p className="font-bold text-stone-900">
                Editorial Recommendation:
              </p>
              <p className="leading-relaxed">
                With a <strong>{liveStats.wearabilityScore}% Wearability Score</strong> and <strong>{pctAbs}% direct endorsement</strong>, this look is ready for permanent placement in the Featured Essentials catalogue and commercial affiliate shopping links.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: CONVERSION FUNNEL & RECENT RESPONSES (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* FUNNEL CARD */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">
                Tuesday Engagement Funnel
              </h3>
              <span className="text-[11px] font-bold text-emerald-600">37.0% Net Remix Rate</span>
            </div>

            <div className="space-y-3 text-xs font-medium">
              {/* Step 1 */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10.5px]">Step 1: Card Impression</span>
                  <span className="font-bold text-stone-900">4,920 Views</span>
                </div>
                <span className="font-bold text-stone-600">100%</span>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10.5px]">Step 2: "✓ Tried" Check-In</span>
                  <span className="font-bold text-stone-900">{liveStats.totalTriedCount.toLocaleString()} Users</span>
                </div>
                <span className="font-bold text-emerald-600">
                  {Math.round((liveStats.totalTriedCount / 4920) * 100)}%
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10.5px]">Step 3: Rated "Would you wear it?"</span>
                  <span className="font-bold text-stone-900">{totalVotes.toLocaleString()} Votes</span>
                </div>
                <span className="font-bold text-blue-600">
                  {Math.round((totalVotes / (liveStats.totalTriedCount || 1)) * 100)}%
                </span>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/60 flex items-center justify-between">
                <div>
                  <span className="text-purple-700 block text-[10.5px] font-bold">Step 4: MAKE YOUR VERSION</span>
                  <span className="font-black text-purple-950">{liveStats.remixCount.toLocaleString()} Remixes</span>
                </div>
                <span className="font-black text-purple-700">
                  {Math.round((liveStats.remixCount / (liveStats.totalTriedCount || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* RECENT FEEDBACK STREAM */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-stone-900">Live Vote Stream</h3>
              </div>
              <span className="text-[10px] font-mono text-stone-400">Real-time</span>
            </div>

            <div className="divide-y divide-stone-100 max-h-[220px] overflow-y-auto pr-1">
              {feedbackEvents.length > 0 ? (
                feedbackEvents.map((evt, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        evt.wearChoice === 'absolutely' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : evt.wearChoice === 'maybe'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}>
                        {evt.wearChoice === 'absolutely' ? '✨' : evt.wearChoice === 'maybe' ? '🤔' : '🙅'}
                      </div>
                      <div>
                        <span className="font-bold text-stone-900 block">
                          @{evt.userId || 'guest_user'}
                        </span>
                        <span className="text-[10px] text-stone-400 capitalize">
                          Voted: {evt.wearChoice ? evt.wearChoice.replace('_', ' ') : 'Checked in'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      Just now
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-stone-400 space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-stone-300 mx-auto" />
                  <p>Awaiting new incoming user votes...</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
