import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  handleFirestoreError,
  OperationType
} from '../firebase';

export type InquiryCategory = 
  | 'formula_export' 
  | 'device_calibration' 
  | 'account_support' 
  | 'bug_report' 
  | 'feature_request' 
  | 'other';

export type InquiryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface InquiryReply {
  id: string;
  sender: string;
  senderEmail: string;
  senderRole: 'user' | 'admin';
  message: string;
  timestamp: number;
}

export interface SupportInquiry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: InquiryCategory;
  description: string;
  images: string[];
  status: InquiryStatus;
  createdAt: number;
  updatedAt: number;
  replies: InquiryReply[];
  resolvedAt?: number;
}

const LOCAL_STORAGE_KEY = 'tryon_support_inquiries';

const SAMPLE_INQUIRIES: SupportInquiry[] = [
  {
    id: 'inq_sample_101',
    userId: 'usr_tryon_christina_2026',
    userName: 'Christina Lucas',
    userEmail: 'christinalucas1216@gmail.com',
    subject: 'Camera landmark calibration in low studio lighting',
    category: 'device_calibration',
    description: 'When switching to soft ambient studio lighting, the upper lash line landmark tracking jitters slightly on 60fps webcam feeds. Is there a manual sensitivity or smoothing threshold option?',
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600'
    ],
    status: 'in_progress',
    createdAt: Date.now() - 3600 * 1000 * 48,
    updatedAt: Date.now() - 3600 * 1000 * 12,
    replies: [
      {
        id: 'rep_1',
        sender: 'TryON Technical Director',
        senderEmail: 'admin@tryonbeauty.app',
        senderRole: 'admin',
        message: 'Hello Christina! Our vision tracking model includes a "Soft Lighting Assist" mode under Display & Camera Settings. We also tuned the temporal mesh Kalman filter in Build 412. Let us know if the jitter diminishes!',
        timestamp: Date.now() - 3600 * 1000 * 12
      }
    ]
  },
  {
    id: 'inq_sample_102',
    userId: 'usr_tryon_christina_2026',
    userName: 'Christina Lucas',
    userEmail: 'christinalucas1216@gmail.com',
    subject: 'Custom gloss shader export for 3D packaging preview',
    category: 'formula_export',
    description: 'Can we export the roughness and specular map alongside the hex color code for our lab packaging renderer?',
    images: [],
    status: 'resolved',
    createdAt: Date.now() - 3600 * 1000 * 96,
    updatedAt: Date.now() - 3600 * 1000 * 24,
    resolvedAt: Date.now() - 3600 * 1000 * 24,
    replies: [
      {
        id: 'rep_2',
        sender: 'Formula Concierge',
        senderEmail: 'support@tryonbeauty.app',
        senderRole: 'admin',
        message: 'Yes! The Shade Edit formula export now generates a complete PBR JSON spec with roughness (0.12), specular F0 (0.04), and clearcoat gloss levels.',
        timestamp: Date.now() - 3600 * 1000 * 24
      }
    ]
  }
];

function getStoredLocal(): SupportInquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading inquiries from localStorage:', e);
  }
  // Initialize sample inquiries if none exist
  saveStoredLocal(SAMPLE_INQUIRIES);
  return SAMPLE_INQUIRIES;
}

function saveStoredLocal(inquiries: SupportInquiry[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inquiries));
  } catch (e) {
    console.warn('Error saving inquiries to localStorage:', e);
  }
}

/**
 * Creates a new support inquiry, persisting to Firestore and local storage.
 */
export async function createSupportInquiry(data: {
  userId?: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: InquiryCategory;
  description: string;
  images?: string[];
}): Promise<SupportInquiry> {
  const newId = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const inquiry: SupportInquiry = {
    id: newId,
    userId: data.userId || 'usr_guest',
    userName: data.userName.trim() || 'Studio Resident',
    userEmail: data.userEmail.trim(),
    subject: data.subject.trim(),
    category: data.category,
    description: data.description.trim(),
    images: data.images || [],
    status: 'open',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    replies: []
  };

  // Update local storage immediately for fast responsive feedback
  const localList = getStoredLocal();
  saveStoredLocal([inquiry, ...localList]);

  // Try writing to Firestore
  try {
    await setDoc(doc(db, 'support_inquiries', newId), inquiry);
  } catch (err) {
    console.warn('Could not write inquiry to Firestore (saved locally):', err);
  }

  return inquiry;
}

/**
 * Fetch all support inquiries for admin portal.
 */
