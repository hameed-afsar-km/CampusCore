
import { db } from "./firebase";
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp, query, where } from "firebase/firestore";

async function resetInstitution() {
  console.log("🚀 Starting Institutional Reset Process...");

  try {
    // 1. Clear all Faculty (Professors)
    const usersRef = collection(db, "users");
    const profQuery = query(usersRef, where("role", "==", "professor"));
    const profSnap = await getDocs(profQuery);
    
    console.log(`🗑️ Deleting ${profSnap.size} Faculty accounts...`);
    for (const d of profSnap.docs) {
      await deleteDoc(doc(db, "users", d.id));
    }

    // 2. Clear Students (Optional but usually desired for a "fresh start")
    const studentQuery = query(usersRef, where("role", "==", "student"));
    const studentSnap = await getDocs(studentQuery);
    console.log(`🗑️ Deleting ${studentSnap.size} Student accounts...`);
    for (const d of studentSnap.docs) {
      await deleteDoc(doc(db, "users", d.id));
    }

    // 3. Reset/Create Master Admin
    const adminEmail = "admin@campus.edu";
    const adminUid = "admin_master_001"; // Consistent UID for the seed admin
    
    const adminData = {
      uid: adminUid,
      email: adminEmail,
      displayName: "Chancellor Admin",
      role: "admin",
      department: "GOVERNANCE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", adminUid), adminData);
    console.log(`✅ Master Admin [${adminEmail}] Restored successfully.`);

    // 4. Clear Subjects and Timetable for total fresh start
    const collectionsToClear = ["subjects", "timetable", "attendance_logs"];
    for (const colName of collectionsToClear) {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      console.log(`🗑️ Clearing ${snap.size} records from [${colName}]...`);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, colName, d.id));
      }
    }

    console.log("✨ Reset Complete. You can now login with admin@campus.edu / CampusCore@123");
  } catch (error) {
    console.error("❌ Reset Failed:", error);
  }
}

resetInstitution();
