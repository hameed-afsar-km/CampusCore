import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4qYGwVMvztuKzIpf7vZFPCf-wjmwnpzs",
  authDomain: "campuscore-827b1.firebaseapp.com",
  projectId: "campuscore-827b1",
  storageBucket: "campuscore-827b1.firebasestorage.app",
  messagingSenderId: "95859449655",
  appId: "1:95859449655:web:55c73f1cdc1a051c5084b2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const accounts = [
  { email: "admin2@campuscore.com", password: "password123", name: "Super Admin", role: "admin" },
  { email: "prof.smith@campuscore.com", password: "password123", name: "Prof. John Smith", role: "professor" },
  { email: "prof.doe@campuscore.com", password: "password123", name: "Prof. Jane Doe", role: "professor" },
  { email: "prof.adams@campuscore.com", password: "password123", name: "Prof. Robert Adams", role: "professor" },
  { email: "prof.clark@campuscore.com", password: "password123", name: "Prof. Sarah Clark", role: "professor" },
  { email: "prof.evans@campuscore.com", password: "password123", name: "Prof. Michael Evans", role: "professor" }
];

async function seed() {
  for (const acc of accounts) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, acc.email, acc.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: acc.email,
        displayName: acc.name,
        role: acc.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`Created ${acc.role}: ${acc.email}`);
    } catch (err) {
      console.log(`Failed to create ${acc.email}: ${err.message}`);
    }
  }
  process.exit(0);
}

seed();
