"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Plus, Clock, MapPin, BookOpen, Trash2, Edit2, Calendar, X } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

interface TimetableClass {
  id: string;
  userId: string;
  day: DayOfWeek;
  subject: string;
  timeStart: string;
  timeEnd: string;
  room: string;
}

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const { user } = useAuth();
  const { data: classes, add, update, remove, loading } = useFirestore<TimetableClass>("timetable", true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const [form, setForm] = useState<{
    day: DayOfWeek;
    subject: string;
    timeStart: string;
    timeEnd: string;
    room: string;
  }>({
    day: "Monday",
    subject: "",
    timeStart: "09:00",
    timeEnd: "10:00",
    room: ""
  });

  const groupedClasses = useMemo(() => {
    const grouped = {} as Record<DayOfWeek, TimetableClass[]>;
    DAYS.forEach(day => grouped[day] = []);
    classes.forEach(c => {
      if (grouped[c.day]) {
        grouped[c.day].push(c);
      }
    });

    // sort each day by start time
    DAYS.forEach(day => {
      grouped[day].sort((a, b) => a.timeStart.localeCompare(b.timeStart));
    });

    return grouped;
  }, [classes]);

  const openAdd = (day?: DayOfWeek) => {
    setForm({
      day: day || "Monday",
      subject: "",
      timeStart: "09:00",
      timeEnd: "10:00",
      room: ""
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (c: TimetableClass) => {
    setForm({
      day: c.day,
      subject: c.subject,
      timeStart: c.timeStart,
      timeEnd: c.timeEnd,
      room: c.room
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject) return;

    if (editingId) {
      await update(editingId, form);
    } else {
      await add({
        ...form,
        userId: user?.uid || ""
      });
    }
    setShowModal(false);
  };

  const performDelete = async () => {
    if (confirmDelete) {
      await remove(confirmDelete);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Class Timetable</h1>
          <p className="text-gray-400 mt-1">Manage your weekly schedule</p>
        </div>
        <button
          onClick={() => openAdd()}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Class
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {DAYS.map((day) => {
          const dayClasses = groupedClasses[day];
          // Hide Saturday if empty
          if (day === "Saturday" && dayClasses.length === 0) return null;

          return (
            <div key={day} className="dash-card p-6 border-white/[0.04]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  {day}
                </h2>
                <button 
                  onClick={() => openAdd(day)}
                  className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {dayClasses.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-white/[0.06] rounded-xl bg-white/[0.01]">
                    No classes scheduled.
                  </div>
                ) : (
                  dayClasses.map(c => (
                    <motion.div 
                      layout
                      key={c.id} 
                      className="group p-3 rounded-xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 mx-0 border border-white/[0.04] hover:border-purple-500/30 transition-all flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-100 flex items-center gap-2 mb-1 text-sm">
                          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                          {c.subject}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {c.timeStart} - {c.timeEnd}
                          </span>
                          {c.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {c.room}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-gray-500 hover:text-purple-400 hover:bg-purple-500/10">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(c.id)} className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#030712] border border-white/[0.08] rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingId ? "Edit Class" : "Add Class"}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject Name</label>
                  <input
                    required
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Data Structures"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 outline-none rounded-xl p-3 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Day</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value as DayOfWeek })}
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 outline-none rounded-xl p-3 text-sm transition-all"
                  >
                    {DAYS.map(d => <option key={d} value={d} className="bg-[#030712]">{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Start Time</label>
                    <input
                      required
                      type="time"
                      value={form.timeStart}
                      onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 outline-none rounded-xl p-3 text-sm transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">End Time</label>
                    <input
                      required
                      type="time"
                      value={form.timeEnd}
                      onChange={(e) => setForm({ ...form, timeEnd: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 outline-none rounded-xl p-3 text-sm transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Room / Location (Optional)</label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="e.g. Room 101 or Zoom Link"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 outline-none rounded-xl p-3 text-sm transition-all"
                  />
                </div>
                
                <div className="pt-4 flex gap-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/[0.08] text-sm font-medium hover:bg-white/[0.02] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingId ? "Save Changes" : "Save Class"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={performDelete}
        title="Delete Class?"
        message="Are you sure you want to remove this class from your timetable?"
      />
    </div>
  );
}
