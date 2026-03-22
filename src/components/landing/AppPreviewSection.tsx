"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

const screens = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Your complete academic overview at a glance",
    mockup: {
      title: "Dashboard",
      cards: [
        { label: "Today's Classes", value: "4", color: "from-purple-500 to-indigo-500" },
        { label: "Pending Tasks", value: "7", color: "from-amber-500 to-orange-500" },
        { label: "Attendance", value: "82%", color: "from-emerald-500 to-teal-500" },
        { label: "GPA", value: "8.4", color: "from-cyan-500 to-blue-500" },
      ],
    },
  },
  {
    id: "notes",
    label: "Notes",
    icon: FileText,
    description: "Upload, organize, and share academic notes",
    mockup: {
      title: "Notes Manager",
      cards: [
        { label: "Data Structures", value: "12", color: "from-purple-500 to-indigo-500" },
        { label: "DBMS", value: "8", color: "from-cyan-500 to-blue-500" },
        { label: "OS", value: "15", color: "from-emerald-500 to-teal-500" },
        { label: "Networks", value: "6", color: "from-amber-500 to-orange-500" },
      ],
    },
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    description: "Combined view of all your events and deadlines",
    mockup: {
      title: "Calendar",
      cards: [
        { label: "Exams This Week", value: "2", color: "from-red-500 to-pink-500" },
        { label: "Assignments Due", value: "3", color: "from-amber-500 to-orange-500" },
        { label: "Events", value: "1", color: "from-purple-500 to-indigo-500" },
        { label: "Holidays", value: "0", color: "from-gray-500 to-gray-600" },
      ],
    },
  },
  {
    id: "marks",
    label: "Marks",
    icon: BarChart3,
    description: "Track your grades and identify areas for improvement",
    mockup: {
      title: "Marks Tracker",
      cards: [
        { label: "Best Subject", value: "DSA", color: "from-emerald-500 to-teal-500" },
        { label: "Needs Work", value: "DBMS", color: "from-red-500 to-pink-500" },
        { label: "Average", value: "76%", color: "from-amber-500 to-orange-500" },
        { label: "CGPA", value: "8.2", color: "from-purple-500 to-indigo-500" },
      ],
    },
  },
];

export default function AppPreviewSection() {
  const [active, setActive] = useState("dashboard");
  const activeScreen = screens.find((s) => s.id === active)!;

  return (
    <section className="relative py-24 px-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-violet-400 bg-violet-500/10 px-4 py-1.5 rounded-full">
            App Preview
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            See it in <span className="gradient-text">action</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A glimpse into the clean, intuitive interface designed for your academic success.
          </p>
        </motion.div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex gap-2 p-1.5 rounded-2xl glass">
            {screens.map((screen) => (
              <button
                key={screen.id}
                onClick={() => setActive(screen.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active === screen.id
                    ? "bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white shadow-lg shadow-purple-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <screen.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{screen.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* App Mockup */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass rounded-2xl overflow-hidden border border-purple-500/10">
            {/* Window Bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-gray-500 font-mono">
                  campuscore.app/{activeScreen.mockup.title.toLowerCase().replace(" ", "-")}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">
                    {activeScreen.mockup.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {activeScreen.description}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                  <activeScreen.icon className="w-5 h-5 text-purple-400" />
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activeScreen.mockup.cards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:border-purple-500/20 transition-all"
                  >
                    <p className="text-xs text-gray-500 mb-2">{card.label}</p>
                    <p
                      className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}
                    >
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Placeholder Content Rows */}
              <div className="mt-6 space-y-3">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20" />
                    <div className="flex-1">
                      <div
                        className="h-3 rounded bg-white/[0.06] mb-2"
                        style={{ width: `${80 - row * 15}%` }}
                      />
                      <div
                        className="h-2 rounded bg-white/[0.03]"
                        style={{ width: `${60 - row * 10}%` }}
                      />
                    </div>
                    <div className="badge badge-primary">Active</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
