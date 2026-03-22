"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  MoreVertical,
  Calendar as CalendarIcon,
  Search,
  Filter,
} from "lucide-react";

type Status = "pending" | "submitted" | "overdue";

const initialAssignments = [
  {
    id: 1,
    title: "Advanced Database Architecture Design",
    subject: "Database Management Systems",
    dueDate: "2026-03-24T23:59:00",
    status: "pending" as Status,
    type: "Theory",
  },
  {
    id: 2,
    title: "OS Memory Management Simulation",
    subject: "Operating Systems Lab",
    dueDate: "2026-03-22T17:00:00",
    status: "overdue" as Status,
    type: "Practical",
  },
  {
    id: 3,
    title: "React Hooks Implementation",
    subject: "Web Development",
    dueDate: "2026-03-20T23:59:00",
    status: "submitted" as Status,
    type: "Mini Project",
  },
];

export default function AssignmentsPage() {
  const { userData } = useAuth();
  const isProfessor = userData?.role === "professor";

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "submitted">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssignments = initialAssignments.filter((a) => {
    if (activeTab === "pending" && a.status === "submitted") return false;
    if (activeTab === "submitted" && a.status !== "submitted") return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Assignments</h1>
          <p className="text-gray-400 mt-1">Manage your coursework and submissions</p>
        </div>
        {isProfessor && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Assignment
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white/[0.02] p-2 rounded-2xl border border-white/[0.06]">
        {/* Tabs */}
        <div className="flex items-center gap-1 w-full md:w-auto p-1 bg-black/20 rounded-xl border border-white/[0.04]">
          {(["all", "pending", "submitted"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:w-32 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all"
            />
          </div>
          <button className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Assignment Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredAssignments.map((assignment, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              key={assignment.id}
              className="dash-card group relative p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${assignment.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-400' : 
                    assignment.status === 'overdue' ? 'bg-red-500/10 text-red-400' : 
                    'bg-purple-500/10 text-purple-400'}
                `}>
                  {assignment.status === 'submitted' ? <CheckCircle2 className="w-5 h-5" /> :
                   assignment.status === 'overdue' ? <Clock className="w-5 h-5" /> :
                   <FileText className="w-5 h-5" />}
                </div>
                
                <button className="p-1 rounded-md text-gray-500 hover:bg-white/[0.1] hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    assignment.status === 'submitted' ? 'bg-emerald-500/20 text-emerald-300' :
                    assignment.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {assignment.status}
                  </span>
                  <span className="text-xs text-gray-500 border border-white/[0.1] px-1.5 py-0.5 rounded">
                    {assignment.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-100 line-clamp-1 mb-1" title={assignment.title}>
                  {assignment.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {assignment.subject}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/[0.03] px-2.5 py-1.5 rounded-md border border-white/[0.04]">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </div>

                {!isProfessor && assignment.status !== 'submitted' && (
                  <button className="text-xs font-medium bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 hover:bg-purple-500/40 transition-colors">
                    Upload
                  </button>
                )}
                {!isProfessor && assignment.status === 'submitted' && (
                  <button className="text-xs font-medium text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                    View
                  </button>
                )}
                {isProfessor && (
                   <button className="text-xs font-medium text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors">
                     View Submissions
                   </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
            <FileText className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-1">No assignments found</h3>
          <p className="text-sm text-gray-500">You don&apos;t have any assignments matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
