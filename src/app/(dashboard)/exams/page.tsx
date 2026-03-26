"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFirestore } from "@/lib/use-firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { CustomSelect } from "@/components/ui/custom-select";
import { format } from "date-fns";
import {
  BookOpen,
  Calendar,
  ListTodo,
  AlertTriangle,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  GraduationCap,
} from "lucide-react";

type ExamType = "Unit Test" | "Mid Term" | "Final" | "Lab";

interface Exam {
  id: string;
  type: ExamType;
  subject: string;
  date: string; // yyyy-MM-dd
  topics: string[];
}

function getDaysLeft(dateStr: string): number {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(dateStr + "T12:00:00");
  examDate.setHours(0, 0, 0, 0);
  return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const EXAM_TYPE_OPTIONS = [
  { value: "Unit Test", label: "Unit Test" },
  { value: "Mid Term", label: "Mid Term" },
  { value: "Final", label: "Final" },
  { value: "Lab", label: "Lab" },
];

const defaultForm = {
  type: "Unit Test" as ExamType,
  subject: "",
  date: "",
  topicsStr: "",
};

export default function ExamsPage() {
  const { data: exams, add, update, remove, loading } = useFirestore<Exam>("exams");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const getExamColor = (type: ExamType) => {
    switch (type) {
      case "Mid Term": return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "Final": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "Lab": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      default: return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    }
  };

  const filtered = exams.filter(
    (e) =>
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.type.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingId(exam.id);
    setForm({
      type: exam.type,
      subject: exam.subject,
      date: exam.date,
      topicsStr: exam.topics.join(", "),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.date) return;
    
    const topics = form.topicsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingId) {
      await update(editingId, {
        type: form.type,
        subject: form.subject,
        date: form.date,
        topics
      });
    } else {
      await add({
        type: form.type,
        subject: form.subject,
        date: form.date,
        topics
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Exams & Tests</h1>
          <p className="text-gray-400 mt-1">Schedule and track your exams — synced to calendar</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Exam / Test
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by subject or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map((exam, i) => {
            const daysLeft = getDaysLeft(exam.date);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={exam.id}
                className="dash-card group relative p-6 hover:border-purple-500/30 transition-all flex flex-col"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(exam)} className="p-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-white/[0.1] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setConfirmDelete(exam.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getExamColor(exam.type)}`}>
                    {exam.type}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                      daysLeft <= 0
                        ? "text-gray-400 bg-gray-500/10 border border-gray-500/20"
                        : daysLeft <= 3
                        ? "text-red-400 bg-red-500/10 border border-red-500/20"
                        : daysLeft <= 7
                        ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                        : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {daysLeft <= 0 ? "Past" : `${daysLeft}d Left`}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-100 mb-1">{exam.subject}</h3>

                <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 p-2.5 rounded-lg border border-white/[0.04] mt-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  {exam.date ? format(new Date(exam.date + "T12:00:00"), "EEE, MMM d, yyyy") : "Invalid Date"}
                </div>

                {exam.topics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5" /> Topics
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {exam.topics.map((topic, idx) => (
                        <span key={idx} className="text-[11px] font-medium text-gray-300 bg-white/[0.05] border border-white/[0.1] px-2 py-0.5 rounded-md">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
          <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">No exams found</h3>
          <p className="text-sm text-gray-500 mb-4">Add your exams to stay organized!</p>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Exam
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
              className="w-full max-w-md bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-400" />{editingId ? "Edit Exam" : "Add Exam / Test"}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Type</label>
                  <CustomSelect value={form.type} onChange={(v) => setForm({ ...form, type: v as ExamType })} options={EXAM_TYPE_OPTIONS} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject *</label>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Compiler Design" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Date *</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Topics (comma-separated)</label>
                  <input value={form.topicsStr} onChange={(e) => setForm({ ...form, topicsStr: e.target.value })} placeholder="e.g. Parsing, Syntax Analysis" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">{editingId ? "Save Changes" : "Add to Schedule"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete Exam?"
        message="This action cannot be undone. This exam will be removed from your schedule and calendar."
      />
    </div>
  );
}

