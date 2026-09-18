import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Heart, 
  Search, 
  Plus, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  Sliders, 
  MessageSquare,
  Flame,
  Clock,
  ArrowRight,
  Palette
} from 'lucide-react';
import { LookRequest, PresetLook } from '../../types';
import { 
  seedRequestsIfEmpty, 
  createBuiltLookFromRequestInDb 
} from '../../lib/looksService';
import { 
  db, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  increment, 
  addDoc,
  handleFirestoreError, 
  OperationType 
} from '../../firebase';

interface CommunityRequestsViewProps {
  onLoadPreset: (preset: PresetLook) => void;
}

export const CommunityRequestsView: React.FC<CommunityRequestsViewProps> = ({ onLoadPreset }) => {
  const [requests, setRequests] = useState<LookRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'popular' | 'open' | 'released'>('all');
  
  // Create Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Full Face');
  const [newColors, setNewColors] = useState<string[]>(['#f43f5e', '#fb7185', '#be123c']);
  const [newRequester, setNewRequester] = useState<string>(() => {
    return localStorage.getItem('tryon_beauty_username') || localStorage.getItem('kobella_username') || '';
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Compile Formula Modal State
  const [compilingRequest, setCompilingRequest] = useState<LookRequest | null>(null);
  const [compilingName, setCompilingName] = useState<string>('');
  const [compilingDescription, setCompilingDescription] = useState<string>('');
  const [compilingEyeshadow, setCompilingEyeshadow] = useState<string>('#1d4ed8');
  const [compilingBlush, setCompilingBlush] = useState<string>('#f43f5e');
  const [compilingLip, setCompilingLip] = useState<string>('#be123c');
  const [compilingGlitter, setCompilingGlitter] = useState<number>(50);
  const [compilingFilter, setCompilingFilter] = useState<'none' | 'vintage' | 'warm-glow' | 'cool-cyber' | 'holographic'>('holographic');
  const [compilingLashes, setCompilingLashes] = useState<'none' | 'natural' | 'glam' | 'wispy'>('glam');
  const [releaseSuccess, setReleaseSuccess] = useState<boolean>(false);
  const [isReleasing, setIsReleasing] = useState<boolean>(false);

  // Track voted requests locally
  const [votedRequestIds, setVotedRequestIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_voted_look_requests') || '[]');
    } catch {
      return [];
    }
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const fetched = await seedRequestsIfEmpty();
      setRequests(fetched.sort((a, b) => b.votes - a.votes));
    } catch (err) {
      console.error('Error loading community requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleVoteRequest = async (reqId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (votedRequestIds.includes(reqId)) return;

    try {
      const docRef = doc(db, 'requests', reqId);
      await updateDoc(docRef, { votes: increment(1) }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `requests/${reqId}`);
      });
      
      const newVoted = [...votedRequestIds, reqId];
      setVotedRequestIds(newVoted);
      localStorage.setItem('tryon_beauty_voted_look_requests', JSON.stringify(newVoted));

      setRequests(prev =>
        prev.map(req => req.id === reqId ? { ...req, votes: req.votes + 1 } : req)
            .sort((a, b) => b.votes - a.votes)
      );
    } catch (err) {
      console.error('Error voting for request:', err);
    }
  };

  const handleOpenCompileForm = (req: LookRequest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompilingRequest(req);
    setCompilingName(req.title);
    setCompilingDescription(req.description);
    setCompilingEyeshadow(req.colors?.[0] || '#1d4ed8');
    setCompilingBlush(req.colors?.[1] || '#f43f5e');
    setCompilingLip(req.colors?.[2] || '#be123c');
    setCompilingGlitter(50);
    setCompilingFilter('holographic');
    setCompilingLashes('glam');
    setReleaseSuccess(false);
    setIsReleasing(false);
  };

  const handleCompileAndRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compilingRequest) return;
    setIsReleasing(true);
    try {
      const formulaPreset: PresetLook = {
        id: `compiled_${Date.now()}`,
        name: compilingName,
        description: compilingDescription,
        eyeshadowColor: compilingEyeshadow,
        eyeshadowOpacity: 0.7,
        blushColor: compilingBlush,
        blushOpacity: 0.5,
        lipColor: compilingLip,
        lipOpacity: 0.8,
        lipGloss: true,
        lashesStyle: compilingLashes,
        glitterLevel: compilingGlitter,
        filter: compilingFilter,
      };

      await createBuiltLookFromRequestInDb(compilingRequest.id, formulaPreset, compilingRequest.requestedBy);
      setReleaseSuccess(true);
      
      setRequests(prev => prev.map(r => r.id === compilingRequest.id ? { ...r, status: 'released' } : r));
      
      setTimeout(() => {
        setCompilingRequest(null);
        setReleaseSuccess(false);
      }, 1800);
    } catch (error) {
      console.error('Error compiling request:', error);
    } finally {
      setIsReleasing(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const requester = newRequester.trim() || 'beauty_lover';
      localStorage.setItem('tryon_beauty_username', requester);

      const requestPayload: Omit<LookRequest, 'id'> = {
        title: newTitle.trim(),
        description: newDescription.trim() || 'Custom community formula request.',
        category: newCategory,
        colors: newColors,
        requestedBy: requester,
        votes: 1,
        votedUsers: [],
        createdAt: Date.now(),
        status: 'requested',
        isPublic: true
      };

      const docRef = await addDoc(collection(db, 'requests'), requestPayload).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, 'requests');
      });

      const newReq: LookRequest = {
        id: docRef?.id || `req_${Date.now()}`,
        ...requestPayload
      };

      setRequests(prev => [newReq, ...prev]);
      
      // Auto-vote for own request
      const updatedVoted = [...votedRequestIds, newReq.id];
      setVotedRequestIds(updatedVoted);
      localStorage.setItem('tryon_beauty_voted_look_requests', JSON.stringify(updatedVoted));

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      console.error('Error creating request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryOnRequestFormula = (req: LookRequest) => {
    onLoadPreset({
      id: req.id,
      name: req.title,
      description: req.description,
      eyeshadowColor: req.colors?.[0] || '#1d4ed8',
      eyeshadowOpacity: 0.6,
      blushColor: req.colors?.[1] || '#f43f5e',
      blushOpacity: 0.4,
      lipColor: req.colors?.[2] || '#be123c',
      lipOpacity: 0.8,
      lipGloss: true,
      lashesStyle: 'glam',
      glitterLevel: 40,
      filter: 'none'
    });
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'popular') return req.votes >= 20;
    if (statusFilter === 'open') return req.status === 'requested' || req.status === 'selected' || req.status === 'being built';
    if (statusFilter === 'released') return req.status === 'released';

    return true;
  });

  const leadingRequest = requests.length > 0 ? requests[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-stone-800">

      {/* 1. TOP PIPELINE HIGHLIGHT - LEADING REQUEST */}
      {leadingRequest && (
        <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-[#3b1219] to-stone-950 rounded-3xl p-5 sm:p-7 text-white shadow-md border border-stone-800 text-left">
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
            <Trophy className="w-32 h-32 text-white" />
          </div>

          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#E91E63] text-white font-extrabold text-[9px] uppercase px-3 py-1 rounded-full tracking-wider shadow-xs flex items-center gap-1">
                <Flame className="w-3 h-3" /> #1 Most Requested Formula
              </span>
              <span className="text-[10px] text-stone-300 font-semibold">
                Requested by @{leadingRequest.requestedBy}
              </span>
            </div>

            <h3 className="font-display font-black text-lg sm:text-xl md:text-2xl text-white tracking-tight">
              {leadingRequest.title}
            </h3>
            
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
              {leadingRequest.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Palette:</span>
                <div className="flex items-center gap-1.5">
                  {leadingRequest.colors?.map((col, idx) => (
                    <div 
                      key={idx} 
                      style={{ backgroundColor: col }} 
                      className="w-4 h-4 rounded-full border border-white/30 shadow-xs"
                      title={col}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={(e) => handleVoteRequest(leadingRequest.id, e)}
                  disabled={votedRequestIds.includes(leadingRequest.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                    votedRequestIds.includes(leadingRequest.id)
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${votedRequestIds.includes(leadingRequest.id) ? 'fill-current' : ''}`} />
                  <span>{leadingRequest.votes} Votes</span>
                </button>

                <button
                  onClick={(e) => handleOpenCompileForm(leadingRequest, e)}
                  className="px-3.5 py-1.5 bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] border border-[#EBC9D6] rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Build Formula</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEARCH & CONTROLS TRAY */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'popular', label: 'High Votes' },
            { id: 'open', label: 'Open' },
            { id: 'released', label: 'Released' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-black border border-white shadow-[0_2px_8px_rgba(135,107,93,0.15)] ring-1 ring-[#876b5d]/10'
                  : 'bg-[#EFEAE4]/85 hover:bg-white text-[#876b5d] hover:text-black border border-[#D6C7BA]/70 shadow-2xs'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right side: Search & Post Request Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search look requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] border border-[#EBC9D6] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Look</span>
          </button>
        </div>
      </div>

      {/* 3. REQUEST CARDS GRID */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-[#E91E63]" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Loading community look wishlist...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#EDE7E3] rounded-3xl glass-card p-6 space-y-3">
          <p className="text-sm font-bold text-stone-700">No requests found matching your filter.</p>
          <p className="text-xs text-stone-500">Have a specific makeup look or color combination in mind? Request it below!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Post First Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRequests.map((req) => {
            const hasVoted = votedRequestIds.includes(req.id);
            const isReleased = req.status === 'released';

            return (
              <div 
                key={req.id}
                className="glass-card rounded-3xl p-5 hover: hover:border-black/20 transition-all duration-300 flex flex-col justify-between text-left space-y-4 group"
              >
                {/* Header: Requester & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#FFF6F7] text-[#E91E63] border border-[#F7C6D7] flex items-center justify-center font-bold text-[10px]">
                      {req.requestedBy.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 leading-tight">@{req.requestedBy}</p>
                      <span className="text-[10px] text-stone-400 font-medium">{req.category}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    isReleased 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : req.status === 'being built'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}>
                    {req.status || 'Requested'}
                  </span>
                </div>

                {/* Body */}
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-[#E91E63] transition-colors leading-snug">
                    {req.title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-normal line-clamp-3">
                    {req.description}
                  </p>
                </div>

                {/* Swatches Tray */}
                <div className="flex items-center justify-between py-2 border-t border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-stone-400">Palette:</span>
                    <div className="flex items-center gap-1">
                      {req.colors?.map((col, idx) => (
                        <div 
                          key={idx}
                          style={{ backgroundColor: col }}
                          className="w-4 h-4 rounded-full border border-stone-200 shadow-2xs"
                          title={col}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-[#E91E63] text-[#E91E63]' : 'text-stone-400'}`} />
                    <span>{req.votes}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={(e) => handleVoteRequest(req.id, e)}
                    disabled={hasVoted}
                    className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      hasVoted
                        ? 'bg-stone-100 text-stone-400 cursor-default'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                    <span>{hasVoted ? 'Upvoted' : 'Upvote'}</span>
                  </button>

                  {isReleased ? (
                    <button
                      onClick={() => handleTryOnRequestFormula(req)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Try Look</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleOpenCompileForm(req, e)}
                      className="px-3 py-2 bg-[#F7E8EE] hover:bg-[#EBC9D6] text-[#2A1715] border border-[#EBC9D6] rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Build</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. POST LOOK REQUEST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative glass-card rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#E91E63]" /> Request a Community Look
              </h3>
              <p className="text-xs text-stone-500 font-normal leading-relaxed">
                Describe the beauty look, vibe, or formula you want creators to build for you.
              </p>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                  Your Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    placeholder="your_handle"
                    value={newRequester}
                    onChange={(e) => setNewRequester(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                  Look Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 90s Grunge Berry Liner & Matte Lips"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Full Face">Full Face Look</option>
                  <option value="Eye Focus">Eye Focus & Liner</option>
                  <option value="Lip Combo">Lip Combo</option>
                  <option value="Clean Skin">Dewy / Clean Skin</option>
                  <option value="Editorial">Editorial Glam</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                  Description & Techniques
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. A subtle brown smokey wing with rosy cheek contour and peptide gloss lips..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider mb-1.5">
                  Proposed Color Palette
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {newColors.map((col, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
                      <input
                        type="color"
                        value={col}
                        onChange={(e) => {
                          const updated = [...newColors];
                          updated[idx] = e.target.value;
                          setNewColors(updated);
                        }}
                        className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-[10px] font-mono font-bold text-stone-600 uppercase truncate">
                        {col}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-black hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Posting Request...' : 'Publish Request to Community'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. FORMULA COMPILER MODAL */}
      {compilingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative glass-card rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setCompilingRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase text-[#E91E63] tracking-wider">Formula Compiler</span>
              <h3 className="text-base font-bold text-stone-900">
                Build: {compilingRequest.title}
              </h3>
              <p className="text-xs text-stone-500 font-normal leading-relaxed">
                Fine-tune cosmetics parameters to fulfill this community request.
              </p>
            </div>

            {releaseSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-stone-900">Formula Successfully Released!</h4>
                <p className="text-xs text-stone-500">Available to all community members for live camera try-on.</p>
              </div>
            ) : (
              <form onSubmit={handleCompileAndRelease} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                    Preset Look Name
                  </label>
                  <input
                    type="text"
                    required
                    value={compilingName}
                    onChange={(e) => setCompilingName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Eyeshadow</label>
                    <input
                      type="color"
                      value={compilingEyeshadow}
                      onChange={(e) => setCompilingEyeshadow(e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-stone-200 bg-white p-0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Blush</label>
                    <input
                      type="color"
                      value={compilingBlush}
                      onChange={(e) => setCompilingBlush(e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-stone-200 bg-white p-0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Lip Tint</label>
                    <input
                      type="color"
                      value={compilingLip}
                      onChange={(e) => setCompilingLip(e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-stone-200 bg-white p-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Filter Overlay</label>
                    <select
                      value={compilingFilter}
                      onChange={(e) => setCompilingFilter(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none"
                    >
                      <option value="none">None</option>
                      <option value="holographic">Holographic</option>
                      <option value="warm-glow">Warm Glow</option>
                      <option value="cool-cyber">Cool Cyber</option>
                      <option value="vintage">Vintage Film</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Lashes Style</label>
                    <select
                      value={compilingLashes}
                      onChange={(e) => setCompilingLashes(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none"
                    >
                      <option value="none">None</option>
                      <option value="natural">Natural</option>
                      <option value="glam">Glam</option>
                      <option value="wispy">Wispy Feline</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isReleasing}
                  className="w-full py-2.5 bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] border border-[#EBC9D6] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isReleasing ? 'Publishing Formula...' : 'Publish Formula Preset'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
