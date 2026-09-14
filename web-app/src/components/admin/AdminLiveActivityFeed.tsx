import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Eye, 
  Palette, 
  Clock, 
  Layers, 
  Share2, 
  ShoppingBag, 
  Sparkles,
  Play,
  Pause,
  Filter,
  Trash2
} from 'lucide-react';
import { AnalyticsEvent, AnalyticsEventType } from '../../lib/analytics';

interface AdminLiveActivityFeedProps {
  recentEvents: AnalyticsEvent[];
  onClearLocalEvents?: () => void;
}

export const AdminLiveActivityFeed: React.FC<AdminLiveActivityFeedProps> = ({
  recentEvents,
  onClearLocalEvents
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [isPaused, setIsPaused] = useState(false);

  // Mock live events streaming if local events are small
  const [streamEvents, setStreamEvents] = useState<AnalyticsEvent[]>([
    {
      eventType: 'look_opened',
      timestamp: Date.now() - 1000 * 12,
      lookName: 'Clean Girl',
      category: 'Clean Aesthetic',
      userId: 'sarah_m_22'
    },
    {
      eventType: 'shade_tried',
      timestamp: Date.now() - 1000 * 25,
      shadeName: 'Peptide Glass Glaze',
      shadeHex: '#fb7185',
      category: 'lipstick',
      userId: 'maya_beauty'
    },
    {
      eventType: 'shop_clicked',
      timestamp: Date.now() - 1000 * 48,
      productName: 'Glazed Peptide Lip Glaze',
      brand: 'KOBELLA Studio',
      retailer: 'Sephora',
      userId: 'chloe_k'
    },
    {
      eventType: 'product_compared',
      timestamp: Date.now() - 1000 * 72,
      productA: 'Peptide Glass Glaze',
      productB: 'Rose Dew Tint',
      category: 'Lip Formulas',
      userId: 'elena_v'
    },
    {
      eventType: 'look_shared',
      timestamp: Date.now() - 1000 * 95,
      lookName: 'Cherry Cola',
      platform: 'TikTok',
      userId: 'jessica_t'
    },
    {
      eventType: 'dwell_time',
      timestamp: Date.now() - 1000 * 120,
      durationSeconds: 195,
      page: 'Live Studio Camera',
      lookName: 'Glass Skin Glam',
      userId: 'christinalucas'
    }
  ]);

  // Combine stream events with live user events from parent
  const allEvents = [...recentEvents, ...streamEvents].sort((a, b) => b.timestamp - a.timestamp);

  const filteredEvents = allEvents.filter(e => {
    if (filterType === 'all') return true;
    return e.eventType === filterType;
  });

  const getEventIcon = (type: AnalyticsEventType) => {
    switch (type) {
      case 'look_opened':
        return <Eye className="w-3.5 h-3.5 text-rose-500" />;
      case 'shade_tried':
        return <Palette className="w-3.5 h-3.5 text-purple-500" />;
      case 'dwell_time':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'product_compared':
        return <Layers className="w-3.5 h-3.5 text-blue-500" />;
      case 'look_shared':
        return <Share2 className="w-3.5 h-3.5 text-pink-500" />;
      case 'shop_clicked':
        return <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />;
      case 'try_it_feedback':
        return <Sparkles className="w-3.5 h-3.5 text-rose-600" />;
      case 'daily_series_remix':
        return <Palette className="w-3.5 h-3.5 text-purple-600" />;
      case 'series_checkin':
        return <Activity className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const getEventBadge = (type: AnalyticsEventType, wearChoice?: string) => {
    switch (type) {
      case 'look_opened':
        return <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Look Opened</span>;
      case 'shade_tried':
        return <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Shade Tried</span>;
      case 'dwell_time':
        return <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Dwell Time</span>;
      case 'product_compared':
        return <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Compared</span>;
      case 'look_shared':
        return <span className="bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Look Shared</span>;
      case 'shop_clicked':
        return <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Shop Click</span>;
      case 'try_it_feedback':
        return (
          <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase flex items-center gap-1">
            <span>Try It: {wearChoice === 'absolutely' ? '✨ Absolutely' : wearChoice === 'maybe' ? '🤔 Maybe' : '🙅 Not For Me'}</span>
          </span>
        );
      case 'daily_series_remix':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Make Your Version</span>;
      case 'series_checkin':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">Series Check-In</span>;
    }
  };

  const formatTimeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
              <span>Live Telemetry Stream</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </h3>
            <p className="text-xs text-stone-400">Streaming user interactions across all beauty modules</p>
          </div>
        </div>

        {/* Filter & Controls */}
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Event Types</option>
            <option value="try_it_feedback">Try It Tuesday Feedback</option>
            <option value="daily_series_remix">Make Your Version</option>
            <option value="series_checkin">Series Check-Ins</option>
            <option value="look_opened">Look Opens</option>
            <option value="shade_tried">Shade Tries</option>
            <option value="dwell_time">Dwell Time</option>
            <option value="product_compared">Comparisons</option>
            <option value="look_shared">Shares</option>
            <option value="shop_clicked">Shop Clicks</option>
          </select>
        </div>
      </div>

      {/* Events Feed Container */}
      <div className="divide-y divide-stone-100 max-h-[420px] overflow-y-auto pr-1">
        {filteredEvents.map((evt, idx) => (
          <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-stone-50/70 transition-colors px-2 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                {getEventIcon(evt.eventType)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {getEventBadge(evt.eventType, evt.wearChoice)}
                  <span className="font-bold text-stone-900">
                    {evt.lookName || evt.shadeName || evt.productName || (evt.productA ? `${evt.productA} vs ${evt.productB}` : 'User Event')}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2">
                  <span>User: @{evt.userId || 'anonymous'}</span>
                  {evt.durationSeconds && <span>• Duration: {evt.durationSeconds}s</span>}
                  {evt.platform && <span>• Shared via: {evt.platform}</span>}
                  {evt.retailer && <span>• Retailer: {evt.retailer}</span>}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-stone-400 whitespace-nowrap">
              {formatTimeAgo(evt.timestamp)}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
