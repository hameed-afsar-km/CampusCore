"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { storage, db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { format } from "date-fns";
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
  Edit2,
  Loader2,
  FileText,
  Image as ImageIcon
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
  registrationDeadline?: string;
  location: string;
  organizer: string;
  link?: string;
  source: EventSource;
  status: EventStatus;
  proofUrl?: string;
  proofName?: string;
  thumbnailUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  registrationProofUrl?: string;
  registrationProofName?: string;
  campusEventId?: string;
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

const USER_CATEGORIES: EventCategory[] = [
  "Hackathon", "Media", "Dance", "Programming", "Cultural", "Sports", "Other"
];

const CAMPUS_CATEGORIES: EventCategory[] = [
  "Technical", "Cultural", "Sports", "Workshop", "Other"
];

type TabKey = "all" | "upcoming" | "campus" | "user" | "registered" | "ongoing" | "completed" | "won" | "history";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All Events", icon: <Globe className="w-3.5 h-3.5" /> },
  { key: "upcoming", label: "Registrations Open", icon: <CalendarDays className="w-3.5 h-3.5" /> },
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
  registrationDeadline: "",
  location: "",
  organizer: "",
  link: "",
  thumbnailUrl: "",
  attachmentUrl: "",
  attachmentName: "",
};

