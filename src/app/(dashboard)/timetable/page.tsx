"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Plus, Trash2, Edit2, X, ShieldAlert, GraduationCap, Users, BookOpen, MapPin } from "lucide-react";

export const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "BBA", "MBA"];
export const SECTIONS = ["A", "B", "C", "D"];

type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface TimetableClass {
  id?: string;
  day: DayOfWeek;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  timeStart: string;
  timeEnd: string;
  room: string;
  department: string;
  section: string;
}

interface Subject {
  id?: string;
  department: string;
  section: string;
  code: string;
  name: string;
  credits: number;
  facultyId: string;
  facultyName: string;
}

const TIME_SLOTS = [
  { label: "09:00 - 09:50", type: "class", id: "1", title: "P1" },
  { label: "09:50 - 10:40", type: "class", id: "2", title: "P2" },
  { label: "10:40 - 11:00", type: "break", id: "break", title: "Break" },
  { label: "11:00 - 11:50", type: "class", id: "3", title: "P3" },
  { label: "11:50 - 12:40", type: "class", id: "4", title: "P4" },
  { label: "12:40 - 13:40", type: "lunch", id: "lunch", title: "Lunch" },
  { label: "13:40 - 14:30", type: "class", id: "5", title: "P5" },
  { label: "14:30 - 15:20", type: "class", id: "6", title: "P6" },
  { label: "15:20 - 16:10", type: "class", id: "7", title: "P7" },
];

