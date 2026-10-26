import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  // @ts-expect-error - getReactNativePersistence is provided by React Native bundle of firebase/auth
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  FirebaseStorage,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  uploadString,
} from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ClothingCategory,
  ClothingItem,
  CreateClothingItemInput,
  UpdateClothingItemInput,
} from '@/types/wardrobe';

// Environment variables
const clean = (val?: string) => (val || '').replace(/^["']|["']$/g, '').trim();

const FIREBASE_API_KEY = clean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
const FIREBASE_AUTH_DOMAIN = clean(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN);
const FIREBASE_PROJECT_ID = clean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
const FIREBASE_STORAGE_BUCKET = clean(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET);
const FIREBASE_MESSAGING_SENDER_ID = clean(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
const FIREBASE_APP_ID = clean(process.env.EXPO_PUBLIC_FIREBASE_APP_ID);

export const isFirebaseConfigured: boolean =
  Boolean(FIREBASE_API_KEY) &&
  Boolean(FIREBASE_PROJECT_ID) &&
  !FIREBASE_API_KEY.includes('your-') &&
  !FIREBASE_PROJECT_ID.includes('your-');

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    try {
      authInstance = initializeAuth(appInstance, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = getAuth(appInstance);
    }

    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
  } catch (err) {
    console.warn('[firebase] Initialization error:', err);
  }
}

export const firebaseApp = appInstance;
export const firebaseAuth = authInstance;
export const firestoreDb = dbInstance;
export const firebaseStorage = storageInstance;

// =============================================================================
// Authentication Helpers
// =============================================================================

/**
 * Sign in anonymously (instant guest mode without password friction)
 */
export async function signInAsGuest(): Promise<User | null> {
  if (!firebaseAuth) return null;
  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  fullName?: string
): Promise<User> {
  if (!firebaseAuth) throw new Error('Firebase Auth is not configured.');
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  if (fullName && credential.user) {
    await updateProfile(credential.user, { displayName: fullName }).catch(() => {});
  }
  return credential.user;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  if (!firebaseAuth) throw new Error('Firebase Auth is not configured.');
  const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  return credential.user;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  if (firebaseAuth) {
    await fbSignOut(firebaseAuth);
  }
}

/**
 * Listen for Firebase Auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!firebaseAuth) return () => {};
  return onAuthStateChanged(firebaseAuth, callback);
}

// =============================================================================
// Cloud Storage Helpers (Garment Photos)
// =============================================================================

/**
 * Upload an optimized garment photo.
 * If Cloud Storage is available on Blaze, uploads to Cloud Storage.
 * If Cloud Storage requires Blaze billing (Spark plan), it gracefully
 * embeds the lightweight compressed base64 data URI into Firestore for 100% free usage!
 */
export async function uploadGarmentPhotoToFirebase(
  userId: string,
  itemId: string,
  fileUri: string,
  base64Data?: string
): Promise<{ storagePath: string | null; downloadUrl: string }> {
  const fallbackUrl = base64Data
    ? `data:image/jpeg;base64,${base64Data}`
    : fileUri;

  if (!firebaseStorage) {
    return { storagePath: null, downloadUrl: fallbackUrl };
  }

  try {
    const storagePath = `users/${userId}/clothes/${itemId}.jpg`;
    const storageRef = ref(firebaseStorage, storagePath);

    if (base64Data) {
      await uploadString(storageRef, base64Data, 'base64', {
        contentType: 'image/jpeg',
      });
    } else {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    }

    const downloadUrl = await getDownloadURL(storageRef);
    return { storagePath, downloadUrl };
  } catch {
    // Graceful Spark fallback: save lightweight base64 into Firestore with 0 credit card needed
    console.info('[firebase] Using zero-cost Firestore image storage (Spark plan)');
    return { storagePath: null, downloadUrl: fallbackUrl };
  }
}

/**
 * Delete a garment photo from Cloud Storage
 */
export async function deleteGarmentPhotoFromFirebase(storagePath: string | null): Promise<void> {
  if (!firebaseStorage || !storagePath) return;
  try {
    const storageRef = ref(firebaseStorage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('[firebase] Delete photo warning:', err);
  }
}

// =============================================================================
// Cloud Firestore Helpers (Clothing Items CRUD)
// =============================================================================

/**
 * Fetch all clothing items for the authenticated user from Firestore:
 * users/{userId}/clothes
 */
export async function fetchUserClothingItemsFromFirestore(userId: string): Promise<ClothingItem[]> {
  if (!firestoreDb) return [];

  const clothesCol = collection(firestoreDb, 'users', userId, 'clothes');
  const q = query(clothesCol, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  const items: ClothingItem[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    items.push({
      id: docSnap.id,
      userId: data.userId || userId,
      name: data.name || '',
      category: data.category as ClothingCategory,
      subcategory: data.subcategory || null,
      imagePath: data.storagePath || data.imagePath || null,
      imageUrl: data.downloadUrl || data.imageUrl || '',
      primaryColor: data.primaryColor || null,
      secondaryColors: data.secondaryColors || [],
      color: data.primaryColor || 'Neutral',
      pattern: data.pattern || null,
      style: data.style || null,
      season: data.season || null,
      formality: data.formality || null,
      brand: data.brand || null,
      notes: data.notes || null,
      availabilityStatus: data.availabilityStatus || 'available',
      inLaundry: data.availabilityStatus === 'laundry',
      timesWorn: data.timesWorn || 0,
      lastWornAt: data.lastWornAt || null,
      lastWornDate: data.lastWornAt ? data.lastWornAt.split('T')[0] : null,
      createdAt: data.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: data.updatedAt,
    });
  });

  return items;
}

/**
 * Insert a new clothing item into Firestore
 */
export async function insertClothingItemToFirestore(
  userId: string,
  itemId: string,
  downloadUrl: string,
  storagePath: string | null,
  input: CreateClothingItemInput
): Promise<ClothingItem> {
  if (!firestoreDb) {
    throw new Error('Cloud Firestore is not configured.');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const docRef = doc(firestoreDb, 'users', userId, 'clothes', itemId);

  const newDoc = {
    id: itemId,
    userId,
    name: input.name,
    category: input.category,
    subcategory: input.subcategory || null,
    downloadUrl,
    storagePath,
    primaryColor: input.primaryColor || null,
    secondaryColors: input.secondaryColors || [],
    pattern: input.pattern || null,
    style: input.style || null,
    season: input.season || null,
    formality: input.formality || null,
    brand: input.brand || null,
    notes: input.notes || null,
    availabilityStatus: input.availabilityStatus || 'available',
    timesWorn: 0,
    lastWornAt: null,
    createdAt: todayStr,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, newDoc);

  return {
    ...newDoc,
    imagePath: storagePath,
    imageUrl: downloadUrl,
    color: input.primaryColor || 'Neutral',
    inLaundry: input.availabilityStatus === 'laundry',
    lastWornDate: null,
  };
}

/**
 * Update an existing clothing item in Firestore
 */
export async function updateClothingItemInFirestore(
  userId: string,
  itemId: string,
  updates: UpdateClothingItemInput
): Promise<void> {
  if (!firestoreDb) {
    throw new Error('Cloud Firestore is not configured.');
  }

  const docRef = doc(firestoreDb, 'users', userId, 'clothes', itemId);
  const cleanUpdates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.name !== undefined) cleanUpdates.name = updates.name;
  if (updates.category !== undefined) cleanUpdates.category = updates.category;
  if (updates.subcategory !== undefined) cleanUpdates.subcategory = updates.subcategory;
  if (updates.primaryColor !== undefined) cleanUpdates.primaryColor = updates.primaryColor;
  if (updates.secondaryColors !== undefined) cleanUpdates.secondaryColors = updates.secondaryColors;
  if (updates.pattern !== undefined) cleanUpdates.pattern = updates.pattern;
  if (updates.style !== undefined) cleanUpdates.style = updates.style;
  if (updates.season !== undefined) cleanUpdates.season = updates.season;
  if (updates.formality !== undefined) cleanUpdates.formality = updates.formality;
  if (updates.brand !== undefined) cleanUpdates.brand = updates.brand;
  if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
  if (updates.availabilityStatus !== undefined) {
    cleanUpdates.availabilityStatus = updates.availabilityStatus;
  }
  if (updates.timesWorn !== undefined) cleanUpdates.timesWorn = updates.timesWorn;
  if (updates.lastWornAt !== undefined) cleanUpdates.lastWornAt = updates.lastWornAt;

  await updateDoc(docRef, cleanUpdates);
}

/**
 * Delete a clothing item from Firestore
 */
export async function deleteClothingItemFromFirestore(
  userId: string,
  itemId: string
): Promise<void> {
  if (!firestoreDb) {
    throw new Error('Cloud Firestore is not configured.');
  }

  const docRef = doc(firestoreDb, 'users', userId, 'clothes', itemId);
  await deleteDoc(docRef);
}
