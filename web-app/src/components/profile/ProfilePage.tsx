import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  collection, 
  getDocs, 
  query, 
  handleFirestoreError, 
  OperationType 
} from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile, 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  User, 
  CircleUser,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogOut, 
  KeyRound, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Heart, 
  Grid, 
  TrendingUp, 
  RefreshCw,
  Bell,
  ShieldCheck,
  Trophy,
  ThumbsUp,
  Check,
  Award,
  Bookmark,
  Palette,
  Sliders,
  Plus,
  Trash2,
  Play,
  ArrowRight,
  ArrowLeft,
  Settings,
  ChevronRight,
  Monitor,
  CreditCard,
  Globe,
  AlertCircle,
  X,
  MapPin,
  Users,
  Smartphone,
  Key,
  MessageSquare,
  Calendar,
  ShoppingBag,
  Camera,
  Edit3, ChevronDown } from 'lucide-react';
import { ChallengeSubmission, PresetLook } from '../../types';
import { seedBuiltLooksIfEmpty, ExtendedBuiltLook } from '../../lib/looksService';
import { 
  AccountCategoryView, 
  NotificationCategoryView, 
  DisplayCategoryView, 
  PrivacyCategoryView, 
  PaymentCategoryView, 
  LanguageCategoryView, 
  HelpCategoryView,
  LogoutModal
} from './SettingsCategoryViews';
import { PhotoUploadModal } from './PhotoUploadModal';
import { getEffectiveAvatar, getEffectiveCover } from '../../lib/userProfileService';

interface ProfilePageProps {
  onLoadPreset?: (preset: any) => void;
  onNavigate?: (tab: any) => void;
}

type SettingsCategory = 
  | 'profile'
  | 'account'
  | 'saved'
  | 'notification'
  | 'display'
  | 'privacy'
  | 'payment'
  | 'language'
  | 'help';

const getCategoryFromPath = (path: string): SettingsCategory | null => {
  const clean = path.toLowerCase().replace(/\/$/, '');
  if (clean === '/profile') return 'profile';
  if (clean === '/settings-account' || clean === '/settings/account') return 'account';
  if (clean === '/settings-saved' || clean === '/settings/saved') return 'saved';
  if (clean === '/settings-notification' || clean === '/settings-notifications' || clean === '/settings/notification') return 'notification';
  if (clean === '/settings-display' || clean === '/settings/display') return 'display';
  if (clean === '/settings-privacy' || clean === '/settings/privacy') return 'privacy';
  if (clean === '/settings-payment' || clean === '/settings/payment') return 'payment';
  if (clean === '/settings-language' || clean === '/settings/language') return 'language';
  if (clean === '/settings-help' || clean === '/settings/help') return 'help';
  if (clean === '/settings') return null;
  return null;
};

