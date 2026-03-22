"use client";

import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Building2 } from "lucide-react";

const audiences = [
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Track assignments, manage notes, monitor attendance, and stay organized throughout the semester.",
    features: [
      "Personal dashboard",
      "Assignment submissions",
      "Notes & collaboration",
      "Marks & GPA tracking",
    ],
    gradient: "from-purple-500 to-indigo-500",
    borderColor: "border-purple-500/20",
  },
  {
    icon: BookOpen,
    title: "Professors",
    desc: "Create assignments, post announcements, manage classes, and approve leaves — all from one panel.",
    features: [
      "Assignment management",
      "Announcement posting",
      "Leave approvals",
      "Class management",
    ],
    gradient: "from-cyan-500 to-blue-500",
    borderColor: "border-cyan-500/20",
  },
  {
    icon: Building2,
    title: "Colleges",
    desc: "A centralized system for academic management. Monitor performance, streamline operations, maintain records.",
    features: [
      "Centralized data",
      "Performance analytics",
      "Event management",
      "Admin controls",
    ],
    gradient: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-500/20",
  },
];

export default function WhoItsForSection() {
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
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full">
            Who It&apos;s For
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Built for <span className="gradient-text">everyone</span> on campus
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Whether you&apos;re a student, professor, or administrator — CampusCore adapts to your role.
          </p>
        </motion.div>

        {/* Audience Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map((audience, i) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`feature-card relative overflow-hidden group ${audience.borderColor}`}
            >
              {/* Icon */}
              <div
                className={`icon-wrapper bg-gradient-to-br ${audience.gradient} mb-5`}
              >
                <audience.icon className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-2">{audience.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                {audience.desc}
              </p>

              {/* Feature List */}
              <ul className="space-y-2">
                {audience.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${audience.gradient}`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
