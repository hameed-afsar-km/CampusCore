"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendar } from "@/lib/calendar-context";
import { format } from "date-fns";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Flag,
  Circle,
  CheckCircle2,
  ArrowUpDown,
  ChevronDown,
  Check,
} from "lucide-react";

interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  dueDate?: string; // yyyy-MM-dd
}

type FilterType = "all" | "active" | "completed";
type SortType = "priority-asc" | "priority-desc" | "deadline-newest" | "deadline-oldest";

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: "deadline-oldest", label: "Deadline, Oldest First" },
  { value: "deadline-newest", label: "Deadline, Latest First" },
  { value: "priority-desc", label: "Priority, High to Low" },
  { value: "priority-asc", label: "Priority, Low to High" },
];

const initialTodos: Todo[] = [
  { id: 1, title: "Review DBMS Chapter 4 Notes", completed: false, priority: "high", dueDate: "2026-03-24" },
  { id: 2, title: "Submit fee receipt to admin", completed: false, priority: "medium" },
  { id: 3, title: "Prepare for OS viva", completed: true, priority: "high", dueDate: "2026-03-22" },
  { id: 4, title: "Read next week's material", completed: false, priority: "low" },
];

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const { addEvent, removeEvent } = useCalendar();

  const [isExpanded, setIsExpanded] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newDate, setNewDate] = useState("");

  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("deadline-oldest");
  const [sortOpen, setSortOpen] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const id = Date.now();
    const todo: Todo = {
      id,
      title: newTask,
      description: newDesc.trim() || undefined,
      completed: false,
      priority: newPriority,
      dueDate: newDate || undefined,
    };

    setTodos((prev) => [todo, ...prev]);

    // Sync to calendar
    if (newDate) {
      addEvent({
        id: `todo-${id}`,
        title: newTask,
        date: newDate,
        type: "todo",
        time: undefined,
      });
    }

    setNewTask("");
    setNewDesc("");
    setNewPriority("medium");
    setNewDate("");
    setIsExpanded(false);
  };

  const toggleTodo = (id: number) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    removeEvent(`todo-${id}`);
  };

  const sortedFiltered = useMemo(() => {
    let list = todos.filter((t) => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "priority-desc":
          return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
        case "priority-asc":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "deadline-newest": {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        case "deadline-oldest":
        default: {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
      }
    });

    return list;
  }, [todos, filter, sort]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "medium": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "low": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      default: return "";
    }
  };

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">To-Do List</h1>
          <p className="text-gray-400 mt-1">Manage your personal tasks and priorities</p>
        </div>
        <div className="text-sm text-gray-400 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {todos.filter((t) => t.completed).length} / {todos.length} Completed
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleAdd}
        className="relative bg-[#030712] p-4 rounded-2xl border border-purple-500/30 shadow-lg shadow-purple-500/5 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="pl-1">
            <Plus className="w-5 h-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="What needs to be done?"
            className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder:text-gray-500 py-2 text-lg font-medium"
          />
          {!isExpanded && (
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="btn-primary !py-2 !px-5"
            >
              Add Task
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-2 border-t border-white/[0.06] space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                    Description
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Add more details about this task..."
                    className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-sm text-gray-300 outline-none focus:border-purple-500/50 min-h-[80px] resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                            newPriority === p
                              ? getPriorityColor(p)
                              : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5 text-sm text-gray-300 outline-none focus:border-purple-500/50 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTask.trim()}
                    className="btn-primary !py-2 !px-6"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Filter + Sort Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                filter === f
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentSortLabel}</span>
            <span className="sm:hidden">Sort</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-1 z-[100] w-52 bg-[#0a0f1e] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setSort(opt.value); setSortOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/[0.06] ${
                      sort === opt.value ? "text-purple-300 bg-purple-500/10" : "text-gray-300"
                    }`}
                  >
                    {opt.label}
                    {sort === opt.value && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedFiltered.map((todo) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={todo.id}
              className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${
                todo.completed
                  ? "bg-white/[0.01] border-white/[0.03] opacity-60"
                  : "bg-white/[0.03] border-white/[0.08] hover:border-purple-500/30 hover:bg-white/[0.05]"
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className="flex-shrink-0 text-purple-400 transition-transform active:scale-90"
              >
                {todo.completed ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-base font-medium truncate mb-1 transition-all ${
                    todo.completed ? "text-gray-500 line-through" : "text-gray-200"
                  }`}
                >
                  {todo.title}
                </p>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(todo.priority)}`}
                  >
                    {todo.priority}
                  </span>

                  {todo.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(todo.dueDate + "T12:00:00"), "MMM d, yyyy")}
                    </div>
                  )}
                </div>

                {todo.description && (
                  <p
                    className={`text-sm mt-3 border-l-2 border-white/[0.06] pl-3 py-1 ${
                      todo.completed ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {todo.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedFiltered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
              <CheckSquare className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-1">You&apos;re all caught up!</h3>
            <p className="text-sm text-gray-500">No tasks found matching your filters.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
