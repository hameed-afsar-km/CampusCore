"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  FolderKanban,
  Plus,
  Users,
  Calendar,
  MoreHorizontal,
  AlignLeft,
  MessageSquare,
  Link2,
} from "lucide-react";

type ProjectStatus = "planning" | "ongoing" | "completed";

interface Project {
  id: string;
  title: string;
  subject: string;
  status: ProjectStatus;
  deadline: string;
  members: string[];
  tasksCount: number;
  commentsCount: number;
}

const mockProjects: Project[] = [
  {
    id: "1",
    title: "E-Commerce Backend API",
    subject: "Web Development",
    status: "ongoing",
    deadline: "Mar 30, 2026",
    members: ["J", "S", "M"],
    tasksCount: 8,
    commentsCount: 12,
  },
  {
    id: "2",
    title: "AI Chatbot Prototype",
    subject: "Artificial Intelligence",
    status: "planning",
    deadline: "Apr 15, 2026",
    members: ["A", "J"],
    tasksCount: 3,
    commentsCount: 5,
  },
  {
    id: "3",
    title: "Network Packet Analyzer",
    subject: "Computer Networks",
    status: "completed",
    deadline: "Mar 10, 2026",
    members: ["J", "R", "T", "L"],
    tasksCount: 15,
    commentsCount: 20,
  },
];

export default function ProjectsPage() {
  const { userData } = useAuth();
  const [projects] = useState<Project[]>(mockProjects);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "planning": return "border-purple-500 text-purple-400 bg-purple-500/10";
      case "ongoing": return "border-amber-500 text-amber-400 bg-amber-500/10";
      case "completed": return "border-emerald-500 text-emerald-400 bg-emerald-500/10";
    }
  };

  const getStatusBg = (status: ProjectStatus) => {
    switch (status) {
      case "planning": return "bg-purple-500/5 border-purple-500/10";
      case "ongoing": return "bg-amber-500/5 border-amber-500/10";
      case "completed": return "bg-emerald-500/5 border-emerald-500/10";
    }
  };

  const columns: { id: ProjectStatus; title: string; count: number }[] = [
    { id: "planning", title: "Planning 📝", count: projects.filter(p => p.status === 'planning').length },
    { id: "ongoing", title: "Ongoing ⚡", count: projects.filter(p => p.status === 'ongoing').length },
    { id: "completed", title: "Completed ✅", count: projects.filter(p => p.status === 'completed').length },
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-gray-400 mt-1">Manage project workflows and track progress</p>
        </div>
        <button className="btn-primary flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> New Project
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-[768px]">
          {columns.map(column => (
            <div key={column.id} className={`flex-1 flex flex-col rounded-2xl border ${getStatusBg(column.id)} p-4 min-w-[300px]`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200">{column.title}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(column.id)}`}>
                  {column.count}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                <AnimatePresence>
                  {projects.filter(p => p.status === column.id).map(project => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={project.id}
                      className="bg-[#030712] p-4 rounded-xl border border-white/[0.08] hover:border-purple-500/30 cursor-grab active:cursor-grabbing transition-colors shadow-lg shadow-black/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(project.status)}`}>
                          {project.subject}
                        </span>
                        <button className="text-gray-500 hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="font-semibold text-gray-200 mb-3">{project.title}</h4>

                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                         <Calendar className="w-3.5 h-3.5 text-purple-400" /> {project.deadline}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                        {/* Avatar Group */}
                        <div className="flex -space-x-2">
                          {project.members.map((member, i) => (
                            <div key={i} className={`w-6 h-6 rounded-full border border-[#030712] flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                              i % 3 === 0 ? "bg-gradient-to-br from-purple-500 to-indigo-500" :
                              i % 3 === 1 ? "bg-gradient-to-br from-cyan-500 to-blue-500" :
                              "bg-gradient-to-br from-emerald-500 to-teal-500"
                            }`}>
                              {member}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 text-gray-500">
                           <div className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer" title="Tasks">
                             <AlignLeft className="w-3.5 h-3.5" /> <span className="text-xs font-medium">{project.tasksCount}</span>
                           </div>
                           <div className="flex items-center gap-1 hover:text-purple-400 transition-colors cursor-pointer" title="Comments">
                             <MessageSquare className="w-3.5 h-3.5" /> <span className="text-xs font-medium">{project.commentsCount}</span>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {projects.filter(p => p.status === column.id).length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/[0.06] rounded-xl bg-white/[0.01]">
                    <span className="text-sm text-gray-500">Drop projects here</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
