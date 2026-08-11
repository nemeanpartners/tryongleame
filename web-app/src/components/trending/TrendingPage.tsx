import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Heart, 
  Plus, 
  TrendingUp, 
  Tag, 
  User, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  BarChart2, 
  Search, 
  X, 
  Lock, 
  Unlock, 
  Mail 
} from 'lucide-react';
import { db, collection, getDocs, addDoc, updateDoc, doc, increment } from '../../firebase';
import { LookRequest } from '../../types';

const CATEGORY_COVERS: Record<string, string> = {
  'Eyes': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600',
  'Lips': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
  'Blush': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600',
  'Highlight': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
  'Full Face': 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600',
  'Other': 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
};

const PRESET_REQUESTS: LookRequest[] = [
  {
    id: 'req_1',
    title: 'Holographic Liquid Chrome Liners',
    description: 'A multi-chrome eyeliner that shifts between violet, teal, and gold depending on the light angle.',
    category: 'Eyes',
    colors: ['#a78bfa', '#2dd4bf', '#fbbf24'],
    requestedBy: 'beauty_by_kat',
    votes: 48,
    votedUsers: [],
    isPublic: true,
    createdAt: Date.now() - 3600000 * 48
  },
  {
    id: 'req_2',
    title: 'Hydrating Glass Skin Cheek Glaze',
    description: 'A clear, dewy balm blush infused with fine peach pearls for a glass-skin wet gloss look.',
    category: 'Blush',
    colors: ['#f43f5e', '#fed7aa', '#ffffff'],
    requestedBy: 'glow_expert',
    votes: 35,
    votedUsers: [],
    isPublic: true,
    createdAt: Date.now() - 3600000 * 35
  },
  {
    id: 'req_3',
    title: 'Sultry Velvet Plum Lip Clay',
    description: 'An ultra-matte lip cream with zero transfer, in a deep vampy plum red shade.',
    category: 'Lips',
    colors: ['#581c87', '#701a75', '#881337'],
    requestedBy: 'vamp_glam',
    votes: 29,
    votedUsers: [],
    isPublic: true,
    createdAt: Date.now() - 3600000 * 29
  },
  {
    id: 'req_4',
    title: 'Ethereal Moon Dust Sparkle Highlighter',
    description: 'A sheer body and face glitter powder with silver diamond dust reflections and no chalky base.',
    category: 'Highlight',
    colors: ['#e2e8f0', '#ffffff', '#e0f2fe'],
    requestedBy: 'moonchild_99',
    votes: 24,
    votedUsers: [],
    isPublic: true,
    createdAt: Date.now() - 3600000 * 24
  }
];

