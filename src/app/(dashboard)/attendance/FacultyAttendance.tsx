"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from "firebase/firestore";
import { 
  Users, 
  Download, 
  FileText, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Search
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

interface Student {
  uid: string;
  displayName: string;
  email: string;
}

interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName: string;
  subject: string;
  date: string;
  status: "present" | "absent";
}

export default function FacultyAttendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, "present" | "absent">>({});
  const [saving, setSaving] = useState(false);
  const [reportData, setReportData] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"mark" | "report">("mark");

  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snapshot = await getDocs(q);
      const studentList = snapshot.docs.map(doc => doc.data() as Student);
      setStudents(studentList);
      
      const initial: Record<string, "present" | "absent"> = {};
      studentList.forEach(s => initial[s.uid] = "present"); // Default present
      setAttendanceState(initial);
    };
    fetchStudents();
  }, []);

  const fetchReport = async () => {
    if (!subject) return;
    const q = query(collection(db, "faculty_attendance"), where("subject", "==", subject));
    const snapshot = await getDocs(q);
    setReportData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
  };

  useEffect(() => {
    if (view === "report") {
      fetchReport();
    }
  }, [view, subject]);

  const handleMark = (uid: string, status: "present" | "absent") => {
    setAttendanceState(prev => ({ ...prev, [uid]: status }));
  };

  const saveAttendance = async () => {
    if (!subject.trim()) {
      alert("Please enter a subject name.");
      return;
    }
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      students.forEach(student => {
        const docRef = doc(collection(db, "faculty_attendance"));
        batch.set(docRef, {
          studentId: student.uid,
          studentName: student.displayName,
          subject,
          date,
          status: attendanceState[student.uid],
          createdAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      alert("Attendance saved successfully!");
      setSubject("");
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const generateReportSummary = () => {
    // Return { studentName, present, total, percentage }
    const summary: Record<string, { present: number; total: number }> = {};
    
    reportData.forEach(record => {
      if (!summary[record.studentName]) {
        summary[record.studentName] = { present: 0, total: 0 };
      }
      summary[record.studentName].total += 1;
      if (record.status === "present") {
        summary[record.studentName].present += 1;
      }
    });

    return Object.entries(summary).map(([name, stats]) => ({
      name,
      present: stats.present,
      total: stats.total,
      percentage: Math.round((stats.present / stats.total) * 100)
    }));
  };

  const exportCSV = () => {
    const summary = generateReportSummary();
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Student Name,Classes Held,Classes Attended,Attendance %\n"
      + summary.map(r => `${r.name},${r.total},${r.present},${r.percentage}%`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${subject}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/[0.06] w-fit mb-6">
        <button
          onClick={() => setView("mark")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "mark" ? "bg-white/[0.1] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Mark Attendance
        </button>
        <button
          onClick={() => setView("report")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "report" ? "bg-white/[0.1] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Reports & Export
        </button>
      </div>

      <div className="dash-card p-6">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject</label>
            <input 
              type="text" 
              placeholder="e.g. Data Structures"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all [color-scheme:dark]" 
            />
          </div>
        </div>

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
                  {students.filter(s => s.displayName.toLowerCase().includes(search.toLowerCase())).map((student) => (
                    <tr key={student.uid} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01]">
                      <td className="p-4 text-sm font-medium text-gray-200 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs uppercase">
                          {student.displayName.charAt(0)}
                        </div>
                        {student.displayName}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleMark(student.uid, "present")}
                            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              attendanceState[student.uid] === "present"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-white/[0.05] text-gray-500 border border-transparent hover:text-gray-300"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Present
                          </button>
                          <button
                            onClick={() => handleMark(student.uid, "absent")}
                            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              attendanceState[student.uid] === "absent"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-white/[0.05] text-gray-500 border border-transparent hover:text-gray-300"
                            }`}
                          >
                            <XCircle className="w-4 h-4" /> Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-10 text-center text-sm text-gray-500">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={saveAttendance}
                disabled={saving || !subject.trim()}
                className="btn-primary flex items-center gap-2"
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
                Attendance summary for <span className="text-purple-400">{subject || "..."}</span>
              </h3>
              <button 
                onClick={exportCSV} 
                disabled={!subject || generateReportSummary().length === 0}
                className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-500/20 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            
            <div className="border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full text-left bg-transparent border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Student Name</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-center">Classes Attended</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {generateReportSummary().map(stat => (
                    <tr key={stat.name} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01]">
                      <td className="p-4 text-sm font-medium text-gray-200">{stat.name}</td>
                      <td className="p-4 text-sm text-gray-400 text-center">{stat.present} / {stat.total}</td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-bold ${stat.percentage < 75 ? "text-red-400" : "text-emerald-400"}`}>
                          {stat.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {generateReportSummary().length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-sm text-gray-500">
                        Enter a subject name to view report or no data available.
                      </td>
                    </tr>
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
