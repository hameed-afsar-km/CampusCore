"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, XCircle, RotateCcw, 
  TrendingUp, Calendar, BookOpen, AlertCircle,
  Hash, ClipboardCheck, Info, Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

interface SubjectAttendance {
  attended: number;
  total: number;
}

export default function AttendancePage() {
  const { userData } = useAuth();
  const { data: allSubjects } = useFirestore<any>("subjects", false);
  const [attendanceData, setAttendanceData] = useState<Record<string, SubjectAttendance>>({});
  const [loading, setLoading] = useState(true);

  // Auto-sync subjects based on student's semester, department
  const mySubjects = useMemo(() => {
    if (!userData || userData.role !== 'student') return [];
    return allSubjects.filter((s: any) => 
      s.department === userData.department && 
      s.semester === userData.semester &&
      (s.section === userData.section || !s.section) // Allow global subjects or section-specific ones
    );
  }, [allSubjects, userData]);

  // Real-time listener for student's specific attendance record
  useEffect(() => {
    if (!userData?.uid) return;
    
    const unsubscribe = onSnapshot(doc(db, "attendance", userData.uid), (docSnap) => {
      if (docSnap.exists()) {
        setAttendanceData(docSnap.data().subjects || {});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  const updateAttendance = async (subCode: string, type: 'attended' | 'absent') => {
    if (!userData?.uid) return;
    
    const current = attendanceData[subCode] || { attended: 0, total: 0 };
    const newData = {
      ...attendanceData,
      [subCode]: {
        attended: type === 'attended' ? current.attended + 1 : current.attended,
        total: current.total + 1
      }
    };

    await setDoc(doc(db, "attendance", userData.uid), { subjects: newData }, { merge: true });
  };

  const clearSubjectData = async (subCode: string) => {
    if (!userData?.uid) return;
    const newData = { ...attendanceData };
    delete newData[subCode];
    await setDoc(doc(db, "attendance", userData.uid), { subjects: newData }, { merge: true });
  };

  const calculateStats = (attended: number, total: number) => {
    if (total === 0) return { percentage: 0, status: 'N/A', color: 'text-gray-500', leaves: 0 };
    const percentage = (attended / total) * 100;
    
    // Threshold is 75%
    // To maintain 75%: (attended / (total + x)) >= 0.75 => attended / 0.75 >= total + x => x = (attended/0.75) - total
    const maxTotalPossible = Math.floor(attended / 0.75);
    const leaves = Math.max(0, maxTotalPossible - total);

    let status = 'On Track';
    let color = 'text-emerald-400';
    if (percentage < 75) {
      status = 'Critical';
      color = 'text-red-400';
    } else if (percentage < 85) {
      status = 'Caution';
      color = 'text-amber-400';
    }

    return { percentage: Math.round(percentage), status, color, leaves };
  };

  if (userData?.role !== 'student') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-gray-500">
           <ClipboardCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Faculty Attendance Panel</h1>
        <p className="text-gray-500 max-w-sm">The faculty view for marking bulk class attendance is currently being optimized. Please use the mobile terminal for real-time tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Compliance Hub</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Attendance <span className="text-gray-500">Oracle</span></h1>
          <p className="text-gray-500 text-xs mt-1 font-medium italic">Auto-synced for {userData.department} • Semester {userData.semester}</p>
        </div>

        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] px-6 py-3 rounded-2xl">
          <div className="text-center border-r border-white/[0.08] pr-6">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-bold text-emerald-400 uppercase">Active</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Compliance</p>
            <p className="text-sm font-bold text-white">75% Min.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mySubjects.map((subject: any) => {
          const stats = attendanceData[subject.code] || { attended: 0, total: 0 };
          const { percentage, status, color, leaves } = calculateStats(stats.attended, stats.total);

          return (
            <motion.div 
              key={subject.id}
              whileHover={{ y: -5 }}
              className="bg-[#050505] border border-white/[0.08] rounded-[2rem] p-6 space-y-6 relative overflow-hidden group transition-all hover:border-white/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-cyan-500/60 uppercase font-black tracking-widest">{subject.code}</span>
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{subject.name}</h3>
                </div>
                <button 
                  onClick={() => confirm("Clear all attendance data for this subject?") && clearSubjectData(subject.code)}
                  className="p-2 text-gray-700 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center">
                   <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Percentage</p>
                   <p className={`text-2xl font-black ${color}`}>{percentage}%</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center">
                   <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Leaves Left</p>
                   <p className="text-2xl font-black text-white">{leaves}</p>
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                   <span className="text-gray-500">Attendance Log</span>
                   <span className={color}>{status}</span>
                 </div>
                 <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full ${percentage < 75 ? 'bg-red-500' : 'bg-cyan-500'}`}
                    />
                 </div>
                 <div className="flex justify-between text-[10px] font-mono text-gray-600">
                    <span>{stats.attended} Attended</span>
                    <span>{stats.total} Total Sessions</span>
                 </div>
              </div>

              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => updateAttendance(subject.code, 'attended')}
                   className="flex-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 className="w-3.5 h-3.5" /> Present
                 </button>
                 <button 
                    onClick={() => updateAttendance(subject.code, 'absent')}
                    className="flex-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                 >
                   <XCircle className="w-3.5 h-3.5" /> Mark Bunk
                 </button>
              </div>
            </motion.div>
          );
        })}

        {mySubjects.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-white/[0.05] rounded-[3rem]">
            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto text-gray-600">
               <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
               <h3 className="text-white font-bold text-lg">No Subjects Allotted</h3>
               <p className="text-gray-500 text-sm max-w-xs mx-auto">It appears there are no subjects mapped to Semester {userData.semester} for the {userData.department} department yet.</p>
            </div>
          </div>
        )}
      </div>

      {/* Advisory Footer */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex items-start gap-4">
         <div className="mt-1"><Info className="w-5 h-5 text-amber-500" /></div>
         <div className="space-y-1">
            <h4 className="text-amber-500 font-bold text-sm uppercase tracking-widest">Compliance Advisory</h4>
            <p className="text-amber-500/60 text-xs leading-relaxed">
              Maintain a minimum of 75% to remain eligible for examinations. The "Leaves Left" calculation assumes you will attend all subsequent sessions. If your attendance falls below the threshold, it will transition to "Critical" status immediately.
            </p>
         </div>
      </div>
    </div>
  );
}
