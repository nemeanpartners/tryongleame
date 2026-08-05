import React, { useState, useEffect } from 'react';
import { Sparkles, Award, Sliders, Heart, TrendingUp, Trophy, User, BookOpen, MessageSquare, Flame, Home, Grid, LogIn } from 'lucide-react';
import SandboxPage from './components/sandbox/SandboxPage';
import { Homepage } from './components/home/Homepage';
import { GalleryPage } from './components/gallery/GalleryPage';
import { HallOfFamePage } from './components/hall-of-fame/HallOfFamePage';
import { TrendingPage } from './components/trending/TrendingPage';
import { BuiltLooksPage } from './components/built-looks/BuiltLooksPage';
import { VotesPage } from './components/votes/VotesPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { PresetLook } from './types';
import { auth, db, doc, setDoc } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { installGleameNativeBridge } from './lib/nativeBridge';

export default function App() {
  // Path helper mapping
  const getTabFromPath = (path: string): 'home' | 'sandbox' | 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes' | 'profile' => {
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
      default:
        return '/home';
    }
  };

  const [activeTab, setActiveTab] = useState<'home' | 'sandbox' | 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes' | 'profile'>(() => {
    return getTabFromPath(window.location.pathname);
  });
  const [activePreset, setActivePreset] = useState<PresetLook | null>(null);
  
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

  const handleNavigate = (tab: 'home' | 'sandbox' | 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes' | 'profile') => {
    const newPath = getPathFromTab(tab);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    setActiveTab(tab);
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
    <div className="min-h-screen bg-gradient-to-tr from-[#bc8381]/15 via-[#FAF6F5] to-[#f5eae7] text-stone-900 font-sans antialiased selection:bg-[#732729]/10 selection:text-[#732729] pb-32">
      
      {/* LUXURY COSMETIC BRAND HEADER */}
      <header className="sticky top-0 z-40 bg-[#5c1d1f] border-b border-[#bc8381]/30 backdrop-blur-md bg-opacity-95 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Rebranded Identity */}
            <div 
              onClick={() => { handleNavigate('home'); setActivePreset(null); }}
              className="flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-11 h-11 bg-gradient-to-tr from-[#bc8381] to-[#732729] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                <span className="font-serif font-bold italic text-xl text-white">T</span>
              </div>
              <div>
                <h1 className="text-xl font-serif font-black tracking-wide text-white flex items-center gap-1.5">
                  TryON <span className="font-light text-[#f5eae7]/90">Beauty Look LAB</span>
                </h1>
                <p className="text-[9px] text-[#f5eae7]/60 uppercase tracking-[0.2em] font-medium">Cosmetic Shader Blueprint Suite</p>
              </div>
            </div>

            {/* Profile / Username quick widget */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[9px] text-[#f5eae7]/80 uppercase font-bold tracking-widest">Interactive Sandbox</span>
                <span className="text-[11px] font-serif italic text-[#bc8381]">Formula Studio</span>
              </div>
              <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                {firebaseUser ? (
                  <div 
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2 bg-white/10 border border-[#bc8381]/40 hover:bg-white/15 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    <div className="w-5 h-5 bg-[#bc8381] rounded-lg flex items-center justify-center text-[10px] text-white font-serif italic font-black uppercase shadow-inner">
                      {username.charAt(0) || 'U'}
                    </div>
                    <span className="text-white">@{username}</span>
                    <span className="text-[9px] text-[#bc8381] bg-white/10 px-1.5 py-0.5 rounded uppercase font-black tracking-widest ml-1 hidden md:inline-block">Account</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2 bg-[#bc8381] hover:bg-[#bc8381]/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* CORE VIEWPORT STAGE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Render Active View Tab */}
        {activeTab === 'home' && (
          <Homepage onNavigate={handleNavigate} />
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

      </main>

      {/* FOOTER */}
      <footer className="bg-[#4d191b] text-[#f5eae7]/60 border-t border-[#bc8381]/30 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3.5">
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="font-serif font-black tracking-widest uppercase text-lg">T R Y O N &nbsp; B E A U T Y</span>
            <Flame className="w-4 h-4 text-[#bc8381] animate-pulse" />
          </div>
          <p className="text-xs text-[#f5eae7]/70 leading-relaxed max-w-md mx-auto">
            Design, formulate, and upvote custom real-time makeup filter blueprints. Ready to sync with professional digital rendering workflows.
          </p>
          <div className="text-[10px] text-[#bc8381] font-bold uppercase tracking-widest">
            © 2026 TryON Beauty Look LAB. All rights reserved.
          </div>
        </div>
      </footer>

      {/* FLOATING BOTTTOM NAVIGATION DOCK (Mimics the Luxury Phone Mockup bottom tabs in image) */}
      <div className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center">
        <nav className="bg-white/95 backdrop-blur-md border border-[#bc8381]/40 shadow-[0_10px_30px_rgba(115,39,41,0.15)] px-4 py-2.5 rounded-full flex items-center justify-between gap-1.5 max-w-2xl w-full">
          
          <button
            onClick={() => { handleNavigate('home'); setActivePreset(null); }}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
              activeTab === 'home'
                ? 'text-[#732729] scale-110'
                : 'text-stone-400 hover:text-[#bc8381]'
            }`}
            title="Home"
          >
            <div className={`p-2 rounded-full transition-all ${activeTab === 'home' ? 'bg-[#bc8381]/15 ring-1 ring-[#bc8381]/30' : ''}`}>
              <Home className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Home</span>
          </button>

          <button
            onClick={() => handleNavigate('sandbox')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
              activeTab === 'sandbox'
                ? 'text-[#732729] scale-110'
                : 'text-stone-400 hover:text-[#bc8381]'
            }`}
            title="Filter Blueprints"
          >
            <div className={`p-2 rounded-full transition-all ${activeTab === 'sandbox' ? 'bg-[#bc8381]/15 ring-1 ring-[#bc8381]/30' : ''}`}>
              <Sliders className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Editor</span>
          </button>

          <button
            onClick={() => handleNavigate('gallery')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
              activeTab === 'gallery'
                ? 'text-[#732729] scale-110'
                : 'text-stone-400 hover:text-[#bc8381]'
            }`}
            title="Gallery"
          >
            <div className={`p-2 rounded-full transition-all ${activeTab === 'gallery' ? 'bg-[#bc8381]/15 ring-1 ring-[#bc8381]/30' : ''}`}>
              <Grid className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Gallery</span>
          </button>

          <button
            onClick={() => handleNavigate('hall-of-fame')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
              activeTab === 'hall-of-fame'
                ? 'text-[#732729] scale-110'
                : 'text-stone-400 hover:text-[#bc8381]'
            }`}
            title="Hall of Fame"
          >
            <div className={`p-2 rounded-full transition-all ${activeTab === 'hall-of-fame' ? 'bg-[#bc8381]/15 ring-1 ring-[#bc8381]/30' : ''}`}>
              <Award className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Legends</span>
          </button>

          <button
            onClick={() => handleNavigate('trending')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
              activeTab === 'trending'
                ? 'text-[#732729] scale-110'
                : 'text-stone-400 hover:text-[#bc8381]'
            }`}
            title="Trending"
          >
            <div className={`p-2 rounded-full transition-all ${activeTab === 'trending' ? 'bg-[#bc8381]/15 ring-1 ring-[#bc8381]/30' : ''}`}>
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Trending</span>
          </button>

          <button
            onClick={() => handleNavigate('built-looks')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
              activeTab === 'built-looks'
                ? 'text-[#732729] scale-110'
                : 'text-stone-400 hover:text-[#bc8381]'
            }`}
            title="Built Looks"
          >
            <div className={`p-2 rounded-full transition-all ${activeTab === 'built-looks' ? 'bg-[#bc8381]/15 ring-1 ring-[#bc8381]/30' : ''}`}>
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Presets</span>
          </button>

          <button
            onClick={() => handleNavigate('votes')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
              activeTab === 'votes'
                ? 'text-[#732729] scale-110'
                : 'text-stone-400 hover:text-[#bc8381]'
            }`}
            title="Votes & Pipeline"
          >
            <div className={`p-2 rounded-full transition-all ${activeTab === 'votes' ? 'bg-[#bc8381]/15 ring-1 ring-[#bc8381]/30' : ''}`}>
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Votes</span>
          </button>

          <button
            onClick={() => handleNavigate('profile')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
              activeTab === 'profile'
                ? 'text-[#732729] scale-110'
                : 'text-stone-400 hover:text-[#bc8381]'
            }`}
            title="My Profile"
          >
            <div className={`p-2 rounded-full transition-all ${activeTab === 'profile' ? 'bg-[#bc8381]/15 ring-1 ring-[#bc8381]/30' : ''}`}>
              <User className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Profile</span>
          </button>

        </nav>
      </div>

    </div>
  );
}
