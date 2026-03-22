"use client";

import { motion } from "framer-motion";
import { UserPlus, BookPlus, Rocket } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Sign Up",
    desc: "Create your account with your college email or Google. Choose your role — Student, Professor, or Admin.",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    num: "02",
    icon: BookPlus,
    title: "Add Your Subjects & Schedule",
    desc: "Set up your semester subjects, timetable, and preferences. Everything auto-organizes around your schedule.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Start Managing Everything",
    desc: "Track assignments, manage notes, monitor attendance, and stay on top of your academic game — effortlessly.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 px-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-cyan-400 bg-cyan-500/10 px-4 py-1.5 rounded-full">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Get started in{" "}
            <span className="gradient-text">3 simple steps</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            No complicated setup. Just sign up and you&apos;re ready to go.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/30 via-cyan-500/30 to-emerald-500/30 hidden sm:block md:transform md:-translate-x-px" />

          <div className="space-y-12 md:space-y-16">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 ${
                  i % 2 !== 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <div
                  className={`flex-1 ${
                    i % 2 !== 0 ? "md:text-right" : ""
                  }`}
                >
                  <div
                    className={`feature-card ${
                      i % 2 !== 0 ? "md:ml-auto" : ""
                    } max-w-md`}
                  >
                    <div
                      className={`icon-wrapper bg-gradient-to-br ${step.gradient} mb-4`}
                    >
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Step Number */}
                <div className="relative flex-shrink-0 order-first md:order-none">
                  <div
                    className={`step-number bg-gradient-to-br ${step.gradient} text-white font-bold`}
                  >
                    {step.num}
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
