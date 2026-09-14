import { db, collection, getDocs, doc, setDoc, OperationType, handleFirestoreError } from '../firebase';
import { GalleryIconicLook } from '../components/gallery/GalleryPage';
import { InspirationItem } from '../data/inspirationData';

export const checkIsProUser = (): boolean => {
  try {
    return localStorage.getItem('gleame_pro_subscriber') === 'true';
  } catch {
    return false;
  }
};

export const setProUserStatus = (status: boolean): void => {
  try {
    if (status) {
      localStorage.setItem('gleame_pro_subscriber', 'true');
      localStorage.setItem('gleame_pro_activated_at', Date.now().toString());
    } else {
      localStorage.removeItem('gleame_pro_subscriber');
      localStorage.removeItem('gleame_pro_activated_at');
    }
  } catch (e) {
    console.error('Failed to set pro status in storage', e);
  }
};

// Sync and seed 20 looks to Firestore collections (gallery_looks, inspirations, built_looks)
export async function syncLooksToFirestore(
  galleryLooks: GalleryIconicLook[],
  inspirations: InspirationItem[]
): Promise<void> {
  try {
    // 1. Seed gallery_looks collection
    for (const look of galleryLooks) {
      const lookDocRef = doc(db, 'gallery_looks', look.id);
      await setDoc(lookDocRef, {
        id: look.id,
        name: look.name,
        creator: look.creator,
        tagline: look.tagline,
        category: look.category,
        categoryLabel: look.categoryLabel,
        likes: look.likes,
        votesCount: look.votesCount,
        image: look.image,
        swatches: look.swatches,
        config: look.config,
        isLocked: !!look.isLocked,
        tier: look.tier || (look.isLocked ? 'pro' : 'free'),
        hasVideo: !!look.hasVideo,
        updatedAt: Date.now()
      }, { merge: true });

      // Also ensure it is in built_looks for universal preview compatibility
      const builtLookRef = doc(db, 'built_looks', look.id);
      await setDoc(builtLookRef, {
        id: look.id,
        name: look.name,
        description: look.tagline,
        eyeshadowColor: look.config.eyeshadowColor,
        eyeshadowOpacity: look.config.eyeshadowOpacity,
        eyelinerColor: look.config.eyelinerColor || '#000000',
        eyelinerOpacity: look.config.eyelinerOpacity || 0.8,
        eyelinerStyle: look.config.eyelinerStyle || 'classic',
        blushColor: look.config.blushColor,
        blushOpacity: look.config.blushOpacity,
        lipColor: look.config.lipColor,
        lipOpacity: look.config.lipOpacity,
        lipGloss: look.config.lipGloss,
        lashesStyle: look.config.lashesStyle,
        glitterLevel: look.config.glitterLevel,
        filter: look.config.selectedFilter,
        votes: look.votesCount,
        coverImage: look.image,
        isLocked: !!look.isLocked,
        isCustom: false
      }, { merge: true });
    }

    // 2. Seed inspirations collection
    for (const insp of inspirations) {
      const inspDocRef = doc(db, 'inspirations', insp.id);
      await setDoc(inspDocRef, {
        id: insp.id,
        title: insp.title,
        creator: insp.creator,
        avatarUrl: insp.avatarUrl,
        imageUrl: insp.imageUrl,
        category: insp.category,
        badge: insp.badge,
        description: insp.description,
        likes: insp.likes,
        saves: insp.saves,
        tags: insp.tags,
        products: insp.products,
        preset: insp.preset,
        isLocked: !!insp.isLocked,
        tier: insp.tier || (insp.isLocked ? 'pro' : 'free'),
        updatedAt: Date.now()
      }, { merge: true });
    }
  } catch (error) {
    console.warn('Firestore syncing notice:', error);
  }
}

// Fetch Gallery Looks from Firestore with fallback to defaults
export async function fetchGalleryLooksFromFirestore(defaultLooks: GalleryIconicLook[]): Promise<GalleryIconicLook[]> {
  try {
    const colRef = collection(db, 'gallery_looks');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const fetched: GalleryIconicLook[] = [];
      snapshot.forEach(docSnap => {
        fetched.push(docSnap.data() as GalleryIconicLook);
      });
      // Return merged list prioritizing database
      const existingIds = new Set(fetched.map(l => l.id));
      const combined = [...fetched, ...defaultLooks.filter(l => !existingIds.has(l.id))];
      return combined;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'gallery_looks');
  }
  return defaultLooks;
}

// Fetch Inspirations from Firestore with fallback to defaults
export async function fetchInspirationsFromFirestore(defaultInspirations: InspirationItem[]): Promise<InspirationItem[]> {
  try {
    const colRef = collection(db, 'inspirations');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const fetched: InspirationItem[] = [];
      snapshot.forEach(docSnap => {
        fetched.push(docSnap.data() as InspirationItem);
      });
      const existingIds = new Set(fetched.map(i => i.id));
      const combined = [...fetched, ...defaultInspirations.filter(i => !existingIds.has(i.id))];
      return combined;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'inspirations');
  }
  return defaultInspirations;
}
