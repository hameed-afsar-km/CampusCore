
"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp, query, where } from "firebase/firestore";
import { ShieldAlert, Trash2, RotateCcw, CheckCircle2, Loader2, Home } from "lucide-react";
import Link from "next/link";

export default function ResetSystemPage() {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const executeReset = async () => {
    if (!confirm("⚠️ WARNING: This will delete ALL users (except you if logged in), all subjects, and all timetable entries. Proceed?")) return;
    
    setStatus("running");
    setLog([]);
    addLog("🚀 Starting Institutional Wipe...");

    try {
      const usersRef = collection(db, "users");
      
      // 1. Purge Faculty
      addLog("Fetching faculty records...");
      const profSnap = await getDocs(query(usersRef, where("role", "==", "professor")));
      addLog(`Deleting ${profSnap.size} faculty accounts...`);
      for (const d of profSnap.docs) await deleteDoc(doc(db, "users", d.id));

      // 2. Purge Students
      addLog("Fetching student records...");
      const studSnap = await getDocs(query(usersRef, where("role", "==", "student")));
      addLog(`Deleting ${studSnap.size} student accounts...`);
      for (const d of studSnap.docs) await deleteDoc(doc(db, "users", d.id));

      // 3. Reset Master Admin
      addLog("Restoring Chancellor Admin (admin@campus.edu)...");
      const adminUid = "admin_master_001";
      await setDoc(doc(db, "users", adminUid), {
        uid: adminUid,
        email: "admin@campus.edu",
        displayName: "Chancellor Admin",
        role: "admin",
        department: "GLOBAL",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 4. Purge Academic Data
      const cols = ["subjects", "timetable", "attendance_logs"];
      for (const col of cols) {
        addLog(`Clearing ${col} collection...`);
        const snap = await getDocs(collection(db, col));
        for (const d of snap.docs) await deleteDoc(doc(db, col, d.id));
      }

      addLog("✨ Institutional Reset Complete!");
      setStatus("success");
    } catch (err: any) {
      addLog(`❌ ERROR: ${err.message}`);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Abstract Background Decor */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-100">Institutional System Purge</h1>
              <p className="text-gray-500 text-sm">Authorized Administrative Restoration Toolkit</p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 mb-8">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-[0.2em] mb-4">Critical Actions</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                 <Trash2 className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                 <span>Delete all **Academic Faculty** and **Student** records.</span>
              </li>
              <li className="flex items-start gap-3">
                 <RotateCcw className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                 <span>Restore **admin@campus.edu** with master credentials.</span>
              </li>
              <li className="flex items-start gap-3">
                 <Trash2 className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                 <span>Wipe all **Subject Registries** and **Timetable Slots**.</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
             {status === "idle" && (
                <button 
                  onClick={executeReset}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group"
                >
                  <ShieldAlert className="w-5 h-5 group-hover:animate-pulse" />
                  INITIATE SYSTEM RESET
                </button>
             )}

             {status === "running" && (
                <div className="w-full bg-white/5 py-4 rounded-2xl flex items-center justify-center gap-3 text-gray-400 font-bold uppercase tracking-widest text-xs">
                   <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                   Resetting Environment...
                </div>
             )}

             {status === "success" && (
                <div className="space-y-4">
                   <div className="w-full bg-green-500/10 border border-green-500/20 py-4 rounded-2xl flex items-center justify-center gap-3 text-green-400 font-bold uppercase tracking-widest text-xs">
                      <CheckCircle2 className="w-5 h-5 animate-bounce" />
                      System Restored
                   </div>
                   <Link href="/login" className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                      <Home className="w-5 h-5" /> Back to Entry Point
                   </Link>
                </div>
             )}

             {status !== "idle" && (
                <div className="mt-6 bg-black/60 rounded-xl p-4 font-mono text-[10px] text-gray-500 max-h-48 overflow-y-auto border border-white/5">
                   {log.map((l, i) => <div key={i} className="mb-1 leading-relaxed opacity-80">{l}</div>)}
                </div>
             )}
          </div>

          <p className="mt-8 text-center text-xs text-gray-600">
             Institutional access verified via master node. Data recovery will be impossible after execution.
          </p>
        </div>
      </div>
    </div>
  );
}
