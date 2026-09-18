import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Heart, 
  Search, 
  RefreshCw, 
  Play, 
  Plus, 
  Award,
  Crown,
  Medal,
  Calendar,
  Flame,
  X
} from 'lucide-react';
import { ChallengeSubmission, PresetLook } from '../../types';
import { db, collection, getDocs, updateDoc, doc, increment, addDoc, handleFirestoreError, OperationType } from '../../firebase';
import { PopularChallengeCard } from '../common/PopularChallengeCard';
import { ChallengePulseStrip } from './ChallengePulseStrip';
import { RevealCard } from './RevealCard';

interface CommunityChallengesViewProps {
  onLoadPreset: (preset: PresetLook) => void;
}

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
    lookName: 'Sunlit Peach Sorbet',
    description: 'Golden hour cheek glaze with coral peach blush and sheer crystal gloss lips for the August summer challenge.',
    makeupConfig: {
      eyeshadowColor: '#fb923c',
      eyeshadowOpacity: 0.7,
      blushColor: '#f97316',
      blushOpacity: 0.45,
      lipColor: '#ea580c',
      lipOpacity: 0.8,
      lipGloss: true,
      lashesStyle: 'natural',
      glitterLevel: 40,
      selectedFilter: 'warm-glow'
    },
    votes: 68,
    createdAt: Date.now() - 3600000 * 24
  },
  {
    id: 'sub_2',
    username: 'summer_muse',
    lookName: 'Dewy Bronze Glow',
    description: 'Ultra dewy skin with champagne eye shimmer, bronze sculpted cheeks, and nude velvet peptide lips.',
    makeupConfig: {
      eyeshadowColor: '#d97706',
      eyeshadowOpacity: 0.65,
      blushColor: '#cb997e',
      blushOpacity: 0.4,
      lipColor: '#9a3412',
      lipOpacity: 0.75,
      lipGloss: true,
      lashesStyle: 'wispy',
      glitterLevel: 30,
      selectedFilter: 'warm-glow'
    },
    votes: 54,
    createdAt: Date.now() - 3600000 * 18
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
    votes: 42,
    createdAt: Date.now() - 3600000 * 12
  }
];

