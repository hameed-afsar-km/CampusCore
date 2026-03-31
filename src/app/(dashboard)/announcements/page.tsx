"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  Bell,
  Megaphone,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  Pin,
  Trash2,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function AnnouncementsPage() {
  const [search, setSearch] = useState("");
  const { userData } = useAuth();
  const canPost = userData?.role === "professor" || userData?.role === "admin";
  
  const { data: announcements, loading } = useFirestore<any>("announcements", false);
  const [showModal, setShowModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const performDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "announcements", confirmDelete));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDelete(null);
    }
  };

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [pinned, setPinned] = useState(false);

  const filtered = announcements.filter((a: any) =>
    (a.title || "").toLowerCase().includes(search.toLowerCase()) || 
    (a.content || "").toLowerCase().includes(search.toLowerCase())
  );

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !userData) return;
    setIsPosting(true);
    
    try {
      await addDoc(collection(db, "announcements"), {
        title,
        content,
        urgent,
        pinned,
        author: userData.displayName,
        role: userData.role,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setTitle(""); setContent(""); setUrgent(false); setPinned(false);
    } catch (error) {
      console.error("Error adding announcement: ", error);
      alert("Failed to post announcement");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Announcements</h1>
          <p className="text-gray-400 mt-1">Stay updated with important college notices</p>
        </div>
        {canPost && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Announcement
          </button>
        )}
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading announcements...</div>
        ) : (
          <AnimatePresence>
            {filtered.map((announcement: any, i: number) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                key={announcement.id}
                className={`dash-card group relative p-5 hover:bg-white/[0.03] transition-colors ${
                  announcement.urgent ? "border-l-4 border-l-red-500" :
                  announcement.pinned ? "border-l-4 border-l-purple-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.urgent && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                      {announcement.pinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">
                      {announcement.title}
                    </h3>
                    
                    <p className="text-sm text-gray-400 leading-relaxed mb-4 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs font-medium border-t border-white/[0.06] pt-4">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                          announcement.role === "admin" ? "bg-gradient-to-br from-purple-500 to-indigo-500" :
                          "bg-gradient-to-br from-cyan-500 to-blue-500"
                        }`}>
                          {(announcement.author || "A").charAt(0)}
                        </div>
                        {announcement.author}
                        <span className="text-gray-500 ml-1 capitalize px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06]">
                          {announcement.role}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {announcement.createdAt ? format(announcement.createdAt.toDate ? announcement.createdAt.toDate() : new Date(announcement.createdAt), "MMM d, h:mm a") : "Just now"}
                      </div>
                    </div>
                  </div>

                  {canPost && (
                    <button 
                      onClick={() => setConfirmDelete(announcement.id)}
                      className="flex-shrink-0 p-1 rounded-md text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
              <Megaphone className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-1">No announcements found</h3>
            <p className="text-sm text-gray-500">There are no notices to display.</p>
          </div>
        )}
      </div>

      {/* Write Announcement Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-500" />
                Post Announcement
              </h2>

              <form onSubmit={handlePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mid-Term Examination Schedule"
                    className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Content</label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide details about the announcement..."
                    className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="rounded border-white/[0.08] bg-white/[0.02] text-purple-500 focus:ring-purple-500/50"
                    />
                    Pin to top
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={urgent}
                      onChange={(e) => setUrgent(e.target.checked)}
                      className="rounded border-white/[0.08] bg-white/[0.02] text-red-500 focus:ring-red-500/50"
                    />
                    Mark as Urgent
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.06] mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.03] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPosting}
                    className="btn-primary"
                  >
                    {isPosting ? "Posting..." : "Publish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={performDelete}
        title="Delete Announcement?"
        message="This action cannot be undone."
      />
    </div>
  );
}
