"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
  FileText,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  BookOpen,
} from "lucide-react";

export default function SharePage() {
  const router = useRouter();
  const params = useParams();
  const { user, userData } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate type and mapping
  const typeMap: Record<string, { col: string; title: string; route: string; icon: React.ReactNode }> = {
    notes: { col: "notes", title: "Note", route: "/notes", icon: <FileText className="w-12 h-12 text-purple-400" /> },
    assignments: { col: "assignments", title: "Assignment", route: "/assignments", icon: <FolderOpen className="w-12 h-12 text-emerald-400" /> },
    exams: { col: "exams", title: "Exam/Study Material", route: "/exams", icon: <BookOpen className="w-12 h-12 text-cyan-400" /> },
  };

  const typeParam = params.type as string;
  const idParam = params.id as string;
  const config = typeMap[typeParam];

  useEffect(() => {
    if (!config || !idParam) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }

    const fetchDoc = async () => {
      try {
        const docRef = doc(db, config.col, idParam);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const item = snapshot.data();
          setData({ id: snapshot.id, ...item });
          
          // Check if already collaborated or owned
          if (user?.uid === item.userId || (item.collaborators && item.collaborators.includes(user?.uid))) {
            setSuccess(true);
            setTimeout(() => router.push(config.route), 2000);
          }
        } else {
          setError("Resource not found or has been deleted.");
        }
      } catch (err) {
        console.error("Error fetching shared item:", err);
        setError("Failed to load resource.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [config, idParam, user, router]);

  const handleJoin = async () => {
    if (!user || !data || !config) return;
    setJoining(true);
    try {
      const docRef = doc(db, config.col, data.id);
      await updateDoc(docRef, {
        collaborators: arrayUnion(user.uid),
      });
      setSuccess(true);
      setTimeout(() => router.push(config.route), 1500);
    } catch (err) {
      console.error("Join error:", err);
      setError("Failed to add to your workspace.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-400">Loading shared resource...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Access Error</h2>
        <p className="text-gray-400 text-center max-w-md">{error || "Invalid link."}</p>
        <button onClick={() => router.push("/dashboard")} className="mt-6 px-6 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-xl transition-all border border-white/[0.1]">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dash-card p-8 border-purple-500/30 bg-purple-500/5 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-white/[0.03] border border-white/[0.1] flex items-center justify-center shadow-xl">
              {config.icon}
            </div>
            {data.type && (
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white border border-purple-400">
                {data.type}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 line-clamp-2">
          {data.name || data.title || "Untitled Collaboration"}
        </h1>
        <p className="text-gray-400 mb-8">{config.title} • {data.subject}</p>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Added to your workspace! Redirecting...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-sm text-gray-400">
              <p>You have been invited to collaborate on this {config.title.toLowerCase()}. Adding it to your workspace will give you access to view and manage it alongside the owner.</p>
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2 shadow-purple-500/20 shadow-lg"
            >
              {joining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Add to My CampusCore <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
