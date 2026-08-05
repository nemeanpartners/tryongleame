import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw, Trophy, ExternalLink, Filter, Grid, Sparkles, Search, X } from 'lucide-react';
import { db, collection, getDocs, updateDoc, doc, increment, addDoc, handleFirestoreError, OperationType } from '../../firebase';
import { ChallengeSubmission, PresetLook } from '../../types';

// Premium high-res beauty cover images representing different makeup styles
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

const SEED_SUBMISSIONS: ChallengeSubmission[] = [
  {
    id: 'sub_1',
    username: 'cosmic_queen',
    lookName: 'Holo Pink Horizon',
    description: 'A futuristic pink eye combined with holographic lilac glimmers and heavy gloss. Optimized for late-night virtual concerts!',
    makeupConfig: {
      eyeshadowColor: '#ec4899',
      eyeshadowOpacity: 0.8,
      blushColor: '#fb7185',
      blushOpacity: 0.4,
      lipColor: '#db2777',
      lipOpacity: 0.9,
      lipGloss: true,
      lashesStyle: 'glam',
      glitterLevel: 80,
      selectedFilter: 'holographic'
    },
    votes: 42,
    createdAt: Date.now() - 3600000 * 24
  },
  {
    id: 'sub_2',
    username: 'makeup_artist_tim',
    lookName: 'Cyber Aura Matrix',
    description: 'Earthy matte copper blush but electric cybernetic violet eyes with low-intensity glitter, blended with our custom Matrix cyan filter overlay.',
    makeupConfig: {
      eyeshadowColor: '#8b5cf6',
      eyeshadowOpacity: 0.75,
      blushColor: '#cb997e',
      blushOpacity: 0.35,
      lipColor: '#7c2d12',
      lipOpacity: 0.8,
      lipGloss: false,
      lashesStyle: 'wispy',
      glitterLevel: 30,
      selectedFilter: 'cool-cyber'
    },
    votes: 31,
    createdAt: Date.now() - 3600000 * 12
  },
  {
    id: 'sub_3',
    username: 'lily_rose',
    lookName: 'Golden Hour Sparkle',
    description: 'A pure bronzed golden sunset style with deep cherry glossy lips, natural lashes, and shimmering cheek highlights.',
    makeupConfig: {
      eyeshadowColor: '#eab308',
      eyeshadowOpacity: 0.65,
      blushColor: '#f43f5e',
      blushOpacity: 0.45,
      lipColor: '#be123c',
      lipOpacity: 0.85,
      lipGloss: true,
      lashesStyle: 'natural',
      glitterLevel: 55,
      selectedFilter: 'warm-glow'
    },
    votes: 19,
    createdAt: Date.now() - 3600000 * 6
  }
];

