import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Check, 
  RotateCcw, 
  Image as ImageIcon,
  AlertCircle,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';
import { 
  getEffectiveAvatar, 
  getEffectiveCover, 
  saveCustomAvatar, 
  saveCustomCover, 
  resetAvatarToGoogle, 
  resetCustomCover,
  hasGooglePhoto,
  hasCustomAvatar,
  DEFAULT_AVATAR_URL,
  DEFAULT_COVER_URL
} from '../../lib/userProfileService';
import { User as FirebaseUser } from 'firebase/auth';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: FirebaseUser | null;
  initialTab?: 'avatar' | 'cover';
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  user,
  initialTab = 'avatar'
}) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'cover'>(initialTab);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAvatar = getEffectiveAvatar(user);
  const currentCover = getEffectiveCover();
  const googleAvailable = hasGooglePhoto(user);
  const isCustom = hasCustomAvatar();

  // Fast canvas image compression to keep Firestore documents ultra-light (<30KB) and instant
  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const webp = canvas.toDataURL('image/webp', quality);
            if (webp && webp.startsWith('data:image/webp')) {
              resolve(webp);
              return;
            }
          } catch {}
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Could not decode this image file.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image must be under 12MB.');
      return;
    }

    setError('');
    setIsProcessing(true);
    try {
      const maxW = activeTab === 'avatar' ? 320 : 960;
      const maxH = activeTab === 'avatar' ? 320 : 360;
      const optimized = await compressImage(file, maxW, maxH, 0.82);
      setPreviewData(optimized);
      setImageUrlInput('');
    } catch (err: any) {
      setError(err?.message || 'Error preparing image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setError('Please enter a valid web image URL (starting with https://)');
      return;
    }
    setError('');
    setPreviewData(trimmed);
  };

  const handleSave = async () => {
    const imageToSave = previewData || imageUrlInput.trim();
    if (!imageToSave) return;
    setIsSaving(true);
    setError('');
    try {
      if (activeTab === 'avatar') {
        await saveCustomAvatar(imageToSave, user);
      } else {
        await saveCustomCover(imageToSave, user);
      }
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setPreviewData(null);
        setImageUrlInput('');
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Failed to update photo.');
    }
  };

  const handleUseGmailPhoto = async () => {
    setIsSaving(true);
    try {
      await resetAvatarToGoogle(user);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setPreviewData(null);
        setImageUrlInput('');
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSaving(false);
      setError('Failed to switch to Gmail photo.');
    }
  };

  const handleResetCover = async () => {
    setIsSaving(true);
    try {
      await resetCustomCover(user);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setPreviewData(null);
        setImageUrlInput('');
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSaving(false);
      setError('Failed to reset banner.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#f5f2ee] rounded-3xl p-5 sm:p-6 border border-white/90 shadow-[10px_10px_30px_rgba(0,0,0,0.12),-10px_-10px_30px_rgba(255,255,255,0.9)] space-y-4 text-left animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-900">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-tight">
                {activeTab === 'avatar' ? 'Update Profile Photo' : 'Update Studio Cover'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {activeTab === 'avatar' ? 'Upload a custom portrait or use your Gmail account photo' : 'Customize your profile hero vanity banner'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] flex items-center justify-center text-stone-600 hover:text-black transition-all shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.9)] border border-white/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Profile Photo vs Cover Banner */}
        <div className="flex items-center p-1 bg-[#ede9e4] rounded-2xl shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.05),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.85)]">
          <button
            type="button"
            onClick={() => { setActiveTab('avatar'); setPreviewData(null); setImageUrlInput(''); setError(''); setIsSaved(false); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'avatar'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Profile Photo</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('cover'); setPreviewData(null); setImageUrlInput(''); setError(''); setIsSaved(false); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'cover'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Studio Cover Banner</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current / Preview Visual */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#ede9e4]/50 rounded-2xl border border-white/80 space-y-3">
          {activeTab === 'avatar' ? (
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-stone-900">
                <img 
                  src={previewData || imageUrlInput || currentAvatar} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover"
                  onError={() => {
                    if (imageUrlInput) setError('Could not load image from this URL. Please verify the link.');
                  }}
                />
              </div>
              {(previewData || imageUrlInput) && (
                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  New
                </span>
              )}
            </div>
          ) : (
            <div className="w-full h-28 rounded-2xl border-2 border-white shadow-sm overflow-hidden relative bg-stone-900">
              <img 
                src={previewData || imageUrlInput || currentCover} 
                alt="Cover Preview" 
                className="w-full h-full object-cover"
                onError={() => {
                  if (imageUrlInput) setError('Could not load banner from this URL. Please verify the link.');
                }}
              />
              {(previewData || imageUrlInput) && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  New Cover
                </span>
              )}
            </div>
          )}

          <span className="text-[11px] text-stone-500 font-medium">
            {isProcessing ? 'Optimizing image...' : (previewData || imageUrlInput) ? 'Previewing selected image' : 'Current active picture'}
          </span>
        </div>

        {/* Dropzone / Upload Action */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('photo-modal-file-input')?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-[#ff2f68] bg-[#ff2f68]/5' 
              : 'border-stone-300 hover:border-stone-400 bg-[#ede9e4]/30 hover:bg-[#ede9e4]/60'
          }`}
        >
          <input 
            id="photo-modal-file-input" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          <div className="flex flex-col items-center justify-center gap-1">
            <Upload className="w-5 h-5 text-stone-500 mb-0.5" />
            <p className="text-xs font-bold text-stone-800">
              Click to choose a photo or drag and drop
            </p>
            <p className="text-[10px] text-stone-400">Auto-compressed & saved to your profile in Firestore</p>
          </div>
        </div>

        {/* Direct Image URL Input Option */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
            <LinkIcon className="w-3 h-3 text-stone-400" />
            <span>Or paste an image link / URL</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input 
              type="url"
              placeholder="https://images.unsplash.com/... or any image URL"
              value={imageUrlInput}
              onChange={(e) => {
                setImageUrlInput(e.target.value);
                if (e.target.value.trim().startsWith('http')) {
                  setPreviewData(e.target.value.trim());
                  setError('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
              className="flex-1 py-2 px-3 text-xs bg-white rounded-xl border border-stone-200 focus:outline-none focus:border-stone-400 font-mono text-stone-800 placeholder:text-stone-400"
            />
            {imageUrlInput && (
              <button
                type="button"
                onClick={handleApplyUrl}
                className="py-2 px-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Gmail / Google Account Option (for avatar) */}
        {activeTab === 'avatar' && (
          <div className="space-y-2 pt-1 border-t border-stone-200/60">
            {googleAvailable ? (
              <button
                type="button"
                onClick={handleUseGmailPhoto}
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/80 shadow-2xs flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">
                    G
                  </div>
                  <span>Use Default Gmail / Google Account Photo</span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">Synced</span>
              </button>
            ) : (
              <div className="p-2.5 bg-stone-100/70 rounded-xl text-[11px] text-stone-500 flex items-center justify-between">
                <span>Default uses your Google / Gmail photo when signed in.</span>
                {isCustom && (
                  <button
                    type="button"
                    onClick={handleUseGmailPhoto}
                    className="text-[10px] font-bold text-stone-800 underline hover:text-black cursor-pointer"
                  >
                    Reset Photo
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reset cover banner button */}
        {activeTab === 'cover' && (
          <div className="pt-1 border-t border-stone-200/60">
            <button
              type="button"
              onClick={handleResetCover}
              disabled={isSaving}
              className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Studio Banner</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-200/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="py-2.5 px-4 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={(!previewData && !imageUrlInput.trim()) || isSaving || isProcessing}
            className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_6px_rgba(0,0,0,0.2)] disabled:opacity-40 flex items-center justify-center gap-2 ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                : 'bg-stone-900 hover:bg-black text-white'
            }`}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : isSaved ? (
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved!</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Apply Photo</span>
              </div>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
