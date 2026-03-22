"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  Bell,
  Megaphone,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  Pin,
  MoreVertical,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  role: "admin" | "professor";
  date: string;
  urgent: boolean;
  pinned: boolean;
}

const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Mid-Term Examination Schedule Released",
    content: "The mid-term examination schedule for all semesters has been released. Please check the college portal for detailed subject-wise dates and room allocations.",
    author: "Dr. Admin",
    role: "admin",
    date: "2 hours ago",
    urgent: true,
    pinned: true,
  },
  {
    id: "2",
    title: "Hackathon Registration Extended",
    content: "Great news! The registration deadline for the upcoming CampusCore Hackathon has been extended by 2 days. Make sure to form your teams and register.",
    author: "Prof. Smith",
    role: "professor",
    date: "Yesterday",
    urgent: false,
    pinned: true,
  },
  {
    id: "3",
    title: "Library Due Date Reminder",
    content: "All students are requested to return or renew their borrowed library books before the end of this week to avoid late fees.",
    author: "Library Admin",
    role: "admin",
    date: "Oct 12",
    urgent: false,
    pinned: false,
  },
  {
    id: "4",
    title: "Guest Lecture: AI in Healthcare",
    content: "Join us for an insightful guest lecture on the applications of AI in modern healthcare by Dr. Jenkins from TechMed.",
    author: "Prof. Davis",
    role: "professor",
    date: "Oct 10",
    urgent: false,
    pinned: false,
  },
];

export default function AnnouncementsPage() {
  const [search, setSearch] = useState("");
  const { userData } = useAuth();
  const canPost = userData?.role === "professor" || userData?.role === "admin";

  const filtered = mockAnnouncements.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Announcements</h1>
          <p className="text-gray-400 mt-1">Stay updated with important college notices</p>
        </div>
        {canPost && (
          <button className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> New Announcement
          </button>
        )}
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((announcement, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={announcement.id}
              className={`dash-card group relative p-5 hover:bg-white/[0.03] transition-colors ${
                announcement.urgent ? "border-l-4 border-l-red-500" :
                announcement.pinned ? "border-l-4 border-l-purple-500" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.urgent && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                    {announcement.pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    {announcement.title}
                  </h3>
                  
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    {announcement.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium border-t border-white/[0.06] pt-4">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                        announcement.role === "admin" ? "bg-gradient-to-br from-purple-500 to-indigo-500" :
                        "bg-gradient-to-br from-cyan-500 to-blue-500"
                      }`}>
                        {announcement.author.charAt(0)}
                      </div>
                      {announcement.author}
                      <span className="text-gray-500 ml-1 capitalize px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06]">
                        {announcement.role}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {announcement.date}
                    </div>
                  </div>
                </div>

                <button className="flex-shrink-0 p-1 rounded-md text-gray-500 hover:bg-white/[0.1] hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
              <Megaphone className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-1">No announcements found</h3>
            <p className="text-sm text-gray-500">There are no notices matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
