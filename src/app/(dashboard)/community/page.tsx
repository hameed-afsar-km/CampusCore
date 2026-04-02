"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, GraduationCap, ShieldCheck, UserCircle, ArrowLeft, 
  Search, Mail, Building2, LayoutGrid, ChevronRight, 
  Filter, Download, MoreHorizontal, Hash, Upload, X, Check,
  UserPlus, BookOpen, UserCheck, Trash2, ShieldAlert, Key, RotateCcw, Plus, Users2, Settings, QrCode, Tag
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { DEPARTMENTS, SECTIONS } from "@/lib/constants";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

type CategoryId = "admin" | "professor" | "student";

export default function CommunityPage() {
  const { userData, adminCreateUser, adminResetPassword } = useAuth();
  const { data: users, loading, update, remove } = useFirestore<any>("users", false);
  const { data: allSubjects, add: addSubject } = useFirestore<any>("subjects", false);
  const { data: activeClassDocs } = useFirestore<any>("classes", false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const professors = useMemo(() => users.filter((u: any) => u.role === "professor"), [users]);

  // Manage Member Modal State
  const [editUser, setEditUser] = useState<any>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [advSearch, setAdvSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMapping, setImportMapping] = useState<any>({
    nameCol: "1",
    emailCol: "2",
    deptCol: "3",
    sectionCol: "4",
    advisorCol: "5",
    subjectsCol: "6"
  });
  const [isImporting, setIsImporting] = useState(false);
  const [validationReport, setValidationReport] = useState<{ missingSubjects: string[], invalidAdvisors: string[] } | null>(null);

  // Student specific state
  const [studentView, setStudentView] = useState<'friends' | 'faculties'>('friends');
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [showCollabSettings, setShowCollabSettings] = useState(false);

  // General specific state
  const [popupSubject, setPopupSubject] = useState<{code: string, name: string} | null>(null);
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  const stats = useMemo(() => {
    return {
      admin: users.filter(u => u.role === "admin").length,
      professor: users.filter(u => u.role === "professor").length,
      student: users.filter(u => u.role === "student").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!selectedCategory) return [];
    return users.filter(u => 
      u.role === selectedCategory && 
      (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (u.department || "").toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const all = [
      { 
        id: "admin" as CategoryId, 
        title: "Administrators", 
        count: stats.admin,
        icon: <ShieldCheck className="w-6 h-6" />,
        color: "#ef4444",
        bgClass: "from-red-500/20 to-transparent",
        desc: "Governance & Systems Control"
      },
      { 
        id: "professor" as CategoryId, 
        title: "Academic Faculty", 
        count: stats.professor,
        icon: <UserCircle className="w-6 h-6" />,
        color: "#a855f7",
        bgClass: "from-purple-500/20 to-transparent",
        desc: "Subject Experts & Mentors"
      },
      { 
        id: "student" as CategoryId, 
        title: "Students Hub", 
        count: stats.student,
        icon: <GraduationCap className="w-6 h-6" />,
        color: "#06b6d4",
        bgClass: "from-cyan-500/20 to-transparent",
        desc: "Scholars & Active Peer Network"
      }
    ];

    // Students cannot see the student category list, actually they have a completely different UI
    // handled later in the return
    return all;
  }, [stats, userData]);



  const normalizeDept = (dept: string) => {
    if (!dept) return "GLOBAL";
    const d = dept.toUpperCase().trim();
    if (d.includes("COMPUTER SCIENCE") || d.includes("CSE")) return "CSE";
    if (d.includes("INTERNET OF THINGS") || d.includes("IOT")) return "IOT";
    if (d.includes("INFORMATION TECHNOLOGY") || d.includes("IT")) return "IT";
    if (d.includes("CYBER SECURITY") || d.includes("CYBER")) return "CS";
    if (d.includes("ELECTRONICS") || d.includes("ECE")) return "ECE";
    if (d.includes("ELECTRICAL") || d.includes("EEE")) return "EEE";
    if (d.includes("MECHANICAL") || d.includes("MECH")) return "MECH";
    if (d.includes("CIVIL")) return "CIVIL";
    return d;
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !selectedCategory) return;
    setIsImporting(true);

    const processData = async (rawData: any[]) => {
      const successful = [];
      const failed = [];

      for (const row of rawData) {
        try {
          const name = row[parseInt(importMapping.nameCol) - 1]?.toString().trim();
          const email = row[parseInt(importMapping.emailCol) - 1]?.toString().trim();
          const deptRaw = row[parseInt(importMapping.deptCol) - 1]?.toString().trim();
          
          if (!name || !email) continue;

          const profileData: any = {
            role: selectedCategory,
            department: normalizeDept(deptRaw),
          };

          if (selectedCategory === "professor") {
            profileData.section = row[parseInt(importMapping.sectionCol) - 1]?.toString().trim() || "";
            profileData.classAdvisorId = row[parseInt(importMapping.advisorCol) - 1]?.toString().trim() || "";
            const subStr = row[parseInt(importMapping.subjectsCol) - 1]?.toString() || "";
            profileData.subjectsTaught = subStr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== "");
          }

          if (selectedCategory === "student") {
            profileData.section = row[parseInt(importMapping.sectionCol) - 1]?.toString().trim() || "";
            const advisorName = row[parseInt(importMapping.advisorCol) - 1]?.toString().trim() || "";
            // Find professor by name if possible, otherwise store as provided
            const matchedProf = professors.find((p: any) => p.displayName?.toLowerCase() === advisorName.toLowerCase());
            profileData.advisorId = matchedProf?.uid || "";
            profileData.advisorName = matchedProf?.displayName || advisorName;
          }

          await adminCreateUser(email, "Password123!", name, profileData);
          successful.push(email);
        } catch (err) {
          failed.push(row[parseInt(importMapping.emailCol) - 1]);
        }
      }
      return { successful, failed };
    };

    const reader = new FileReader();
    reader.onload = async (evt) => {
      let data: any[] = [];
      if (importFile.name.endsWith('.csv')) {
        const results = Papa.parse(evt.target?.result as string, { header: false, skipEmptyLines: true });
        data = results.data;
      } else {
        const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      }

      const rows = data.slice(1);
      
      // Perform Validation if not already validated
      if (!validationReport) {
        const missingSubs = new Set<string>();
        const badAdvisors = new Set<string>();
        
        rows.forEach(row => {
          if (selectedCategory === "professor") {
            const subs = row[parseInt(importMapping.subjectsCol) - 1]?.toString().split(',').map((s: string) => s.trim()) || [];
            subs.forEach((s: string) => {
              if (s && !allSubjects.find((sub: any) => sub.code === s || sub.alias === s)) {
                missingSubs.add(s);
              }
            });
          }
          if (selectedCategory === "student") {
            const advisorName = row[parseInt(importMapping.advisorCol) - 1]?.toString().trim() || "";
            if (advisorName && !professors.find((p: any) => p.displayName?.toLowerCase() === advisorName.toLowerCase())) {
              badAdvisors.add(advisorName);
            }
          }
        });

        if (missingSubs.size > 0 || badAdvisors.size > 0) {
          setValidationReport({ 
            missingSubjects: Array.from(missingSubs), 
            invalidAdvisors: Array.from(badAdvisors) 
          });
          setIsImporting(false);
          return;
        }
      }

      await processData(rows);
      setIsImporting(false);
      setShowImportModal(false);
      setImportFile(null);
      setValidationReport(null);
    };

    if (importFile.name.endsWith('.csv')) {
      reader.readAsText(importFile);
    } else {
      reader.readAsBinaryString(importFile);
    }
  };

  if (selectedCategory) {
    const activeCat = categories.find(c => c.id === selectedCategory)!;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/[0.05]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
              className="p-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-all" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                <span style={{ color: activeCat.color }}>{activeCat.icon}</span>
                {activeCat.title}
              </h1>
              <p className="text-gray-500 text-xs mt-0.5 tracking-wide uppercase font-black">{activeCat.count} Records Found</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group/search">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/search:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Quick Filter..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#050505] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-white/20 transition-all w-full md:w-56"
              />
            </div>
            {userData?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditUser({
                      displayName: "",
                      email: "",
                      role: selectedCategory,
                      department: "",
                      section: "",
                      subjectsTaught: [],
                      classAdvisorId: "",
                      advisorId: "",
                      advisorName: ""
                    });
                    setIsAddingNew(true);
                    setShowManageModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <UserPlus className="w-4 h-4" /> Add Member
                </button>
                <button 
                  onClick={() => { setIsAddingNew(false); setShowImportModal(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <Upload className="w-4 h-4" /> Import
                </button>
              </div>
            )}
            <button className="p-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all">
               <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Excel Style Sheet */}
        <div className="bg-[#050505] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0a0a0a] border-b border-white/[0.08] text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-4 w-[5%] border-r border-white/[0.04] text-center"><Hash className="w-3 h-3 mx-auto" /></th>
                  <th className="px-6 py-4 w-[20%] border-r border-white/[0.04]">Full Legal Name</th>
                  <th className="px-6 py-4 w-[20%] border-r border-white/[0.04]">Institutional Email</th>
                  <th className="px-6 py-4 w-[10%] border-r border-white/[0.04]">Dept</th>
                  {selectedCategory === "student" && <th className="px-6 py-4 border-r border-white/[0.04] text-center">Sec</th>}
                  {selectedCategory === "professor" ? (
                    <>
                      <th className="px-6 py-4 w-[15%] border-r border-white/[0.04]">Advisor Of</th>
                      <th className="px-6 py-4 w-[18%] border-r border-white/[0.04]">Subjects Taught</th>
                    </>
                  ) : selectedCategory === "student" ? (
                    <th className="px-6 py-4 w-[25%] border-r border-white/[0.04]">Assigned Class Advisor</th>
                  ) : null}
                  {userData?.role === 'admin' && (
                    <>
                      <th className="px-6 py-4 w-[10%] border-r border-white/[0.04] text-center">Lifecycle</th>
                      <th className="px-6 py-4 w-[10%] text-center">Manage</th>
                    </>
                  )}
                  {userData?.role === 'professor' && (
                    <th className="px-6 py-4 w-[10%] text-center">Status</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-600 animate-pulse font-mono tracking-widest">Synchronizing Encrypted Directory Data...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-600 italic">No matching records found in institutional database.</td></tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={u.uid} className="hover:bg-cyan-500/[0.02] group/row transition-all duration-150">
                      <td className="px-6 py-3.5 text-center text-[10px] font-mono text-gray-600 border-r border-white/[0.04]">{idx + 1}</td>
                      <td className="px-6 py-3.5 border-r border-white/[0.04]">
                         <div className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover/row:border-white/20 transition-all font-mono">
                             {u.displayName?.[0] || "?"}
                           </div>
                           <span className="text-sm font-semibold text-gray-200 group-hover/row:text-white transition-colors truncate">{u.displayName}</span>
                         </div>
                      </td>
                      <td className="px-6 py-3.5 border-r border-white/[0.04] text-xs font-mono text-gray-500 group-hover/row:text-gray-300 transition-colors truncate">
                        {u.email}
                      </td>
                      <td className="px-6 py-3.5 border-r border-white/[0.04] text-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                          {u.role === 'admin' ? "GLOBAL" : (u.department || "GLOBAL")}
                        </span>
                      </td>
                      {selectedCategory === "student" && (
                        <td className="px-6 py-3.5 border-r border-white/[0.04] text-center">
                          <span className="text-xs font-bold text-gray-400">
                             {u.section || "—"}
                          </span>
                        </td>
                      )}

                      {selectedCategory === "professor" ? (
                        <>
                          <td className="px-6 py-3.5 border-r border-white/[0.04]">
                            {u.classAdvisorId ? (
                              <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10 w-fit">
                                <UserCheck className="w-3 h-3" /> 
                                {(() => {
                                  const cls = activeClassDocs.find((c: any) => c.id === u.classAdvisorId);
                                  return cls ? `${cls.department}-${cls.section} (Year ${Math.ceil(cls.semester / 2) || 1})` : "Class Allotted";
                                })()}
                              </div>
                            ) : <span className="text-[10px] text-gray-700 italic">No Class Assigned</span>}
                          </td>
                          <td className="px-6 py-3.5 border-r border-white/[0.04]">
                             <div className="flex flex-wrap gap-1">
                               {(u.subjectsTaught || []).slice(0, 2).map((sCode: string, i: number) => {
                                 const sub = allSubjects.find((s:any) => s.code === sCode || s.alias === sCode);
                                 return (
                                   <button 
                                     key={i} 
                                     onClick={() => setPopupSubject({ code: sCode, name: sub?.name || 'Unknown Subject' })}
                                     className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                     title="Click for details"
                                   >
                                     {sCode}
                                   </button>
                                 );
                               })}
                               {(u.subjectsTaught || []).length > 2 && <span className="text-[9px] text-gray-600">+{u.subjectsTaught.length - 2} more</span>}
                               {(u.subjectsTaught || []).length === 0 && <span className="text-[10px] text-gray-700 italic">None</span>}
                             </div>
                          </td>
                        </>
                      ) : selectedCategory === "student" ? (
                        <td className="px-6 py-3.5 border-r border-white/[0.04]">
                          {u.advisorName ? <div className="text-xs text-gray-400 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" /> {u.advisorName}</div> : <span className="text-[10px] text-gray-700 italic">Unassigned</span>}
                        </td>
                      ) : null}

                      {userData?.role === 'admin' && (
                        <>
                          <td className="px-6 py-3.5 border-r border-white/[0.04] text-center">
                            <div className="flex justify-center">
                              <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400 tracking-widest">Active</div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                               <button 
                                 onClick={() => { setEditUser(u); setShowManageModal(true); setIsAddingNew(false); }}
                                 className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-cyan-400 transition-colors"
                               >
                                 <MoreHorizontal className="w-4 h-4" />
                               </button>
                            </div>
                          </td>
                        </>
                      )}
                      {userData?.role === 'professor' && (
                        <td className="px-6 py-3.5 text-center">
                           <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400 tracking-widest w-fit mx-auto">Verified</div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#0a0a0a] border-t border-white/[0.08] px-6 py-3 flex items-center justify-between">
             <div className="flex gap-4">
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Master Directory</span>
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Indices: {filteredUsers.length}</span>
             </div>
             <div className="text-[10px] text-gray-600 font-mono italic">Secure Context • CampusCore Infrastructure v2.1</div>
          </div>
        </div>

        {/* Import Modal */}
        <AnimatePresence>
          {showImportModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-[#0a0a0a] border border-white/[0.1] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
              >
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-cyan-400" />
                    Data Integration Engine
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">Import bulk records into {activeCat.title} category.</p>
                </div>

                <form onSubmit={handleImportSubmit} className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[1.5rem] p-8 text-center cursor-pointer transition-all ${
                      importFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    {importFile ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                          <Check className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-emerald-400">{importFile.name}</p>
                        <p className="text-[10px] text-emerald-500/60 uppercase font-black tracking-widest">Ready for extraction</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto text-gray-500">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-300">Drop XLSV or CSV file</p>
                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Maximum size 10MB</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest pl-1">Name Column #</label>
                      <input type="number" value={importMapping.nameCol} onChange={e => setImportMapping({...importMapping, nameCol: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-gray-100 outline-none focus:border-white/20 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest pl-1">Email Column #</label>
                      <input type="number" value={importMapping.emailCol} onChange={e => setImportMapping({...importMapping, emailCol: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-gray-100 outline-none focus:border-white/20 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest pl-1">Dept. Column #</label>
                      <input type="number" value={importMapping.deptCol} onChange={e => setImportMapping({...importMapping, deptCol: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-gray-100 outline-none focus:border-white/20 text-sm" />
                    </div>
                    {selectedCategory !== 'admin' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest pl-1">Section Column #</label>
                        <input type="number" value={importMapping.sectionCol} onChange={e => setImportMapping({...importMapping, sectionCol: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-gray-100 outline-none focus:border-white/20 text-sm" />
                      </div>
                    )}
                    {selectedCategory === 'professor' && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest pl-1">Advisor Of (ClassID) #</label>
                          <input type="number" value={importMapping.advisorCol} onChange={e => setImportMapping({...importMapping, advisorCol: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-gray-100 outline-none focus:border-white/20 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest pl-1">Subjects (Comma separated) #</label>
                          <input type="number" value={importMapping.subjectsCol} onChange={e => setImportMapping({...importMapping, subjectsCol: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-gray-100 outline-none focus:border-white/20 text-sm" />
                        </div>
                      </>
                    )}
                    {selectedCategory === 'student' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest pl-1">Advisor Name Column #</label>
                        <input type="number" value={importMapping.advisorCol} onChange={e => setImportMapping({...importMapping, advisorCol: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-gray-100 outline-none focus:border-white/20 text-sm" />
                      </div>
                    )}
                  </div>

                  {validationReport && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
                        <ShieldAlert className="w-4 h-4" /> Integrity Report
                      </div>
                      
                      {validationReport.missingSubjects.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-amber-500/80 font-bold">UNRECOGNIZED SUBJECT CODES:</p>
                          <div className="flex flex-wrap gap-1">
                             {validationReport.missingSubjects.map(s => <span key={s} className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px] text-amber-200">{s}</span>)}
                          </div>
                          <p className="text-[9px] text-amber-500/60 leading-none mt-1">Please create these subjects in Timetable first for proper linking.</p>
                        </div>
                      )}

                      {validationReport.invalidAdvisors.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-amber-500/80 font-bold">UNKNOWN ADVISOR NAMES:</p>
                          <div className="flex flex-wrap gap-1">
                             {validationReport.invalidAdvisors.map(a => <span key={a} className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px] text-amber-200">{a}</span>)}
                          </div>
                          <p className="text-[9px] text-amber-500/60 leading-none mt-1">These will be stored as text only. Linking requires pre-existing accounts.</p>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-gray-500 italic pt-2">Click below again to proceed anyway with partial linking.</p>
                    </div>
                  )}

                  <button 
                    disabled={!importFile || isImporting}
                    className={`w-full font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl ${
                      validationReport ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-white text-black hover:bg-white/90"
                    } disabled:bg-white/10 disabled:text-white/20`}
                  >
                    {isImporting ? (
                      <>Processing Data Structure...</>
                    ) : (
                      <>
                        {validationReport ? "Acknowledge & Sync" : "Execute Batch Transaction"}
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Manage Member Modal */}
        <AnimatePresence>
          {showManageModal && editUser && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.1] rounded-[2rem] p-8 shadow-2xl relative"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {isAddingNew ? <UserPlus className="w-5 h-5 text-cyan-400" /> : <UserCircle className="w-5 h-5 text-cyan-400" />}
                    {isAddingNew ? "Direct Enrollment" : "Manage Member"}
                  </h3>
                  <button onClick={() => { setShowManageModal(false); setIsAddingNew(false); }} className="text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Full Name</label>
                      <input type="text" value={editUser.displayName} onChange={e => setEditUser({...editUser, displayName: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white outline-none focus:border-cyan-500/50" placeholder="e.g. Dr. Alaric Vance" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Institutional Email</label>
                      <input type="email" value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white outline-none focus:border-cyan-500/50" placeholder="user@campus.edu" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Department</label>
                        <select 
                          value={editUser.department || ""} 
                          onChange={e => setEditUser({...editUser, department: e.target.value})}
                          className="w-full bg-[#050505] border border-white/[0.08] rounded-xl p-3 text-white outline-none focus:border-cyan-500/50 [&>option]:bg-[#050505] [&>option]:text-white"
                        >
                          <option value="">Select Dept</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      {editUser.role === 'student' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Section</label>
                          <select 
                            value={editUser.section || ""} 
                            onChange={e => setEditUser({...editUser, section: e.target.value})}
                            className="w-full bg-[#050505] border border-white/[0.08] rounded-xl p-3 text-white outline-none focus:border-cyan-500/50 [&>option]:bg-[#050505] [&>option]:text-white"
                          >
                            <option value="">No Section</option>
                            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                   </div>
                   {editUser.role === 'professor' && (
                      <>
                        <div className="space-y-4 py-4 border-y border-white/[0.05] my-4">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Class Advisory Assignment</label>
                              {editUser.classAdvisorId && (
                                 <button 
                                   onClick={() => setEditUser({ ...editUser, classAdvisorId: "" })}
                                   className="text-[9px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 transition-colors"
                                 >
                                   Remove Advisory
                                 </button>
                              )}
                           </div>
                           <select 
                             value={editUser.classAdvisorId || ""} 
                             onChange={(e) => setEditUser({ ...editUser, classAdvisorId: e.target.value })}
                             className="w-full bg-[#050505] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl p-3 text-sm outline-none transition-all [&>option]:bg-[#050505] [&>option]:text-white"
                           >
                              <option value="" className="bg-[#0a0e17]">Select Class to Allot Advisory...</option>
                              {activeClassDocs.map((cls: any) => (
                                 <option key={cls.id} value={cls.id} className="bg-[#0a0e17]">
                                    {cls.department} - {cls.section} | Semester {cls.semester}
                                 </option>
                              ))}
                           </select>
                           <p className="text-[10px] text-gray-600 italic px-1">Note: The Advisor manages the attendance and records for this specific class section.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Subjects Allotment</label>
                          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-white/[0.02] border border-white/[0.05] rounded-xl min-h-[44px]">
                            {(editUser.subjectsTaught || []).length === 0 && <span className="text-xs text-gray-600 italic px-1 pt-1">No subjects linked yet...</span>}
                            {(editUser.subjectsTaught || []).map((sCode: string) => (
                              <div key={sCode} className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-lg group/tag">
                                 {sCode}
                                 <button 
                                   onClick={() => setEditUser({...editUser, subjectsTaught: editUser.subjectsTaught.filter((x: string) => x !== sCode)})}
                                   className="hover:text-red-400 transition-colors"
                                 >
                                   <X className="w-2.5 h-2.5" />
                                 </button>
                              </div>
                            ))}
                          </div>
                          <div className="relative group/subsearch">
                            <input 
                              type="text" 
                              placeholder="Search Subject Name/Code..." 
                              value={subSearch}
                              onChange={e => setSubSearch(e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 text-white outline-none focus:border-cyan-500/50 text-sm"
                            />
                            {subSearch && (
                               <div className="absolute z-10 w-full mt-1 bg-[#0f0f0f] border border-white/10 rounded-xl max-h-40 overflow-y-auto shadow-2xl flex flex-col">
                                 {allSubjects.filter((s: any) => 
                                   s.name.toLowerCase().includes(subSearch.toLowerCase()) || 
                                   s.code.toLowerCase().includes(subSearch.toLowerCase())
                                 ).map((s: any) => (
                                   <button 
                                     key={s.id} 
                                     onClick={() => {
                                       const current = editUser.subjectsTaught || [];
                                       if (!current.includes(s.code)) {
                                         setEditUser({...editUser, subjectsTaught: [...current, s.code]});
                                       }
                                       setSubSearch("");
                                     }}
                                     className="px-4 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white border-b border-white/[0.03]"
                                   >
                                     <span className="font-bold text-cyan-400 mr-2">{s.code}</span> {s.name}
                                   </button>
                                 ))}
                                  {allSubjects.filter((s: any) => s.name.toLowerCase().includes(subSearch.toLowerCase()) || s.code.toLowerCase().includes(subSearch.toLowerCase())).length === 0 && (
                                    <div className="p-3 bg-white/[0.02] border-t border-white/[0.05]">
                                      <p className="text-[10px] text-gray-600 italic mb-2">No matching subjects found.</p>
                                      <div className="space-y-2 mb-2">
                                        <input type="text" placeholder="Subject Code (e.g. CS101)" value={newSubjectCode} onChange={e => setNewSubjectCode(e.target.value.toUpperCase().replace(/\s/g,''))} className="w-full bg-[#050505] border border-white/[0.08] rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500/50" />
                                        <input type="text" placeholder="Subject Name" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} className="w-full bg-[#050505] border border-white/[0.08] rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500/50" />
                                      </div>
                                      <button 
                                        disabled={!newSubjectCode || !newSubjectName}
                                        onClick={async () => {
                                          const newSubCode = newSubjectCode;
                                          const newSub = {
                                            code: newSubCode,
                                            name: newSubjectName,
                                            department: editUser.department || "GLOBAL",
                                            subjectType: "Theory",
                                            credits: 3,
                                            facultyId: editUser.uid || editUser.id || "",
                                            facultyName: editUser.displayName,
                                            color: "purple"
                                          };
                                          await addSubject(newSub);
                                          const current = editUser.subjectsTaught || [];
                                          if (!current.includes(newSubCode)) {
                                            setEditUser({...editUser, subjectsTaught: [...current, newSubCode]});
                                          }
                                          setSubSearch("");
                                          setNewSubjectCode("");
                                          setNewSubjectName("");
                                        }}
                                        className="w-full py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Plus className="w-3 h-3" /> Create & Assign
                                      </button>
                                    </div>
                                  )}
                               </div>
                            )}
                          </div>
                        </div>
                     </>
                   )}
                   {editUser.role === 'student' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Assign Class Advisor (Faculty)</label>
                        <div className="relative group/advsearch">
                          <input 
                            type="text" 
                            placeholder={editUser.advisorName || "Search Faculty Name..."} 
                            value={advSearch}
                            onChange={e => setAdvSearch(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 text-white outline-none focus:border-cyan-500/50 text-sm"
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                          {advSearch && (
                             <div className="absolute z-10 w-full mt-1 bg-[#0f0f0f] border border-white/10 rounded-xl max-h-40 overflow-y-auto shadow-2xl flex flex-col">
                               {professors.filter((p: any) => p.displayName.toLowerCase().includes(advSearch.toLowerCase())).map((p: any) => (
                                 <button 
                                   key={p.uid} 
                                   onClick={() => {
                                     setEditUser({...editUser, advisorId: p.uid, advisorName: p.displayName});
                                     setAdvSearch("");
                                   }}
                                   className="px-4 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white border-b border-white/[0.03]"
                                 >
                                   <div className="font-bold">{p.displayName}</div>
                                   <div className="text-[10px] text-gray-500">{p.department} Faculty</div>
                                 </button>
                               ))}
                               {professors.filter((p: any) => p.displayName.toLowerCase().includes(advSearch.toLowerCase())).length === 0 && (
                                 <div className="p-3 text-[10px] text-gray-600 italic">No professors found...</div>
                               )}
                             </div>
                          )}
                        </div>
                      </div>
                   )}

                   <div className="pt-4 flex flex-col gap-3">
                      <button 
                        onClick={async () => {
                          if (isAddingNew) {
                            await adminCreateUser(editUser.email, "Password123!", editUser.displayName, editUser);
                          } else {
                            await update(editUser.uid || editUser.id, editUser);
                          }

                          // Auto-Create Missing Subjects Logic
                          if (editUser.role === 'professor' && (editUser.subjectsTaught || []).length > 0) {
                            for (const sCode of editUser.subjectsTaught) {
                              const subjectExists = allSubjects.find((s: any) => s.code === sCode);
                              if (!subjectExists) {
                                await addSubject({
                                  code: sCode,
                                  name: `${sCode} (Auto-Generated)`,
                                  department: editUser.department || "GENERAL",
                                  subjectType: "Theory",
                                  credits: 3,
                                  facultyId: editUser.uid || editUser.id || "",
                                  facultyName: editUser.displayName,
                                  color: "purple"
                                });
                              }
                            }
                          }

                          setShowManageModal(false);
                          setIsAddingNew(false);
                        }}
                        className="w-full bg-cyan-500 text-black font-bold py-3 rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                      >
                         {isAddingNew ? <UserPlus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                         {isAddingNew ? "Confirm Enrollment" : "Save Changes"}
                      </button>
                      {!isAddingNew && (
                        <>
                          <button 
                            onClick={async () => {
                              if (confirm(`Force reset password for ${editUser.displayName}? This will set it to 'CampusCore@123'`)) {
                                await adminResetPassword(editUser.email, "CampusCore@123");
                                alert("Password has been reset to: CampusCore@123");
                              }
                            }}
                            className="w-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold py-3 rounded-xl hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                          >
                             <Key className="w-4 h-4" /> Reset to Default Credentials
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this member? This cannot be undone.")) {
                                await remove(editUser.uid || editUser.id);
                                setShowManageModal(false);
                              }
                            }}
                            className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                          >
                             <Trash2 className="w-4 h-4" /> Delete Account
                          </button>
                        </>
                      )}
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Subject Detail Pop-up */}
        <AnimatePresence>
          {popupSubject && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="w-full max-w-sm bg-[#0a0a0a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl relative"
               >
                 <button onClick={() => setPopupSubject(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-4 h-4"/></button>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center"><BookOpen className="w-5 h-5"/></div>
                   <div>
                     <h3 className="text-xl font-black text-white">{popupSubject.code}</h3>
                     <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Subject Reference</p>
                   </div>
                 </div>
                 <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-center">
                   <p className="text-sm font-medium text-gray-200">{popupSubject.name}</p>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  // ==== STUDENT VIEW ====
  if (userData?.role === 'student') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/[0.05]">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Users2 className="w-6 h-6 text-cyan-400" />
              Community & Collaboration
            </h1>
            <p className="text-gray-500 text-xs mt-0.5 tracking-wide uppercase font-black">Student Network Hub</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setStudentView('friends')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                studentView === 'friends' ? 'bg-cyan-500 text-black' : 'bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Friends
            </button>
            <button 
              onClick={() => setStudentView('faculties')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                studentView === 'faculties' ? 'bg-cyan-500 text-black' : 'bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              All Faculties
            </button>
            <button 
              onClick={() => setShowCollabSettings(true)}
              className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all"
              title="Visibility Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {studentView === 'faculties' && (
          <div className="bg-[#050505] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/[0.08] bg-white/[0.01]">
               <h3 className="text-sm font-bold text-gray-300">Academic Faculty Directory</h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0a0a0a] border-b border-white/[0.08] text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-4 border-r border-white/[0.04]">Faculty Name</th>
                    <th className="px-6 py-4 border-r border-white/[0.04]">Department</th>
                    <th className="px-6 py-4 border-r border-white/[0.04]">Subjects Taught</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {professors.map((p: any) => (
                    <tr key={p.uid} className="hover:bg-cyan-500/[0.02] group/row transition-all duration-150">
                      <td className="px-6 py-3.5 border-r border-white/[0.04]">
                        <div className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-gray-400 font-mono">
                             {p.displayName?.[0] || "?"}
                           </div>
                           <span className="text-sm font-semibold text-gray-200">{p.displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 border-r border-white/[0.04] text-xs font-bold text-gray-400 uppercase">
                        {p.department || "GLOBAL"}
                      </td>
                      <td className="px-6 py-3.5 border-r border-white/[0.04]">
                        <div className="flex flex-wrap gap-1">
                          {(p.subjectsTaught || []).map((sCode: string, i: number) => {
                             const sub = allSubjects.find((s:any) => s.code === sCode || s.alias === sCode);
                             return (
                               <button 
                                 key={i} 
                                 onClick={() => setPopupSubject({ code: sCode, name: sub?.name || 'Unknown Subject' })}
                                 className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                               >
                                 {sCode}
                               </button>
                             );
                          })}
                          {(p.subjectsTaught || []).length === 0 && <span className="text-[10px] text-gray-700 italic">None</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {professors.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-xs text-gray-600 italic">No faculty members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {studentView === 'friends' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invite & Add Friends Section */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-[#050505] p-6 rounded-2xl border border-white/[0.06] shadow-xl space-y-6">
                 <div>
                   <h3 className="font-bold text-white flex items-center gap-2 text-lg"><QrCode className="w-5 h-5 text-purple-400" /> Share Invite Code</h3>
                   <p className="text-xs text-gray-500 mt-1">Generate a code to invite friends.</p>
                 </div>
                 <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 text-center">
                   {userData?.inviteCode ? (
                     <div className="space-y-3">
                       <div className="text-3xl font-black text-white tracking-[0.2em]">{userData.inviteCode}</div>
                       <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Active Code</p>
                     </div>
                   ) : (
                     <button 
                       onClick={() => update(userData.uid, { inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() })}
                       className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-purple-500/20 transition-colors w-full"
                     >
                       Generate Code
                     </button>
                   )}
                 </div>
               </div>

               <div className="bg-[#050505] p-6 rounded-2xl border border-white/[0.06] shadow-xl space-y-4">
                 <div>
                   <h3 className="font-bold text-white flex items-center gap-2 text-lg"><UserPlus className="w-5 h-5 text-cyan-400" /> Accept Invite</h3>
                   <p className="text-xs text-gray-500 mt-1">Enter a friend's code to connect.</p>
                 </div>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Enter 6-digit code..." 
                     value={inviteCodeInput}
                     onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                     className="flex-1 bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 text-white outline-none focus:border-cyan-500/50 text-sm tracking-widest uppercase font-mono"
                   />
                   <button 
                     onClick={async () => {
                       if (!inviteCodeInput) return;
                       const match = users.find((u: any) => u.inviteCode === inviteCodeInput && u.uid !== userData.uid);
                       if (match) {
                         const myFriends = userData?.friends || [];
                         const theirFriends = match.friends || [];
                         if (!myFriends.includes(match.uid)) {
                           await update(userData.uid, { friends: [...myFriends, match.uid] });
                           await update(match.uid, { friends: [...theirFriends, userData.uid] });
                           setInviteCodeInput("");
                           alert(`Connected with ${match.displayName}!`);
                         } else {
                           alert("Already connected with this user.");
                         }
                       } else {
                         alert("Invalid or expired code.");
                       }
                     }}
                     className="px-4 bg-cyan-500 text-black font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-cyan-400 transition-colors"
                   >
                     Connect
                   </button>
                 </div>
               </div>
            </div>

            {/* Friends List Section */}
            <div className="lg:col-span-2 bg-[#050505] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-4 border-b border-white/[0.08] bg-white/[0.01] flex justify-between items-center">
                 <h3 className="font-bold text-white flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-emerald-400" /> Your Network</h3>
                 <span className="text-xs text-gray-500 italic">{(userData?.friends || []).length} Connections</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                 {(!userData?.friends || userData.friends.length === 0) ? (
                   <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                     <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                       <Users2 className="w-8 h-8 text-gray-600" />
                     </div>
                     <div>
                       <p className="text-gray-400 font-medium">No connections yet.</p>
                       <p className="text-xs text-gray-600 mt-1">Share your code or accept a friend's code to start collaborating.</p>
                     </div>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {users.filter((u:any) => (userData.friends || []).includes(u.uid)).map((friend: any) => (
                       <div key={friend.uid} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex items-center gap-4 hover:border-white/[0.1] transition-all group">
                         <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold font-mono">
                           {friend.displayName?.[0] || "?"}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-bold text-white truncate">{friend.displayName}</h4>
                           <p className="text-[10px] text-gray-500 truncate">{friend.department || "General"} • {friend.section || ""}</p>
                         </div>
                         {/* We can envision a future button to view profile/collaboration stuff here */}
                         <button className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white hover:bg-white/[0.1]">
                           <ChevronRight className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Settings Modal */}
        <AnimatePresence>
          {showCollabSettings && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="w-full max-w-sm bg-[#0a0a0a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl relative"
               >
                 <button onClick={() => setShowCollabSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-4 h-4"/></button>
                 <div className="mb-6">
                   <h3 className="text-xl font-black text-white flex items-center gap-2"><Settings className="w-5 h-5 text-gray-400" /> Visibility Settings</h3>
                   <p className="text-xs text-gray-500 mt-1">Control what your network can see.</p>
                 </div>
                 
                 <div className="space-y-3">
                   {['tasks', 'events', 'notes', 'marks', 'attendance'].map((settingKey) => {
                     const isEnabled = userData?.visibilitySettings?.[settingKey] !== false; // Default true
                     return (
                       <div key={settingKey} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                         <span className="text-sm text-gray-300 capitalize">{settingKey}</span>
                         <button 
                           onClick={() => {
                             const current = userData?.visibilitySettings || {};
                             update(userData.uid, { visibilitySettings: { ...current, [settingKey]: !isEnabled } });
                           }}
                           className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
                         >
                           <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                       </div>
                     );
                   })}
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Re-using Popup Subject for Faculty View too */}
        <AnimatePresence>
          {popupSubject && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="w-full max-w-sm bg-[#0a0a0a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl relative"
               >
                 <button onClick={() => setPopupSubject(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-4 h-4"/></button>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center"><BookOpen className="w-5 h-5"/></div>
                   <div>
                     <h3 className="text-xl font-black text-white">{popupSubject.code}</h3>
                     <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Subject Reference</p>
                   </div>
                 </div>
                 <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-center">
                   <p className="text-sm font-medium text-gray-200">{popupSubject.name}</p>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  // ==== ORIGINAL VIEW FOR OTHERS ====
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 py-10">
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-bold uppercase tracking-widest text-gray-400"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
          Campus Core Intelligence
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
          The <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">Nexus</span> Hub
        </h1>
        <p className="text-gray-500 text-lg">Select a core directive to access institutional data.</p>
      </div>

      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-8 px-6 perspective-[1000px]">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 50, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: i * 0.15, duration: 0.8 }}
            whileHover={{ 
              y: -30, 
              rotateY: 10,
              scale: 1.05,
              transition: { duration: 0.4, ease: "easeOut" }
            }}
            onHoverStart={() => setHoveredIndex(i)}
            onHoverEnd={() => setHoveredIndex(null)}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              relative w-full md:w-[320px] h-[450px] cursor-pointer group
              bg-[#080808] border border-white/[0.08] rounded-[3rem] p-10
              shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]
              flex flex-col items-center text-center overflow-hidden
              ${hoveredIndex !== null && hoveredIndex !== i ? 'grayscale blur-[2px] opacity-40' : 'grayscale-0'}
              transition-all duration-700 ease-in-out
            `}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${cat.bgClass} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/[0.03] group-hover:border-white/[0.1] transition-all duration-1000 group-hover:scale-150`} />

            <div className="relative z-10 flex flex-col items-center h-full">
              <div className="w-20 h-20 rounded-[2rem] bg-[#0c0c0c] border border-white/[0.08] flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500">
                <div style={{ color: cat.color }} className="group-hover:scale-125 transition-transform duration-500">
                  {cat.icon}
                </div>
              </div>

              <h2 className="text-3xl font-black text-white tracking-tight mb-2">{cat.title}</h2>
              <p className="text-gray-500 text-sm font-medium tracking-wide mb-8 opacity-80 group-hover:opacity-100">{cat.desc}</p>
              
              <div className="mt-auto space-y-2">
                <div className="text-6xl font-black text-white/10 group-hover:text-white transition-colors duration-700 tracking-tighter">
                  {cat.count}
                </div>
                <div className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-500">Directory Entries</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
