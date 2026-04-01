"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, writeBatch, doc, setDoc, serverTimestamp,
} from "firebase/firestore";
import {
  TrendingUp, Award, AlertTriangle, Plus, X, Edit2, Trash2, BookOpen,
  ChevronLeft, ChevronRight, BarChart2, GraduationCap, Save, Users
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

// ─── Types ──────────────────────────────────────────────────────────────────────
type SubjectType = "theory" | "lab" | "theory+lab";

interface StudentMark {
  id?: string;
  classId: string;
  subjectId: string;
  studentId: string;
  studentName: string;
  semester: number;
  internal1: number | null;
  internal2: number | null;
  endSem: number | null;
  practical: number | null;
  facultyId: string;
}

interface SubjectLocal {
  id: string;
  name: string;
  code: string;
  credits: number;
  type: SubjectType;
  internalWeight: number;
  externalWeight: number;
  practicalWeight: number;
  practicalMax: number;
  internal1?: number | null;
  internal2?: number | null;
  endSem?: number | null;
  practical?: number | null;
  // For student personal tracker
  semester?: string;
}

// ─── Calculation helpers ─────────────────────────────────────────────────────
function calcFinalPercent(sub: SubjectLocal): number | null {
  const { type, internal1, internal2, endSem, practical, practicalMax, internalWeight, externalWeight, practicalWeight } = sub;
  if (type === "lab") {
    if (practical == null) return null;
    return (practical / Math.max(1, practicalMax)) * practicalWeight;
  }
  const avgInternal = ((internal1 ?? 0) + (internal2 ?? 0)) / 2;
  if (type === "theory") {
    if (endSem == null) return null;
    return (avgInternal / 50) * internalWeight + (endSem / 100) * externalWeight;
  }
  if (endSem == null && practical == null) return null;
  return (avgInternal / 50) * internalWeight + (endSem != null ? (endSem / 100) * externalWeight : 0) + (practical != null ? (practical / Math.max(1, practicalMax)) * practicalWeight : 0);
}
function calcGrade(p: number) {
  if (p >= 90) return "S"; if (p >= 80) return "A"; if (p >= 70) return "B";
  if (p >= 60) return "C"; if (p >= 50) return "D"; if (p >= 40) return "E"; return "F";
}
function calcGradePoint(p: number) {
  if (p >= 90) return 10; if (p >= 80) return 9; if (p >= 70) return 8;
  if (p >= 60) return 7; if (p >= 50) return 6; if (p >= 40) return 5; return 0;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarksTrackerPage() {
  const { userData } = useAuth();
  const role = userData?.role;

  if (role === "professor") return <FacultyMarksView />;
  if (role === "admin") return <AdminMarksView />;
  return <StudentMarksView />;
}

// ─── FACULTY: Enter marks per student per subject ────────────────────────────
function FacultyMarksView() {
  const { userData } = useAuth();
  const { data: allSubjects } = useFirestore<any>("subjects", false);
  const { data: allUsers } = useFirestore<any>("users", false);
  const { data: allClasses } = useFirestore<any>("classes", false);
  const { data: allMarks, loading: marksLoading } = useFirestore<any>("marks", false);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [localMarks, setLocalMarks] = useState<Record<string, { internal1: string; internal2: string; endSem: string; practical: string }>>({});

  const mySubjects = useMemo(() => allSubjects.filter((s: any) => s.facultyId === userData?.uid), [allSubjects, userData?.uid]);
  const selectedSubject = mySubjects.find((s: any) => s.id === selectedSubjectId) as any;

  const classStudents = useMemo(() => {
    if (!selectedSubject?.classId) return [];
    return allUsers.filter((u: any) => u.role === "student" && u.classId === selectedSubject.classId);
  }, [selectedSubject, allUsers]);

  // Existing marks for this subject
  const existingMarks = useMemo(() => {
    if (!selectedSubjectId) return {};
    const map: Record<string, any> = {};
    allMarks.filter((m: any) => m.subjectId === selectedSubjectId).forEach((m: any) => {
      map[m.studentId] = m;
    });
    return map;
  }, [allMarks, selectedSubjectId]);

  const handleSubjectChange = (subId: string) => {
    setSelectedSubjectId(subId);
    // Pre-populate from existing marks
    const studentMap: Record<string, any> = {};
    allMarks.filter((m: any) => m.subjectId === subId).forEach((m: any) => {
      studentMap[m.studentId] = {
        internal1: m.internal1 != null ? String(m.internal1) : "",
        internal2: m.internal2 != null ? String(m.internal2) : "",
        endSem: m.endSem != null ? String(m.endSem) : "",
        practical: m.practical != null ? String(m.practical) : "",
      };
    });
    setLocalMarks(studentMap);
  };

  const handleMarkChange = (studentId: string, field: string, value: string) => {
    setLocalMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId] || { internal1: "", internal2: "", endSem: "", practical: "" }, [field]: value }
    }));
  };

  const saveAllMarks = async () => {
    if (!selectedSubject || classStudents.length === 0) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const cls = allClasses.find((c: any) => c.id === selectedSubject.classId);

      classStudents.forEach((student: any) => {
        const m = localMarks[student.uid] || { internal1: "", internal2: "", endSem: "", practical: "" };
        const parse = (v: string, max: number) => v.trim() === "" ? null : Math.min(max, Math.max(0, Number(v)));
        const docId = `${student.uid}_${selectedSubjectId}`;
        const docRef = doc(db, "marks", docId);
        batch.set(docRef, {
          classId: selectedSubject.classId,
          subjectId: selectedSubjectId,
          subjectCode: selectedSubject.code,
          subjectName: selectedSubject.name,
          studentId: student.uid,
          studentName: student.displayName,
          semester: cls?.semester ?? selectedSubject.semester ?? 1,
          internal1: parse(m.internal1, 50),
          internal2: parse(m.internal2, 50),
          endSem: parse(m.endSem, 100),
          practical: parse(m.practical, selectedSubject.practicalMax || 100),
          facultyId: userData?.uid,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        }, { merge: true });
      });
      await batch.commit();
      alert("Marks saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save marks.");
    } finally {
      setSaving(false);
    }
  };

  const isLab = selectedSubject?.type === "lab";
  const hasPractical = selectedSubject?.type === "theory+lab" || isLab;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Marks Entry</h1>
        <p className="text-gray-400 mt-1">Enter marks for your assigned subjects</p>
      </div>

      <div className="dash-card">
        <div className="mb-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Select Subject</label>
          {mySubjects.length === 0 ? (
            <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">No subjects assigned to you yet.</p>
          ) : (
            <select value={selectedSubjectId} onChange={e => handleSubjectChange(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all">
              <option value="" className="bg-[#030712]">Select subject...</option>
              {mySubjects.map((s: any) => {
                const cls = allClasses.find((c: any) => c.id === s.classId);
                return <option key={s.id} value={s.id} className="bg-[#030712]">{s.code} — {s.name} ({cls ? `${cls.department}-${cls.section} Sem${cls.semester}` : ""})</option>;
              })}
            </select>
          )}
        </div>

        {selectedSubject && classStudents.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-white/[0.02] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    {!isLab && <th className="px-3 py-3 text-center">Int.1 /50</th>}
                    {!isLab && <th className="px-3 py-3 text-center">Int.2 /50</th>}
                    {!isLab && <th className="px-3 py-3 text-center">End Sem /100</th>}
                    {hasPractical && <th className="px-3 py-3 text-center">Practical /{selectedSubject.practicalMax || 50}</th>}
                    <th className="px-3 py-3 text-center">Final %</th>
                    <th className="px-3 py-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {classStudents.map((student: any) => {
                    const m = localMarks[student.uid] || { internal1: "", internal2: "", endSem: "", practical: "" };
                    const subForCalc: SubjectLocal = {
                      ...selectedSubject,
                      id: selectedSubjectId,
                      internal1: m.internal1 !== "" ? Number(m.internal1) : null,
                      internal2: m.internal2 !== "" ? Number(m.internal2) : null,
                      endSem: m.endSem !== "" ? Number(m.endSem) : null,
                      practical: m.practical !== "" ? Number(m.practical) : null,
                    };
                    const finalPct = calcFinalPercent(subForCalc);
                    const grade = finalPct !== null ? calcGrade(finalPct) : null;

                    return (
                      <tr key={student.uid} className="hover:bg-white/[0.01]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">{student.displayName?.charAt(0)}</div>
                            <span className="text-sm text-gray-200">{student.displayName}</span>
                          </div>
                        </td>
                        {!isLab && (
                          <td className="px-3 py-3 text-center">
                            <input type="number" min={0} max={50} value={m.internal1} onChange={e => handleMarkChange(student.uid, "internal1", e.target.value)} className="w-16 text-center bg-white/[0.03] border border-white/[0.06] focus:border-purple-500/50 rounded-lg py-1 text-sm text-gray-200 outline-none" placeholder="—" />
                          </td>
                        )}
                        {!isLab && (
                          <td className="px-3 py-3 text-center">
                            <input type="number" min={0} max={50} value={m.internal2} onChange={e => handleMarkChange(student.uid, "internal2", e.target.value)} className="w-16 text-center bg-white/[0.03] border border-white/[0.06] focus:border-purple-500/50 rounded-lg py-1 text-sm text-gray-200 outline-none" placeholder="—" />
                          </td>
                        )}
                        {!isLab && (
                          <td className="px-3 py-3 text-center">
                            <input type="number" min={0} max={100} value={m.endSem} onChange={e => handleMarkChange(student.uid, "endSem", e.target.value)} className="w-16 text-center bg-white/[0.03] border border-white/[0.06] focus:border-purple-500/50 rounded-lg py-1 text-sm text-gray-200 outline-none" placeholder="—" />
                          </td>
                        )}
                        {hasPractical && (
                          <td className="px-3 py-3 text-center">
                            <input type="number" min={0} max={selectedSubject.practicalMax || 50} value={m.practical} onChange={e => handleMarkChange(student.uid, "practical", e.target.value)} className="w-16 text-center bg-white/[0.03] border border-white/[0.06] focus:border-cyan-500/50 rounded-lg py-1 text-sm text-gray-200 outline-none" placeholder="—" />
                          </td>
                        )}
                        <td className="px-3 py-3 text-center">
                          {finalPct !== null ? (
                            <span className={`text-sm font-bold ${finalPct >= 75 ? "text-emerald-400" : finalPct >= 50 ? "text-amber-400" : "text-red-400"}`}>{finalPct.toFixed(1)}%</span>
                          ) : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {grade ? (
                            <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs border ${
                              grade === "S" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                              grade === "F" ? "bg-red-500/20 border-red-500/30 text-red-400" :
                              "bg-purple-500/20 border-purple-500/30 text-purple-300"
                            }`}>{grade}</span>
                          ) : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={saveAllMarks} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All Marks"}
              </button>
            </div>
          </>
        )}

        {selectedSubject && classStudents.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No students found in this class.</p>
        )}
      </div>
    </div>
  );
}

// ─── STUDENT: Personal marks tracker with GPA ────────────────────────────────
function StudentMarksView() {
  const { userData } = useAuth();
  const { data: allMarks, loading } = useFirestore<any>("marks", false);

  const myMarks = useMemo(() =>
    allMarks.filter((m: any) => m.studentId === userData?.uid),
    [allMarks, userData?.uid]
  );

  // Group by semester
  const bySemester = useMemo(() => {
    const map: Record<number, any[]> = {};
    myMarks.forEach((m: any) => {
      const sem = m.semester ?? 1;
      if (!map[sem]) map[sem] = [];
      map[sem].push(m);
    });
    return map;
  }, [myMarks]);

  const semesters = Object.keys(bySemester).map(Number).sort();
  const [activeSem, setActiveSem] = useState<number | null>(null);
  const currentSem = activeSem ?? semesters[semesters.length - 1] ?? 1;
  const currentMarks = bySemester[currentSem] || [];

  const computedMarks = useMemo(() => currentMarks.map((m: any) => {
    // Build a pseudo-subject for calc (we need weights — stored on the mark if available, else fallback)
    const sub: SubjectLocal = {
      id: m.subjectId, name: m.subjectName, code: m.subjectCode,
      credits: m.credits ?? 3, type: m.type ?? "theory",
      internalWeight: m.internalWeight ?? 50, externalWeight: m.externalWeight ?? 50,
      practicalWeight: m.practicalWeight ?? 0, practicalMax: m.practicalMax ?? 50,
      internal1: m.internal1, internal2: m.internal2, endSem: m.endSem, practical: m.practical,
    };
    const finalPct = calcFinalPercent(sub);
    const grade = finalPct !== null ? calcGrade(finalPct) : null;
    const gradePoint = finalPct !== null ? calcGradePoint(finalPct) : null;
    return { ...m, finalPct, grade, gradePoint, credits: sub.credits };
  }), [currentMarks]);

  const gpa = useMemo(() => {
    const withGrades = computedMarks.filter(m => m.gradePoint !== null);
    if (!withGrades.length) return null;
    const totalCredits = withGrades.reduce((a: number, m: any) => a + (m.credits || 3), 0);
    const totalPoints = withGrades.reduce((a: number, m: any) => a + (m.gradePoint ?? 0) * (m.credits || 3), 0);
    return totalCredits > 0 ? totalPoints / totalCredits : null;
  }, [computedMarks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Marks</h1>
        <p className="text-gray-400 mt-1">Subject-wise marks and GPA overview</p>
      </div>

      {/* GPA card */}
      {gpa !== null && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="dash-card col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sem GPA</p>
            </div>
            <p className="text-2xl font-bold text-purple-300">{gpa.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Semester {currentSem}</p>
          </div>
        </div>
      )}

      {/* Semester tabs */}
      {semesters.length > 0 && (
        <div className="flex items-center gap-2 bg-white/[0.02] p-2 rounded-xl border border-white/[0.06] overflow-x-auto">
          {semesters.map(sem => (
            <button key={sem} onClick={() => setActiveSem(sem)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentSem === sem ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]"}`}>
              Semester {sem}
            </button>
          ))}
        </div>
      )}

      {/* Marks table */}
      <div className="dash-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-semibold text-gray-200">Semester {currentSem} — Subject Marks</h3>
        </div>
        {loading ? (
          <p className="p-8 text-center text-gray-500 text-sm">Loading marks...</p>
        ) : computedMarks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No marks recorded yet for this semester.</p>
            <p className="text-sm text-gray-600 mt-1">Your faculty will enter marks once assessments are completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[#05070a] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-3 text-center">Int. 1</th>
                  <th className="py-3 px-3 text-center">Int. 2</th>
                  <th className="py-3 px-3 text-center">End Sem</th>
                  <th className="py-3 px-3 text-center">Practical</th>
                  <th className="py-3 px-3 text-center">Final %</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {computedMarks.map((m: any) => (
                  <tr key={m.id || m.subjectId} className="hover:bg-white/[0.02] group">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-200 text-sm">{m.subjectName}</p>
                      {m.subjectCode && <p className="text-xs text-gray-500">{m.subjectCode}</p>}
                    </td>
                    <td className="py-3 px-3 text-center text-sm text-gray-300">{m.internal1 != null ? `${m.internal1}/50` : <span className="text-gray-600">—</span>}</td>
                    <td className="py-3 px-3 text-center text-sm text-gray-300">{m.internal2 != null ? `${m.internal2}/50` : <span className="text-gray-600">—</span>}</td>
                    <td className="py-3 px-3 text-center text-sm text-gray-300">{m.endSem != null ? `${m.endSem}/100` : <span className="text-gray-600">—</span>}</td>
                    <td className="py-3 px-3 text-center text-sm text-gray-300">{m.practical != null ? m.practical : <span className="text-gray-600">—</span>}</td>
                    <td className="py-3 px-3 text-center">
                      {m.finalPct !== null ? (
                        <span className={`text-sm font-bold ${m.finalPct >= 75 ? "text-emerald-400" : m.finalPct >= 50 ? "text-amber-400" : "text-red-400"}`}>{m.finalPct.toFixed(1)}%</span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {m.grade ? (
                        <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-bold text-sm border ${
                          m.grade === "S" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                          m.grade === "A" ? "bg-blue-500/20 border-blue-500/30 text-blue-300" :
                          m.grade === "F" ? "bg-red-500/20 border-red-500/30 text-red-400" :
                          "bg-white/[0.05] border-white/[0.1] text-gray-300"
                        }`}>{m.grade}</span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN: Overview of all marks ────────────────────────────────────────────
function AdminMarksView() {
  const { data: marks, loading } = useFirestore<any>("marks", false);
  const { data: allClasses } = useFirestore<any>("classes", false);

  const byClass = useMemo(() => {
    const map: Record<string, { className: string; subjects: Set<string>; students: Set<string> }> = {};
    marks.forEach((m: any) => {
      if (!map[m.classId]) {
        const cls = allClasses.find((c: any) => c.id === m.classId);
        map[m.classId] = {
          className: cls ? `${cls.department}-${cls.section} Sem${cls.semester}` : m.classId,
          subjects: new Set(), students: new Set()
        };
      }
      map[m.classId].subjects.add(m.subjectId);
      map[m.classId].students.add(m.studentId);
    });
    return map;
  }, [marks, allClasses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Marks Overview</h1>
        <p className="text-gray-400 mt-1">Institution-wide marks summary by class</p>
      </div>
      <div className="dash-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]"><h3 className="font-bold text-gray-200">Class-wise Marks Status</h3></div>
        <table className="w-full text-left">
          <thead className="bg-[#05070a] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3 text-center">Subjects Evaluated</th>
              <th className="px-4 py-3 text-center">Students with Marks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-sm">
            {loading ? (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : Object.entries(byClass).length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">No marks data yet.</td></tr>
            ) : (
              Object.entries(byClass).map(([classId, data]) => (
                <tr key={classId} className="hover:bg-white/[0.01]">
                  <td className="px-4 py-3 font-medium text-gray-200">{data.className}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{data.subjects.size}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{data.students.size}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
