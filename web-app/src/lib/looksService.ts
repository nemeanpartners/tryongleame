import { db, collection, getDocs, addDoc, updateDoc, doc, increment, setDoc, handleFirestoreError, OperationType } from '../firebase';
import { PresetLook, LookRequest } from '../types';

export interface ExtendedBuiltLook extends PresetLook {
  votes: number;
  coverImage?: string;
  isCustom?: boolean;
}

const INITIAL_BUILT_LOOKS: ExtendedBuiltLook[] = [
  {
    id: 'sunset_silk',
    name: 'Sunset Silk',
    description: 'A warm, romantic sunset glow with satin copper tones and golden hour reflections.',
    eyeshadowColor: '#d97706',
    eyeshadowOpacity: 0.6,
    blushColor: '#f43f5e',
    blushOpacity: 0.4,
    lipColor: '#be123c',
    lipOpacity: 0.8,
    lipGloss: true,
    lashesStyle: 'natural',
    glitterLevel: 10,
    filter: 'warm-glow',
    votes: 42,
    coverImage: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cyberpunk_violet',
    name: 'Cyberpunk Violet',
    description: 'Electric neon violet shadows with high-contrast cybernetic digital filters and bold wisps.',
    eyeshadowColor: '#8b5cf6',
    eyeshadowOpacity: 0.7,
    blushColor: '#ec4899',
    blushOpacity: 0.5,
    lipColor: '#a21caf',
    lipOpacity: 0.9,
    lipGloss: true,
    lashesStyle: 'wispy',
    glitterLevel: 50,
    filter: 'cool-cyber',
    votes: 84,
    coverImage: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'ethereal_glow',
    name: 'Ethereal Mermaid',
    description: 'Soft pastel aquamarines, sheer lip gloss, and delicate face glimmers reflecting oceanic light.',
    eyeshadowColor: '#06b6d4',
    eyeshadowOpacity: 0.5,
    blushColor: '#fb7185',
    blushOpacity: 0.3,
    lipColor: '#f472b6',
    lipOpacity: 0.6,
    lipGloss: true,
    lashesStyle: 'glam',
    glitterLevel: 75,
    filter: 'holographic',
    votes: 61,
    coverImage: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'holo_heatwave',
    name: 'Holographic Heatwave',
    description: 'The active challenge base! Prismatic orchid eye overlays, bold pink lips, and intense sparkle levels.',
    eyeshadowColor: '#d946ef',
    eyeshadowOpacity: 0.8,
    blushColor: '#f43f5e',
    blushOpacity: 0.4,
    lipColor: '#db2777',
    lipOpacity: 0.85,
    lipGloss: true,
    lashesStyle: 'glam',
    glitterLevel: 90,
    filter: 'holographic',
    votes: 79,
    coverImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600'
  }
];

const SEED_REQUESTS: Omit<LookRequest, 'id'>[] = [
  {
    title: 'Blue Glam Look',
    description: 'A brilliant sapphire blue and teal glitter eyeshadow combination, paired with shimmering neutral peach gloss lips and dramatic sky-high eyelashes.',
    category: 'Full Face',
    colors: ['#1d4ed8', '#06b6d4', '#ffedd5'],
    requestedBy: 'azure_dreamer',
    votes: 52,
    votedUsers: [],
    createdAt: Date.now() - 3600000 * 24
  },
  {
    title: 'Black Night Goth',
    description: 'A striking matte charcoal black eyeshadow smudge, contoured blush, dramatic heavy-set lashes, and a velvety deep plum-black lips look.',
    category: 'Full Face',
    colors: ['#111827', '#374151', '#4c0519'],
    requestedBy: 'midnight_rebel',
    votes: 47,
    votedUsers: [],
    createdAt: Date.now() - 3600000 * 18
  },
  {
    title: 'Liquid Rose Gold Pearl',
    description: 'Metallic warm pink eye overlays, subtle desert sand blush, and clear high-gloss cherry gold lips.',
    category: 'Full Face',
    colors: ['#fb7185', '#cb997e', '#db2777'],
    requestedBy: 'pearl_princess',
    votes: 21,
    votedUsers: [],
    createdAt: Date.now() - 3600000 * 6
  }
];

