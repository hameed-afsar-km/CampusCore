"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Flag,
  MoreHorizontal,
  Circle,
  CheckCircle2,
} from "lucide-react";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  dueDate?: string;
}

const initialTodos: Todo[] = [
  { id: 1, title: "Review DBMS Chapter 4 Notes", completed: false, priority: "high", dueDate: "Tomorrow" },
  { id: 2, title: "Submit fee receipt to admin", completed: false, priority: "medium" },
  { id: 3, title: "Prepare for OS viva", completed: true, priority: "high", dueDate: "Today" },
  { id: 4, title: "Read next week's material", completed: false, priority: "low" },
];

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTodos([
      ...todos,
      {
        id: Date.now(),
        title: newTask,
        completed: false,
        priority: "medium",
      },
    ]);
    setNewTask("");
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "medium": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "low": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      default: return "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">To-Do List</h1>
          <p className="text-gray-400 mt-1">Manage your personal tasks and priorities</p>
        </div>
        <div className="text-sm text-gray-400 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {todos.filter(t => t.completed).length} / {todos.length} Completed
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAdd} className="relative">
        <div className="flex items-center gap-3 bg-[#030712] p-2 rounded-2xl border border-purple-500/30 focus-within:border-purple-500 shadow-lg shadow-purple-500/5 transition-all">
          <div className="pl-3">
            <Plus className="w-5 h-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder:text-gray-500 py-3"
          />
          <button
            type="submit"
            disabled={!newTask.trim()}
            className="btn-primary !py-2.5 !px-5 mr-1"
          >
            Add
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
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

      {/* Todo List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTodos.map((todo) => (
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
                <p className={`text-base font-medium truncate mb-1 transition-all ${
                  todo.completed ? "text-gray-500 line-through" : "text-gray-200"
                }`}>
                  {todo.title}
                </p>
                
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(todo.priority)}`}>
                    {todo.priority}
                  </span>
                  
                  {todo.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {todo.dueDate}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-gray-500 hover:text-gray-300 hover:bg-white/[0.1] rounded-lg transition-colors">
                  <Flag className="w-4 h-4" />
                </button>
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

        {filteredTodos.length === 0 && (
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
