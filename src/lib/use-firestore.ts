"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  getDocs,
  setDoc,
  or,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./auth-context";

export function useFirestore<T extends { id?: string }>(
  collectionName: string,
  userSpecific: boolean = true
) {
  const { user, userData } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userSpecific && !user) {
      setData([]);
      setLoading(false);
      return;
    }

    const colRef = collection(db, collectionName);
    let q = query(colRef, orderBy("createdAt", "desc"));

    // Admins always see everything
    const isAdmin = userData?.role === 'admin';

    if (userSpecific && user && !isAdmin) {
      q = query(
        colRef, 
        or(
          where("userId", "==", user.uid),
          where("collaborators", "array-contains", user.uid)
        ),
        orderBy("createdAt", "desc")
      );
    }

    let unsubscribe: () => void;
    
    const startListener = (currentQuery: any, isFallback: boolean = false) => {
      return onSnapshot(
        currentQuery,
        (snapshot: any) => {
          const items: T[] = [];
          snapshot.forEach((doc: any) => {
            items.push({ id: doc.id, ...doc.data() } as T);
          });
          setData(items);
          setError(null);
          setLoading(false);
        },
        (err) => {
          if (!isFallback && user) {
            console.warn(`Firestore [${collectionName}] complex query failed. Falling back to simple ownership query...`, err.message);
            const fallbackQuery = query(
              collection(db, collectionName),
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc")
            );
            if (unsubscribe) unsubscribe();
            unsubscribe = startListener(fallbackQuery, true);
          } else {
            console.error(`Firestore [${collectionName}] fatal error:`, err);
            setError(err instanceof Error ? err : new Error(String(err)));
            setLoading(false);
          }
        }
      );
    };

    unsubscribe = startListener(q);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, user?.uid, userData?.role, userSpecific]);

  const add = async (item: Omit<T, "id">) => {
    if (userSpecific && !user) throw new Error("User must be logged in to add data.");
    const colRef = collection(db, collectionName);
    
    const payload: any = {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (userSpecific && user?.uid) {
      payload.userId = user.uid;
    }
    
    return await addDoc(colRef, payload);
  };

  const update = async (id: string, item: Partial<T>) => {
    const docRef = doc(db, collectionName, id);
    // Remove any undefined values to prevent Firestore errors
    const safeItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
    return await updateDoc(docRef, {
      ...safeItem,
      updatedAt: serverTimestamp(),
    });
  };

  const remove = async (id: string) => {
    const docRef = doc(db, collectionName, id);
    return await deleteDoc(docRef);
  };

  return { data, loading, error, add, update, remove };
}

/**
 * Specialized hook for a single document (e.g., user profiles, settings)
 */
export function useFirestoreDoc<T>(collectionName: string, docId: string | undefined) {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: any) => {
        console.error(`[Firestore Error] Collection: ${collectionName}`, {
          code: err.code,
          message: err.message,
          uid: user?.uid || "NULL" // Use user from useAuth()
        });
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId, user?.uid]); // Added user?.uid to dependencies

  const upsert = async (item: Partial<T>) => {
    if (!docId) throw new Error("DocId is required for upsert.");
    const docRef = doc(db, collectionName, docId);
    return await setDoc(docRef, {
      ...item,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  return { data, loading, error, upsert };
}
