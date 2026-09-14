import React, { useState } from 'react';
import { 
  Palette, 
  Search, 
  Filter, 
  Download, 
  Sparkles, 
  CheckCircle2,
  TrendingUp,
  Tag,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ShadeTryMetric, trackShadeTried } from '../../lib/analytics';

interface AdminShadesTriedViewProps {
  shadesTried: ShadeTryMetric[];
  onRefresh?: () => void;
}

export const AdminShadesTriedView: React.FC<AdminShadesTriedViewProps> = ({
  shadesTried,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [simulatedMsg, setSimulatedMsg] = useState<string | null>(null);

  const categories = ['all', 'lipstick', 'eyeshadow', 'blush', 'highlighter'];

  const filtered = shadesTried
    .filter(s => {
      const matchesSearch = s.shadeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.associatedLook && s.associatedLook.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = categoryFilter === 'all' || s.category === categoryFilter;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => b.tryCount - a.tryCount);

  const totalTries = shadesTried.reduce((acc, curr) => acc + curr.tryCount, 0);

  const handleSimulateShade = async (shade: ShadeTryMetric) => {
    await trackShadeTried(shade.shadeName, shade.shadeHex, shade.category, shade.associatedLook);
    setSimulatedMsg(`Logged live try-on event for shade "${shade.shadeName}"!`);
    setTimeout(() => setSimulatedMsg(null), 3000);
    if (onRefresh) onRefresh();
  };

  const handleExportCSV = () => {
    const headers = 'Shade Name,Hex Code,Category,Finish,Try Count,Associated Look,Share (%)\n';
    const rows = filtered.map(s => `"${s.shadeName}","${s.shadeHex}","${s.category}","${s.finish || 'Satin'}",${s.tryCount},"${s.associatedLook || 'Catalog'}",${s.sharePercentage}%`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shades_tried_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* HEADER & METRIC SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Which Shades Get Tried
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time shade application telemetry across lips, eyeshadows, blush formulas, and shimmer pigments.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Shade Tries</span>
            <span className="text-sm font-black text-stone-900">{totalTries.toLocaleString()}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-purple-50 border border-purple-200">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Top Category</span>
            <span className="text-sm font-black text-purple-900">Lip Formulas (49.4%)</span>
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
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search shade name (e.g., Peptide Glass, Cola Syrup, Dark Roast)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#bc8381]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-stone-900 text-white shadow-2xs' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* DETAILED SHADES TABLE & GRID */}
      <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Shade & Swatch</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Texture / Finish</th>
                <th className="py-3.5 px-4">Associated Look</th>
                <th className="py-3.5 px-4">Try-On Volume</th>
                <th className="py-3.5 px-4">Share %</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filtered.map((shade, idx) => {
                const maxTries = shadesTried[0]?.tryCount || 1;
                const barWidth = Math.round((shade.tryCount / maxTries) * 100);

                return (
                  <tr key={idx} className="hover:bg-stone-50/60 transition-colors group">
                    
                    {/* Shade Name & Swatch */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-xl border border-stone-200 shadow-2xs shrink-0 flex items-center justify-center text-white text-[10px] font-black"
                          style={{ backgroundColor: shade.shadeHex }}
                        />
                        <div>
                          <span className="font-bold text-stone-900 block group-hover:text-purple-700 transition-colors">
                            {shade.shadeName}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400 uppercase">
                            {shade.shadeHex}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-bold text-[10.5px] uppercase tracking-wide">
                        {shade.category}
                      </span>
                    </td>

                    {/* Finish */}
                    <td className="py-3.5 px-4 font-medium text-stone-600">
                      {shade.finish || 'Satin Glaze'}
                    </td>

                    {/* Associated Look */}
                    <td className="py-3.5 px-4 font-bold text-stone-800">
                      {shade.associatedLook || 'Signature Catalog'}
                    </td>

                    {/* Try-On Volume with Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-[140px]">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                          <span>{shade.tryCount.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Share Percentage */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-stone-900 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[11px]">
                        {shade.sharePercentage}%
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSimulateShade(shade)}
                        className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>+1 Try</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
