import { 
  db, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { WantedLookItem } from '../components/trending/WantedQuickActionCard';
import { WANTED_LOOKS_100 } from '../data/wantedLooks100';

const COLLECTION_NAME = 'wanted_looks';

let isSeedingInProgress = false;

/**
 * Seeds all 100 wanted looks into Firestore if not yet populated or if missing entries.
 */
export async function seedWantedLooksIfEmpty(): Promise<void> {
  if (isSeedingInProgress) return;
  try {
    isSeedingInProgress = true;
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);

    if (snapshot.size < 100) {
      console.log(`[Firestore] Seeding 100 Wanted Looks into '${COLLECTION_NAME}' collection... Currently has: ${snapshot.size}`);
      
      const existingIds = new Set(snapshot.docs.map(d => d.id));
      
      // Batch-write all 100 entries
      const promises = WANTED_LOOKS_100.map(async (look) => {
        if (!existingIds.has(look.id)) {
          const docRef = doc(db, COLLECTION_NAME, look.id);
          return setDoc(docRef, {
            ...look,
            createdAt: look.createdAt || Date.now() - (look.numericVotes * 1000)
          });
        }
      });

      await Promise.all(promises);
      console.log('[Firestore] Successfully stored 100 wanted looks in Firestore.');
    }
  } catch (error) {
    console.error('[Firestore] Error while seeding wanted looks:', error);
    // Non-fatal fallback - will continue using cached/static data
  } finally {
    isSeedingInProgress = false;
  }
}

/**
 * Subscribes to real-time updates for wanted looks from Firestore.
 */
export function subscribeWantedLooks(
  onUpdate: (looks: WantedLookItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    
    // Trigger seed in background if empty
    seedWantedLooksIfEmpty();

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: data.id || d.id,
              name: data.name,
              countLabel: data.countLabel || `${data.numericVotes || 0} want this`,
              numericVotes: typeof data.numericVotes === 'number' ? data.numericVotes : 0,
              category: data.category || 'Eyes',
              swatchType: data.swatchType || 'gradient',
              colors: Array.isArray(data.colors) ? data.colors : ['#732729'],
              description: data.description || '',
              requestedBy: data.requestedBy || 'community',
              createdAt: data.createdAt || 0
            } as WantedLookItem;
          });

          // Sort by numericVotes descending
          docs.sort((a, b) => b.numericVotes - a.numericVotes);
          onUpdate(docs);
        } else {
          // Fallback to local 100 dataset while seeding completes
          onUpdate(WANTED_LOOKS_100);
          seedWantedLooksIfEmpty();
        }
      },
      (error) => {
        console.warn('[Firestore] Snapshot listener error on wanted_looks:', error);
        if (onError) onError(error);
        // Fallback to static 100 items on error
        onUpdate(WANTED_LOOKS_100);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('[Firestore] Error creating wanted_looks subscription:', error);
    onUpdate(WANTED_LOOKS_100);
    return () => {};
  }
}

/**
 * Updates vote count for a wanted look in Firestore.
 */
export async function voteWantedLookInFirestore(
  id: string, 
  newVotes: number, 
  newCountLabel: string
): Promise<void> {
  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      numericVotes: newVotes,
      countLabel: newCountLabel
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Creates a newly proposed wanted look in Firestore.
 */
export async function createWantedLookInFirestore(
  look: WantedLookItem
): Promise<void> {
  const docPath = `${COLLECTION_NAME}/${look.id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, look.id);
    await setDoc(docRef, {
      id: look.id,
      name: look.name,
      countLabel: look.countLabel,
      numericVotes: look.numericVotes,
      category: look.category,
      swatchType: look.swatchType,
      colors: look.colors,
      description: look.description || '',
      requestedBy: look.requestedBy || 'community',
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}
