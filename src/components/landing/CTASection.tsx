"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";

export default function CTASection() {
  return (
    <section className="relative py-24 px-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative text-center"
        >
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[100px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">
                Ready to get organized?
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Start your{" "}
              <span className="gradient-text">organized semester</span>
              <br />
              today.
            </h2>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
              Join your college on CampusCore and take control of your academic
              life. It&apos;s free, it&apos;s fast, and it&apos;s built just for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="group"
              >
                <ShinyButton className="!py-3.5 !px-8 text-base">
                  <span className="flex items-center gap-2">
                    Start Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </ShinyButton>
              </Link>
              <Link
                href="/login"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-base !py-3.5 !px-8"
              >
                Join Your College
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
