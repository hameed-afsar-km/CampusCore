"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Squares } from "@/components/ui/Squares";
import { TextLoop } from "@/components/ui/text-loop";
import { ShinyButton } from "@/components/ui/shiny-button";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Immersive Squares Background */}
      <div className="absolute inset-0 z-0">
        <Squares 
          speed={0.3} 
          squareSize={45} 
          direction="diagonal" 
          borderColor="rgba(108, 92, 231, 0.08)" 
          hoverFillColor="rgba(0, 210, 255, 0.05)" 
        />
      </div>

      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb orb-primary w-[500px] h-[500px] -top-40 -left-40 opacity-40 blur-[130px]" />
        <div className="orb orb-accent w-[400px] h-[400px] top-1/4 right-0 opacity-20 blur-[110px]" />
      </div>


      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6"
            >
              Your Base for{" "}
              <br className="hidden md:block"/>
              <TextLoop className="gradient-text pt-4 md:pt-0" interval={2.5}>
                {[
                  "Academic Excellence",
                  "Event Management",
                  "Seamless Collaboration",
                  "Performance Tracking"
                ]}
              </TextLoop>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed mb-10"
            >
              Manage assignments, notes, exams, attendance, and more — all
              seamlessly organized in one platform designed exclusively for students.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/login" passHref>
                <ShinyButton className="w-full sm:w-auto text-base">
                  <span className="flex flex-row items-center justify-center gap-2 font-semibold">
                    Get Started <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </ShinyButton>
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

          {/* Right - Dynamic Floating Glass Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, type: "spring", damping: 20 }}
            className="hidden lg:flex relative w-full aspect-[4/3] items-center justify-end scale-90 origin-right"
          >
            <div className="relative w-full max-w-[420px] h-full">
              {/* Background Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-purple-500/20 via-cyan-500/10 to-transparent blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
              
              {/* Main Center Dashboard Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-20 w-[85%] left-[7.5%] top-[10%] rounded-2xl glass border border-white/10 bg-[#030712]/60 backdrop-blur-xl p-5 shadow-2xl shadow-purple-500/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      GPA
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-200">Current Standing</h4>
                      <p className="text-[10px] text-gray-500">Semester 4 • Computer Science</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                    9.42
                  </span>
                </div>
                {/* Mock Chart */}
                <div className="h-16 w-full flex items-end gap-1.5 opacity-80 mt-6">
                  {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className="flex-1 bg-gradient-to-t from-purple-500/20 to-cyan-400/80 rounded-t-sm"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Top Right Floating Card (Events) */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-10 w-48 -right-4 top-[0%] rounded-2xl glass border border-white/10 bg-[#030712]/70 backdrop-blur-md p-4 shadow-xl shadow-cyan-500/5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🏆</span>
                  <h4 className="text-xs font-bold text-gray-300">Hackathon</h4>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[70%] bg-cyan-400 rounded-full" />
                  </div>
                  <p className="text-[9px] text-gray-500 text-right">Approaching</p>
                </div>
              </motion.div>

              {/* Bottom Left Floating Card (Assignments) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-30 w-56 -left-8 bottom-[15%] rounded-2xl glass border border-white/10 bg-[#030712]/80 backdrop-blur-xl p-4 shadow-2xl shadow-black/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <span className="text-emerald-400 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">OS Project</h4>
                    <p className="text-[10px] text-emerald-400 mt-0.5">Submitted On Time</p>
                  </div>
                </div>
              </motion.div>

              {/* Decorative Abstract Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full border border-purple-500/10 animate-[spin_30s_linear_infinite]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] aspect-square rounded-full border border-cyan-500/5 animate-[spin_40s_linear_infinite_reverse]" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030712] to-transparent" />
    </section>
  );
}
