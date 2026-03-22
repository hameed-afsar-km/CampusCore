"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  Trophy,
  Plus,
  Search,
  CalendarDays,
  MapPin,
  ExternalLink,
  UploadCloud,
  Users,
} from "lucide-react";

interface AcadEvent {
  id: string;
  title: string;
  description: string;
  category: "Technical" | "Cultural" | "Sports" | "Workshop";
  date: string;
  location: string;
  organizer: string;
  link?: string;
  registered: boolean;
  coverImage?: string;
}

const mockEvents: AcadEvent[] = [
  {
    id: "1",
    title: "HackCampus 2026",
    description: "Annual 24-hour hackathon. Build innovative solutions for real-world problems. Great prizes for winners!",
    category: "Technical",
    date: "Mar 28-29, 2026",
    location: "Main Auditorium",
    organizer: "CS Department",
    link: "https://hackcampus2026.com",
    registered: true,
  },
  {
    id: "2",
    title: "AI & ML Workshop series",
    description: "A 3-day rigorous workshop on deep learning and neural networks using PyTorch.",
    category: "Workshop",
    date: "Apr 05-07, 2026",
    location: "Lab 3, CS Block",
    organizer: "AI Club",
    registered: false,
  },
  {
    id: "3",
    title: "Inter-College Debate",
    description: "Topic: The Ethical Implications of AGI. Open to all departments.",
    category: "Cultural",
    date: "Apr 12, 2026",
    location: "Seminar Hall 1",
    organizer: "Literary Society",
    link: "https://debate.crfrescent.ac.in",
    registered: false,
  },
];

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const { userData } = useAuth();
  const isAdmin = userData?.role === "admin";

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Technical": return "bg-blue-500/20 text-blue-400 border-blue-500/20";
      case "Cultural": return "bg-pink-500/20 text-pink-400 border-pink-500/20";
      case "Sports": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";
      case "Workshop": return "bg-purple-500/20 text-purple-400 border-purple-500/20";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/20";
    }
  };

  const filtered = mockEvents.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Events & Competitions</h1>
          <p className="text-gray-400 mt-1">Discover and participate in college activities</p>
        </div>
        {isAdmin && (
          <button className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Create Event
          </button>
        )}
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search events by title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map((event, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={event.id}
              className="dash-card group relative p-0 overflow-hidden flex flex-col hover:border-purple-500/30 transition-all"
            >
              {/* Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-b border-white/[0.06] flex flex-col items-center justify-center relative group-hover:from-purple-500/20 group-hover:to-cyan-500/20 transition-all">
                <Trophy className="w-12 h-12 text-white/20 mb-2" />
                <span className="text-white/20 font-semibold tracking-wider uppercase text-sm">{event.category}</span>
                
                {/* Registration Badge */}
                {event.registered && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Registered
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300 mb-2 line-clamp-1">
                  {event.title}
                </h3>
                
                <p className="text-sm text-gray-400 mb-5 line-clamp-2">
                  {event.description}
                </p>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <CalendarDays className="w-4 h-4 text-purple-400" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <MapPin className="w-4 h-4 text-cyan-400" /> {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Users className="w-4 h-4 text-emerald-400" /> By {event.organizer}
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  {event.link ? (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 w-full justify-center"
                    >
                      {event.registered ? "Event Portal" : "Register Now"} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                     <button className={`text-xs font-medium px-4 py-2 rounded-xl border transition-colors flex items-center gap-1.5 w-full justify-center ${event.registered ? 'text-gray-400 border-white/[0.06] bg-white/[0.02]' : 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20'}`}>
                      {event.registered ? "Registered" : "Sign Up"}
                     </button>
                  )}
                </div>
                
                {/* Proof Upload (if registered) */}
                {event.registered && (
                  <div className="mt-3">
                     <button className="text-[11px] font-medium text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 w-full py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" /> Upload Prize/Certificate
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
