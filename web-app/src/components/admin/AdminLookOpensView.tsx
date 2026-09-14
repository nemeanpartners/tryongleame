import React, { useState } from 'react';
import { 
  Eye, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Sparkles, 
  TrendingUp, 
  Download, 
  Play, 
  Calendar,
  Layers,
  CheckCircle2,
  BarChart3,
  Clock
} from 'lucide-react';
import { LookOpenMetric, trackLookOpened } from '../../lib/analytics';

interface AdminLookOpensViewProps {
  lookOpens: LookOpenMetric[];
  onTryOnLook?: (lookName: string) => void;
  onRefresh?: () => void;
}

export const AdminLookOpensView: React.FC<AdminLookOpensViewProps> = ({
  lookOpens,
  onTryOnLook,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'opens' | 'conversion' | 'dwell'>('opens');
  const [simulatedMsg, setSimulatedMsg] = useState<string | null>(null);

  // Categories list
  const categories = ['all', ...Array.from(new Set(lookOpens.map(l => l.category)))];

  // Filtering
  const filtered = lookOpens
    .filter(look => {
      const matchesSearch = look.lookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            look.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'all' || look.category === selectedCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortBy === 'opens') return b.opensCount - a.opensCount;
      if (sortBy === 'conversion') return b.conversionToTryOnRate - a.conversionToTryOnRate;
      if (sortBy === 'dwell') return b.avgDwellSeconds - a.avgDwellSeconds;
      return 0;
    });

  const totalOpens = lookOpens.reduce((acc, curr) => acc + curr.opensCount, 0);
  const totalUnique = lookOpens.reduce((acc, curr) => acc + curr.uniqueUsers, 0);
  const avgConversion = (lookOpens.reduce((acc, curr) => acc + curr.conversionToTryOnRate, 0) / (lookOpens.length || 1)).toFixed(1);

  // Simulate a live open event
  const handleSimulateOpen = async (look: LookOpenMetric) => {
    await trackLookOpened(look.lookId, look.lookName, look.category);
    setSimulatedMsg(`Logged live open event for "${look.lookName}"!`);
    setTimeout(() => setSimulatedMsg(null), 3000);
    if (onRefresh) onRefresh();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Look Name,Category,Opens Count,Unique Users,Avg Dwell (s),Try-On Conversion (%)\n';
    const rows = filtered.map(l => `"${l.lookName}","${l.category}",${l.opensCount},${l.uniqueUsers},${l.avgDwellSeconds},${l.conversionToTryOnRate}%`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `look_opens_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* HEADER & METRIC SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Which Looks Get Opened
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time telemetry tracking look discovery, card taps, preview expansions & camera conversions.
          </p>
        </div>

        {/* Quick stat chips */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Opens</span>
            <span className="text-sm font-black text-stone-900">{totalOpens.toLocaleString()}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Unique Visitors</span>
            <span className="text-sm font-black text-stone-900">{totalUnique.toLocaleString()}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Avg Try-On Rate</span>
            <span className="text-sm font-black text-emerald-700">{avgConversion}%</span>
          </div>
        </div>
      </div>

      {simulatedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{simulatedMsg}</span>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Filter by look name or aesthetic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#bc8381]"
          />
        </div>

        {/* Category Pills & Sort */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="opens">Sort: Most Opens</option>
            <option value="conversion">Sort: Highest Try-On %</option>
            <option value="dwell">Sort: Longest Dwell Time</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* LOOKS DETAILED RANKING GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((look, index) => {
          const maxOpens = lookOpens[0]?.opensCount || 1;
          const openShare = Math.round((look.opensCount / totalOpens) * 100);

          return (
            <div 
              key={look.lookId}
              className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left group"
            >
              <div className="space-y-3">
                {/* Image & Header */}
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-20 rounded-2xl overflow-hidden bg-stone-900 shrink-0 border border-stone-200 relative">
                    <img 
                      src={look.coverImage || 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=300'} 
                      alt={look.lookName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-black flex items-center justify-center">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        {look.category}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {openShare}% of total
                      </span>
                    </div>
                    <h3 className="text-base font-black text-stone-900 truncate">
                      {look.lookName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-stone-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1 font-bold text-stone-800">
                        <Eye className="w-3.5 h-3.5 text-stone-400" />
                        {look.opensCount.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-bold text-emerald-600">
                        <Sparkles className="w-3.5 h-3.5" />
                        {look.conversionToTryOnRate}% try-on
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                    <span>Discovery Volume</span>
                    <span className="font-bold text-stone-700">{look.uniqueUsers.toLocaleString()} unique users</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-400 to-[#732729] rounded-full"
                      style={{ width: `${Math.round((look.opensCount / maxOpens) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Avg Dwell Time on Look */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Avg Dwell Time
                  </span>
                  <span className="font-bold text-stone-800">
                    {Math.floor(look.avgDwellSeconds / 60)}m {look.avgDwellSeconds % 60}s
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleSimulateOpen(look)}
                  className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-rose-500" />
                  <span>+1 Open Event</span>
                </button>

                {onTryOnLook && (
                  <button
                    type="button"
                    onClick={() => onTryOnLook(look.lookName)}
                    className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#ff7a9e]" />
                    <span>Launch Look</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