export default function TimetablePage() {
  const { user, userData } = useAuth();
  const { data: allClasses, add, update, remove, loading } = useFirestore<TimetableClass>("timetable", false);
  const { data: allSubjects, add: addSubject, update: updateSubject, remove: removeSubject } = useFirestore<Subject>("subjects", false);
  const { data: usersList } = useFirestore<any>("users", false);
  
  const professors = useMemo(() => usersList.filter((u: any) => u.role === "professor"), [usersList]);

  const isAdmin = userData?.role === "admin";
  const isProfessor = userData?.role === "professor";
  const isStudent = userData?.role === "student";

  const [viewMode, setViewMode] = useState<"class"|"faculty">("class");
  const [viewDept, setViewDept] = useState(userData?.department || "CSE");
  const [viewSection, setViewSection] = useState(userData?.section || "A");
  const [viewFacultyId, setViewFacultyId] = useState(isProfessor ? userData?.uid : "");

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: "class" | "subject" } | null>(null);
  
  const [subjectForm, setSubjectForm] = useState<Subject>({
    department: viewDept, section: viewSection, code: "", name: "", credits: 3, facultyId: "", facultyName: ""
  });

  const [classForm, setClassForm] = useState({
    day: "Monday" as DayOfWeek, periodId: "1", room: "", subjectId: "", department: viewDept, section: viewSection
  });

  const filteredSubjects = useMemo(() => {
    return allSubjects.filter(s => s.department?.toLowerCase() === viewDept.toLowerCase() && s.section?.toLowerCase() === viewSection.toLowerCase());
  }, [allSubjects, viewDept, viewSection]);

  const filteredClasses = useMemo(() => {
    if (isStudent || viewMode === "class") {
      const d = isStudent ? userData?.department : viewDept;
      const s = isStudent ? userData?.section : viewSection;
      if (!d || !s) return [];
      return allClasses.filter((c: any) => c.department?.toLowerCase() === d.toLowerCase() && c.section?.toLowerCase() === s.toLowerCase());
    } else {
      if (!viewFacultyId) return [];
      return allClasses.filter((c: any) => c.facultyId === viewFacultyId);
    }
  }, [allClasses, isStudent, userData, viewMode, viewDept, viewSection, viewFacultyId]);

  const groupedClasses = useMemo(() => {
    const grouped = {} as Record<DayOfWeek, TimetableClass[]>;
    DAYS.forEach(day => grouped[day] = []);
    filteredClasses.forEach((c: any) => {
      const day = c.day as DayOfWeek;
      if (grouped[day]) grouped[day].push(c);
    });
    return grouped;
  }, [filteredClasses]);

  const canEdit = (cDept: string, cSec: string) => {
    if (isAdmin) return true;
    if (isProfessor && userData?.department?.toLowerCase() === cDept.toLowerCase() && userData?.section?.toLowerCase() === cSec.toLowerCase()) return true;
    return false;
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    let fName = subjectForm.facultyName;
    if (subjectForm.facultyId) {
      const p = professors.find((p: any) => p.uid === subjectForm.facultyId);
      if (p) fName = p.displayName;
    }
    const payload = { ...subjectForm, facultyName: fName };

    if (editingId) await updateSubject(editingId, payload);
    else await addSubject(payload);
    
    setShowSubjectModal(false);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const slot = TIME_SLOTS.find(s => s.id === classForm.periodId);
    const sub = allSubjects.find(s => s.id === classForm.subjectId);
    if (!slot || !sub) return;
    
    const [start, end] = slot.label.split(" - ");
    const payload = { 
      day: classForm.day,
      timeStart: start, timeEnd: end,
      room: classForm.room,
      department: classForm.department, section: classForm.section,
      subjectCode: sub.code, subjectName: sub.name,
      facultyId: sub.facultyId, facultyName: sub.facultyName 
    };

    if (editingId) await update(editingId, payload);
    else await add(payload);
    
    setShowClassModal(false);
  };

  const performDelete = async () => {
    if (confirmDelete) {
      if (confirmDelete.type === "class") await remove(confirmDelete.id);
      else await removeSubject(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  if (isStudent && (!userData?.department || !userData?.section)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold">Unassigned Allocation</h1>
      </div>
    );
  }

  const availablePeriods = TIME_SLOTS.filter(s => s.type === "class" && !(classForm.day === "Friday" && s.id === "5"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timetable Management</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {isStudent ? `${userData.department} - Section ${userData.section}` : "View & allocate academic schedules"}
          </p>
        </div>
      </div>

      {!isStudent && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex p-1 bg-[#0a0e17] rounded-xl border border-white/[0.08]">
            <button onClick={() => setViewMode("class")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'class' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-gray-200'}`}><Users className="w-4 h-4" /> Class View</button>
            <button onClick={() => setViewMode("faculty")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'faculty' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-gray-200'}`}><GraduationCap className="w-4 h-4" /> Staff View</button>
          </div>
          
          <div className="flex items-center gap-3">
            {viewMode === "class" ? (
              <>
                <select value={viewDept} onChange={(e) => setViewDept(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-purple-500/50 rounded-lg px-3 py-1.5 text-sm w-24 outline-none">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={viewSection} onChange={(e) => setViewSection(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-purple-500/50 rounded-lg px-3 py-1.5 text-sm w-16 outline-none">
                   {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            ) : (
              <select value={viewFacultyId} onChange={(e) => setViewFacultyId(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-cyan-500/50 rounded-lg px-3 py-1.5 text-sm w-48 outline-none">
                <option value="">Select Faculty...</option>
                {professors.map((p: any) => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      {/* TABS REMOVED */}

      {/* Grid Layout Section */}
      <div className="dash-card overflow-hidden !p-0 mb-8">
          <div className="p-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
            <h3 className="font-bold text-gray-200">Schedule Grid</h3>
            {(isAdmin || isProfessor) && viewMode === "class" && canEdit(viewDept, viewSection) && (
              <button onClick={() => { setClassForm({ ...classForm, department: viewDept, section: viewSection, room: "", subjectId: "" }); setEditingId(null); setShowClassModal(true); }} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Assign Slot</button>
            )}
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse bg-[#0a0e17]/50 min-w-[700px]">
              <thead className="bg-[#05070a] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-3 font-semibold w-16 border-r border-white/[0.06] text-center">Day</th>
                  {TIME_SLOTS.map(slot => (
                    <th key={slot.id} className={`px-1 py-3 font-medium text-center border-r border-white/[0.06] ${slot.type === 'class' ? 'min-w-[75px]' : 'min-w-[40px] opacity-60'}`}>
                      {slot.type === 'class' && <div className="text-[9px] text-purple-400/80 mb-0.5">{slot.title}</div>}
                      <div className="text-[10px] text-gray-500 tracking-tighter">{slot.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-6 text-center text-sm text-gray-500">Loading schedule...</td></tr>
                ) : (
                  DAYS.map((day) => {
                    const dayClasses = groupedClasses[day] || [];
                    return (
                      <tr key={day}>
                        <td className="px-2 py-3 font-bold text-gray-300 border-r border-white/[0.06] bg-[#05070a]/50 text-[10px] uppercase text-center">{day.substring(0,3)}</td>
                        {TIME_SLOTS.map(slot => {
                          if (day === "Friday" && slot.id === "lunch") return <td key={slot.id} colSpan={2} className="border-r border-white/[0.06] bg-emerald-500/10 text-center align-middle"><span className="text-xs font-bold text-emerald-500/80 tracking-widest">JUMMAH PRAYER</span></td>;
                          if (day === "Friday" && slot.id === "5") return null;
                          if (slot.type === "break") return <td key={slot.id} className="border-r border-white/[0.06] bg-amber-500/5 text-center p-2"><div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[10px] text-amber-500/50 font-bold tracking-[0.3em] inline-block">BREAK</div></td>;
                          if (slot.type === "lunch" && day !== "Friday") return <td key={slot.id} className="border-r border-white/[0.06] bg-blue-500/5 text-center p-2"><div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[10px] text-blue-500/50 font-bold tracking-[0.3em] inline-block">LUNCH</div></td>;

                          const slotClasses = dayClasses.filter((c: any) => `${c.timeStart} - ${c.timeEnd}` === slot.label);
                          
                          return (
                            <td key={slot.id} className="p-1 border-r border-white/[0.06] relative group align-top min-h-[110px]">
                              {slotClasses.length > 0 ? (
                                <div className="flex flex-col gap-1 h-full min-h-[100px]">
                                  {slotClasses.map((c: any) => {
                                    const editable = canEdit(c.department || "", c.section || "");
                                    
                                    return (
                                      <div key={c.id} className="relative bg-[#0d121c] rounded-md p-2 border border-white/[0.04] hover:border-purple-500/30 transition-colors shadow-sm flex flex-col min-h-full">
                                        <div className="font-bold text-purple-400 text-xs leading-none mb-1 max-w-[85px] truncate" title={c.subjectName}>{c.subjectCode || "Unk"}</div>
                                        
                                        {!isStudent && editable && (
                                          <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 bg-black/60 rounded p-0.5">
                                            <button onClick={() => setConfirmDelete({ id: c.id!, type: "class" })} className="p-0.5 text-gray-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                          </div>
                                        )}
                                        
                                        {viewMode === "class" ? (
                                          <div className="text-[10px] text-gray-400 truncate mt-1">{c.facultyName ? c.facultyName.split(" ")[0] : "TBA"}</div>
                                        ) : (
                                          <div className="text-[10px] text-gray-400 truncate mt-1">{c.department}-{c.section}</div>
                                        )}
                                        <div className="text-[10px] text-gray-500 truncate mt-0.5">{c.room}</div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : <div className="h-full flex items-center justify-center text-white/[0.02] text-xs">-</div>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Subjects Section */}
        <div className="dash-card overflow-hidden !p-0">
          <div className="p-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
            <h3 className="font-bold text-gray-200">Enrolled Subjects</h3>
            {(isAdmin || isProfessor) && viewMode === "class" && canEdit(viewDept, viewSection) && (
              <button onClick={() => { setSubjectForm({ department: viewDept, section: viewSection, code: "", name: "", credits: 3, facultyId: "", facultyName: "" }); setEditingId(null); setShowSubjectModal(true); }} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Add Subject</button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#05070a] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Subject Title</th>
                  <th className="px-4 py-3 font-semibold text-center">Credits</th>
                  <th className="px-4 py-3 font-semibold">Faculty / Staff</th>
                  {!isStudent && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-sm text-gray-300">
                {filteredSubjects.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-xs italic">No subjects configured for {viewDept}-{viewSection}. Add subjects before building the timetable.</td></tr>
                ) : (
                  filteredSubjects.map(sub => (
                    <tr key={sub.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-3 font-bold text-purple-400 tracking-wider text-xs">{sub.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-100">{sub.name}</td>
                      <td className="px-4 py-3 text-center text-xs"><span className="bg-white/5 px-2 py-0.5 rounded">{sub.credits}</span></td>
                      <td className="px-4 py-3">
                         {sub.facultyName ? <div className="text-sm truncate">{sub.facultyName}</div> : <span className="text-gray-500 italic text-xs">Unassigned</span>}
                      </td>
                      {!isStudent && (
                        <td className="px-4 py-3 text-right">
                          {canEdit(sub.department, sub.section) ? (
                            <button onClick={() => setConfirmDelete({ id: sub.id!, type: "subject" })} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/[0.05] rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                          ) : <span className="text-gray-600 text-xs italic">Read Only</span>}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Class Modal */}
      <AnimatePresence>
        {showClassModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-[#0a0e17] border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Allocate Period</h3><button onClick={() => setShowClassModal(false)}><X className="w-4 h-4 text-gray-400"/></button></div>
              <form onSubmit={handleSaveClass} className="space-y-3">
                 <select required value={classForm.subjectId} onChange={e => setClassForm({ ...classForm, subjectId: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors">
                    <option value="" className="bg-[#0a0e17]">Select Subject...</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id!} className="bg-[#0a0e17]">{s.code} - {s.name}</option>)}
                 </select>
                 <select required value={classForm.day} onChange={e => setClassForm({ ...classForm, day: e.target.value as DayOfWeek })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors">
                    {DAYS.map(d => <option key={d} value={d} className="bg-[#0a0e17]">{d}</option>)}
                 </select>
                 <select required value={classForm.periodId} onChange={e => setClassForm({ ...classForm, periodId: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors">
                    {availablePeriods.map(p => <option key={p.id} value={p.id} className="bg-[#0a0e17]">{p.title} ({p.label})</option>)}
                 </select>
                 <input type="text" placeholder="Room No." value={classForm.room} onChange={e => setClassForm({ ...classForm, room: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors" />
                 <button type="submit" className="w-full btn-primary py-2.5 text-sm mt-2">Save Allocation</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subject Modal */}
      <AnimatePresence>
        {showSubjectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-[#0a0e17] border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Add Subject</h3><button onClick={() => setShowSubjectModal(false)}><X className="w-4 h-4 text-gray-400"/></button></div>
              <form onSubmit={handleSaveSubject} className="space-y-3">
                 <input required type="text" placeholder="Code (e.g. CSD2202)" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none uppercase transition-colors" />
                 <input required type="text" placeholder="Subject Title" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors" />
                 <input required type="number" min={1} max={10} placeholder="Credits" value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 0 })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors" />
                 <select required value={subjectForm.facultyId} onChange={e => setSubjectForm({ ...subjectForm, facultyId: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors">
                    <option value="" className="bg-[#0a0e17]">Assign Faculty...</option>
                    {professors.map((p: any) => <option key={p.uid} value={p.uid} className="bg-[#0a0e17]">{p.displayName}</option>)}
                 </select>
                 <button type="submit" className="w-full btn-primary py-2.5 text-sm mt-3">Create Subject</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={performDelete}
        title="Confirm Delete"
        message={`Are you sure you want to remove this ${confirmDelete?.type}?`}
      />
    </div>
  );
}
