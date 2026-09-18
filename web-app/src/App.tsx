import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Users,
  Compass,
  Columns2,
  Layers,
  Palette,
  ArrowRight,
  Video,
  Bell,
  Plus
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
import { InspirationWall } from './components/inspiration/InspirationWall';
import { InspirationLooksScrollFeedPage } from './components/inspiration/InspirationLooksScrollFeedPage';
import { WantedLooksScrollFeedPage } from './components/wanted/WantedLooksScrollFeedPage';
import { WantedListPage } from './components/wanted/WantedListPage';
import { ShadeEditPage } from './components/shade-edit/ShadeEditPage';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage';
import { FrenchDoorIcon } from './components/common/FrenchDoorIcon';
import { AppleWandSparklesIcon } from './components/common/AppleWandSparklesIcon';
import { PresetLook } from './types';
import { auth, db, doc, setDoc } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { installGleameNativeBridge } from './lib/nativeBridge';
import { trackDwellTime } from './lib/analytics';
import { getEffectiveAvatar, loadUserProfileFromFirestore } from './lib/userProfileService';

type LabNavTarget = 'sandbox' | 'gallery' | 'gallery-looks' | 'gallery-challenges' | 'gallery-inspiration' | 'gallery-wanted' | 'wanted-list' | 'wanted-scrollfeed' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes' | 'profile' | 'looks' | 'tiktok-effects' | 'inspiration-wall' | 'inspirationlooks-scrollfeed' | 'shade-edit' | 'admin';

/**
 * In the iOS wrapper the Try On and Create dock tabs open the app's own native
 * filter pages. Returns true when the tap was handed to native, false in a
 * plain browser so the normal web route is used.
 */
const NATIVE_FILTER_TABS: Record<string, string> = { looks: 'try', sandbox: 'build' };

function openNativeFilterPage(tabId: string): boolean {
  const target = NATIVE_FILTER_TABS[tabId];
  const bridge = (window as any).GleameBridge || (window as any).TryOnBeautyBridge;
  if (!target || !bridge?.postMessage) return false;
  bridge.postMessage(
    JSON.stringify({ source: 'tryon-beauty-web', type: 'gleame:navigate-native', target })
  );
  return true;
}

/**
 * The iOS app shows the same saved looks as the web Create page, so they are
 * maintained in one place. The wrapper calls this once the page has loaded.
 */
function installPresetBridge() {
  const bridge = (window as any).GleameBridge || (window as any).TryOnBeautyBridge;
  if (!bridge?.postMessage) return;
  (window as any).__gleameSendPresets = async () => {
    try {
      const { seedBuiltLooksIfEmpty } = await import('./lib/looksService');
      const looks = await seedBuiltLooksIfEmpty();
      bridge.postMessage(
        JSON.stringify({ source: 'tryon-beauty-web', type: 'gleame:presets', presets: looks || [] })
      );
    } catch (err) {
      console.error('preset bridge failed', err);
    }
  };
}