export const TrendingPage: React.FC = () => {
  const [requests, setRequests] = useState<LookRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Eyes');
  const [requestedBy, setRequestedBy] = useState<string>(() => localStorage.getItem('tryon_beauty_username') || '');
  const [color1, setColor1] = useState<string>('#db2777');
  const [color2, setColor2] = useState<string>('#9333ea');
  const [color3, setColor3] = useState<string>('#f59e0b');
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Animation and Success State
  const [isAnimatingSubmit, setIsAnimatingSubmit] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  
  const [votedIds, setVotedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tryon_beauty_voted_requests') || '[]');
    } catch {
      return [];
    }
  });

  const categories = ['Eyes', 'Lips', 'Blush', 'Highlight', 'Full Face', 'Other'];

  const currentUser = requestedBy.trim() || localStorage.getItem('tryon_beauty_username') || localStorage.getItem('kobella_username') || '';

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'requests'));
      const dbRequests: LookRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        dbRequests.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          category: data.category,
          colors: data.colors || [],
          requestedBy: data.requestedBy || 'Anonymous',
          votes: data.votes || 0,
          votedUsers: data.votedUsers || [],
          isPublic: data.isPublic !== false, // default to true
          status: (data.status || 'requested') as 'requested' | 'selected' | 'being built' | 'released',
          createdAt: data.createdAt || Date.now()
        });
      });

      if (dbRequests.length === 0) {
        for (const preset of PRESET_REQUESTS) {
          const { id, ...data } = preset;
          await addDoc(collection(db, 'requests'), {
            ...data,
            createdAt: Date.now() - (preset.votes * 3600 * 1000)
          });
        }
        const newSnapshot = await getDocs(collection(db, 'requests'));
        const seededRequests: LookRequest[] = [];
        newSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          seededRequests.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            category: data.category,
            colors: data.colors || [],
            requestedBy: data.requestedBy || 'Anonymous',
            votes: data.votes || 0,
            votedUsers: data.votedUsers || [],
            isPublic: data.isPublic !== false,
            status: (data.status || 'requested') as 'requested' | 'selected' | 'being built' | 'released',
            createdAt: data.createdAt || Date.now()
          });
        });
        seededRequests.sort((a, b) => b.votes - a.votes);
        setRequests(seededRequests);
      } else {
        dbRequests.sort((a, b) => b.votes - a.votes);
        setRequests(dbRequests);
      }
    } catch (err) {
      console.error("Error loading requests from Firebase:", err);
      setRequests(PRESET_REQUESTS.sort((a, b) => b.votes - a.votes));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const finalUsername = requestedBy.trim() || 'Anonymous';
    localStorage.setItem('tryon_beauty_username', finalUsername);

    const newRequestData = {
      title: title.trim(),
      description: description.trim(),
      category,
      colors: [color1, color2, color3],
      requestedBy: finalUsername,
      votes: 1,
      votedUsers: [],
      isPublic,
      status: 'requested' as 'requested' | 'selected' | 'being built' | 'released',
      createdAt: Date.now()
    };

    try {
      // 1. Open the mailbox letter drop animation overlay!
      setIsAnimatingSubmit(true);

      // Save to Firebase (await)
      const docRef = await addDoc(collection(db, 'requests'), newRequestData);
      
      const addedRequest: LookRequest = {
        id: docRef.id,
        ...newRequestData
      };

      // Mark this proposal as voted by the user immediately
      const newVoted = [...votedIds, docRef.id];
      setVotedIds(newVoted);
      localStorage.setItem('tryon_beauty_voted_requests', JSON.stringify(newVoted));

      // 2. Wait for the animation to play beautifully (e.g. 2300ms) then refresh the page!
      setTimeout(() => {
        setIsAnimatingSubmit(false);
        setFormSuccess(true);
        setTitle('');
        setDescription('');
        
        // Reload page to show saved state at the top of ranking
        window.location.reload();
      }, 2350);

    } catch (err) {
      console.error("Error submitting custom request: ", err);
      setIsAnimatingSubmit(false);
    }
  };

  const handleUpvote = async (id: string) => {
    if (votedIds.includes(id)) return;

    try {
      const docRef = doc(db, 'requests', id);
      await updateDoc(docRef, { votes: increment(1) });

      const newVoted = [...votedIds, id];
      setVotedIds(newVoted);
      localStorage.setItem('tryon_beauty_voted_requests', JSON.stringify(newVoted));

      setRequests(prev =>
        prev.map(req => req.id === id ? { ...req, votes: req.votes + 1 } : req)
            .sort((a, b) => b.votes - a.votes)
      );
    } catch (err) {
      console.error("Error casting request upvote: ", err);
    }
  };

  const calculateTrendingStats = () => {
    const totalVotes = requests.reduce((sum, req) => sum + req.votes, 0);
    
    const catCounts: Record<string, number> = {};
    categories.forEach(c => catCounts[c] = 0);
    
    requests.forEach(req => {
      if (catCounts[req.category] !== undefined) {
        catCounts[req.category] += req.votes;
      } else {
        catCounts['Other'] += req.votes;
      }
    });

    const categoryStats = Object.keys(catCounts).map(name => {
      const val = catCounts[name];
      const pct = totalVotes > 0 ? Math.round((val / totalVotes) * 100) : 0;
      return { name, value: val, percentage: pct };
    }).sort((a, b) => b.value - a.value);

    return { totalVotes, categories: categoryStats };
  };

  const trendingStats = calculateTrendingStats();

  // Filter requests based on privacy rules:
  // - Show public requests (isPublic !== false)
  // - Show private requests belonging to the CURRENT user only!
  const visibleRequests = requests.filter(req => {
    const isOwner = currentUser && req.requestedBy.toLowerCase() === currentUser.toLowerCase();
    return req.isPublic !== false || isOwner;
  });

  const filteredRequests = visibleRequests.filter(req => {
    const matchesSearch = searchQuery.trim() === '' || 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div id="trending-page" className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-stone-800 animate-in fade-in duration-300 relative">
      
      {/* MAILBOX LETTER ANIMATION OVERLAY */}
      {isAnimatingSubmit && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[24px] border border-[#bc8381]/25 p-8 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-x-8 -top-20 h-44 bg-[#732729]/10 blur-3xl pointer-events-none" />
            
            {/* Mailbox Container with Slot and sliding letter */}
            <div className="relative h-48 flex flex-col items-center justify-center">
              
              {/* Box Slot */}
              <div className="absolute bottom-4 w-40 h-16 bg-[#732729] rounded-b-xl border-t border-[#bc8381]/50 flex items-center justify-center shadow-lg">
                <div className="absolute top-0 w-32 h-2.5 bg-stone-950 rounded-full mt-1.5 shadow-inner overflow-hidden flex justify-center">
                  {/* Flap flip rotation */}
                  <motion.div 
                    animate={{ rotateX: [0, -90, -90, 0] }}
                    transition={{ delay: 0.6, duration: 0.8, times: [0, 0.3, 0.7, 1] }}
                    className="w-full h-full bg-stone-800 origin-top"
                  />
                </div>
                <span className="text-[8px] font-black uppercase text-[#bc8381] tracking-widest mt-5">Gleame Lab Box</span>
              </div>

              {/* Envelope / Letter Card */}
              <motion.div
                initial={{ y: -120, scale: 0.9, opacity: 1, rotate: -5 }}
                animate={{ 
                  y: [null, -100, -90, 8], 
                  scale: [1, 1, 0.7, 0.25], 
                  opacity: [1, 1, 1, 0],
                  rotate: [null, -5, 5, 0]
                }}
                transition={{ 
                  duration: 1.8, 
                  times: [0, 0.2, 0.5, 1],
                  ease: "easeInOut" 
                }}
                className="w-56 bg-[#faf6f5] border border-[#bc8381]/30 p-4 rounded-xl shadow-md space-y-2 text-left z-10"
              >
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#bc8381]/20 border border-[#bc8381]/45 flex items-center justify-center font-serif text-[10px] font-black text-[#732729]">
                  G
                </div>
                <div className="text-[8px] font-black text-[#bc8381] uppercase tracking-wider">New Look Proposal</div>
                <h4 className="text-xs font-bold text-stone-800 line-clamp-1">{title || 'Custom Shader'}</h4>
                <p className="text-[9px] text-stone-500 font-medium line-clamp-1">{category}</p>
                <div className="flex gap-1.5 pt-1">
                  <div style={{ backgroundColor: color1 }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                  <div style={{ backgroundColor: color2 }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                  <div style={{ backgroundColor: color3 }} className="w-3.5 h-3.5 rounded-full border border-stone-200" />
                </div>
              </motion.div>

              {/* Star sparkles emanating on receipt */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 0, 1.3, 1], opacity: [0, 0, 1, 1] }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute bottom-16 flex items-center justify-center text-[#ff3f87] font-black text-xs"
              >
                ✨ Received!
              </motion.div>
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-black text-stone-900 text-lg uppercase tracking-wider">Depositing Proposal...</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto font-semibold">
                Your creative recipe card is sliding straight into our developer queue. Saving & refreshing board...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: Controls & Distribution Form (Cols: 4) */}
      <div className="xl:col-span-4 space-y-6">
        
        {/* STATS PANEL */}
        <div className="bg-white rounded-2xl p-5 border border-[#bc8381]/25 shadow-md text-left">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#732729] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#732729]" /> Trending Demand Metrics
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-[#bc8381]/10 rounded-xl border border-[#bc8381]/25 shadow-inner">
              <span className="text-xs font-bold text-[#732729]">Total Tracked Votes</span>
              <span className="text-sm font-black text-[#732729]">{trendingStats.totalVotes} Votes</span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-stone-600 block mb-2">Demand by Cosmetic Category</span>
              <div className="space-y-2.5">
                {trendingStats.categories.slice(0, 4).map((stat) => (
                  <div key={stat.name} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-stone-700 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          stat.name === 'Eyes' ? 'bg-[#732729]' :
                          stat.name === 'Lips' ? 'bg-[#bc8381]' :
                          stat.name === 'Blush' ? 'bg-amber-600' : 'bg-stone-400'
                        }`} />
                        {stat.name}
                      </span>
                      <span className="text-stone-400">{stat.percentage}% ({stat.value} votes)</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${stat.percentage}%` }}
                        className={`h-full rounded-full ${
                          stat.name === 'Eyes' ? 'bg-[#732729]' :
                          stat.name === 'Lips' ? 'bg-[#bc8381]' :
                          stat.name === 'Blush' ? 'bg-amber-600' : 'bg-stone-300'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#faf6f5] rounded-xl p-3 border border-[#bc8381]/20 text-[10px] leading-relaxed text-stone-500 font-semibold">
              💡 <span className="font-bold text-[#732729]">Lab Specialist Tip:</span> High-fidelity velvet plum shades and holographic pearl formulas are heavily requested. Ensure these elements are mixed in custom blueprints.
            </div>
          </div>
        </div>

        {/* SUBMISSION FORM */}
        <div className="bg-white rounded-2xl p-6 border border-[#bc8381]/25 shadow-md text-left">
          <div className="mb-4">
            <h3 className="text-base font-serif font-bold text-[#732729]">Propose Next Shaders</h3>
            <p className="text-[11px] text-stone-500 font-semibold">Request a specific makeup shade or finishing filter formula to be modeled next.</p>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            {formSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2 text-emerald-600 text-xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Proposed successfully! Initial vote credited.</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Look Name / Concept</label>
              <input
                type="text"
                required
                placeholder="e.g. Chrome Prism Violet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-[#bc8381]/35 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold text-stone-800 bg-[#faf6f5]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs bg-[#faf6f5] border border-[#bc8381]/35 rounded-lg px-2.5 py-2.5 font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#732729]/50"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-white text-stone-800">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Your Name</label>
                <input
                  type="text"
                  placeholder="designer_99"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#bc8381]/35 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold text-stone-800 bg-[#faf6f5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Associated Palette Colors (Pick 3)</label>
              <div className="flex items-center gap-3 bg-[#faf6f5] p-2.5 border border-[#bc8381]/25 rounded-xl justify-between shadow-xs">
                <div className="flex items-center gap-1.5">
                  <input 
                    type="color" 
                    value={color1} 
                    onChange={(e) => setColor1(e.target.value)} 
                    className="w-6 h-6 rounded-full border border-stone-200 overflow-hidden cursor-pointer shrink-0"
                  />
                  <span className="text-[10px] text-stone-400 font-mono font-bold">{color1.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-[#bc8381]/15 pl-3">
                  <input 
                    type="color" 
                    value={color2} 
                    onChange={(e) => setColor2(e.target.value)} 
                    className="w-6 h-6 rounded-full border border-stone-200 overflow-hidden cursor-pointer shrink-0"
                  />
                  <span className="text-[10px] text-stone-400 font-mono font-bold">{color2.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-[#bc8381]/15 pl-3">
                  <input 
                    type="color" 
                    value={color3} 
                    onChange={(e) => setColor3(e.target.value)} 
                    className="w-6 h-6 rounded-full border border-stone-200 overflow-hidden cursor-pointer shrink-0"
                  />
                  <span className="text-[10px] text-stone-400 font-mono font-bold">{color3.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-1.5">Describe your Finish Vision</label>
              <textarea
                required
                placeholder="Describe texture specifications (e.g., high density chromatic glitter glaze, matte clay)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-xs px-3.5 py-2.5 border border-[#bc8381]/35 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold text-stone-800 bg-[#faf6f5]"
              />
            </div>

            {/* PUBLICITY PRIVACY TOGGLE SETTING */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide">Visibility Option</label>
              <div className="bg-[#faf6f5] p-3 rounded-xl border border-[#bc8381]/25 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-[#732729] border-[#bc8381]/35 rounded focus:ring-[#732729]/50"
                  />
                  <span className="text-xs font-bold text-stone-800">Publish to Community Board</span>
                </label>

                {isPublic ? (
                  <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                    🌟 This look request will be displayed publicly on the community board so other users can view, share, and vote to increase its development priority.
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-700/80 font-bold leading-relaxed bg-amber-500/10 border border-amber-500/15 p-2 rounded-lg">
                    🔒 Private Submission: This request is set to private. Lab specialists will review your submission confidentially, but it will not appear on the public board for voting.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#732729] hover:bg-[#5c1d1f] text-white font-extrabold text-xs tracking-widest uppercase py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Submit Proposal
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Demand Board with Covers (Cols: 8) */}
      <div className="xl:col-span-8 bg-white rounded-2xl p-6 border border-[#bc8381]/25 shadow-md min-h-[600px] text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#bc8381]/25 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#732729]">Proposed Ideas & Vote Rankings</h3>
            <p className="text-xs text-stone-500">These concepts are actively designed based on community support. Upvote your favorites!</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search ideas or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-8 py-2 bg-[#faf6f5] border border-[#bc8381]/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold text-stone-800 placeholder-stone-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200/50 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <span className="text-xs font-bold text-[#732729] bg-[#bc8381]/10 border border-[#bc8381]/25 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">
              {filteredRequests.length} Proposals
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-stone-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#732729]" />
            <span className="text-xs font-bold">Loading proposals from community registry...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[#bc8381]/40 rounded-2xl bg-[#faf6f5]/50 text-stone-400 space-y-3">
            <p className="text-sm font-bold">No proposals found matching your search.</p>
            <p className="text-xs">Try searching for something else or submit your own concept on the left!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRequests.map((req) => {
              const hasVoted = votedIds.includes(req.id);
              const cardCover = CATEGORY_COVERS[req.category] || CATEGORY_COVERS['Other'];
              const isPrivate = req.isPublic === false;

              return (
                <div
                  key={req.id}
                  className="group bg-white rounded-2xl border border-[#bc8381]/25 hover:border-[#732729]/35 overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-[0_10px_20px_rgba(115,39,41,0.06)]"
                >
                  {/* Portrait Cover */}
                  <div className="relative h-40 w-full overflow-hidden bg-stone-100 border-b border-[#bc8381]/15">
                    <img 
                      src={cardCover} 
                      alt={req.category}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />

                    {/* Meta tag */}
                    <div className="absolute top-3 left-3 bg-white/95 border border-[#bc8381]/25 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase text-[#732729]">
                      {req.category}
                    </div>

                    {isPrivate && (
                      <div className="absolute top-3 right-3 bg-amber-600 border border-amber-500/30 px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-xs">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 text-[10px] text-white/90 font-bold">
                      Proposed by @{req.requestedBy}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-serif font-black text-[#732729] text-sm group-hover:text-[#bc8381] transition-colors flex items-center gap-1.5">
                        {req.title}
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed font-semibold line-clamp-3">
                        {req.description}
                      </p>

                      {isPrivate && (
                        <div className="mt-2 text-[10px] text-amber-700 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg font-bold">
                          🔒 Only you can see this private proposal.
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Swatches */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase text-stone-400 tracking-wider">Concept Palette</span>
                        <div className="flex gap-1">
                          {req.colors.map((color, idx) => (
                            <div
                              key={`${color}-${idx}`}
                              style={{ backgroundColor: color }}
                              className="w-4 h-4 rounded-full border border-stone-200"
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Vote Buttons */}
                      <div className="flex items-center justify-between border-t border-[#bc8381]/15 pt-3">
                        <div className="flex items-center gap-1.5">
                          <Heart className={`w-4 h-4 text-[#732729] ${hasVoted ? 'fill-current' : ''}`} />
                          <span className="text-xs font-bold text-stone-700">{req.votes} <span className="text-stone-400">votes</span></span>
                        </div>

                        <button
                          onClick={() => handleUpvote(req.id)}
                          disabled={hasVoted}
                          className={`text-[10px] font-extrabold tracking-widest uppercase px-3.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                            hasVoted
                              ? 'bg-[#bc8381]/15 text-[#732729] border border-[#bc8381]/20 cursor-default'
                              : 'bg-[#732729] hover:bg-[#5c1d1f] text-white border border-transparent'
                          }`}
                        >
                          {hasVoted ? 'Voted' : 'Upvote'}
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
    </div>
  );
};
