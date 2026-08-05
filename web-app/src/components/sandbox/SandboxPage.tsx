import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Sliders, Sparkles, User, Check, Trash2, ArrowRight, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
  const [blushColor, setBlushColor] = useState<string>('#f43f5e');
  const [blushOpacity, setBlushOpacity] = useState<number>(0.4);
  const [lipColor, setLipColor] = useState<string>('#be123c');
  const [lipOpacity, setLipOpacity] = useState<number>(0.8);
  const [lipGloss, setLipGloss] = useState<boolean>(true);
  const [lashesStyle, setLashesStyle] = useState<'none' | 'natural' | 'glam' | 'wispy'>('natural');
  const [glitterLevel, setGlitterLevel] = useState<number>(20);
  const [activeFilter, setActiveFilter] = useState<'none' | 'vintage' | 'warm-glow' | 'cool-cyber' | 'holographic'>('none');

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
      
      {/* LEFT: Live Makeup AR View Container (Cols: 7) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#bc8381]/25 shadow-md flex flex-col justify-between">
        
        {/* Device Stage and Capture */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#732729] animate-pulse"></span>
              <h3 className="text-sm font-serif font-black tracking-wide uppercase text-[#732729]">Filter Blueprint Canvas</h3>
            </div>
            <div className="text-[10px] font-black uppercase text-[#732729] bg-[#bc8381]/15 border border-[#bc8381]/25 px-2.5 py-1 rounded-md">
              GL RENDER ACTIVE
            </div>
          </div>

          {/* AR Simulated Canvas Viewport with "deepar here" placeholder */}
          <div className="relative w-full aspect-[4/3] bg-gradient-to-tr from-[#fce4ec] via-[#FAF6F5] to-[#f5eae7] rounded-xl overflow-hidden border border-[#bc8381]/20 flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-inner">
            {/* Elegant grid matrix back panel */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(#bc8381_1px,transparent_1px),linear-gradient(90deg,#bc8381_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute top-4 right-4 text-[9px] font-mono text-stone-400 tracking-widest uppercase font-bold">
              ENG_CORE: GL_RENDER_ACTIVE
            </div>

            {/* Pulsing cosmetic ring around "deepar here" */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-24 h-24 rounded-full border border-[#732729]/30 animate-ping duration-1000 opacity-20" />
              <div className="absolute w-16 h-16 rounded-full border border-[#bc8381]/40 animate-pulse duration-700 opacity-30" />
              <div className="relative bg-[#732729] p-4 rounded-full border border-white/10 shadow-lg">
                <Sparkles className="w-8 h-8 text-[#FAF6F5]" />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <h2 className="text-3xl font-serif font-black text-[#732729] tracking-widest uppercase filter drop-shadow-[0_2px_4px_rgba(115,39,41,0.15)]">
                deepar here
              </h2>
              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed font-bold">
                Live DeepAR WebGL Cosmetic Engine Integration Point
              </p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                Webcam live-tracking overlay placeholder. Tweak active shader recipes on the right to compile custom filter binaries.
              </p>
            </div>

            {/* Active Color Chips represent currently formulated shader colors */}
            <div className="flex gap-2.5 pt-4 bg-white/90 border border-[#bc8381]/25 px-4 py-2.5 rounded-full backdrop-blur-md relative z-10 shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-600">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400">Active Formula:</span>
                <div style={{ backgroundColor: eyeshadowColor }} className="w-3.5 h-3.5 rounded-full border border-[#bc8381]/30" title="Eyeshadow color" />
                <div style={{ backgroundColor: blushColor }} className="w-3.5 h-3.5 rounded-full border border-[#bc8381]/30 -ml-1" title="Blush color" />
                <div style={{ backgroundColor: lipColor }} className="w-3.5 h-3.5 rounded-full border border-[#bc8381]/30 -ml-1" title="Lip color" />
              </div>
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

            {/* 2. LIPSTICK CONTROLS */}
            <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">2. Lip Tint</span>
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

            {/* 3. BLUSH CONTROLS */}
            <div className="bg-[#faf6f5] p-4 rounded-xl border border-[#bc8381]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">3. Cheek Blush</span>
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
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">4. Lash Extension</label>
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

              {/* Glitter and DeepAR filters */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#bc8381]/15 pt-3">
                {/* Glitter */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#732729]" /> Glitter Glimmer
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
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">DeepAR Filter</label>
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
                <h4 className="font-serif font-bold text-[#732729] text-sm">Enter "Build the Look"</h4>
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

    </div>
  );
}
