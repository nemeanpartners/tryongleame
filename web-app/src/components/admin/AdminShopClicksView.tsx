import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  DollarSign, 
  TrendingUp, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { ShopClickMetric, trackShopClick } from '../../lib/analytics';

interface AdminShopClicksViewProps {
  shopClicks: ShopClickMetric[];
  onRefresh?: () => void;
}

export const AdminShopClicksView: React.FC<AdminShopClicksViewProps> = ({
  shopClicks,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [retailerFilter, setRetailerFilter] = useState<string>('all');
  const [simulatedMsg, setSimulatedMsg] = useState<string | null>(null);

  const retailers = ['all', 'Sephora', 'Ulta Beauty', 'Brand Official', 'Nordstrom', 'Glossier'];

  const filtered = shopClicks
    .filter(p => {
      const matchesSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.lookSource.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRet = retailerFilter === 'all' || p.retailer === retailerFilter;
      return matchesSearch && matchesRet;
    })
    .sort((a, b) => b.clicksCount - a.clicksCount);

  const totalClicks = shopClicks.reduce((acc, curr) => acc + curr.clicksCount, 0);
  const totalRevenueIntent = shopClicks.reduce((acc, curr) => acc + curr.estimatedRevenue, 0);
  const avgConversion = (shopClicks.reduce((acc, curr) => acc + curr.conversionRate, 0) / (shopClicks.length || 1)).toFixed(1);

  const handleSimulateClick = async (prod: ShopClickMetric) => {
    await trackShopClick(prod.productId, prod.productName, prod.brand, prod.price, prod.retailer, prod.lookSource);
    setSimulatedMsg(`Logged live shop click for "${prod.productName}" via ${prod.retailer}!`);
    setTimeout(() => setSimulatedMsg(null), 3000);
    if (onRefresh) onRefresh();
  };

  const handleExportCSV = () => {
    const headers = 'Product Name,Brand,Price,Retailer Partner,Total Clicks,Conversion (%),Look Source,Est. Intent Value\n';
    const rows = filtered.map(p => `"${p.productName}","${p.brand}","${p.price}","${p.retailer}",${p.clicksCount},${p.conversionRate}%,"${p.lookSource}",$${p.estimatedRevenue}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop_clicks_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* HEADER & METRIC SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Which Products Get Shop Clicks
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            E-commerce checkout intent, affiliate conversions, and retailer referrals generated from virtual try-ons.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Shop Clicks</span>
            <span className="text-sm font-black text-stone-900">{totalClicks.toLocaleString()}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Est. Revenue Value</span>
            <span className="text-sm font-black text-emerald-900">${totalRevenueIntent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {simulatedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{simulatedMsg}</span>
        </div>
      )}

      {/* FILTER & EXPORT */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search product formula or brand (e.g., Peptide Glaze, Rare Beauty)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#bc8381]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select 
            value={retailerFilter}
            onChange={(e) => setRetailerFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
          >
            {retailers.map(r => (
              <option key={r} value={r}>{r === 'all' ? 'All Retailers' : r}</option>
            ))}
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

      {/* DETAILED PRODUCTS TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Product & Formula</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Retailer</th>
                <th className="py-3.5 px-4">Associated Look</th>
                <th className="py-3.5 px-4">Shop Clicks</th>
                <th className="py-3.5 px-4">CTR</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filtered.map((prod, idx) => {
                const maxClicks = shopClicks[0]?.clicksCount || 1;
                const barWidth = Math.round((prod.clicksCount / maxClicks) * 100);

                return (
                  <tr key={prod.productId} className="hover:bg-stone-50/60 transition-colors group">
                    
                    {/* Product Name */}
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                      {prod.productName}
                    </td>

                    {/* Brand */}
                    <td className="py-3.5 px-4 font-semibold text-stone-600">
                      {prod.brand}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-stone-900 font-mono">
                      {prod.price}
                    </td>

                    {/* Retailer */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10.5px]">
                        {prod.retailer}
                      </span>
                    </td>

                    {/* Associated Look */}
                    <td className="py-3.5 px-4 font-medium text-stone-500">
                      {prod.lookSource}
                    </td>

                    {/* Clicks */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-[130px]">
                        <div className="flex items-center justify-between font-bold text-stone-900">
                          <span>{prod.clicksCount.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* CTR */}
                    <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono">
                      {prod.conversionRate}%
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSimulateClick(prod)}
                        className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3 text-emerald-600" />
                        <span>+1 Click</span>
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
