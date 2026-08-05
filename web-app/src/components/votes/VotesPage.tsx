import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Trophy, Sliders, RefreshCw, CheckCircle2, Search, Filter, Play } from 'lucide-react';
import { PresetLook, LookRequest, ChallengeSubmission } from '../../types';
import { 
  seedBuiltLooksIfEmpty, 
  seedRequestsIfEmpty, 
  voteForRequestInDb, 
  createBuiltLookFromRequestInDb,
  ExtendedBuiltLook
} from '../../lib/looksService';
import { 
  db, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  increment, 
  handleFirestoreError, 
  OperationType 
} from '../../firebase';

interface VotesPageProps {
  onLoadPreset: (preset: PresetLook) => void;
}

// Cosmetic covers to represent looks
const COSMETIC_COVERS: Record<string, string> = {
  'Holo Pink Horizon': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
  'Cyber Aura Matrix': 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
  'Golden Hour Sparkle': 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600',
  'Ethereal Siren': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'Electric Orchid': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
};

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
];

const REQUEST_COVERS = [
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
];

export const VotesPage: React.FC<VotesPageProps> = ({ onLoadPreset }) => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'requests'>('submissions');
  const [loading, setLoading] = useState<boolean>(true);

  // Data States
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [requests, setRequests] = useState<LookRequest[]>([]);

  // Search & Filter States
  const [submissionSearch, setSubmissionSearch] = useState<string>('');
  const [submissionFilter, setSubmissionFilter] = useState<string>('all');
  const [requestSearch, setRequestSearch] = useState<string>('');

  // Local Vote Tracking to prevent double votes in a single session
  const [votedSubIds, setVotedSubIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_voted_submissions') || '[]');
    } catch {
      return [];
    }
  });

  const [votedRequestIds, setVotedRequestIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_voted_look_requests') || '[]');
    } catch {
      return [];
    }
  });

  // Modal compiler state for look requests
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

  // Load Data from database
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Seed or fetch Look Requests
      const fetchedRequests = await seedRequestsIfEmpty();
      setRequests(fetchedRequests.sort((a, b) => b.votes - a.votes));

      // 2. Fetch User Challenge Submissions from Firestore
      const subSnapshot = await getDocs(collection(db, 'submissions')).catch(error => {
        handleFirestoreError(error, OperationType.LIST, 'submissions');
      });

      const subList: ChallengeSubmission[] = [];
      subSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        subList.push({
          id: docSnap.id,
          username: data.username || 'Anonymous',
          lookName: data.lookName || 'Untitled Look',
          description: data.description || '',
          makeupConfig: data.makeupConfig || {},
          votes: data.votes || 0,
          createdAt: data.createdAt || Date.now()
        });
      });
      setSubmissions(subList.sort((a, b) => b.votes - a.votes));
    } catch (error) {
      console.error("Error loading votes page registries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Upvote User Submission
  const handleVoteSubmission = async (id: string) => {
    if (votedSubIds.includes(id)) return;
    try {
      const docRef = doc(db, 'submissions', id);
      await updateDoc(docRef, { votes: increment(1) }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `submissions/${id}`);
      });
      
      const newVoted = [...votedSubIds, id];
      setVotedSubIds(newVoted);
      localStorage.setItem('tryon_beauty_voted_submissions', JSON.stringify(newVoted));

      setSubmissions(prev =>
        prev.map(sub => sub.id === id ? { ...sub, votes: sub.votes + 1 } : sub)
            .sort((a, b) => b.votes - a.votes)
      );
    } catch (err) {
      console.error('Error voting for submission:', err);
    }
  };

  // Upvote Proposed Look Request
  const handleVoteRequest = async (reqId: string) => {
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

  // Prepare Compilation Form when clicking Release on a request
  const handleOpenCompileForm = (req: LookRequest) => {
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

  // Compile and Deploy preset formula to the database
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

      await createBuiltLookFromRequestInDb(compilingRequest.id, formulaPreset);
      setReleaseSuccess(true);
      
      // Update local state by removing the compiled request
      setRequests(prev => prev.filter(r => r.id !== compilingRequest.id));
      
      setTimeout(() => {
        setCompilingRequest(null);
        setReleaseSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error compiling request:', error);
    } finally {
      setIsReleasing(false);
    }
  };

  // Load a look directly into the sandbox editor
  const handleTryOnLook = (look: any) => {
    onLoadPreset({
      id: look.id,
      name: look.lookName || look.name || 'Sandbox Formula',
      description: look.description || '',
      eyeshadowColor: look.makeupConfig?.eyeshadowColor || look.eyeshadowColor || '#ff007f',
      eyeshadowOpacity: look.makeupConfig?.eyeshadowOpacity || look.eyeshadowOpacity || 0.6,
      blushColor: look.makeupConfig?.blushColor || look.blushColor || '#f43f5e',
      blushOpacity: look.makeupConfig?.blushOpacity || look.blushOpacity || 0.4,
      lipColor: look.makeupConfig?.lipColor || look.lipColor || '#e11d48',
      lipOpacity: look.makeupConfig?.lipOpacity || look.lipOpacity || 0.8,
      lipGloss: look.makeupConfig?.lipGloss !== undefined ? look.makeupConfig.lipGloss : (look.lipGloss || false),
      lashesStyle: look.makeupConfig?.lashesStyle || look.lashesStyle || 'none',
      glitterLevel: look.makeupConfig?.glitterLevel || look.glitterLevel || 0,
      filter: look.makeupConfig?.selectedFilter || look.filter || 'none',
    });
  };

  // Filtering user submissions
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.lookName.toLowerCase().includes(submissionSearch.toLowerCase()) ||
      sub.username.toLowerCase().includes(submissionSearch.toLowerCase()) ||
      (sub.description || '').toLowerCase().includes(submissionSearch.toLowerCase());
    
    if (submissionFilter === 'all') return matchesSearch;
    const filterTag = sub.makeupConfig?.selectedFilter || '';
    return matchesSearch && filterTag.toLowerCase() === submissionFilter.toLowerCase();
  });

  // Filtering look requests
  const filteredRequests = requests.filter(req => {
    return (
      req.title.toLowerCase().includes(requestSearch.toLowerCase()) ||
      req.description.toLowerCase().includes(requestSearch.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(requestSearch.toLowerCase()) ||
      req.category.toLowerCase().includes(requestSearch.toLowerCase())
    );
  });

  // Identify highest upvoted requests
  const leadingRequest = requests.length > 0 ? requests[0] : null;

  return (
    <div id="votes-tab-container" className="space-y-8 animate-in fade-in duration-300 text-stone-800">
      
      {/* HEADER HERO BANNER */}
      <div className="border-b border-[#bc8381]/30 pb-5 text-left flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-black uppercase tracking-wider flex items-center gap-2 text-[#732729]">
            <Trophy className="w-6 h-6 text-[#bc8381]" /> TryON Labs Vote Board
          </h2>
          <p className="text-xs text-stone-500 font-medium max-w-2xl">
            Choose between voting on beauty challenge looks designed by community residents or supporting requests and proposed makeup concept demands in the creative pipeline.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 self-start md:self-auto bg-white hover:bg-[#FAF6F5] border border-[#bc8381]/30 text-stone-600 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#bc8381]" /> Refresh Live Votes
        </button>
      </div>

      {/* PILL SWITCH CONTROLLER */}
      <div id="vote-pill-switch" className="flex justify-center my-6">
        <div className="bg-[#FAF6F5] border border-[#bc8381]/30 p-1 rounded-full inline-flex">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-[#732729] text-white shadow-md'
                : 'text-stone-600 hover:text-[#732729]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Challenge & Category Looks
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#732729] text-white shadow-md'
                : 'text-stone-600 hover:text-[#732729]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Look Requests & Ideas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#732729]" />
          <span className="text-xs font-extrabold text-[#732729] uppercase tracking-wider">Syncing TryON Vote Registries...</span>
        </div>
      ) : (
        <div>
          {/* TAB 1: CHALLENGE & CATEGORY SUBMISSIONS */}
          {activeTab === 'submissions' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#bc8381]/15 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#732729] uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-[#bc8381]" /> Resident Challenge submissions
                  </h3>
                  <p className="text-xs text-stone-500">Explore formulas created by creators, try them on instantly, and vote for your favorites!</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search submissions..."
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 bg-white border border-[#bc8381]/30 rounded-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#732729] w-48 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg p-0.5">
                    {['all', 'holographic', 'cool-cyber', 'warm-glow', 'vintage'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSubmissionFilter(filter)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          submissionFilter === filter
                            ? 'bg-[#732729] text-white'
                            : 'text-stone-500 hover:text-[#732729]'
                        }`}
                      >
                        {filter === 'all' ? 'All' : filter.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[#bc8381]/25 rounded-2xl bg-[#faf6f5]/40">
                  <p className="text-xs font-semibold text-stone-500">No challenge submissions match the selected filter criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredSubmissions.map((sub, idx) => {
                    const isVoted = votedSubIds.includes(sub.id);
                    // Match a cover image
                    const coverImg = COSMETIC_COVERS[sub.lookName] || DEFAULT_COVERS[idx % DEFAULT_COVERS.length];
                    const filterTag = sub.makeupConfig?.selectedFilter || 'none';

                    return (
                      <div 
                        key={sub.id}
                        className="bg-white rounded-2xl border border-[#bc8381]/20 overflow-hidden transition-all flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#732729]/30"
                      >
                        {/* Visual Card Cover */}
                        <div className="h-44 bg-stone-100 relative overflow-hidden border-b border-stone-100">
                          <img 
                            src={coverImg} 
                            alt={sub.lookName} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-stone-900/10 to-transparent" />
                          
                          {/* Floating creator handle */}
                          <div className="absolute top-3 left-3 bg-[#732729]/80 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-md">
                            @{sub.username}
                          </div>

                          {/* Filter Tag badge */}
                          {filterTag !== 'none' && (
                            <div className="absolute top-3 right-3 bg-white/95 text-[#732729] text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-[#bc8381]/20">
                              {filterTag}
                            </div>
                          )}

                          {/* Swatches Overlay */}
                          <div className="absolute bottom-3 left-3 flex gap-1.5 bg-white/95 px-2.5 py-1 rounded-lg border border-[#bc8381]/20 shadow-xs">
                            <div style={{ backgroundColor: sub.makeupConfig?.eyeshadowColor || '#000000' }} className="w-3.5 h-3.5 rounded-full border border-stone-200" title="Eyeshadow color" />
                            <div style={{ backgroundColor: sub.makeupConfig?.blushColor || '#000000' }} className="w-3.5 h-3.5 rounded-full border border-stone-200" title="Blush color" />
                            <div style={{ backgroundColor: sub.makeupConfig?.lipColor || '#000000' }} className="w-3.5 h-3.5 rounded-full border border-stone-200" title="Lip color" />
                          </div>

                          {/* Live Vote Display */}
                          <div className="absolute bottom-3 right-3 bg-white text-[#732729] border border-[#bc8381]/30 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs">
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                            <span>{sub.votes} Votes</span>
                          </div>
                        </div>

                        {/* Card Content & Try-On Action */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4 text-left">
                          <div className="space-y-1">
                            <h4 className="font-serif font-black text-[#732729] text-sm line-clamp-1">{sub.lookName}</h4>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-semibold line-clamp-2">{sub.description || 'Custom formulation submitted by studio resident.'}</p>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-stone-50">
                            <button
                              onClick={() => handleVoteSubmission(sub.id)}
                              disabled={isVoted}
                              className={`flex-1 font-bold text-[10px] tracking-wider uppercase py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                isVoted 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-[#732729] hover:bg-[#5c1d1f] text-white border border-[#732729]'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isVoted ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                              {isVoted ? 'Voted' : 'Vote Look'}
                            </button>

                            <button
                              onClick={() => handleTryOnLook(sub)}
                              className="px-3.5 py-2 bg-[#FAF6F5] hover:bg-[#bc8381]/15 border border-[#bc8381]/25 rounded-xl text-stone-600 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                              title="Try this formulation on sandbox editor"
                            >
                              <Play className="w-3 h-3 text-[#bc8381]" /> Try
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOOK REQUESTS & IDEAS */}
          {activeTab === 'requests' && (
            <div className="space-y-8 text-left">
              
              {/* Pipeline Controller Top Banner - Winner Compiler */}
              {leadingRequest && (
                <div className="bg-gradient-to-br from-[#732729] to-[#5c1d1f] rounded-2xl p-6 border border-[#bc8381]/30 text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
                    <Trophy className="w-48 h-48 text-white" />
                  </div>
                  
                  <span className="bg-[#bc8381] text-stone-900 font-extrabold text-[8px] uppercase px-2.5 py-1 rounded-full tracking-wider inline-block mb-3 shadow-xs">
                    ★ Leading Look Request
                  </span>

                  <h4 className="font-serif font-black text-xl mb-1.5 flex items-center gap-2 text-white">
                    {leadingRequest.title}
                  </h4>
                  <p className="text-xs text-stone-200/90 leading-relaxed mb-4 font-medium max-w-xl">
                    {leadingRequest.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-white/10 pt-4 mb-4 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Proposed Palette:</span>
                      <div className="flex gap-1.5">
                        {leadingRequest.colors?.map((col, idx) => (
                          <div key={idx} style={{ backgroundColor: col }} className="w-3.5 h-3.5 rounded-full border border-white/20" />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs font-black text-[#f5eae7] uppercase tracking-wider">
                      ★ {leadingRequest.votes} Votes Support
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCompileForm(leadingRequest)}
                    className="bg-white hover:bg-[#FAF6F5] text-[#732729] font-extrabold text-[10px] tracking-widest uppercase py-3 px-6 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.01]"
                  >
                    <Sliders className="w-4 h-4 text-[#732729]" /> Create & Release Winner to Library
                  </button>
                </div>
              )}

              {/* Proposed Ideas Section with Search (Mockup Layout) */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#bc8381]/15 pb-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#732729] uppercase tracking-wide">
                      Proposed Ideas & Vote Rankings
                    </h3>
                    <p className="text-xs text-stone-500">These concepts are actively designed based on community support. Upvote your favorites!</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search ideas or creators..."
                        value={requestSearch}
                        onChange={(e) => setRequestSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-white border border-[#bc8381]/30 rounded-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#732729] w-60 transition-colors"
                      />
                    </div>

                    {/* Badge Proposals */}
                    <span className="bg-[#FAF6F5] border border-[#bc8381]/35 text-[#732729] font-extrabold text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                      {filteredRequests.length} Proposals
                    </span>
                  </div>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-[#bc8381]/25 rounded-2xl bg-[#faf6f5]/40">
                    <p className="text-xs font-semibold text-stone-500">No look requests match the search keyword.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.map((req, idx) => {
                      const isVoted = votedRequestIds.includes(req.id);
                      const coverImg = REQUEST_COVERS[idx % REQUEST_COVERS.length];

                      return (
                        <div 
                          key={req.id}
                          className="bg-white rounded-2xl border border-[#bc8381]/20 overflow-hidden shadow-xs hover:shadow-md hover:border-[#732729]/35 transition-all flex flex-col justify-between"
                        >
                          {/* Visual Area with Overlay Badge and Creator name */}
                          <div className="h-44 bg-stone-100 relative overflow-hidden border-b border-stone-50">
                            <img 
                              src={coverImg} 
                              alt={req.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/10 to-transparent" />
                            
                            {/* Overlay tag (e.g., EYES) */}
                            <div className="absolute top-3 left-3 bg-[#FAF6F5] border border-[#bc8381]/40 text-[#732729] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                              {req.category || 'FACE'}
                            </div>

                            {/* Proposed by Overlay */}
                            <div className="absolute bottom-3 left-3 text-white text-[10px] font-bold">
                              Proposed by <span className="font-extrabold text-[#f5eae7]">@{req.requestedBy || 'studio_resident'}</span>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <h4 className="font-serif font-black text-[#732729] text-base leading-tight">{req.title}</h4>
                              <p className="text-[11px] text-stone-500 leading-relaxed font-semibold">{req.description}</p>
                              
                              {/* Concept Palette */}
                              <div className="space-y-1.5 pt-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 block">Concept Palette</span>
                                <div className="flex gap-1.5">
                                  {req.colors?.map((col, cIdx) => (
                                    <div 
                                      key={cIdx} 
                                      style={{ backgroundColor: col }} 
                                      className="w-3.5 h-3.5 rounded-full border border-stone-200" 
                                      title={col}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Footer Actions Row */}
                            <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                              <div className="text-stone-600 font-extrabold text-xs flex items-center gap-1">
                                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                                <span>{req.votes} votes</span>
                              </div>

                              <button
                                onClick={() => handleVoteRequest(req.id)}
                                disabled={isVoted}
                                className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                                  isVoted
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-[#732729] hover:bg-[#5c1d1f] text-white border border-[#732729]'
                                }`}
                              >
                                {isVoted ? 'Supported' : 'UPVOTE'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPILATION MODAL FOR CREATING AND ADDING THE WINNER LOOK TO THE LIBRARY */}
      {compilingRequest && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#bc8381]/40 shadow-2xl max-w-lg w-full p-6 text-left space-y-6 animate-in zoom-in-95 duration-200 relative">
            
            <div className="flex justify-between items-start border-b border-[#bc8381]/25 pb-3">
              <div>
                <h3 className="text-lg font-serif font-black text-[#732729] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#bc8381] animate-spin" /> Compiler Suite
                </h3>
                <p className="text-xs text-stone-500">Formulate and deploy community winning look requested parameters.</p>
              </div>
              <button 
                onClick={() => setCompilingRequest(null)}
                className="text-stone-400 hover:text-stone-600 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {releaseSuccess ? (
              <div className="py-8 text-center space-y-3 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
                <h4 className="font-serif font-black text-stone-800 text-lg">Look Compiled Successfully!</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  "{compilingName}" has been successfully added to the official Packaged Studio library across the platform!
                </p>
              </div>
            ) : (
              <form onSubmit={handleCompileAndRelease} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-500">Official Look Name</label>
                  <input
                    type="text"
                    required
                    value={compilingName}
                    onChange={(e) => setCompilingName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#faf6f5] border border-[#bc8381]/35 rounded-xl text-stone-800 font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-500">Look Recipe Description</label>
                  <textarea
                    required
                    rows={2}
                    value={compilingDescription}
                    onChange={(e) => setCompilingDescription(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#faf6f5] border border-[#bc8381]/35 rounded-xl text-stone-800 font-semibold focus:outline-none"
                  />
                </div>

                {/* FORMULA SPECS */}
                <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-[#732729] tracking-wider border-b border-[#bc8381]/15 pb-1">
                    Cosmetic Color Mapping
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-500 block">Eyeshadow</span>
                      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-[#bc8381]/20">
                        <input
                          type="color"
                          value={compilingEyeshadow}
                          onChange={(e) => setCompilingEyeshadow(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border border-stone-200"
                        />
                        <span className="text-[9px] font-bold font-mono text-stone-600">{compilingEyeshadow}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-500 block">Blush</span>
                      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-[#bc8381]/20">
                        <input
                          type="color"
                          value={compilingBlush}
                          onChange={(e) => setCompilingBlush(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border border-stone-200"
                        />
                        <span className="text-[9px] font-bold font-mono text-stone-600">{compilingBlush}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-500 block">Lipstick</span>
                      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-[#bc8381]/20">
                        <input
                          type="color"
                          value={compilingLip}
                          onChange={(e) => setCompilingLip(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border border-stone-200"
                        />
                        <span className="text-[9px] font-bold font-mono text-stone-600">{compilingLip}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-500 block">Glitter level</span>
                      <select 
                        value={compilingGlitter} 
                        onChange={(e) => setCompilingGlitter(Number(e.target.value))}
                        className="w-full text-[10px] font-bold bg-white p-2 rounded-lg border border-[#bc8381]/20 focus:outline-none"
                      >
                        <option value={10}>10% Soft Sparkle</option>
                        <option value={50}>50% Disco Sparkle</option>
                        <option value={80}>80% Pure Glimmer</option>
                        <option value={100}>100% Star Dust</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-500 block">Filter Shift</span>
                      <select 
                        value={compilingFilter} 
                        onChange={(e) => setCompilingFilter(e.target.value as any)}
                        className="w-full text-[10px] font-bold bg-white p-2 rounded-lg border border-[#bc8381]/20 focus:outline-none"
                      >
                        <option value="none">No Filter Shift</option>
                        <option value="vintage">Vintage Sepia</option>
                        <option value="warm-glow">Golden Hour</option>
                        <option value="cool-cyber">Cool Cyber</option>
                        <option value="holographic">Holographic Glow</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-500 block">Eyelashes</span>
                      <select 
                        value={compilingLashes} 
                        onChange={(e) => setCompilingLashes(e.target.value as any)}
                        className="w-full text-[10px] font-bold bg-white p-2 rounded-lg border border-[#bc8381]/20 focus:outline-none"
                      >
                        <option value="none">None</option>
                        <option value="natural">Natural</option>
                        <option value="glam">Dramatic Glam</option>
                        <option value="wispy">Ethereal Wispy</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setCompilingRequest(null)}
                    className="flex-1 border border-stone-200 hover:bg-stone-50 text-stone-500 font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReleasing}
                    className="flex-1 bg-[#732729] hover:bg-[#5c1d1f] text-white font-extrabold text-[10px] uppercase tracking-wider py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1"
                  >
                    {isReleasing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Compile & Publish to Library'
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
