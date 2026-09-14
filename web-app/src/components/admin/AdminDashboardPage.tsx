import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Eye, 
  Palette, 
  Clock, 
  Layers, 
  Share2, 
  ShoppingBag, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  Calendar, 
  Download, 
  RefreshCw, 
  ChevronRight,
  Zap,
  Sliders,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { 
  getAggregatedAnalytics, 
  AnalyticsSummary, 
  LookOpenMetric, 
  ShadeTryMetric, 
  ProductComparisonMetric, 
  LookShareMetric, 
  ShopClickMetric,
  AnalyticsEvent 
} from '../../lib/analytics';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminLookOpensView } from './AdminLookOpensView';
import { AdminShadesTriedView } from './AdminShadesTriedView';
import { AdminDwellTimeView } from './AdminDwellTimeView';
import { AdminProductComparisonsView } from './AdminProductComparisonsView';
import { AdminLookSharesView } from './AdminLookSharesView';
import { AdminShopClicksView } from './AdminShopClicksView';
import { AdminLiveActivityFeed } from './AdminLiveActivityFeed';
import { AdminTryItTuesdayView } from './AdminTryItTuesdayView';
import { AdminInquiriesView } from './AdminInquiriesView';

interface AdminDashboardPageProps {
  onNavigateHome: () => void;
  onTryOnLook?: (lookName: string) => void;
  currentUser?: {
    email?: string | null;
    displayName?: string | null;
    username?: string | null;
  };
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateHome,
  onTryOnLook,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'tryit' | 'looks' | 'shades' | 'dwell' | 'comparisons' | 'shares' | 'shop' | 'feed'>('overview');
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [activeLiveSeconds, setActiveLiveSeconds] = useState<number>(0);
  const [data, setData] = useState(() => getAggregatedAnalytics());
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live session second tracker ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLiveSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Periodic data refresh
  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData(getAggregatedAnalytics());
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 400);
  };

  const navItems = [
    { id: 'overview', label: 'Executive Pulse', icon: BarChart3, count: null },
    { id: 'inquiries', label: 'User Inquiries', icon: MessageSquare, count: 'Support' },
    { id: 'tryit', label: 'Try It Tuesday', icon: Sparkles, count: `${data.tryItTuesday?.wearabilityScore || 83}% Score` },
    { id: 'looks', label: 'Look Opens', icon: Eye, count: data.summary.totalLookOpens },
    { id: 'shades', label: 'Shades Tried', icon: Palette, count: data.summary.totalShadeTryOns },
    { id: 'dwell', label: 'Dwell Time', icon: Clock, count: '2m 52s' },
    { id: 'comparisons', label: 'Comparisons', icon: Layers, count: data.summary.totalComparisons },
    { id: 'shares', label: 'Look Shares', icon: Share2, count: data.summary.totalShares },
    { id: 'shop', label: 'Shop Clicks', icon: ShoppingBag, count: data.summary.totalShopClicks },
    { id: 'feed', label: 'Live Stream', icon: Activity, count: 'Live' }
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-20">
      
      {/* TOP EXECUTIVE BRAND BAR */}
      <div className="bg-stone-950 text-white border-b border-stone-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Brand & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Studio</span>
            </button>

            <div className="h-4 w-px bg-stone-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="font-['Playfair_Display',serif] text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span className="text-[#e0a96d]">KOBELLA</span>
                <span className="text-xs font-sans font-bold uppercase tracking-widest text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md">
                  Admin Intelligence
                </span>
              </span>
            </div>
          </div>

          {/* Admin User Info & Role Badge */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Engine Connected</span>
            </div>

            {/* Admin Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#2a1c18] border border-[#732729]/50 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#ff7a9e]" />
              <div className="text-left">
                <span className="font-bold text-[#ffb4c7] block leading-none">
                  {currentUser?.displayName || currentUser?.username || 'christinalucas'}
                </span>
                <span className="text-[9.5px] text-stone-400 font-mono">Tier 1 Super Admin</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* SUB-HEADER: TITLE, TIME RANGE & REFRESH */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] text-stone-900 tracking-tight">
              Executive Analytics & Consumer Behavior
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Live engagement tracking across look discovery, virtual try-ons, formula comparisons, viral sharing, and retail checkouts.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Range Selector */}
            <div className="bg-white p-1 rounded-2xl border border-stone-200 shadow-2xs flex items-center">
              {(['today', '7days', '30days', 'all'] as const).map(tr => (
                <button
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                    timeRange === tr 
                      ? 'bg-stone-900 text-white shadow-2xs' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tr === '7days' ? 'Last 7D' : tr === '30days' ? 'Last 30D' : tr}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="p-2.5 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-stone-900' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS BAR */}
        <div className="mt-6 border-b border-stone-200/90 overflow-x-auto scrollbar-none flex items-center gap-1 sm:gap-2 pb-px">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`group flex items-center gap-2 px-3.5 sm:px-4 py-3 rounded-t-2xl font-bold text-xs sm:text-[13px] transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                  isActive 
                    ? 'bg-white text-stone-950 border-stone-950 shadow-2xs' 
                    : 'text-stone-500 hover:text-stone-900 border-transparent hover:bg-stone-100/60'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#732729]' : 'text-stone-400 group-hover:text-stone-600'}`} />
                <span>{item.label}</span>
                {item.count !== null && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    isActive ? 'bg-stone-100 text-stone-900' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {typeof item.count === 'number' ? item.count.toLocaleString() : item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TAB CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {activeTab === 'overview' && (
          <AdminOverviewTab
            summary={data.summary}
            lookOpens={data.lookOpens}
            shadesTried={data.shadesTried}
            productComparisons={data.productComparisons}
            lookShares={data.lookShares}
            shopClicks={data.shopClicks}
            tryItTuesday={data.tryItTuesday}
            recentEvents={data.recentEvents}
            onSelectTab={(tabId) => setActiveTab(tabId as any)}
            activeLiveSeconds={activeLiveSeconds}
          />
        )}

        {activeTab === 'inquiries' && (
          <AdminInquiriesView
            adminEmail={currentUser?.email || 'christinalucas1216@gmail.com'}
            adminName={currentUser?.displayName || currentUser?.username || 'Christina Lucas (Admin)'}
          />
        )}

        {activeTab === 'tryit' && (
          <AdminTryItTuesdayView
            tryItTuesday={data.tryItTuesday}
            recentEvents={data.recentEvents}
            onTryOnLook={onTryOnLook}
            onRefresh={handleRefreshData}
          />
        )}

        {activeTab === 'looks' && (
          <AdminLookOpensView
            lookOpens={data.lookOpens}
            onTryOnLook={onTryOnLook}
            onRefresh={handleRefreshData}
          />
        )}

        {activeTab === 'shades' && (
          <AdminShadesTriedView
            shadesTried={data.shadesTried}
            onRefresh={handleRefreshData}
          />
        )}

        {activeTab === 'dwell' && (
          <AdminDwellTimeView
            lookOpens={data.lookOpens}
            activeLiveSeconds={activeLiveSeconds}
            totalSecondsSpent={data.summary.totalSecondsSpent}
            onRefresh={handleRefreshData}
          />
        )}

        {activeTab === 'comparisons' && (
          <AdminProductComparisonsView
            productComparisons={data.productComparisons}
            onRefresh={handleRefreshData}
          />
        )}

        {activeTab === 'shares' && (
          <AdminLookSharesView
            lookShares={data.lookShares}
            onRefresh={handleRefreshData}
          />
        )}

        {activeTab === 'shop' && (
          <AdminShopClicksView
            shopClicks={data.shopClicks}
            onRefresh={handleRefreshData}
          />
        )}

        {activeTab === 'feed' && (
          <AdminLiveActivityFeed
            recentEvents={data.recentEvents}
          />
        )}
      </div>

    </div>
  );
};