export default function EventsPage() {
  const { userData } = useAuth();
  const isAdminOrProfessor = userData?.role === "admin" || userData?.role === "professor";

  const { data: userEvents, add: addUserEvent, update: updateUserEvent, remove: removeUserEvent, loading: loadingUser } = useFirestore<AcadEvent>("events", true);
  const { data: campusEvents, loading: loadingCampus } = useFirestore<AcadEvent>("college_events", false);
  
  const loading = loadingUser || loadingCampus;

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingCampus, setIsEditingCampus] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, isCampus: boolean } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [registerEventTarget, setRegisterEventTarget] = useState<AcadEvent | null>(null);
  const [registerProofFile, setRegisterProofFile] = useState<File | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const events = useMemo(() => {
    const registeredCampusIds = userEvents.map(e => e.campusEventId).filter(Boolean);
    const displayedCampusEvents = campusEvents.filter(ce => !registeredCampusIds.includes(ce.id));
    return [...userEvents, ...displayedCampusEvents];
  }, [userEvents, campusEvents]);

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
      case "upcoming":
        if (e.status !== "upcoming") return false;
        if (!e.registrationDeadline) return true;
        const dl = new Date(e.registrationDeadline + "T23:59:59");
        return new Date() <= dl;
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

  const openRegisterModal = (event: AcadEvent) => {
    setRegisterEventTarget(event);
    setRegisterProofFile(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEventTarget || !registerProofFile) return;
    setIsRegistering(true);

    try {
      const res = await uploadToCloudinary(registerProofFile);
      const payload = {
        status: "registered" as EventStatus,
        registrationProofUrl: res.secure_url,
        registrationProofName: registerProofFile.name,
      };

      if (registerEventTarget.source === "campus") {
        const { id, ...eventWithoutId } = registerEventTarget;
        await addUserEvent({
          ...eventWithoutId,
          campusEventId: registerEventTarget.id,
          source: "user",
          ...payload
        });
      } else {
        await updateUserEvent(registerEventTarget.id, payload);
      }
      setRegisterEventTarget(null);
      setRegisterProofFile(null);
    } catch (err: any) {
      console.error("Registration failed:", err);
      alert("Failed to submit registration proof.");
    } finally {
      setIsRegistering(false);
    }
  };

  const markWon = (id: string) => {
    updateUserEvent(id, { status: "won" });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setIsEditingCampus(isAdminOrProfessor);
    setForm({
      ...defaultForm,
      category: isAdminOrProfessor ? "Technical" : "Hackathon"
    });
    setThumbnailFile(null);
    setAttachmentFile(null);
    setShowModal(true);
  };

  const openEditModal = (event: AcadEvent) => {
    setEditingId(event.id);
    setIsEditingCampus(event.source === "campus");
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      registrationDeadline: event.registrationDeadline || "",
      location: event.location,
      organizer: event.organizer,
      link: event.link || "",
      thumbnailUrl: event.thumbnailUrl || "",
      attachmentUrl: event.attachmentUrl || "",
      attachmentName: event.attachmentName || "",
    });
    setThumbnailFile(null);
    setAttachmentFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.organizer.trim() || !form.date) return;
    setIsUploading(true);

    try {
      let thumbUrl = form.thumbnailUrl;
      let attUrl = form.attachmentUrl;
      let attName = form.attachmentName;

      // Use Cloudinary instead of Firebase for Thumbnails
      if (thumbnailFile) {
        const res = await uploadToCloudinary(thumbnailFile);
        thumbUrl = res.secure_url;
      }

      // Use Cloudinary instead of Firebase for Attachments
      if (attachmentFile) {
        const res = await uploadToCloudinary(attachmentFile);
        attUrl = res.secure_url;
        attName = attachmentFile.name;
      }

      const payload = { ...form, thumbnailUrl: thumbUrl, attachmentUrl: attUrl, attachmentName: attName };

      if (isAdminOrProfessor && isEditingCampus) {
        if (editingId) {
          await updateDoc(doc(db, "college_events", editingId), payload);
        } else {
          await addDoc(collection(db, "college_events"), {
            ...payload, source: "campus", status: "upcoming", createdAt: serverTimestamp(),
          });
        }
      } else {
        if (editingId) {
          await updateUserEvent(editingId, payload);
        } else {
          await addUserEvent({
            ...payload, source: "user", status: "upcoming",
          });
        }
      }
      setForm(defaultForm);
      setThumbnailFile(null);
      setAttachmentFile(null);
      setShowModal(false);
    } catch (err: any) {
      console.error("Cloudinary failed:", err);
      alert(err.message || "Failed to upload files to Cloudinary. Check your .env setup.");
    } finally { setIsUploading(false); }
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.isCampus) {
        if (!isAdminOrProfessor) {
          alert("Only admins can delete campus events.");
          setConfirmDelete(null);
          return;
        }
        await deleteDoc(doc(db, "college_events", confirmDelete.id));
      } else {
        await removeUserEvent(confirmDelete.id);
      }
      setConfirmDelete(null);
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert("Failed to delete event: " + (err.message || "Unknown error"));
      setConfirmDelete(null);
    }
  };

  const handleProofUpload = async (eventId: string, file: File) => {
    if (!file) return;

    try {
      const res = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(prev => ({ ...prev, [eventId]: percent }));
      });

      await updateUserEvent(eventId, { 
        proofUrl: res.secure_url,
        proofName: file.name
      });

      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    } catch (err: any) {
      console.error("Proof upload failed:", err);
      alert("Failed to upload certificate to Cloudinary.");
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Events & Competitions</h1>
          <p className="text-gray-400 mt-1">Discover campus events and track your own activities</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add My Event
        </button>
      </div>

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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map((event, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={event.id}
              className="dash-card group relative p-0 overflow-hidden flex flex-col hover:border-purple-500/30 transition-all"
            >
              <div className={`h-36 flex flex-col items-center justify-center relative bg-cover bg-center ${
                !event.thumbnailUrl ? (event.source === "campus"
                  ? "bg-gradient-to-br from-purple-500/10 to-cyan-500/10"
                  : "bg-gradient-to-br from-blue-500/10 to-pink-500/10") : ""
              } border-b border-white/[0.06]`}
                style={event.thumbnailUrl ? { backgroundImage: `url(${event.thumbnailUrl})` } : {}}
              >
                {event.thumbnailUrl && <div className="absolute inset-0 bg-black/60" />}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 z-10 ${getCategoryColor(event.category)}`}>
                  {CATEGORY_ICONS[event.category] ?? <Trophy className="w-5 h-5" />}
                </div>
                <span className="text-white/30 font-semibold tracking-wider uppercase text-xs z-10">{event.source === "campus" ? "Campus Event" : "My Event"}</span>

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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(event)} className="p-1 rounded text-gray-500 hover:text-purple-400 hover:bg-white/[0.1] transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmDelete({ id: event.id, isCampus: event.source === "campus" })} className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-100 mb-2 line-clamp-1">{event.title}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-1.5 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
                    Event: {event.date ? format(new Date(event.date + "T12:00:00"), "MMM d, yyyy") : "TBD"}
                  </div>
                  {event.registrationDeadline && (
                    <div className="flex items-center gap-2 text-xs text-amber-400/80">
                      <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                      Deadline: {format(new Date(event.registrationDeadline + "T12:00:00"), "MMM d, yyyy")}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> {event.location}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-400"><Users className="w-3.5 h-3.5 text-emerald-400" /> By {event.organizer}</div>
                  {event.attachmentUrl && (
                    <a href={event.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 w-fit px-2 py-1 rounded-md mt-1">
                      <FileText className="w-3.5 h-3.5" /> <span className="truncate max-w-[150px]">{event.attachmentName || "View Attachment"}</span>
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                  {event.status === "upcoming" && (
                    <button onClick={() => openRegisterModal(event)} className="w-full text-xs font-medium px-4 py-2 rounded-xl text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors">Register / Upload Proof</button>
                  )}
                  {event.status === "registered" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {event.link && (
                          <a href={event.link} target="_blank" rel="noopener noreferrer" className="flex-1 text-[11px] font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-2 rounded-xl transition-colors flex items-center justify-center gap-1">Portal <ExternalLink className="w-3 h-3" /></a>
                        )}
                        {event.registrationProofUrl && (
                          <a href={event.registrationProofUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-2 rounded-xl transition-colors flex items-center justify-center gap-1">My Proof <FileText className="w-3 h-3" /></a>
                        )}
                      </div>
                      <button onClick={() => markWon(event.id)} className="w-full text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-xl border border-amber-500/20 transition-colors">Mark as Won</button>
                    </div>
                  )}
                  {(event.status === "completed" || event.status === "won") && (
                    <div className="space-y-2">
                      <label className={`w-full text-xs font-medium px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        event.proofUrl ? "text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" : "text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                      }`}>
                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleProofUpload(event.id, e.target.files[0])} disabled={!!uploadProgress[event.id]} />
                        {uploadProgress[event.id] !== undefined ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadProgress[event.id].toFixed(0)}% Uploading</>
                        ) : event.proofUrl ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Proof Uploaded</>
                        ) : (
                          <><UploadCloud className="w-3.5 h-3.5" /> Upload Prize/Certificate</>
                        )}
                      </label>
                      {event.proofUrl && (
                        <a href={event.proofUrl} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-center text-gray-500 hover:text-white transition-colors underline truncate">{event.proofName || "View Proof"}</a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
          <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">No events found</h3>
          <p className="text-sm text-gray-500">Try a different filter or add your own event.</p>
        </div>
      )}

      {/* Create / Edit Modal */}
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
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-purple-400" />{editingId ? "Edit My Event" : "Add My Event"}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Event Title *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. National Hackathon" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Category *</label>
                    <CustomSelect value={form.category} onChange={(v) => setForm({ ...form, category: v as EventCategory })} options={USER_CATEGORIES.map((c) => ({ value: c, label: c }))} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Event Date *</label>
                    <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-3 text-sm text-gray-200 outline-none transition-all [color-scheme:dark]" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Reg. Deadline</label>
                    <input type="date" value={form.registrationDeadline || ""} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-3 text-sm text-gray-200 outline-none transition-all [color-scheme:dark]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Location</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Online" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Organizer *</label>
                    <input required value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder="e.g. Google" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief details..." rows={2} className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Event Link (Optional)</label>
                  <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." type="url" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" />
                </div>
                
                {/* Thumbnails & Attachments inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Thumbnail Image</label>
                    <label className="flex items-center justify-center w-full bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/50 rounded-xl py-2.5 px-3 text-sm text-gray-400 outline-none transition-all cursor-pointer">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      <span className="truncate">{thumbnailFile ? thumbnailFile.name : (form.thumbnailUrl ? "Change Image" : "Upload Image")}</span>
                      <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Attachment</label>
                    <label className="flex items-center justify-center w-full bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/50 rounded-xl py-2.5 px-3 text-sm text-gray-400 outline-none transition-all cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="truncate">{attachmentFile ? attachmentFile.name : (form.attachmentUrl ? "Change File" : "Upload File")}</span>
                      <input type="file" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] transition-all">Cancel</button>
                  <button type="submit" disabled={isUploading} className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2">
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isUploading ? "Saving..." : (editingId ? "Save Changes" : "Add Event")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Proof Modal */}
      <AnimatePresence>
        {registerEventTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setRegisterEventTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#0a0e17] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">Complete Registration</h3>
              <p className="text-sm text-gray-400 mb-4">You are registering for <strong>{registerEventTarget.title}</strong>. Please complete your registration via the event portal/link, then upload your proof of registration (screenshot or PDF) below.</p>
              
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center justify-center w-full bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/50 rounded-xl py-3 px-3 text-sm text-blue-400/80 outline-none transition-all cursor-pointer border-dashed">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="truncate">{registerProofFile ? registerProofFile.name : "Select Proof File *"}</span>
                    <input type="file" required onChange={(e) => setRegisterProofFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setRegisterEventTarget(null)} disabled={isRegistering} className="flex-1 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] transition-all">Cancel</button>
                  <button type="submit" disabled={isRegistering || !registerProofFile} className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2">
                    {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Proof"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={performDelete}
        title="Delete Event?"
        message="This action cannot be undone. This event will be removed from your list."
      />
    </div>
  );
}

