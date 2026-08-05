import React, { useState, useEffect } from 'react';
import { Flame, LogIn } from 'lucide-react';
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

type LabNavTarget = 'sandbox' | 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes' | 'profile';

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

  const [activeTab, setActiveTab] = useState<'home' | LabNavTarget>(() => {
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

  const handleNavigate = (tab: 'home' | LabNavTarget) => {
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(255,63,135,0.16),transparent_30%),linear-gradient(135deg,#f7f7f5,#ecebea_48%,#f8eef4)] text-stone-900 font-sans antialiased selection:bg-[#ff3f87]/12 selection:text-stone-950 pb-32">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/[0.74] shadow-[0_12px_30px_rgba(20,20,20,0.06)] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px] py-3">
            <div 
              onClick={() => { handleNavigate('home'); setActivePreset(null); }}
              className="flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-11 h-11 bg-gradient-to-tr from-stone-950 via-stone-800 to-[#ff3f87] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_12px_26px_rgba(20,20,20,0.18)]">
                <span className="font-black text-xl text-white">G</span>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-normal text-stone-950 flex items-center gap-1.5">
                  Gleame
                </h1>
                <p className="text-[9px] text-stone-500 uppercase tracking-[0.2em] font-bold">Explore looks and challenges</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[9px] text-stone-400 uppercase font-bold tracking-widest">Native try-on below</span>
                <span className="text-[11px] font-black text-[#d7b56d]">Explore / Looks / Lab</span>
              </div>
              <div className="w-px h-8 bg-stone-200 hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                {firebaseUser ? (
                  <div 
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2 bg-white/[0.70] border border-white/80 hover:bg-white px-3.5 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                  >
                    <div className="w-5 h-5 bg-stone-950 rounded-lg flex items-center justify-center text-[10px] text-white font-black uppercase shadow-inner">
                      {username.charAt(0) || 'U'}
                    </div>
                    <span className="text-stone-800">@{username}</span>
                    <span className="text-[9px] text-[#ff3f87] bg-[#ff3f87]/10 px-1.5 py-0.5 rounded uppercase font-black tracking-widest ml-1 hidden md:inline-block">Account</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2 bg-stone-950 hover:bg-stone-800 text-white px-3.5 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md"
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

    </div>
  );
}
