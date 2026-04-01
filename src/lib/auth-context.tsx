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
import { auth, secondaryAuth, db } from "@/lib/firebase";

export type UserRole = "student" | "professor" | "admin";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  // Class-linked fields (students)
  classId?: string;     // FK → classes/{classId}
  department?: string;
  section?: string;
  year?: number;
  semester?: number;
  // Professor-specific
  staffId?: string;
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
    role: UserRole,
    department?: string,
    section?: string
  ) => Promise<void>;
  adminCreateUser: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    department?: string,
    section?: string,
    staffId?: string
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
    }
  };

  useEffect(() => {
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

  const signInEmail = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(cred.user.uid);
    } catch (err: any) {
      if (err.message?.includes("offline")) {
        throw new Error("Connection failed. Please check your internet and Firebase configuration.");
      }
      throw err;
    }
  };

  const signUpEmail = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    department?: string,
    section?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const userDataObj: any = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: name,
      role,
      photoURL: cred.user.photoURL || "",
      createdAt: serverTimestamp(),
    };
    if (department) userDataObj.department = department;
    if (section) userDataObj.section = section;

    await setDoc(doc(db, "users", cred.user.uid), userDataObj);

    await fetchUserData(cred.user.uid);
  };

  const adminCreateUser = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    department?: string,
    section?: string,
    staffId?: string
  ) => {
    if (!secondaryAuth) throw new Error("Secondary auth not initialized.");
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const userDataObj: any = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: name,
      role,
      photoURL: cred.user.photoURL || "",
      createdAt: serverTimestamp(),
    };
    if (department) userDataObj.department = department;
    if (section) userDataObj.section = section;
    if (staffId) userDataObj.staffId = staffId;

    await setDoc(doc(db, "users", cred.user.uid), userDataObj);

    // Sign out from the secondary auth so it's clean for the next use
    await signOut(secondaryAuth);
  };

  const signInGoogle = async (role: UserRole) => {
    const result = await signInWithPopup(auth, googleProvider);
    
    try {
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);

      const actualRole = userSnap.exists() ? (userSnap.data() as UserData).role : role;
      
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
        adminCreateUser,
        signInGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
