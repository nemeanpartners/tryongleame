import { auth, db, collection, addDoc, doc, setDoc, handleFirestoreError, OperationType } from '../firebase';

type NativeBridgeType = 'gleame:save-built-look' | 'gleame:submit-challenge';

type NativeLookPayload = {
  lookName?: string;
  description?: string;
  category?: string;
  source?: string;
  makeupConfig?: {
    eyes?: string;
    liner?: string;
    lashes?: string;
    lips?: string;
    sheerSkin?: boolean;
    preset?: string;
  };
};

type NativeBridgeMessage = {
  source?: string;
  type?: NativeBridgeType;
  payload?: NativeLookPayload;
};

declare global {
  interface Window {
    GleameBridge?: {
      postMessage: (message: string) => void;
    };
  }
}

const DEFAULT_CONFIG = {
  eyeshadowColor: '#d946ef',
  eyeshadowOpacity: 0.65,
  blushColor: '#f43f5e',
  blushOpacity: 0.35,
  lipColor: '#be123c',
  lipOpacity: 0.8,
  lipGloss: true,
  lashesStyle: 'natural',
  glitterLevel: 35,
  selectedFilter: 'none'
};

const nativeNameToConfig = (payload?: NativeLookPayload) => {
  const lips = payload?.makeupConfig?.lips?.toLowerCase() || '';
  const eyes = payload?.makeupConfig?.eyes?.toLowerCase() || '';
  const lashes = payload?.makeupConfig?.lashes?.toLowerCase() || '';

  return {
    ...DEFAULT_CONFIG,
    eyeshadowColor: eyes.includes('blue') ? '#0f766e' : eyes.includes('gold') ? '#eab308' : eyes.includes('pink') ? '#db2777' : DEFAULT_CONFIG.eyeshadowColor,
    lipColor: lips.includes('red') ? '#9f1239' : lips.includes('berry') ? '#a21caf' : lips.includes('peach') ? '#f97316' : DEFAULT_CONFIG.lipColor,
    lipGloss: lips.includes('gloss'),
    lashesStyle: lashes === 'none' ? 'none' : lashes.includes('glam') ? 'glam' : lashes.includes('feather') ? 'wispy' : 'natural',
    selectedFilter: payload?.makeupConfig?.sheerSkin ? 'warm-glow' : DEFAULT_CONFIG.selectedFilter
  };
};

const cleanText = (value: unknown, fallback: string, max = 100) => {
  if (typeof value !== 'string') return fallback;
  const next = value.trim();
  return next ? next.slice(0, max) : fallback;
};

const docIdFromName = (name: string) => {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);

  return `ios_${Date.now()}_${safeName || 'look'}`;
};

const postNativeStatus = (type: NativeBridgeType, ok: boolean, message: string) => {
  window.GleameBridge?.postMessage(JSON.stringify({
    source: 'tryon-beauty-web',
    type,
    ok,
    message
  }));
};

const writeUserMirror = async (section: 'built_looks' | 'submissions', id: string, data: Record<string, unknown>) => {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, 'users', user.uid, section, id), {
    ...data,
    userId: user.uid,
    userEmail: user.email || null,
    syncedAt: Date.now()
  }).catch((error) => {
    handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/${section}/${id}`);
  });
};

const saveNativeBuiltLook = async (payload?: NativeLookPayload) => {
  const lookName = cleanText(payload?.lookName, 'Gleame iOS Build');
  const id = docIdFromName(lookName);
  const config = nativeNameToConfig(payload);
  const builtLook = {
    id,
    name: lookName,
    description: cleanText(payload?.description, 'Built in the Gleame iOS try-on app.', 500),
    eyeshadowColor: config.eyeshadowColor,
    eyeshadowOpacity: config.eyeshadowOpacity,
    blushColor: config.blushColor,
    blushOpacity: config.blushOpacity,
    lipColor: config.lipColor,
    lipOpacity: config.lipOpacity,
    lipGloss: config.lipGloss,
    lashesStyle: config.lashesStyle,
    glitterLevel: config.glitterLevel,
    filter: config.selectedFilter,
    votes: 0,
    isCustom: true
  };

  await setDoc(doc(db, 'built_looks', id), builtLook).catch((error) => {
    handleFirestoreError(error, OperationType.CREATE, `built_looks/${id}`);
  });
  await writeUserMirror('built_looks', id, { ...builtLook, nativePayload: payload || null });
};

const submitNativeChallenge = async (payload?: NativeLookPayload) => {
  const user = auth.currentUser;
  const username =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    localStorage.getItem('kobella_username') ||
    localStorage.getItem('tryon_beauty_username') ||
    'Gleame User';
  const config = nativeNameToConfig(payload);
  const submission = {
    username: cleanText(username, 'Gleame User'),
    lookName: cleanText(payload?.lookName, 'Gleame iOS Challenge Look'),
    description: cleanText(payload?.description, 'Submitted from the Gleame iOS try-on app.', 1000),
    submissionType: 'challenge',
    category: cleanText(payload?.category, 'challenge'),
    makeupConfig: config,
    votes: 0,
    createdAt: Date.now()
  };

  const docRef = await addDoc(collection(db, 'submissions'), submission).catch((error) => {
    handleFirestoreError(error, OperationType.CREATE, 'submissions');
  });
  await writeUserMirror('submissions', docRef.id, { ...submission, nativePayload: payload || null });
};

export function installGleameNativeBridge(onChallengeSubmitSuccess?: () => void) {
  const handleMessage = async (event: MessageEvent<NativeBridgeMessage>) => {
    const message = event.data;
    if (!message || message.source !== 'gleame-ios-wrapper') return;
    if (message.type !== 'gleame:save-built-look' && message.type !== 'gleame:submit-challenge') return;

    try {
      if (message.type === 'gleame:save-built-look') {
        await saveNativeBuiltLook(message.payload);
        postNativeStatus(message.type, true, 'Saved to Look Lab');
      }

      if (message.type === 'gleame:submit-challenge') {
        if (!auth.currentUser) {
          postNativeStatus(message.type, false, 'Sign in on the web page before submitting.');
          return;
        }
        await submitNativeChallenge(message.payload);
        onChallengeSubmitSuccess?.();
        postNativeStatus(message.type, true, 'Submitted to challenge');
      }
    } catch (error) {
      console.error('Native bridge write failed:', error);
      postNativeStatus(message.type, false, 'Web sync failed.');
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}
