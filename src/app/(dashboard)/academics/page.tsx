"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, ClipboardList, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Import existing pages as components
import AssignmentsPage from "../assignments/page";
import NotesPage from "../notes/page";
import ExamsPage from "../exams/page";
import MarksPage from "../marks/page";

type TabId = "assignments" | "notes" | "exams" | "marks";

export default function AcademicsHub() {
  const { userData } = useAuth();
  const userRole = userData?.role || "student";

  // Filter tabs based on role
  const availableTabs = useMemo(() => {
    const tabs = [];
    if (["professor", "student"].includes(userRole)) {
      tabs.push({ id: "assignments" as TabId, label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> });
      tabs.push({ id: "marks" as TabId, label: "Marks Tracker", icon: <BarChart3 className="w-4 h-4" /> });
    }
    if (userRole === "student") {
      tabs.push({ id: "notes" as TabId, label: "Study Notes", icon: <FileText className="w-4 h-4" /> });
      tabs.push({ id: "exams" as TabId, label: "Exams & Tests", icon: <BookOpen className="w-4 h-4" /> });
    }
    return tabs;
  }, [userRole]);

  const [activeTab, setActiveTab] = useState<TabId>(availableTabs[0]?.id || "assignments");

  return (
    <div className="space-y-6">
      {/* Visual Header / Navigation for the Hub */}
      <div className="flex flex-col gap-4 relative bg-[#030712] pb-6 border-b border-white/[0.06] mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Academics Hub</h1>
          <p className="text-gray-400 mt-1 text-sm">Your single workspace for assignments, notes, exams, and grades.</p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] border border-transparent"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Page Content */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pt-2"
          >
            {activeTab === "assignments" && <AssignmentsPage />}
            {activeTab === "notes" && <NotesPage />}
            {activeTab === "exams" && <ExamsPage />}
            {activeTab === "marks" && <MarksPage />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
