"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  Send,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

interface Leave {
  id: string;
  studentName: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "approved" | "rejected" | "pending";
  dateApplied: string;
  type: "Sick Leave" | "Personal" | "Duty Leave";
}

const mockLeaves: Leave[] = [
  {
    id: "1",
    studentName: "John Student",
    reason: "Fever and cold since last night. Need rest as per doctor's advice.",
    startDate: "2026-03-23",
    endDate: "2026-03-24",
    status: "pending",
    dateApplied: "Today, 08:30 AM",
    type: "Sick Leave",
  },
  {
    id: "2",
    studentName: "John Student",
    reason: "Attending state level hackathon at IIT Madras.",
    startDate: "2026-03-15",
    endDate: "2026-03-16",
    status: "approved",
    dateApplied: "Mar 10, 2026",
    type: "Duty Leave",
  },
  {
    id: "3",
    studentName: "John Student",
    reason: "Family emergency back home.",
    startDate: "2026-02-28",
    endDate: "2026-03-01",
    status: "rejected",
    dateApplied: "Feb 27, 2026",
    type: "Personal",
  },
];

export default function LeavesPage() {
  const [search, setSearch] = useState("");
  const { userData } = useAuth();
  const isProfessor = userData?.role === "professor";

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "rejected": return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending": return <Clock className="w-5 h-5 text-amber-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "rejected": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "";
    }
  };

  const filtered = mockLeaves.filter((l) =>
    l.reason.toLowerCase().includes(search.toLowerCase()) || 
    l.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Leave System</h1>
          <p className="text-gray-400 mt-1">{isProfessor ? "Manage student leave requests" : "Apply and track your leave approvals"}</p>
        </div>
        {!isProfessor && (
          <button className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Apply for Leave
          </button>
        )}
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search leaves by reason or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((leave, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={leave.id}
              className="dash-card group p-5 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                     <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getStatusColor(leave.status)}`}>
                        {leave.status}
                     </span>
                     <span className="text-sm font-medium text-gray-400 bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded-lg flex items-center gap-1.5">
                       {leave.type === "Sick" ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <Briefcase className="w-3.5 h-3.5 text-blue-400" />} {leave.type}
                     </span>
                     <span className="text-xs text-gray-500 ml-auto md:ml-0">
                       Applied {leave.dateApplied}
                     </span>
                  </div>

                  {isProfessor && (
                    <h3 className="text-lg font-semibold text-gray-200 mb-1">
                      {leave.studentName}
                    </h3>
                  )}
                  
                  <p className="text-gray-300 leading-relaxed mb-4 text-sm md:text-base border-l-2 border-purple-500/30 pl-3">
                    {leave.reason}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium bg-black/20 px-4 py-2 rounded-xl inline-flex border border-white/[0.04]">
                    <div className="text-gray-400">
                      <span className="text-gray-500 mr-2">From</span> {leave.startDate}
                    </div>
                    <div className="w-px h-4 bg-white/[0.1]" />
                    <div className="text-gray-400">
                      <span className="text-gray-500 mr-2">To</span> {leave.endDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 mt-4 md:mt-0 border-t md:border-t-0 border-white/[0.06]">
                  {isProfessor && leave.status === "pending" ? (
                    <>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all h-full">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all h-full">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] w-24">
                       <div className="mb-2">{getStatusIcon(leave.status)}</div>
                       <span className={`text-[11px] font-bold uppercase tracking-wider ${
                         leave.status === 'approved' ? 'text-emerald-400' :
                         leave.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                       }`}>{leave.status}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
              <Send className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-1">No leave requests</h3>
            <p className="text-sm text-gray-500">You don&apos;t have any leaves matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
