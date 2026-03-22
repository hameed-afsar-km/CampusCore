"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  ListTodo,
  AlertTriangle,
  Plus,
  Search,
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  type: "Mid Term" | "Final" | "Unit Test" | "Lab";
  topics: string[];
  daysLeft: number;
}

const mockExams: Exam[] = [
  {
    id: "1",
    title: "Second Mid-Term Examination",
    subject: "Compiler Design",
    date: "2026-03-25",
    time: "10:00 AM",
    duration: "2 Hours",
    location: "Block A - 302",
    type: "Mid Term",
    topics: ["Syntax Analysis", "Parsing Techniques", "Symbol Tables"],
    daysLeft: 3,
  },
  {
    id: "2",
    title: "Unit Test 4",
    subject: "Computer Networks",
    date: "2026-03-28",
    time: "11:30 AM",
    duration: "1 Hour",
    location: "Seminar Hall 2",
    type: "Unit Test",
    topics: ["Network Layer", "Routing Algorithms", "IP Addressing"],
    daysLeft: 6,
  },
  {
    id: "3",
    title: "Final Practical Examination",
    subject: "DBMS Lab",
    date: "2026-04-05",
    time: "09:00 AM",
    duration: "3 Hours",
    location: "Database Lab",
    type: "Lab",
    topics: ["SQL Queries", "PL/SQL", "Normalization triggers"],
    daysLeft: 14,
  },
];

export default function ExamsPage() {
  const [search, setSearch] = useState("");
  const { userData } = useAuth();
  const isProfessor = userData?.role === "professor";

  const getExamColor = (type: string) => {
    switch (type) {
      case "Mid Term": return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "Final": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "Lab": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      default: return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    }
  };

  const filtered = mockExams.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Exams & Tests</h1>
          <p className="text-gray-400 mt-1">Schedule, track preparation, and manage exams</p>
        </div>
        {isProfessor && (
          <button className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Schedule Exam
          </button>
        )}
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by subject or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map((exam, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={exam.id}
              className="dash-card group relative p-6 hover:border-purple-500/30 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getExamColor(exam.type)}`}>
                  {exam.type}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                  exam.daysLeft <= 3 ? "text-red-400 bg-red-500/10 border border-red-500/20" : 
                  exam.daysLeft <= 7 ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" : 
                  "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" /> {exam.daysLeft} Days Left
                </span>
              </div>

              <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300 mb-1">
                {exam.title}
              </h3>
              <p className="text-gray-400 font-medium text-sm mb-6">{exam.subject}</p>

              <div className="space-y-3 mt-auto">
                <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 p-2.5 rounded-lg border border-white/[0.04]">
                  <Calendar className="w-4 h-4 text-purple-400" /> {exam.date}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 p-2.5 rounded-lg border border-white/[0.04]">
                    <Clock className="w-4 h-4 text-cyan-400" /> {exam.time}
                  </div>
                   <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 p-2.5 rounded-lg border border-white/[0.04] truncate" title={exam.location}>
                    <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" /> <span className="truncate">{exam.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ListTodo className="w-4 h-4" /> Syllabus / Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {exam.topics.map((topic, i) => (
                    <span key={i} className="text-[11px] font-medium text-gray-300 bg-white/[0.05] border border-white/[0.1] px-2 py-1 rounded-md">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filtered.length === 0 && (
         <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
           <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
             <BookOpen className="w-8 h-8 text-gray-500" />
           </div>
           <h3 className="text-lg font-medium text-gray-300 mb-1">No upcoming exams</h3>
           <p className="text-sm text-gray-500">Relax! There are no tests scheduled matching your criteria.</p>
         </div>
      )}
    </div>
  );
}
