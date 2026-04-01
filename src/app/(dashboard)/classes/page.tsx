"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, writeBatch, doc, updateDoc, increment
} from "firebase/firestore";
import {
  Plus, X, Users, BookOpen, ChevronRight, Shield, ArrowUpCircle,
  GraduationCap, Layers, Calendar, Edit2, Archive, Trash2, Search
} from "lucide-react";
import { DEPARTMENTS, SECTIONS } from "@/lib/constants";

export interface ClassDoc {
  id?: string;
  department: string;
  section: string;
  year: number;
  semester: number;
  academicYear: string;
  advisorId: string;
  advisorName: string;
  isActive: boolean;
}

const ACADEMIC_YEARS = ["2022-23", "2023-24", "2024-25", "2025-26", "2026-27"];
const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const defaultForm: Omit<ClassDoc, "id"> = {
  department: DEPARTMENTS[0],
  section: SECTIONS[0],
  year: 1,
  semester: 1,
  academicYear: "2025-26",
  advisorId: "",
  advisorName: "",
  isActive: true,
};

export default function ClassesPage() {
  const { userData } = useAuth();
  const { data: classes, add, update, remove, loading } = useFirestore<ClassDoc>("classes", false);
  const { data: allUsers } = useFirestore<any>("users", false);

  const professors = useMemo(() => allUsers.filter((u: any) => u.role === "professor"), [allUsers]);
  const students = useMemo(() => allUsers.filter((u: any) => u.role === "student"), [allUsers]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [selectedClass, setSelectedClass] = useState<ClassDoc | null>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [confirmPromote, setConfirmPromote] = useState<ClassDoc | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<ClassDoc | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  const isAdmin = userData?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Admin Access Only</h1>
        <p className="text-gray-400 mt-2">Class management is restricted to administrators.</p>
      </div>
    );
  }

  const filteredClasses = classes.filter((c) => {
    const matchDept = filterDept === "ALL" || c.department === filterDept;
    const matchSearch =
      !search ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      c.section.toLowerCase().includes(search.toLowerCase()) ||
      c.academicYear.includes(search) ||
      c.advisorName?.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (cls: ClassDoc) => {
    setEditingId(cls.id!);
    setForm({
      department: cls.department,
      section: cls.section,
      year: cls.year,
      semester: cls.semester,
      academicYear: cls.academicYear,
      advisorId: cls.advisorId,
      advisorName: cls.advisorName,
      isActive: cls.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const advisor = professors.find((p: any) => p.uid === form.advisorId);
    const payload = {
      ...form,
      advisorName: advisor?.displayName || form.advisorName || "",
    };
    if (editingId) {
      await update(editingId, payload);
    } else {
      await add(payload);
    }
    setShowModal(false);
  };

  const handlePromoteSemester = async () => {
    if (!confirmPromote?.id) return;
    setPromoting(true);
    try {
      const cls = confirmPromote;
      const newSemester = cls.semester + 1;
      const isGraduating = newSemester > 8;

      const batch = writeBatch(db);

      // Find all students in this class
      const studentsInClass = students.filter((s: any) => s.classId === cls.id);

      if (isGraduating) {
        // Archive the class
        batch.update(doc(db, "classes", cls.id!), { isActive: false, updatedAt: new Date() });
        // Detach students
        studentsInClass.forEach((s: any) => {
          batch.update(doc(db, "users", s.uid), {
            classId: null,
            semester: newSemester,
          });
        });
      } else {
        // Increment semester
        batch.update(doc(db, "classes", cls.id!), { semester: newSemester, updatedAt: new Date() });
        studentsInClass.forEach((s: any) => {
          batch.update(doc(db, "users", s.uid), { semester: newSemester });
        });
      }

      await batch.commit();
    } catch (err) {
      console.error("Promotion failed:", err);
    } finally {
      setPromoting(false);
      setConfirmPromote(null);
    }
  };

  const handleArchive = async () => {
    if (!confirmArchive?.id) return;
    await update(confirmArchive.id, { isActive: !confirmArchive.isActive });
    setConfirmArchive(null);
  };

  const classStudents = selectedClass
    ? students.filter((s: any) => s.classId === selectedClass.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Management</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage academic batches, assign advisors, and promote semesters</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Class
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: classes.length, color: "purple", icon: Layers },
          { label: "Active Classes", value: classes.filter(c => c.isActive).length, color: "emerald", icon: GraduationCap },
          { label: "Total Students", value: students.filter((s: any) => s.classId).length, color: "cyan", icon: Users },
          { label: "Departments", value: new Set(classes.map(c => c.department)).size, color: "amber", icon: BookOpen },
        ].map(stat => (
          <div key={stat.label} className="dash-card">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
              stat.color === "purple" ? "bg-purple-500/10 text-purple-400" :
              stat.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
              stat.color === "cyan" ? "bg-cyan-500/10 text-cyan-400" :
              "bg-amber-500/10 text-amber-400"
            }`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
          />
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 rounded-xl px-4 py-2.5 text-sm outline-none"
        >
          <option value="ALL">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Classes Grid + Detail Panel */}
      <div className="flex gap-6">
        {/* Classes Grid */}
        <div className={`${selectedClass ? "hidden md:block md:w-1/2 lg:w-2/3" : "w-full"}`}>
          <div className="dash-card !p-0 overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
              <h3 className="font-bold text-gray-200 text-sm">All Classes ({filteredClasses.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#05070a] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Sem / Year</th>
                    <th className="px-4 py-3">Advisor</th>
                    <th className="px-4 py-3 text-center">Students</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500 text-xs">Loading classes...</td></tr>
                  ) : filteredClasses.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500 text-xs">No classes found. Create one to get started.</td></tr>
                  ) : (
                    filteredClasses.map(cls => {
                      const studentCount = students.filter((s: any) => s.classId === cls.id).length;
                      return (
                        <tr
                          key={cls.id}
                          onClick={() => setSelectedClass(selectedClass?.id === cls.id ? null : cls)}
                          className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${selectedClass?.id === cls.id ? "bg-purple-500/5 border-l-2 border-l-purple-500" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-100">{cls.department} — Sec. {cls.section}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{cls.academicYear}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-200">Sem {cls.semester}</div>
                            <div className="text-xs text-gray-500">Year {cls.year}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{cls.advisorName || <span className="italic text-gray-600">Unassigned</span>}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-white/5 text-gray-300 text-xs px-2 py-0.5 rounded">{studentCount}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${cls.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"}`}>
                              {cls.isActive ? "Active" : "Archived"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => openEdit(cls)} className="p-1.5 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors" title="Edit">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {cls.isActive && cls.semester < 8 && (
                                <button onClick={() => setConfirmPromote(cls)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors" title="Promote Semester">
                                  <ArrowUpCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => setConfirmArchive(cls)} className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors" title={cls.isActive ? "Archive" : "Restore"}>
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setConfirmDelete(cls.id!)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Class Detail Panel */}
        <AnimatePresence>
          {selectedClass && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full md:w-1/2 lg:w-1/3 space-y-4"
            >
              <div className="dash-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-100">{selectedClass.department} — Sec. {selectedClass.section}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Sem {selectedClass.semester} · Year {selectedClass.year} · {selectedClass.academicYear}</p>
                  </div>
                  <button onClick={() => setSelectedClass(null)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center p-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <span className="text-xs text-gray-500">Class Advisor</span>
                    <span className="text-xs font-medium text-gray-200">{selectedClass.advisorName || "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${selectedClass.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-500"}`}>{selectedClass.isActive ? "Active" : "Archived"}</span>
                  </div>
                </div>

                {selectedClass.isActive && selectedClass.semester < 8 && (
                  <button
                    onClick={() => setConfirmPromote(selectedClass)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Promote to Sem {selectedClass.semester + 1}
                  </button>
                )}
              </div>

              {/* Student Roster */}
              <div className="dash-card !p-0 overflow-hidden">
                <div className="p-3 border-b border-white/[0.06] flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-200">Students ({classStudents.length})</h4>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {classStudents.length === 0 ? (
                    <p className="p-4 text-center text-xs text-gray-500 italic">No students assigned to this class yet.</p>
                  ) : (
                    classStudents.map((s: any) => (
                      <div key={s.uid} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01]">
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {s.displayName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate">{s.displayName}</p>
                          <p className="text-[10px] text-gray-500 truncate">{s.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0a0e17] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-white">{editingId ? "Edit Class" : "Create New Class"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase block mb-1.5">Department</label>
                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none text-white">
                      {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-[#0a0e17]">{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase block mb-1.5">Section</label>
                    <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none text-white">
                      {SECTIONS.map(s => <option key={s} value={s} className="bg-[#0a0e17]">{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase block mb-1.5">Year</label>
                    <select value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none text-white">
                      {YEARS.map(y => <option key={y} value={y} className="bg-[#0a0e17]">Year {y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase block mb-1.5">Semester</label>
                    <select value={form.semester} onChange={e => setForm({ ...form, semester: Number(e.target.value) })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none text-white">
                      {SEMESTERS.map(s => <option key={s} value={s} className="bg-[#0a0e17]">Sem {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase block mb-1.5">Acad. Year</label>
                    <select value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none text-white">
                      {ACADEMIC_YEARS.map(y => <option key={y} value={y} className="bg-[#0a0e17]">{y}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase block mb-1.5">Class Advisor</label>
                  <select
                    value={form.advisorId}
                    onChange={e => setForm({ ...form, advisorId: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none text-white"
                  >
                    <option value="" className="bg-[#0a0e17]">Select Advisor (Optional)</option>
                    {professors.map((p: any) => (
                      <option key={p.uid} value={p.uid} className="bg-[#0a0e17]">{p.displayName} {p.staffId ? `(${p.staffId})` : ""}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="w-full btn-primary py-2.5 mt-2">
                  {editingId ? "Save Changes" : "Create Class"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Promote Confirm */}
      <ConfirmModal
        isOpen={!!confirmPromote}
        onClose={() => setConfirmPromote(null)}
        onConfirm={handlePromoteSemester}
        title={`Promote to Semester ${(confirmPromote?.semester ?? 0) + 1}?`}
        message={`This will promote ${students.filter((s: any) => s.classId === confirmPromote?.id).length} students from Sem ${confirmPromote?.semester} to Sem ${(confirmPromote?.semester ?? 0) + 1}. Old subjects remain for historical reference. New subjects must be created for the next semester.`}
      />

      {/* Archive Confirm */}
      <ConfirmModal
        isOpen={!!confirmArchive}
        onClose={() => setConfirmArchive(null)}
        onConfirm={handleArchive}
        title={confirmArchive?.isActive ? "Archive This Class?" : "Restore This Class?"}
        message={confirmArchive?.isActive
          ? "Archiving will hide this class from active views. Students remain linked."
          : "This will restore the class to active status."}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => { await remove(confirmDelete!); setConfirmDelete(null); if (selectedClass?.id === confirmDelete) setSelectedClass(null); }}
        title="Delete Class?"
        message="This will permanently delete this class. Students linked to this class will lose their class assignment. This cannot be undone."
      />
    </div>
  );
}
