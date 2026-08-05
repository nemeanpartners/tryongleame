import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, collection, getDocs, addDoc, updateDoc, doc, increment, arrayUnion, query, orderBy, limit, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBdKGptmjaFKURh0vMkyNyA-y-WhP9ozKo",
  authDomain: "kobella-39c79.firebaseapp.com",
  projectId: "kobella-39c79",
  storageBucket: "kobella-39c79.firebasestorage.app",
  messagingSenderId: "729820542986",
  appId: "1:729820542986:web:7fbec6a8ab9dfaea8847f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with custom database ID as the third argument
export const db = initializeFirestore(app, {}, "ai-studio-tryonbeautylookl-ab92ce94-89bf-43fe-8f79-10fcc718998b");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { collection, getDocs, addDoc, updateDoc, doc, increment, arrayUnion, query, orderBy, limit, setDoc };