export const CommunityChallengesView: React.FC<CommunityChallengesViewProps> = ({ onLoadPreset }) => {
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);

  // New Submission State
  const [newUsername, setNewUsername] = useState<string>(() => {
    return localStorage.getItem('tryon_beauty_username') || localStorage.getItem('kobella_username') || '';
  });
  const [newLookName, setNewLookName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newEyeshadowColor, setNewEyeshadowColor] = useState<string>('#fb923c');
  const [newBlushColor, setNewBlushColor] = useState<string>('#f97316');
  const [newLipColor, setNewLipColor] = useState<string>('#ea580c');
  const [newFilter, setNewFilter] = useState<'none' | 'vintage' | 'warm-glow' | 'cool-cyber' | 'holographic'>('warm-glow');
  const [newGlitter, setNewGlitter] = useState<number>(40);
  const [newLashes, setNewLashes] = useState<'none' | 'natural' | 'glam' | 'wispy'>('natural');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Vote tracking
  const [votedSubIds, setVotedSubIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_voted_submissions') || '[]');
    } catch {
      return [];
    }
  });

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const subSnapshot = await getDocs(collection(db, 'submissions')).catch(error => {
        handleFirestoreError(error, OperationType.LIST, 'submissions');
      });

      const subList: ChallengeSubmission[] = [];
      if (subSnapshot && !subSnapshot.empty) {
        subSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          subList.push({
            id: docSnap.id,
            username: data.username || 'Anonymous',
            lookName: data.lookName || 'Clean Summer Look',
            description: data.description || '',
            makeupConfig: data.makeupConfig || {},
            votes: data.votes || 0,
            createdAt: data.createdAt || Date.now()
          });
        });
      }

      if (subList.length === 0) {
        setSubmissions(SEED_SUBMISSIONS);
      } else {
        setSubmissions(subList.sort((a, b) => b.votes - a.votes));
      }
    } catch (err) {
      console.error('Error loading submissions:', err);
      setSubmissions(SEED_SUBMISSIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleVote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
      console.error('Error voting for challenge look:', err);
    }
  };

  const handleTryOn = (sub: ChallengeSubmission) => {
    onLoadPreset({
      id: sub.id,
      name: sub.lookName,
      description: sub.description,
      eyeshadowColor: sub.makeupConfig?.eyeshadowColor || '#fb923c',
      eyeshadowOpacity: sub.makeupConfig?.eyeshadowOpacity || 0.7,
      blushColor: sub.makeupConfig?.blushColor || '#f97316',
      blushOpacity: sub.makeupConfig?.blushOpacity || 0.45,
      lipColor: sub.makeupConfig?.lipColor || '#ea580c',
      lipOpacity: sub.makeupConfig?.lipOpacity || 0.8,
      lipGloss: sub.makeupConfig?.lipGloss ?? true,
      lashesStyle: (sub.makeupConfig?.lashesStyle as 'none' | 'natural' | 'glam' | 'wispy') || 'natural',
      glitterLevel: sub.makeupConfig?.glitterLevel || 30,
      filter: (sub.makeupConfig?.selectedFilter as 'none' | 'vintage' | 'warm-glow' | 'cool-cyber' | 'holographic') || 'warm-glow'
    });
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLookName.trim()) return;
    setIsSubmitting(true);
    try {
      const user = newUsername.trim() || 'summer_creator';
      localStorage.setItem('tryon_beauty_username', user);

      const submissionPayload = {
        username: user,
        lookName: newLookName.trim(),
        description: newDescription.trim() || 'Summer challenge submission',
        makeupConfig: {
          eyeshadowColor: newEyeshadowColor,
          eyeshadowOpacity: 0.7,
          blushColor: newBlushColor,
          blushOpacity: 0.45,
          lipColor: newLipColor,
          lipOpacity: 0.8,
          lipGloss: true,
          lashesStyle: newLashes,
          glitterLevel: newGlitter,
          selectedFilter: newFilter
        },
        votes: 1,
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'submissions'), submissionPayload).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, 'submissions');
      });

      const newSub: ChallengeSubmission = {
        id: docRef?.id || `sub_${Date.now()}`,
        ...submissionPayload
      };

      setSubmissions(prev => [newSub, ...prev]);

      const newVoted = [...votedSubIds, newSub.id];
      setVotedSubIds(newVoted);
      localStorage.setItem('tryon_beauty_voted_submissions', JSON.stringify(newVoted));

      setIsSubmitModalOpen(false);
      setNewLookName('');
      setNewDescription('');
    } catch (err) {
      console.error('Error submitting challenge look:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.lookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStyle === 'all') return matchesSearch;
    return matchesSearch && (sub.makeupConfig?.selectedFilter || '').toLowerCase() === filterStyle.toLowerCase();
  });

  const top3 = submissions.slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-stone-800 text-left">
      {/* 0. ACTIVE MONTHLY CHALLENGE CARD (EXACT SAME AS HOMEPAGE) */}
      <PopularChallengeCard onEnter={() => setIsSubmitModalOpen(true)} />

      {/* 0b. LIVE PULSE - the clock, the numbers, and the viewer's own part */}
      <ChallengePulseStrip
        submissions={submissions}
        votedIds={votedSubIds}
        onEnter={() => setIsSubmitModalOpen(true)}
      />
      
      {/* 1. CHALLENGE LEADERBOARD PODIUM */}
      {top3.length > 0 && (
        <div className="glass-card rounded-3xl p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100">
            <div>
              <span className="text-[9px] font-bold uppercase text-[#E91E63] tracking-widest flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Live Rankings
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight mt-0.5">
                August Challenge Podium
              </h3>
            </div>
            
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] border border-[#EBC9D6] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Submit Entry
            </button>
          </div>

          {/* Podium Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
            {top3.map((entry, idx) => {
              const rankIcons = [Crown, Medal, Award];
              const RankIcon = rankIcons[idx] || Award;
              const rankLabels = ['1st Place', '2nd Place', '3rd Place'];
              const rankColors = [
                'bg-amber-500 text-white border-amber-400',
                'bg-stone-300 text-stone-800 border-stone-400',
                'bg-amber-700 text-white border-amber-600'
              ];
              const coverImg = COSMETIC_COVERS[entry.lookName] || DEFAULT_COVERS[idx % DEFAULT_COVERS.length];

              const accents = ['#E91E63', '#B8887A', '#2A1715'];

              return (
                <RevealCard
                  key={entry.id}
                  id={entry.id}
                  image={coverImg}
                  rankLabel={rankLabels[idx]}
                  teaser={`${entry.votes} votes · brush to see who`}
                  accent={accents[idx] || '#B8887A'}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 border ${rankColors[idx]}`}>
                      <RankIcon className="w-3 h-3" /> {rankLabels[idx]}
                    </span>
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-[#E91E63] text-[#E91E63]" /> {entry.votes} Votes
                    </span>
                  </div>

                  <div className="flex gap-3 items-center">
                    <img 
                      src={coverImg} 
                      alt={entry.lookName}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-stone-900 text-sm truncate">{entry.lookName}</h4>
                      <p className="text-[11px] text-stone-500 truncate">@{entry.username}</p>
                      <div className="flex gap-1 mt-1">
                        <div style={{ backgroundColor: entry.makeupConfig?.eyeshadowColor || '#fb923c' }} className="w-3 h-3 rounded-full border border-stone-200" />
                        <div style={{ backgroundColor: entry.makeupConfig?.blushColor || '#f97316' }} className="w-3 h-3 rounded-full border border-stone-200" />
                        <div style={{ backgroundColor: entry.makeupConfig?.lipColor || '#ea580c' }} className="w-3 h-3 rounded-full border border-stone-200" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={(e) => handleVote(entry.id, e)}
                      disabled={votedSubIds.includes(entry.id)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        votedSubIds.includes(entry.id)
                          ? 'bg-stone-100 text-stone-400'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                      }`}
                    >
                      {votedSubIds.includes(entry.id) ? 'Voted' : 'Vote'}
                    </button>
                    <button
                      onClick={() => handleTryOn(entry)}
                      className="px-3 py-1.5 bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] border border-[#EBC9D6] rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      <Play className="w-3 h-3" /> Try
                    </button>
                  </div>
                </RevealCard>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Entries' },
            { id: 'warm-glow', label: 'Warm Glow' },
            { id: 'holographic', label: 'Holographic' },
            { id: 'cool-cyber', label: 'Cool Cyber' },
            { id: 'vintage', label: 'Vintage' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStyle(tab.id)}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStyle === tab.id
                  ? 'bg-white text-black border border-white shadow-[0_2px_8px_rgba(135,107,93,0.15)] ring-1 ring-[#876b5d]/10'
                  : 'bg-[#EFEAE4]/85 hover:bg-white text-[#876b5d] hover:text-black border border-[#D6C7BA]/70 shadow-2xs'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search challenge entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-black transition-all"
          />
        </div>
      </div>

      {/* 3. ENTRIES GRID */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-[#E91E63]" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Loading challenge submissions...</span>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#EDE7E3] rounded-3xl glass-card p-6 space-y-2">
          <p className="text-sm font-bold text-stone-700">No challenge entries match this filter.</p>
          <p className="text-xs text-stone-500">Be the first to submit a look with this filter style!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubmissions.map((sub, idx) => {
            const hasVoted = votedSubIds.includes(sub.id);
            const coverImg = COSMETIC_COVERS[sub.lookName] || DEFAULT_COVERS[idx % DEFAULT_COVERS.length];

            return (
              <div 
                key={sub.id}
                className="bg-white rounded-3xl border border-[#EDE7E3] overflow-hidden shadow-xs hover:shadow-md hover:border-black/20 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Cover Image */}
                <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                  <img 
                    src={coverImg} 
                    alt={sub.lookName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    @{sub.username}
                  </div>

                  <div className="absolute bottom-3 left-3 flex gap-1.5 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-lg border border-white/60 shadow-xs">
                    <div style={{ backgroundColor: sub.makeupConfig?.eyeshadowColor || '#fb923c' }} className="w-3.5 h-3.5 rounded-full border border-white" />
                    <div style={{ backgroundColor: sub.makeupConfig?.blushColor || '#f97316' }} className="w-3.5 h-3.5 rounded-full border border-white -ml-1" />
                    <div style={{ backgroundColor: sub.makeupConfig?.lipColor || '#ea580c' }} className="w-3.5 h-3.5 rounded-full border border-white -ml-1" />
                  </div>

                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-stone-900 px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                    <Heart className="w-3 h-3 fill-[#E91E63] text-[#E91E63]" />
                    <span>{sub.votes}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-900 text-sm group-hover:text-[#E91E63] transition-colors">{sub.lookName}</h4>
                    <p className="text-xs text-stone-500 font-normal line-clamp-2">{sub.description || 'Summer challenge formula submission.'}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={(e) => handleVote(sub.id, e)}
                      disabled={hasVoted}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        hasVoted
                          ? 'bg-stone-100 text-stone-400'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                      <span>{hasVoted ? 'Voted' : 'Vote'}</span>
                    </button>

                    <button
                      onClick={() => handleTryOn(sub)}
                      className="px-3.5 py-2 bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] border border-[#EBC9D6] rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      <Play className="w-3 h-3" /> Try
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. SUBMIT CHALLENGE ENTRY MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative glass-sheet rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase text-[#E91E63] tracking-wider">August Challenge Entry</span>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E91E63]" /> Submit Your Clean Summer Look
              </h3>
              <p className="text-xs text-stone-500 font-normal leading-relaxed">
                Submit your customized recipe to compete for this month's featured crown!
              </p>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                  Creator Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    placeholder="creator_handle"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
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
                  placeholder="e.g. Peach Dew Horizon"
                  value={newLookName}
                  onChange={(e) => setNewLookName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                  Formula Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe your summer glow highlights and technique..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Eyeshadow</label>
                  <input
                    type="color"
                    value={newEyeshadowColor}
                    onChange={(e) => setNewEyeshadowColor(e.target.value)}
                    className="w-full h-8 rounded-lg cursor-pointer border border-stone-200 bg-white p-0.5"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Blush</label>
                  <input
                    type="color"
                    value={newBlushColor}
                    onChange={(e) => setNewBlushColor(e.target.value)}
                    className="w-full h-8 rounded-lg cursor-pointer border border-stone-200 bg-white p-0.5"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Lip Gloss</label>
                  <input
                    type="color"
                    value={newLipColor}
                    onChange={(e) => setNewLipColor(e.target.value)}
                    className="w-full h-8 rounded-lg cursor-pointer border border-stone-200 bg-white p-0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Filter Style</label>
                  <select
                    value={newFilter}
                    onChange={(e) => setNewFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none"
                  >
                    <option value="warm-glow">Warm Glow</option>
                    <option value="holographic">Holographic</option>
                    <option value="cool-cyber">Cool Cyber</option>
                    <option value="vintage">Vintage Film</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-stone-500 tracking-wider mb-1">Lashes</label>
                  <select
                    value={newLashes}
                    onChange={(e) => setNewLashes(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none"
                  >
                    <option value="natural">Natural</option>
                    <option value="glam">Glam</option>
                    <option value="wispy">Wispy</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#EBC9D6] hover:bg-[#F7E8EE] text-[#2A1715] border border-[#EBC9D6] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting Entry...' : 'Submit Challenge Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
