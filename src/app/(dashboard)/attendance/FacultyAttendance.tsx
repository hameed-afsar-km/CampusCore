"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import {
  collection, query, where, getDocs, writeBatch, doc, serverTimestamp
} from "firebase/firestore";
import {
  Users, Download, CheckCircle2, XCircle, BarChart3, Search, BookOpen
} from "lucide-react";

interface AttendanceRecord {
  id?: string;
  classId: string;
  subjectId: string;
  facultyId: string;
  studentId: string;
  studentName: string;
  date: string;
  status: "present" | "absent";
}

interface SubjectSummary {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  present: number;
  total: number;
}

export default function FacultyAttendance() {
  const { userData } = useAuth();
  const { data: allUsers } = useFirestore<any>("users", false);
  const { data: allSubjects } = useFirestore<any>("subjects", false);
  const { data: allClasses } = useFirestore<any>("classes", false);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, "present" | "absent">>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"mark" | "report">("mark");
  const [reportData, setReportData] = useState<SubjectSummary[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Faculty's assigned subjects only
  const mySubjects = useMemo(() =>
    allSubjects.filter((s: any) => s.facultyId === userData?.uid),
    [allSubjects, userData?.uid]
  );

  const selectedSubject = mySubjects.find((s: any) => s.id === selectedSubjectId);

  // Students in the selected subject's class
  const classStudents = useMemo(() => {
    if (!selectedSubject?.classId) return [];
    return allUsers.filter((u: any) => u.role === "student" && u.classId === selectedSubject.classId);
  }, [selectedSubject, allUsers]);

  const filteredStudents = classStudents.filter((s: any) =>
    s.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    // Reset attendance state to "present" for all students in new class
    const sub = mySubjects.find((s: any) => s.id === subjectId);
    if (sub) {
      const students = allUsers.filter((u: any) => u.role === "student" && u.classId === sub.classId);
      const initial: Record<string, "present" | "absent"> = {};
      students.forEach((s: any) => { initial[s.uid] = "present"; });
      setAttendanceState(initial);
    }
  };

  const handleMark = (uid: string, status: "present" | "absent") => {
    setAttendanceState(prev => ({ ...prev, [uid]: status }));
  };

  const saveAttendance = async () => {
    if (!selectedSubject) {
      alert("Please select a subject first.");
      return;
    }
    if (classStudents.length === 0) {
      alert("No students found for this class.");
      return;
    }
    setSaving(true);
    try {
      const batch = writeBatch(db);
      classStudents.forEach((student: any) => {
        const docRef = doc(collection(db, "attendance"));
        batch.set(docRef, {
          classId: selectedSubject.classId,
          subjectId: selectedSubject.id,
          subjectCode: selectedSubject.code,
          subjectName: selectedSubject.name,
          facultyId: userData?.uid,
          studentId: student.uid,
          studentName: student.displayName,
          date,
          status: attendanceState[student.uid] || "absent",
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
      alert(`Attendance saved for ${classStudents.length} students.`);
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const loadReport = async () => {
    if (!selectedSubjectId) return;
    setLoadingReport(true);
    try {
      const q = query(
        collection(db, "attendance"),
        where("subjectId", "==", selectedSubjectId)
      );
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(d => d.data() as AttendanceRecord);

      // Group by studentId
      const summary: Record<string, { name: string; present: number; total: number }> = {};
      records.forEach(r => {
        if (!summary[r.studentId]) summary[r.studentId] = { name: r.studentName, present: 0, total: 0 };
        summary[r.studentId].total += 1;
        if (r.status === "present") summary[r.studentId].present += 1;
      });

      setReportData(
        Object.entries(summary).map(([id, stats]) => ({
          subjectId: id,
          subjectCode: stats.name,
          subjectName: stats.name,
          present: stats.present,
          total: stats.total,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  const exportCSV = () => {
    const sub = selectedSubject;
    const content = "data:text/csv;charset=utf-8,"
      + `Student Name,Classes Attended,Total Classes,Attendance %\n`
      + reportData.map(r => {
          const pct = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
          return `${r.subjectCode},${r.present},${r.total},${pct}%`;
        }).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(content));
    link.setAttribute("download", `Attendance_${sub?.code}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/[0.06] w-fit">
        <button onClick={() => setView("mark")} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "mark" ? "bg-white/[0.1] text-white" : "text-gray-400 hover:text-gray-200"}`}>
          <CheckCircle2 className="w-4 h-4" /> Mark Attendance
        </button>
        <button onClick={() => { setView("report"); loadReport(); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "report" ? "bg-white/[0.1] text-white" : "text-gray-400 hover:text-gray-200"}`}>
          <BarChart3 className="w-4 h-4" /> Reports & Export
        </button>
      </div>

      <div className="dash-card p-6">
        {/* Subject + Date selectors */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject</label>
            {mySubjects.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                No subjects assigned to you yet. Ask the admin to assign subjects via the Timetable module.
              </div>
            ) : (
              <select
                value={selectedSubjectId}
                onChange={e => handleSubjectChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
              >
                <option value="" className="bg-[#030712]">Select a subject...</option>
                {mySubjects.map((s: any) => {
                  const cls = allClasses.find((c: any) => c.id === s.classId);
                  return (
                    <option key={s.id} value={s.id} className="bg-[#030712]">
                      {s.code} — {s.name} ({cls ? `${cls.department}-${cls.section} Sem${cls.semester}` : "No class"})
                    </option>
                  );
                })}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Summary badge */}
        {selectedSubject && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <div>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">{selectedSubject.code} — {selectedSubject.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{classStudents.length} students in this class</p>
            </div>
          </div>
        )}

        {view === "mark" && (
          <>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2 pl-10 pr-4 text-sm outline-none"
              />
            </div>

            <div className="border border-white/[0.06] rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left bg-transparent border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Student Name</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedSubjectId ? (
                    <tr><td colSpan={2} className="p-10 text-center text-sm text-gray-500">Select a subject to load students.</td></tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr><td colSpan={2} className="p-10 text-center text-sm text-gray-500">No students found in this class.</td></tr>
                  ) : (
                    filteredStudents.map((student: any) => (
                      <tr key={student.uid} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01]">
                        <td className="p-4 text-sm font-medium text-gray-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                            {student.displayName?.charAt(0)}
                          </div>
                          {student.displayName}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleMark(student.uid, "present")}
                              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${attendanceState[student.uid] === "present" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.05] text-gray-500 border border-transparent hover:text-gray-300"}`}
                            >
                              <CheckCircle2 className="w-4 h-4" /> Present
                            </button>
                            <button
                              onClick={() => handleMark(student.uid, "absent")}
                              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${attendanceState[student.uid] === "absent" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/[0.05] text-gray-500 border border-transparent hover:text-gray-300"}`}
                            >
                              <XCircle className="w-4 h-4" /> Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {Object.values(attendanceState).filter(s => s === "present").length} present,{" "}
                {Object.values(attendanceState).filter(s => s === "absent").length} absent
              </p>
              <button
                onClick={saveAttendance}
                disabled={saving || !selectedSubjectId || classStudents.length === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </>
        )}

        {view === "report" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-300">
                Attendance summary for <span className="text-purple-400">{selectedSubject?.name || "..."}</span>
              </h3>
              <button
                onClick={exportCSV}
                disabled={!selectedSubjectId || reportData.length === 0}
                className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-500/20 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full text-left bg-transparent border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Student</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-center">Present / Total</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingReport ? (
                    <tr><td colSpan={3} className="p-8 text-center text-sm text-gray-500">Loading report...</td></tr>
                  ) : reportData.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-sm text-gray-500">No attendance records found for this subject.</td></tr>
                  ) : (
                    reportData.map((row, i) => {
                      const pct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
                      return (
                        <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01]">
                          <td className="p-4 text-sm font-medium text-gray-200">{row.subjectCode}</td>
                          <td className="p-4 text-sm text-gray-400 text-center">{row.present} / {row.total}</td>
                          <td className="p-4 text-right">
                            <span className={`text-sm font-bold ${pct < 75 ? "text-red-400" : "text-emerald-400"}`}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
