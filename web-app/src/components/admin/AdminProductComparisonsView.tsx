import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  ArrowRightLeft, 
  Trophy, 
  CheckCircle2, 
  Download, 
  Sparkles,
  TrendingUp,
  Percent
} from 'lucide-react';
import { ProductComparisonMetric, trackProductCompared } from '../../lib/analytics';

interface AdminProductComparisonsViewProps {
  productComparisons: ProductComparisonMetric[];
  onRefresh?: () => void;
}

export const AdminProductComparisonsView: React.FC<AdminProductComparisonsViewProps> = ({
  productComparisons,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [simulatedMsg, setSimulatedMsg] = useState<string | null>(null);

  const filtered = productComparisons.filter(c => 
    c.productA.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.productB.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalComparisons = productComparisons.reduce((acc, curr) => acc + curr.compareCount, 0);

  const handleSimulateCompare = async (comp: ProductComparisonMetric) => {
    await trackProductCompared(comp.productA, comp.productB, comp.category, comp.preferredProduct);
    setSimulatedMsg(`Logged live comparison between "${comp.productA}" & "${comp.productB}"!`);
    setTimeout(() => setSimulatedMsg(null), 3000);
    if (onRefresh) onRefresh();
  };

  const handleExportCSV = () => {
    const headers = 'Product A,Product B,Category,Compare Count,Preferred Winner,Win Rate A (%),Win Rate B (%)\n';
    const rows = filtered.map(c => `"${c.productA}","${c.productB}","${c.category}",${c.compareCount},"${c.preferredProduct}",${c.winRateA}%,${c.winRateB}%`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product_comparisons_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* HEADER & METRIC SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Which Products Are Compared
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time telemetry measuring side-by-side swatch evaluations, texture battles & product preference rates.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Comparisons</span>
            <span className="text-sm font-black text-stone-900">{totalComparisons.toLocaleString()}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-blue-50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Top Matchup</span>
            <span className="text-sm font-black text-blue-900">Peptide Glass vs Rose Dew</span>
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
            placeholder="Search compared formulas or categories..."
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

      {/* COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((comp) => {
          return (
            <div 
              key={comp.id}
              className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {comp.category}
                </span>
                <span className="text-xs font-bold text-stone-500">
                  {comp.compareCount.toLocaleString()} Head-to-Head Tests
                </span>
              </div>

              {/* Head-to-Head Visual Blocks */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Product A */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  comp.preferredProduct === comp.productA 
                    ? 'bg-blue-50/50 border-blue-200 text-blue-950' 
                    : 'bg-stone-50 border-stone-200/70 text-stone-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-stone-400">Formula A</span>
                    {comp.preferredProduct === comp.productA && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Trophy className="w-2.5 h-2.5" /> Winner
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black mt-1 leading-snug">{comp.productA}</h4>
                  <div className="mt-2 text-sm font-black text-blue-700 font-mono">
                    {comp.winRateA}%
                  </div>
                </div>

                {/* Product B */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  comp.preferredProduct === comp.productB 
                    ? 'bg-blue-50/50 border-blue-200 text-blue-950' 
                    : 'bg-stone-50 border-stone-200/70 text-stone-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-stone-400">Formula B</span>
                    {comp.preferredProduct === comp.productB && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Trophy className="w-2.5 h-2.5" /> Winner
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black mt-1 leading-snug">{comp.productB}</h4>
                  <div className="mt-2 text-sm font-black text-stone-600 font-mono">
                    {comp.winRateB}%
                  </div>
                </div>
              </div>

              {/* Comparative Win Bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${comp.winRateA}%` }} />
                  <div className="h-full bg-stone-400 transition-all duration-500" style={{ width: `${comp.winRateB}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-stone-400 font-medium pt-0.5">
                  <span>{comp.productA}</span>
                  <span>{comp.productB}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Preference ratio {comp.winRateA} : {comp.winRateB}</span>
                <button
                  type="button"
                  onClick={() => handleSimulateCompare(comp)}
                  className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                  <span>+1 Compare Event</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