export default function App() {
  // Path helper mapping
  const getTabFromPath = (path: string): 'home' | LabNavTarget => {
    const cleanPath = path.toLowerCase().replace(/\/$/, ''); // Remove trailing slash
    if (cleanPath.startsWith('/settings')) {
      return 'profile';
    }

    switch (cleanPath) {
      case '/home':
      case '':
      case '/':
        return 'home';
      case '/admin':
      case '/admin-portal':
      case '/dashboard':
      case '/admin/dashboard':
        return 'admin';
      case '/editor':
      case '/sandbox':
        return 'sandbox';
      case '/gallery':
        return 'gallery';
      case '/gallery-looks':
      case '/gallery/looks':
      case '/looks-feed':
        return 'gallery-looks';
      case '/gallery-challenges':
      case '/gallery/challenges':
      case '/challenges':
        return 'gallery-challenges';
      case '/gallery-inspiration':
      case '/gallery/inspiration':
        return 'gallery-inspiration';
      case '/gallery-wanted':
      case '/gallery/wanted':
      case '/gallery-requests':
      case '/gallery/requests':
        return 'gallery-wanted';
      case '/wanted':
      case '/wanted-list':
      case '/wanted-looks':
      case '/requests':
        return 'wanted-list';
      case '/wanted-scrollfeed':
      case '/gallery-wanted-feed':
      case '/wanted-feed':
      case '/requests-feed':
        return 'wanted-scrollfeed';
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
      case '/login':
      case '/signin':
      case '/auth':
      case '/profile':
        return 'profile';
      case '/looks':
        return 'looks';
      case '/tiktok-effects':
        return 'tiktok-effects';
      case '/inspiration-wall':
      case '/inspiration':
      case '/moodboard':
        return 'inspiration-wall';
      case '/inspirationlooks-scrollfeed':
      case '/inspiration-feed':
      case '/inspiration-scrollfeed':
      case '/inspirationlooks':
        return 'inspirationlooks-scrollfeed';
      case '/shade-edit':
      case '/shades':
      case '/shade':
      case '/products':
      case '/drop':
        return 'shade-edit';
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
      case 'gallery-looks':
        return '/gallery-looks';
      case 'gallery-challenges':
        return '/gallery-challenges';
      case 'gallery-inspiration':
        return '/gallery-inspiration';
      case 'gallery-wanted':
        return '/gallery-wanted';
      case 'wanted-scrollfeed':
        return '/wanted-scrollfeed';
      case 'hall-of-fame':
        return '/legends';
      case 'trending':
        return '/trending';
      case 'built-looks':
        return '/presets';
      case 'votes':
        return '/votes';
      case 'profile':
        if (window.location.pathname.startsWith('/settings')) {
          return window.location.pathname;
        }
        return firebaseUser ? '/profile' : '/login';
      case 'looks':
        return '/looks';
      case 'tiktok-effects':
        return '/tiktok-effects';
      case 'inspiration-wall':
        return '/inspiration-wall';
      case 'inspirationlooks-scrollfeed':
        return '/inspirationlooks-scrollfeed';
      case 'shade-edit':
        return '/shade-edit';
      case 'admin':
        return '/admin';
      default:
        return '/home';
    }
  };

  useEffect(() => { installPresetBridge(); }, []);

  // A Google redirect can land on any route, so completing it has to happen at
  // app level. Doing it inside the profile page meant the pending credential
  // was never consumed unless that page happened to be mounted, and the user
  // came back still signed out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { auth } = await import('./firebase');
        const {
          getRedirectResult,
          setPersistence,
          browserLocalPersistence,
          indexedDBLocalPersistence,
        } = await import('firebase/auth');
        // WKWebView can refuse IndexedDB; falling back to localStorage keeps
        // the session across the redirect instead of dropping to memory.
        await setPersistence(auth, indexedDBLocalPersistence).catch(() =>
          setPersistence(auth, browserLocalPersistence)
        );
        const result = await getRedirectResult(auth);
        if (!cancelled && result?.user) {
          console.info('Signed in via redirect:', result.user.uid);
        }
      } catch (err: any) {
        console.error('Google redirect sign-in failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'home' | LabNavTarget>(() => {
    return getTabFromPath(window.location.pathname);
  });
  const [activePreset, setActivePreset] = useState<PresetLook | null>(null);
  const [selectedInspirationLookId, setSelectedInspirationLookId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('look') || null;
  });
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const [selectedWantedRequestId, setSelectedWantedRequestId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('look') || params.get('req') || null;
  });
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeLabMenu, setActiveLabMenu] = useState<boolean>(false);
  const [isReelsActive, setIsReelsActive] = useState<boolean>(false);
  
  // Triggers updates across lists when a new challenge look is entered
  const [refreshSubmissionsTrigger, setRefreshSubmissionsTrigger] = useState<number>(0);

  // Community Username state
  const [username, setUsername] = useState<string>(() => localStorage.getItem('kobella_username') || '');
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(!localStorage.getItem('kobella_username'));
  
  // Firebase Auth user state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [headerAvatar, setHeaderAvatar] = useState<string>(() => getEffectiveAvatar());

  useEffect(() => {
    setHeaderAvatar(getEffectiveAvatar(firebaseUser));
  }, [firebaseUser]);

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setHeaderAvatar(getEffectiveAvatar(firebaseUser));
    };
    window.addEventListener('tryon_profile_updated', handleAvatarUpdate);
    return () => window.removeEventListener('tryon_profile_updated', handleAvatarUpdate);
  }, [firebaseUser]);

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
          providerIds: user.providerData.map((provider) => provider.providerId),
          lastSeenAt: Date.now()
        }, { merge: true }).catch((err) => {
          console.warn('Could not update the user profile document:', err);
        });
        // Load the stored photo whether or not the profile write succeeds, so a
        // blocked write never leaves the avatar on the placeholder.
        void loadUserProfileFromFirestore(user.uid);
        if (window.location.pathname === '/login' || window.location.pathname === '/signin') {
          window.history.replaceState(null, '', '/profile');
        }
      } else {
        // If logged out, revert to localStorage username if any
        const local = localStorage.getItem('kobella_username') || '';
        setUsername(local);
        setIsEditingUsername(!local);
        if (window.location.pathname === '/profile') {
          window.history.replaceState(null, '', '/login');
        }
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

  useEffect(() => {
    // Ensure all tab and portal transitions start immediately at the top without smooth scroll lag
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  const handleSaveUsername = () => {
    if (username.trim()) {
      localStorage.setItem('kobella_username', username.trim());
      setIsEditingUsername(false);
    }
  };

  const handleNavigate = (tab: 'home' | LabNavTarget, extraParam?: string | { mood?: string; lookId?: string; reqId?: string }) => {
    if (typeof extraParam === 'string') {
      setSelectedInspirationLookId(extraParam);
    } else if (extraParam && typeof extraParam === 'object') {
      if (extraParam.mood) {
        setSelectedMoodFilter(extraParam.mood);
      }
      if (extraParam.lookId) {
        setSelectedInspirationLookId(extraParam.lookId);
      }
      if (extraParam.reqId) {
        setSelectedWantedRequestId(extraParam.reqId);
      }
    }
    const newPath = getPathFromTab(tab);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    setActiveTab(tab);
    setActiveLabMenu(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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

  const getPageTitle = (tab: string): string => {
    switch (tab) {
      case 'gallery':
        return 'Community';
      case 'gallery-looks':
        return 'Community Looks';
      case 'gallery-challenges':
        return 'Community Challenges';
      case 'gallery-inspiration':
      case 'inspiration-wall':
      case 'inspirationlooks-scrollfeed':
        return 'Inspiration Wall';
      case 'gallery-wanted':
      case 'wanted-list':
      case 'wanted-scrollfeed':
        return 'Wanted looks';
      case 'looks':
      case 'built-looks':
        return 'Try On';
      case 'sandbox':
        return 'Create';
      case 'shade-edit':
        return 'Shade Edit';
      case 'votes':
        return 'Challenges & Votes';
      case 'trending':
        return 'Trending';
      case 'hall-of-fame':
        return 'Legends';
      case 'profile':
        return 'Profile';
      case 'tiktok-effects':
        return 'TikTok Effects';
      default:
        return 'Community';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2EF] text-[#000000] font-sans antialiased selection:bg-[#F7C6D7] selection:text-[#E91E63] pb-32">
      
      {/* SIDEBAR NAVIGATION DRAWER */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          />
          
          {/* Drawer Panel */}
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full shadow-2xl border-r border-[#EDE7E3] z-10 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#EDE7E3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#000000] to-[#E91E63] flex items-center justify-center shadow-sm">
                  <span className="font-bold text-xs text-white">T</span>
                </div>
                <div>
                  <span className="font-bold tracking-wider text-black text-xs uppercase">TryOn Beauty</span>
                  <p className="text-[8px] text-[#E91E63] font-bold uppercase tracking-widest">Design Lab</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F7F2EF] text-stone-500 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Section inside Sidebar */}
            <div className="p-4 bg-[#FFF6F7] border-b border-[#EDE7E3]">
              {firebaseUser ? (
                <div 
                  onClick={() => { handleNavigate('profile'); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-[#E91E63] overflow-hidden flex items-center justify-center bg-stone-900 text-white font-bold text-xs uppercase">
                    {username.charAt(0) || 'B'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-black truncate">@{username}</p>
                    <p className="text-[10px] text-stone-400 font-medium truncate">{firebaseUser.email}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-stone-600 font-medium leading-normal">
                    Sign in to sync your looks, enter challenges, and connect with the beauty community.
                  </p>
                  <button 
                    onClick={() => { handleNavigate('profile'); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 bg-black hover:bg-stone-800 text-white py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Profile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 mt-2">Menu</p>
              
              {[
                { 
                  id: 'home', 
                  label: activeTab === 'home' ? 'Welcome' : 'Home', 
                  desc: 'Featured looks & live challenges', 
                  icon: (props: any) => <FrenchDoorIcon isOpen={activeTab === 'home'} {...props} /> 
                },
                { id: 'gallery', label: 'Community', desc: 'Community looks & blueprints', icon: Users },
                { id: 'looks', label: 'Try On', desc: 'Preset looks & try-on catalog', icon: Sparkles },
                { id: 'shade-edit', label: 'Shade Edit', desc: 'Single lashes, lips, liner & eyeliner', icon: Flame },
                { id: 'sandbox', label: 'Create', desc: 'Mix & Match makeup studio', icon: (props: any) => <AppleWandSparklesIcon size={16} strokeColor={activeTab === 'sandbox' ? '#FFFFFF' : '#44403C'} {...props} /> },
                { id: 'profile', label: firebaseUser ? 'Profile' : 'Sign In', desc: firebaseUser ? 'Saved looks, creations & settings' : 'Sign in to access', icon: User },
                { id: 'inspiration-wall', label: 'Inspiration Wall', desc: 'Mood board of looks & textures', icon: Layers },
                { id: 'built-looks', label: 'Preset Looks Catalog', desc: 'Curated beauty recipes', icon: Columns2 },
                { id: 'votes', label: 'Challenges & Votes', desc: 'August: Clean Summer Look', icon: Trophy },
                { id: 'trending', label: 'Trending', desc: 'Viral community trends', icon: TrendingUp },
                { id: 'hall-of-fame', label: 'Legends', desc: 'Contest winners archive', icon: Award },
                { id: 'tiktok-effects', label: 'TikTok Effects', desc: 'Viral filter exports', icon: Video },
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
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-[#FFF6F7] text-[#E91E63] font-bold border border-[#F7C6D7]' 
                        : 'text-stone-700 hover:text-black hover:bg-[#F7F2EF] font-medium'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#E91E63] text-white' : 'bg-[#EDE7E3] text-stone-700'}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className={`text-[9px] truncate ${isActive ? 'text-[#E91E63]/80' : 'text-stone-400'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EDE7E3] text-center bg-[#F7F2EF]">
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">TRYON BEAUTY</span>
              <p className="text-[8px] text-stone-400 font-medium mt-0.5">Try makeup before you wear it.</p>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      {!isReelsActive && activeTab !== 'inspirationlooks-scrollfeed' && (
        activeTab === 'home' ? (
          /* HOMEPAGE TOP BANNER: Full TRYON BEAUTY branding, user profile icon, and notifications */
          <header className="sticky top-0 z-40 bg-[#F7F2EF]/90 backdrop-blur-md border-b border-[#EDE7E3]/80 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                
                {/* Left: User Avatar (Navigates directly to Settings page) */}
                <div 
                  onClick={() => {
                    window.history.pushState(null, '', '/settings');
                    setActiveTab('profile');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="flex items-center gap-2 cursor-pointer group"
                  title="Settings"
                >
                  <div className="w-8 h-8 rounded-full border border-black/10 overflow-hidden bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                    <img 
                      src={headerAvatar} 
                      alt="User Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Center: Brand Title & Tagline */}
                <div 
                  onClick={() => { handleNavigate('home'); setActivePreset(null); }}
                  className="cursor-pointer text-center flex flex-col items-center justify-center py-1"
                >
                  <h1 className="text-[13px] sm:text-sm font-bold tracking-[0.14em] uppercase text-black font-sans select-none leading-tight">
                    TRYON BEAUTY
                  </h1>
                </div>

                {/* Right: Notifications Bell & Menu */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleNavigate('votes')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-black hover:bg-[#EDE7E3] transition-colors relative cursor-pointer"
                    title="Notifications & Challenges"
                  >
                    <Bell className="w-4 h-4 stroke-[1.8]" />
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E91E63] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E91E63] ring-1.5 ring-[#F7F2EF]" />
                    </span>
                  </button>
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-black hover:bg-[#EDE7E3] transition-colors cursor-pointer sm:hidden"
                    title="Menu"
                  >
                    <Menu className="w-4 h-4 stroke-[1.8]" />
                  </button>
                </div>

              </div>
            </div>
          </header>
        ) : (
          /* ALL OTHER PAGES (COMMUNITY, TRY ON, CREATE, ETC.): Clean page title in small writing, no full banner */
          <header className="sticky top-0 z-40 bg-[#F7F2EF]/90 backdrop-blur-md border-b border-[#EDE7E3]/60 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-10 sm:h-11">
                
                {/* Left: Title of the page in small writing */}
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-[13px] font-bold tracking-wider uppercase text-stone-800 select-none">
                    {getPageTitle(activeTab)}
                  </h2>
                </div>

                {/* Right: Menu & Quick access */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleNavigate('votes')}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 hover:text-black hover:bg-[#EDE7E3]/80 transition-colors relative cursor-pointer"
                    title="Challenges & Votes"
                  >
                    <Bell className="w-3.5 h-3.5 stroke-[1.8]" />
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E91E63] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E91E63] ring-1.5 ring-[#F7F2EF]" />
                    </span>
                  </button>
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 hover:text-black hover:bg-[#EDE7E3]/80 transition-colors cursor-pointer"
                    title="Menu"
                  >
                    <Menu className="w-3.5 h-3.5 stroke-[1.8]" />
                  </button>
                </div>

              </div>
            </div>
          </header>
        )
      )}

      {/* CORE VIEWPORT STAGE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 sm:pt-6 overflow-x-hidden w-full">
        
        {/* Render Active View Tab */}
        {activeTab === 'home' && (
          <Homepage 
            onNavigate={handleNavigate} 
            onLoadPreset={handleSelectPresetForTryOn} 
            username={username}
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
            onToggleReelsFeed={setIsReelsActive}
            onNavigate={handleNavigate}
            initialSubTab="looks"
            initialMoodFilter={selectedMoodFilter}
            onClearMoodFilter={() => setSelectedMoodFilter(null)}
          />
        )}

        {activeTab === 'gallery-looks' && (
          <GalleryPage 
            onTryOnSubmission={handleSelectPresetForTryOn}
            refreshTrigger={refreshSubmissionsTrigger}
            onToggleReelsFeed={setIsReelsActive}
            onNavigate={handleNavigate}
            initialSubTab="looks"
            initialMoodFilter={selectedMoodFilter}
            onClearMoodFilter={() => setSelectedMoodFilter(null)}
          />
        )}

        {activeTab === 'gallery-challenges' && (
          <GalleryPage 
            onTryOnSubmission={handleSelectPresetForTryOn}
            refreshTrigger={refreshSubmissionsTrigger}
            onToggleReelsFeed={setIsReelsActive}
            onNavigate={handleNavigate}
            initialSubTab="challenges"
          />
        )}

        {activeTab === 'gallery-inspiration' && (
          <GalleryPage 
            onTryOnSubmission={handleSelectPresetForTryOn}
            refreshTrigger={refreshSubmissionsTrigger}
            onToggleReelsFeed={setIsReelsActive}
            onNavigate={handleNavigate}
            initialSubTab="inspiration"
          />
        )}

        {activeTab === 'gallery-wanted' && (
          <GalleryPage 
            onTryOnSubmission={handleSelectPresetForTryOn}
            refreshTrigger={refreshSubmissionsTrigger}
            onToggleReelsFeed={setIsReelsActive}
            onNavigate={handleNavigate}
            onSelectWantedFeed={(reqId) => {
              setSelectedWantedRequestId(reqId);
              handleNavigate('wanted-scrollfeed');
            }}
            initialSubTab="requests"
          />
        )}

        {activeTab === 'wanted-list' && (
          <WantedListPage 
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('gallery-wanted')}
            onLoadPreset={handleSelectPresetForTryOn}
          />
        )}

        {activeTab === 'hall-of-fame' && (
          <HallOfFamePage 
            onSelectWinningLookForTryOn={handleSelectPresetForTryOn}
          />
        )}

        {activeTab === 'trending' && (
          <TrendingPage 
            onNavigate={handleNavigate}
            onSelectProposalForFeed={(reqId) => {
              setSelectedWantedRequestId(reqId);
              handleNavigate('wanted-scrollfeed');
            }}
          />
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

        {activeTab === 'inspiration-wall' && (
          <InspirationWall 
            onNavigate={handleNavigate}
            onLoadPreset={handleSelectPresetForTryOn}
            onToggleReelsFeed={setIsReelsActive}
          />
        )}

        {activeTab === 'inspirationlooks-scrollfeed' && (
          <InspirationLooksScrollFeedPage 
            onNavigate={handleNavigate}
            onLoadPreset={handleSelectPresetForTryOn}
            initialLookId={selectedInspirationLookId}
          />
        )}

        {activeTab === 'wanted-scrollfeed' && (
          <WantedLooksScrollFeedPage 
            onNavigate={handleNavigate}
            onLoadPreset={handleSelectPresetForTryOn}
            initialRequestId={selectedWantedRequestId}
          />
        )}

        {activeTab === 'looks' && (
          <div className="text-center py-4 sm:py-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-2 gap-3.5 sm:gap-6 px-2 sm:px-4">
              
              {/* Card 1: Try Looks */}
              <div 
                onClick={() => {
                  if (openNativeFilterPage('looks')) return;
                  handleNavigate('built-looks');
                }}
                className="group relative overflow-hidden rounded-3xl border border-[#EDE7E3] bg-white hover:border-[#B8887A] p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer text-left flex flex-col justify-between min-h-[210px] sm:h-64"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF6F7] text-[#E91E63] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black tracking-tight">Try On Looks</h3>
                    <p className="text-xs text-stone-500 font-normal leading-relaxed mt-1">
                      Instantly overlay curated beauty formulas live using your device's camera.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-black font-bold text-xs uppercase tracking-wider pt-3 border-t border-[#EDE7E3] mt-3 group-hover:text-[#E91E63] transition-colors">
                  <span>Enter Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Build Mode */}
              <div 
                onClick={() => {
                  if (openNativeFilterPage('sandbox')) return;
                  handleNavigate('sandbox');
                }}
                className="group relative overflow-hidden rounded-3xl border border-[#EDE7E3] bg-white hover:border-[#B8887A] p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer text-left flex flex-col justify-between min-h-[210px] sm:h-64"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black tracking-tight">Mix & Match</h3>
                    <p className="text-xs text-stone-500 font-normal leading-relaxed mt-1">
                      Design custom formulas, fine-tune pigments, and publish to the community.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-black font-bold text-xs uppercase tracking-wider pt-3 border-t border-[#EDE7E3] mt-3 group-hover:text-[#E91E63] transition-colors">
                  <span>Creator Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'shade-edit' && (
          <ShadeEditPage 
            onNavigate={handleNavigate}
            onLoadPreset={handleSelectPresetForTryOn}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardPage 
            onNavigateHome={() => handleNavigate('home')}
            onTryOnLook={(lookName) => {
              handleNavigate('sandbox');
            }}
            currentUser={firebaseUser ? {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              username
            } : {
              username: localStorage.getItem('kobella_username') || 'christinalucas',
              email: 'christinalucas1216@gmail.com'
            }}
          />
        )}

      </main>

      {/* FOOTER (Displayed ONLY on Homepage) */}
      {activeTab === 'home' && !isReelsActive && (
        <footer className="bg-black text-white/80 py-12 mt-20 border-t border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-white">
              <span className="font-bold tracking-[0.2em] uppercase text-sm">TRYON BEAUTY</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
              The ultimate beauty playground where you can try, mix, and match makeup in real-time.
            </p>
            <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
              TRY MAKEUP BEFORE YOU WEAR IT.
            </div>
          </div>
        </footer>
      )}

      {/* Click Away Dismissal Overlay for Submenus */}
      {activeLabMenu && (
        <div 
          onClick={() => setActiveLabMenu(false)}
          className="fixed inset-0 z-40 bg-transparent"
        />
      )}

      {/* FLOATING GLASSMORPHIC 4-ICON NAVIGATION DOCK (PURE ICONS, NO TEXT LABELS) */}
      {!isReelsActive && activeTab !== 'inspirationlooks-scrollfeed' && activeTab !== 'wanted-list' && activeTab !== 'wanted-scrollfeed' && (
        <div id="floating-bottom-nav" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-[290px] sm:max-w-[310px] px-3 select-none">
          <div className="relative">
            
            {/* Lab Liquid Options List */}
            {activeLabMenu && (
              <div className="absolute bottom-16 right-4 flex flex-col items-end gap-1.5 w-44 sm:w-48 animate-in fade-in slide-in-from-bottom-4 duration-250 z-50">
                {[
                  { id: 'gallery', label: 'Community', icon: Users },
                  { id: 'inspiration-wall', label: 'Inspiration Wall', icon: Layers },
                  { id: 'shade-edit', label: 'Shade Edit', icon: Flame },
                  { id: 'votes', label: 'Challenges', icon: Trophy },
                  { id: 'trending', label: 'Trending', icon: TrendingUp },
                  { id: 'hall-of-fame', label: 'Legends', icon: Award },
                  { id: 'tiktok-effects', label: 'TikTok Effects', icon: Video }
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
                      className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-full text-[11px] font-bold shadow-xl border transition-all cursor-pointer transform hover:-translate-x-1.5 duration-200 ${
                        isActive
                          ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-[#E91E63]/30'
                          : 'bg-white/95 backdrop-blur-xl border-[#EDE7E3] text-stone-700 hover:text-black hover:bg-white shadow-md'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Glassmorphic Pill Dock Container (Translucent Refractive Glass Behind Icons) */}
            <div className="relative w-full h-[54px] rounded-full backdrop-blur-2xl bg-white/25 border border-white/60 shadow-[0_16px_36px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.85),inset_0_-1px_1px_rgba(0,0,0,0.05)] flex items-center justify-between p-1.5 ring-1 ring-black/5">
              
              {[
                {
                  id: 'home',
                  label: 'Home',
                  isActive: activeTab === 'home',
                  renderIcon: (active: boolean) => (
                    <FrenchDoorIcon 
                      isOpen={active} 
                      size={24}
                      strokeColor={active ? "#1C1917" : "#57534E"} 
                      className="w-6 h-6 transition-all duration-300"
                    />
                  )
                },
                {
                  id: 'gallery',
                  label: 'Community',
                  isActive: ['gallery', 'gallery-looks', 'gallery-challenges', 'gallery-inspiration', 'gallery-wanted'].includes(activeTab),
                  renderIcon: (active: boolean) => (
                    /* Exact 4-Bubble Molecule Cluster - crisp optical vector */
                    <svg 
                      viewBox="0 0 24 24" 
                      width={24}
                      height={24}
                      fill="none" 
                      stroke={active ? "#1C1917" : "#57534E"} 
                      strokeWidth={active ? "2.2" : "1.8"} 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-6 h-6 transition-colors"
                      shapeRendering="geometricPrecision"
                    >
                      <circle cx="8.6" cy="8.2" r="4.8" />
                      <circle cx="16.5" cy="7.8" r="3.7" />
                      <circle cx="14.8" cy="15.2" r="5.4" />
                      <circle cx="7.2" cy="15.5" r="3.7" />
                    </svg>
                  )
                },
                {
                  id: 'looks',
                  label: 'Try On',
                  isActive: ['looks', 'built-looks', 'shade-edit'].includes(activeTab),
                  renderIcon: (active: boolean) => (
                    /* Delicate 4-Point Concave Sparkle Star - crisp optical vector */
                    <svg 
                      viewBox="0 0 24 24" 
                      width={24}
                      height={24}
                      fill="none" 
                      stroke={active ? "#1C1917" : "#57534E"} 
                      strokeWidth={active ? "2.2" : "1.8"} 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-6 h-6 transition-colors"
                      shapeRendering="geometricPrecision"
                    >
                      <path d="M12 2.5C12 7.5 16.5 12 21.5 12C16.5 12 12 16.5 12 21.5C12 16.5 7.5 12 2.5 12C7.5 12 12 7.5 12 2.5Z" />
                    </svg>
                  )
                },
                {
                  id: 'sandbox',
                  label: 'Create',
                  isActive: activeTab === 'sandbox',
                  renderIcon: (active: boolean) => (
                    /* Apple SF Symbol: wand.and.sparkles */
                    <AppleWandSparklesIcon 
                      size={24}
                      strokeColor={active ? "#1C1917" : "#57534E"} 
                      className="w-6 h-6 transition-colors"
                    />
                  )
                }
              ].map((tab) => {
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      // Inside the iOS wrapper, Try On and Create are native
                      // filter pages rather than web routes. In a browser this
                      // is a no-op and the normal web route runs.
                      if (openNativeFilterPage(tab.id)) {
                        setActiveLabMenu(false);
                        return;
                      }
                      handleNavigate(tab.id as any);
                      setActiveLabMenu(false);
                    }}
                    className="relative flex-1 h-full rounded-full flex items-center justify-center cursor-pointer group select-none transition-transform active:scale-95"
                    title={tab.label}
                    aria-label={tab.label}
                  >
                    {/* Dynamic Smooth Sliding Glassmorphic Lens Disc Indicator (Behind the icon) */}
                    {tab.isActive && (
                      <motion.div
                        layoutId="glassNavActiveInlinePill"
                        transition={{
                          type: 'spring',
                          stiffness: 450,
                          damping: 32,
                          mass: 0.65
                        }}
                        className="pointer-events-none absolute inset-0 rounded-full bg-white/40 border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.06)] z-0"
                      />
                    )}

                    {/* Pure Crystal Clear Tab Icon (Top Layer - Never Blurred) */}
                    <div className="relative z-10 flex items-center justify-center pointer-events-none">
                      {tab.renderIcon(tab.isActive)}
                    </div>
                  </button>
                );
              })}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
