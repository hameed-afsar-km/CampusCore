"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useFirestore } from "@/lib/use-firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  FileText,
  Download,
  Share2,
  Trash2,
  Search,
  Plus,
  Image as ImageIcon,
  FileIcon,
  FolderOpen,
  Upload,
  X,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Loader2,
} from "lucide-react";

interface Note {
  id: string;
  name: string;
  subject: string;
  date: string;
  size: string;
  type: "pdf" | "doc" | "image";
  url: string;
  storagePath: string;
  userId?: string;
}

const ALL_ALLOWED_MIMES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileType(file: File): "pdf" | "doc" | "image" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "doc";
}

type TypeFilter = "all" | "pdf" | "doc" | "image";

import { useAuth } from "@/lib/auth-context";

export default function NotesPage() {
  const { user } = useAuth();
  const { data: notes, add, remove, loading } = useFirestore<Note>("notes");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subjectInput, setSubjectInput] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share link state
  const [shareNote, setShareNote] = useState<Note | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);

  const filteredNotes = notes.filter((n) => {
    const matchSearch =
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || n.type === typeFilter;
    return matchSearch && matchType;
  });

  const getFileIcon = (type: string, size = "w-8 h-8") => {
    switch (type) {
      case "pdf": return <FileText className={`${size} text-red-400`} />;
      case "image": return <ImageIcon className={`${size} text-blue-400`} />;
      case "doc": return <FileIcon className={`${size} text-teal-400`} />;
      default: return <FileText className={`${size} text-gray-400`} />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "pdf": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "image": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "doc": return "text-teal-400 bg-teal-500/10 border-teal-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      // Delete from Storage
      const storageRef = ref(storage, confirmDelete.storagePath);
      await deleteObject(storageRef);
      // Delete from Firestore
      await remove(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete note. It might already be gone.");
    }
  };

  const generateShareLink = (note: Note): string => {
    // Generate an app-specific generic sharing link
    if (typeof window !== "undefined") {
      return `${window.location.origin}/share/notes/${note.id}`;
    }
    return note.url; // fallback to direct link
  };

  const handleShareClick = (note: Note) => {
    setShareNote(note);
  };

  const handleCopyLink = () => {
    if (!shareNote) return;
    navigator.clipboard.writeText(shareNote.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const validateFile = (file: File): boolean => {
    if (!ALL_ALLOWED_MIMES.includes(file.type)) {
      setFileError("Only images, PDFs, and DOCX files are allowed.");
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setFileError("File size must be under 20MB.");
      return false;
    }
    setFileError("");
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !subjectInput.trim() || !user) return;
    const storagePath = `notes/${user.uid}/${Date.now()}-${selectedFile.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        setFileError("Upload failed: Check your internet or file permissions.");
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await add({
            name: selectedFile.name.replace(/\.[^/.]+$/, ""),
            subject: subjectInput.trim(),
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            size: formatBytes(selectedFile.size),
            type: getFileType(selectedFile),
            url: downloadURL,
            storagePath: storagePath,
          });

          setShowUploadModal(false);
          setSelectedFile(null);
          setSubjectInput("");
          setUploadProgress(null);
        } catch (addError) {
          console.error("Firestore database error:", addError);
          setFileError("File uploaded, but failed to save note details.");
          setUploadProgress(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notes Manager</h1>
          <p className="text-gray-400 mt-1">Real-time study materials stored in Firebase</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Upload Notes
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/[0.06]">
          {(["all", "pdf", "doc", "image"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                typeFilter === t
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t === "all" ? "All" : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence>
          {filteredNotes.map((note) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={note.id}
              className="dash-card group relative p-5 hover:border-purple-500/30 transition-all"
            >
              {/* Shared Indicator */}
              {note.userId !== user?.uid && (
                <div className="absolute top-2 right-2 z-10 bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
                  SHARED
                </div>
              )}
              <a
                href={note.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full h-28 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-4 hover:bg-white/[0.06] transition-colors relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {getFileIcon(note.type)}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </a>

              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-200 line-clamp-1 flex-1 text-sm">{note.name}</h3>
                <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTypeBadgeColor(note.type)}`}>
                  {note.type}
                </span>
              </div>
              <p className="text-xs text-purple-400 font-medium tracking-wide uppercase mb-2">{note.subject}</p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                <div className="text-xs text-gray-500">{note.size} · {note.date}</div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => window.open(note.url, "_blank")}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleShareClick(note)}
                    className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors"
                    title="Share Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {note.userId === user?.uid && (
                    <button
                      onClick={() => setConfirmDelete(note)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && filteredNotes.length === 0 && (
        <div className="text-center py-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
          <FolderOpen className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">No notes match your filters</h3>
          <p className="text-sm text-gray-500 mb-6">Upload PDFs, documents, or images to get started.</p>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {shareNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShareNote(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-400" /> Share Note
                </h2>
                <button onClick={() => setShareNote(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-4">
                {getFileIcon(shareNote.type, "w-6 h-6")}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 text-sm truncate">{shareNote.name}</p>
                  <p className="text-xs text-gray-500">{shareNote.subject} · {shareNote.size}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="flex-1 text-xs font-mono text-purple-300 truncate">{generateShareLink(shareNote)}</p>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                    copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.08] text-gray-300 hover:text-white"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-gray-500 mb-2">Or download the direct file:</p>
                <a 
                  href={shareNote.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> 
                  Open Original File
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => !uploadProgress && e.target === e.currentTarget && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-400" />
                  Upload Note
                </h2>
                {!uploadProgress && (
                  <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                  onClick={() => !uploadProgress && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDragOver ? "border-purple-500 bg-purple-500/10" : selectedFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/[0.1] hover:border-purple-500/40 hover:bg-white/[0.02]"
                  } ${uploadProgress ? "cursor-wait opacity-50" : "cursor-pointer"}`}
                >
                  <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} disabled={!!uploadProgress} />
                  {selectedFile ? (
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">{getFileIcon(getFileType(selectedFile))}</div>
                      <p className="text-sm font-medium text-emerald-400 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatBytes(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3"><Upload className="w-6 h-6 text-gray-400" /></div>
                      <p className="text-sm text-gray-300 font-medium">Drag & drop or click to browse</p>
                      <p className="text-xs text-gray-500 mt-2">Max 20MB</p>
                    </div>
                  )}

                  {uploadProgress !== null && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="h-full bg-purple-500" />
                      </div>
                    </div>
                  )}
                </div>

                {fileError && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"><AlertCircle className="w-4 h-4 flex-shrink-0" />{fileError}</div>}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Subject *</label>
                  <input type="text" required value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)} placeholder="e.g. DBMS" className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all" disabled={!!uploadProgress} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] transition-all" disabled={!!uploadProgress}>Cancel</button>
                  <button type="submit" disabled={!selectedFile || !subjectInput.trim() || !!fileError || !!uploadProgress} className="flex-1 btn-primary disabled:opacity-50">
                    {uploadProgress ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Upload File"}
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
        onConfirm={handleDelete}
        title="Delete Note?"
        message="This will permanently delete the file and its associated data. This action cannot be undone."
      />
    </div>
  );
}
