"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "Is CampusCore free?",
    a: "Yes! CampusCore is completely free for students, professors, and admins at Crescent Institute. We believe academic tools should be accessible to everyone.",
  },
  {
    q: "Who can use CampusCore?",
    a: "CampusCore is designed for three roles — Students, Professors, and Admins. Each role has a tailored dashboard and feature set. Students can manage assignments, notes, and attendance. Professors can create assignments and announcements. Admins can manage the entire system.",
  },
  {
    q: "Do professors need an account?",
    a: "Yes, professors need to create an account and select the 'Professor' role during signup. This gives them access to assignment creation, announcement posting, leave approvals, and class management features.",
  },
  {
    q: "Can I access CampusCore on mobile?",
    a: "Absolutely! CampusCore is fully responsive and works seamlessly on mobile browsers. We've optimized the interface for touch interactions and smaller screens.",
  },
  {
    q: "How is my data stored and secured?",
    a: "We use Firebase Authentication for secure login and Firebase Firestore for data storage. All data is encrypted and follows industry security standards. Your personal information is never shared.",
  },
  {
    q: "Can I share notes with other students?",
    a: "Yes! The collaboration feature allows you to share notes, tasks, and projects with other students. You can generate shareable links or invite specific people with permission-based access.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 px-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-gray-400 bg-white/5 px-4 py-1.5 rounded-full">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Frequently asked{" "}
            <span className="gradient-text">questions</span>
          </h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="faq-item bg-white/[0.02]">
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === i ? null : i)
                  }
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-sm md:text-base pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-400 ${
                    openIndex === i
                      ? "max-h-48 pb-5 px-5"
                      : "max-h-0"
                  }`}
                >
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
