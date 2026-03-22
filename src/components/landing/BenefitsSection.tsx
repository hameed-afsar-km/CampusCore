"use client";

import { motion } from "framer-motion";
import { Target, FolderCheck, TrendingUp, Timer } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "Never Miss Deadlines",
    desc: "Smart reminders and visual countdowns keep you ahead of every submission, exam, and event.",
    stat: "0",
    statLabel: "Missed deadlines",
    gradient: "from-red-500 to-pink-500",
  },
  {
    icon: FolderCheck,
    title: "Stay Organized",
    desc: "Everything in one place — notes, schedules, tasks, marks. No more hunting across apps.",
    stat: "1",
    statLabel: "Platform needed",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: TrendingUp,
    title: "Track Performance",
    desc: "Visualize your GPA trends, identify weak subjects, and make data-driven academic decisions.",
    stat: "↑",
    statLabel: "GPA tracking",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Timer,
    title: "Save Time",
    desc: "Stop wasting hours organizing. CampusCore automates the mundane so you can focus on learning.",
    stat: "3x",
    statLabel: "More productive",
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="relative py-24 px-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      <div className="absolute bottom-1/4 left-0 orb orb-primary w-[400px] h-[400px] opacity-15" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full">
            Benefits
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Why students{" "}
            <span className="gradient-text">love CampusCore</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Real benefits that make a real difference in your academic journey.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="feature-card group flex gap-5"
            >
              {/* Stat Circle */}
              <div className="flex-shrink-0">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                >
                  {benefit.stat}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-1.5">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-2">
                  {benefit.desc}
                </p>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {benefit.statLabel}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
