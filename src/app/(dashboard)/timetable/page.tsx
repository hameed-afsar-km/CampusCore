"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Plus, Trash2, Edit2, X, ShieldAlert, GraduationCap, Users, BookOpen, MapPin, Search } from "lucide-react";

export const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "BBA", "MBA"];
export const SECTIONS = ["A", "B", "C", "D"];

type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface TimetableClass {
  id?: string;
  day: DayOfWeek;
  classId: string;      // FK → classes
  subjectId: string;    // FK → subjects
  subjectCode: string;
  subjectName: string;
  subjectAlias?: string;
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
  classId?: string;     // FK → classes
  department: string;
  section: string;
  code: string;
  name: string;
  alias?: string;
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
  const { data: allTimetable, add, update, remove, loading } = useFirestore<TimetableClass>("timetable", false);
  const { data: allSubjects, add: addSubject, update: updateSubject, remove: removeSubject } = useFirestore<Subject>("subjects", false);
  const { data: usersList } = useFirestore<any>("users", false);
  const { data: classDocsList } = useFirestore<any>("classes", false);
  
  const currentDayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  const [staffSearch, setStaffSearch] = useState("");
  const professors = useMemo(() => {
    let list = usersList.filter((u: any) => u.role === "professor");
    if (staffSearch) {
      list = list.filter((p: any) => p.displayName?.toLowerCase().includes(staffSearch.toLowerCase()));
    }
    return list;
  }, [usersList, staffSearch]);

  const activeClassDocs = useMemo(() => classDocsList.filter((c: any) => c.isActive !== false), [classDocsList]);

  const isAdmin = userData?.role === "admin";
  const isProfessor = userData?.role === "professor";
  const isStudent = userData?.role === "student";

  const [viewMode, setViewMode] = useState<"class"|"faculty">("class");
  const [viewDept, setViewDept] = useState(userData?.department || "CSE");
  const [viewSection, setViewSection] = useState(userData?.section || "A");
  const [viewClassId, setViewClassId] = useState(userData?.classId || "");
  const [viewFacultyId, setViewFacultyId] = useState(isProfessor ? userData?.uid : "");

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: "class" | "subject" } | null>(null);
  
  const [subjectForm, setSubjectForm] = useState<Subject>({
    classId: "", department: viewDept, section: viewSection, code: "", name: "", alias: "", credits: 3, facultyId: "", facultyName: ""
  });

  const [classForm, setClassForm] = useState({
    day: "Monday" as DayOfWeek, periodId: "1", room: "", subjectId: "", department: viewDept, section: viewSection
  });

  const filteredSubjects = useMemo(() => {
    if (viewClassId) return allSubjects.filter(s => s.classId === viewClassId);
    return allSubjects.filter(s =>
      s.department?.toLowerCase() === viewDept.toLowerCase() &&
      s.section?.toLowerCase() === viewSection.toLowerCase()
    );
  }, [allSubjects, viewDept, viewSection, viewClassId]);

  const filteredClasses = useMemo(() => {
    if (viewMode === "faculty") {
      if (!viewFacultyId) return [];
      return allTimetable.filter((c: any) => c.facultyId === viewFacultyId);
    }
    if (isStudent) {
      const d = userData?.department;
      const s = userData?.section;
      if (!d || !s) return [];
      return allTimetable.filter((c: any) =>
        c.department?.toLowerCase() === d.toLowerCase() &&
        c.section?.toLowerCase() === s.toLowerCase()
      );
    }
    return allTimetable.filter((c: any) =>
      c.department?.toLowerCase() === viewDept.toLowerCase() &&
      c.section?.toLowerCase() === viewSection.toLowerCase()
    );
  }, [allTimetable, isStudent, userData, viewMode, viewDept, viewSection, viewFacultyId]);

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
    let resolvedClassId = subjectForm.classId || "";
    if (!resolvedClassId && viewClassId) resolvedClassId = viewClassId;
    
    const payload = { ...subjectForm, facultyName: fName, classId: resolvedClassId };
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
      classId: sub.classId || "",
      subjectId: sub.id || "",
      subjectCode: sub.code, subjectName: sub.name, subjectAlias: sub.alias,
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
          
          <div className="flex items-center gap-2">
            {viewMode === "class" ? (
              <div className="flex gap-2">
                <select value={viewDept} onChange={(e) => setViewDept(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-purple-500/50 rounded-lg px-3 py-1.5 text-sm w-24 outline-none">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={viewSection} onChange={(e) => setViewSection(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-purple-500/50 rounded-lg px-3 py-1.5 text-sm w-16 outline-none">
                   {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input type="text" placeholder="Search Staff..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-cyan-500/50 rounded-lg pl-8 pr-2 py-1.5 text-sm w-32 outline-none" />
                </div>
                <select value={viewFacultyId} onChange={(e) => setViewFacultyId(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-cyan-500/50 rounded-lg px-3 py-1.5 text-sm w-40 outline-none">
                  <option value="">Select Faculty...</option>
                  {professors.map((p: any) => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dash-card overflow-hidden !p-0 mb-8">
        <div className="p-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
          <h3 className="font-bold text-gray-200">Schedule Grid</h3>
          {(isAdmin || isProfessor) && viewMode === "class" && canEdit(viewDept, viewSection) && (
            <button onClick={() => { setClassForm({ ...classForm, department: viewDept, section: viewSection, room: "", subjectId: "" }); setEditingId(null); setShowClassModal(true); }} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Assign Slot</button>
          )}
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse bg-[#0a0e17]/50 min-w-[700px]">
            <thead className="bg-[#05070a] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-widest text-center">
              <tr>
                <th className="px-3 py-3 w-16 border-r border-white/[0.06]">Day</th>
                {TIME_SLOTS.map(slot => (
                  <th key={slot.id} className="px-1 py-3 border-r border-white/[0.06] min-w-[75px]">
                    <div className="text-[9px] text-purple-400/80 mb-0.5">{slot.title}</div>
                    <div className="text-[10px] text-gray-500 tracking-tighter">{slot.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const dayClasses = groupedClasses[day];
                const isToday = day === currentDayName;

                return (
                  <tr key={day} className={`border-b border-white/[0.04] transition-all ${isToday ? "bg-purple-500/5 relative after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-purple-500" : ""}`}>
                    <td className="px-3 py-4 text-center font-bold text-gray-500 text-[10px] uppercase border-r border-white/[0.06] bg-black/10">
                      <span className={isToday ? "text-purple-400" : ""}>{day.substring(0,3)}</span>
                    </td>
                    {TIME_SLOTS.map((slot, sIdx) => {
                      if (slot.type !== "class") {
                        return <td key={slot.id} className="p-0 border-r border-white/[0.04] bg-white/[0.01]"><div className="text-[8px] uppercase font-bold text-gray-700 text-center">{slot.title}</div></td>;
                      }

                      // Merging Logic
                      const currentClass = dayClasses.find(c => c.timeStart === slot.label.split(" - ")[0]);
                      
                      // Check if already merged in previous slot
                      if (sIdx > 0) {
                        const prevSlot = TIME_SLOTS[sIdx-1];
                        if (prevSlot.type === "class") {
                           const prevClass = dayClasses.find(c => c.timeStart === prevSlot.label.split(" - ")[0]);
                           if (currentClass && prevClass && currentClass.subjectId === prevClass.subjectId && currentClass.room === prevClass.room) {
                             return null;
                           }
                        }
                      }

                      let colSpan = 1;
                      if (currentClass) {
                        for (let i = sIdx + 1; i < TIME_SLOTS.length; i++) {
                          const nextSlot = TIME_SLOTS[i];
                          if (nextSlot.type !== "class") break;
                          const nextClass = dayClasses.find(nc => nc.timeStart === nextSlot.label.split(" - ")[0]);
                          if (nextClass && nextClass.subjectId === currentClass.subjectId && nextClass.room === currentClass.room) {
                            colSpan++;
                          } else break;
                        }
                      }

                      const editable = canEdit(viewDept, viewSection);

                      return (
                        <td key={slot.id} colSpan={colSpan} className="p-1 border-r border-white/[0.04] group h-full">
                          {currentClass ? (
                            <div className="bg-[#0d121c] rounded-md p-2 border border-white/[0.04] hover:border-purple-500/30 transition-all flex flex-col relative h-full">
                              <div className="font-bold text-purple-400 text-[11px] truncate uppercase" title={currentClass.subjectName}>{currentClass.subjectAlias || currentClass.subjectCode}</div>
                              {colSpan === 1 && <div className="text-[9px] text-gray-400 truncate mt-0.5">{currentClass.subjectName}</div>}
                              <div className="flex items-center gap-1.5 mt-auto pt-1">
                                <div className="flex items-center gap-1 text-[9px] text-gray-500"><MapPin className="w-2.5 h-2.5 opacity-50" /> {currentClass.room || "TBD"}</div>
                                <div className="text-[9px] text-gray-500 truncate opacity-50">| {viewMode === 'class' ? currentClass.facultyName : `${currentClass.department}-${currentClass.section}`}</div>
                              </div>
                              {editable && !isStudent && (
                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setConfirmDelete({ id: currentClass.id!, type: "class" })} className="p-1 text-gray-500 hover:text-red-400 bg-black/40 rounded"><Trash2 className="w-2.5 h-2.5" /></button>
                                </div>
                              )}
                            </div>
                          ) : (
                            editable && !isStudent && viewMode === "class" && (
                              <button onClick={() => { setClassForm({ ...classForm, day, periodId: slot.id, department: viewDept, section: viewSection }); setShowClassModal(true); }} className="w-full h-8 border border-dashed border-white/[0.05] rounded hover:border-purple-500/50 transition-colors opacity-0 group-hover:opacity-100">
                                <Plus className="w-3 h-3 text-purple-500/30" />
                              </button>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-200">Enrolled Subjects</h3>
            {(isAdmin || isProfessor) && viewMode === "class" && canEdit(viewDept, viewSection) && (
              <button onClick={() => { setSubjectForm({ department: viewDept, section: viewSection, code: "", name: "", alias: "", credits: 3, facultyId: "", facultyName: "" }); setEditingId(null); setShowSubjectModal(true); }} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Add Subject</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-500 uppercase border-b border-white/[0.06]">
                <tr>
                   <th className="px-4 py-2">Code</th>
                   <th className="px-4 py-2">Subject Name</th>
                   <th className="px-4 py-2 text-center">Cr.</th>
                   <th className="px-4 py-2">Faculty</th>
                   <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSubjects.map(sub => (
                  <tr key={sub.id} className="text-sm">
                    <td className="px-4 py-3 font-bold text-purple-400">{sub.code} {sub.alias && <span className="text-gray-500 font-normal">({sub.alias})</span>}</td>
                    <td className="px-4 py-3 text-gray-300">{sub.name}</td>
                    <td className="px-4 py-3 text-center">{sub.credits}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{sub.facultyName}</td>
                    <td className="px-4 py-3 text-right">
                       <button onClick={() => setConfirmDelete({ id: sub.id!, type: 'subject' })} className="text-gray-600 hover:text-red-400 p-1"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      <AnimatePresence>
        {showSubjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSubjectModal(false)} className="absolute inset-0 bg-black/60" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-[#0a0e17] border border-white/[0.08] rounded-2xl p-5 shadow-2xl relative">
              <h3 className="font-bold text-white mb-4">Add/Edit Subject</h3>
              <form onSubmit={handleSaveSubject} className="space-y-3">
                 <input required placeholder="Code (e.g. CSD202)" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2.5 text-sm outline-none" />
                 <div className="grid grid-cols-3 gap-2">
                   <input required placeholder="Name" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} className="col-span-2 w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2.5 text-sm outline-none" />
                   <input placeholder="Alias" value={subjectForm.alias} onChange={e => setSubjectForm({ ...subjectForm, alias: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2.5 text-sm outline-none" />
                 </div>
                 <input type="number" placeholder="Credits" value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 0 })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2.5 text-sm outline-none" />
                 <select value={subjectForm.facultyId} onChange={e => setSubjectForm({ ...subjectForm, facultyId: e.target.value })} className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-lg p-2.5 text-sm outline-none">
                    <option value="">Select Faculty (Optional)</option>
                    {professors.map((p: any) => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                 </select>
                 <button type="submit" className="w-full btn-primary py-2.5 mt-2">Save Subject</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowClassModal(false)} className="absolute inset-0 bg-black/60" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-[#0a0e17] border border-white/[0.08] rounded-2xl p-5 shadow-2xl relative">
              <h3 className="font-bold text-white mb-4">Assign Slot</h3>
              <form onSubmit={handleSaveClass} className="space-y-3">
                 <select required value={classForm.subjectId} onChange={e => setClassForm({ ...classForm, subjectId: e.target.value })} className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-lg p-2.5 text-sm">
                    <option value="">Select Subject...</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id!}>{s.name} ({s.code})</option>)}
                 </select>
                 <input placeholder="Room Number (e.g. LAB-1)" value={classForm.room} onChange={e => setClassForm({ ...classForm, room: e.target.value.toUpperCase() })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2.5 text-sm outline-none" />
                 <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-400 capitalize">{classForm.day}</div>
                    <div className="p-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-gray-400">{TIME_SLOTS.find(s => s.id === classForm.periodId)?.label}</div>
                 </div>
                 <button type="submit" className="w-full btn-primary py-2.5 mt-2">Update Schedule</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={performDelete} title="Delete Item?" message="Are you sure you want to delete this from the portal?" />
    </div>
  );
}
