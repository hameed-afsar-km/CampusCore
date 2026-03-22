"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Plus,
  X,
  Edit2,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  GraduationCap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type SubjectType = "theory" | "lab" | "theory+lab";

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  type: SubjectType;
  
  // Custom Mark Distribution (Weights must sum to 100 in logic)
  internalWeight: number;
  externalWeight: number;
  practicalWeight: number;

  internal1: number | null;  // out of 50
  internal2: number | null;  // out of 50
  endSem: number | null;     // out of 100
  practical: number | null;  // out of practicalMax
  practicalMax: number;      // maximum practical marks (e.g. 50, 100)
}

interface Semester {
  id: string;
  label: string;
  gpa: number | null;
  subjects: Subject[];
}

// ─── Default Data ────────────────────────────────────────────────────────────

const DEFAULT_SEMESTERS: Semester[] = [
  { id: "s1", label: "Semester 1", gpa: 8.2, subjects: [] },
  { id: "s2", label: "Semester 2", gpa: 8.5, subjects: [] },
  { id: "s3", label: "Semester 3", gpa: 8.1, subjects: [] },
  { id: "s4", label: "Semester 4", gpa: 8.4, subjects: [] },
  {
    id: "s5", label: "Semester 5", gpa: null,
    subjects: [
      {
        id: "cs301", name: "Data Structures", code: "CS301", credits: 4,
        type: "theory", internalWeight: 50, externalWeight: 50, practicalWeight: 0,
        internal1: 42, internal2: 45, endSem: 84, practical: null, practicalMax: 0,
      },
      {
        id: "cs302", name: "Database Management", code: "CS302", credits: 4,
        type: "theory", internalWeight: 25, externalWeight: 75, practicalWeight: 0,
        internal1: 38, internal2: 41, endSem: 76, practical: null, practicalMax: 0,
      },
      {
        id: "cs303", name: "Operating Systems", code: "CS303", credits: 3,
        type: "theory+lab", internalWeight: 40, externalWeight: 40, practicalWeight: 20,
        internal1: 35, internal2: 38, endSem: 70, practical: 40, practicalMax: 50,
      },
      {
        id: "cs304", name: "Computer Networks", code: "CS304", credits: 3,
        type: "theory", internalWeight: 50, externalWeight: 50, practicalWeight: 0,
        internal1: 40, internal2: 43, endSem: 80, practical: null, practicalMax: 0,
      },
      {
        id: "cs305", name: "Web Development Lab", code: "CS305P", credits: 2,
        type: "lab", internalWeight: 0, externalWeight: 0, practicalWeight: 100,
        internal1: null, internal2: null, endSem: null, practical: 82, practicalMax: 100,
      },
    ],
  },
];

// ─── Calculation Logic ────────────────────────────────────────────────────────

function calcFinalPercent(sub: Subject): number | null {
  const { type, internal1, internal2, endSem, practical, practicalMax, internalWeight, externalWeight, practicalWeight } = sub;

  if (type === "lab") {
    if (practical === null) return null;
    return (practical / Math.max(1, practicalMax)) * practicalWeight;
  }

  const avgInternal = ((internal1 ?? 0) + (internal2 ?? 0)) / 2; // out of 50

  if (type === "theory") {
    if (endSem === null) return null;
    const intContrib = (avgInternal / 50) * internalWeight;
    const extContrib = (endSem / 100) * externalWeight;
    return intContrib + extContrib;
  }

  // theory+lab
  if (endSem === null && practical === null) return null;
  const intContrib = (avgInternal / 50) * internalWeight;
  const extContrib = endSem !== null ? (endSem / 100) * externalWeight : 0;
  const pracContrib = practical !== null ? (practical / Math.max(1, practicalMax)) * practicalWeight : 0;
  return intContrib + extContrib + pracContrib;
}

function calcGrade(percent: number): string {
  if (percent >= 90) return "S";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  if (percent >= 40) return "E";
  return "F";
}

function calcGradePoint(percent: number): number {
  if (percent >= 90) return 10;
  if (percent >= 80) return 9;
  if (percent >= 70) return 8;
  if (percent >= 60) return 7;
  if (percent >= 50) return 6;
  if (percent >= 40) return 5;
  return 0;
}

