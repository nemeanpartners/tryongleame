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
  signInWithPopup
} from 'firebase/auth';
import { 
  User, 
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
  Award
} from 'lucide-react';
import { ChallengeSubmission } from '../../types';

interface ProfilePageProps {
  onLoadPreset?: (preset: any) => void;
  onNavigate?: (tab: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLoadPreset, onNavigate }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // Tab states: 'signin', 'signup', 'forgot'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Form fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
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

  // Notification Preference states
  const [emailNotif, setEmailNotif] = useState<boolean>(() => localStorage.getItem('notif_email') !== 'false');
  const [deadlineNotif, setDeadlineNotif] = useState<boolean>(() => localStorage.getItem('notif_deadline') !== 'false');
  const [votesNotif, setVotesNotif] = useState<boolean>(() => localStorage.getItem('notif_votes') !== 'false');
  const [marketingNotif, setMarketingNotif] = useState<boolean>(() => localStorage.getItem('notif_marketing') === 'true');

  const handleToggleNotif = (key: string, value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setNewDisplayName(currentUser.displayName || '');
        // Sync username to localStorage so existing sandbox/gallery submissions can prefill it
        if (currentUser.displayName) {
          localStorage.setItem('kobella_username', currentUser.displayName);
        }
        fetchUserSubmissions(currentUser.displayName || currentUser.email?.split('@')[0] || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserSubmissions = async (name: string) => {
    if (!name) return;
    setSubmissionsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'submissions')).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'submissions');
      });
      const list: ChallengeSubmission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.username === name || data.username === `@${name}`) {
          list.push({ id: doc.id, ...data } as ChallengeSubmission);
        }
      });
      setUserSubmissions(list);
    } catch (err) {
      console.error('Error fetching user submissions: ', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }
    clearMessages();
    setLoadingAction(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setSuccessMsg('Signed in successfully!');
      // Reset forms
      setPassword('');
    } catch (err: any) {
      console.error('Sign in error: ', err);
      let message = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Incorrect email or password.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again later.';
      }
      setErrorMsg(message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoadingAction(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setSuccessMsg(`Signed in with Google as ${result.user.displayName || 'User'}!`);
    } catch (err: any) {
      console.error('Google sign in error: ', err);
      let message = 'Failed to sign in with Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in popup was closed before completing.';
      } else if (err.code === 'auth/blocked-by-popup-resolver') {
        message = 'Google sign-in popup was blocked. Please enable popups for this site.';
      }
      setErrorMsg(message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !username.trim()) {
      setErrorMsg('Please complete all fields to sign up.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    clearMessages();
    setLoadingAction(true);
    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // Set display name / username
      await updateProfile(userCredential.user, {
        displayName: username.trim()
      });
      
      localStorage.setItem('kobella_username', username.trim());
      
      setSuccessMsg('Account created successfully! Welcome to TryON Beauty Look LAB.');
      setUser({ ...userCredential.user, displayName: username.trim() });
    } catch (err: any) {
      console.error('Sign up error: ', err);
      let message = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (err.code === 'auth/weak-password') {
        message = 'The password is too weak.';
      }
      setErrorMsg(message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Password Recovery / Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to receive a recovery link.');
      return;
    }
    clearMessages();
    setLoadingAction(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg('A password recovery email has been sent to your inbox.');
    } catch (err: any) {
      console.error('Forgot password error: ', err);
      let message = 'Failed to send recovery email.';
      if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      }
      setErrorMsg(message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Profile Update Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }
    if (!user) return;
    clearMessages();
    setLoadingAction(true);
    try {
      await updateProfile(user, {
        displayName: newDisplayName.trim()
      });
      localStorage.setItem('kobella_username', newDisplayName.trim());
      setSuccessMsg('Profile updated successfully!');
      setIsEditingProfile(false);
      fetchUserSubmissions(newDisplayName.trim());
    } catch (err: any) {
      console.error('Profile update error: ', err);
      setErrorMsg('Failed to update display name.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    clearMessages();
    try {
      await signOut(auth);
      setSuccessMsg('Signed out successfully.');
      setUserSubmissions([]);
    } catch (err) {
      console.error('Sign out error: ', err);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-8 h-8 animate-spin text-[#732729]" />
        <span className="text-xs font-bold text-[#732729]">Authenticating studio session...</span>
      </div>
    );
  }

  return (
    <div id="profile-page" className="max-w-md mx-auto animate-in fade-in duration-300 text-stone-800">
      
      {/* SUCCESS / ERROR ALERTS */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider">Authentication Alert</h4>
            <p className="text-xs text-rose-700 font-semibold mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-left">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Success</h4>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {!user ? (
        /* ================= AUTHENTICATION WALL ================= */
        <div className="bg-white rounded-3xl border border-[#bc8381]/30 p-8 shadow-xl text-left space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#732729]/10 rounded-2xl flex items-center justify-center mx-auto text-[#732729]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#732729] uppercase tracking-wider">
              {authMode === 'signin' && 'Welcome Back'}
              {authMode === 'signup' && 'Create Account'}
              {authMode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              {authMode === 'signin' && 'Sign in to access your custom makeup blueprints, history, and profile features.'}
              {authMode === 'signup' && 'Join TryON Beauty Look LAB to publish custom cosmetic formulas and vote on formulas.'}
              {authMode === 'forgot' && 'Enter your account email below to receive a password recovery verification link.'}
            </p>
          </div>

          {/* FORM FOR SIGN IN */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#bc8381]" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF6F5] border border-[#bc8381]/30 hover:border-[#bc8381]/50 focus:border-[#732729] px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder-stone-400"
                />
              </div>

              <div className="space-y-1 relative">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-[#bc8381]" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[10px] font-bold text-[#732729] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FAF6F5] border border-[#bc8381]/30 hover:border-[#bc8381]/50 focus:border-[#732729] pl-4 pr-10 py-3 rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingAction}
                className="w-full bg-[#732729] hover:bg-[#5c1d1f] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loadingAction ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="relative my-4 flex py-1 items-center">
                <div className="flex-grow border-t border-[#bc8381]/20"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-[#bc8381]/20"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loadingAction}
                className="w-full bg-white hover:bg-[#FAF6F5] border border-[#bc8381]/40 text-stone-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign In with Google
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500 font-semibold">New to TryON? </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); clearMessages(); }}
                  className="text-xs font-black text-[#732729] hover:underline cursor-pointer"
                >
                  Create an Account
                </button>
              </div>
            </form>
          )}

          {/* FORM FOR SIGN UP */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[#bc8381]" /> Display Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="beauty_guru"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#FAF6F5] border border-[#bc8381]/30 hover:border-[#bc8381]/50 focus:border-[#732729] px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder-stone-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#bc8381]" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF6F5] border border-[#bc8381]/30 hover:border-[#bc8381]/50 focus:border-[#732729] px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder-stone-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#bc8381]" /> Create Password (min. 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FAF6F5] border border-[#bc8381]/30 hover:border-[#bc8381]/50 focus:border-[#732729] pl-4 pr-10 py-3 rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingAction}
                className="w-full bg-[#732729] hover:bg-[#5c1d1f] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loadingAction ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Sign Up & Join'
                )}
              </button>

              <div className="relative my-4 flex py-1 items-center">
                <div className="flex-grow border-t border-[#bc8381]/20"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-[#bc8381]/20"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loadingAction}
                className="w-full bg-white hover:bg-[#FAF6F5] border border-[#bc8381]/40 text-stone-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign In with Google
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500 font-semibold">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); clearMessages(); }}
                  className="text-xs font-black text-[#732729] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* FORM FOR FORGOT PASSWORD */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#bc8381]" /> Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF6F5] border border-[#bc8381]/30 hover:border-[#bc8381]/50 focus:border-[#732729] px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder-stone-400"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAction}
                className="w-full bg-[#732729] hover:bg-[#5c1d1f] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loadingAction ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  'Send Recovery Link'
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); clearMessages(); }}
                  className="text-xs font-black text-[#732729] hover:underline cursor-pointer flex items-center gap-1 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* ================= PRIVATE PROFILE PAGE ================= */
        <div className="space-y-8 text-left">
          
          {/* USER CARD WITH DYNAMIC TIERS & ACHIEVEMENTS */}
          <div className="bg-white rounded-3xl border border-[#bc8381]/30 p-6 md:p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#bc8381]/10 to-transparent rounded-bl-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left w-full md:w-auto">
                {/* Profile Avatar & Status Indicator */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#732729] to-[#bc8381] rounded-2xl flex items-center justify-center shadow-lg relative">
                    <span className="text-3xl font-serif text-white font-black uppercase tracking-widest">
                      {(user.displayName || 'U').charAt(0)}
                    </span>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 w-full">
                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <input
                        type="text"
                        required
                        placeholder="Username"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="bg-[#FAF6F5] border border-[#bc8381]/30 focus:border-[#732729] px-3.5 py-2 rounded-xl text-xs font-bold focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={loadingAction}
                        className="bg-[#732729] hover:bg-[#5c1d1f] text-white text-[10px] uppercase font-black px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h3 className="text-xl font-serif font-black text-[#732729]">
                          @{user.displayName || 'beauty_enthusiast'}
                        </h3>
                        <button
                          onClick={() => {
                            setNewDisplayName(user.displayName || '');
                            setIsEditingProfile(true);
                          }}
                          className="text-[10px] text-[#bc8381] font-bold hover:underline cursor-pointer"
                        >
                          (Edit Name)
                        </button>
                      </div>
                      <p className="text-xs text-stone-500 font-semibold">{user.email}</p>
                    </div>
                  )}

                  {/* USER TIER TRACKER */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider text-left">
                      Studio Progression & Badges
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      {/* Tier 1: Studio Resident (Always active upon sign up) */}
                      <div className="flex items-center gap-1.5 bg-[#FAF6F5] border border-[#bc8381]/30 text-[10px] font-bold text-[#732729] px-3 py-1.5 rounded-full shadow-sm" title="Studio Resident: Standard status for all signed up members">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#bc8381]" />
                        <span>Studio Resident</span>
                      </div>

                      {/* Tier 2: Verified Creator (Unlocked by creating & submitting a look) */}
                      {userSubmissions.length > 0 ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 px-3 py-1.5 rounded-full shadow-sm" title="Verified Creator: Unlocked by submitting a custom cosmetic look to challenges">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Verified Creator</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-400 px-3 py-1.5 rounded-full opacity-60" title="Locked: Submit a makeup formula in the sandbox to become a Verified Creator">
                          <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                          <span className="line-through">Verified Creator</span>
                        </div>
                      )}

                      {/* Tier 3: Beauty Challenge Winner (Active if username matches historical winner or has highly voted submissions) */}
                      {(() => {
                        const name = user.displayName || '';
                        const hasWinnerName = name === 'sofia_beauty' || name === 'cosmic_jade' || name === 'autumn_glaze';
                        const hasHighlyVoted = userSubmissions.some(sub => (sub.votes || 0) >= 10);
                        const isWinner = hasWinnerName || hasHighlyVoted;

                        if (isWinner) {
                          return (
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-[10px] font-bold text-amber-800 px-3 py-1.5 rounded-full shadow-sm" title="Winner Badge: Outstanding design for challenge">
                              <Trophy className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>Beauty Challenge Winner</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-400 px-3 py-1.5 rounded-full opacity-60" title="Locked: Win a monthly challenge or get over 10 community votes to secure a challenge winner badge">
                              <Trophy className="w-3.5 h-3.5 text-stone-400" />
                              <span className="line-through">Challenge Winner</span>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* Dynamic Message / Special tag for winning challenge name */}
                    {(() => {
                      const name = user.displayName || '';
                      let winInfo = { won: false, challengeName: '', type: '' };
                      if (name === 'sofia_beauty') {
                        winInfo = { won: true, challengeName: 'July 2026: Ethereal Siren', type: 'Hall of Fame Champion' };
                      } else if (name === 'cosmic_jade') {
                        winInfo = { won: true, challengeName: 'June 2026: Cyberpunk Violet', type: 'Hall of Fame Champion' };
                      } else if (name === 'autumn_glaze') {
                        winInfo = { won: true, challengeName: 'May 2026: Sunset Silk', type: 'Hall of Fame Champion' };
                      } else {
                        const highlyVoted = userSubmissions.find(sub => (sub.votes || 0) >= 10);
                        if (highlyVoted) {
                          winInfo = { won: true, challengeName: `August 2026 Challenge (Look: ${highlyVoted.lookName})`, type: 'Community Choice Winner' };
                        }
                      }

                      if (winInfo.won) {
                        return (
                          <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-stone-700 text-xs flex items-center gap-2 mt-2 max-w-lg text-left">
                            <Award className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                              <p className="font-extrabold text-amber-950 text-[10px] uppercase tracking-wider">{winInfo.type}</p>
                              <p className="font-semibold text-amber-800">Honored for <span className="font-black italic">"{winInfo.challengeName}"</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                </div>
              </div>

              {/* SIGNOUT BUTTON */}
              <button
                onClick={handleLogout}
                className="bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-600 hover:text-rose-700 text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0 self-center md:self-start w-full sm:w-auto"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>

            </div>
            
            {/* STATS COUNT GRID (Submissions passed, Votes received, etc) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#bc8381]/20">
              <div className="bg-[#FAF6F5]/50 border border-[#bc8381]/15 rounded-2xl p-4 text-center">
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Submissions Passed</div>
                <div className="text-2xl font-serif font-black text-[#732729] mt-1">{userSubmissions.length}</div>
                <div className="text-[9px] text-stone-500 font-semibold mt-0.5">Ready for professional sync</div>
              </div>

              <div className="bg-[#FAF6F5]/50 border border-[#bc8381]/15 rounded-2xl p-4 text-center">
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total Upvotes Received</div>
                <div className="text-2xl font-serif font-black text-amber-700 mt-1 flex items-center justify-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-amber-600" />
                  <span>{userSubmissions.reduce((acc, curr) => acc + (curr.votes || 0), 0)}</span>
                </div>
                <div className="text-[9px] text-stone-500 font-semibold mt-0.5">Across all formula cards</div>
              </div>

              <div className="bg-[#FAF6F5]/50 border border-[#bc8381]/15 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Creator Standing</div>
                <div className="text-xs font-black text-[#732729] mt-2 uppercase tracking-wide">
                  {userSubmissions.length === 0 ? (
                    <span className="text-stone-500">Resident Guru</span>
                  ) : (user.displayName === 'sofia_beauty' || user.displayName === 'cosmic_jade' || user.displayName === 'autumn_glaze' || userSubmissions.some(s => (s.votes || 0) >= 10)) ? (
                    <span className="text-amber-700 font-black">★ Hall of Fame Master</span>
                  ) : (
                    <span className="text-emerald-700">Verified Designer</span>
                  )}
                </div>
                <div className="text-[9px] text-stone-500 font-semibold mt-1">Tier-based system rank</div>
              </div>
            </div>

          </div>

          {/* NOTIFICATION PERMISSIONS CONTROL PANEL */}
          <div className="bg-white rounded-3xl border border-[#bc8381]/30 p-6 shadow-md space-y-4">
            <div className="border-b border-[#bc8381]/20 pb-3 text-left">
              <h3 className="text-sm font-serif font-black uppercase tracking-wider text-[#732729] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#bc8381]" /> Notification Permissions & Alerts
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5 font-medium">Configure how you receive system challenge updates and upvote status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Toggle 1: Email Alert */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF6F5]/40 rounded-2xl border border-[#bc8381]/15 hover:border-[#bc8381]/30 transition-all">
                <div className="space-y-0.5 text-left pr-3">
                  <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    Email Digest Alerts
                    {emailNotif && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                  </div>
                  <p className="text-[10px] text-stone-400 font-medium leading-relaxed">Receive weekly recap emails with winning formulas.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotif('notif_email', !emailNotif, setEmailNotif)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 focus:outline-none ${emailNotif ? 'bg-[#732729]' : 'bg-stone-200'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${emailNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 2: Challenge Deadlines */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF6F5]/40 rounded-2xl border border-[#bc8381]/15 hover:border-[#bc8381]/30 transition-all">
                <div className="space-y-0.5 text-left pr-3">
                  <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    Challenge Reminders
                    {deadlineNotif && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                  </div>
                  <p className="text-[10px] text-stone-400 font-medium leading-relaxed">Notify when a new beauty lab contest starts or ends.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotif('notif_deadline', !deadlineNotif, setDeadlineNotif)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 focus:outline-none ${deadlineNotif ? 'bg-[#732729]' : 'bg-stone-200'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${deadlineNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 3: Upvotes Alerts */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF6F5]/40 rounded-2xl border border-[#bc8381]/15 hover:border-[#bc8381]/30 transition-all">
                <div className="space-y-0.5 text-left pr-3">
                  <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    Real-time Vote Alerts
                    {votesNotif && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                  </div>
                  <p className="text-[10px] text-stone-400 font-medium leading-relaxed">Alert me immediately inside the app when another creator upvotes my looks.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotif('notif_votes', !votesNotif, setVotesNotif)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 focus:outline-none ${votesNotif ? 'bg-[#732729]' : 'bg-stone-200'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${votesNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 4: Marketing Updates */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF6F5]/40 rounded-2xl border border-[#bc8381]/15 hover:border-[#bc8381]/30 transition-all">
                <div className="space-y-0.5 text-left pr-3">
                  <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    Brand Collaborations
                    {marketingNotif && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                  </div>
                  <p className="text-[10px] text-stone-400 font-medium leading-relaxed">Receive updates for physical cosmetics distribution of custom lab blueprints.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotif('notif_marketing', !marketingNotif, setMarketingNotif)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 focus:outline-none ${marketingNotif ? 'bg-[#732729]' : 'bg-stone-200'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${marketingNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* STATISTICS & CREATIONS BOARD */}
          <div className="space-y-4">
            <div className="border-b border-[#bc8381]/30 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-serif font-black uppercase tracking-wider text-[#732729] flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-[#bc8381]" /> Your Studio Submissions
              </h3>
              <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg">
                {userSubmissions.length} active
              </span>
            </div>

            {submissionsLoading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-1">
                <RefreshCw className="w-6 h-6 animate-spin text-[#bc8381]" />
                <span className="text-[10px] font-bold text-[#bc8381]">Loading formulas...</span>
              </div>
            ) : userSubmissions.length === 0 ? (
              <div className="bg-[#FAF6F5] border border-[#bc8381]/20 rounded-2xl p-8 text-center space-y-3">
                <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                  You haven't submitted any looks to the community challenge yet. Formulate a look in the Editor Sandbox and share it with the studio community!
                </p>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('sandbox')}
                    className="bg-white hover:bg-[#732729] hover:text-white border border-[#bc8381]/45 text-[#732729] text-[10px] uppercase font-black tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Open Sandbox Lab
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl border border-[#bc8381]/25 hover:border-[#732729]/30 p-4 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <h4 className="font-serif font-black text-xs text-[#732729] truncate">{sub.lookName}</h4>
                      <p className="text-[10px] text-stone-500 font-semibold line-clamp-2 mt-1 leading-relaxed">
                        {sub.description}
                      </p>
                    </div>

                    <div className="bg-[#FAF6F5] rounded-lg p-2.5 border border-[#bc8381]/15 grid grid-cols-2 gap-1.5 text-[9px] text-stone-500 font-bold">
                      <div>Filter: <span className="font-bold text-[#732729]">{sub.makeupConfig?.selectedFilter || 'none'}</span></div>
                      <div>Lashes: <span className="font-bold text-[#bc8381]">{sub.makeupConfig?.lashesStyle || 'natural'}</span></div>
                      <div>Glitter: <span className="font-bold text-amber-600">{sub.makeupConfig?.glitterLevel || 0}%</span></div>
                      <div className="flex items-center gap-0.5">
                        Votes: <span className="font-bold text-[#732729]">{sub.votes || 0}</span>
                      </div>
                    </div>

                    {onLoadPreset && (
                      <button
                        onClick={() => onLoadPreset({
                          id: sub.id,
                          name: sub.lookName,
                          description: sub.description,
                          eyeshadowColor: sub.makeupConfig.eyeshadowColor,
                          eyeshadowOpacity: sub.makeupConfig.eyeshadowOpacity,
                          blushColor: sub.makeupConfig.blushColor,
                          blushOpacity: sub.makeupConfig.blushOpacity,
                          lipColor: sub.makeupConfig.lipColor,
                          lipOpacity: sub.makeupConfig.lipOpacity,
                          lipGloss: sub.makeupConfig.lipGloss,
                          lashesStyle: sub.makeupConfig.lashesStyle,
                          glitterLevel: sub.makeupConfig.glitterLevel,
                          filter: sub.makeupConfig.selectedFilter
                        })}
                        className="w-full bg-[#FAF6F5] hover:bg-[#732729] hover:text-white border border-[#bc8381]/20 text-[#732729] text-[9px] font-black uppercase tracking-widest py-2 rounded-xl cursor-pointer transition-all text-center"
                      >
                        Load Recipe
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
