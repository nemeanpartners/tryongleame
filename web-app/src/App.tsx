import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  LogIn, 
  Menu, 
  X, 
  Home, 
  Sliders, 
  Grid, 
  Award, 
  TrendingUp, 
  Sparkles, 
  Trophy, 
  User,
  Compass,
  Columns2,
  Layers,
  Palette,
  ArrowRight,
  Video
} from 'lucide-react';
import SandboxPage from './components/sandbox/SandboxPage';
import { Homepage } from './components/home/Homepage';
import { GalleryPage } from './components/gallery/GalleryPage';
import { HallOfFamePage } from './components/hall-of-fame/HallOfFamePage';
import { TrendingPage } from './components/trending/TrendingPage';
import { BuiltLooksPage } from './components/built-looks/BuiltLooksPage';
import { VotesPage } from './components/votes/VotesPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { TiktokEffectsPage } from './components/tiktok-effects/TiktokEffectsPage';
import { PresetLook } from './types';
import { auth, db, doc, setDoc } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { installGleameNativeBridge } from './lib/nativeBridge';

type LabNavTarget = 'sandbox' | 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes' | 'profile' | 'looks' | 'tiktok-effects';

export default function App() {
  // Path helper mapping
  const getTabFromPath = (path: string): 'home' | LabNavTarget => {
    const cleanPath = path.toLowerCase().replace(/\/$/, ''); // Remove trailing slash
    switch (cleanPath) {
      case '/home':
      case '':
      case '/':
        return 'home';
      case '/editor':
      case '/sandbox':
        return 'sandbox';
      case '/gallery':
        return 'gallery';
      case '/legends':
      case '/hall-of-fame':
        return 'hall-of-fame';
      case '/trending':
        return 'trending';
      case '/presets':
      case '/built-looks':
        return 'built-looks';
      case '/votes':
        return 'votes';
      case '/profile':
        return 'profile';
      case '/looks':
        return 'looks';
      case '/tiktok-effects':
        return 'tiktok-effects';
      default:
        return 'home';
    }
  };

  const getPathFromTab = (tab: string): string => {
    switch (tab) {
      case 'home':
        return '/home';
      case 'sandbox':
        return '/editor';
      case 'gallery':
        return '/gallery';
      case 'hall-of-fame':
        return '/legends';
      case 'trending':
        return '/trending';
      case 'built-looks':
        return '/presets';
      case 'votes':
        return '/votes';
      case 'profile':
        return '/profile';
      case 'looks':
        return '/looks';
      case 'tiktok-effects':
        return '/tiktok-effects';
      default:
        return '/home';
    }
  };

  const [activeTab, setActiveTab] = useState<'home' | LabNavTarget>(() => {
    return getTabFromPath(window.location.pathname);
  });
  const [activePreset, setActivePreset] = useState<PresetLook | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeLabMenu, setActiveLabMenu] = useState<boolean>(false);
  
  // Triggers updates across lists when a new challenge look is entered
  const [refreshSubmissionsTrigger, setRefreshSubmissionsTrigger] = useState<number>(0);

  // Community Username state
  const [username, setUsername] = useState<string>(() => localStorage.getItem('kobella_username') || '');
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(!localStorage.getItem('kobella_username'));
  
  // Firebase Auth user state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || '';
        if (name) {
          setUsername(name);
          localStorage.setItem('kobella_username', name);
          setIsEditingUsername(false);
        }
        void setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || null,
          displayName: user.displayName || name || null,
          photoURL: user.photoURL || null,
          providerIds: user.providerData.map((provider) => provider.providerId),
          lastSeenAt: Date.now()
        }, { merge: true });
      } else {
        // If logged out, revert to localStorage username if any
        const local = localStorage.getItem('kobella_username') || '';
        setUsername(local);
        setIsEditingUsername(!local);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to popstate for browser routing back/forward
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname);
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    return installGleameNativeBridge(handleChallengeSubmitSuccess);
  }, []);

  const handleSaveUsername = () => {
    if (username.trim()) {
      localStorage.setItem('kobella_username', username.trim());
      setIsEditingUsername(false);
    }
  };

  const handleNavigate = (tab: 'home' | LabNavTarget) => {
    const newPath = getPathFromTab(tab);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    setActiveTab(tab);
    setActiveLabMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPresetForTryOn = (preset: PresetLook) => {
    setActivePreset(preset);
    handleNavigate('sandbox');
    
    // Smooth scroll to sandbox viewport
    setTimeout(() => {
      const sandboxEl = document.getElementById('sandbox-container');
      if (sandboxEl) {
        sandboxEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleChallengeSubmitSuccess = () => {
    setRefreshSubmissionsTrigger(prev => prev + 1);
    handleNavigate('gallery');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(255,63,135,0.16),transparent_30%),linear-gradient(135deg,#f7f7f5,#ecebea_48%,#f8eef4)] text-stone-900 font-sans antialiased selection:bg-[#ff3f87]/12 selection:text-stone-950 pb-32">
      
      {/* SIDEBAR NAVIGATION DRAWER */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm transition-opacity duration-300"
          />
          
          {/* Drawer Panel */}
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full shadow-[5px_0_30px_rgba(0,0,0,0.15)] border-r border-stone-200/60 z-10 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-tr from-stone-950 via-stone-800 to-[#ff3f87] rounded-xl flex items-center justify-center shadow-md">
                  <span className="font-black text-sm text-white">G</span>
                </div>
                <div>
                  <span className="font-black tracking-wider text-stone-950 text-sm">GLEAME</span>
                  <p className="text-[8px] text-[#ff3f87] font-bold uppercase tracking-widest">Design Lab</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Section inside Sidebar */}
            <div className="p-5 bg-gradient-to-r from-stone-50 to-stone-100/50 border-b border-stone-100">
              {firebaseUser ? (
                <div 
                  onClick={() => { handleNavigate('profile'); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-gradient-to-tr from-stone-950 to-[#ff3f87] rounded-xl flex items-center justify-center text-white font-black uppercase shadow-sm">
                    {username.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-stone-900 truncate">@{username}</p>
                    <p className="text-[10px] text-stone-400 font-semibold truncate">{firebaseUser.email}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-stone-500 font-semibold leading-normal">
                    Sign in to sync your created looks, vote on community challenges, and track active presets.
                  </p>
                  <button 
                    onClick={() => { handleNavigate('profile'); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-stone-950 hover:bg-stone-800 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Profile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 py-6 space-y-1.5">
              <p className="px-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2.5">Studio Navigation</p>
              
              {[
                { id: 'home', label: 'Home Page', desc: 'Challenges & active streams', icon: Home },
                { id: 'sandbox', label: 'Mix & Match', desc: 'Customize real-time look formulas', icon: Sliders },
                { id: 'gallery', label: 'Community Gallery', desc: 'Browse submitted blueprints', icon: Grid },
                { id: 'hall-of-fame', label: 'Hall of Fame', desc: 'Browse legendary contest winners', icon: Award },
                { id: 'trending', label: 'Trending Looks', desc: 'Hottest filter combinations', icon: TrendingUp },
                { id: 'built-looks', label: 'Try On Looks', desc: 'Our handcrafted styles', icon: Sparkles },
                { id: 'tiktok-effects', label: 'TikTok Effects', desc: 'Our published viral filters', icon: Video },
                { id: 'votes', label: 'Votes & Pipeline', desc: 'Upvote upcoming formula releases', icon: Trophy },
                { id: 'profile', label: 'Studio Profile', desc: 'Your custom portfolio & stats', icon: User },
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavigate(item.id as any);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-[#ff3f87]/10 text-[#ff3f87] font-black border-l-4 border-[#ff3f87] pl-3' 
                        : 'text-stone-700 hover:text-stone-950 hover:bg-stone-50 font-bold'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-[#ff3f87]/10' : 'bg-stone-100 text-stone-500'}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-tight">{item.label}</p>
                      <p className={`text-[9px] truncate ${isActive ? 'text-[#ff3f87]/70' : 'text-stone-400 font-normal'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-stone-100 text-center bg-stone-50/50">
              <span className="text-[9px] text-[#d7b56d] font-bold uppercase tracking-widest">© 2026 GLEAME LAB</span>
              <p className="text-[8px] text-stone-400 font-medium mt-0.5">Version 1.0.4 (Stable Release)</p>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/[0.74] shadow-[0_8px_20px_rgba(20,20,20,0.04)] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 py-2">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => { handleNavigate('home'); setActivePreset(null); }}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 bg-gradient-to-tr from-stone-950 via-stone-800 to-[#ff3f87] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_4px_12px_rgba(20,20,20,0.12)]">
                  <span className="font-black text-sm text-white">G</span>
                </div>
                <div>
                  <h1 className="text-base font-black tracking-normal text-stone-950 flex items-center gap-1.5">
                    Gleame
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                {firebaseUser ? (
                  <div 
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2 bg-white/[0.70] border border-white/80 hover:bg-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    <div className="w-4.5 h-4.5 bg-stone-950 rounded-lg flex items-center justify-center text-[9px] text-white font-black uppercase shadow-inner">
                      {username.charAt(0) || 'U'}
                    </div>
                    <span className="text-stone-800 text-[11px]">@{username}</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2 bg-stone-950 hover:bg-stone-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Sign In</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* CORE VIEWPORT STAGE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 sm:pt-6">
        
        {/* Render Active View Tab */}
        {activeTab === 'home' && (
          <Homepage 
            onNavigate={handleNavigate} 
            onLoadPreset={handleSelectPresetForTryOn} 
          />
        )}

        {activeTab === 'sandbox' && (
          <SandboxPage 
            onChallengeSubmitSuccess={handleChallengeSubmitSuccess} 
            activePreset={activePreset}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryPage 
            onTryOnSubmission={handleSelectPresetForTryOn}
            refreshTrigger={refreshSubmissionsTrigger}
          />
        )}

        {activeTab === 'hall-of-fame' && (
          <HallOfFamePage 
            onSelectWinningLookForTryOn={handleSelectPresetForTryOn}
          />
        )}

        {activeTab === 'trending' && (
          <TrendingPage />
        )}

        {activeTab === 'built-looks' && (
          <BuiltLooksPage 
            onLoadPreset={handleSelectPresetForTryOn}
          />
        )}

        {activeTab === 'votes' && (
          <VotesPage 
            onLoadPreset={handleSelectPresetForTryOn}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage 
            onLoadPreset={handleSelectPresetForTryOn}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'tiktok-effects' && (
          <TiktokEffectsPage />
        )}

        {activeTab === 'looks' && (
          <div className="space-y-6 text-center py-6 sm:py-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Page header */}
            <div className="space-y-2 mb-8">
              <h2 className="text-2xl font-black uppercase tracking-wider text-stone-950">
                THE LOOKS PORTAL
              </h2>
              <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium tracking-wide">
                Experience instant beauty transformations or design your signature cosmetic style in our interactive studio.
              </p>
            </div>

            {/* Glassmorphic cards container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
              
              {/* Card 1: Try Looks */}
              <div 
                onClick={() => handleNavigate('built-looks')}
                className="group relative overflow-hidden rounded-[24px] border border-white/60 bg-white/70 hover:bg-white/90 p-6 shadow-[0_12px_32px_rgba(20,20,20,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(255,63,135,0.12)] cursor-pointer text-left flex flex-col justify-between h-64 border-stone-200/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff3f87]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#ff3f87]/10 transition-colors" />
                
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#ff3f87]/10 text-[#ff3f87] flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 tracking-tight">Try On Looks</h3>
                    <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-1">
                      Instantly overlay trending community presets and challenge designs live using your device's camera.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[#ff3f87] font-black text-xs uppercase tracking-widest pt-4 border-t border-stone-100 mt-4 group-hover:text-stone-950 transition-colors">
                  <span>Enter Try-On</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Build Mode */}
              <div 
                onClick={() => handleNavigate('sandbox')}
                className="group relative overflow-hidden rounded-[24px] border border-white/60 bg-white/70 hover:bg-white/90 p-6 shadow-[0_12px_32px_rgba(20,20,20,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(20,20,20,0.12)] cursor-pointer text-left flex flex-col justify-between h-64 border-stone-200/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-stone-950/5 rounded-full blur-2xl pointer-events-none group-hover:bg-stone-950/10 transition-colors" />

                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-900 flex items-center justify-center shadow-xs">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 tracking-tight">Mix & Match</h3>
                    <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-1">
                      Design your own custom makeup looks, fine-tune pigments, and publish formulas to the community.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-stone-900 font-black text-xs uppercase tracking-widest pt-4 border-t border-stone-100 mt-4 group-hover:text-[#ff3f87] transition-colors">
                  <span>Open Creator Lab</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-stone-950 text-white/55 border-t border-white/10 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3.5">
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="font-black tracking-widest uppercase text-lg">G L E A M E</span>
            <Flame className="w-4 h-4 text-[#ff3f87] animate-pulse" />
          </div>
          <p className="text-xs text-white/55 leading-relaxed max-w-md mx-auto">
            Explore community looks, vote on challenges, and use the native Looks portal for camera try-on and build mode.
          </p>
          <div className="text-[10px] text-[#d7b56d] font-bold uppercase tracking-widest">
            © 2026 Gleame. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Click Away Dismissal Overlay for Submenus */}
      {activeLabMenu && (
        <div 
          onClick={() => {
            setActiveLabMenu(false);
          }}
          className="fixed inset-0 z-40 bg-transparent"
        />
      )}

      {/* FLOATING GLASSMORPHIC BOTTOM NAVIGATION BAR */}
      <div id="floating-bottom-nav" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[340px] xs:max-w-xs sm:max-w-sm px-4 sm:px-0">
        <div className="relative">
          
          {/* Lab Liquid Options List (Remaining Pages Stacked Liquid style) */}
          {activeLabMenu && (
            <div className="absolute bottom-18 right-0 flex flex-col items-end gap-1.5 w-44 sm:w-48 animate-in fade-in slide-in-from-bottom-4 duration-250">
              {[
                { id: 'gallery', label: 'Gallery', icon: Grid },
                { id: 'votes', label: 'Vote Board', icon: Trophy },
                { id: 'trending', label: 'Trending', icon: TrendingUp },
                { id: 'hall-of-fame', label: 'Legends', icon: Award },
                { id: 'tiktok-effects', label: 'TikTok Effects', icon: Video },
                { id: 'profile', label: 'Profile', icon: User }
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavigate(item.id as any);
                      setActiveLabMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-full text-[10px] sm:text-[11px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.3)] border transition-all cursor-pointer transform hover:-translate-x-1.5 duration-200 ${
                      isActive
                        ? 'bg-[#ff3f87]/20 border-[#ff3f87]/40 text-[#ff3f87]'
                        : 'bg-stone-900/95 backdrop-blur-xl border-white/10 text-stone-300 hover:text-white hover:bg-stone-800'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Pill Tab Container */}
          <div className="bg-stone-900/95 backdrop-blur-xl border border-white/10 p-1.5 rounded-full flex items-center justify-between gap-1 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            
            {/* Tab 1: Explore */}
            <button
              onClick={() => {
                handleNavigate('home');
                setActiveLabMenu(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#ff3f87]/15 border border-[#ff3f87]/40 text-[#ff3f87] shadow-[0_0_15px_rgba(255,63,135,0.25)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Explore</span>
            </button>

            {/* Tab 2: Looks */}
            <button
              onClick={() => {
                handleNavigate('looks');
                setActiveLabMenu(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-full transition-all cursor-pointer ${
                ['looks', 'sandbox', 'built-looks'].includes(activeTab)
                  ? 'bg-[#ff3f87]/15 border border-[#ff3f87]/40 text-[#ff3f87] shadow-[0_0_15px_rgba(255,63,135,0.25)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Columns2 className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Looks</span>
            </button>

            {/* Tab 3: Lab */}
            <button
              onClick={() => {
                setActiveLabMenu(!activeLabMenu);
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-full transition-all cursor-pointer ${
                activeLabMenu || ['gallery', 'votes', 'trending', 'hall-of-fame', 'profile', 'tiktok-effects'].includes(activeTab)
                  ? 'bg-[#ff3f87]/15 border border-[#ff3f87]/40 text-[#ff3f87] shadow-[0_0_15px_rgba(255,63,135,0.25)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Lab</span>
            </button>

          </div>

        </div>
      </div>

    </div>
  );
}
