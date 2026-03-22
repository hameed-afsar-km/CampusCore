"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GradualBlur from "@/components/ui/GradualBlur";
import { ShinyButton } from "@/components/ui/shiny-button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`
            pointer-events-auto relative flex items-center justify-between px-6 py-3 rounded-full 
            transition-all duration-500 w-full max-w-7xl
            ${scrolled 
              ? "glass border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]" 
              : "bg-transparent border-transparent"}
          `}
        >
          {/* Top Edge Blur Effect */}
          {scrolled && (
            <div className="absolute inset-0 rounded-full overflow-hidden -z-10">
              <GradualBlur
                position="top"
                height="100%"
                strength={1.5}
                divCount={6}
                opacity={0.7}
              />
            </div>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight text-white">
              Campus<span className="gradient-text">Core</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-300 hover:text-white px-4 py-2 transition-all"
            >
              Login
            </Link>
            <Link href="/signup">
              <ShinyButton className="!py-2 !px-6 !text-sm">Get Started</ShinyButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </motion.nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#02050e]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10"
            >
              <X className="size-6 text-white" />
            </button>
            <div className="flex flex-col items-center gap-8 w-full">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-3xl font-bold text-white hover:text-purple-400 transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="flex flex-col gap-4 mt-8 w-full max-w-sm">
                 <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <button className="w-full py-4 rounded-2xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all">
                    Login
                  </button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <ShinyButton className="w-full py-4 text-lg">Get Started</ShinyButton>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