// Seed built looks collection if empty
export async function seedBuiltLooksIfEmpty(): Promise<ExtendedBuiltLook[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'built_looks')).catch(error => {
      handleFirestoreError(error, OperationType.LIST, 'built_looks');
    });
    if (querySnapshot.empty) {
      // Seed them
      const items: ExtendedBuiltLook[] = [];
      for (const item of INITIAL_BUILT_LOOKS) {
        const docRef = doc(collection(db, 'built_looks'), item.id);
        await setDoc(docRef, item).catch(error => {
          handleFirestoreError(error, OperationType.CREATE, `built_looks/${item.id}`);
        });
        items.push(item);
      }
      return items;
    } else {
      const items: ExtendedBuiltLook[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name,
          description: data.description,
          eyeshadowColor: data.eyeshadowColor,
          eyeshadowOpacity: data.eyeshadowOpacity ?? 0.6,
          blushColor: data.blushColor,
          blushOpacity: data.blushOpacity ?? 0.4,
          lipColor: data.lipColor,
          lipOpacity: data.lipOpacity ?? 0.8,
          lipGloss: data.lipGloss ?? true,
          lashesStyle: data.lashesStyle ?? 'natural',
          glitterLevel: data.glitterLevel ?? 10,
          filter: data.filter ?? 'none',
          votes: data.votes ?? 0,
          coverImage: data.coverImage,
          isCustom: data.isCustom ?? false,
        });
      });
      return items;
    }
  } catch (error) {
    console.error('Error seeding/fetching built looks: ', error);
    if (error instanceof Error && error.message.includes('{')) {
      throw error;
    }
    return INITIAL_BUILT_LOOKS;
  }
}

// Seed community requests with custom requested looks if empty
export async function seedRequestsIfEmpty(): Promise<LookRequest[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'requests')).catch(error => {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    });
    if (querySnapshot.empty) {
      const items: LookRequest[] = [];
      for (const item of SEED_REQUESTS) {
        const docRef = await addDoc(collection(db, 'requests'), item).catch(error => {
          handleFirestoreError(error, OperationType.CREATE, 'requests');
        });
        items.push({ id: docRef.id, ...item });
      }
      return items;
    } else {
      const items: LookRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          category: data.category,
          colors: data.colors || [],
          requestedBy: data.requestedBy || 'Anonymous',
          votes: data.votes ?? 0,
          votedUsers: data.votedUsers || [],
          createdAt: data.createdAt || Date.now()
        });
      });
      return items;
    }
  } catch (error) {
    console.error('Error seeding/fetching requests: ', error);
    if (error instanceof Error && error.message.includes('{')) {
      throw error;
    }
    return [];
  }
}

// Vote for a built look
export async function voteForBuiltLookInDb(lookId: string): Promise<void> {
  try {
    const docRef = doc(db, 'built_looks', lookId);
    await updateDoc(docRef, {
      votes: increment(1)
    }).catch(error => {
      handleFirestoreError(error, OperationType.UPDATE, `built_looks/${lookId}`);
    });
  } catch (error) {
    console.error('Error voting for built look: ', error);
    if (error instanceof Error && error.message.includes('{')) {
      throw error;
    }
  }
}

// Vote for a look request
export async function voteForRequestInDb(reqId: string): Promise<void> {
  try {
    const docRef = doc(db, 'requests', reqId);
    await updateDoc(docRef, {
      votes: increment(1)
    }).catch(error => {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${reqId}`);
    });
  } catch (error) {
    console.error('Error voting for request: ', error);
    if (error instanceof Error && error.message.includes('{')) {
      throw error;
    }
  }
}

// Create built look out of a request (marking the request as completed/won)
export async function createBuiltLookFromRequestInDb(
  requestTitle: string, 
  presetData: Omit<PresetLook, 'id'>,
  coverImage: string = 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600'
): Promise<ExtendedBuiltLook> {
  const customId = `released_${Date.now()}`;
  const newLook: ExtendedBuiltLook = {
    id: customId,
    name: presetData.name || requestTitle,
    description: presetData.description || `Community request "${requestTitle}" built and added to the official TryON library.`,
    eyeshadowColor: presetData.eyeshadowColor,
    eyeshadowOpacity: presetData.eyeshadowOpacity,
    blushColor: presetData.blushColor,
    blushOpacity: presetData.blushOpacity,
    lipColor: presetData.lipColor,
    lipOpacity: presetData.lipOpacity,
    lipGloss: presetData.lipGloss,
    lashesStyle: presetData.lashesStyle,
    glitterLevel: presetData.glitterLevel,
    filter: presetData.filter,
    votes: 1, // Start with 1 vote
    coverImage,
    isCustom: true
  };

  const docRef = doc(db, 'built_looks', customId);
  await setDoc(docRef, newLook).catch(error => {
    handleFirestoreError(error, OperationType.CREATE, `built_looks/${customId}`);
  });
  return newLook;
}
