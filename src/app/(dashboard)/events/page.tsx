"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Plus,
  Search,
  CalendarDays,
  MapPin,
  ExternalLink,
  UploadCloud,
  Users,
  X,
  Music,
  Code2,
  Palette,
  Dumbbell,
  Globe,
  Clapperboard,
  History,
  PlayCircle,
  CheckCircle2,
  ListChecks,
  Medal,
  ChevronRight,
  Filter,
  Info,
  Trash2,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

type EventCategory = "Technical" | "Cultural" | "Sports" | "Workshop" | "Hackathon" | "Media" | "Dance" | "Programming" | "Other";
type EventSource = "campus" | "user";
type EventStatus = "upcoming" | "ongoing" | "registered" | "completed" | "won";

interface AcadEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  organizer: string;
  link?: string;
  source: EventSource;
  status: EventStatus;
  proofUrl?: string;
}

const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  Technical: <Code2 className="w-4 h-4" />,
  Cultural: <Music className="w-4 h-4" />,
  Sports: <Dumbbell className="w-4 h-4" />,
  Workshop: <Globe className="w-4 h-4" />,
  Hackathon: <Code2 className="w-4 h-4" />,
  Media: <Clapperboard className="w-4 h-4" />,
  Dance: <Music className="w-4 h-4" />,
  Programming: <Code2 className="w-4 h-4" />,
  Other: <Palette className="w-4 h-4" />,
};

const CAMPUS_CATEGORIES: EventCategory[] = ["Technical", "Cultural", "Sports", "Workshop"];
const USER_CATEGORIES: EventCategory[] = ["Hackathon", "Media", "Dance", "Programming", "Cultural", "Sports", "Other"];

const mockEvents: AcadEvent[] = [
  {
    id: "1",
    title: "HackCampus 2026",
    description: "Annual 24-hour hackathon. Build innovative solutions for real-world problems.",
    category: "Technical",
    date: "Mar 28-29, 2026",
    location: "Main Auditorium",
    organizer: "CS Department",
    link: "https://hackcampus2026.com",
    source: "campus",
    status: "registered",
  },
  {
    id: "2",
    title: "AI & ML Workshop Series",
    description: "A 3-day rigorous workshop on deep learning and neural networks using PyTorch.",
    category: "Workshop",
    date: "Apr 05-07, 2026",
    location: "Lab 3, CS Block",
    organizer: "AI Club",
    source: "campus",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Inter-College Debate",
    description: "Topic: The Ethical Implications of AGI. Open to all departments.",
    category: "Cultural",
    date: "Apr 12, 2026",
    location: "Seminar Hall 1",
    organizer: "Literary Society",
    source: "campus",
    status: "upcoming",
  },
  {
    id: "4",
    title: "National Hackathon 2026",
    description: "Registered and submitted our project on AI-driven smart campus solutions.",
    category: "Hackathon",
    date: "Mar 10, 2026",
    location: "Online",
    organizer: "GeeksForGeeks",
    source: "user",
    status: "won",
    proofUrl: "certificate.pdf",
  },
  {
    id: "5",
    title: "Dance Competition - Regionals",
    description: "Participated in the regional semi-classical dance competition.",
    category: "Dance",
    date: "Feb 20, 2026",
    location: "City Arts Center",
    organizer: "Regional Arts Board",
    source: "user",
    status: "completed",
  },
];

type TabKey = "all" | "campus" | "user" | "registered" | "ongoing" | "completed" | "won" | "history";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All Events", icon: <Globe className="w-3.5 h-3.5" /> },
  { key: "campus", label: "Campus", icon: <Trophy className="w-3.5 h-3.5" /> },
  { key: "user", label: "Other Events", icon: <Users className="w-3.5 h-3.5" /> },
  { key: "registered", label: "Registered", icon: <ListChecks className="w-3.5 h-3.5" /> },
  { key: "ongoing", label: "On-Going", icon: <PlayCircle className="w-3.5 h-3.5" /> },
  { key: "completed", label: "Completed", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { key: "won", label: "Won", icon: <Medal className="w-3.5 h-3.5" /> },
  { key: "history", label: "History", icon: <History className="w-3.5 h-3.5" /> },
];

const defaultForm = {
  title: "",
  description: "",
  category: "Hackathon" as EventCategory,
  date: "",
  location: "",
  organizer: "",
  link: "",
};

