import { auth, db, doc, setDoc, deleteDoc } from '../firebase';

/**
 * A look as the app needs it: what it is called, the filter it maps to, and
 * the colours it wears. Every look card in the web app can describe itself
 * this way, whichever page it lives on.
 */
export type TryOnLook = {
  id: string;
  name: string;
  /** Catalog id of the AR filter this look is, when it is one we ship. */
  filterId?: string;
  /** The filter behind each region, for a look built from several shades. */
  filterIds?: Record<string, string>;
  description?: string;
  image?: string;
  lipColor?: string;
  blushColor?: string;
  eyeshadowColor?: string;
  eyelinerColor?: string;
  lipGloss?: boolean;
  lashesStyle?: string;
  glitterLevel?: number;
};

/** Where the look was saved from, which is how the Saved page groups them. */
export type SavedFrom = 'discover' | 'home' | 'gallery' | 'tryon' | 'mixnmatch';

const bridge = () =>
  (window as any).GleameBridge || (window as any).TryOnBeautyBridge || null;

/** True inside the iOS wrapper, where the native filter pages exist. */
export const isNativeApp = (): boolean => Boolean(bridge()?.postMessage);

/**
 * Hands a look to the app, which puts it on the face straight away: a look
 * that is one of our filters opens on Try On, and anything else is rebuilt on
 * Mix & Match from the closest shades. Returns false in a plain browser, where
 * the caller falls back to the web try-on page.
 */
export function openLookInNative(look: TryOnLook): boolean {
  const target = bridge();
  if (!target?.postMessage) return false;
  target.postMessage(
    JSON.stringify({
      source: 'tryon-beauty-web',
      type: 'gleame:apply-look',
      id: look.id,
      filterId: look.filterId || null,
      filterIds: look.filterIds || null,
      name: look.name,
      lipColor: look.lipColor || null,
      blushColor: look.blushColor || null,
      eyeshadowColor: look.eyeshadowColor || null,
      eyelinerColor: look.eyelinerColor || null,
      lipGloss: look.lipGloss ?? null,
      lashesStyle: look.lashesStyle || null,
      glitterLevel: look.glitterLevel ?? null
    })
  );
  return true;
}

const savedDocId = (lookId: string) =>
  `web_${lookId.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 96)}`;

/**
 * Saves a look the user found while browsing into their account, in the one
 * collection the Saved page reads. The bucket it appears under comes from
 * savedFrom, so a look saved from Discover is not mixed in with the ones they
 * built themselves.
 */
export async function saveLookToAccount(
  look: TryOnLook,
  savedFrom: SavedFrom = 'discover'
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to save looks to your account.');

  await setDoc(doc(db, 'users', user.uid, 'saved_looks', savedDocId(look.id)), {
    id: look.id,
    name: look.name || 'Saved look',
    description: look.description || 'Saved while browsing Gleame.',
    coverImage: look.image || null,
    filterId: look.filterId || null,
    filterIds: look.filterIds || null,
    lipColor: look.lipColor || null,
    blushColor: look.blushColor || null,
    eyeshadowColor: look.eyeshadowColor || null,
    eyelinerColor: look.eyelinerColor || null,
    lipGloss: look.lipGloss ?? null,
    lashesStyle: look.lashesStyle || null,
    glitterLevel: look.glitterLevel ?? null,
    visibility: 'private',
    savedFrom,
    savedAt: Date.now(),
    userId: user.uid,
    userEmail: user.email || null
  });
}

/** Undoes a save, so the bookmark toggle means the same thing in both places. */
export async function removeLookFromAccount(lookId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await deleteDoc(doc(db, 'users', user.uid, 'saved_looks', savedDocId(lookId)));
}
