"use client";

import { motion } from "framer-motion";
import { Layers, Compass, Zap } from "lucide-react";

const solutions = [
  {
    icon: Layers,
    title: "One Platform for Everything",
    description:
      "Assignments, notes, exams, attendance, timetable, events — everything lives in one place. No more app-hopping.",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: Compass,
    title: "Organized Academic Life",
    description:
      "Your entire semester visualized clearly. Know what's coming, what's pending, and what needs attention — at a glance.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Zap,
    title: "No More Confusion",
    description:
      "Smart reminders, clear dashboards, and intuitive design means you never miss anything important again.",
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function SolutionSection() {
  return (
    <section className="relative py-24 px-6">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full">
            The Solution
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Meet <span className="gradient-text">CampusCore</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Your complete academic command center. Built for how students actually work.
          </p>
        </motion.div>

        {/* Solutions */}
        <div className="grid md:grid-cols-3 gap-6">
          {solutions.map((solution, i) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="feature-card text-center group relative overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${solution.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div
                  className={`icon-wrapper mx-auto bg-gradient-to-br ${solution.gradient}`}
                  style={{ marginBottom: "20px" }}
                >
                  <solution.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{solution.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {solution.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
