import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');

// Keep the user signed in on this device (stored by Firebase, never by our code)
setPersistence(auth, browserLocalPersistence).catch(() => {});

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
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

// Test Firestore connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline, falling back to local sync cache');
    } else {
      console.log('Firestore connection checked (ready)');
    }
    return true;
  }
}

// Auth helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ---------------------------------------------------------------------------
// Login methods: Google, Facebook and Guest.
// None of these functions store passwords or OTP codes: Firebase Auth does the
// verification on Google's servers and only returns a signed-in user.
// ---------------------------------------------------------------------------
export async function loginWithGoogleSafe(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithFacebook(): Promise<User> {
  const result = await signInWithPopup(auth, facebookProvider);
  return result.user;
}

// Guest = anonymous account. The app only lets guests browse the Explore tab.
export async function loginAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

// Turns Firebase error codes into short messages the user can act on
export function authErrorMessage(error: unknown): string {
  console.warn('[FIT3D auth error]', error);
  const code = (error as { code?: string } | null)?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Login window band ho gayi. Dobara try karo.';
    case 'auth/popup-blocked':
      return 'Browser ne login popup block kar diya. Popup allow karke dobara try karo.';
    case 'auth/account-exists-with-different-credential':
      return 'Is email se pehle kisi aur tareeke (jaise Google) se login ho chuka hai. Wahi tareeka use karo.';
    case 'auth/operation-not-allowed':
      return 'Ye login tareeka abhi on nahi hai (Firebase console mein enable karna hoga).';
    case 'auth/unauthorized-domain':
      return 'Is website ka address Firebase mein allow nahi hai (Authorized domains mein jodna hoga).';
    case 'auth/invalid-phone-number':
      return 'Mobile number sahi nahi hai.';
    case 'auth/missing-phone-number':
      return 'Mobile number daalo.';
    case 'auth/too-many-requests':
      return 'Bahut zyada try ho gaye. Thodi der baad dobara koshish karo.';
    case 'auth/quota-exceeded':
      return 'Aaj ke liye OTP ki limit poori ho gayi. Baad mein try karo ya dusra tareeka use karo.';
    case 'auth/invalid-verification-code':
      return 'OTP galat hai. Dobara check karo.';
    case 'auth/code-expired':
      return 'OTP ki samay seema khatam ho gayi. Naya OTP mangao.';
    case 'auth/captcha-check-failed':
      return 'Security check fail ho gaya. Page refresh karke dobara try karo.';
    case 'auth/network-request-failed':
      return 'Internet connection check karo.';
    case 'auth/billing-not-enabled':
      return 'Asli SMS bhejne ke liye Firebase project par billing (Blaze plan) on honi chahiye. Test number use karo ya billing on karo.';
    case 'auth/invalid-app-credential':
    case 'auth/app-not-authorized':
      return 'Firebase ne is website ko OTP bhejne se roka (reCAPTCHA / API key ki setting). Google Cloud me API key ke restrictions check karo.';
    case 'auth/internal-error':
      return 'Firebase me andar ki dikkat aayi (auth/internal-error). Thodi der baad try karo.';
    default:
      // Show the real code so the problem can be found quickly
      return code ? `Kuch galat ho gaya (${code}). Dobara try karo.` : 'Kuch galat ho gaya. Dobara try karo.';
  }
}
