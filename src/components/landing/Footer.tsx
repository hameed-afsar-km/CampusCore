"use client";

import Link from "next/link";
import { Github, Linkedin, Mail, Heart } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Benefits", href: "#benefits" },
    { label: "FAQ", href: "#faq" },
  ],
  Resources: [
    { label: "Login", href: "/login" },
    { label: "Sign Up", href: "/signup" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  College: [
    { label: "BSACIST", href: "https://crfrescent.ac.in", external: true },
    { label: "Student Portal", href: "#" },
    { label: "Academic Calendar", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative pt-16 pb-8 px-6 border-t border-white/[0.06]">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <span className="text-xl font-bold">
                Campus<span className="gradient-text">Core</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">
              The ultimate academic management platform for B.S. Abdur Rahman
              Crescent Institute of Science and Technology.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Github, href: "#", label: "GitHub" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Mail, href: "mailto:contact@campuscore.app", label: "Email" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4 text-gray-300">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {('external' in link && link.external) ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} CampusCore. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for
            Crescent Institute
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
