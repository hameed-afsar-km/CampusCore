"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Plus, Trash2, Edit2, X, ShieldAlert, GraduationCap, Users, BookOpen, MapPin, Search, Calendar } from "lucide-react";
import { DEPARTMENTS, SECTIONS, DAYS, TIME_SLOTS, DayOfWeek, PREDEFINED_COLORS } from "@/lib/constants";

interface TimetableClass {
  id?: string;
  day: DayOfWeek;
  classId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectAlias?: string;
  subjectType?: "Theory" | "Lab" | "LIT";
  slotSubType?: "Theory" | "Lab";
  facultyId: string;
  facultyName: string;
  timeStart: string;
  timeEnd: string;
  room: string;
  department: string;
  section: string;
  color?: string;
}

interface Subject {
  id?: string;
  classId?: string;
  department: string;
  section: string;
  code: string;
  name: string;
  alias?: string;
  subjectType: "Theory" | "Lab" | "LIT";
  credits: number;
  facultyId: string;
  facultyName: string;
  color?: string;
}

export default function TimetablePage() {
  const { user, userData } = useAuth();
  const { data: allTimetable, add, update, remove, loading } = useFirestore<TimetableClass>("timetable", false);
  const { data: allSubjects, add: addSubject, update: updateSubject, remove: removeSubject } = useFirestore<Subject>("subjects", false);
  const { data: usersList } = useFirestore<any>("users", false);
  const { data: classDocsList } = useFirestore<any>("classes", false);
  
  const professors = useMemo(() => usersList.filter((u: any) => u.role === "professor"), [usersList]);
  const activeClassDocs = useMemo(() => classDocsList.filter((c: any) => c.isActive !== false), [classDocsList]);

  const isAdmin = userData?.role === "admin";
  const isProfessor = userData?.role === "professor";
  const isStudent = userData?.role === "student";

  const [viewMode, setViewMode] = useState<"class"|"faculty">("class");
  const [viewDept, setViewDept] = useState(userData?.department || "CSE");
  const [viewSection, setViewSection] = useState(userData?.section || "A");
  const [viewFacultyId, setViewFacultyId] = useState(isProfessor ? userData?.uid : "");

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [facultySearch, setFacultySearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: "class" | "subject" } | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<{ day: DayOfWeek, slotId: string }[]>([]);
  
  const [subjectForm, setSubjectForm] = useState<Subject>({
    classId: "", department: viewDept, section: viewSection, code: "", name: "", alias: "", subjectType: "Theory", credits: 3, facultyId: "", facultyName: "", color: "purple"
  });

  const [classForm, setClassForm] = useState({
    day: "Monday" as DayOfWeek, periodId: "1", room: "", subjectId: "", slotSubType: "Theory" as "Theory" | "Lab", department: viewDept, section: viewSection
  });

  const filteredSubjects = useMemo(() => {
    return allSubjects.filter(s => s.department === viewDept && s.section === viewSection);
  }, [allSubjects, viewDept, viewSection]);

  const timetableData = useMemo(() => {
    if (viewMode === "class") {
      return allTimetable.filter(t => t.department === viewDept && t.section === viewSection);
    } else {
      return allTimetable.filter(t => t.facultyId === viewFacultyId);
    }
  }, [allTimetable, viewMode, viewDept, viewSection, viewFacultyId]);

  const groupedClasses = useMemo(() => {
    const grouped: any = {};
    timetableData.forEach(c => {
      if (!grouped[c.day]) grouped[c.day] = [];
      grouped[c.day].push(c);
    });
    return grouped;
  }, [timetableData]);

  const canEdit = (dept: string, sec: string) => {
    if (isAdmin) return true;
    if (isProfessor && userData?.department === dept) return true;
    return false;
  };

  const toggleSlotSelection = (day: DayOfWeek, slotId: string) => {
    if (!canEdit(viewDept, viewSection)) return;
    
    // Check if slot is occupied
    const slotObj = TIME_SLOTS.find(s => s.id === slotId);
    const dayClasses = (groupedClasses[day] || []) as TimetableClass[];
    const isOccupied = dayClasses.some(c => `${c.timeStart} - ${c.timeEnd}` === slotObj?.label);
    
    if (isOccupied) return;

    const isSelected = selectedSlots.find(s => s.day === day && s.slotId === slotId);
    if (isSelected) {
      setSelectedSlots(selectedSlots.filter(s => !(s.day === day && s.slotId === slotId)));
    } else {
      setSelectedSlots([...selectedSlots, { day, slotId }]);
    }
  };

  const handleSaveBatchClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const sub = allSubjects.find(s => s.id === classForm.subjectId);
    if (!sub || selectedSlots.length === 0) return;

    if (editingId) {
      // Logic for editing a SINGLE existing slot
      const slotSelect = selectedSlots[0];
      const slot = TIME_SLOTS.find(s => s.id === slotSelect.slotId);
      if (!slot) return;
      
      const [start, end] = slot.label.split(" - ");
      const payload: any = { 
        day: slotSelect.day,
        timeStart: start, timeEnd: end,
        room: classForm.room.toUpperCase(),
        department: viewDept, section: viewSection,
        classId: sub.classId || "",
        subjectId: sub.id || "",
        subjectCode: sub.code, subjectName: sub.name, subjectAlias: sub.alias,
        subjectType: sub.subjectType,
        slotSubType: sub.subjectType === "LIT" ? classForm.slotSubType : undefined,
        facultyId: sub.facultyId, facultyName: sub.facultyName,
        color: sub.color || "purple" 
      };
      await update(editingId, payload);
    } else {
      // Logic for BATCH adding new slots
      for (const slotSelect of selectedSlots) {
        const slot = TIME_SLOTS.find(s => s.id === slotSelect.slotId);
        if (!slot) continue;
        
        const [start, end] = slot.label.split(" - ");
        const payload: any = { 
          day: slotSelect.day,
          timeStart: start, timeEnd: end,
          room: classForm.room.toUpperCase(),
          department: viewDept, section: viewSection,
          classId: sub.classId || "",
          subjectId: sub.id || "",
          subjectCode: sub.code, subjectName: sub.name, subjectAlias: sub.alias,
          subjectType: sub.subjectType,
          slotSubType: sub.subjectType === "LIT" ? classForm.slotSubType : undefined,
          facultyId: sub.facultyId, facultyName: sub.facultyName,
          color: sub.color || "purple"
        };
        await add(payload);
      }
    }
    
    setEditingId(null);
    setSelectedSlots([]);
    setShowClassModal(false);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const fac = professors.find((p: any) => p.uid === subjectForm.facultyId);
    const payload = { ...subjectForm, facultyName: fac?.displayName || "TBA" };
    
    if (editingId) await updateSubject(editingId, payload);
    else await addSubject(payload);
    
    setShowSubjectModal(false);
  };

  const performDelete = async () => {
    if (confirmDelete) {
      if (confirmDelete.type === "class") await remove(confirmDelete.id);
      else await removeSubject(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timetable Management</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {isStudent ? `${userData.department} - Section ${userData.section}` : "View & allocate academic schedules"}
          </p>
        </div>
        {(isAdmin || isProfessor) && viewMode === "class" && canEdit(viewDept, viewSection) && (
          <div className="flex gap-2">
            {selectedSlots.length > 0 && (
               <>
                 <button
                   onClick={() => setSelectedSlots([])}
                   className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                   title="Clear Selection"
                 >
                   <X className="w-5 h-5" />
                 </button>
                 <button
                   onClick={() => { setClassForm({ ...classForm, room: "", subjectId: "" }); setShowClassModal(true); }}
                   className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse"
                 >
                   <Calendar className="w-4 h-4" /> Allot {selectedSlots.length} Slots
                 </button>
               </>
            )}
            <button
              onClick={() => { setSubjectForm({ department: viewDept, section: viewSection, code: "", name: "", alias: "", subjectType: "Theory", credits: 3, facultyId: "", facultyName: "", color: "purple" }); setEditingId(null); setShowSubjectModal(true); }}
              className="btn-primary text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>
        )}
      </div>

      {!isStudent && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex p-1 bg-[#0a0e17] rounded-xl border border-white/[0.08]">
              <button onClick={() => setViewMode("class")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'class' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-gray-200'}`}><Users className="w-4 h-4" /> Class View</button>
              <button onClick={() => setViewMode("faculty")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'faculty' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-gray-200'}`}><GraduationCap className="w-4 h-4" /> Staff View</button>
            </div>

            {viewMode === "class" ? (
              <div className="flex items-center gap-2">
                <select value={viewDept} onChange={(e) => setViewDept(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-purple-500/50 rounded-lg px-3 py-1.5 text-sm w-24 outline-none">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={viewSection} onChange={(e) => setViewSection(e.target.value)} className="bg-[#0a0e17] border border-white/[0.08] hover:border-purple-500/50 rounded-lg px-3 py-1.5 text-sm w-16 outline-none">
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={facultySearch}
                  onChange={(e) => { setFacultySearch(e.target.value); setViewFacultyId(""); }}
                  className="w-full bg-[#0a0e17] border border-white/[0.08] hover:border-cyan-500/50 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none transition-all"
                />
              </div>
            )}
          </div>

          {viewMode === "faculty" && (
            <div className="flex flex-wrap gap-2">
              {professors
                .filter((p: any) => !facultySearch || p.displayName?.toLowerCase().includes(facultySearch.toLowerCase()))
                .map((p: any) => (
                  <button
                    key={p.uid}
                    onClick={() => { setViewFacultyId(p.uid); setFacultySearch(p.displayName); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      viewFacultyId === p.uid
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/[0.02] text-gray-400 border-white/[0.06] hover:border-cyan-500/30 hover:text-gray-200"
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" />
                    {p.displayName}
                  </button>
                ))}
            </div>
          )}
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
            <table className="w-full text-left border-collapse bg-[#0a0e17]/50 min-w-[1000px] table-fixed">
              <thead className="bg-[#05070a] border-b border-white/[0.06] text-xs text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-3 font-semibold w-[8%] border-r border-white/[0.06] text-center">Day</th>
                  {TIME_SLOTS.map(slot => (
                    <th key={slot.id} className={`px-1 py-3 font-medium text-center border-r border-white/[0.06] w-[10.2%] ${slot.type !== 'class' ? 'opacity-60' : ''}`}>
                      {slot.type === 'class' && <div className="text-[9px] text-purple-400/80 mb-0.5">{slot.title}</div>}
                      <div className="text-[10px] text-gray-500 tracking-tighter truncate px-1">{slot.label}</div>
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
                    const skipSlots = new Set<string>();
                    
                    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                    const isToday = day === currentDayName;

                    return (
                      <tr key={day} className={isToday ? "bg-cyan-500/[0.03] relative group/today" : ""}>
                        <td className={`px-2 py-3 font-bold border-r border-white/[0.06] bg-[#05070a]/50 text-[10px] uppercase text-center transition-colors ${isToday ? 'text-cyan-400' : 'text-gray-300'}`}>
                          {isToday && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
                          {day.substring(0,3)}
                        </td>
                        {TIME_SLOTS.map((slot, index) => {
                          if (skipSlots.has(slot.id)) return null;

                          if (day === "Friday" && slot.id === "lunch") return <td key={slot.id} colSpan={2} className="border-r border-white/[0.06] bg-emerald-500/10 text-center align-middle"><span className="text-xs font-bold text-emerald-500/80 tracking-widest">JUMMAH PRAYER</span></td>;
                          if (day === "Friday" && slot.id === "5") return null;
                          if (slot.type === "break") return <td key={slot.id} className="border-r border-white/[0.06] bg-amber-500/5 text-center p-2"><div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[10px] text-amber-500/50 font-bold tracking-[0.3em] inline-block">BREAK</div></td>;
                          if (slot.type === "lunch" && day !== "Friday") return <td key={slot.id} className="border-r border-white/[0.06] bg-blue-500/5 text-center p-2"><div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[10px] text-blue-500/50 font-bold tracking-[0.3em] inline-block">LUNCH</div></td>;

                          const slotClasses = dayClasses.filter((c: any) => `${c.timeStart} - ${c.timeEnd}` === slot.label);
                          
                          let mergeColSpan = 1;
                          if (slotClasses.length === 1 && slot.type === "class") {
                            let nextIndex = index + 1;
                            while(nextIndex < TIME_SLOTS.length) {
                               const nextSlot = TIME_SLOTS[nextIndex];
                               if(nextSlot.type === "class") {
                                   const nextClasses = dayClasses.filter((c: any) => `${c.timeStart} - ${c.timeEnd}` === nextSlot.label);
                                   if(nextClasses.length === 1 && nextClasses[0].subjectId === slotClasses[0].subjectId) {
                                       mergeColSpan++;
                                       skipSlots.add(nextSlot.id);
                                   } else { break; }
                               } else { break; }
                               nextIndex++;
                            }
                          }
                          
                          const isSlotSelected = !!selectedSlots.find(s => s.day === day && s.slotId === slot.id);
                          
                          return (
                            <td 
                              key={slot.id} 
                              colSpan={mergeColSpan} 
                              onClick={() => slotClasses.length === 0 && toggleSlotSelection(day, slot.id)}
                              className={`p-1 border-r border-white/[0.06] relative group align-top h-[110px] min-h-[110px] max-h-[110px] overflow-hidden transition-all cursor-pointer ${isSlotSelected ? 'bg-cyan-500/10 ring-1 ring-inset ring-cyan-500/50' : 'hover:bg-white/[0.02]'}`}
                            >
                              {slotClasses.length > 0 ? (
                                <div className="flex flex-col gap-1 h-full min-h-[100px]">
                                  {slotClasses.map((c: any, cIdx: number) => {
                                    const editable = canEdit(c.department || "", c.section || "");
                                    
                                    // Robust color selection: Slot color -> Subject color -> Default purple
                                    const masterSub = allSubjects.find(s => s.id === c.subjectId);
                                    const subColor = c.color || masterSub?.color || "purple";
                                    const colorTheme = PREDEFINED_COLORS.find(pc => pc.id === subColor) || PREDEFINED_COLORS[0];
                                    
                                    return (
                                      <div key={c.id} className={`relative rounded-md p-2 border transition-all shadow-sm flex flex-col min-h-full ${colorTheme.bg} ${colorTheme.border}`}>
                                        <div className={`font-bold text-xs leading-none mb-1 max-w-[85px] truncate ${colorTheme.text}`} title={c.subjectName}>
                                          {c.subjectAlias || c.subjectCode || "Unk"}
                                          {c.subjectType === "LIT" && <span className="text-[9px] text-amber-500 ml-1">({c.slotSubType})</span>}
                                        </div>
                                        
                                        {!isStudent && editable && (
                                          <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 bg-black/80 backdrop-blur-sm rounded p-0.5 transition-opacity z-10">
                                            <button 
                                              onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setEditingId(c.id!); 
                                                setSelectedSlots([{ day: c.day, slotId: TIME_SLOTS.find(s => s.label === `${c.timeStart} - ${c.timeEnd}`)?.id || "1" }]);
                                                setClassForm({ 
                                                  ...classForm, 
                                                  subjectId: c.subjectId, 
                                                  room: c.room || "", 
                                                  slotSubType: c.slotSubType || "Theory" 
                                                }); 
                                                setShowClassModal(true); 
                                              }} 
                                              className="p-0.5 text-gray-400 hover:text-cyan-400"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: c.id!, type: "class" }); }} className="p-0.5 text-gray-400 hover:text-red-400">
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                        
                                        {viewMode === "class" ? (
                                          <div className="text-[10px] text-gray-400 truncate mt-1 w-full" title={c.facultyName}>{c.facultyName || "TBA"}</div>
                                        ) : (
                                          <div className="text-[10px] text-gray-400 truncate mt-1">{c.department}-{c.section}</div>
                                        )}
                                        <div className="text-[10px] text-gray-500 truncate mt-0.5">{c.room}</div>
                                        
                                        {mergeColSpan > 1 && (
                                           <div className="mt-auto pt-1 flex justify-between items-center opacity-40">
                                              <span className="text-[8px] uppercase tracking-tighter text-purple-500 font-bold">Continuous Session</span>
                                              <div className="flex gap-0.5">
                                                {[...Array(mergeColSpan)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-purple-500/50" />)}
                                              </div>
                                           </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                !isStudent && viewMode === "class" && canEdit(viewDept, viewSection) && (
                                  <div className={`w-full h-full min-h-[40px] flex items-center justify-center transition-all ${isSlotSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {isSlotSelected ? <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.8)]"><Plus className="w-3 h-3 text-black" /></div> : <Plus className="w-4 h-4 text-gray-500" />}
                                  </div>
                                )
                              )}
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

        <div className="dash-card overflow-hidden !p-0">
          <div className="p-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
            <h3 className="font-bold text-gray-200">Enrolled Subjects</h3>
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
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-xs italic">No subjects configured. Add subjects before building the timetable.</td></tr>
                ) : (
                  filteredSubjects.map(sub => {
                    const colorTheme = PREDEFINED_COLORS.find(pc => pc.id === sub.color) || PREDEFINED_COLORS[0];
                    return (
                      <tr key={sub.id} className="hover:bg-white/[0.01]">
                        <td className={`px-4 py-3 font-bold tracking-wider text-xs ${colorTheme.text}`}>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorTheme.hex }} />
                             {sub.code} {sub.alias && <span className="text-gray-500 font-normal">({sub.alias})</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-100">{sub.name}</td>
                        <td className="px-4 py-3 text-center text-xs"><span className="bg-white/5 px-2 py-0.5 rounded">{sub.credits}</span></td>
                        <td className="px-4 py-3">
                           {sub.facultyName ? <div className="text-sm truncate">{sub.facultyName}</div> : <span className="text-gray-500 italic text-xs">Unassigned</span>}
                        </td>
                        {!isStudent && (
                          <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                             <button onClick={() => { 
                               setSubjectForm({
                                 classId: sub.classId || "",
                                 department: sub.department,
                                 section: sub.section,
                                 code: sub.code,
                                 name: sub.name,
                                 alias: sub.alias || "",
                                 subjectType: sub.subjectType || "Theory",
                                 credits: sub.credits,
                                 facultyId: sub.facultyId,
                                 facultyName: sub.facultyName,
                                 color: sub.color || "purple"
                               });
                               setEditingId(sub.id!);
                               setShowSubjectModal(true);
                             }} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-white/[0.05] rounded transition-colors"><Edit2 className="w-4 h-4"/></button>
                             <button onClick={() => setConfirmDelete({ id: sub.id!, type: "subject" })} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/[0.05] rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      <AnimatePresence>
        {showClassModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-[#0a0e17] border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Allot Selected Slots</h3><button onClick={() => setShowClassModal(false)}><X className="w-4 h-4 text-gray-400"/></button></div>
              <form onSubmit={handleSaveBatchClass} className="space-y-3">
                 <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl mb-2">
                    <p className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mb-1">Target Selection</p>
                    <p className="text-sm font-medium text-gray-200">{selectedSlots.length} periods selected on current day</p>
                 </div>
                 <select required value={classForm.subjectId} onChange={e => {
                       const sub = allSubjects.find(s => s.id === e.target.value);
                       setClassForm({ ...classForm, subjectId: e.target.value, slotSubType: sub?.subjectType === "LIT" ? "Theory" : "Theory" });
                     }} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-cyan-500 rounded-lg p-2.5 text-sm outline-none transition-colors">
                    <option value="" className="bg-[#0a0e17]">Choose Subject...</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id!} className="bg-[#0a0e17]">{s.code} - {s.name}</option>)}
                 </select>

                 {allSubjects.find(s => s.id === classForm.subjectId)?.subjectType === "LIT" && (
                   <div className="flex gap-4 p-2 bg-white/[0.02] border border-white/[0.08] rounded-xl">
                     <label className="flex items-center gap-2 cursor-pointer flex-1">
                       <input type="radio" name="subtype" value="Theory" checked={classForm.slotSubType === "Theory"} onChange={() => setClassForm({ ...classForm, slotSubType: "Theory" })} className="accent-purple-500" />
                       <span className="text-sm">Theory Class</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer flex-1">
                       <input type="radio" name="subtype" value="Lab" checked={classForm.slotSubType === "Lab"} onChange={() => setClassForm({ ...classForm, slotSubType: "Lab" })} className="accent-blue-500" />
                       <span className="text-sm">Lab Class</span>
                     </label>
                   </div>
                 )}

                 <input type="text" placeholder="Room (e.g. LAB-101)" value={classForm.room} onChange={e => setClassForm({ ...classForm, room: e.target.value.toUpperCase() })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-cyan-500 rounded-lg p-2.5 text-sm outline-none transition-colors uppercase" />
                 
                 <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2.5 text-sm mt-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                    {editingId ? "Update Allotment" : `Confirm ${selectedSlots.length} Allotment(s)`}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubjectModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-[#0a0e17] border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Add Subject</h3><button onClick={() => setShowSubjectModal(false)}><X className="w-4 h-4 text-gray-400"/></button></div>
              <form onSubmit={handleSaveSubject} className="space-y-3">
                 <select
                   value={subjectForm.classId || ""}
                   onChange={e => {
                     const cls = activeClassDocs.find((c: any) => c.id === e.target.value);
                     setSubjectForm({
                       ...subjectForm,
                       classId: e.target.value,
                       department: cls?.department || subjectForm.department,
                       section: cls?.section || subjectForm.section,
                     });
                   }}
                   className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors"
                 >
                   <option value="" className="bg-[#0a0e17]">Link to Class (optional)</option>
                   {activeClassDocs.map((c: any) => (
                     <option key={c.id} value={c.id} className="bg-[#0a0e17]">
                       {c.department}-{c.section} | Sem {c.semester}
                     </option>
                   ))}
                 </select>
                 <input required type="text" placeholder="Code (e.g. CSD2202)" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none uppercase transition-colors" />
                 <select value={subjectForm.subjectType} onChange={e => setSubjectForm({ ...subjectForm, subjectType: e.target.value as any })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors">
                    <option value="Theory" className="bg-[#0a0e17]">Theory</option>
                    <option value="Lab" className="bg-[#0a0e17]">Laboratory (Lab)</option>
                    <option value="LIT" className="bg-[#0a0e17]">Integrated Theory (LIT)</option>
                 </select>
                 <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Subject Name *" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 py-2.5 px-4 text-sm outline-none rounded-lg" />
                  </div>
                  <div>
                    <input value={subjectForm.alias || ""} onChange={(e) => setSubjectForm({ ...subjectForm, alias: e.target.value })} placeholder="Alias" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 py-2.5 px-4 text-sm outline-none rounded-lg" />
                  </div>
                </div>
                 <input required type="number" min={1} max={10} placeholder="Credits" value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 0 })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors" />
                 
                 <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-1">Identify Color</p>
                    <div className="flex flex-wrap gap-2 p-1">
                      {PREDEFINED_COLORS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSubjectForm({ ...subjectForm, color: c.id })}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                            subjectForm.color === c.id ? "border-white scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.id}
                        />
                      ))}
                    </div>
                 </div>

                 <select value={subjectForm.facultyId} onChange={e => setSubjectForm({ ...subjectForm, facultyId: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-lg p-2.5 text-sm outline-none transition-colors">
                    <option value="" className="bg-[#0a0e17]">Assign Faculty (Optional)</option>
                    {professors.map((p: any) => <option key={p.uid} value={p.uid} className="bg-[#0a0e17]">{p.displayName}</option>)}
                 </select>
                 <button type="submit" className="w-full btn-primary py-2.5 text-sm mt-3">{editingId ? "Update Subject" : "Create Subject"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={performDelete} 
        title={`Delete ${confirmDelete?.type === 'class' ? 'Slot' : 'Subject'}`} 
        message={`Are you sure you want to remove this ${confirmDelete?.type === 'class' ? 'timetable slot' : 'subject'}? This action cannot be undone.`} 
      />
    </div>
  );
}
