"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  RotateCcw,
  BookOpen,
  CalendarDays,
  MoreVertical,
  MinusCircle,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface SubjectAttendance {
  id: string;
  name: string;
  held: number;
  attended: number;
}

export default function AttendancePage() {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", held: 0, attended: 0 });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("attendance_data");
    if (saved) {
      try {
        setSubjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse attendance data", e);
      }
    } else {
      // Mock initial data
      setSubjects([
        { id: "1", name: "Mathematics IV", held: 24, attended: 20 },
        { id: "2", name: "Operating Systems", held: 30, attended: 22 },
        { id: "3", name: "Database Systems", held: 18, attended: 15 },
      ]);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem("attendance_data", JSON.stringify(subjects));
    }
  }, [subjects]);

  const addSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    const newSubject: SubjectAttendance = {
      id: Date.now().toString(),
      name: form.name,
      held: Number(form.held) || 0,
      attended: Number(form.attended) || 0,
    };

    setSubjects(prev => [newSubject, ...prev]);
    setShowModal(false);
    setForm({ name: "", held: 0, attended: 0 });
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const logAttendance = (id: string, wasAttended: boolean) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          held: s.held + 1,
          attended: wasAttended ? s.attended + 1 : s.attended
        };
      }
      return s;
    }));
  };

  const resetAttendance = (id: string) => {
    if (!confirm("Reset all counts for this subject?")) return;
    setSubjects(prev => prev.map(s => 
      s.id === id ? { ...s, held: 0, attended: 0 } : s
    ));
  };

  const calculateStats = (s: SubjectAttendance) => {
    const percentage = s.held > 0 ? (s.attended / s.held) * 100 : 0;
    const missed = s.held - s.attended;
    
    // How many more classes can you miss?
    // formula: attended / (held + x) >= 0.75 => x <= (attended / 0.75) - held
    const safeSkips = Math.floor(s.attended / 0.75) - s.held;
    
    // How many MORE classes to attend to reach 75%?
    // formula: (attended + y) / (held + y) >= 0.75 => y >= (0.75*held - attended) / 0.25
    const needed = Math.max(0, Math.ceil((0.75 * s.held - s.attended) / 0.25));

    return { percentage, missed, safeSkips, needed };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Attendance Tracker</h1>
          <p className="text-gray-400 mt-1">Keep track of your classes and maintain the 75% goal</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Subject
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {subjects.map((sub) => {
            const { percentage, missed, safeSkips, needed } = calculateStats(sub);
            const isDanger = percentage < 75;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={sub.id}
                className="dash-card group relative p-6 flex flex-col hover:border-purple-500/30 transition-all overflow-hidden"
              >
                {/* Background Progress Indicator */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 -z-10" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => resetAttendance(sub.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      title="Reset counts"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteSubject(sub.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-100 mb-1 line-clamp-1">{sub.name}</h3>
                
                <div className="flex items-end gap-2 mb-4">
                  <span className={`text-3xl font-black ${isDanger ? 'text-red-400' : 'text-emerald-400'}`}>
                    {percentage.toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-500 mb-1.5">attendance</span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 w-full bg-white/[0.04] rounded-full overflow-hidden mb-6">
                  {/* 75% line */}
                  <div className="absolute left-[75%] top-0 bottom-0 w-px bg-white/20 z-10" />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, percentage)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDanger ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                     <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Attended</p>
                     <p className="text-sm font-semibold text-gray-200">{sub.attended} / {sub.held}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                     <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Missed</p>
                     <p className="text-sm font-semibold text-red-400/80">{missed}</p>
                  </div>
                </div>

                <div className="mb-6">
                  {safeSkips > 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      <TrendingUp className="w-4 h-4" />
                      You can skip <span className="font-bold text-lg mx-0.5">{safeSkips}</span> more classes
                    </div>
                  ) : isDanger ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      Attend next <span className="font-bold text-lg mx-0.5">{needed}</span> classes to reach 75%
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                      <Info className="w-4 h-4" />
                      Critical: Don&apos;t skip next class
                    </div>
                  )}
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => logAttendance(sub.id, true)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group/btn"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Attended</span>
                  </button>
                  <button 
                    onClick={() => logAttendance(sub.id, false)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all group/btn"
                  >
                    <XCircle className="w-6 h-6 text-red-400 mb-1 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Skipped</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {subjects.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/[0.02] border border-white/[0.08] border-dashed rounded-3xl">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">No subjects tracked yet</h3>
            <p className="text-sm text-gray-500 mt-1">Add your subjects to start tracking attendance</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#030712] border border-white/[0.08] rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Track New Subject</h2>
              <form onSubmit={addSubject} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Networks"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 outline-none rounded-xl p-3 text-sm transition-all"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Classes Held</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 outline-none rounded-xl p-3 text-sm transition-all"
                      value={form.held}
                      onChange={e => setForm({ ...form, held: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Attended</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={form.held}
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 outline-none rounded-xl p-3 text-sm transition-all"
                      value={form.attended}
                      onChange={e => setForm({ ...form, attended: Number(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/[0.08] text-sm font-medium hover:bg-white/[0.02] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all"
                  >
                    Start Tracking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
