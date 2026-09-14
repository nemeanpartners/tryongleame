import React, { useState } from 'react';
import { 
  Share2, 
  Search, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp,
  Instagram,
  Copy,
  ExternalLink,
  Flame
} from 'lucide-react';
import { LookShareMetric, trackLookShared } from '../../lib/analytics';

interface AdminLookSharesViewProps {
  lookShares: LookShareMetric[];
  onRefresh?: () => void;
}

export const AdminLookSharesView: React.FC<AdminLookSharesViewProps> = ({
  lookShares,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [simulatedMsg, setSimulatedMsg] = useState<string | null>(null);

  const filtered = lookShares
    .filter(s => s.lookName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.totalShares - a.totalShares);

  const totalShares = lookShares.reduce((acc, curr) => acc + curr.totalShares, 0);

  const handleSimulateShare = async (share: LookShareMetric, platform: string) => {
    await trackLookShared(share.lookId, share.lookName, platform);
    setSimulatedMsg(`Logged share event for "${share.lookName}" on ${platform}!`);
    setTimeout(() => setSimulatedMsg(null), 3000);
    if (onRefresh) onRefresh();
  };

  const handleExportCSV = () => {
    const headers = 'Look Name,Total Shares,Instagram,TikTok,Copy Link,Web Share,Pinterest\n';
    const rows = filtered.map(s => `"${s.lookName}",${s.totalShares},${s.platforms.instagram},${s.platforms.tiktok},${s.platforms.copyLink},${s.platforms.webShare},${s.platforms.pinterest}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `look_shares_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* HEADER & METRIC SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Which Looks Get Shared
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Viral distribution metrics across TikTok, Instagram Reels, direct links, and creative social exports.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Look Shares</span>
            <span className="text-sm font-black text-stone-900">{totalShares.toLocaleString()}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-pink-50 border border-pink-200">
            <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wider block">#1 Viral Platform</span>
            <span className="text-sm font-black text-pink-900">TikTok (47.8%)</span>
          </div>
        </div>
      </div>

      {simulatedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{simulatedMsg}</span>
        </div>
      )}

      {/* SEARCH & EXPORT */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search look name (e.g. Clean Girl, Cherry Cola, Glass Skin)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#bc8381]"
          />
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* SHARES RANKING CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((share, idx) => {
          const maxShares = lookShares[0]?.totalShares || 1;
          const sharePct = Math.round((share.totalShares / maxShares) * 100);

          return (
            <div 
              key={share.lookId}
              className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-4 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-black flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <h3 className="text-base font-black text-stone-900">{share.lookName}</h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-pink-600">{share.totalShares.toLocaleString()}</span>
                  <span className="text-[10px] text-stone-400 block">shares</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-400 to-rose-600 rounded-full"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              </div>

              {/* Platform breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">TikTok</span>
                  <span className="text-xs font-black text-stone-900">{share.platforms.tiktok}</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Instagram</span>
                  <span className="text-xs font-black text-stone-900">{share.platforms.instagram}</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Copy Link</span>
                  <span className="text-xs font-black text-stone-900">{share.platforms.copyLink}</span>
                </div>
              </div>

              {/* Quick Simulate Buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Simulate Share:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSimulateShare(share, 'tiktok')}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    + TikTok
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateShare(share, 'instagram')}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    + IG
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
