import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Sliders, Sparkles, User, Check, Trash2, ArrowRight, Eye, ShieldAlert, CheckCircle2, MessageSquare, Vote, Send, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Heart, Share2, Mail, Save, Image, Star } from 'lucide-react';
import { PresetLook } from '../../types';
import { auth, db, collection, addDoc, handleFirestoreError, OperationType } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { seedBuiltLooksIfEmpty } from '../../lib/looksService';

interface SandboxPageProps {
  onChallengeSubmitSuccess?: () => void;
  activePreset?: PresetLook | null;
  onNavigate?: (tab: 'home' | 'sandbox' | 'gallery' | 'hall-of-fame' | 'trending' | 'built-looks' | 'votes' | 'profile') => void;
}

const PRESET_LOOKS: PresetLook[] = [
  {
    id: 'sunset_silk',
    name: 'Sunset Silk',
    description: 'A warm, romantic sunset glow with satin copper tones.',
    eyeshadowColor: '#d97706',
    eyeshadowOpacity: 0.6,
    blushColor: '#f43f5e',
    blushOpacity: 0.4,
    lipColor: '#be123c',
    lipOpacity: 0.8,
    lipGloss: true,
    lashesStyle: 'natural',
    glitterLevel: 10,
    filter: 'warm-glow'
  },
  {
    id: 'cyberpunk_violet',
    name: 'Cyberpunk Violet',
    description: 'Electric neon tones with high-contrast cybernetic filters.',
    eyeshadowColor: '#8b5cf6',
    eyeshadowOpacity: 0.7,
    blushColor: '#ec4899',
    blushOpacity: 0.5,
    lipColor: '#a21caf',
    lipOpacity: 0.9,
    lipGloss: true,
    lashesStyle: 'wispy',
    glitterLevel: 50,
    filter: 'cool-cyber'
  },
  {
    id: 'ethereal_glow',
    name: 'Ethereal Mermaid',
    description: 'Soft pastel aquamarines with delicate face glimmers.',
    eyeshadowColor: '#06b6d4',
    eyeshadowOpacity: 0.5,
    blushColor: '#fb7185',
    blushOpacity: 0.3,
    lipColor: '#f472b6',
    lipOpacity: 0.6,
    lipGloss: true,
    lashesStyle: 'glam',
    glitterLevel: 75,
    filter: 'holographic'
  },
  {
    id: 'holo_heatwave',
    name: 'Holographic Heatwave',
    description: 'The August active challenge base! Prismatic, bold, and high gloss.',
    eyeshadowColor: '#d946ef',
    eyeshadowOpacity: 0.8,
    blushColor: '#f43f5e',
    blushOpacity: 0.4,
    lipColor: '#db2777',
    lipOpacity: 0.85,
    lipGloss: true,
    lashesStyle: 'glam',
    glitterLevel: 90,
    filter: 'holographic'
  }
];

const PRESET_PALETTES = {
  eyeliner: [
    { name: 'Midnight Obsidian', color: '#000000' },
    { name: 'Espresso Cocoa', color: '#3b2314' },
    { name: 'Royal Indigo', color: '#1e3a8a' },
    { name: 'Plum Velvet', color: '#581c87' },
    { name: 'Neon Orchid', color: '#ff3f87' }
  ],
  eyeshadow: [
    { name: 'Bronze Silk', color: '#b45309' },
    { name: 'Sunset Peach', color: '#f97316' },
    { name: 'Teal Lagoon', color: '#0f766e' },
    { name: 'Amethyst Night', color: '#6d28d9' },
    { name: 'Rose Petal', color: '#db2777' },
    { name: 'Pure Gold', color: '#eab308' },
    { name: 'Mint Shimmer', color: '#10b981' }
  ],
  blush: [
    { name: 'Desert Rose', color: '#9f1239' },
    { name: 'Peachy Sheer', color: '#f43f5e' },
    { name: 'Soft Coral', color: '#fb923c' },
    { name: 'Mauve Whisper', color: '#be185d' }
  ],
  lip: [
    { name: 'Cherry Velvet', color: '#9f1239' },
    { name: 'Nude Satin', color: '#cb997e' },
    { name: 'Crimson Glow', color: '#e11d48' },
    { name: 'Lilac Frost', color: '#d946ef' },
    { name: 'Coral Sheen', color: '#f97316' },
    { name: 'Mocha Gloss', color: '#7c2d12' }
  ]
};

