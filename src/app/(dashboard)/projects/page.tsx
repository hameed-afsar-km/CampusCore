"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Users,
  Calendar,
  MoreHorizontal,
  AlignLeft,
  Link2,
  X,
  ExternalLink,
  Tag,
  Edit2,
  Trash2,
  Code2,
  Globe,
  GraduationCap,
  LayoutGrid,
  List,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

type ProjectStatus = "planning" | "ongoing" | "completed";

interface Project {
  id: string;
  title: string;
  description: string;
  subject: string;
  techStack: string[];
  status: ProjectStatus;
  deadline: string;
  members: string[];
  links: { label: string; url: string }[];
  tasksCount: number;
}

const mockProjects: Project[] = [
  {
    id: "1",
    title: "E-Commerce Backend API",
    description: "RESTful API for a multi-vendor e-commerce platform with JWT auth, product management, and payment integration.",
    subject: "Web Development",
    techStack: ["Node.js", "PostgreSQL", "Docker"],
    status: "ongoing",
    deadline: "Mar 30, 2026",
    members: ["J", "S", "M"],
    links: [{ label: "GitHub", url: "#" }, { label: "Live Demo", url: "#" }],
    tasksCount: 8,
  },
  {
    id: "2",
    title: "AI Chatbot Prototype",
    description: "An intelligent chatbot using Gemini API for student FAQs and campus query resolution.",
    subject: "Artificial Intelligence",
    techStack: ["Python", "Gemini API", "FastAPI"],
    status: "planning",
    deadline: "Apr 15, 2026",
    members: ["A", "J"],
    links: [{ label: "GitHub", url: "#" }],
    tasksCount: 3,
  },
  {
    id: "3",
    title: "Network Packet Analyzer",
    description: "A tool to capture and analyze network packets in real-time with filtering and export capabilities.",
    subject: "Computer Networks",
    techStack: ["C", "libpcap", "Python"],
    status: "completed",
    deadline: "Mar 10, 2026",
    members: ["J", "R", "T", "L"],
    links: [{ label: "GitHub", url: "#" }, { label: "Report", url: "#" }],
    tasksCount: 15,
  },
];

const defaultForm = {
  title: "",
  description: "",
  subject: "",
  techStackStr: "",
  status: "planning" as ProjectStatus,
  deadline: "",
  linksStr: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "planning": return "border-purple-500/40 text-purple-400 bg-purple-500/10";
      case "ongoing": return "border-amber-500/40 text-amber-400 bg-amber-500/10";
      case "completed": return "border-emerald-500/40 text-emerald-400 bg-emerald-500/10";
    }
  };

  const getColumnBg = (status: ProjectStatus) => {
    switch (status) {
      case "planning": return "bg-purple-500/5 border-purple-500/10";
      case "ongoing": return "bg-amber-500/5 border-amber-500/10";
      case "completed": return "bg-emerald-500/5 border-emerald-500/10";
    }
  };

  const columns: { id: ProjectStatus; title: string; emoji: string }[] = [
    { id: "planning", title: "Planning", emoji: "📝" },
    { id: "ongoing", title: "Ongoing", emoji: "⚡" },
    { id: "completed", title: "Completed", emoji: "✅" },
  ];

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      subject: p.subject,
      techStackStr: p.techStack.join(", "),
      status: p.status,
      deadline: p.deadline,
      linksStr: p.links.map((l) => `${l.label}|${l.url}`).join(", "),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const techStack = form.techStackStr.split(",").map((t) => t.trim()).filter(Boolean);
    const links = form.linksStr
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [label, url] = l.split("|");
        return { label: label?.trim() || "Link", url: url?.trim() || "#" };
      });

    if (editingId) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, title: form.title, description: form.description, subject: form.subject, techStack, status: form.status, deadline: form.deadline, links }
            : p
        )
      );
    } else {
      const newProject: Project = {
        id: Date.now().toString(),
        title: form.title,
        description: form.description,
        subject: form.subject,
        techStack,
        status: form.status,
        deadline: form.deadline,
        members: ["You"],
        links,
        tasksCount: 0,
      };
      setProjects((prev) => [newProject, ...prev]);
    }
    setShowModal(false);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-gray-400 mt-1">Manage project workflows, links, and progress</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> New Project
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-5 h-full min-w-[860px]">
          {columns.map((column) => (
            <div key={column.id} className={`flex-1 flex flex-col rounded-2xl border ${getColumnBg(column.id)} p-4 min-w-[280px]`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200">
                  {column.emoji} {column.title}
                </h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(column.id)}`}>
                  {projects.filter((p) => p.status === column.id).length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                <AnimatePresence>
                  {projects.filter((p) => p.status === column.id).map((project) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={project.id}
                      className="bg-[#030712] p-4 rounded-xl border border-white/[0.08] hover:border-purple-500/30 transition-colors shadow-lg shadow-black/20 group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(project.status)}`}>
                          {project.subject}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(project)} className="p-1 rounded text-gray-500 hover:text-purple-400 hover:bg-white/[0.1] transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteProject(project.id)} className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-200 mb-2">{project.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>

                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.techStack.map((tech) => (
                          <span key={tech} className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" /> {project.deadline}
                      </div>

                      {/* Links */}
                      {project.links.length > 0 && (
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {project.links.map((link) => (
                            <a
                              key={link.label}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md transition-colors"
                            >
                              <Link2 className="w-3 h-3" /> {link.label}
                              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                        {/* Avatars */}
                        <div className="flex -space-x-2">
                          {project.members.map((member, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full border border-[#030712] flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                                i % 3 === 0 ? "bg-gradient-to-br from-purple-500 to-indigo-500" :
                                i % 3 === 1 ? "bg-gradient-to-br from-cyan-500 to-blue-500" :
                                "bg-gradient-to-br from-emerald-500 to-teal-500"
                              }`}
                            >
                              {member}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer text-xs" title="Tasks">
                            <AlignLeft className="w-3.5 h-3.5" /> {project.tasksCount}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {projects.filter((p) => p.status === column.id).length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/[0.06] rounded-xl bg-white/[0.01]">
                    <span className="text-sm text-gray-600">No projects here</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6 my-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-purple-400" />
                  {editingId ? "Edit Project" : "New Project"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Project Name *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AI Chatbot Prototype" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of what this project does..." rows={2} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject / Context</label>
                    <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Web Development" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Status</label>
                    <CustomSelect
                      value={form.status}
                      onChange={(v) => setForm({ ...form, status: v as ProjectStatus })}
                      options={[
                        { value: "planning", label: "Planning" },
                        { value: "ongoing", label: "Ongoing" },
                        { value: "completed", label: "Completed" },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Deadline</label>
                    <input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="e.g. Apr 30, 2026" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Tech Stack (comma-sep)</label>
                    <input value={form.techStackStr} onChange={(e) => setForm({ ...form, techStackStr: e.target.value })} placeholder="React, Node.js, MongoDB" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Links (format: Label|URL, comma-separated)
                  </label>
                  <input value={form.linksStr} onChange={(e) => setForm({ ...form, linksStr: e.target.value })} placeholder="GitHub|https://github.com/..., Demo|https://..." className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] transition-all">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">{editingId ? "Save Changes" : "Create Project"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