export async function getAllInquiries(): Promise<SupportInquiry[]> {
  try {
    const q = query(collection(db, 'support_inquiries'), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const firestoreList: SupportInquiry[] = [];
      snapshot.forEach(d => {
        firestoreList.push(d.data() as SupportInquiry);
      });
      // Merge with any local offline ones
      const localList = getStoredLocal();
      const map = new Map<string, SupportInquiry>();
      firestoreList.forEach(item => map.set(item.id, item));
      localList.forEach(item => {
        if (!map.has(item.id)) map.set(item.id, item);
      });
      const combined = Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      saveStoredLocal(combined);
      return combined;
    }
  } catch (err) {
    console.warn('Could not fetch inquiries from Firestore, using local cache:', err);
  }

  return getStoredLocal();
}

/**
 * Fetch inquiries for a specific user.
 */
export async function getUserInquiries(userEmail: string, userId?: string): Promise<SupportInquiry[]> {
  const all = await getAllInquiries();
  const normalizedEmail = userEmail.toLowerCase().trim();
  
  return all.filter(inq => {
    const emailMatch = inq.userEmail.toLowerCase().trim() === normalizedEmail;
    const uidMatch = userId && inq.userId === userId;
    // Also include default demo inquiries for christina
    const isChristina = normalizedEmail.includes('christina') || inq.userEmail.toLowerCase().includes('christina');
    return emailMatch || uidMatch || isChristina;
  });
}

/**
 * Admin adds a reply to an inquiry and optionally updates status.
 */
export async function addAdminReply(
  inquiryId: string, 
  message: string, 
  adminEmail: string = 'admin@tryonbeauty.app',
  newStatus: InquiryStatus = 'in_progress'
): Promise<SupportInquiry | null> {
  const all = getStoredLocal();
  const index = all.findIndex(i => i.id === inquiryId);
  if (index === -1) return null;

  const reply: InquiryReply = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: 'TryON Creator Support',
    senderEmail: adminEmail,
    senderRole: 'admin',
    message: message.trim(),
    timestamp: Date.now()
  };

  const updated: SupportInquiry = {
    ...all[index],
    status: newStatus,
    updatedAt: Date.now(),
    replies: [...(all[index].replies || []), reply],
    resolvedAt: newStatus === 'resolved' || newStatus === 'closed' ? Date.now() : all[index].resolvedAt
  };

  all[index] = updated;
  saveStoredLocal(all);

  try {
    await updateDoc(doc(db, 'support_inquiries', inquiryId), {
      status: updated.status,
      updatedAt: updated.updatedAt,
      replies: updated.replies,
      ...(updated.resolvedAt ? { resolvedAt: updated.resolvedAt } : {})
    });
  } catch (err) {
    console.warn('Could not update inquiry in Firestore (updated locally):', err);
  }

  return updated;
}

/**
 * User adds a follow-up reply to an inquiry.
 */
export async function addUserReply(
  inquiryId: string, 
  message: string, 
  userName: string,
  userEmail: string
): Promise<SupportInquiry | null> {
  const all = getStoredLocal();
  const index = all.findIndex(i => i.id === inquiryId);
  if (index === -1) return null;

  const reply: InquiryReply = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: userName || 'User',
    senderEmail: userEmail,
    senderRole: 'user',
    message: message.trim(),
    timestamp: Date.now()
  };

  const updated: SupportInquiry = {
    ...all[index],
    status: 'open', // Reopen inquiry when user replies
    updatedAt: Date.now(),
    replies: [...(all[index].replies || []), reply]
  };

  all[index] = updated;
  saveStoredLocal(all);

  try {
    await updateDoc(doc(db, 'support_inquiries', inquiryId), {
      status: updated.status,
      updatedAt: updated.updatedAt,
      replies: updated.replies
    });
  } catch (err) {
    console.warn('Could not update inquiry in Firestore (updated locally):', err);
  }

  return updated;
}

/**
 * Update inquiry status (e.g. user or admin resolves/closes/reopens inquiry).
 */
export async function updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<SupportInquiry | null> {
  const all = getStoredLocal();
  const index = all.findIndex(i => i.id === inquiryId);
  if (index === -1) return null;

  const updated: SupportInquiry = {
    ...all[index],
    status,
    updatedAt: Date.now(),
    resolvedAt: (status === 'resolved' || status === 'closed') ? Date.now() : undefined
  };

  all[index] = updated;
  saveStoredLocal(all);

  try {
    await updateDoc(doc(db, 'support_inquiries', inquiryId), {
      status,
      updatedAt: updated.updatedAt,
      ...(updated.resolvedAt ? { resolvedAt: updated.resolvedAt } : {})
    });
  } catch (err) {
    console.warn('Could not update inquiry status in Firestore (updated locally):', err);
  }

  return updated;
}
