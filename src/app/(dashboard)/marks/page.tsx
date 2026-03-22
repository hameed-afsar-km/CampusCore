"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
} from "lucide-react";

const subjects = [
  { name: "Data Structures", code: "CS301", marks: 92, grade: "S", trend: "up", change: "+4%" },
  { name: "Database Management", code: "CS302", marks: 88, grade: "A", trend: "up", change: "+2%" },
  { name: "Operating Systems", code: "CS303", marks: 76, grade: "B", trend: "down", change: "-5%" },
  { name: "Computer Networks", code: "CS304", marks: 85, grade: "A", trend: "up", change: "+1%" },
  { name: "Web Development", code: "CS305P", marks: 95, grade: "S", trend: "up", change: "+6%" },
];

const semesters = [
  { sem: "Sem 1", gpa: 8.2 },
  { sem: "Sem 2", gpa: 8.5 },
  { sem: "Sem 3", gpa: 8.1 },
  { sem: "Sem 4", gpa: 8.4 },
  { sem: "Sem 5", gpa: 8.8 },
];

export default function MarksTrackerPage() {
  const { userData } = useAuth();

  // Basic mock calculations
  const totalSubjects = subjects.length;
  const avgMarks = (subjects.reduce((acc, curr) => acc + curr.marks, 0) / totalSubjects).toFixed(1);
  const bestSubject = subjects.reduce((prev, current) => (prev.marks > current.marks) ? prev : current);
  const worstSubject = subjects.reduce((prev, current) => (prev.marks < current.marks) ? prev : current);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Marks Tracker</h1>
          <p className="text-gray-400 mt-1">Analyze your academic performance and GPA trends</p>
        </div>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 opacity-10 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Current CGPA</p>
          </div>
          <div className="flex items-end gap-3">
             <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">8.40</p>
             <div className="flex items-center text-xs text-emerald-400 font-medium mb-1.5 bg-emerald-500/10 px-1.5 py-0.5 rounded">
               <ArrowUpRight className="w-3 h-3" /> +0.25
             </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="dash-card group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 opacity-10 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
               <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Average Marks</p>
          </div>
          <div className="flex items-end gap-3">
             <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">{avgMarks}%</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="dash-card group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 opacity-10 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top Subject</p>
          </div>
          <div>
             <p className="text-[1.1rem] font-bold text-gray-200 line-clamp-1">{bestSubject.name}</p>
             <p className="text-sm text-emerald-400 font-medium mt-1">{bestSubject.marks}%</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="dash-card group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 opacity-10 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
               <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Needs Work</p>
          </div>
          <div>
             <p className="text-[1.1rem] font-bold text-gray-200 line-clamp-1">{worstSubject.name}</p>
             <p className="text-sm text-red-400 font-medium mt-1">{worstSubject.marks}%</p>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Subject-wise Marks Table */}
        <div className="lg:col-span-2 dash-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Current Semester Performance</h3>
            <div className="text-sm text-gray-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
              Semester 5
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-sm font-medium text-gray-400">
                  <th className="pb-3 pt-2 pl-4">Subject</th>
                  <th className="pb-3 pt-2 text-center">Marks</th>
                  <th className="pb-3 pt-2 text-center">Grade</th>
                  <th className="pb-3 pt-2 text-right pr-4">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {subjects.map((subject, i) => (
                  <motion.tr
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    key={subject.code}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 pl-4">
                      <p className="font-semibold text-gray-200 mb-0.5">{subject.name}</p>
                      <p className="text-xs text-gray-500">{subject.code}</p>
                    </td>
                    <td className="py-4 text-center">
                       <span className={`font-medium ${subject.marks >= 90 ? 'text-emerald-400' : subject.marks >= 80 ? 'text-blue-400' : subject.marks >= 70 ? 'text-purple-400' : 'text-amber-400'}`}>
                         {subject.marks}%
                       </span>
                    </td>
                    <td className="py-4 text-center">
                       <span className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.06] inline-flex items-center justify-center font-bold text-sm text-gray-300">
                         {subject.grade}
                       </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`text-xs font-semibold ${subject.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {subject.change}
                        </span>
                        {subject.trend === 'up' ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GPA Trend Chart (Mockup) */}
        <div className="dash-card">
          <h3 className="text-lg font-semibold text-white mb-6">GPA Trend</h3>
          
          <div className="relative h-64 border-l border-b border-white/[0.1] mt-8 ml-4 mb-4">
            {/* Y-Axis Labels */}
            <div className="absolute -left-6 top-0 text-xs text-gray-500">10.0</div>
            <div className="absolute -left-6 top-1/2 text-xs text-gray-500">8.0</div>
            <div className="absolute -left-6 bottom-0 text-xs text-gray-500">6.0</div>
            
            {/* Grid Lines */}
            <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.03]" />
            <div className="absolute top-1/4 left-0 right-0 h-px bg-white/[0.03]" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.03]" />
            <div className="absolute top-3/4 left-0 right-0 h-px bg-white/[0.03]" />

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-between px-4">
              {semesters.map((sem, i) => {
                // Height calculation relative to 10.0 max, base 6.0 min for exaggeration
                const heightPercent = ((sem.gpa - 6) / 4) * 100;
                
                return (
                  <div key={sem.sem} className="flex flex-col items-center gap-2 group w-full px-2 sm:px-4">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.1, type: "spring" }}
                      className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-purple-500/20 to-cyan-400/80 border border-cyan-400/30 relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/[0.1] backdrop-blur-md px-2 py-1 rounded border border-white/[0.1] text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {sem.gpa}
                      </div>
                    </motion.div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{sem.sem}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
