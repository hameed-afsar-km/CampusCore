"use client";

import { motion } from "framer-motion";
import { Shield, GraduationCap, Building } from "lucide-react";

export default function TrustSection() {
  return (
    <section className="relative py-24 px-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-[100px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                Trusted & Secure
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for <span className="gradient-text">real college use</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              CampusCore is purpose-built for B.S. Abdur Rahman Crescent
              Institute of Science and Technology. Designed by students who
              understand the challenges, for students who want to excel.
            </p>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: GraduationCap,
                  title: "Designed for Students",
                  desc: "Built around real student workflows and pain points",
                },
                {
                  icon: Building,
                  title: "College Integrated",
                  desc: "Tailored for BSACIST academic structure",
                },
                {
                  icon: Shield,
                  title: "Secure & Private",
                  desc: "Your data stays safe with Firebase security",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <item.icon className="w-6 h-6 text-purple-400 mb-3 mx-auto" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