function calcMinEndSemToPass(sub: Subject): number | null {
  if (sub.type === "lab" || sub.externalWeight === 0) return null;
  const avgInternal = ((sub.internal1 ?? 0) + (sub.internal2 ?? 0)) / 2;
  
  // (avgInternal / 50) * internalWeight + (minExt / 100) * externalWeight + [practicalContrib] = 40
  const intContrib = (avgInternal / 50) * sub.internalWeight;
  const pracContrib = sub.type === "theory+lab" ? ((sub.practical ?? 0) / Math.max(1, sub.practicalMax)) * sub.practicalWeight : 0;

  const neededFromExt = 40 - intContrib - pracContrib;
  if (neededFromExt <= 0) return 0; // Already passed via internal/practical
  const minExt = Math.ceil((neededFromExt * 100) / sub.externalWeight);
  return Math.max(0, Math.min(100, minExt));
}

// ─── Components ───────────────────────────────────────────────────────────────

type OmitData = "id" | "internal1" | "internal2" | "endSem" | "practical";

function SubjectModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Subject | null;
  onClose: () => void;
  onSave: (s: Omit<Subject, OmitData>) => void;
}) {
  const [form, setForm] = useState(
    initialData
      ? { ...initialData }
      : {
          name: "",
          code: "",
          credits: 3,
          type: "theory" as SubjectType,
          internalWeight: 50,
          externalWeight: 50,
          practicalWeight: 0,
          practicalMax: 50,
        }
  );

  const handleTypeChange = (val: string) => {
    const type = val as SubjectType;
    if (type === "theory") {
      setForm({ ...form, type, internalWeight: 50, externalWeight: 50, practicalWeight: 0 });
    } else if (type === "lab") {
      setForm({ ...form, type, internalWeight: 0, externalWeight: 0, practicalWeight: 100 });
    } else {
      setForm({ ...form, type, internalWeight: 40, externalWeight: 40, practicalWeight: 20 });
    }
  };

  const totalWeight = form.internalWeight + form.externalWeight + form.practicalWeight;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) return;
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            {initialData ? "Edit Subject" : "Add Subject"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Data Structures"
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject Code *</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. CS301"
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Credits</label>
              <CustomSelect
                value={form.credits.toString()}
                onChange={(v) => setForm({ ...form, credits: Number(v) })}
                options={[1, 2, 3, 4, 5, 6].map((c) => ({ value: c.toString(), label: c.toString() }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Type</label>
              <CustomSelect
                value={form.type}
                onChange={handleTypeChange}
                options={[
                  { value: "theory", label: "Theory Only" },
                  { value: "lab", label: "Lab Only" },
                  { value: "theory+lab", label: "Theory + Lab" },
                ]}
              />
            </div>
          </div>

          {form.type !== "lab" && (
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl space-y-3">
              <label className="text-xs font-bold text-gray-400 flex justify-between">
                <span>Custom Mark Distribution (%)</span>
                <span className={totalWeight !== 100 ? "text-red-400" : "text-emerald-400"}>
                  Total: {totalWeight}%
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Internal %</label>
                  <input
                    type="number"
                    min={0} max={100}
                    value={form.internalWeight}
                    onChange={(e) => setForm({ ...form, internalWeight: Number(e.target.value) })}
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-lg py-1.5 px-3 text-sm text-gray-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">End Sem %</label>
                  <input
                    type="number"
                    min={0} max={100}
                    value={form.externalWeight}
                    onChange={(e) => setForm({ ...form, externalWeight: Number(e.target.value) })}
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-lg py-1.5 px-3 text-sm text-gray-200 outline-none transition-all"
                  />
                </div>
                {form.type === "theory+lab" && (
                  <div className="col-span-2 mt-1">
                    <label className="text-[10px] text-gray-500 uppercase mb-1 block">Practical %</label>
                    <input
                      type="number"
                      min={0} max={100}
                      value={form.practicalWeight}
                      onChange={(e) => setForm({ ...form, practicalWeight: Number(e.target.value) })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-lg py-1.5 px-3 text-sm text-gray-200 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {(form.type === "lab" || form.type === "theory+lab") && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Practical Maximum Marks
              </label>
              <input
                type="number"
                min={10} max={200}
                value={form.practicalMax}
                onChange={(e) => setForm({ ...form, practicalMax: Number(e.target.value) })}
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] transition-all">
              Cancel
            </button>
            <button type="submit" disabled={totalWeight !== 100} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {initialData ? "Save Changes" : "Add Subject"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarksTrackerPage() {
  const [semesters, setSemesters] = useState<Semester[]>(DEFAULT_SEMESTERS);
  const [currentSemIndex, setCurrentSemIndex] = useState(4); // Semester 5 (index 4)
  const [subjectModal, setSubjectModal] = useState<"create" | Subject | null>(null);
  const [prevGpaInput, setPrevGpaInput] = useState("");

  const currentSem = semesters[currentSemIndex];
  const subjects = currentSem?.subjects ?? [];

  // Calculations
  const subjectsWithCalc = useMemo(() =>
    subjects.map((sub) => {
      const finalPercent = calcFinalPercent(sub);
      const grade = finalPercent !== null ? calcGrade(finalPercent) : null;
      const gradePoint = finalPercent !== null ? calcGradePoint(finalPercent) : null;
      const minEndSem = calcMinEndSemToPass(sub);
      return { ...sub, finalPercent, grade, gradePoint, minEndSem };
    }),
  [subjects]);

  const currentGPA = useMemo(() => {
    const withGrades = subjectsWithCalc.filter((s) => s.gradePoint !== null);
    if (withGrades.length === 0) return null;
    const totalCredits = withGrades.reduce((a, s) => a + s.credits, 0);
    const totalPoints = withGrades.reduce((a, s) => a + (s.gradePoint ?? 0) * s.credits, 0);
    return totalPoints / totalCredits;
  }, [subjectsWithCalc]);

  const cgpa = useMemo(() => {
    const prevSems = semesters.slice(0, currentSemIndex).filter((s) => s.gpa !== null);
    let gpas: number[] = prevSems.map((s) => s.gpa!);
    if (currentGPA !== null) gpas.push(currentGPA);
    if (gpas.length === 0) return null;
    return gpas.reduce((a, b) => a + b, 0) / gpas.length;
  }, [semesters, currentSemIndex, currentGPA]);

  const bestSubject = subjectsWithCalc.reduce<typeof subjectsWithCalc[0] | null>(
    (prev, cur) => (cur.finalPercent !== null && (prev === null || cur.finalPercent > (prev.finalPercent ?? 0))) ? cur : prev,
    null
  );
  const worstSubject = subjectsWithCalc.reduce<typeof subjectsWithCalc[0] | null>(
    (prev, cur) => (cur.finalPercent !== null && (prev === null || cur.finalPercent < (prev.finalPercent ?? Infinity))) ? cur : prev,
    null
  );

  // Handlers
  const updateSubjectMark = (subId: string, field: keyof Subject, value: number | null) => {
    setSemesters((prev) =>
      prev.map((sem, idx) =>
        idx !== currentSemIndex
          ? sem
          : {
              ...sem,
              subjects: sem.subjects.map((s) => (s.id === subId ? { ...s, [field]: value } : s)),
            }
      )
    );
  };

  const handleSaveSubject = (formData: Omit<Subject, OmitData>) => {
    if (subjectModal === "create") {
      const newSubject: Subject = {
        ...formData,
        id: Date.now().toString(),
        internal1: null,
        internal2: null,
        endSem: null,
        practical: null,
      };
      setSemesters((prev) =>
        prev.map((sem, idx) =>
          idx === currentSemIndex ? { ...sem, subjects: [...sem.subjects, newSubject] } : sem
        )
      );
    } else if (subjectModal) {
      setSemesters((prev) =>
        prev.map((sem, idx) =>
          idx !== currentSemIndex
            ? sem
            : {
                ...sem,
                subjects: sem.subjects.map((s) =>
                  s.id === (subjectModal as Subject).id ? { ...s, ...formData } : s
                ),
              }
        )
      );
    }
    setSubjectModal(null);
  };

  const deleteSubject = (subId: string) => {
    setSemesters((prev) =>
      prev.map((sem, idx) =>
        idx !== currentSemIndex
          ? sem
          : { ...sem, subjects: sem.subjects.filter((s) => s.id !== subId) }
      )
    );
  };

  const deleteSemester = (semId: string) => {
    setSemesters((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter(s => s.id !== semId);
    });
    setCurrentSemIndex((prev) => Math.max(0, Math.min(prev, semesters.length - 2)));
  };

  const addSemester = () => {
    const newSem: Semester = {
      id: `s${Date.now()}`,
      label: `Semester ${semesters.length + 1}`,
      gpa: null,
      subjects: [],
    };
    setSemesters((prev) => [...prev, newSem]);
    setCurrentSemIndex(semesters.length);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Marks Tracker</h1>
          <p className="text-gray-400 mt-1">GPA calculator and custom mark distribution</p>
        </div>
        <button onClick={() => setSubjectModal("create")} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Semester Navigation */}
      <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.06] overflow-x-auto custom-scrollbar">
        <button onClick={() => setCurrentSemIndex((i) => Math.max(0, i - 1))} disabled={currentSemIndex === 0} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] disabled:opacity-30 transition-all flex-shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          {semesters.map((sem, idx) => (
            <div key={sem.id} className="relative group flex items-center">
              <button
                onClick={() => setCurrentSemIndex(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  idx === currentSemIndex
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 pr-8"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]"
                }`}
              >
                {sem.label} {sem.gpa ? `(${sem.gpa.toFixed(2)})` : ""}
              </button>
              {idx === currentSemIndex && semesters.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSemester(sem.id); }}
                  className="absolute right-2 p-0.5 text-purple-400/50 hover:text-red-400 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addSemester} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all flex-shrink-0" title="Add Semester">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={() => setCurrentSemIndex((i) => Math.min(semesters.length - 1, i + 1))} disabled={currentSemIndex === semesters.length - 1} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] disabled:opacity-30 transition-all flex-shrink-0">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Current GPA",
            value: currentGPA !== null ? currentGPA.toFixed(2) : "--",
            subText: currentSem.label,
            icon: TrendingUp,
            color: "purple",
          },
          {
            label: "CGPA",
            value: cgpa !== null ? cgpa.toFixed(2) : "--",
            subText: `${semesters.filter((_, i) => i <= currentSemIndex).length} Semesters`,
            icon: GraduationCap,
            color: "cyan",
          },
          {
            label: "Best Subject",
            value: bestSubject?.name ?? "--",
            subText: bestSubject ? `${bestSubject.finalPercent?.toFixed(1)}%` : "",
            icon: Award,
            color: "emerald",
          },
          {
            label: "Needs Attention",
            value: worstSubject?.name ?? "--",
            subText: worstSubject ? `${worstSubject.finalPercent?.toFixed(1)}%` : "",
            icon: AlertTriangle,
            color: "amber",
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="dash-card group relative overflow-hidden"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 bg-gradient-to-br ${
              card.color === "purple" ? "from-purple-500 to-indigo-500" :
              card.color === "cyan" ? "from-cyan-500 to-blue-500" :
              card.color === "emerald" ? "from-emerald-500 to-teal-500" :
              "from-amber-500 to-orange-500"
            }`} />
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                card.color === "purple" ? "bg-purple-500/10 text-purple-400" :
                card.color === "cyan" ? "bg-cyan-500/10 text-cyan-400" :
                card.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
                "bg-amber-500/10 text-amber-400"
              }`}>
                <card.icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
            </div>
            <p className={`text-xl font-bold line-clamp-1 ${
              card.color === "purple" ? "text-purple-300" :
            card.color === "cyan" ? "text-cyan-300" :
            card.color === "emerald" ? "text-emerald-300" :
            "text-amber-300"
            }`}>{card.value}</p>
            {card.subText && <p className="text-xs text-gray-500 mt-1">{card.subText}</p>}
          </motion.div>
        ))}
      </div>

      {/* GPA Bar Chart */}
      <div className="dash-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-400" />
            GPA Trend Per Semester
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={prevGpaInput}
                onChange={(e) => setPrevGpaInput(e.target.value)}
                placeholder="Enter GPA..."
                className="bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-lg py-1.5 px-3 text-sm text-gray-200 outline-none w-36 transition-all"
              />
            </div>
            <button
              onClick={() => {
                const gpa = parseFloat(prevGpaInput);
                if (isNaN(gpa) || gpa < 0 || gpa > 10) return;
                setSemesters((prev) =>
                  prev.map((sem, idx) =>
                    idx === currentSemIndex ? { ...sem, gpa } : sem
                  )
                );
                setPrevGpaInput("");
              }}
              className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-500/30 transition-all"
            >
              Set GPA
            </button>
          </div>
        </div>

        <div className="relative h-48 border-l border-b border-white/[0.1] ml-6 mb-4">
          <div className="absolute -left-6 top-0 text-xs text-gray-500">10</div>
          <div className="absolute -left-6 top-1/4 text-xs text-gray-500">7.5</div>
          <div className="absolute -left-6 top-1/2 text-xs text-gray-500">5</div>
          <div className="absolute -left-6 top-3/4 text-xs text-gray-500">2.5</div>
          <div className="absolute -left-6 bottom-0 text-xs text-gray-500">0</div>

          {[0.25, 0.5, 0.75].map((p) => (
            <div key={p} className="absolute left-0 right-0 h-px bg-white/[0.03]" style={{ top: `${p * 100}%` }} />
          ))}

          <div className="absolute inset-0 flex items-end justify-around px-4">
            {semesters.map((sem, idx) => {
              const gpa = idx === currentSemIndex && currentGPA !== null ? currentGPA : sem.gpa;
              const heightPercent = gpa !== null ? (gpa / 10) * 100 : 0;
              const isActive = idx === currentSemIndex;
              return (
                <div key={sem.id} className="flex flex-col items-center gap-2 group w-full px-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.05, type: "spring" }}
                    className={`w-full max-w-[40px] rounded-t-lg relative ${
                      isActive
                        ? "bg-gradient-to-t from-purple-600/40 to-cyan-400/90 border border-cyan-400/40 shadow-lg shadow-cyan-400/20"
                        : "bg-gradient-to-t from-purple-500/10 to-purple-400/40 border border-purple-400/20"
                    }`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/[0.1] backdrop-blur-md px-2 py-1 rounded border border-white/[0.1] text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {gpa !== null ? gpa.toFixed(2) : "N/A"}
                    </div>
                  </motion.div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">S{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="dash-card !p-0 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white">
            {currentSem.label} — Subject Marks
          </h3>
          <button onClick={() => setSubjectModal("create")} className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/20 transition-all">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No subjects yet</p>
            <p className="text-sm text-gray-600 mt-1">Add subjects to start tracking your marks.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-3 text-center">Scheme</th>
                  <th className="py-3 px-3 text-center">Int. 1 /50</th>
                  <th className="py-3 px-3 text-center">Int. 2 /50</th>
                  <th className="py-3 px-3 text-center">End Sem /100</th>
                  <th className="py-3 px-3 text-center">Practical</th>
                  <th className="py-3 px-3 text-center">Final %</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-3 text-center">Min End Sem</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {subjectsWithCalc.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-200 text-sm">{sub.name}</p>
                      <p className="text-xs text-gray-500">{sub.code} • {sub.credits}cr</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono break-words whitespace-pre-wrap">
                        {sub.type === "lab" ? "100% PR" : 
                         sub.type === "theory+lab" ? `${sub.internalWeight}I/${sub.externalWeight}E/${sub.practicalWeight}P` :
                         `${sub.internalWeight}I/${sub.externalWeight}E`}
                      </span>
                    </td>
                    {/* Internal 1 */}
                    <td className="py-3 px-3 text-center">
                      {sub.type === "lab" ? (
                        <span className="text-gray-600 text-xs">—</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={sub.internal1 ?? ""}
                          onChange={(e) => updateSubjectMark(sub.id, "internal1", e.target.value === "" ? null : Math.min(50, Number(e.target.value)))}
                          placeholder="—"
                          className="w-16 text-center bg-white/[0.03] border border-white/[0.06] focus:border-purple-500/50 rounded-lg py-1 text-sm text-gray-200 outline-none transition-all"
                        />
                      )}
                    </td>
                    {/* Internal 2 */}
                    <td className="py-3 px-3 text-center">
                      {sub.type === "lab" ? (
                        <span className="text-gray-600 text-xs">—</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={sub.internal2 ?? ""}
                          onChange={(e) => updateSubjectMark(sub.id, "internal2", e.target.value === "" ? null : Math.min(50, Number(e.target.value)))}
                          placeholder="—"
                          className="w-16 text-center bg-white/[0.03] border border-white/[0.06] focus:border-purple-500/50 rounded-lg py-1 text-sm text-gray-200 outline-none transition-all"
                        />
                      )}
                    </td>
                    {/* End Sem */}
                    <td className="py-3 px-3 text-center">
                      {sub.type === "lab" ? (
                        <span className="text-gray-600 text-xs">—</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sub.endSem ?? ""}
                          onChange={(e) => updateSubjectMark(sub.id, "endSem", e.target.value === "" ? null : Math.min(100, Number(e.target.value)))}
                          placeholder="—"
                          className="w-16 text-center bg-white/[0.03] border border-white/[0.06] focus:border-purple-500/50 rounded-lg py-1 text-sm text-gray-200 outline-none transition-all"
                        />
                      )}
                    </td>
                    {/* Practical */}
                    <td className="py-3 px-3 text-center">
                      {sub.type === "theory" ? (
                        <span className="text-gray-600 text-xs">—</span>
                      ) : (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            min={0}
                            max={sub.practicalMax}
                            value={sub.practical ?? ""}
                            onChange={(e) => updateSubjectMark(sub.id, "practical", e.target.value === "" ? null : Math.min(sub.practicalMax, Number(e.target.value)))}
                            placeholder="—"
                            className="w-14 text-center bg-white/[0.03] border border-white/[0.06] focus:border-cyan-500/50 rounded-lg py-1 text-sm text-gray-200 outline-none transition-all"
                          />
                          <span className="text-xs text-gray-600">/{sub.practicalMax}</span>
                        </div>
                      )}
                    </td>
                    {/* Final % */}
                    <td className="py-3 px-3 text-center">
                      {sub.finalPercent !== null ? (
                        <span className={`font-semibold text-sm ${
                          sub.finalPercent >= 75 ? "text-emerald-400" :
                          sub.finalPercent >= 60 ? "text-blue-400" :
                          sub.finalPercent >= 40 ? "text-amber-400" :
                          "text-red-400"
                        }`}>
                          {sub.finalPercent.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    {/* Grade */}
                    <td className="py-3 px-3 text-center">
                      {sub.grade ? (
                        <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-bold text-sm border ${
                          sub.grade === "S" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                          sub.grade === "A" ? "bg-blue-500/20 border-blue-500/30 text-blue-300" :
                          sub.grade === "B" ? "bg-purple-500/20 border-purple-500/30 text-purple-300" :
                          sub.grade === "F" ? "bg-red-500/20 border-red-500/30 text-red-400" :
                          "bg-white/[0.05] border-white/[0.1] text-gray-300"
                        }`}>{sub.grade}</span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    {/* Min to Pass */}
                    <td className="py-3 px-3 text-center">
                      {sub.minEndSem !== null ? (
                        <span className={`text-sm font-semibold ${sub.endSem !== null ? "opacity-30" : "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"}`}>
                          {sub.minEndSem <= 0 ? (
                            <span className="text-emerald-400">Pass</span>
                          ) : (
                            sub.minEndSem
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSubjectModal(sub)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteSubject(sub.id)} className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render Modal if Active */}
      <AnimatePresence>
        {subjectModal && (
          <SubjectModal
            initialData={subjectModal !== "create" ? subjectModal : null}
            onClose={() => setSubjectModal(null)}
            onSave={handleSaveSubject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
