"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "student" | "professor" | "admin";

export const CRESCENT_EMAIL_REGEX = /^[0-9]{12}@crescent\.education$/;
export const ALLOWED_STAFF_EMAILS = [
  "123456789012@crescent.education", // Add authorized staff emails here
  "098765432109@crescent.education",
];

export const validateEmailAndRole = (email: string | null, role: UserRole) => {
  if (!email) throw new Error("Email is required");
  if (!CRESCENT_EMAIL_REGEX.test(email)) {
    throw new Error("Invalid email format. Format must be: 12-digits followed by @crescent.education");
  }
  if (role === "professor" && !ALLOWED_STAFF_EMAILS.includes(email)) {
    throw new Error("This email is not authorized for Faculty/Professor access.");
  }
};

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<void>;
  signInGoogle: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
        } as UserData);
      }
    } catch (err: any) {
      console.error("Firestore fetch error:", err);
      // If offline, we might still have user object but no userData
      // We don't throw here to avoid blocking the whole app if 
      // the user is authenticated but Firestore is being flaky.
    }
  };

  // Listen for auth changes
  useEffect(() => {
    // Safety guard for Vercel builds or missing environment variables
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Email/Password Sign In
  const signInEmail = async (email: string, password: string) => {
    try {
      validateEmailAndRole(email, "student");
      
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Attempt to check roles if online, but don't block login if offline
      // since the Auth state is already local.
      try {
        const docRef = doc(db, "users", cred.user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userRole = (docSnap.data() as UserData).role;
          if (userRole === "professor" && !ALLOWED_STAFF_EMAILS.includes(email)) {
            await signOut(auth);
            throw new Error("This email is no longer authorized for Faculty access.");
          }
        }
      } catch (dbErr) {
        console.warn("DB check failed during sign-in, proceeding with auth state:", dbErr);
      }
      
      await fetchUserData(cred.user.uid);
    } catch (err: any) {
      if (err.message?.includes("offline")) {
        throw new Error("Connection failed. Please check your internet and Firebase configuration.");
      }
      throw err;
    }
  };

  // Email/Password Sign Up
  const signUpEmail = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => {
    validateEmailAndRole(email, role);

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Create user doc in Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: name,
      role,
      photoURL: cred.user.photoURL || "",
      createdAt: serverTimestamp(),
    });

    await fetchUserData(cred.user.uid);
  };

  // Google Sign In
  const signInGoogle = async (role: UserRole) => {
    const result = await signInWithPopup(auth, googleProvider);
    
    try {
      // Google doesn't securely know their role unless we enforce it at sign-up
      // However, if the user doc already exists, we use their existing role.
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);

      const actualRole = userSnap.exists() ? (userSnap.data() as UserData).role : role;
      
      validateEmailAndRole(result.user.email, actualRole);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "",
          role: actualRole,
          photoURL: result.user.photoURL || "",
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      await result.user.delete().catch(() => {});
      await signOut(auth);
      throw e;
    }

    await fetchUserData(result.user.uid);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInEmail,
        signUpEmail,
        signInGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
