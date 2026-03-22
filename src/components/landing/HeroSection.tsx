"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="orb orb-primary w-[500px] h-[500px] -top-40 -left-40 opacity-60" />
        <div className="orb orb-accent w-[400px] h-[400px] top-1/4 right-0 opacity-40" />
        <div className="orb orb-primary w-[300px] h-[300px] bottom-0 left-1/3 opacity-30" />
        <div className="dot-pattern absolute inset-0 opacity-30" />
      </div>

      {/* Grid Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/10 to-transparent" />
        <div className="absolute left-2/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent" />
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/10 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border border-purple-500/20"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">
                Built for Crescent Institute
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6"
            >
              All your{" "}
              <span className="gradient-text">college life,</span>
              <br />
              in one place.
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed mb-10"
            >
              Manage assignments, notes, exams, attendance, and more — all
              seamlessly organized in one platform designed for students &
              professors.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/signup"
                className="btn-primary inline-flex items-center justify-center gap-2 text-base group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-base"
              >
                Login
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap gap-8 justify-center lg:justify-start mt-12"
            >
              {[
                { value: "17+", label: "Features" },
                { value: "3", label: "User Roles" },
                { value: "100%", label: "Organized" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold gradient-text">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Spline Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full max-w-lg aspect-square">
              {/* Spline Container - Replace with actual Spline component */}
              <div className="w-full h-full rounded-3xl glass border border-purple-500/20 flex items-center justify-center overflow-hidden">
                {/* Decorative placeholder */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Animated circles */}
                  <div className="absolute w-48 h-48 rounded-full border border-purple-500/20 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute w-64 h-64 rounded-full border border-cyan-500/10 animate-[spin_30s_linear_infinite_reverse]" />
                  <div className="absolute w-80 h-80 rounded-full border border-purple-500/5 animate-[spin_40s_linear_infinite]" />

                  {/* Center icon */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-float">
                      <span className="text-3xl">🎓</span>
                    </div>
                    <p className="text-sm text-gray-500 font-mono">
                      Spline 3D Goes Here
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl glass animate-float border border-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div
                className="absolute -bottom-4 -left-4 w-16 h-16 rounded-2xl glass animate-float border border-cyan-500/20 flex items-center justify-center"
                style={{ animationDelay: "1s" }}
              >
                <span className="text-xl">📊</span>
              </div>
              <div
                className="absolute top-1/2 -right-6 w-14 h-14 rounded-xl glass animate-float border border-purple-500/20 flex items-center justify-center"
                style={{ animationDelay: "2s" }}
              >
                <span className="text-lg">📅</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030712] to-transparent" />
    </section>
  );
}
