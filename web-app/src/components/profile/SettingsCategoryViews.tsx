import React, { useState, useEffect } from 'react';
import { 
  CircleUser, 
  Mail, 
  Lock, 
  Shield, 
  KeyRound, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  Check, 
  Copy, 
  ExternalLink, 
  HelpCircle, 
  Sun, 
  Moon, 
  Volume2, 
  Monitor, 
  CreditCard, 
  Globe, 
  AlertCircle, 
  LogOut, 
  ChevronRight,
  Sliders,
  FileText,
  Camera,
  MessageSquare
} from 'lucide-react';
import { SubmitInquiryModal, UserInquiriesList } from './InquiryModal';
import { PhotoUploadModal } from './PhotoUploadModal';
import { getEffectiveAvatar } from '../../lib/userProfileService';

/* =========================================================
   1. ACCOUNT CATEGORY VIEW
   Shows details of the account: Email, Name, Creator ID,
   Tier, Password reset & Credentials.
   ========================================================= */
interface AccountCategoryViewProps {
  userEmail: string;
  userName: string;
  userId: string;
  isFirebaseUser: boolean;
  onUpdateName: (newName: string) => Promise<boolean>;
  onSendPasswordReset: () => Promise<void>;
  onOpenAuthModal: () => void;
}

export const AccountCategoryView: React.FC<AccountCategoryViewProps> = ({
  userEmail,
  userName,
  userId,
  isFirebaseUser,
  onUpdateName,
  onSendPasswordReset,
  onOpenAuthModal
}) => {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [userAvatar, setUserAvatar] = useState(() => getEffectiveAvatar());
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setUserAvatar(getEffectiveAvatar());
    };
    window.addEventListener('tryon_profile_updated', handleUpdate);
    return () => window.removeEventListener('tryon_profile_updated', handleUpdate);
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setSaving(true);
    const success = await onUpdateName(tempName.trim());
    setSaving(false);
    if (success) {
      setEditingName(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleResetPasswordClick = async () => {
    await onSendPasswordReset();
    setResetSent(true);
    setTimeout(() => setResetSent(false), 5000);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      
      {/* Account Overview Header Card */}
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3.5">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="w-13 h-13 rounded-2xl overflow-hidden shadow-[3px_3px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.9)] border border-white/70 bg-stone-900">
                <img 
                  src={userAvatar} 
                  alt={userName || 'Profile'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-stone-900 hover:bg-black text-white rounded-full flex items-center justify-center border border-white shadow-xs cursor-pointer transition-transform hover:scale-105"
                title="Change Photo"
              >
                <Camera className="w-2.5 h-2.5" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 leading-tight">
                  {userName || 'Studio Resident'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="text-[10px] font-bold text-stone-500 hover:text-stone-900 underline cursor-pointer"
                >
                  Change Photo
                </button>
              </div>
              <p className="text-xs text-stone-500 font-medium">{userEmail}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active</span>
          </span>
        </div>

        {/* Account Details Table */}
        <div className="space-y-3 divide-y divide-stone-200/60 pt-1 text-xs">
          
          {/* Display Name Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5">
            <span className="font-bold text-stone-500 text-xs">Display Name</span>
            {editingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <input 
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-[#ede9e4] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-white/70 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#ff2f68]"
                  autoFocus
                />
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-3 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-900 text-[10px] font-black uppercase shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setTempName(userName); setEditingName(false); }}
                  className="px-2.5 py-1.5 rounded-full bg-[#ede9e4] text-stone-600 text-[10px] font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 cursor-pointer hover:bg-[#e4ded9]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">{userName}</span>
                <button 
                  onClick={() => setEditingName(true)}
                  className="px-2.5 py-0.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-[11px] font-bold text-[#ff2f68] shadow-[1px_1px_3px_rgba(0,0,0,0.05),-1px_-1px_3px_rgba(255,255,255,0.9)] border border-white/80 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Email Row */}
          <div className="flex items-center justify-between pt-3">
            <span className="font-bold text-stone-500 text-xs">Email Address</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900">{userEmail}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold shadow-[inset_1px_1px_2px_rgba(0,0,0,0.02)]">
                Verified
              </span>
            </div>
          </div>

          {/* Username Handle */}
          <div className="flex items-center justify-between pt-3">
            <span className="font-bold text-stone-500 text-xs">Username Handle</span>
            <span className="font-bold text-stone-800">@{userName.toLowerCase().replace(/\s+/g, '_')}</span>
          </div>

          {/* Creator ID / UID */}
          <div className="flex items-center justify-between pt-3">
            <span className="font-bold text-stone-500 text-xs">Creator UID</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-stone-600 bg-[#ede9e4] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05),inset_-1px_-1px_3px_rgba(255,255,255,0.8)] px-2.5 py-1 rounded-xl border border-white/70 max-w-[150px] truncate">
                {userId}
              </span>
              <button 
                onClick={handleCopyId}
                className="w-7 h-7 rounded-full bg-[#ede9e4] hover:bg-white shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Copy UID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Studio Membership Tier */}
          <div className="flex items-center justify-between pt-3">
            <span className="font-bold text-stone-500 text-xs">Studio Membership</span>
            <span className="font-bold text-[#ff2f68] bg-[#ff2f68]/10 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-[#ff2f68]/20 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)]">
              Studio Resident (Pro)
            </span>
          </div>

          {/* Member Since */}
          <div className="flex items-center justify-between pt-3">
            <span className="font-bold text-stone-500 text-xs">Member Since</span>
            <span className="font-medium text-stone-600">March 2026</span>
          </div>
        </div>
      </div>

      {/* Security & Password Section */}
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-4">
        <div className="border-b border-stone-200/60 pb-2.5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 leading-tight">
              Security & Sign-In
            </h4>
            <p className="text-[11px] text-stone-500 font-medium">
              Manage your authenticated credentials, two-factor authentication and passwords.
            </p>
          </div>
        </div>

        <div className="space-y-3 divide-y divide-stone-200/60 text-xs">
          {/* Password Reset */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="font-bold text-stone-800">Password</div>
              <p className="text-[10px] text-stone-400 font-medium">Last updated recently</p>
            </div>
            <button
              onClick={handleResetPasswordClick}
              className="px-3.5 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-800 text-xs font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {resetSent ? 'Email Sent ✓' : 'Reset Password'}
            </button>
          </div>

          {/* Two-Factor Auth */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-bold text-stone-800">Two-Factor Authentication (2FA)</div>
              <p className="text-[10px] text-stone-400 font-medium">Secure your studio formulas with biometric or SMS verification</p>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                twoFactorEnabled ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Authentication Providers */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-bold text-stone-800">Connected Accounts</div>
              <p className="text-[10px] text-stone-400 font-medium">Google OAuth & Firebase Email Auth</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)]">
              Connected
            </span>
          </div>
        </div>

        {/* Switch / Sign In with Another Account Button */}
        <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between">
          <span className="text-xs text-stone-500 font-medium">Switch account:</span>
          <button
            onClick={onOpenAuthModal}
            className="px-3.5 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-900 text-xs font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1"
          >
            <span>Sign In to Another Account</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
      />

    </div>
  );
};

/* =========================================================
   2. NOTIFICATION CATEGORY VIEW
   ========================================================= */
interface NotificationCategoryViewProps {
  emailNotif: boolean;
  deadlineNotif: boolean;
  votesNotif: boolean;
  marketingNotif: boolean;
  onToggle: (key: string, value: boolean, setter: any) => void;
  setEmailNotif: any;
  setDeadlineNotif: any;
  setVotesNotif: any;
  setMarketingNotif: any;
}

export const NotificationCategoryView: React.FC<NotificationCategoryViewProps> = ({
  emailNotif,
  deadlineNotif,
  votesNotif,
  marketingNotif,
  onToggle,
  setEmailNotif,
  setDeadlineNotif,
  setVotesNotif,
  setMarketingNotif
}) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-200">
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-4">
        <div className="border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-100/80 shadow-[2px_2px_5px_rgba(225,29,72,0.08),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-rose-200/80 flex items-center justify-center text-[#ff2f68]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 leading-tight">
              Alerts & Notifications
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Control which alerts you receive for community upvotes, challenge starts, and weekly digests.
            </p>
          </div>
        </div>

        <div className="space-y-3.5 divide-y divide-stone-200/60">
          
          {/* Push Notifications */}
          <div className="flex items-center justify-between pt-2">
            <div className="pr-3">
              <div className="text-xs font-bold text-stone-800">Push Notifications</div>
              <p className="text-[10px] text-stone-400 font-medium">Instant alerts on your device when someone tries your custom formula</p>
            </div>
            <button
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                pushEnabled ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                pushEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Email Digest Alerts */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <div className="text-xs font-bold text-stone-800">Email Digest Alerts</div>
              <p className="text-[10px] text-stone-400 font-medium">Receive weekly recap emails featuring the winning cosmetic formulas</p>
            </div>
            <button
              onClick={() => onToggle('notif_email', !emailNotif, setEmailNotif)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                emailNotif ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                emailNotif ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Challenge Deadlines */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <div className="text-xs font-bold text-stone-800">Challenge Reminders</div>
              <p className="text-[10px] text-stone-400 font-medium">Alerts when a new beauty lab challenge begins or voting is ending</p>
            </div>
            <button
              onClick={() => onToggle('notif_deadline', !deadlineNotif, setDeadlineNotif)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                deadlineNotif ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                deadlineNotif ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Upvotes Alerts */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <div className="text-xs font-bold text-stone-800">Real-Time Vote Alerts</div>
              <p className="text-[10px] text-stone-400 font-medium">Notify inside the studio when a creator upvotes your submissions</p>
            </div>
            <button
              onClick={() => onToggle('notif_votes', !votesNotif, setVotesNotif)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                votesNotif ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                votesNotif ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Brand Collaborations */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <div className="text-xs font-bold text-stone-800">Brand Collaborations</div>
              <p className="text-[10px] text-stone-400 font-medium">Opportunities to license your formulas for physical cosmetic sample production</p>
            </div>
            <button
              onClick={() => onToggle('notif_marketing', !marketingNotif, setMarketingNotif)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                marketingNotif ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                marketingNotif ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Audio Haptics */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <div className="text-xs font-bold text-stone-800">Sound & Haptic Effects</div>
              <p className="text-[10px] text-stone-400 font-medium">Subtle audio cues when toggling brushes and saving looks</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                soundEnabled ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

/* =========================================================
   3. DISPLAY CATEGORY VIEW
   ========================================================= */
export const DisplayCategoryView: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'warm' | 'dark'>(() => {
    return (localStorage.getItem('tryon_theme') as any) || 'warm';
  });
  const [resolution, setResolution] = useState<'standard' | 'hd'>('hd');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const handleSelectTheme = (theme: 'light' | 'warm' | 'dark') => {
    setSelectedTheme(theme);
    localStorage.setItem('tryon_theme', theme);
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-200">
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-4">
        <div className="border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 leading-tight">
              Display & Visual Appearance
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Customize the look and feel of the TryON Beauty Studio canvas and camera preview.
            </p>
          </div>
        </div>

        {/* Theme Selectors */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-stone-700">Studio Theme Atmosphere</label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'light', label: 'Crisp Light', desc: 'Minimalist white canvas', color: 'bg-[#faf8f5] text-stone-800' },
              { id: 'warm', label: 'Warm Studio', desc: 'Luxury blush terracotta', color: 'bg-[#FAF6F4] text-stone-900' },
              { id: 'dark', label: 'Velvet Dark', desc: 'Cinema camera mood', color: 'bg-stone-900 text-white' }
            ].map((th) => (
              <button
                key={th.id}
                onClick={() => handleSelectTheme(th.id as any)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${th.color} ${
                  selectedTheme === th.id 
                    ? 'border-[#ff2f68] ring-2 ring-[#ff2f68] shadow-[3px_3px_10px_rgba(255,47,104,0.2),-2px_-2px_8px_rgba(255,255,255,0.9)] scale-[1.02]' 
                    : 'border-white/80 shadow-[3px_3px_8px_rgba(0,0,0,0.04),-3px_-3px_8px_rgba(255,255,255,0.85)] opacity-80 hover:opacity-100 hover:scale-[1.01]'
                }`}
              >
                <div>
                  <div className="text-xs font-black">{th.label}</div>
                  <div className="text-[9.5px] opacity-75 mt-0.5 leading-tight">{th.desc}</div>
                </div>
                {selectedTheme === th.id && (
                  <div className="mt-2 self-end w-4 h-4 rounded-full bg-[#ff2f68] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Options */}
        <div className="pt-3 border-t border-stone-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-stone-800">Camera Filter Rendering</div>
              <p className="text-[10px] text-stone-400 font-medium">Full HD 60fps WebGL shaders with real-time skin diffusion</p>
            </div>
            <div className="flex items-center gap-1 bg-[#ede9e4] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.07),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] p-1 rounded-full border border-white/70 text-xs">
              <button
                onClick={() => setResolution('standard')}
                className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                  resolution === 'standard' 
                    ? 'bg-white shadow-[1px_1px_3px_rgba(0,0,0,0.08)] text-stone-900' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setResolution('hd')}
                className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                  resolution === 'hd' 
                    ? 'bg-[#ff2f68] text-white shadow-[1px_2px_4px_rgba(255,47,104,0.3)]' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Ultra HD 4K
              </button>
            </div>
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-bold text-stone-800">Reduce Motion Effects</div>
              <p className="text-[10px] text-stone-400 font-medium">Turn off carousel bouncing and floating particles for accessibility</p>
            </div>
            <button
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                reduceMotion ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                reduceMotion ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-bold text-stone-800">High Contrast Palette Swatches</div>
              <p className="text-[10px] text-stone-400 font-medium">Highlight shade boundaries for easier formula inspection</p>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                highContrast ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                highContrast ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

/* =========================================================
   4. PRIVACY CATEGORY VIEW
   ========================================================= */
export const PrivacyCategoryView: React.FC = () => {
  const [isPublic, setIsPublic] = useState(true);
  const [showInSearch, setShowInSearch] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClearCache = () => {
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3000);
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-200">
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-4">
        <div className="border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 leading-tight">
              Privacy & Content Controls
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Manage who can see your customized beauty looks and how your data is processed.
            </p>
          </div>
        </div>

        <div className="space-y-3.5 divide-y divide-stone-200/60 text-xs">
          
          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="pr-3">
              <div className="font-bold text-stone-800">Public Creator Profile</div>
              <p className="text-[10px] text-stone-400 font-medium">Allow other users to view your portfolio and try your formulas</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                isPublic ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Discovery feeds */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <div className="font-bold text-stone-800">Discovery & Explore Feed Placement</div>
              <p className="text-[10px] text-stone-400 font-medium">Feature your created looks on the Inspiration Wall and Community Feed</p>
            </div>
            <button
              onClick={() => setShowInSearch(!showInSearch)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                showInSearch ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                showInSearch ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Comments on Submissions */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <div className="font-bold text-stone-800">Allow Feedback & Reviews</div>
              <p className="text-[10px] text-stone-400 font-medium">Permit community creators to leave constructive reviews on your looks</p>
            </div>
            <button
              onClick={() => setAllowComments(!allowComments)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                allowComments ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                allowComments ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Anonymous Telemetry */}
          <div className="flex items-center justify-between pt-3">
            <div className="pr-3">
              <div className="font-bold text-stone-800">Anonymous Studio Diagnostics</div>
              <p className="text-[10px] text-stone-400 font-medium">Share non-identifying GPU shader performance logs to improve AR accuracy</p>
            </div>
            <button
              onClick={() => setAnalyticsConsent(!analyticsConsent)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] ${
                analyticsConsent ? 'bg-[#ff2f68]' : 'bg-[#e2ddd7]'
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ${
                analyticsConsent ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

        </div>

        {/* Clear cache */}
        <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-800">Local Filter Cache</div>
            <p className="text-[10px] text-stone-400 font-medium">Clear cached offline texture assets</p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-3.5 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-700 text-xs font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            {clearedNotice ? 'Cleared ✓' : 'Clear Cache'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   5. PAYMENT CATEGORY VIEW
   ========================================================= */
export const PaymentCategoryView: React.FC = () => {
  return (
    <div className="space-y-5 text-left animate-in fade-in duration-200">
      
      {/* Active Subscription Tier */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 text-white rounded-3xl border border-white/20 shadow-[6px_6px_20px_rgba(0,0,0,0.2),-4px_-4px_16px_rgba(255,255,255,0.7)] space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#ff2f68]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full bg-[#ff2f68] text-white text-[9px] font-black uppercase tracking-wider shadow-[0_2px_6px_rgba(255,47,104,0.4)]">
              ACTIVE MEMBERSHIP
            </span>
            <h3 className="text-lg font-black text-white mt-2 tracking-tight">TryON Studio Pro</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white">$0</span>
            <span className="text-xs text-stone-400 font-bold block">/ Creator Tier</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 text-[11px] text-stone-300 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#ff2f68]/20 flex items-center justify-center text-[#ff2f68]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Unlimited live try-ons</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#ff2f68]/20 flex items-center justify-center text-[#ff2f68]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">4K Shader export</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#ff2f68]/20 flex items-center justify-center text-[#ff2f68]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">All Challenge Badges</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#ff2f68]/20 flex items-center justify-center text-[#ff2f68]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Formula Library</span>
          </div>
        </div>
      </div>

      {/* Payment Methods Card */}
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-4">
        <div className="border-b border-stone-200/60 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 leading-tight">
                Saved Payment Methods
              </h4>
              <p className="text-[11px] text-stone-500 font-medium">Used for cosmetic sampling drops & verified badges.</p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-xs font-bold text-[#ff2f68] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95">
            + Add Card
          </button>
        </div>

        {/* Card Entry */}
        <div className="p-3.5 rounded-2xl bg-[#ede9e4]/80 border border-white/80 shadow-[3px_3px_8px_rgba(0,0,0,0.04),-3px_-3px_8px_rgba(255,255,255,0.85)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-8 rounded-xl bg-stone-900 text-white font-black text-[10px] flex items-center justify-center tracking-widest shadow-xs">
              VISA
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900">Visa ending in •••• 4242</div>
              <div className="text-[10px] text-stone-400 font-medium">Expires 08/28 · Default</div>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#f2eee9] text-stone-700 text-[10px] font-bold border border-white/80 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)]">
            Default
          </span>
        </div>

        {/* Billing receipts */}
        <div className="pt-2 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-medium">Billing history & statements:</span>
          <button className="px-3 py-1.5 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-[#ff2f68] font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1">
            <span>Download Receipts</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

    </div>
  );
};

/* =========================================================
   6. LANGUAGE CATEGORY VIEW
   ========================================================= */
export const LanguageCategoryView: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return localStorage.getItem('tryon_language') || 'en';
  });

  const languages = [
    { code: 'en', name: 'English', native: 'English (United States)' },
    { code: 'fr', name: 'French', native: 'Français (France)' },
    { code: 'es', name: 'Spanish', native: 'Español (España)' },
    { code: 'de', name: 'German', native: 'Deutsch (Deutschland)' },
    { code: 'it', name: 'Italian', native: 'Italiano (Italia)' },
    { code: 'ja', name: 'Japanese', native: '日本語 (Japan)' },
    { code: 'ko', name: 'Korean', native: '한국어 (Korea)' },
    { code: 'pt', name: 'Portuguese', native: 'Português (Brasil)' }
  ];

  const handleSelect = (code: string) => {
    setSelectedLang(code);
    localStorage.setItem('tryon_language', code);
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-200">
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-4">
        <div className="border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 leading-tight">
              Language & Regional Preferences
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Select your preferred interface language and localized cosmetic descriptions.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#ede9e4] border border-white shadow-[3px_3px_8px_rgba(0,0,0,0.05),-3px_-3px_8px_rgba(255,255,255,0.9)] scale-[1.01]'
                    : 'bg-[#ede9e4]/40 hover:bg-[#ede9e4]/80 border border-transparent hover:border-white/70 shadow-[1px_1px_3px_rgba(0,0,0,0.02),-1px_-1px_3px_rgba(255,255,255,0.8)]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-stone-900">{lang.native}</div>
                  <div className="text-[10px] text-stone-400 font-medium">{lang.name}</div>
                </div>
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-[#ff2f68] text-white flex items-center justify-center shadow-[1px_2px_4px_rgba(255,47,104,0.3)]">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-stone-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   7. HELP CATEGORY VIEW
   ========================================================= */
interface HelpCategoryViewProps {
  userEmail?: string;
  userName?: string;
  userId?: string;
}

export const HelpCategoryView: React.FC<HelpCategoryViewProps> = ({
  userEmail = 'christinalucas1216@gmail.com',
  userName = 'Christina Lucas',
  userId = 'usr_resident_01'
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [inquiryRefreshKey, setInquiryRefreshKey] = useState<number>(0);

  const faqs = [
    {
      q: 'How does virtual live makeup try-on work?',
      a: 'TryON Beauty uses camera landmark tracking to map 468 facial points in real time, projecting custom eyeshadow, lashes, blush, and lipstick textures with high-fidelity reflection shaders.'
    },
    {
      q: 'How do I submit my look to the monthly challenge?',
      a: 'Create and calibrate your formula in the Design Lab Sandbox, click "Submit Look", give your look a name, and your formula will instantly join the community voting leaderboard.'
    },
    {
      q: 'Can I save custom palettes to try on later?',
      a: 'Yes! Any preset on the Inspiration Wall or custom formula in the Sandbox can be bookmarked by clicking the bookmark ribbon icon. It is stored securely in your Saved collection.'
    },
    {
      q: 'How do I calibrate room lighting for accurate colors?',
      a: 'For best results, position yourself facing a soft, even light source without strong backlighting. The app will automatically adapt saturation and brightness.'
    }
  ];

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-200">
      
      {/* Help & FAQs */}
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-4">
        <div className="border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-700">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 leading-tight">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Quick answers for creating, saving, and trying on beauty formulas.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="border border-white/80 rounded-2xl overflow-hidden shadow-[2px_2px_6px_rgba(0,0,0,0.03),-2px_-2px_6px_rgba(255,255,255,0.85)] transition-all bg-[#ede9e4]/60"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-white/70 transition-colors"
                >
                  <span className="text-xs font-bold text-stone-800 pr-2">{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90 text-[#ff2f68]' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-3.5 text-xs text-stone-600 font-medium leading-relaxed bg-[#f9f7f4] border-t border-stone-200/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Support Inquiry Banner */}
      <div className="p-5 sm:p-6 bg-[#f5f2ee] rounded-3xl border border-white/80 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,0.9)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-stone-900">Need direct assistance?</h4>
            <p className="text-xs text-stone-500 font-medium leading-relaxed mt-0.5">
              Submit an inquiry with screenshots or questions. Our admin studio team reviews and responds directly in your portal.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="flex-1 py-2.5 px-4 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold text-center transition-all shadow-[2px_2px_6px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
            <span>Submit Inquiry</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="py-2.5 px-4 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-800 text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 hover:scale-[1.02] active:scale-95"
          >
            Report an Issue
          </button>
        </div>

        <div className="pt-2 text-[10px] text-stone-400 font-semibold text-center sm:text-left">
          TryON Beauty Lab · Version 2.8.4 (Build 412) · Executive Admin Dispatch Active
        </div>
      </div>

      {/* User Inquiries History & Active Tickets */}
      <UserInquiriesList
        key={inquiryRefreshKey}
        userEmail={userEmail}
        userName={userName}
        userId={userId}
        onOpenSubmitModal={() => setShowSubmitModal(true)}
      />

      {/* Submit Inquiry Modal */}
      <SubmitInquiryModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        userEmail={userEmail}
        userName={userName}
        userId={userId}
        onInquirySubmitted={() => setInquiryRefreshKey(k => k + 1)}
      />

    </div>
  );
};

/* =========================================================
   8. LOGOUT CONFIRMATION MODAL
   ========================================================= */
interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#f5f2ee] rounded-3xl p-6 border border-white/90 shadow-[10px_10px_30px_rgba(0,0,0,0.1),-10px_-10px_30px_rgba(255,255,255,0.9)] space-y-4 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)]">
          <LogOut className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-black text-stone-900">Sign Out of TryON Beauty?</h3>
          <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
            You will be signed out of your current studio session. You can sign back in at any time to access your saved looks and badges.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={onCancel}
            className="py-2.5 px-4 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_6px_rgba(225,29,72,0.3)] hover:scale-105 active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
