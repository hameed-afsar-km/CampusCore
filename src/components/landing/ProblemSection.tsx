"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Clock, FolderOpen, Smartphone } from "lucide-react";

const problems = [
  {
    icon: Smartphone,
    title: "Too Many Apps",
    description: "Jumping between WhatsApp, email, drive, and 5 other apps just to track one assignment.",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Clock,
    title: "Missed Deadlines",
    description: "Important submissions lost in notification noise. By the time you notice, it's too late.",
    color: "from-amber-500 to-yellow-500",
  },
  {
    icon: FolderOpen,
    title: "Scattered Notes",
    description: "Notes in 3 drives, photos in gallery, PDFs in downloads. Finding anything is a treasure hunt.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: AlertTriangle,
    title: "No Clear Tracking",
    description: "How's your attendance? What's your GPA trend? No single place to see your academic health.",
    color: "from-cyan-500 to-blue-500",
  },
];

export default function ProblemSection() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-red-400 bg-red-500/10 px-4 py-1.5 rounded-full">
            The Problem
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Sound <span className="gradient-text">familiar?</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Every college student faces these problems daily. It&apos;s not about working harder — it&apos;s about having the right system.
          </p>
        </motion.div>

        {/* Problems Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="feature-card group"
            >
              <div
                className={`icon-wrapper bg-gradient-to-br ${problem.color} bg-opacity-10`}
                style={{
                  background: `linear-gradient(135deg, ${problem.color.includes("red") ? "rgba(239,68,68,0.15)" : problem.color.includes("amber") ? "rgba(245,158,11,0.15)" : problem.color.includes("purple") ? "rgba(168,85,247,0.15)" : "rgba(6,182,212,0.15)"} 0%, transparent 100%)`,
                }}
              >
                <problem.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
