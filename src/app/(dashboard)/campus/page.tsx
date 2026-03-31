"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Trophy, CheckSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import AnnouncementsPage from "../announcements/page";
import EventsPage from "../events/page";
import TodoPage from "../todo/page";

type TabId = "announcements" | "events" | "todo";

export default function CampusLifeHub() {
  const { userData } = useAuth();
  const userRole = userData?.role || "student";

  const availableTabs = useMemo(() => {
    const tabs = [];
    if (["admin", "professor", "student"].includes(userRole)) {
      tabs.push({ id: "announcements" as TabId, label: "Announcements", icon: <Bell className="w-4 h-4" /> });
      tabs.push({ id: "events" as TabId, label: "Events", icon: <Trophy className="w-4 h-4" /> });
      tabs.push({ id: "todo" as TabId, label: "To-Do List", icon: <CheckSquare className="w-4 h-4" /> });
    }
    return tabs;
  }, [userRole]);

  const [activeTab, setActiveTab] = useState<TabId>(availableTabs[0]?.id || "announcements");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 relative bg-[#030712] pb-6 border-b border-white/[0.06] mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Campus Life</h1>
          <p className="text-gray-400 mt-1 text-sm">Stay updated with latest news, events and personal tasks.</p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm"
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
            {activeTab === "announcements" && <AnnouncementsPage />}
            {activeTab === "events" && <EventsPage />}
            {activeTab === "todo" && <TodoPage />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