export default function EventsPage() {
  const [events, setEvents] = useState<AcadEvent[]>(mockEvents);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [proofUploading, setProofUploading] = useState<string | null>(null);

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case "Technical": case "Hackathon": case "Programming": return "bg-blue-500/20 text-blue-400 border-blue-500/20";
      case "Cultural": case "Dance": return "bg-pink-500/20 text-pink-400 border-pink-500/20";
      case "Sports": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";
      case "Workshop": return "bg-purple-500/20 text-purple-400 border-purple-500/20";
      case "Media": return "bg-orange-500/20 text-orange-400 border-orange-500/20";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/20";
    }
  };

  const filtered = events.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    switch (activeTab) {
      case "campus": return e.source === "campus";
      case "user": return e.source === "user";
      case "registered": return e.status === "registered";
      case "ongoing": return e.status === "ongoing";
      case "completed": return e.status === "completed" || e.status === "won";
      case "won": return e.status === "won";
      case "history": return e.status === "completed" || e.status === "won";
      default: return true;
    }
  });

  const registerEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "registered" } : e))
    );
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: AcadEvent = {
      id: Date.now().toString(),
      title: form.title,
      description: form.description,
      category: form.category,
      date: form.date,
      location: form.location,
      organizer: form.organizer,
      link: form.link || undefined,
      source: "user",
      status: "upcoming",
    };
    setEvents((prev) => [newEvent, ...prev]);
    setShowModal(false);
    setForm(defaultForm);
  };

  const handleProofUpload = (eventId: string) => {
    setProofUploading(eventId);
    // Simulate upload
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, proofUrl: "uploaded_proof.pdf" } : e
        )
      );
      setProofUploading(null);
    }, 1500);
  };

  const markWon = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "won" } : e))
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Events & Competitions</h1>
          <p className="text-gray-400 mt-1">Discover campus events and track your own activities</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add My Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.key
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] border border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map((event, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              key={event.id}
              className="dash-card group relative p-0 overflow-hidden flex flex-col hover:border-purple-500/30 transition-all"
            >
              {/* Top Banner */}
              <div className={`h-36 flex flex-col items-center justify-center relative ${
                event.source === "campus"
                  ? "bg-gradient-to-br from-purple-500/10 to-cyan-500/10"
                  : "bg-gradient-to-br from-blue-500/10 to-pink-500/10"
              } border-b border-white/[0.06]`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${getCategoryColor(event.category)}`}>
                  {CATEGORY_ICONS[event.category] ?? <Trophy className="w-5 h-5" />}
                </div>
                <span className="text-white/30 font-semibold tracking-wider uppercase text-xs">{event.source === "campus" ? "Campus Event" : "My Event"}</span>

                {/* Status Badge */}
                {event.status !== "upcoming" && (
                  <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    event.status === "won" ? "bg-amber-500 text-white" :
                    event.status === "registered" ? "bg-emerald-500 text-white" :
                    event.status === "ongoing" ? "bg-blue-500 text-white" :
                    "bg-gray-500/70 text-white"
                  }`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-gray-100 mb-2 line-clamp-1">{event.title}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-1.5 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CalendarDays className="w-3.5 h-3.5 text-purple-400" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5 text-emerald-400" /> By {event.organizer}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                  {event.status === "upcoming" && (
                    <button
                      onClick={() => registerEvent(event.id)}
                      className="w-full text-xs font-medium px-4 py-2 rounded-xl text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                    >
                      Register / Join
                    </button>
                  )}
                  {event.status === "registered" && (
                    <div className="flex gap-2">
                      {event.link && (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-xs font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-2 rounded-xl transition-colors flex items-center gap-1 justify-center"
                        >
                          Event Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => markWon(event.id)}
                        className="flex-1 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-xl border border-amber-500/20 transition-colors"
                      >
                        Mark as Won
                      </button>
                    </div>
                  )}
                  {(event.status === "completed" || event.status === "won") && (
                    <button
                      onClick={() => handleProofUpload(event.id)}
                      disabled={!!event.proofUrl || proofUploading === event.id}
                      className={`w-full text-xs font-medium px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                        event.proofUrl
                          ? "text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 cursor-default"
                          : "text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      {proofUploading === event.id ? "Uploading..." : event.proofUrl ? "Proof Uploaded ✓" : "Upload Prize/Certificate"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
          <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">No events found</h3>
          <p className="text-sm text-gray-500">Try a different filter or add your own event.</p>
        </div>
      )}

      {/* Create Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6 my-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  Add My Event
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Event Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. National Hackathon 2026"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Category *</label>
                    <CustomSelect
                      value={form.category}
                      onChange={(v) => setForm({ ...form, category: v as EventCategory })}
                      options={USER_CATEGORIES.map((c) => ({ value: c, label: c }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Date / Duration *</label>
                    <input
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      placeholder="e.g. Mar 28-29, 2026"
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Location</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Online"
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Organizer *</label>
                    <input
                      required
                      value={form.organizer}
                      onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                      placeholder="e.g. GeeksForGeeks"
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the event..."
                    rows={2}
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Event Link (Optional)</label>
                  <input
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="https://..."
                    type="url"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">Add Event</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