const getPathFromCategory = (category: SettingsCategory | null): string => {
  switch (category) {
    case 'profile': return '/profile';
    case 'account': return '/settings-account';
    case 'saved': return '/settings-saved';
    case 'notification': return '/settings-notification';
    case 'display': return '/settings-display';
    case 'privacy': return '/settings-privacy';
    case 'payment': return '/settings-payment';
    case 'language': return '/settings-language';
    case 'help': return '/settings-help';
    case null: return '/settings';
  }
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLoadPreset, onNavigate }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // Navigation: synchronized with /profile, /settings, /settings-account, /settings-privacy, etc.
  const [activeCategory, setActiveCategory] = useState<SettingsCategory | null>(() => {
    return getCategoryFromPath(window.location.pathname);
  });

  useEffect(() => {
    const handlePopState = () => {
      const cat = getCategoryFromPath(window.location.pathname);
      setActiveCategory(cat);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Tab states for auth modal: 'signin', 'signup', 'forgot'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Form fields for auth
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [newDisplayName, setNewDisplayName] = useState<string>('');
  
  // Status Messages
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  // User submissions list
  const [userSubmissions, setUserSubmissions] = useState<ChallengeSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState<boolean>(false);

  // Saved / Favorited Looks & Created Looks
  const [savedLooks, setSavedLooks] = useState<ExtendedBuiltLook[]>([]);
  const [savedLooksLoading, setSavedLooksLoading] = useState<boolean>(false);
  const [savedBuckets, setSavedBuckets] = useState<Record<string, ExtendedBuiltLook[]>>({
    saved_mixnmatch: [],
    saved_tryon: [],
    saved_gallery: [],
  });
  const [openSavedGroups, setOpenSavedGroups] = useState<Record<string, boolean>>({
    mix: true,
    tryon: true,
    catalogue: true,
  });
  const [createdLooks, setCreatedLooks] = useState<any[]>([]);

  // Notification Preference states
  const [emailNotif, setEmailNotif] = useState<boolean>(() => localStorage.getItem('notif_email') !== 'false');
  const [deadlineNotif, setDeadlineNotif] = useState<boolean>(() => localStorage.getItem('notif_deadline') !== 'false');
  const [votesNotif, setVotesNotif] = useState<boolean>(() => localStorage.getItem('notif_votes') !== 'false');
  const [marketingNotif, setMarketingNotif] = useState<boolean>(() => localStorage.getItem('notif_marketing') === 'true');

  const handleToggleNotif = (key: string, value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  // Derived user values (with smart fallback so user can interact immediately)
  const currentDisplayName = user?.displayName || localStorage.getItem('kobella_username') || 'Christina Lucas';
  const currentEmail = user?.email || localStorage.getItem('kobella_user_email') || 'christinalucas1216@gmail.com';
  const currentUserId = user?.uid || 'usr_tryon_christina_2026';

  // Address state for beauty samples & studio shipments (Image 2 - My Address)
  const [userAddress, setUserAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('tryon_user_address');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      street: '124 Beauty Lane, Studio 4B',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90028',
      country: 'United States'
    };
  });
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [showDevicesModal, setShowDevicesModal] = useState<boolean>(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [showPasswordsModal, setShowPasswordsModal] = useState<boolean>(false);
  const [userBio, setUserBio] = useState<string>(() => localStorage.getItem('kobella_user_bio') || 'Work hard in silence. Let your success be the noise.');
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [tempBio, setTempBio] = useState<string>(userBio);
  const [mirrorFlip, setMirrorFlip] = useState<boolean>(true);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('Elena Vance (Master Colorist)');
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState<string>('Tomorrow at 2:00 PM');

  // Profile Avatar & Cover Banner States
  const [userAvatar, setUserAvatar] = useState<string>(() => getEffectiveAvatar(user));
  const [userCover, setUserCover] = useState<string>(() => getEffectiveCover());
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [photoModalInitialTab, setPhotoModalInitialTab] = useState<'avatar' | 'cover'>('avatar');

  useEffect(() => {
    setUserAvatar(getEffectiveAvatar(user));
    setUserCover(getEffectiveCover());
  }, [user]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUserAvatar(getEffectiveAvatar(user));
      setUserCover(getEffectiveCover());
    };
    window.addEventListener('tryon_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('tryon_profile_updated', handleProfileUpdate);
  }, [user]);

  const handleSaveAddress = (newAddr: typeof userAddress) => {
    setUserAddress(newAddr);
    localStorage.setItem('tryon_user_address', JSON.stringify(newAddr));
    setShowAddressModal(false);
    setSuccessMsg('Studio delivery address updated.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveBio = (bioText: string) => {
    setUserBio(bioText);
    localStorage.setItem('kobella_user_bio', bioText);
    setIsEditingBio(false);
    setSuccessMsg('Profile bio updated.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Load created looks from localStorage
  const loadCreatedLooks = () => {
    try {
      const stored = localStorage.getItem('tryon_saved_looks');
      if (stored) {
        setCreatedLooks(JSON.parse(stored));
      } else {
        setCreatedLooks([]);
      }
    } catch (e) {
      console.error('Error loading created looks:', e);
      setCreatedLooks([]);
    }
  };

  // Load Saved/Favorited Looks
  const loadSavedLooks = async () => {
    setSavedLooksLoading(true);
    try {
      // Looks saved from the app live under the signed-in user, so read those
      // first. Without this the section only ever showed local favourites and
      // anything saved on the phone was invisible here.
      const uid = auth.currentUser?.uid;
      // One collection, grouped by the savedFrom field. Separate collections
      // per category needed rules that keep getting overwritten by other
      // deploys; saved_looks is the name the deployed rules allow.
      const buckets: Record<string, ExtendedBuiltLook[]> = {
        saved_mixnmatch: [],
        saved_tryon: [],
        saved_gallery: [],
      };
      if (uid) {
        try {
          const snap = await getDocs(collection(db, 'users', uid, 'saved_looks'));
          snap.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, any>;
            // Older documents predate savedFrom, so fall back on shape:
            // more than one shade means it was mixed.
            const shadeCount = Array.isArray(data.shades) ? data.shades.length : 0;
            const key =
              data.savedFrom === 'gallery'
                ? 'saved_gallery'
                : data.savedFrom === 'mixnmatch' || (!data.savedFrom && shadeCount > 1)
                  ? 'saved_mixnmatch'
                  : 'saved_tryon';
            buckets[key].push({
              ...(data as ExtendedBuiltLook),
              id: docSnap.id,
              name: data.name || 'Saved look',
              description: data.description || '',
            });
          });
        } catch (err: any) {
          console.error('Could not read saved_looks from your account:', err);
          setErrorMsg(
            `Could not load saved looks: ${err?.code || err?.message || err}`
          );
        }
      }
      setSavedBuckets(buckets);

      const allPresets = await seedBuiltLooksIfEmpty();
      let favIds: string[] = [];
      const storedFavs = localStorage.getItem('tryon_favourites');
      if (storedFavs) {
        favIds = JSON.parse(storedFavs);
      }
      
      // Only what the user actually favourited. It used to seed three random
      // presets when the list was empty, which showed looks nobody saved.
      setSavedLooks(allPresets.filter(p => favIds.includes(p.id)));
    } catch (err) {
      console.error('Error loading saved looks in profile:', err);
    } finally {
      setSavedLooksLoading(false);
    }
  };

  /** Saved looks, one group per collection they were written to. */
  const savedLookGroups = React.useMemo(
    () =>
      [
        {
          key: 'mix',
          title: 'Mix & Match',
          subtitle: 'Looks you built from multiple shades',
          looks: savedBuckets.saved_mixnmatch || [],
        },
        {
          key: 'tryon',
          title: 'Try On shades',
          subtitle: 'Shades saved while trying on',
          looks: savedBuckets.saved_tryon || [],
        },
        {
          key: 'gallery',
          title: 'From the community',
          subtitle: 'Looks you saved from the gallery',
          looks: savedBuckets.saved_gallery || [],
        },
        {
          key: 'catalogue',
          title: 'Catalogue looks',
          subtitle: 'Presets you favourited',
          looks: savedLooks,
        },
      ].filter((group) => group.looks.length > 0),
    [savedBuckets, savedLooks]
  );

  const totalSavedLooks = savedLookGroups.reduce(
    (sum, g) => sum + g.looks.length,
    0
  );

  const handleRemoveSavedLook = (lookId: string) => {
    try {
      const storedFavs = localStorage.getItem('tryon_favourites');
      let favIds: string[] = storedFavs ? JSON.parse(storedFavs) : [];
      favIds = favIds.filter(id => id !== lookId);
      localStorage.setItem('tryon_favourites', JSON.stringify(favIds));
      setSavedLooks(prev => prev.filter(l => l.id !== lookId));
      setSuccessMsg('Look removed from saved favorites.');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (e) {
      console.error('Error removing look from favorites:', e);
    }
  };

  // Re-read on entering Saved, so a look saved from the app shows without
  // needing a sign-out or reload.
  useEffect(() => {
    if (activeCategory === 'saved') {
      loadSavedLooks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchUserSubmissions(currentUser.uid);
      } else {
        fetchUserSubmissions('demo_user_uid');
      }
      loadSavedLooks();
      loadCreatedLooks();
    });

    return () => unsubscribe();
  }, []);

  // Fetch submissions from Firestore
  const fetchUserSubmissions = async (userId: string) => {
    setSubmissionsLoading(true);
    try {
      const q = query(collection(db, 'submissions'));
      const querySnapshot = await getDocs(q);
      const allSubmissions: ChallengeSubmission[] = [];
      querySnapshot.forEach((doc) => {
        allSubmissions.push({ id: doc.id, ...doc.data() } as ChallengeSubmission);
      });
      
      const userOnly = allSubmissions.filter(sub => 
        sub.username?.toLowerCase() === (user?.displayName || currentDisplayName).toLowerCase() ||
        sub.username?.toLowerCase().includes('christina')
      );
      setUserSubmissions(userOnly);
    } catch (err) {
      console.warn('Could not fetch user submissions:', err);
      setUserSubmissions([
        {
          id: 'sub_demo_1',
          username: currentDisplayName,
          lookName: 'Velvet Sunset Siren',
          description: 'Luminous sunset hues with glossy sheen',
          makeupConfig: {
            eyeshadowColor: '#d97706',
            eyeshadowOpacity: 0.8,
            blushColor: '#f43f5e',
            blushOpacity: 0.6,
            lipColor: '#be123c',
            lipOpacity: 0.85,
            lipGloss: true,
            lashesStyle: 'classic',
            glitterLevel: 2,
            selectedFilter: 'Golden Hour'
          },
          createdAt: Date.now(),
          votes: 14
        }
      ]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Sign In with Email & Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoadingAction(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMsg('Welcome back to TryON Beauty Studio!');
      setShowAuthModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your email and password.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoadingAction(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (usernameInput) {
        await updateProfile(userCredential.user, {
          displayName: usernameInput
        });
        localStorage.setItem('kobella_username', usernameInput);
      }
      setSuccessMsg('Account created successfully! Welcome to TryON Beauty.');
      setShowAuthModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Google Sign In
  // Completes a native Google sign-in: the app hands over Google's ID token
  // and Firebase turns it into a real session in this page.
  useEffect(() => {
    (window as any).__gleameGoogleCredential = async (idToken: string) => {
      try {
        setLoadingAction(true);
        const credential = GoogleAuthProvider.credential(idToken);
        const { signInWithCredential } = await import('firebase/auth');
        await signInWithCredential(auth, credential);
        setSuccessMsg('Successfully signed in with Google!');
        setShowAuthModal(false);
      } catch (err: any) {
        console.error('Native Google credential sign-in failed:', err);
        setErrorMsg(err?.message || 'Google sign-in failed.');
      } finally {
        setLoadingAction(false);
      }
    };
    return () => {
      delete (window as any).__gleameGoogleCredential;
    };
  }, []);

  /** True when running inside the iOS wrapper's WebView. */
  const isInAppWebView = () =>
    typeof window !== 'undefined' &&
    Boolean((window as any).GleameBridge || (window as any).TryOnBeautyBridge);

  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoadingAction(true);
    try {
      const provider = new GoogleAuthProvider();
      if (isInAppWebView()) {
        // Google refuses OAuth in a WebView, and the redirect flow loses its
        // pending marker when WKWebView drops sessionStorage. The app runs the
        // flow natively in Safari and calls __gleameGoogleCredential with the
        // resulting ID token.
        (window as any).GleameBridge?.postMessage(
          JSON.stringify({
            source: 'tryon-beauty-web',
            type: 'gleame:native-google-signin'
          })
        );
        return;
      }
      await signInWithPopup(auth, provider);
      setSuccessMsg('Successfully signed in with Google!');
      setShowAuthModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoadingAction(false);
    }
  };


  // Password Reset
  const handlePasswordReset = async () => {
    clearMessages();
    setLoadingAction(true);
    try {
      await sendPasswordResetEmail(auth, currentEmail);
      setSuccessMsg(`Password reset instructions sent to ${currentEmail}. Check your inbox.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setLoadingAction(false);
    }
  };

  // Update Profile Display Name
  const handleUpdateName = async (name: string): Promise<boolean> => {
    clearMessages();
    try {
      if (user) {
        await updateProfile(user, { displayName: name });
      }
      localStorage.setItem('kobella_username', name);
      setSuccessMsg('Profile name updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      return true;
    } catch (err: any) {
      setErrorMsg('Failed to update name: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
      return false;
    }
  };

  // Sign Out
  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await signOut(auth);
      // Clear anything tied to the old session, then show the sign-in screen.
      // Previously it only set a message and stayed on the profile, which read
      // as still being signed in.
      setUserSubmissions([]);
      setSavedLooks([]);
      setSavedBuckets({ saved_mixnmatch: [], saved_tryon: [], saved_gallery: [] });
      setActiveCategory(null);
      setEmail('');
      setPassword('');
      clearMessages();
      setShowAuthModal(true);
      if (window.location.pathname !== '/login') {
        window.history.pushState(null, '', '/login');
      }
    } catch (err) {
      console.error('Sign out error: ', err);
      setErrorMsg('Could not sign out. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-8 h-8 animate-spin text-stone-700" />
        <span className="text-xs font-bold text-stone-700">Loading settings...</span>
      </div>
    );
  }

  // Signed out means signed out. The page used to fall back to a placeholder
  // account, which looked like a real session and hid the fact that nothing
  // could be saved.
  if (!user) {
    return (
      <div className="py-16 px-5 max-w-sm mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#f2eee9] border border-white/80 shadow-[2px_2px_6px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.95)] flex items-center justify-center mx-auto text-stone-500">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-stone-900">You're signed out</h3>
          <p className="text-xs text-stone-500">
            Sign in to save looks to your account and see them on any device.
          </p>
        </div>
        {errorMsg && (
          <p className="text-xs font-bold text-rose-600">{errorMsg}</p>
        )}
        <button
          onClick={handleGoogleSignIn}
          disabled={loadingAction}
          className="w-full py-3 rounded-full bg-stone-900 text-white text-xs font-bold shadow-[2px_2px_6px_rgba(0,0,0,0.12)] cursor-pointer disabled:opacity-60"
        >
          Continue with Google
        </button>

        <form
          onSubmit={authMode === 'signup' ? handleSignUp : handleSignIn}
          className="space-y-2.5 text-left"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full px-4 py-3 rounded-2xl bg-white border border-white/80 text-xs font-medium text-stone-900 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-white/80 text-xs font-medium text-stone-900 outline-none"
          />
          <button
            type="submit"
            disabled={loadingAction}
            className="w-full py-3 rounded-full bg-[#ede9e4] text-stone-900 text-xs font-bold border border-white/80 cursor-pointer disabled:opacity-60"
          >
            {authMode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
          className="w-full py-2 text-stone-700 text-xs font-bold cursor-pointer"
        >
          {authMode === 'signup'
            ? 'Already have an account? Sign in'
            : 'New here? Create an account'}
        </button>
      </div>
    );
  }

  /* List of Categories in exact order requested by user & screenshot */
  const categories: { id: SettingsCategory | 'logout'; label: string; icon: React.FC<any> }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: CircleUser },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'notification', label: 'Notification', icon: Bell },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'help', label: 'Help', icon: AlertCircle },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  const handleCategoryClick = (id: SettingsCategory | 'logout') => {
    if (id === 'logout') {
      setShowLogoutModal(true);
    } else {
      setActiveCategory(id);
      const newPath = getPathFromCategory(id);
      window.history.pushState(null, '', newPath);
    }
  };

  const handleBack = () => {
    if (activeCategory === null) {
      if (onNavigate) {
        onNavigate('home');
      } else {
        window.history.pushState(null, '', '/home');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else {
      setActiveCategory(null);
      window.history.pushState(null, '', '/settings');
    }
  };

  const getCategoryTitle = (cat: SettingsCategory): string => {
    switch (cat) {
      case 'profile': return 'Profile';
      case 'account': return 'Account';
      case 'saved': return 'Saved';
      case 'notification': return 'Notification';
      case 'display': return 'Display';
      case 'privacy': return 'Privacy';
      case 'payment': return 'Payment';
      case 'language': return 'Language';
      case 'help': return 'Help';
      default: return 'Settings';
    }
  };

  return (
    <div id="settings-profile-container" className="max-w-xl mx-auto pt-0 pb-16 animate-in fade-in duration-200 text-stone-900 font-sans">
      
      {/* SUCCESS / ERROR ALERTS */}
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-left animate-in slide-in-from-top-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 font-semibold">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-left animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 font-semibold">{successMsg}</p>
        </div>
      )}

      {/* =========================================================================
          UNIFIED SETTINGS TITLE & TOP-LEFT BACK ARROW (Side-by-side, no Home text)
          ========================================================================= */}
      <div className="pt-0 pb-3 mb-4 flex items-center gap-3">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-800 hover:text-black transition-all cursor-pointer bg-[#f2eee9] shadow-[3px_3px_8px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.95)] hover:scale-105 active:scale-95 border border-white/80 shrink-0"
          aria-label={activeCategory === null ? 'Back to Home' : 'Back to Settings'}
          title={activeCategory === null ? 'Back to Home' : 'Back to Settings'}
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
          {activeCategory === null ? 'Settings' : getCategoryTitle(activeCategory)}
        </h1>
      </div>

      {/* =========================================================================
          VIEW A: ROOT SETTINGS LIST (Tactile Neumorphic Aesthetic UI Design)
          ========================================================================= */}
      {activeCategory === null ? (
        <div className="space-y-4">
          
          {/* Tactile Profile Greeting Header Card (matching aesthetic example) */}
          <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-3xl bg-[#f5f2ee] shadow-[5px_5px_15px_rgba(0,0,0,0.05),-5px_-5px_15px_rgba(255,255,255,0.9)] border border-white/80">
            <div className="w-12 h-12 rounded-full p-0.5 bg-[#ede9e4] shadow-[3px_3px_8px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.95)] border border-white/80 shrink-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" 
                alt={currentDisplayName}
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="grow min-w-0 text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight truncate">
                  Hi, {currentDisplayName}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shrink-0" />
              </div>
              <p className="text-[11px] text-stone-500 font-medium truncate">
                Studio Resident · {savedLooks.length} saved formulas
              </p>
            </div>
            <button
              onClick={() => handleCategoryClick('profile')}
              className="px-3.5 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-800 text-[11px] font-bold shadow-[2px_2px_6px_rgba(0,0,0,0.05),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            >
              View
            </button>
          </div>

          {/* Tactile Category Pill Cards */}
          <div className="space-y-2.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isLogout = cat.id === 'logout';
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl transition-all duration-200 cursor-pointer text-left group hover:scale-[1.01] active:scale-[0.99] ${
                    isLogout 
                      ? 'bg-[#fdf3f3] hover:bg-[#fdeaea] shadow-[4px_4px_12px_rgba(225,29,72,0.06),-4px_-4px_12px_rgba(255,255,255,0.9)] border border-rose-100' 
                      : 'bg-[#f5f2ee] hover:bg-[#f9f6f3] shadow-[4px_4px_12px_rgba(0,0,0,0.04),-4px_-4px_12px_rgba(255,255,255,0.9)] border border-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isLogout 
                        ? 'bg-rose-100/70 text-rose-600 shadow-[2px_2px_5px_rgba(225,29,72,0.08),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-rose-200' 
                        : 'bg-[#ede9e4] text-stone-700 group-hover:text-black group-hover:scale-105 shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80'
                    }`}>
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm sm:text-base font-bold tracking-tight ${
                        isLogout ? 'text-rose-600' : 'text-stone-900 group-hover:text-black'
                      }`}>
                        {cat.label}
                      </span>
                      {cat.id === 'saved' && savedLooks.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff2f68]/10 text-[#ff2f68]">
                          {savedLooks.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isLogout ? 'bg-rose-100/50 text-rose-500' : 'bg-[#ede9e4]/70 text-stone-400 group-hover:text-stone-700'
                  }`}>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      ) : (
        /* =========================================================================
            VIEW B: DETAILED CATEGORY SUB-VIEW
            ========================================================================= */
        <div className="space-y-5">

          {/* 1. PROFILE CATEGORY VIEW (Laid out like Image 2, adapted for TryON Beauty) */}
          {activeCategory === 'profile' && (
            <div className="space-y-4 text-left animate-in fade-in duration-200">
              
              {/* HERO BANNER: Aesthetic vanity / studio background matching Image 2 */}
              <div className="relative rounded-3xl overflow-hidden shadow-md border border-stone-200/80 min-h-[250px] flex flex-col justify-between p-5 bg-stone-900">
                <img 
                  src={userCover} 
                  alt="TryON Beauty Studio" 
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/75" />

                {/* Top Action Icons: Change Cover on Left, Heart & Shopping on Right */}
                <div className="relative z-10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setPhotoModalInitialTab('cover');
                      setShowPhotoModal(true);
                    }}
                    className="px-2.5 py-1 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Change Studio Cover Banner"
                  >
                    <Camera className="w-3 h-3 text-white/80" />
                    <span>Change Cover</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setActiveCategory('saved')}
                      className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer shadow-xs"
                      title="Saved Formulas & Wishlist"
                    >
                      <Heart className="w-4 h-4 fill-white/20 stroke-[2.2]" />
                    </button>

                    <button
                      onClick={() => {
                        if (onNavigate) onNavigate('sandbox');
                      }}
                      className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer shadow-xs relative"
                      title="Active Formula Kit"
                    >
                      <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E91E63] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E91E63] ring-1.5 ring-white" />
                      </span>
                    </button>
                  </div>
                </div>

                {/* Center Content: Circular Avatar, Name, Bio matching Image 2 */}
                <div className="relative z-10 text-center flex flex-col items-center justify-center mt-2 mb-2">
                  <div className="relative mb-3 group">
                    <div 
                      onClick={() => {
                        setPhotoModalInitialTab('avatar');
                        setShowPhotoModal(true);
                      }}
                      className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-3 border-white overflow-hidden shadow-lg bg-stone-800 cursor-pointer"
                      title="Click to update profile photo"
                    >
                      <img 
                        src={userAvatar} 
                        alt="Profile Avatar" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setPhotoModalInitialTab('avatar');
                        setShowPhotoModal(true);
                      }}
                      className="absolute bottom-0 right-0 bg-stone-900 hover:bg-black text-white p-1.5 rounded-full border-2 border-white shadow-xs cursor-pointer transition-transform hover:scale-105"
                      title="Update Profile Photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Name */}
                  <div className="flex items-center justify-center gap-1.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                      {currentDisplayName}
                    </h2>
                    <button
                      onClick={() => {
                        setNewDisplayName(currentDisplayName);
                        setIsEditingProfile(true);
                      }}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer p-1"
                      title="Edit Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bio / Tagline */}
                  {isEditingBio ? (
                    <div className="mt-2 flex items-center gap-1.5 max-w-sm w-full px-2">
                      <input 
                        type="text"
                        value={tempBio}
                        onChange={(e) => setTempBio(e.target.value)}
                        className="flex-1 bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl border border-white/40 focus:outline-none"
                        placeholder="Enter your beauty bio..."
                      />
                      <button 
                        onClick={() => handleSaveBio(tempBio)}
                        className="bg-white text-stone-900 text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setIsEditingBio(false)}
                        className="bg-white/20 text-white text-[10px] font-bold px-2 py-1.5 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p 
                      onClick={() => {
                        setTempBio(userBio);
                        setIsEditingBio(true);
                      }}
                      className="text-xs sm:text-sm text-white/90 font-medium max-w-xs sm:max-w-sm mt-1 leading-relaxed drop-shadow-xs cursor-pointer hover:text-white transition-colors"
                      title="Click to edit bio"
                    >
                      {userBio}
                    </p>
                  )}
                </div>

                {/* Studio Badges on banner */}
                <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <span className="bg-black/30 backdrop-blur-sm border border-white/20 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full">
                    Studio Resident
                  </span>
                  <span className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-400/40 text-[10px] font-bold text-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                    Verified Creator
                  </span>
                  <span className="bg-amber-950/40 backdrop-blur-sm border border-amber-400/40 text-[10px] font-bold text-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Trophy className="w-2.5 h-2.5 text-amber-300" />
                    Challenge Winner
                  </span>
                </div>
              </div>

              {/* FLOATING CARD GROUP 1: My Address & Account (matching Image 2 & Tactile Aesthetic) */}
              <div className="bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[5px_5px_15px_rgba(0,0,0,0.05),-5px_-5px_15px_rgba(255,255,255,0.9)] overflow-hidden divide-y divide-stone-200/60">
                {/* 1.1 My Address */}
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#f8f5f1] transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700 group-hover:text-black group-hover:scale-105 transition-all shrink-0">
                      <MapPin className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                        My Address
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                        {userAddress.street}, {userAddress.city}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 1.2 Account */}
                <button
                  onClick={() => handleCategoryClick('account')}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#f8f5f1] transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700 group-hover:text-black group-hover:scale-105 transition-all shrink-0">
                      <Users className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                        Account
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {currentEmail} · Verified Creator
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* FLOATING CARD GROUP 2: Notifications, Devices, Passwords, Language */}
              <div className="bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[5px_5px_15px_rgba(0,0,0,0.05),-5px_-5px_15px_rgba(255,255,255,0.9)] overflow-hidden divide-y divide-stone-200/60">
                {/* 2.1 Notifications */}
                <button
                  onClick={() => handleCategoryClick('notification')}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#f8f5f1] transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700 group-hover:text-black group-hover:scale-105 transition-all shrink-0">
                      <Bell className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                        Notifications
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        Alerts, community votes & challenge reminders
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 2.2 Devices */}
                <button
                  onClick={() => setShowDevicesModal(true)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#f8f5f1] transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700 group-hover:text-black group-hover:scale-105 transition-all shrink-0">
                      <Smartphone className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                        Devices
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        Connected 4K Virtual Mirror · Front Camera
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 2.3 Passwords */}
                <button
                  onClick={() => setShowPasswordsModal(true)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#f8f5f1] transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700 group-hover:text-black group-hover:scale-105 transition-all shrink-0">
                      <Key className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                        Passwords
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        Password reset & two-factor security
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 2.4 Language */}
                <button
                  onClick={() => handleCategoryClick('language')}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#f8f5f1] transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700 group-hover:text-black group-hover:scale-105 transition-all shrink-0">
                      <MessageSquare className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                        Language
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        English (US)
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* FLOATING CARD GROUP 3: TryON Studio Features (Saved Formulas, Appointments) */}
              <div className="bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[5px_5px_15px_rgba(0,0,0,0.05),-5px_-5px_15px_rgba(255,255,255,0.9)] overflow-hidden divide-y divide-stone-200/60">
                {/* 3.1 Saved Looks */}
                <button
                  onClick={() => handleCategoryClick('saved')}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#f8f5f1] transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-rose-100/70 shadow-[2px_2px_5px_rgba(225,29,72,0.08),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-rose-200/80 flex items-center justify-center text-[#ff2f68] shrink-0">
                      <Bookmark className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                        Saved Formulas & Looks
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {savedLooks.length} formulas saved for quick try-on
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 3.2 Appointments */}
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#f8f5f1] transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-amber-100/70 shadow-[2px_2px_5px_rgba(217,119,6,0.08),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                      <Calendar className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                        Beauty Appointments
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        1-on-1 Virtual Shade Match & Studio Consultation
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* PORTFOLIO & COMMUNITY SUBMISSIONS */}
              <div className="bg-[#f5f2ee] rounded-3xl border border-white/80 p-5 shadow-[5px_5px_15px_rgba(0,0,0,0.05),-5px_-5px_15px_rgba(255,255,255,0.9)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#ff2f68]" />
                      <span>Community Submissions</span>
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      {userSubmissions.length} active submissions · 14 total community upvotes
                    </p>
                  </div>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('sandbox')}
                      className="px-3 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-800 text-[11px] font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      + New Formula
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  {userSubmissions.map((sub) => (
                    <div 
                      key={sub.id}
                      className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-stone-900">{sub.lookName}</div>
                        <div className="text-[10px] text-stone-500 font-medium">
                          Created by @{sub.username || currentDisplayName} · {sub.votes || 14} Community Upvotes
                        </div>
                      </div>
                      {onLoadPreset && (
                        <button
                          onClick={() => {
                            onLoadPreset(sub);
                            if (onNavigate) onNavigate('sandbox');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Try Formula
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* EXECUTIVE ADMIN PORTAL ACCESS BANNER */}
              {(currentEmail === 'christinalucas1216@gmail.com' || currentDisplayName.toLowerCase().includes('christina') || localStorage.getItem('kobella_is_admin') === 'true') && (
                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1e1714] via-[#2d221c] to-[#15100e] border border-[#59493f] shadow-sm text-left text-white space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#732729] to-[#bc8381] flex items-center justify-center text-white shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#ffb4c7]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#faeee4]">Executive Admin Portal</h4>
                      <p className="text-[10px] text-[#bdaaa0]">Live telemetry, dwell time & shade conversion analytics.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate('admin');
                      else {
                        window.history.pushState(null, '', '/admin');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#bc8381] via-[#8c3a4f] to-[#732729] hover:brightness-110 text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Enter Admin Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>
          )}

          {/* 2. ACCOUNT CATEGORY VIEW */}
          {activeCategory === 'account' && (
            <AccountCategoryView
              userEmail={currentEmail}
              userName={currentDisplayName}
              userId={currentUserId}
              isFirebaseUser={!!user}
              onUpdateName={handleUpdateName}
              onSendPasswordReset={handlePasswordReset}
              onOpenAuthModal={() => setShowAuthModal(true)}
            />
          )}

          {/* 3. SAVED CATEGORY VIEW */}
          {activeCategory === 'saved' && (
            <div className="space-y-5 text-left animate-in fade-in duration-200">
              <div className="bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] p-5 sm:p-6 space-y-4">
                <div className="border-b border-stone-200/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-100/80 shadow-[2px_2px_5px_rgba(225,29,72,0.08),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-rose-200/80 flex items-center justify-center text-[#ff2f68]">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <span>Saved & Bookmarked Looks</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 font-medium">
                      Your saved formulas and favorite presets from the Inspiration Wall.
                    </p>
                  </div>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('looks')}
                      className="px-3 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-800 text-xs font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95 transition-all"
                    >
                      <span>Browse Catalog</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {savedLooksLoading ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-stone-700" />
                    <span className="text-xs font-bold text-stone-600">Loading saved looks...</span>
                  </div>
                ) : totalSavedLooks === 0 ? (
                  <div className="bg-[#ede9e4]/70 border border-white/70 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.04),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] rounded-2xl p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#f2eee9] shadow-[2px_2px_6px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center mx-auto text-stone-500">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-stone-900">No Saved Looks Yet</h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Bookmark your favorite cosmetic styles from the Inspiration Wall or Weekly Edit to try them on anytime.
                    </p>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('looks')}
                        className="px-4 py-2 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-900 text-xs font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        Explore Looks
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {savedLookGroups.map((group) => (
                      <div key={group.key} className="space-y-2.5">
                        <button
                          onClick={() =>
                            setOpenSavedGroups((prev) => ({
                              ...prev,
                              [group.key]: !prev[group.key],
                            }))
                          }
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#ede9e4]/80 border border-white/70 shadow-[2px_2px_5px_rgba(0,0,0,0.04),-2px_-2px_5px_rgba(255,255,255,0.85)] cursor-pointer"
                        >
                          <span className="flex flex-col items-start">
                            <span className="text-xs font-bold text-stone-900">
                              {group.title}
                              <span className="ml-2 text-[10px] font-bold text-stone-400">
                                {group.looks.length}
                              </span>
                            </span>
                            <span className="text-[10px] text-stone-500">{group.subtitle}</span>
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-stone-500 transition-transform ${
                              openSavedGroups[group.key] === false ? '' : 'rotate-180'
                            }`}
                          />
                        </button>

                        {openSavedGroups[group.key] !== false && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    {group.looks.map((look) => (
                      <div
                        key={look.id}
                        className="bg-[#ede9e4]/80 rounded-2xl border border-white/70 shadow-[3px_3px_8px_rgba(0,0,0,0.04),-3px_-3px_8px_rgba(255,255,255,0.85)] p-3.5 flex flex-col justify-between space-y-3 group hover:scale-[1.01] transition-all"
                      >
                        <div className="space-y-2">
                          {look.coverImage && (
                            <div className="w-full h-32 rounded-xl overflow-hidden relative bg-stone-200 shadow-inner">
                              <img
                                src={look.coverImage}
                                alt={look.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-[#ff2f68]" />
                                <span>{look.filter || 'Look'}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2 pt-1">
                            <div>
                              <h4 className="font-bold text-xs text-stone-900 leading-tight">{look.name}</h4>
                              <p className="text-[10px] text-stone-500 font-medium line-clamp-2 mt-0.5">
                                {look.description}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveSavedLook(look.id)}
                              className="w-7 h-7 rounded-full bg-[#f2eee9] shadow-[1px_1px_3px_rgba(0,0,0,0.05),-1px_-1px_3px_rgba(255,255,255,0.9)] border border-white/70 flex items-center justify-center text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                              title="Remove from saved"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Palette Color Swatches */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Palette:</span>
                            <div className="flex items-center -space-x-1">
                              <span className="w-4 h-4 rounded-full border-2 border-white shadow-xs" style={{ backgroundColor: look.eyeshadowColor }} title="Eyeshadow" />
                              <span className="w-4 h-4 rounded-full border-2 border-white shadow-xs" style={{ backgroundColor: look.blushColor }} title="Blush" />
                              <span className="w-4 h-4 rounded-full border-2 border-white shadow-xs" style={{ backgroundColor: look.lipColor }} title="Lipstick" />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-300/50 flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (onLoadPreset) {
                                onLoadPreset(look);
                              }
                              if (onNavigate) {
                                onNavigate('sandbox');
                              }
                            }}
                            className="w-full py-2 rounded-full bg-[#f2eee9] hover:bg-white text-stone-900 text-xs font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Try Look</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. NOTIFICATION CATEGORY VIEW */}
          {activeCategory === 'notification' && (
            <NotificationCategoryView
              emailNotif={emailNotif}
              deadlineNotif={deadlineNotif}
              votesNotif={votesNotif}
              marketingNotif={marketingNotif}
              onToggle={handleToggleNotif}
              setEmailNotif={setEmailNotif}
              setDeadlineNotif={setDeadlineNotif}
              setVotesNotif={setVotesNotif}
              setMarketingNotif={setMarketingNotif}
            />
          )}

          {/* 5. DISPLAY CATEGORY VIEW */}
          {activeCategory === 'display' && (
            <DisplayCategoryView />
          )}

          {/* 6. PRIVACY CATEGORY VIEW */}
          {activeCategory === 'privacy' && (
            <PrivacyCategoryView />
          )}

          {/* 7. PAYMENT CATEGORY VIEW */}
          {activeCategory === 'payment' && (
            <PaymentCategoryView />
          )}

          {/* 8. LANGUAGE CATEGORY VIEW */}
          {activeCategory === 'language' && (
            <LanguageCategoryView />
          )}

          {/* 9. HELP CATEGORY VIEW */}
          {activeCategory === 'help' && (
            <HelpCategoryView
              userEmail={currentEmail}
              userName={currentDisplayName}
              userId={currentUserId}
            />
          )}

        </div>
      )}

      {/* =========================================================================
          PROFILE PHOTO & COVER UPLOAD MODAL
          ========================================================================= */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        user={user}
        initialTab={photoModalInitialTab}
      />

      {/* =========================================================================
          LOGOUT CONFIRMATION MODAL
          ========================================================================= */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* =========================================================================
          AUTHENTICATION MODAL (Used to switch accounts or sign in)
          ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-[#EDE7E3] shadow-2xl space-y-5 text-left relative animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-stone-900">
                {authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Connect your account to sync your saved looks across devices.
              </p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); clearMessages(); }}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${authMode === 'signin' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); clearMessages(); }}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${authMode === 'signup' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3.5 text-xs">
              {authMode === 'signup' && (
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. christinalucas"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-medium text-stone-900 focus:outline-none focus:border-stone-800"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-medium text-stone-900 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-medium text-stone-900 focus:outline-none focus:border-stone-800"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loadingAction ? 'Processing...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loadingAction}
                className="w-full py-2.5 rounded-xl border border-stone-300 hover:border-stone-800 text-stone-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ProfilePage;
