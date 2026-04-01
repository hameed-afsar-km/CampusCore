"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, Info, TrendingUp, BarChart3, BookOpen
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import FacultyAttendance from "./FacultyAttendance";

export default function AttendancePage() {
  const { userData } = useAuth();

  // Professor view
  if (userData?.role === "professor") {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Faculty Attendance Panel</h1>
          <p className="text-gray-400 mt-1">Mark attendance for your assigned classes and subjects</p>
        </div>
        <FacultyAttendance />
      </div>
    );
  }

  // Admin view — overview of all subjects
  if (userData?.role === "admin") {
    return <AdminAttendanceView />;
  }

  // Student view — their own attendance per subject
  return <StudentAttendanceView />;
}

// ─── Student View ─────────────────────────────────────────────────────────────
function StudentAttendanceView() {
  const { userData } = useAuth();
  const { data: rawRecords, loading } = useFirestore<any>("attendance", false);

  // Filter records for this student via client-side (since useFirestore is global)
  const myRecords = useMemo(() =>
    rawRecords.filter((r: any) => r.studentId === userData?.uid),
    [rawRecords, userData?.uid]
  );

  // Group by subjectId
  const subjectMap = useMemo(() => {
    const map: Record<string, { name: string; code: string; present: number; total: number }> = {};
    myRecords.forEach((r: any) => {
      if (!map[r.subjectId]) {
        map[r.subjectId] = { name: r.subjectName || "Unknown", code: r.subjectCode || "", present: 0, total: 0 };
      }
      map[r.subjectId].total += 1;
      if (r.status === "present") map[r.subjectId].present += 1;
    });
    return map;
  }, [myRecords]);

  const subjects = Object.entries(subjectMap).map(([id, v]) => ({
    id,
    name: v.name,
    code: v.code,
    held: v.total,
    attended: v.present,
    percentage: v.total > 0 ? (v.present / v.total) * 100 : 0,
  }));

  const lowAttendance = subjects.filter(s => s.percentage < 75 && s.held > 0);

  const calcNeeded = (attended: number, held: number) =>
    Math.max(0, Math.ceil((0.75 * held - attended) / 0.25));
  const calcSafeSkips = (attended: number, held: number) =>
    Math.floor(attended / 0.75) - held;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Attendance Tracker</h1>
        <p className="text-gray-400 mt-1">Your subject-wise attendance • Target: 75%</p>
      </div>

      {/* Low Attendance Alert */}
      <AnimatePresence>
        {lowAttendance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Low Attendance Alert</h3>
              <p className="text-sm text-red-400/80">
                Below 75% in: {lowAttendance.map(s => s.code || s.name).join(", ")}. Attend upcoming classes to avoid trouble.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading your attendance...</div>
      ) : subjects.length === 0 ? (
        <div className="col-span-full py-20 text-center bg-white/[0.02] border border-white/[0.08] border-dashed rounded-3xl">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400">No attendance records yet</h3>
          <p className="text-sm text-gray-500 mt-1">Your faculty will mark attendance for your class once sessions begin.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => {
            const isDanger = sub.percentage < 75;
            const safeSkips = calcSafeSkips(sub.attended, sub.held);
            const needed = calcNeeded(sub.attended, sub.held);

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="dash-card group relative p-6 flex flex-col hover:border-purple-500/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 -z-10" />

                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>

                {sub.code && <p className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest mb-0.5">{sub.code}</p>}
                <h3 className="text-base font-bold text-gray-100 mb-1 line-clamp-1">{sub.name}</h3>

                <div className="flex items-end gap-2 mb-4">
                  <span className={`text-3xl font-black ${isDanger ? "text-red-400" : "text-emerald-400"}`}>
                    {sub.percentage.toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-500 mb-1.5">attendance</span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 w-full bg-white/[0.04] rounded-full overflow-hidden mb-4">
                  <div className="absolute left-[75%] top-0 bottom-0 w-px bg-white/20 z-10" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, sub.percentage)}%` }}
                    transition={{ duration: 0.7 }}
                    className={`h-full rounded-full ${isDanger ? "bg-gradient-to-r from-red-500 to-amber-500" : "bg-gradient-to-r from-emerald-500 to-cyan-400"}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Attended</p>
                    <p className="text-sm font-semibold text-gray-200">{sub.attended} / {sub.held}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Missed</p>
                    <p className="text-sm font-semibold text-red-400/80">{sub.held - sub.attended}</p>
                  </div>
                </div>

                {safeSkips > 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <TrendingUp className="w-4 h-4" />
                    Can skip <span className="font-bold text-lg mx-0.5">{safeSkips}</span> more classes
                  </div>
                ) : isDanger ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    Need <span className="font-bold text-lg mx-0.5">{needed}</span> consecutive classes to reach 75%
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                    <Info className="w-4 h-4" />
                    Critical — don&apos;t skip next class
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Admin Overview ───────────────────────────────────────────────────────────
function AdminAttendanceView() {
  const { data: records, loading } = useFirestore<any>("attendance", false);

  const summary = useMemo(() => {
    const map: Record<string, { subjectName: string; subjectCode: string; present: number; total: number }> = {};
    records.forEach((r: any) => {
      const key = r.subjectId || r.subjectCode || "unknown";
      if (!map[key]) map[key] = { subjectName: r.subjectName || "Unknown", subjectCode: r.subjectCode || "", present: 0, total: 0 };
      map[key].total += 1;
      if (r.status === "present") map[key].present += 1;
    });
    return Object.entries(map).map(([id, v]) => ({
      id, ...v,
      percentage: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0
    }));
  }, [records]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Attendance Overview</h1>
        <p className="text-gray-400 mt-1">Institution-wide attendance summary across all subjects</p>
      </div>

      <div className="dash-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-bold text-gray-200">Subject-wise Attendance Summary</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#05070a] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3 text-center">Total Records</th>
              <th className="px-4 py-3 text-center">Present</th>
              <th className="px-4 py-3 text-right">Avg Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-sm">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : summary.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No attendance data yet.</td></tr>
            ) : (
              summary.map(row => (
                <tr key={row.id} className="hover:bg-white/[0.01]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-200">{row.subjectName}</p>
                    {row.subjectCode && <p className="text-xs text-gray-500">{row.subjectCode}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">{row.total}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{row.present}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-sm ${row.percentage < 75 ? "text-red-400" : "text-emerald-400"}`}>
                      {row.percentage}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
