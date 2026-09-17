import { auth, db, collection, addDoc, doc, setDoc, handleFirestoreError, OperationType } from '../firebase';

type NativeBridgeType = 
  | 'gleame:save-built-look' 
  | 'gleame:submit-challenge'
  | 'tryonbeauty:save-built-look'
  | 'tryonbeauty:submit-challenge';

type NativeLookPayload = {
  lookName?: string;
  description?: string;
  category?: string;
  source?: string;
  /** 'private' keeps the look in the user's account only. */
  visibility?: 'public' | 'private';
  /** Which saved bucket this belongs in. */
  savedFrom?: 'mixnmatch' | 'tryon' | 'gallery';
  /** Stable id from the app, so re-delivery overwrites rather than duplicates. */
  lookId?: string;
  shades?: Array<{ region?: string; id?: string; name?: string; swatch?: string }>;
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
    TryOnBeautyBridge?: {
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
  const payloadStr = JSON.stringify({
    source: 'tryon-beauty-web',
    type,
    ok,
    message
  });
  window.GleameBridge?.postMessage(payloadStr);
  window.TryOnBeautyBridge?.postMessage(payloadStr);
};

type SavedSection =
  | 'built_looks'
  | 'submissions'
  | 'saved_mixnmatch'
  | 'saved_tryon'
  | 'saved_gallery';

/** Where a look belongs, based on how it was made. */
const savedSectionFor = (payload?: NativeLookPayload): SavedSection => {
  if (payload?.savedFrom === 'gallery') return 'saved_gallery';
  if (payload?.savedFrom === 'tryon') return 'saved_tryon';
  if (payload?.savedFrom === 'mixnmatch') return 'saved_mixnmatch';
  // Fall back on shape: more than one shade means it was mixed.
  return (payload?.shades?.length ?? 0) > 1 ? 'saved_mixnmatch' : 'saved_tryon';
};

const writeUserMirror = async (section: SavedSection, id: string, data: Record<string, unknown>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in on the web tab before saving.');

  // Deliberately not routed through handleFirestoreError: that rethrows, and a
  // failure on one copy used to abort the others.
  try {
    await setDoc(doc(db, 'users', user.uid, section, id), {
      ...data,
      userId: user.uid,
      userEmail: user.email || null,
      syncedAt: Date.now()
    });
  } catch (error: any) {
    // Name the path, so a denial says which write was refused.
    throw new Error(
      `${error?.code || 'write failed'} at users/${user.uid}/${section}/${id}`
    );
  }
};

/**
 * The app hosts more than one WebView. Signing in on one leaves the others with
 * auth.currentUser still null until the SDK has restored the session from
 * IndexedDB, which is shared but not instant. Waiting for that avoids telling a
 * signed-in user to sign in.
 */
const waitForUser = async (timeoutMs = 6000) => {
  if (auth.currentUser) return auth.currentUser;
  const { onAuthStateChanged } = await import('firebase/auth');
  return new Promise<typeof auth.currentUser>((resolve) => {
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(u);
    });
  });
};

const saveNativeBuiltLook = async (payload?: NativeLookPayload) => {
  const user = await waitForUser();
  if (!user) throw new Error('Sign in on the web tab before saving.');

  const lookName = cleanText(payload?.lookName, 'TryOnBeauty iOS Build');
  const id =
    payload?.lookId && /^[a-zA-Z0-9_-]{1,128}$/.test(payload.lookId)
      ? payload.lookId
      : docIdFromName(lookName);
  const config = nativeNameToConfig(payload);
  const builtLook = {
    id,
    name: lookName,
    description: cleanText(payload?.description, 'Built in the TryOnBeauty iOS try-on app.', 500),
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

  const record = {
    ...builtLook,
    visibility: payload?.visibility ?? 'public',
    shades: payload?.shades ?? [],
    savedAt: Date.now(),
    nativePayload: payload || null
  };

  const section = savedSectionFor(payload);

  // The user's own copy is the one the Saved tab reads, so it goes first and
  // its failure is the only one that makes the save a failure.
  await writeUserMirror(section, id, record);

  // Best-effort extras. A rejected community write must not lose the save.
  await writeUserMirror('built_looks', id, record).catch((error) => {
    console.error('Could not write built_looks mirror:', error);
  });
  if (payload?.visibility !== 'private') {
    await setDoc(doc(db, 'built_looks', id), builtLook).catch((error) => {
      console.error('Could not write community built_looks:', error);
    });
  }
  console.info('[save] wrote', section, id);

  return section;
};

const submitNativeChallenge = async (payload?: NativeLookPayload) => {
  const user = auth.currentUser;
  const username =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    localStorage.getItem('kobella_username') ||
    localStorage.getItem('tryon_beauty_username') ||
    'TryOnBeauty User';
  const config = nativeNameToConfig(payload);
  const submission = {
    username: cleanText(username, 'TryOnBeauty User'),
    lookName: cleanText(payload?.lookName, 'TryOnBeauty iOS Challenge Look'),
    description: cleanText(payload?.description, 'Submitted from the TryOnBeauty iOS try-on app.', 1000),
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
  // Publish the signed-in uid so the app can tell which WebView holds the
  // session and deliver saves there.
  void (async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    onAuthStateChanged(auth, (u) => {
      (window as any).__gleameUid = u?.uid || '';
    });
  })();

  const handleMessage = async (event: MessageEvent<NativeBridgeMessage>) => {
    const message = event.data;
    if (!message) return;
    const isMatchedSource = message.source === 'gleame-ios-wrapper' || message.source === 'tryonbeauty-ios-wrapper';
    if (!isMatchedSource) return;

    const isMatchedType = 
      message.type === 'gleame:save-built-look' || 
      message.type === 'tryonbeauty:save-built-look' || 
      message.type === 'gleame:submit-challenge' || 
      message.type === 'tryonbeauty:submit-challenge';
    if (!isMatchedType) return;

    try {
      if (message.type === 'gleame:save-built-look' || message.type === 'tryonbeauty:save-built-look') {
        const section = await saveNativeBuiltLook(message.payload);
        postNativeStatus(message.type, true, `Saved to ${section}`);
      }

      if (message.type === 'gleame:submit-challenge' || message.type === 'tryonbeauty:submit-challenge') {
        if (!(await waitForUser())) {
          postNativeStatus(message.type, false, 'Sign in on the web page before submitting.');
          return;
        }
        await submitNativeChallenge(message.payload);
        onChallengeSubmitSuccess?.();
        postNativeStatus(message.type, true, 'Submitted to challenge');
      }
    } catch (error) {
      console.error('Native bridge write failed:', error);
      const reason =
        error instanceof Error ? error.message : 'Web sync failed.';
      postNativeStatus(message.type, false, reason);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}