interface GalleryPageProps {
  onTryOnSubmission: (preset: PresetLook) => void;
  refreshTrigger: number;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onTryOnSubmission, refreshTrigger }) => {
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [votedSubIds, setVotedSubIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_voted_submissions') || '[]');
    } catch {
      return [];
    }
  });

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'submissions')).catch(error => {
        handleFirestoreError(error, OperationType.LIST, 'submissions');
      });
      const list: ChallengeSubmission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          username: data.username || 'Anonymous',
          lookName: data.lookName || 'Untitled Look',
          description: data.description || '',
          makeupConfig: data.makeupConfig || {},
          votes: data.votes || 0,
          createdAt: data.createdAt || Date.now()
        });
      });

      if (list.length === 0) {
        for (const seed of SEED_SUBMISSIONS) {
          const { id, ...data } = seed;
          await addDoc(collection(db, 'submissions'), data).catch(error => {
            handleFirestoreError(error, OperationType.CREATE, 'submissions');
          });
        }
        const nextSnapshot = await getDocs(collection(db, 'submissions')).catch(error => {
          handleFirestoreError(error, OperationType.LIST, 'submissions');
        });
        const seededList: ChallengeSubmission[] = [];
        nextSnapshot.forEach((doc) => {
          const data = doc.data();
          seededList.push({
            id: doc.id,
            username: data.username || 'Anonymous',
            lookName: data.lookName || 'Untitled Look',
            description: data.description || '',
            makeupConfig: data.makeupConfig || {},
            votes: data.votes || 0,
            createdAt: data.createdAt || Date.now()
          });
        });
        setSubmissions(seededList.sort((a, b) => b.votes - a.votes));
      } else {
        setSubmissions(list.sort((a, b) => b.votes - a.votes));
      }
    } catch (err) {
      console.error('Error fetching gallery submissions: ', err);
      if (err instanceof Error && err.message.includes('{')) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [refreshTrigger]);

  const handleVote = async (id: string) => {
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
      console.error('Error recording vote: ', err);
      if (err instanceof Error && err.message.includes('{')) {
        throw err;
      }
    }
  };

  const loadIntoSandbox = (sub: ChallengeSubmission) => {
    const config = sub.makeupConfig;
    const preset: PresetLook = {
      id: sub.id,
      name: sub.lookName,
      description: sub.description,
      eyeshadowColor: config.eyeshadowColor || '#ff0000',
      eyeshadowOpacity: config.eyeshadowOpacity || 0.5,
      blushColor: config.blushColor || '#ff0000',
      blushOpacity: config.blushOpacity || 0.5,
      lipColor: config.lipColor || '#ff0000',
      lipOpacity: config.lipOpacity || 0.5,
      lipGloss: config.lipGloss || false,
      lashesStyle: (config.lashesStyle as any) || 'none',
      glitterLevel: config.glitterLevel || 0,
      filter: (config.selectedFilter as any) || 'none'
    };
    onTryOnSubmission(preset);
  };

  // Filter submissions by selected Filter style and search query (name or creator)
  const filteredSubmissions = submissions.filter(sub => {
    const matchesCategory = categoryFilter === 'all' || sub.makeupConfig.selectedFilter === categoryFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      sub.lookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Retrieve matching makeup cover or fallback gracefully
  const getCoverImage = (lookName: string, index: number) => {
    if (COSMETIC_COVERS[lookName]) {
      return COSMETIC_COVERS[lookName];
    }
    return DEFAULT_COVERS[index % DEFAULT_COVERS.length];
  };

  return (
    <div id="gallery-page" className="space-y-8 animate-in fade-in duration-300 text-stone-800">
      
      {/* ACTIVE CHALLENGE HEADER */}
      <div className="bg-gradient-to-r from-[#732729] via-[#5c1d1f] to-[#401315] text-white rounded-2xl p-6 border border-[#bc8381]/30 flex flex-col md:flex-row items-start justify-between gap-6 shadow-lg">
        <div className="space-y-2 max-w-xl text-left">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#bc8381] shrink-0" />
            <span className="text-[10px] font-black uppercase text-[#bc8381] tracking-wider">Active Monthly Challenge</span>
          </div>
          <h3 className="text-xl font-serif font-black tracking-tight text-white uppercase">August: Holographic Heatwave</h3>
          <p className="text-xs text-[#f5eae7]/80 leading-relaxed font-semibold">
            Formulate an interactive makeup look using high-density glitter, holographic prismatic filters, and glowing lip tones. Submit your custom mix to be crowned September's featured look!
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0 bg-white/10 border border-white/20 p-3.5 rounded-xl text-center">
          <span className="text-[9px] font-bold uppercase text-white/70 tracking-wider">Entries Submitted</span>
          <span className="text-lg font-black text-[#bc8381]">{submissions.length} Designer Entries</span>
        </div>
      </div>

      {/* FILTER & SEARCH TRAY */}
      <div className="bg-white rounded-2xl p-5 border border-[#bc8381]/25 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-left">
            <h2 className="text-lg font-serif font-bold uppercase tracking-wider flex items-center gap-2 text-[#732729]">
              <Grid className="w-4.5 h-4.5 text-[#bc8381]" /> Community Submissions
            </h2>
            <p className="text-xs text-stone-500">Vote on community creations, check their formula palettes, or try them on.</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search looks by name or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-9 py-2.5 bg-[#faf6f5] border border-[#bc8381]/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold text-stone-800 placeholder-stone-400 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200/50 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-[#bc8381]/15">
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 bg-[#faf6f5] border border-[#bc8381]/25 rounded-xl px-2.5 py-1.5 text-xs text-stone-600 shadow-xs shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#732729]" />
              <span className="font-semibold">Filter Style:</span>
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All Looks' },
                { id: 'holographic', label: 'Holographic' },
                { id: 'cool-cyber', label: 'Cool Cyber' },
                { id: 'warm-glow', label: 'Warm Glow' },
                { id: 'vintage', label: 'Vintage' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === tab.id 
                      ? 'bg-[#732729] text-white shadow-sm' 
                      : 'bg-white text-stone-600 border border-[#bc8381]/25 hover:bg-[#faf6f5] hover:text-[#732729]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchSubmissions}
            className="p-2.5 bg-white hover:bg-[#faf6f5] border border-[#bc8381]/25 rounded-xl text-stone-500 hover:text-[#732729] transition-colors cursor-pointer shadow-xs"
            title="Refresh Entries"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-stone-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#732729]" />
          <span className="text-xs font-bold">Loading submissions from Look LAB registry...</span>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[#bc8381]/40 rounded-2xl bg-white text-stone-400 space-y-3">
          <p className="text-sm font-bold">No looks found matching this filter.</p>
          <p className="text-xs">Be the first to submit a look with this filter style!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((sub, index) => {
            const hasVoted = votedSubIds.includes(sub.id);
            const coverImage = getCoverImage(sub.lookName, index);

            return (
              <div
                key={sub.id}
                className="group bg-white rounded-2xl border border-[#bc8381]/25 hover:border-[#732729]/40 overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-[0_10px_25px_rgba(115,39,41,0.06)]"
              >
                {/* 1. VISUAL COVER IMAGE PORTRAIT */}
                <div className="relative h-48 w-full overflow-hidden bg-stone-100 border-b border-[#bc8381]/15">
                  <img 
                    src={coverImage} 
                    alt={sub.lookName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />
                  
                  {/* Small Swatch Preview Overlaid */}
                  <div className="absolute top-4 left-4 flex gap-1 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-[#bc8381]/20">
                    <div 
                      style={{ backgroundColor: sub.makeupConfig.eyeshadowColor }} 
                      className="w-3.5 h-3.5 rounded-full border border-stone-200"
                      title="Eyeshadow color"
                    />
                    <div 
                      style={{ backgroundColor: sub.makeupConfig.lipColor }} 
                      className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1"
                      title="Lip color"
                    />
                    <div 
                      style={{ backgroundColor: sub.makeupConfig.blushColor }} 
                      className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1"
                      title="Blush color"
                    />
                  </div>

                  {/* Designer Badge */}
                  <div className="absolute bottom-3 left-4 bg-white/90 border border-[#bc8381]/30 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-[#732729]">
                    @{sub.username}
                  </div>
                </div>

                {/* 2. BODY CONTENT */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-left">
                    <h4 className="font-serif font-black text-[#732729] text-base group-hover:text-[#bc8381] transition-colors">
                      {sub.lookName}
                    </h4>
                    <p className="text-xs text-stone-500 leading-relaxed font-semibold line-clamp-3">
                      {sub.description || 'A beautiful customized formula designed for the TryON Beauty community.'}
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* Meta Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[9px] font-extrabold uppercase tracking-wider">
                      {sub.makeupConfig.selectedFilter && sub.makeupConfig.selectedFilter !== 'none' && (
                        <span className="bg-[#bc8381]/15 text-[#732729] border border-[#bc8381]/25 px-2 py-0.5 rounded-md">
                          🎬 {sub.makeupConfig.selectedFilter}
                        </span>
                      )}
                      {sub.makeupConfig.glitterLevel > 0 && (
                        <span className="bg-[#bc8381]/15 text-[#732729] border border-[#bc8381]/25 px-2 py-0.5 rounded-md">
                          ✨ Glitter {sub.makeupConfig.glitterLevel}%
                        </span>
                      )}
                      <span className="bg-stone-50 text-stone-500 border border-stone-100 px-2 py-0.5 rounded-md">
                        Lashes: {sub.makeupConfig.lashesStyle}
                      </span>
                    </div>

                    {/* Actions Tray */}
                    <div className="flex items-center justify-between border-t border-[#bc8381]/15 pt-3.5">
                      <button
                        onClick={() => loadIntoSandbox(sub)}
                        className="text-[10px] font-bold tracking-widest uppercase text-[#732729] hover:text-[#bc8381] flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Try Formula
                      </button>

                      <button
                        onClick={() => handleVote(sub.id)}
                        disabled={hasVoted}
                        className={`flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                          hasVoted
                            ? 'bg-[#bc8381]/10 text-[#732729] border border-[#bc8381]/20 cursor-default font-bold'
                            : 'bg-[#732729] hover:bg-[#5c1d1f] text-white border border-transparent'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                        <span>{sub.votes} {hasVoted ? 'Voted' : 'Vote'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