const FACE_MODELS = [
  { id: 'model_1', name: 'Amara (Default)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600' },
  { id: 'model_2', name: 'Elena (Cool tone)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600' },
  { id: 'model_3', name: 'Chloe (Warm glow)', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600' }
];

export default function SandboxPage({ onChallengeSubmitSuccess, activePreset, onNavigate }: SandboxPageProps) {
  const [presetLooks, setPresetLooks] = useState<PresetLook[]>(PRESET_LOOKS);

  // Listen to Auth State to get logged in username automatically
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  useEffect(() => {
    const fetchDynamicPresets = async () => {
      try {
        const fetched = await seedBuiltLooksIfEmpty();
        if (fetched && fetched.length > 0) {
          setPresetLooks(fetched);
        }
      } catch (err) {
        console.error("Failed loading presets in sandbox:", err);
      }
    };
    fetchDynamicPresets();
  }, []);

  // Try-on State
  const [useCamera, setUseCamera] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadingCamera, setLoadingCamera] = useState<boolean>(false);

  // Active custom makeup settings
  const [eyeshadowColor, setEyeshadowColor] = useState<string>('#d97706');
  const [eyeshadowOpacity, setEyeshadowOpacity] = useState<number>(0.6);

  // Eyeliner State
  const [eyelinerColor, setEyelinerColor] = useState<string>('#000000');
  const [eyelinerOpacity, setEyelinerOpacity] = useState<number>(0.0);
  const [eyelinerStyle, setEyelinerStyle] = useState<'none' | 'classic' | 'cat-eye' | 'winged'>('none');

  const [blushColor, setBlushColor] = useState<string>('#f43f5e');
  const [blushOpacity, setBlushOpacity] = useState<number>(0.4);
  const [lipColor, setLipColor] = useState<string>('#be123c');
  const [lipOpacity, setLipOpacity] = useState<number>(0.8);
  const [lipGloss, setLipGloss] = useState<boolean>(true);
  const [lashesStyle, setLashesStyle] = useState<'none' | 'natural' | 'glam' | 'wispy'>('natural');
  const [glitterLevel, setGlitterLevel] = useState<number>(20);
  const [activeFilter, setActiveFilter] = useState<'none' | 'vintage' | 'warm-glow' | 'cool-cyber' | 'holographic'>('none');

  // Shared / Additional UI States
  const [showBeforeAfter, setShowBeforeAfter] = useState<boolean>(false);
  const [showMUAModal, setShowMUAModal] = useState<boolean>(false);
  const [muaEmail, setMuaEmail] = useState<string>('');
  const [muaSentSuccess, setMuaSentSuccess] = useState<boolean>(false);
  const [copiedRecipe, setCopiedRecipe] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<{ id: string, name: string, url: string }>(FACE_MODELS[0]);
  
  const [savedLooks, setSavedLooks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('tryon_saved_looks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localLookName, setLocalLookName] = useState<string>('');
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);

  const handleSaveLookLocally = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localLookName.trim()) return;

    const newLook = {
      id: `local_${Date.now()}`,
      name: localLookName.trim(),
      eyeshadowColor,
      eyeshadowOpacity,
      eyelinerColor,
      eyelinerOpacity,
      eyelinerStyle,
      blushColor,
      blushOpacity,
      lipColor,
      lipOpacity,
      lipGloss,
      lashesStyle,
      glitterLevel,
      filter: activeFilter,
      createdAt: Date.now()
    };

    const updated = [newLook, ...savedLooks];
    setSavedLooks(updated);
    localStorage.setItem('tryon_saved_looks', JSON.stringify(updated));
    setLocalLookName('');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleLoadLocalLook = (look: any) => {
    setEyeshadowColor(look.eyeshadowColor);
    setEyeshadowOpacity(look.eyeshadowOpacity);
    setEyelinerColor(look.eyelinerColor || '#000000');
    setEyelinerOpacity(look.eyelinerOpacity !== undefined ? look.eyelinerOpacity : 0.0);
    setEyelinerStyle(look.eyelinerStyle || 'none');
    setBlushColor(look.blushColor);
    setBlushOpacity(look.blushOpacity);
    setLipColor(look.lipColor);
    setLipOpacity(look.lipOpacity);
    setLipGloss(look.lipGloss);
    setLashesStyle(look.lashesStyle);
    setGlitterLevel(look.glitterLevel);
    setActiveFilter(look.filter || 'none');
  };

  const handleDeleteLocalLook = (lookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLooks.filter(l => l.id !== lookId);
    setSavedLooks(updated);
    localStorage.setItem('tryon_saved_looks', JSON.stringify(updated));
  };

  // Overlay calibration state (user can nudge makeup position on camera)
  const [offsetY, setOffsetY] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);

  // Competition submission state
  const [username, setUsername] = useState<string>(() => localStorage.getItem('tryon_beauty_username') || localStorage.getItem('kobella_username') || '');
  const [submissionLookName, setSubmissionLookName] = useState<string>('');
  const [submissionDescription, setSubmissionDescription] = useState<string>('');
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  
  // Choice of submission target: 'challenge' or 'category'
  const [submissionType, setSubmissionType] = useState<'challenge' | 'category'>('challenge');
  const [submissionCategory, setSubmissionCategory] = useState<string>('holographic');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || '';
        if (name) {
          setUsername(name);
          localStorage.setItem('tryon_beauty_username', name);
          localStorage.setItem('kobella_username', name);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Apply preset look
  const applyPreset = (look: PresetLook) => {
    setEyeshadowColor(look.eyeshadowColor);
    setEyeshadowOpacity(look.eyeshadowOpacity);
    setEyelinerColor(look.eyelinerColor || '#000000');
    setEyelinerOpacity(look.eyelinerOpacity !== undefined ? look.eyelinerOpacity : 0.0);
    setEyelinerStyle(look.eyelinerStyle || 'none');
    setBlushColor(look.blushColor);
    setBlushOpacity(look.blushOpacity);
    setLipColor(look.lipColor);
    setLipOpacity(look.lipOpacity);
    setLipGloss(look.lipGloss);
    setLashesStyle(look.lashesStyle);
    setGlitterLevel(look.glitterLevel);
    setActiveFilter(look.filter);
  };

  useEffect(() => {
    if (activePreset) {
      applyPreset(activePreset);
    }
  }, [activePreset]);

  // Handle camera toggle
  const startCamera = async () => {
    setLoadingCamera(true);
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseCamera(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(
        "Could not access webcam. This is common in secure iframe previews or if permissions are blocked. Try preset mode!"
      );
      setUseCamera(false);
    } finally {
      setLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Submit Look to Monthly Challenge
  const handleSubmitSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !submissionLookName.trim()) return;

    setIsSubmittingChallenge(true);
    localStorage.setItem('tryon_beauty_username', username.trim());

    try {
      await addDoc(collection(db, 'submissions'), {
        username: username.trim(),
        lookName: submissionLookName.trim(),
        description: submissionDescription.trim(),
        submissionType,
        category: submissionType === 'challenge' ? 'challenge' : submissionCategory,
        makeupConfig: {
          eyeshadowColor,
          eyeshadowOpacity,
          blushColor,
          blushOpacity,
          lipColor,
          lipOpacity,
          lipGloss,
          lashesStyle,
          glitterLevel,
          selectedFilter: activeFilter
        },
        votes: 0,
        createdAt: Date.now()
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, 'submissions');
      });

      setSubmitSuccess(true);
      setSubmissionLookName('');
      setSubmissionDescription('');
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitModal(false);
        if (onChallengeSubmitSuccess) {
          onChallengeSubmitSuccess();
        }
      }, 2500);
    } catch (error) {
      console.error("Failed to submit challenge look:", error);
      if (error instanceof Error && error.message.includes('{')) {
        throw error;
      }
      alert("Submission failed. Please try again!");
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  // Build Filter CSS Styles based on activeFilter
  const getFilterStyle = () => {
    switch (activeFilter) {
      case 'vintage':
        return 'sepia(0.4) saturate(1.2) contrast(0.9) brightness(1.02)';
      case 'warm-glow':
        return 'saturate(1.3) contrast(1.05) brightness(1.05) hue-rotate(5deg)';
      case 'cool-cyber':
        return 'saturate(1.1) contrast(1.1) brightness(0.95) hue-rotate(-15deg) sepia(0.1)';
      case 'holographic':
        return 'contrast(1.15) saturate(1.4) brightness(1.05) hue-rotate(10deg)';
      default:
        return 'none';
    }
  };

  return (
    <div id="sandbox-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-stone-800">
      
      {/* LEFT: Makeup formula preview */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#bc8381]/25 shadow-md flex flex-col justify-between">
        
        {/* Device Stage and Capture */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#732729] animate-pulse"></span>
              <h3 className="text-sm font-black tracking-wide uppercase text-[#732729] font-serif">Live Try-On Canvas</h3>
            </div>
            
            <div className="flex gap-2">
              {/* Before/After Toggle */}
              <button
                type="button"
                onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                  showBeforeAfter 
                    ? 'bg-[#732729] border-[#732729] text-white' 
                    : 'bg-[#faf6f5] hover:bg-white border-[#bc8381]/35 text-stone-600'
                }`}
              >
                <Eye className="w-3 h-3" /> {showBeforeAfter ? 'Hide Split' : 'Compare Before/After'}
              </button>

              {/* Camera Activation Toggle */}
              <button
                type="button"
                onClick={useCamera ? stopCamera : startCamera}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                  useCamera 
                    ? 'bg-rose-600 border-rose-600 text-white' 
                    : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                }`}
                disabled={loadingCamera}
              >
                <Camera className="w-3 h-3" />
                {loadingCamera ? 'Initializing...' : useCamera ? 'Turn Camera Off' : 'Use Live Camera'}
              </button>
            </div>
          </div>

          {cameraError && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Webcam Notice:</span> {cameraError}
              </div>
            </div>
          )}

          {/* Interactive Try-on Viewports */}
          {showBeforeAfter ? (
            /* BEFORE & AFTER SPLIT SCREEN */
            <div className="grid grid-cols-2 gap-3 aspect-[4/3] w-full bg-stone-950 rounded-2xl overflow-hidden relative border border-[#bc8381]/30">
              
              {/* LEFT: BEFORE PANEL */}
              <div className="relative w-full h-full overflow-hidden bg-stone-900">
                {useCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={selectedModel.url}
                    alt={selectedModel.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-3 left-3 bg-stone-900/90 text-white border border-stone-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                  Before (Original)
                </div>
              </div>

              {/* RIGHT: AFTER PANEL */}
              <div className="relative w-full h-full overflow-hidden bg-stone-900">
                {useCamera ? (
                  <video
                    autoPlay
                    playsInline
                    muted
                    style={{ filter: getFilterStyle() }}
                    className="w-full h-full object-cover"
                    // Connect stream clone
                    ref={(el) => {
                      if (el && cameraStream) {
                        el.srcObject = cameraStream;
                      }
                    }}
                  />
                ) : (
                  <img
                    src={selectedModel.url}
                    alt={selectedModel.name}
                    style={{ filter: getFilterStyle() }}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-black/10" />
                
                {/* Makeup SVG overlays on the AFTER panel */}
                <svg
                  viewBox="0 0 400 300"
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                    transformOrigin: 'center center'
                  }}
                >
                  <defs>
                    <filter id="blushBlur">
                      <feGaussianBlur stdDeviation="16" />
                    </filter>
                    <filter id="shadowBlur">
                      <feGaussianBlur stdDeviation="8" />
                    </filter>
                  </defs>

                  {/* Eyeshadow */}
                  {eyeshadowOpacity > 0 && (
                    <g style={{ opacity: eyeshadowOpacity }}>
                      <path d="M 125 110 Q 150 78 175 110" fill="none" stroke={eyeshadowColor} strokeWidth="14" strokeLinecap="round" filter="url(#shadowBlur)" />
                      <path d="M 225 110 Q 250 78 275 110" fill="none" stroke={eyeshadowColor} strokeWidth="14" strokeLinecap="round" filter="url(#shadowBlur)" />
                    </g>
                  )}

                  {/* Eyeliner */}
                  {eyelinerStyle !== 'none' && eyelinerOpacity > 0 && (
                    <g style={{ opacity: eyelinerOpacity }}>
                      <path
                        d={
                          eyelinerStyle === 'classic'
                            ? "M 130 110 Q 150 102 170 110"
                            : eyelinerStyle === 'cat-eye'
                            ? "M 130 110 Q 150 102 170 110 Q 174 104 176 100"
                            : "M 130 110 Q 150 102 170 110 Q 178 98 175 92"
                        }
                        fill="none" stroke={eyelinerColor} strokeWidth="2.5" strokeLinecap="round"
                      />
                      <path
                        d={
                          eyelinerStyle === 'classic'
                            ? "M 230 110 Q 250 102 270 110"
                            : eyelinerStyle === 'cat-eye'
                            ? "M 230 110 Q 250 102 270 110 Q 274 104 276 100"
                            : "M 230 110 Q 250 102 270 110 Q 278 98 275 92"
                        }
                        fill="none" stroke={eyelinerColor} strokeWidth="2.5" strokeLinecap="round"
                      />
                    </g>
                  )}

                  {/* Lashes */}
                  {lashesStyle !== 'none' && (
                    <g style={{ opacity: 0.85 }}>
                      <path
                        d={
                          lashesStyle === 'natural'
                            ? "M 130 110 Q 140 102 150 104 Q 160 102 170 110"
                            : lashesStyle === 'glam'
                            ? "M 128 110 C 138 92 148 94 150 94 C 158 92 168 94 172 110 M 135 106 Q 132 94 130 96 M 145 102 Q 148 88 150 90 M 165 106 Q 168 94 170 96"
                            : "M 130 110 Q 138 98 142 102 Q 150 95 156 102 Q 164 98 170 110"
                        }
                        fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round"
                      />
                      <path
                        d={
                          lashesStyle === 'natural'
                            ? "M 230 110 Q 240 102 250 104 Q 260 102 270 110"
                            : lashesStyle === 'glam'
                            ? "M 228 110 C 238 92 248 94 250 94 C 258 92 268 94 272 110 M 235 106 Q 232 94 230 96 M 245 102 Q 248 88 250 90 M 265 106 Q 268 94 270 96"
                            : "M 230 110 Q 238 98 242 102 Q 250 95 256 102 Q 264 98 270 110"
                        }
                        fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round"
                      />
                    </g>
                  )}

                  {/* Blush */}
                  {blushOpacity > 0 && (
                    <g style={{ opacity: blushOpacity }} filter="url(#blushBlur)">
                      <circle cx="140" cy="160" r="28" fill={blushColor} />
                      <circle cx="260" cy="160" r="28" fill={blushColor} />
                    </g>
                  )}

                  {/* Lips */}
                  {lipOpacity > 0 && (
                    <g style={{ opacity: lipOpacity }}>
                      <path
                        d="M 175 205 Q 188 193 200 197 Q 212 193 225 205 Q 212 212 200 210 Q 188 212 175 205 Z M 175 205 Q 200 221 225 205 Q 200 213 175 205 Z"
                        fill={lipColor}
                      />
                      {lipGloss && (
                        <path d="M 185 207 Q 200 211 215 207" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.65 }} />
                      )}
                    </g>
                  )}

                  {/* Glitter Glimmer */}
                  {glitterLevel > 0 && (
                    <g style={{ opacity: glitterLevel / 100 }}>
                      <path d="M 130 135 L 132 138 L 135 138 L 133 140 L 134 143 L 131 141 L 128 143 L 129 140 L 127 138 L 130 138 Z" fill="#ffffff" />
                      <path d="M 270 135 L 272 138 L 275 138 L 273 140 L 274 143 L 271 141 L 268 143 L 269 140 L 267 138 L 270 138 Z" fill="#ffffff" />
                      <path d="M 155 170 L 157 172 L 160 172 L 158 174 L 159 177 L 156 175 L 153 177 L 154 174 L 152 172 L 155 172 Z" fill="#fff9db" />
                      <path d="M 245 170 L 247 172 L 250 172 L 248 174 L 249 177 L 246 175 L 243 177 L 244 174 L 242 172 L 245 172 Z" fill="#fff9db" />
                    </g>
                  )}
                </svg>

                <div className="absolute top-3 right-3 bg-[#732729] text-white border border-[#bc8381]/40 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                  After (Formulated)
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD FULL CANVAS */
            <div className="relative w-full aspect-[4/3] bg-stone-950 rounded-2xl overflow-hidden border border-[#bc8381]/30 flex flex-col items-center justify-center shadow-md">
              
              {/* Image or Video Feed */}
              {useCamera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: getFilterStyle() }}
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <img
                  src={selectedModel.url}
                  alt={selectedModel.name}
                  style={{ filter: getFilterStyle() }}
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              )}
              
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />

              {/* Real-time Makeup SVG Overlay */}
              <svg
                viewBox="0 0 400 300"
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
                style={{
                  transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              >
                <defs>
                  <filter id="blushBlur">
                    <feGaussianBlur stdDeviation="16" />
                  </filter>
                  <filter id="shadowBlur">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                </defs>

                {/* Eyeshadow */}
                {eyeshadowOpacity > 0 && (
                  <g style={{ opacity: eyeshadowOpacity }}>
                    <path d="M 125 110 Q 150 78 175 110" fill="none" stroke={eyeshadowColor} strokeWidth="14" strokeLinecap="round" filter="url(#shadowBlur)" />
                    <path d="M 225 110 Q 250 78 275 110" fill="none" stroke={eyeshadowColor} strokeWidth="14" strokeLinecap="round" filter="url(#shadowBlur)" />
                  </g>
                )}

                {/* Eyeliner */}
                {eyelinerStyle !== 'none' && eyelinerOpacity > 0 && (
                  <g style={{ opacity: eyelinerOpacity }}>
                    <path
                      d={
                        eyelinerStyle === 'classic'
                          ? "M 130 110 Q 150 102 170 110"
                          : eyelinerStyle === 'cat-eye'
                          ? "M 130 110 Q 150 102 170 110 Q 174 104 176 100"
                          : "M 130 110 Q 150 102 170 110 Q 178 98 175 92"
                      }
                      fill="none" stroke={eyelinerColor} strokeWidth="2.5" strokeLinecap="round"
                    />
                    <path
                      d={
                        eyelinerStyle === 'classic'
                          ? "M 230 110 Q 250 102 270 110"
                          : eyelinerStyle === 'cat-eye'
                          ? "M 230 110 Q 250 102 270 110 Q 274 104 276 100"
                          : "M 230 110 Q 250 102 270 110 Q 278 98 275 92"
                      }
                      fill="none" stroke={eyelinerColor} strokeWidth="2.5" strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Lashes */}
                {lashesStyle !== 'none' && (
                  <g style={{ opacity: 0.85 }}>
                    <path
                      d={
                        lashesStyle === 'natural'
                          ? "M 130 110 Q 140 102 150 104 Q 160 102 170 110"
                          : lashesStyle === 'glam'
                          ? "M 128 110 C 138 92 148 94 150 94 C 158 92 168 94 172 110 M 135 106 Q 132 94 130 96 M 145 102 Q 148 88 150 90 M 165 106 Q 168 94 170 96"
                          : "M 130 110 Q 138 98 142 102 Q 150 95 156 102 Q 164 98 170 110"
                      }
                      fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round"
                    />
                    <path
                      d={
                        lashesStyle === 'natural'
                          ? "M 230 110 Q 240 102 250 104 Q 260 102 270 110"
                          : lashesStyle === 'glam'
                          ? "M 228 110 C 238 92 248 94 250 94 C 258 92 268 94 272 110 M 235 106 Q 232 94 230 96 M 245 102 Q 248 88 250 90 M 265 106 Q 268 94 270 96"
                          : "M 230 110 Q 238 98 242 102 Q 250 95 256 102 Q 264 98 270 110"
                      }
                      fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Blush */}
                {blushOpacity > 0 && (
                  <g style={{ opacity: blushOpacity }} filter="url(#blushBlur)">
                    <circle cx="140" cy="160" r="28" fill={blushColor} />
                    <circle cx="260" cy="160" r="28" fill={blushColor} />
                  </g>
                )}

                {/* Lips */}
                {lipOpacity > 0 && (
                  <g style={{ opacity: lipOpacity }}>
                    <path
                      d="M 175 205 Q 188 193 200 197 Q 212 193 225 205 Q 212 212 200 210 Q 188 212 175 205 Z M 175 205 Q 200 221 225 205 Q 200 213 175 205 Z"
                      fill={lipColor}
                    />
                    {lipGloss && (
                      <path d="M 185 207 Q 200 211 215 207" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.65 }} />
                    )}
                  </g>
                )}

                {/* Glitter Glimmer */}
                {glitterLevel > 0 && (
                  <g style={{ opacity: glitterLevel / 100 }}>
                    <path d="M 130 135 L 132 138 L 135 138 L 133 140 L 134 143 L 131 141 L 128 143 L 129 140 L 127 138 L 130 138 Z" fill="#ffffff" />
                    <path d="M 270 135 L 272 138 L 275 138 L 273 140 L 274 143 L 271 141 L 268 143 L 269 140 L 267 138 L 270 138 Z" fill="#ffffff" />
                    <path d="M 155 170 L 157 172 L 160 172 L 158 174 L 159 177 L 156 175 L 153 177 L 154 174 L 152 172 L 155 172 Z" fill="#fff9db" />
                    <path d="M 245 170 L 247 172 L 250 172 L 248 174 L 249 177 L 246 175 L 243 177 L 244 174 L 242 172 L 245 172 Z" fill="#fff9db" />
                  </g>
                )}
              </svg>

              {/* Nudge Calibration Control Bar overlay */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 bg-stone-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-white z-30 shadow-md">
                <button type="button" onClick={() => setOffsetY(y => y - 3)} className="p-1 hover:text-[#bc8381] transition-colors cursor-pointer" title="Nudge Up"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setOffsetY(y => y + 3)} className="p-1 hover:text-[#bc8381] transition-colors cursor-pointer" title="Nudge Down"><ChevronDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setOffsetX(x => x - 3)} className="p-1 hover:text-[#bc8381] transition-colors cursor-pointer" title="Nudge Left"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setOffsetX(x => x + 3)} className="p-1 hover:text-[#bc8381] transition-colors cursor-pointer" title="Nudge Right"><ChevronRight className="w-3.5 h-3.5" /></button>
                <div className="w-px h-3 bg-stone-700 mx-1" />
                <button type="button" onClick={() => setScale(s => Math.min(1.4, s + 0.04))} className="p-1 hover:text-[#bc8381] transition-colors cursor-pointer" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setScale(s => Math.max(0.7, s - 0.04))} className="p-1 hover:text-[#bc8381] transition-colors cursor-pointer" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => { setOffsetX(0); setOffsetY(0); setScale(1.0); }} className="text-[9px] font-black uppercase text-stone-300 hover:text-white ml-1.5 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-all cursor-pointer">Reset</button>
              </div>
            </div>
          )}

          {/* Model portrait selector (only if camera is not active) */}
          {!useCamera && (
            <div className="mt-4 bg-[#faf6f5] p-3 rounded-xl border border-[#bc8381]/20">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-2 text-left">
                Select Model Portrait Face
              </span>
              <div className="flex gap-2.5">
                {FACE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      selectedModel.id === model.id
                        ? 'bg-[#732729] border-[#732729] text-white shadow-xs'
                        : 'bg-white border-[#bc8381]/30 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-stone-200">
                      <img src={model.url} alt={model.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Color Chips represent currently formulated shader colors */}
          <div className="flex gap-2.5 mt-4 items-center justify-between bg-[#FAF6F5] border border-[#bc8381]/25 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">Color Swatch:</span>
              <div style={{ backgroundColor: eyeshadowColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200" title="Eyeshadow color" />
              <div style={{ backgroundColor: eyelinerColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1" title="Eyeliner color" />
              <div style={{ backgroundColor: blushColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1" title="Blush color" />
              <div style={{ backgroundColor: lipColor }} className="w-3.5 h-3.5 rounded-full border border-stone-200 -ml-1" title="Lip color" />
            </div>
            <div className="text-[10px] text-[#732729] font-black tracking-wide uppercase">
              Shaders formulated
            </div>
          </div>
        </div>

        {/* Dynamic Preset Looks Selection Bar */}
        <div className="mt-6 pt-5 border-t border-[#bc8381]/25">
          <h4 className="text-xs font-bold text-[#732729] uppercase tracking-wider mb-3 font-serif">Official Studio Presets</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {presetLooks.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="group flex flex-col justify-between text-left p-3 rounded-xl border border-[#bc8381]/25 bg-[#faf6f5] hover:border-[#732729]/50 hover:bg-white transition-all cursor-pointer shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div 
                      style={{ backgroundColor: preset.eyeshadowColor }} 
                      className="w-2.5 h-2.5 rounded-full border border-white/10 shrink-0"
                    />
                    <div 
                      style={{ backgroundColor: preset.lipColor }} 
                      className="w-2.5 h-2.5 rounded-full border border-white/10 shrink-0 -ml-1.5"
                    />
                    <span className="text-xs font-bold text-stone-800 line-clamp-1">{preset.name}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">{preset.description}</p>
                </div>
                <div className="mt-2 text-[9px] font-bold text-[#732729] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Load Specs <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#bc8381]/25">
          <h4 className="text-xs font-bold text-[#732729] uppercase tracking-wider mb-3 font-serif">Look Lab Actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => onNavigate?.('trending')}
              className="group text-left p-3 rounded-xl border border-[#bc8381]/25 bg-[#faf6f5] hover:bg-white hover:border-[#732729]/45 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[#732729] font-black text-xs">
                <MessageSquare className="w-4 h-4" /> Request a Look
              </div>
              <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">Ask the community for a formula to build next.</p>
            </button>
            <button
              onClick={() => onNavigate?.('votes')}
              className="group text-left p-3 rounded-xl border border-[#bc8381]/25 bg-[#faf6f5] hover:bg-white hover:border-[#732729]/45 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[#732729] font-black text-xs">
                <Vote className="w-4 h-4" /> Vote Next Look
              </div>
              <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">Vote for winning looks and requested filters.</p>
            </button>
            <button
              onClick={() => {
                setMuaSentSuccess(false);
                setShowMUAModal(true);
              }}
              className="group text-left p-3 rounded-xl border border-[#bc8381]/25 bg-[#faf6f5] hover:bg-white hover:border-[#732729]/45 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[#732729] font-black text-xs">
                <Send className="w-4 h-4" /> Send to My MUA
              </div>
              <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">Package this formula as a shareable brief.</p>
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT: High-Precision Makeup Controls Panel (Cols: 5) */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#bc8381]/25 shadow-md flex flex-col justify-between min-h-[500px]">
        <div>
          <div className="flex items-center justify-between border-b border-[#bc8381]/25 pb-4 mb-5">
            <h3 className="text-lg font-serif font-bold text-[#732729] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#732729]" /> Adjust Formula
            </h3>
            <button
              onClick={() => {
                applyPreset({
                  id: 'reset', name: 'Reset', description: '',
                  eyeshadowColor: '#d97706', eyeshadowOpacity: 0.1,
                  blushColor: '#f43f5e', blushOpacity: 0.1,
                  lipColor: '#be123c', lipOpacity: 0.1,
                  lipGloss: false, lashesStyle: 'none',
                  glitterLevel: 0, filter: 'none'
                });
              }}
              className="text-xs text-stone-400 hover:text-[#732729] flex items-center gap-1 transition-colors font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          <div className="space-y-5">
            {/* 1. EYESHADOW CONTROLS */}
            <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">1. Eyeshadow Shadow</span>
                <span className="text-xs font-semibold text-stone-500">{Math.round(eyeshadowOpacity * 100)}% intensity</span>
              </div>
              
              {/* Preset Palette */}
              <div className="flex gap-1.5 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-[#bc8381]/20">
                {PRESET_PALETTES.eyeshadow.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setEyeshadowColor(item.color)}
                    style={{ backgroundColor: item.color }}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                      eyeshadowColor === item.color ? 'border-stone-800 shadow-md scale-105' : 'border-transparent'
                    }`}
                    title={item.name}
                  />
                ))}
                {/* Custom Picker */}
                <input 
                  type="color" 
                  value={eyeshadowColor} 
                  onChange={(e) => setEyeshadowColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-[#bc8381]/30 overflow-hidden cursor-pointer bg-transparent"
                />
              </div>

              {/* Intensity Slider */}
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={eyeshadowOpacity}
                onChange={(e) => setEyeshadowOpacity(Number(e.target.value))}
                className="w-full h-1 bg-[#bc8381]/25 rounded-lg appearance-none cursor-pointer accent-[#732729] mt-2"
              />
            </div>

            {/* 2. EYELINER CONTROLS */}
            <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">2. Precision Eyeliner</span>
                <span className="text-xs font-semibold text-stone-500">{Math.round(eyelinerOpacity * 100)}% opacity</span>
              </div>

              {/* Styles */}
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {(['none', 'classic', 'cat-eye', 'winged'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setEyelinerStyle(style);
                      if (style !== 'none' && eyelinerOpacity === 0) {
                        setEyelinerOpacity(0.8);
                      }
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase border text-center cursor-pointer transition-all ${
                      eyelinerStyle === style 
                        ? 'bg-[#732729] border-[#732729] text-white' 
                        : 'bg-white border-[#bc8381]/30 text-stone-600 hover:bg-[#faf6f5] hover:text-stone-900'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              {/* Preset Palette */}
              <div className="flex gap-1.5 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-[#bc8381]/20">
                {PRESET_PALETTES.eyeliner.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setEyelinerColor(item.color)}
                    style={{ backgroundColor: item.color }}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                      eyelinerColor === item.color ? 'border-stone-800 shadow-md scale-105' : 'border-transparent'
                    }`}
                    title={item.name}
                  />
                ))}
                <input 
                  type="color" 
                  value={eyelinerColor} 
                  onChange={(e) => setEyelinerColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-[#bc8381]/30 overflow-hidden cursor-pointer bg-transparent"
                />
              </div>

              {/* Intensity Slider */}
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={eyelinerOpacity}
                onChange={(e) => setEyelinerOpacity(Number(e.target.value))}
                className="w-full h-1 bg-[#bc8381]/25 rounded-lg appearance-none cursor-pointer accent-[#732729] mt-2"
              />
            </div>

            {/* 3. LIPSTICK CONTROLS */}
            <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">3. Lip Tint</span>
                <span className="text-xs font-semibold text-stone-500">{Math.round(lipOpacity * 100)}% opacity</span>
              </div>

              {/* Preset Palette */}
              <div className="flex gap-1.5 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-[#bc8381]/20">
                {PRESET_PALETTES.lip.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setLipColor(item.color)}
                    style={{ backgroundColor: item.color }}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                      lipColor === item.color ? 'border-stone-800 shadow-md scale-105' : 'border-transparent'
                    }`}
                    title={item.name}
                  />
                ))}
                <input 
                  type="color" 
                  value={lipColor} 
                  onChange={(e) => setLipColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-[#bc8381]/30 overflow-hidden cursor-pointer bg-transparent"
                />
              </div>

              {/* Intensity Slider */}
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={lipOpacity}
                onChange={(e) => setLipOpacity(Number(e.target.value))}
                className="w-full h-1 bg-[#bc8381]/25 rounded-lg appearance-none cursor-pointer accent-[#732729] mt-2"
              />

              {/* Lip texture checkboxes */}
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#bc8381]/15">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lipGloss}
                    onChange={(e) => setLipGloss(e.target.checked)}
                    className="rounded border-[#bc8381]/30 bg-white text-[#732729] focus:ring-[#732729]/50 w-4 h-4"
                  />
                  Holographic Lip Gloss
                </label>
              </div>
            </div>

            {/* 4. BLUSH CONTROLS */}
            <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">4. Cheek Blush</span>
                <span className="text-xs font-semibold text-stone-500">{Math.round(blushOpacity * 100)}% intensity</span>
              </div>

              {/* Preset Palette */}
              <div className="flex gap-1.5 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-[#bc8381]/20">
                {PRESET_PALETTES.blush.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setBlushColor(item.color)}
                    style={{ backgroundColor: item.color }}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                      blushColor === item.color ? 'border-stone-800 shadow-md scale-105' : 'border-transparent'
                    }`}
                    title={item.name}
                  />
                ))}
                <input 
                  type="color" 
                  value={blushColor} 
                  onChange={(e) => setBlushColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-[#bc8381]/30 overflow-hidden cursor-pointer bg-transparent"
                />
              </div>

              {/* Intensity Slider */}
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={blushOpacity}
                onChange={(e) => setBlushOpacity(Number(e.target.value))}
                className="w-full h-1 bg-[#bc8381]/25 rounded-lg appearance-none cursor-pointer accent-[#732729] mt-2"
              />
            </div>

            {/* 4. DETAILS (Lashes, Glitter, Filter) */}
            <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20 grid grid-cols-1 gap-4">
              {/* Lashes Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">5. Lash Extension</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['none', 'natural', 'glam', 'wispy'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setLashesStyle(style)}
                      className={`py-1.5 px-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border text-center cursor-pointer transition-all ${
                        lashesStyle === style 
                          ? 'bg-[#732729] border-[#732729] text-white font-black shadow-sm' 
                          : 'bg-white border-[#bc8381]/30 text-stone-600 hover:bg-[#faf6f5] hover:text-stone-900'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glitter and render filters */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#bc8381]/15 pt-3">
                {/* Glitter */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#732729]" /> 6. Glitter Glimmer
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={glitterLevel}
                    onChange={(e) => setGlitterLevel(Number(e.target.value))}
                    className="w-full h-1 bg-[#bc8381]/25 rounded-lg appearance-none cursor-pointer accent-[#732729] mt-2"
                  />
                  <div className="text-[10px] text-stone-500 mt-1 font-semibold">{glitterLevel}% sparkle density</div>
                </div>

                {/* Filters */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">7. Render Filter</label>
                  <select
                    value={activeFilter}
                    onChange={(e: any) => setActiveFilter(e.target.value)}
                    className="w-full text-xs bg-white border border-[#bc8381]/30 rounded-lg px-2.5 py-1.5 font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#732729]/50"
                  >
                    <option value="none">No Filter</option>
                    <option value="vintage">Vintage Glam</option>
                    <option value="warm-glow">Golden Hour</option>
                    <option value="cool-cyber">Cyberpunk Matrix</option>
                    <option value="holographic">Prismatic Aura</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 8. SAVE FORMULATION PRESET */}
            <form onSubmit={handleSaveLookLocally} className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/25 text-left space-y-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wide block">8. Save Formulation Preset</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name your custom look..."
                  value={localLookName}
                  onChange={(e) => setLocalLookName(e.target.value)}
                  className="bg-white border border-[#bc8381]/30 rounded-lg px-2.5 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold"
                />
                <button
                  type="submit"
                  className="bg-[#732729] hover:bg-[#732729]/90 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
              {showSaveSuccess && (
                <div className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Formulation saved to your client library!
                </div>
              )}
            </form>

            {/* 9. LOCAL SAVED LOOKS COLLECTION */}
            {savedLooks.length > 0 && (
              <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20 text-left">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-2.5">9. Your Saved Formulations ({savedLooks.length})</span>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {savedLooks.map((look) => (
                    <div
                      key={look.id}
                      onClick={() => handleLoadLocalLook(look)}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#bc8381]/15 hover:border-[#732729]/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <div style={{ backgroundColor: look.eyeshadowColor }} className="w-2.5 h-2.5 rounded-full border border-stone-100" />
                          <div style={{ backgroundColor: look.lipColor }} className="w-2.5 h-2.5 rounded-full border border-stone-100 -ml-1" />
                        </div>
                        <span className="text-xs font-bold text-stone-800">{look.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteLocalLook(look.id, e)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete look"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Submit to Monthly Competition Action Block */}
        <div className="mt-6 pt-5 border-t border-[#bc8381]/20">
          <div className="flex flex-col gap-2">
            <button
              id="open-challenge-submit-modal"
              onClick={() => setShowSubmitModal(true)}
              className="w-full bg-[#732729] hover:bg-[#5c1d1f] text-white text-xs font-bold tracking-wider uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" /> Enter Monthly Challenge
            </button>
            <p className="text-[10px] text-stone-400 text-center font-semibold">
              Active challenge: <span className="font-bold text-[#732729]">August Holographic Heatwave</span>. Submit this custom look configuration to the community challenge board!
            </p>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#bc8381]/35 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#bc8381]/10 to-[#732729]/5 p-6 border-b border-[#bc8381]/25 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#bc8381]/15 border border-[#bc8381]/25 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#732729]" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-[#732729] text-sm">Enter "Mix & Match"</h4>
                <p className="text-[10px] text-stone-500 font-bold tracking-wide uppercase">Monthly Design Challenge / Category Submit</p>
              </div>
            </div>

            {!firebaseUser ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h5 className="font-serif font-black text-stone-800 text-sm">Authentication Required</h5>
                <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                  Only signed-up members with a verified Studio Profile can submit cosmetic filter looks to active challenges and categories.
                </p>
                <div className="bg-[#faf6f5] rounded-xl p-3 border border-[#bc8381]/25 text-[11px] text-stone-500 text-left font-semibold">
                  🌿 <span className="text-[#732729] font-black">All sign-ups start as Studio Residents</span>, unlocking access to community challenges, live upvotes, design portfolios, and notifications.
                </div>
                <div className="flex gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px] py-3 rounded-lg cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmitModal(false);
                      if (onNavigate) {
                        onNavigate('profile');
                      }
                    }}
                    className="flex-1 bg-[#732729] hover:bg-[#5c1d1f] text-white font-bold uppercase tracking-wider text-[10px] py-3 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-lg transition-all"
                  >
                    Go to Sign Up
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitSubmission} className="p-6 space-y-4">
                {submitSuccess ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h5 className="font-serif font-bold text-stone-800">Look Submitted successfully!</h5>
                    <p className="text-xs text-stone-500">Your gorgeous creations are live in the community gallery.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5">Your Designer Username</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-stone-400 text-xs font-bold">@</span>
                        <input
                          type="text"
                          disabled
                          value={username}
                          className="w-full text-xs pl-7 pr-24 py-2.5 border border-emerald-200 bg-emerald-50/50 rounded-lg focus:outline-none font-bold text-emerald-800 cursor-not-allowed"
                        />
                        <span className="absolute right-3.5 top-2.5 text-[9px] bg-emerald-600 text-white font-black uppercase px-2 py-0.5 rounded tracking-widest">
                          ✓ Verified
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5">Where to Submit Your Look?</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSubmissionType('challenge')}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            submissionType === 'challenge'
                              ? 'bg-[#732729] text-white border-[#732729] shadow-sm'
                              : 'bg-white text-stone-600 border-[#bc8381]/35 hover:bg-[#faf6f5]'
                          }`}
                        >
                          🏆 Monthly Challenge
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmissionType('category')}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            submissionType === 'category'
                              ? 'bg-[#732729] text-white border-[#732729] shadow-sm'
                              : 'bg-white text-stone-600 border-[#bc8381]/35 hover:bg-[#faf6f5]'
                          }`}
                        >
                          🎨 Look Category
                        </button>
                      </div>
                    </div>

                    {submissionType === 'category' && (
                      <div className="animate-in slide-in-from-top-1 duration-200">
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5">Select Look Category</label>
                        <select
                          value={submissionCategory}
                          onChange={(e) => setSubmissionCategory(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 border border-[#bc8381]/30 bg-[#faf6f5] rounded-lg font-bold text-stone-800 focus:outline-none"
                        >
                          <option value="holographic">Holographic Glow</option>
                          <option value="cool-cyber">Cool Cyber Matrix</option>
                          <option value="warm-glow">Warm Sunset Glow</option>
                          <option value="vintage">Vintage Classic</option>
                          <option value="standard">Classy & Natural</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5">Name Your Masterpiece Look</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Prism Heatwave Glow"
                        value={submissionLookName}
                        onChange={(e) => setSubmissionLookName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-[#bc8381]/30 bg-[#faf6f5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5">Inspiration or Details</label>
                      <textarea
                        placeholder="Tell the community how you combined colors and formulas!"
                        value={submissionDescription}
                        onChange={(e) => setSubmissionDescription(e.target.value)}
                        rows={3}
                        className="w-full text-xs px-3.5 py-2.5 border border-[#bc8381]/30 bg-[#faf6f5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold text-stone-800"
                      />
                    </div>

                    {/* Summary of Makeup Config to be saved */}
                    <div className="bg-[#faf6f5] rounded-xl p-3 border border-[#bc8381]/25 grid grid-cols-2 gap-2 text-[10px] text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eyeshadowColor }} />
                        <span>Eyeshadow: {eyeshadowColor}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lipColor }} />
                        <span>Lip: {lipColor} ({lipGloss ? 'Glossy' : 'Matte'})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: blushColor }} />
                        <span>Blush: {blushColor}</span>
                      </div>
                      <div>Lashes: <span className="font-bold uppercase text-[9px] text-[#732729]">{lashesStyle}</span></div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-[#bc8381]/25">
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(false)}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px] py-3 rounded-lg cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingChallenge}
                        className="flex-1 bg-[#732729] hover:bg-[#5c1d1f] text-white font-bold uppercase tracking-wider text-[10px] py-3 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition-all"
                      >
                        {isSubmittingChallenge ? 'Saving...' : 'Submit Entry'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Send to MUA (Makeup Artist) Modal */}
      {showMUAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#bc8381]/35 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#bc8381]/10 to-[#732729]/5 p-6 border-b border-[#bc8381]/25 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#bc8381]/15 border border-[#bc8381]/25 flex items-center justify-center text-[#732729]">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-[#732729] text-sm">Send Formula to MUA</h4>
                <p className="text-[10px] text-stone-500 font-bold tracking-wide uppercase">Transmit Technical Parameters to Your Artist</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {muaSentSuccess ? (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h5 className="font-serif font-black text-stone-800 text-sm">Formula Dispatched!</h5>
                  <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                    The exact formulation specifications have been delivered to <span className="text-[#732729] font-bold">{muaEmail}</span>. Your artist can now replicate this exact look in-studio!
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMUAModal(false)}
                    className="mt-3 bg-[#732729] hover:bg-[#5c1d1f] text-white text-xs font-extrabold tracking-wider uppercase px-6 py-2 rounded-lg cursor-pointer transition-all shadow-md"
                  >
                    Close Mailer
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                    This exports your customized design specs (colors, intensities, styles) so your Makeup Artist can see the precise shaders and product references.
                  </p>

                  {/* Formula Spec Breakdown */}
                  <div className="bg-[#faf6f5] rounded-xl p-3.5 border border-[#bc8381]/20 space-y-2 text-[11px] text-stone-600">
                    <div className="flex items-center justify-between font-bold text-stone-800 border-b border-[#bc8381]/15 pb-1">
                      <span>Cosmetic Component</span>
                      <span>Formula Setting</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-stone-200" style={{ backgroundColor: eyeshadowColor }} /> Eyeshadow</span>
                      <span className="font-bold">{eyeshadowColor} ({Math.round(eyeshadowOpacity * 100)}% opac.)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-stone-200" style={{ backgroundColor: eyelinerColor }} /> Precision Eyeliner</span>
                      <span className="font-bold uppercase">{eyelinerStyle} ({eyelinerColor})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-stone-200" style={{ backgroundColor: lipColor }} /> Lipstick Tint</span>
                      <span className="font-bold">{lipColor} ({Math.round(lipOpacity * 100)}%, {lipGloss ? 'Glossy' : 'Matte'})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-stone-200" style={{ backgroundColor: blushColor }} /> Cheek Blush</span>
                      <span className="font-bold">{blushColor} ({Math.round(blushOpacity * 100)}% intensity)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lash Extension style</span>
                      <span className="font-bold uppercase">{lashesStyle}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Glitter Glimmer level</span>
                      <span className="font-bold">{glitterLevel}% sparkle</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Camera filter</span>
                      <span className="font-bold uppercase">{activeFilter}</span>
                    </div>
                  </div>

                  {/* Action row to copy formula text */}
                  <div className="flex justify-between items-center bg-stone-50 border border-stone-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-stone-500 font-bold">Need a quick text copy?</span>
                    <button
                      type="button"
                      onClick={() => {
                        const recipeText = `GLEAME MAKEUP FORMULA SPECIFICATION
====================================
Eyeshadow Color: ${eyeshadowColor} (${Math.round(eyeshadowOpacity * 100)}% Opacity)
Eyeliner Style: ${eyelinerStyle} (Color: ${eyelinerColor}, ${Math.round(eyelinerOpacity * 100)}% Opacity)
Lip Tint Color: ${lipColor} (Opacity: ${Math.round(lipOpacity * 100)}%, Texture: ${lipGloss ? 'Holographic Lip Gloss' : 'Matte'})
Cheek Blush: ${blushColor} (Intensity: ${Math.round(blushOpacity * 100)}%)
Lash Extension: ${lashesStyle}
Glitter Level: ${glitterLevel}% Sparkle Density
Active Rendering Filter: ${activeFilter}
------------------------------------
Rendered via Gleame: Makeup Try-On App`;
                        navigator.clipboard.writeText(recipeText);
                        setCopiedRecipe(true);
                        setTimeout(() => setCopiedRecipe(false), 2000);
                      }}
                      className="bg-white hover:bg-stone-50 border border-stone-300 px-2.5 py-1 rounded text-[10px] text-stone-700 font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedRecipe ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 text-stone-500" /> Copy Recipe Code
                        </>
                      )}
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (muaEmail.trim()) {
                        setMuaSentSuccess(true);
                      }
                    }}
                    className="space-y-3 pt-2"
                  >
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5">MUA Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="artist@salon.com"
                        value={muaEmail}
                        onChange={(e) => setMuaEmail(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-[#bc8381]/30 bg-[#faf6f5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#732729]/50 font-semibold text-stone-800"
                      />
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-[#bc8381]/25">
                      <button
                        type="button"
                        onClick={() => setShowMUAModal(false)}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px] py-3 rounded-lg cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-[#732729] hover:bg-[#5c1d1f] text-white font-bold uppercase tracking-wider text-[10px] py-3 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-lg transition-all"
                      >
                        Dispatch Formula
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
