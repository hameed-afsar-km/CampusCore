"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  FileText,
  Calendar,
  BarChart3,
  Clock,
  Bell,
  Trophy,
  Users,
  BookOpen,
  CheckSquare,
  Send,
  FolderKanban,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Assignments",
    desc: "Track, submit, and manage assignments with deadline alerts.",
    gradient: "from-purple-500 to-indigo-500",
    bgGlow: "rgba(108, 92, 231, 0.1)",
  },
  {
    icon: FileText,
    title: "Notes Manager",
    desc: "Upload, organize, and share notes. PDF, images, or text.",
    gradient: "from-cyan-500 to-blue-500",
    bgGlow: "rgba(0, 210, 255, 0.1)",
  },
  {
    icon: Clock,
    title: "Attendance",
    desc: "Subject-wise tracking with percentage calculations & alerts.",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "rgba(16, 185, 129, 0.1)",
  },
  {
    icon: BarChart3,
    title: "Marks Analysis",
    desc: "GPA/CGPA tracking, weak subjects, and performance trends.",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "rgba(245, 158, 11, 0.1)",
  },
  {
    icon: Calendar,
    title: "Timetable & Calendar",
    desc: "Weekly schedule + combined view of exams, events, holidays.",
    gradient: "from-pink-500 to-rose-500",
    bgGlow: "rgba(236, 72, 153, 0.1)",
  },
  {
    icon: Bell,
    title: "Announcements",
    desc: "Stay updated with urgent tags and professor broadcasts.",
    gradient: "from-red-500 to-pink-500",
    bgGlow: "rgba(239, 68, 68, 0.1)",
  },
  {
    icon: Trophy,
    title: "Events & Competitions",
    desc: "Discover events, register, track history, upload proofs.",
    gradient: "from-violet-500 to-purple-500",
    bgGlow: "rgba(139, 92, 246, 0.1)",
  },
  {
    icon: Users,
    title: "Collaboration",
    desc: "Share notes, tasks, and projects with permission control.",
    gradient: "from-blue-500 to-indigo-500",
    bgGlow: "rgba(59, 130, 246, 0.1)",
  },
  {
    icon: BookOpen,
    title: "Exams & Tests",
    desc: "Track exam schedules, topics, and test preparations.",
    gradient: "from-teal-500 to-cyan-500",
    bgGlow: "rgba(20, 184, 166, 0.1)",
  },
  {
    icon: CheckSquare,
    title: "To-Do System",
    desc: "Personal task management with priorities and deadlines.",
    gradient: "from-lime-500 to-green-500",
    bgGlow: "rgba(132, 204, 22, 0.1)",
  },
  {
    icon: Send,
    title: "Leave System",
    desc: "Apply for leave, get approvals, and track status.",
    gradient: "from-sky-500 to-blue-500",
    bgGlow: "rgba(14, 165, 233, 0.1)",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    desc: "Manage projects from planning to completion with CRUD.",
    gradient: "from-fuchsia-500 to-pink-500",
    bgGlow: "rgba(217, 70, 239, 0.1)",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-6">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      <div className="absolute top-1/3 right-0 orb orb-accent w-[300px] h-[300px] opacity-20" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-purple-400 bg-purple-500/10 px-4 py-1.5 rounded-full">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Everything you need,{" "}
            <span className="gradient-text">nothing you don&apos;t</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A comprehensive toolkit designed for every aspect of college life.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="feature-card group cursor-default"
            >
              <div
                className={`icon-wrapper bg-gradient-to-br ${feature.gradient}`}
              >
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
