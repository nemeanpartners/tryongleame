import { auth, db, doc, setDoc, getDoc } from '../firebase';
import { updateProfile, User as FirebaseUser } from 'firebase/auth';

const STORAGE_AVATAR_KEY = 'tryon_custom_avatar';
const STORAGE_COVER_KEY = 'tryon_custom_cover';

export const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
export const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=1200';

/**
 * Returns current effective avatar URL:
 * 1. Custom uploaded photo if user uploaded one
 * 2. Google / Gmail photo (photoURL) if signed in
 * 3. Default resident avatar
 */
export function getEffectiveAvatar(user?: FirebaseUser | null): string {
  try {
    const custom = localStorage.getItem(STORAGE_AVATAR_KEY);
    if (custom) return custom;
  } catch (e) {
    console.warn('Error reading custom avatar:', e);
  }

  const currentUser = user || auth.currentUser;
  if (currentUser?.photoURL) {
    return currentUser.photoURL;
  }

  return DEFAULT_AVATAR_URL;
}

/**
 * Returns whether the user has a Google / Gmail account photo available.
 */
export function hasGooglePhoto(user?: FirebaseUser | null): boolean {
  const currentUser = user || auth.currentUser;
  return Boolean(currentUser?.photoURL);
}

/**
 * Returns whether user currently has a custom overridden avatar.
 */
export function hasCustomAvatar(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_AVATAR_KEY));
  } catch {
    return false;
  }
}

/**
 * Loads user profile data (avatar and cover) from Firestore users/{uid} document.
 */
export async function loadUserProfileFromFirestore(userId: string): Promise<{ avatarUrl?: string; coverUrl?: string }> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const avatar = data.avatarUrl || data.photoURL;
      const cover = data.coverUrl || data.coverURL;
      
      let changed = false;
      if (avatar && avatar !== localStorage.getItem(STORAGE_AVATAR_KEY)) {
        localStorage.setItem(STORAGE_AVATAR_KEY, avatar);
        changed = true;
      }
      if (cover && cover !== localStorage.getItem(STORAGE_COVER_KEY)) {
        localStorage.setItem(STORAGE_COVER_KEY, cover);
        changed = true;
      }
      if (changed) {
        window.dispatchEvent(new Event('tryon_profile_updated'));
      }
      return { avatarUrl: avatar, coverUrl: cover };
    }
  } catch (err) {
    console.warn('Error loading user profile from Firestore:', err);
  }
  return {};
}

/**
 * Saves a new custom profile photo to Firestore user doc (as URL) and local cache.
 */
export async function saveCustomAvatar(imageUrl: string, user?: FirebaseUser | null): Promise<void> {
  // 1. Immediately store in localStorage so UI is instantaneous
  try {
    localStorage.setItem(STORAGE_AVATAR_KEY, imageUrl);
  } catch (e) {
    console.warn('Error storing custom avatar locally:', e);
  }

  // 2. Dispatch event to update all reactive components immediately
  window.dispatchEvent(new Event('tryon_profile_updated'));

  // 3. Save directly to Firestore users/{uid} document
  const currentUser = user || auth.currentUser;
  if (currentUser?.uid) {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const savePromise = setDoc(userDocRef, {
        photoURL: imageUrl,
        avatarUrl: imageUrl,
        updatedAt: Date.now()
      }, { merge: true });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore save timed out')), 4000)
      );

      await Promise.race([savePromise, timeoutPromise]);
    } catch (e) {
      console.warn('Could not persist avatar to Firestore document:', e);
    }
  }

  // 4. If it's a standard web URL (http/https), safely sync to Firebase Auth non-blocking
  if (currentUser && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    updateProfile(currentUser, { photoURL: imageUrl }).catch((e) => {
      console.warn('Could not sync avatar to Firebase Auth profile:', e);
    });
  }
}

/**
 * Resets profile photo back to Google / Gmail photo (or default).
 */
export async function resetAvatarToGoogle(user?: FirebaseUser | null): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_AVATAR_KEY);
  } catch (e) {
    console.warn('Error removing custom avatar locally:', e);
  }

  window.dispatchEvent(new Event('tryon_profile_updated'));

  const currentUser = user || auth.currentUser;
  if (currentUser?.uid) {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        photoURL: currentUser.photoURL || null,
        avatarUrl: null,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Error resetting avatar in Firestore:', e);
    }
  }
}

/**
 * Returns current effective cover photo.
 */
export function getEffectiveCover(): string {
  try {
    const custom = localStorage.getItem(STORAGE_COVER_KEY);
    if (custom) return custom;
  } catch (e) {
    console.warn('Error reading custom cover:', e);
  }

  return DEFAULT_COVER_URL;
}

/**
 * Saves a new custom cover banner to Firestore user doc and local cache.
 */
export async function saveCustomCover(imageUrl: string, user?: FirebaseUser | null): Promise<void> {
  try {
    localStorage.setItem(STORAGE_COVER_KEY, imageUrl);
  } catch (e) {
    console.warn('Error storing custom cover locally:', e);
  }

  window.dispatchEvent(new Event('tryon_profile_updated'));

  const currentUser = user || auth.currentUser;
  if (currentUser?.uid) {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const savePromise = setDoc(userDocRef, {
        coverURL: imageUrl,
        coverUrl: imageUrl,
        updatedAt: Date.now()
      }, { merge: true });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore save timed out')), 4000)
      );

      await Promise.race([savePromise, timeoutPromise]);
    } catch (e) {
      console.warn('Could not persist cover to Firestore document:', e);
    }
  }
}

/**
 * Resets cover banner to default.
 */
export async function resetCustomCover(user?: FirebaseUser | null): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_COVER_KEY);
  } catch (e) {
    console.warn('Error resetting cover locally:', e);
  }

  window.dispatchEvent(new Event('tryon_profile_updated'));

  const currentUser = user || auth.currentUser;
  if (currentUser?.uid) {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        coverURL: null,
        coverUrl: null,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Error resetting cover in Firestore:', e);
    }
  }
}
