import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuration with default empty strings to avoid crashing during module evaluation
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: any;
let auth: any;
let db: any;
let storage: any;

// Use a proxy or mock that doesn't crash during Next.js build-time prerendering
const createProxy = (name: string) => new Proxy({}, {
  get: () => {
    // During build time, Next.js prerenders pages. If Firebase keys are missing, 
    // we return a no-op function to prevent crashes like 'auth/invalid-api-key'.
    if (typeof window === 'undefined') return () => ({});
    throw new Error(`Firebase ${name} not initialized. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in your .env file.`);
  }
});

if (firebaseConfig.apiKey) {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
} else {
  // Graceful fallback for build-time worker threads or local dev without .env
  firebaseApp = createProxy('App');
  auth = createProxy('Auth');
  db = createProxy('Firestore');
  storage = createProxy('Storage');
}

export { auth, db, storage };
export default firebaseApp;
