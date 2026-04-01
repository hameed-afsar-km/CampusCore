"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, GraduationCap, ShieldCheck, UserCircle, ArrowLeft, 
  Search, Mail, Building2, LayoutGrid, ChevronRight, 
  Filter, Download, MoreHorizontal, Hash, Upload, X, Check,
  UserPlus, BookOpen, UserCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

type CategoryId = "admin" | "professor" | "student";

export default function CommunityPage() {
  const { userData, adminCreateUser } = useAuth();
  const { data: users, loading } = useFirestore<any>("users", false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const categories = [
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

          const baseData: any = {
            displayName: name,
            email: email,
            role: selectedCategory,
            department: normalizeDept(deptRaw),
            password: "Password123!", // Temp password for imports
          };

          if (selectedCategory === "professor") {
            baseData.section = row[parseInt(importMapping.sectionCol) - 1]?.toString().trim() || "";
            baseData.classAdvisorId = row[parseInt(importMapping.advisorCol) - 1]?.toString().trim() || "";
            const subStr = row[parseInt(importMapping.subjectsCol) - 1]?.toString() || "";
            baseData.subjectsTaught = subStr.split(',').map(s => s.trim()).filter(s => s !== "");
          }

          if (selectedCategory === "student") {
            baseData.section = row[parseInt(importMapping.sectionCol) - 1]?.toString().trim() || "";
            baseData.advisorName = row[parseInt(importMapping.advisorCol) - 1]?.toString().trim() || "";
          }

          await adminCreateUser(baseData);
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
        const results = Papa.parse(evt.target?.result as string, { header: false });
        data = results.data;
      } else {
        const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      }

      // Skip header row if needed (usually true)
      await processData(data.slice(1));
      setIsImporting(false);
      setShowImportModal(false);
      setImportFile(null);
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
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all text-xs font-bold uppercase tracking-widest"
              >
                 <Upload className="w-4 h-4" /> Import
              </button>
            )}
            <button className="p-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all">
               <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Excel Style Sheet */}
        <div className="bg-[#050505] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
              <thead className="bg-[#0a0a0a] border-b border-white/[0.08] text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-4 w-[5%] border-r border-white/[0.04] text-center"><Hash className="w-3 h-3 mx-auto" /></th>
                  <th className="px-6 py-4 w-[20%] border-r border-white/[0.04]">Full Legal Name</th>
                  <th className="px-6 py-4 w-[20%] border-r border-white/[0.04]">Institutional Email</th>
                  <th className="px-6 py-4 w-[12%] border-r border-white/[0.04]">Dept & Sec</th>
                  {selectedCategory === "professor" ? (
                    <>
                      <th className="px-6 py-4 w-[15%] border-r border-white/[0.04]">Advisor Of</th>
                      <th className="px-6 py-4 w-[18%] border-r border-white/[0.04]">Subjects Taught</th>
                    </>
                  ) : selectedCategory === "student" ? (
                    <th className="px-6 py-4 w-[25%] border-r border-white/[0.04]">Assigned Class Advisor</th>
                  ) : null}
                  <th className="px-6 py-4 w-[10%] border-r border-white/[0.04] text-center">Lifecycle</th>
                  <th className="px-6 py-4 w-[10%] text-center">Manage</th>
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
                      <td className="px-6 py-3.5 border-r border-white/[0.04]">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{u.department || "GLOBAL"}</span>
                        {u.section && <span className="ml-1 text-[10px] text-gray-600">-{u.section}</span>}
                      </td>

                      {selectedCategory === "professor" ? (
                        <>
                          <td className="px-6 py-3.5 border-r border-white/[0.04]">
                            {u.classAdvisorId ? <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10 w-fit"><UserCheck className="w-3 h-3" /> {u.classAdvisorId}</div> : <span className="text-[10px] text-gray-700 italic">No Class Assigned</span>}
                          </td>
                          <td className="px-6 py-3.5 border-r border-white/[0.04]">
                             <div className="flex flex-wrap gap-1">
                               {(u.subjectsTaught || []).slice(0, 2).map((s: string, i: number) => (
                                 <span key={i} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400">{s}</span>
                               ))}
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

                      <td className="px-6 py-3.5 border-r border-white/[0.04] text-center">
                        <div className="flex justify-center">
                          <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400 tracking-widest">Active</div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button className="p-1.5 hover:bg-white/5 rounded text-gray-600 hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                      </td>
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

                  <button 
                    disabled={!importFile || isImporting}
                    className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-white/90 disabled:bg-white/10 disabled:text-white/20 transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    {isImporting ? (
                      <>Processing Data Structure...</>
                    ) : (
                      <>Execute Batch Transaction</>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

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
