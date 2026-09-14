import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Activity, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Download, 
  Play, 
  Pause, 
  Zap,
  BarChart2,
  PieChart
} from 'lucide-react';
import { LookOpenMetric, trackDwellTime } from '../../lib/analytics';

interface AdminDwellTimeViewProps {
  lookOpens: LookOpenMetric[];
  activeLiveSeconds: number;
  totalSecondsSpent: number;
  onRefresh?: () => void;
}

export const AdminDwellTimeView: React.FC<AdminDwellTimeViewProps> = ({
  lookOpens,
  activeLiveSeconds,
  totalSecondsSpent,
  onRefresh
}) => {
  const [liveTickerActive, setLiveTickerActive] = useState(true);

  // Format seconds to human readable
  const formatSeconds = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${s}s`;
    return `${minutes}m ${s}s`;
  };

  const grandTotalSecs = totalSecondsSpent + activeLiveSeconds;

  // Dwell by Page benchmarks
  const pageDwellData = [
    { page: 'Live Studio Camera / Sandbox', avgSeconds: 264, totalHours: 182, percentage: 46.2 },
    { page: 'Looks Gallery & Reels Feed', avgSeconds: 158, totalHours: 94, percentage: 23.8 },
    { page: 'Shade Edit & Product Drops', avgSeconds: 142, totalHours: 58, percentage: 14.7 },
    { page: 'Inspiration Moodboards & Feed', avgSeconds: 98, totalHours: 36, percentage: 9.1 },
    { page: 'Community Challenges & Voting', avgSeconds: 84, totalHours: 25, percentage: 6.2 }
  ];

  // Session Duration Distribution Brackets
  const durationBrackets = [
    { label: '< 30s (Quick Scan)', percentage: 12.4, count: 2480, color: 'bg-stone-300' },
    { label: '30s - 1m (Casual Preview)', percentage: 21.6, count: 4320, color: 'bg-amber-300' },
    { label: '1m - 3m (Formula Build)', percentage: 38.2, count: 7640, color: 'bg-emerald-400' },
    { label: '3m - 5m (Deep Studio Try-On)', percentage: 19.5, count: 3900, color: 'bg-blue-500' },
    { label: '> 5m (Power Creator Session)', percentage: 8.3, count: 1660, color: 'bg-purple-600' }
  ];

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* HEADER WITH LIVE TICKER */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              How Many Seconds People Spend (Dwell Time)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time session duration analytics, engagement depth per look, and camera dwell time.
          </p>
        </div>

        {/* Big Live Seconds Counter */}
        <div className="p-4 rounded-2xl bg-stone-900 text-white border border-stone-800 shadow-md text-right shrink-0">
          <div className="flex items-center gap-1.5 justify-end text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Session Time</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
            {formatSeconds(activeLiveSeconds)}
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">
            Cumulative Total: {formatSeconds(grandTotalSecs)}
          </div>
        </div>
      </div>

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Avg Session Length</span>
          <div className="text-2xl font-black text-stone-900 mt-1">2m 52s</div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> +18s vs industry standard
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Sandbox Camera Dwell</span>
          <div className="text-2xl font-black text-stone-900 mt-1">4m 24s</div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
            <Zap className="w-3 h-3 text-amber-500" /> High retention zone
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Total Hours Spent</span>
          <div className="text-2xl font-black text-stone-900 mt-1">395 hrs</div>
          <span className="text-[11px] text-stone-400 font-medium mt-0.5">Across all studio visits</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Stickiness Ratio</span>
          <div className="text-2xl font-black text-stone-900 mt-1">78.4%</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-0.5">&gt; 1 min engagement</span>
        </div>

      </div>

      {/* TWO COLUMN COMPARISON: DWELL TIME BY LOOK & DWELL TIME BY APP ZONE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DWELL TIME BY LOOK (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-black text-stone-900 tracking-tight">
              Seconds Spent by Makeup Look
            </h3>
            <p className="text-xs text-stone-500">
              Which signature aesthetics keep users in the try-on mirror the longest
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {lookOpens.map((look, idx) => {
              const maxDwell = 240; // 4 mins scale
              const pct = Math.min(100, Math.round((look.avgDwellSeconds / maxDwell) * 100));

              return (
                <div key={look.lookId} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800">{look.lookName}</span>
                      <span className="text-[10px] text-stone-400 font-medium">({look.category})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">
                        {look.avgDwellSeconds}s ({Math.floor(look.avgDwellSeconds / 60)}m {look.avgDwellSeconds % 60}s)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-[#732729] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DURATION DISTRIBUTION & APP ZONES (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* BRACKETS */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-stone-900 tracking-tight">
              Session Duration Distribution
            </h3>

            <div className="space-y-3">
              {durationBrackets.map((bracket, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-stone-700 font-bold">{bracket.label}</span>
                    <span className="text-stone-900 font-black">{bracket.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden flex">
                    <div className={`h-full ${bracket.color}`} style={{ width: `${bracket.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PAGE DWELL BREAKDOWN */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-stone-900 tracking-tight">
              Engagement by App Page
            </h3>

            <div className="divide-y divide-stone-100">
              {pageDwellData.map((page, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900 block">{page.page}</span>
                    <span className="text-[10px] text-stone-400">{page.totalHours} hrs cumulative</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-700">{page.avgSeconds}s avg</span>
                    <span className="text-[10px] text-stone-400 block">{page.percentage}% share</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
