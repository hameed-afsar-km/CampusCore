import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// This is a one-time recovery script to re-add a lost admin record
// Since the Firebase Auth record might still exist, we just reconstruct the Firestore mirror
export async function restoreAdminRecord(uid: string, email: string, name: string) {
  try {
    const adminRef = doc(db, "users", uid);
    await setDoc(adminRef, {
      uid,
      email,
      displayName: name,
      role: "admin",
      department: "GLOABL ADMINISTRATION",
      photoURL: "",
      createdAt: serverTimestamp(),
    });
    console.log("✅ Admin record restored successfully for:", email);
  } catch (error) {
    console.error("❌ Failed to restore admin record:", error);
  }
}

// Example usage:
// restoreAdminRecord("UID_OF_YOUR_ADMIN", "admin@campus.edu", "Main Admin");
