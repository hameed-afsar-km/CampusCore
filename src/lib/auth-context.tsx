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
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data() as UserData);
    }
  };

  // Listen for auth changes
  useEffect(() => {
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
    // We only enforce formatting for new signs/logins just to be safe. But wait, admins don't use this currently?
    // Actually the user said "Only those are allowed." so let's validate login too.
    const userRoleDoc = await getDoc(doc(db, "userRoles", email)); 
    // Wait, role is determined after login. Since we don't have role at login until we fetch user data,
    // let's validate the regex pattern first.
    validateEmailAndRole(email, "student"); // Check format only here (role check is ignored since student)
    
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const docRef = doc(db, "users", cred.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
       const userRole = (docSnap.data() as UserData).role;
       if (userRole === "professor" && !ALLOWED_STAFF_EMAILS.includes(email)) {
          await signOut(auth);
          throw new Error("This email is no longer authorized for Faculty access.");
       }
    }
    await fetchUserData(cred.user.uid);
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
