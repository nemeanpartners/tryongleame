import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { CURATED_20_LOOKS } from '../data/curatedLooksData';
import { INITIAL_INSPIRATIONS, InspirationItem } from '../data/inspirationData';
import { GalleryIconicLook } from '../components/gallery/GalleryPage';

export function checkIsProUser(): boolean {
  try {
    return localStorage.getItem('gleame_pro_subscriber') === 'true';
  } catch {
    return false;
  }
}

export function activateProSubscription(): void {
  try {
    localStorage.setItem('gleame_pro_subscriber', 'true');
    localStorage.setItem('gleame_pro_activated_at', Date.now().toString());
  } catch (e) {
    console.error(e);
  }
}

export async function fetchLooksFromFirestore(): Promise<GalleryIconicLook[]> {
  try {
    const looksCol = collection(db, 'gallery_looks');
    const snapshot = await getDocs(looksCol);
    if (snapshot.empty) {
      // Seed initial 20 looks
      await seedLooksToFirestore();
      return CURATED_20_LOOKS;
    }
    const firestoreLooks: GalleryIconicLook[] = [];
    snapshot.forEach(docSnap => {
      firestoreLooks.push(docSnap.data() as GalleryIconicLook);
    });
    return firestoreLooks.length > 0 ? firestoreLooks : CURATED_20_LOOKS;
  } catch (e) {
    console.warn('Could not fetch looks from Firestore, falling back to local dataset:', e);
    return CURATED_20_LOOKS;
  }
}

export async function seedLooksToFirestore(): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const look of CURATED_20_LOOKS) {
      const docRef = doc(db, 'gallery_looks', look.id);
      batch.set(docRef, look, { merge: true });
    }
    await batch.commit();
  } catch (e) {
    console.error('Error seeding gallery looks to Firestore:', e);
  }
}

export async function fetchInspirationsFromFirestore(): Promise<InspirationItem[]> {
  try {
    const inspCol = collection(db, 'inspiration_cards');
    const snapshot = await getDocs(inspCol);
    if (snapshot.empty) {
      // Seed initial 20 inspiration cards
      await seedInspirationsToFirestore();
      return INITIAL_INSPIRATIONS;
    }
    const firestoreItems: InspirationItem[] = [];
    snapshot.forEach(docSnap => {
      firestoreItems.push(docSnap.data() as InspirationItem);
    });
    return firestoreItems.length > 0 ? firestoreItems : INITIAL_INSPIRATIONS;
  } catch (e) {
    console.warn('Could not fetch inspirations from Firestore, falling back to local dataset:', e);
    return INITIAL_INSPIRATIONS;
  }
}

export async function seedInspirationsToFirestore(): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const item of INITIAL_INSPIRATIONS) {
      const docRef = doc(db, 'inspiration_cards', item.id);
      batch.set(docRef, item, { merge: true });
    }
    await batch.commit();
  } catch (e) {
    console.error('Error seeding inspirations to Firestore:', e);
  }
}
