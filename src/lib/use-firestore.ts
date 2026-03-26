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
  const { user } = useAuth();
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

    if (userSpecific && user) {
      q = query(
        colRef, 
        or(
          where("userId", "==", user.uid),
          where("collaborators", "array-contains", user.uid)
        ),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, user?.uid, userSpecific]);

  const add = async (item: Omit<T, "id">) => {
    if (userSpecific && !user) throw new Error("User must be logged in to add data.");
    const colRef = collection(db, collectionName);
    return await addDoc(colRef, {
      ...item,
      userId: userSpecific ? user?.uid : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const update = async (id: string, item: Partial<T>) => {
    const docRef = doc(db, collectionName, id);
    return await updateDoc(docRef, {
      ...item,
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
      (err) => {
        console.error(`Error fetching ${collectionName}/${docId}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

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
