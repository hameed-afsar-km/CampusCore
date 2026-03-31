"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, GraduationCap, Link2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import UsersPage from "../users/page";
import StudentsPage from "../students/page";
import CollaborationPage from "../collaboration/page";

type TabId = "collaboration" | "users" | "students";

export default function CommunityHub() {
  const { userData } = useAuth();
  const userRole = userData?.role || "student";

  const availableTabs = useMemo(() => {
    const tabs = [];
    if (["student", "professor"].includes(userRole)) {
      tabs.push({ id: "collaboration" as TabId, label: "Collaboration & Chat", icon: <Link2 className="w-4 h-4" /> });
    }
    if (userRole === "admin") {
      tabs.push({ id: "users" as TabId, label: "Manage All Users", icon: <Users className="w-4 h-4" /> });
      // Admin might also want to see the chat but traditionally it's restricted. We'll default to Users.
    }
    if (userRole === "professor") {
      tabs.push({ id: "students" as TabId, label: "My Students", icon: <GraduationCap className="w-4 h-4" /> });
    }
    return tabs;
  }, [userRole]);

  const [activeTab, setActiveTab] = useState<TabId>(availableTabs[0]?.id || "collaboration");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 relative bg-[#030712] pb-6 border-b border-white/[0.06] mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Community & Network</h1>
          <p className="text-gray-400 mt-1 text-sm">Connect with peers and manage users.</p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] border border-transparent"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

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
            {activeTab === "collaboration" && <CollaborationPage />}
            {activeTab === "users" && <UsersPage />}
            {activeTab === "students" && <StudentsPage />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
