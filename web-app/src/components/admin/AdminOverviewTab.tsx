import React from 'react';
import { 
  Eye, 
  Palette, 
  Clock, 
  Layers, 
  Share2, 
  ShoppingBag, 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  Users, 
  Sparkles,
  Zap,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { 
  AnalyticsSummary, 
  LookOpenMetric, 
  ShadeTryMetric, 
  ProductComparisonMetric, 
  LookShareMetric, 
  ShopClickMetric,
  TryItTuesdayMetric,
  AnalyticsEvent
} from '../../lib/analytics';

interface AdminOverviewTabProps {
  summary: AnalyticsSummary;
  lookOpens: LookOpenMetric[];
  shadesTried: ShadeTryMetric[];
  productComparisons: ProductComparisonMetric[];
  lookShares: LookShareMetric[];
  shopClicks: ShopClickMetric[];
  tryItTuesday?: TryItTuesdayMetric;
  recentEvents: AnalyticsEvent[];
  onSelectTab: (tabId: string) => void;
  activeLiveSeconds: number;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  summary,
  lookOpens,
  shadesTried,
  productComparisons,
  lookShares,
  shopClicks,
  tryItTuesday,
  recentEvents,
  onSelectTab,
  activeLiveSeconds
}) => {
  // Format seconds to human readable
  const formatSeconds = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  const totalDwellFormatted = formatSeconds(summary.totalSecondsSpent + activeLiveSeconds);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        
        {/* 1. LOOK OPENS */}
        <div 
          onClick={() => onSelectTab('looks')}
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#bc8381] transition-all cursor-pointer text-left relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Look Opens</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] text-stone-900 tracking-tight">
              {summary.totalLookOpens.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% this wk</span>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-stone-400 font-medium truncate">
            Top: {lookOpens[0]?.lookName || 'Clean Girl'}
          </div>
        </div>

        {/* 2. SHADES TRIED */}
        <div 
          onClick={() => onSelectTab('shades')}
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#bc8381] transition-all cursor-pointer text-left relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Shades Tried</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] text-stone-900 tracking-tight">
              {summary.totalShadeTryOns.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+24.1% try rate</span>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-stone-400 font-medium truncate">
            Top: {shadesTried[0]?.shadeName || 'Peptide Glass'}
          </div>
        </div>

        {/* 3. DWELL TIME (SECONDS SPENT) */}
        <div 
          onClick={() => onSelectTab('dwell')}
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#bc8381] transition-all cursor-pointer text-left relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Engagement</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] text-stone-900 tracking-tight">
              {totalDwellFormatted}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-600 font-bold">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Avg 2m 52s / session</span>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-stone-400 font-medium">
            Live active: {summary.activeLiveUsers} users
          </div>
        </div>

        {/* 4. PRODUCT COMPARISONS */}
        <div 
          onClick={() => onSelectTab('comparisons')}
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#bc8381] transition-all cursor-pointer text-left relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Compared</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] text-stone-900 tracking-tight">
              {summary.totalComparisons.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>5 active matchups</span>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-stone-400 font-medium truncate">
            Top: {productComparisons[0]?.productA} vs {productComparisons[0]?.productB}
          </div>
        </div>

        {/* 5. LOOK SHARES */}
        <div 
          onClick={() => onSelectTab('shares')}
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#bc8381] transition-all cursor-pointer text-left relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Look Shares</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] text-stone-900 tracking-tight">
              {summary.totalShares.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-pink-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+31.2% viral</span>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-stone-400 font-medium truncate">
            TikTok 48% • IG 36%
          </div>
        </div>

        {/* 6. SHOP CLICKS */}
        <div 
          onClick={() => onSelectTab('shop')}
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#bc8381] transition-all cursor-pointer text-left relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Shop Clicks</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] text-stone-900 tracking-tight">
              {summary.totalShopClicks.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>$540K+ Intent</span>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-stone-400 font-medium truncate">
            CTR 12.8% • Sephora #1
          </div>
        </div>

      </div>

      {/* TWO COLUMN PERFORMANCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* LEFT COLUMN: TOP PERFORMING LOOKS WITH REAL-TIME ENGAGEMENT BARS (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-stone-900 tracking-tight">
                Top Look Performance Matrix
              </h3>
              <p className="text-xs text-stone-500">
                Comparative ranking of opened looks and conversion to camera try-on
              </p>
            </div>
            <button 
              onClick={() => onSelectTab('looks')}
              className="text-xs font-bold text-[#876b5d] hover:text-stone-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All 9 Looks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar Chart list */}
          <div className="space-y-4 pt-2">
            {lookOpens.slice(0, 5).map((look, idx) => {
              const maxOpens = lookOpens[0]?.opensCount || 1;
              const pct = Math.round((look.opensCount / maxOpens) * 100);
              return (
                <div key={look.lookId} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-stone-800">{look.lookName}</span>
                      <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                        {look.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-stone-900">{look.opensCount.toLocaleString()} opens</span>
                      <span className="text-[11px] text-emerald-600 font-semibold">{look.conversionToTryOnRate}% try-on</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-[#bc8381] to-[#732729] rounded-full transition-all duration-700 group-hover:brightness-110"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span><strong>Clean Girl</strong> and <strong>Glass Skin Glam</strong> drive 42.8% of all studio engagement.</span>
            </div>
            <button 
              onClick={() => onSelectTab('looks')}
              className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: MOST TRIED SHADES & SWATCH RADIALS (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-stone-900 tracking-tight">
                Top Pigment Try-Ons
              </h3>
              <p className="text-xs text-stone-500">
                Most applied formulas across lips, eyes & blush
              </p>
            </div>
            <button 
              onClick={() => onSelectTab('shades')}
              className="text-xs font-bold text-[#876b5d] hover:text-stone-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {shadesTried.slice(0, 5).map((shade, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-7 h-7 rounded-full border border-stone-200 shadow-xs shrink-0 flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ backgroundColor: shade.shadeHex }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#bc8381] transition-colors">
                      {shade.shadeName}
                    </h4>
                    <p className="text-[10.5px] text-stone-400 capitalize">
                      {shade.category} • {shade.finish || 'Satin'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-stone-900">{shade.tryCount.toLocaleString()} tries</span>
                  <p className="text-[10px] text-stone-400 font-semibold">{shade.sharePercentage}% share</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <span className="text-xs font-semibold text-stone-500">Lip Formulas dominate with 49.4% of shade tries</span>
            <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-full">Lipstick #1</span>
          </div>
        </div>

      </div>

      {/* TRY IT TUESDAY: "WOULD YOU WEAR IT?" COMMUNITY WEARABILITY PULSE */}
      {tryItTuesday && (
        <div className="bg-gradient-to-br from-white via-rose-50/20 to-amber-50/30 rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-extrabold uppercase tracking-wide">
                  Tuesday Signature Series
                </span>
                <span className="text-xs text-stone-400 font-bold">•</span>
                <span className="text-xs text-stone-500 font-bold">{tryItTuesday.lookName}</span>
              </div>
              <h3 className="text-lg font-black text-stone-900 tracking-tight">
                Try It Tuesday: "Would You Wear It?" Wearability Pulse
              </h3>
              <p className="text-xs text-stone-500">
                Direct community sentiment collected immediately after users try on the Tuesday spotlight look.
              </p>
            </div>

            <button
              onClick={() => onSelectTab('tryit')}
              className="px-4 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-center"
            >
              <span>View Full Feedback Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* STAT 1: TOTAL PARTICIPANTS */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Checked In & Tried</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {tryItTuesday.totalTriedCount.toLocaleString()}
              </div>
              <div className="text-[10.5px] text-emerald-600 font-bold mt-1">
                Active Participants
              </div>
            </div>

            {/* STAT 2: WEARABILITY SCORE */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Wearability Score</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {tryItTuesday.wearabilityScore}%
              </div>
              <div className="text-[10.5px] text-stone-500 font-medium mt-1">
                Net Positive Acceptance
              </div>
            </div>

            {/* STAT 3: MAKE YOUR VERSION REMIXES */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">"Make Your Version"</span>
              <div className="text-2xl font-black text-purple-700 mt-1">
                {tryItTuesday.remixCount.toLocaleString()}
              </div>
              <div className="text-[10.5px] text-purple-600 font-bold mt-1">
                Studio Sandbox Creations
              </div>
            </div>

            {/* STAT 4: WEAR RATINGS BREAKDOWN */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Response Distribution</span>
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-emerald-700">✨ Absolutely</span>
                  <span className="text-stone-900">{tryItTuesday.wearRatings.absolutely.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-amber-700">🤔 Maybe</span>
                  <span className="text-stone-900">{tryItTuesday.wearRatings.maybe.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-stone-600">🙅 Not for me</span>
                  <span className="text-stone-900">{tryItTuesday.wearRatings.not_for_me.toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* BOTTOM METRICS ROW: PRODUCT COMPARISONS, VIRAL SHARES, SHOP CONVERSIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        
        {/* CARD 1: COMPARISONS HIGHLIGHT */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Head-to-Head Compare</h3>
            </div>
            <button 
              onClick={() => onSelectTab('comparisons')}
              className="text-[11px] font-bold text-[#876b5d] hover:text-stone-900 cursor-pointer"
            >
              See all
            </button>
          </div>

          <div className="space-y-3">
            {productComparisons.slice(0, 3).map((comp) => (
              <div key={comp.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span className="truncate max-w-[130px]">{comp.productA}</span>
                  <span className="text-stone-400 font-normal">vs</span>
                  <span className="truncate max-w-[130px]">{comp.productB}</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500" style={{ width: `${comp.winRateA}%` }} />
                  <div className="h-full bg-stone-400" style={{ width: `${comp.winRateB}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-stone-500 font-medium">
                  <span>{comp.winRateA}% prefer A</span>
                  <span>{comp.compareCount} compares</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2: VIRAL SHARES HIGHLIGHT */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Viral Shares by Look</h3>
            </div>
            <button 
              onClick={() => onSelectTab('shares')}
              className="text-[11px] font-bold text-[#876b5d] hover:text-stone-900 cursor-pointer"
            >
              See all
            </button>
          </div>

          <div className="space-y-3">
            {lookShares.slice(0, 3).map((share) => (
              <div key={share.lookId} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">{share.lookName}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                    <span>TT: {share.platforms.tiktok}</span>
                    <span>•</span>
                    <span>IG: {share.platforms.instagram}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-pink-600">{share.totalShares.toLocaleString()}</span>
                  <p className="text-[10px] text-stone-400 font-medium">shares</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 3: SHOP CLICKS HIGHLIGHT */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">E-Commerce Intent</h3>
            </div>
            <button 
              onClick={() => onSelectTab('shop')}
              className="text-[11px] font-bold text-[#876b5d] hover:text-stone-900 cursor-pointer"
            >
              See all
            </button>
          </div>

          <div className="space-y-3">
            {shopClicks.slice(0, 3).map((prod) => (
              <div key={prod.productId} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <div className="truncate max-w-[170px]">
                  <h4 className="text-xs font-bold text-stone-900 truncate">{prod.productName}</h4>
                  <p className="text-[10px] text-emerald-700 font-semibold">{prod.retailer} • {prod.price}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-700">{prod.clicksCount.toLocaleString()}</span>
                  <p className="text-[10px] text-stone-400 font-medium">clicks ({prod.conversionRate}%)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
