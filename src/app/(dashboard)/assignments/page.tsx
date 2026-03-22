"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  MoreVertical,
  Calendar as CalendarIcon,
  Search,
  Filter,
  X,
  BookOpen,
  Trash2,
  Edit2,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

type Status = "pending" | "submitted" | "overdue";
type AssignmentType = "Theory" | "Practical" | "Mini Project" | "Lab Report";

interface Assignment {
  id: number;
  title: string;
  subject: string;
  dueDate: string;
  status: Status;
  type: AssignmentType;
  description?: string;
}

const initialAssignments: Assignment[] = [
  {
    id: 1,
    title: "Advanced Database Architecture Design",
    subject: "Database Management Systems",
    dueDate: "2026-03-24T23:59:00",
    status: "pending",
    type: "Theory",
    description: "Design a scalable database architecture for a multi-tenant SaaS application. Include ER diagrams and normalization up to 3NF.",
  },
  {
    id: 2,
    title: "OS Memory Management Simulation",
    subject: "Operating Systems Lab",
    dueDate: "2026-03-22T17:00:00",
    status: "overdue",
    type: "Practical",
    description: "Implement a page replacement algorithm (LRU/FIFO/Optimal) simulation in C or Python.",
  },
  {
    id: 3,
    title: "React Hooks Implementation",
    subject: "Web Development",
    dueDate: "2026-03-20T23:59:00",
    status: "submitted",
    type: "Mini Project",
    description: "Build a small web app using React hooks including useState, useEffect, useContext, and custom hooks.",
  },
];

const defaultForm = {
  title: "",
  subject: "",
  dueDate: "",
  type: "Theory" as AssignmentType,
  description: "",
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "submitted">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === "pending" && a.status === "submitted") return false;
    if (activeTab === "submitted" && a.status !== "submitted") return false;
    if (
      searchQuery &&
      !a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.subject.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (a: Assignment) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      subject: a.subject,
      dueDate: a.dueDate.substring(0, 16),
      type: a.type,
      description: a.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim() || !form.dueDate) return;

    if (editingId !== null) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                title: form.title,
                subject: form.subject,
                dueDate: form.dueDate,
                type: form.type,
                description: form.description,
              }
            : a
        )
      );
    } else {
      const newAssignment: Assignment = {
        id: Date.now(),
        title: form.title,
        subject: form.subject,
        dueDate: form.dueDate,
        status: "pending",
        type: form.type,
        description: form.description,
      };
      setAssignments((prev) => [newAssignment, ...prev]);
    }
    setShowModal(false);
  };

  const deleteAssignment = (id: number) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const markSubmitted = (id: number) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "submitted" } : a))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Assignments</h1>
          <p className="text-gray-400 mt-1">Manage your coursework and submissions</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Assignment
        </button>
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

        {/* Search */}
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
                <div
                  className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${
                    assignment.status === "submitted"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : assignment.status === "overdue"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-purple-500/10 text-purple-400"
                  }
                `}
                >
                  {assignment.status === "submitted" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : assignment.status === "overdue" ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(assignment)}
                    className="p-1.5 rounded-md text-gray-500 hover:bg-white/[0.1] hover:text-purple-400 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAssignment(assignment.id)}
                    className="p-1.5 rounded-md text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      assignment.status === "submitted"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : assignment.status === "overdue"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {assignment.status}
                  </span>
                  <span className="text-xs text-gray-500 border border-white/[0.1] px-1.5 py-0.5 rounded">
                    {assignment.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-100 line-clamp-1 mb-1" title={assignment.title}>
                  {assignment.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1">{assignment.subject}</p>
                {assignment.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mt-2 border-l-2 border-white/[0.06] pl-2">
                    {assignment.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/[0.03] px-2.5 py-1.5 rounded-md border border-white/[0.04]">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {assignment.status === "pending" && (
                  <button
                    onClick={() => markSubmitted(assignment.id)}
                    className="text-xs font-medium bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 hover:bg-purple-500/40 transition-colors"
                  >
                    Mark Done
                  </button>
                )}
                {assignment.status === "submitted" && (
                  <button className="text-xs font-medium text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                    View
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
          <p className="text-sm text-gray-500 mb-4">
            You don&apos;t have any assignments matching your criteria.
          </p>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Assignment
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  {editingId ? "Edit Assignment" : "New Assignment"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Database Architecture Design"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Database Management Systems"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Due Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Type
                    </label>
                    <CustomSelect
                      value={form.type}
                      onChange={(v) => setForm({ ...form, type: v as AssignmentType })}
                      options={(["Theory", "Practical", "Mini Project", "Lab Report"] as const).map((t) => ({ value: t, label: t }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Description / Details
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Additional details, requirements, or notes..."
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingId ? "Save Changes" : "Create Assignment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
