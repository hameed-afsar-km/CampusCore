"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

interface Note {
  id: string;
  name: string;
  subject: string;
  date: string;
  size: string;
  type: "pdf" | "doc" | "image";
  file?: File;
  objectUrl?: string; // blob URL for real uploaded files
}

const mockNotes: Note[] = [
  { id: "1", name: "Chapter 4 Notes - B Trees", subject: "DBMS", date: "Oct 12, 2026", size: "2.4 MB", type: "pdf" },
  { id: "2", name: "Process Synchronization Handout", subject: "Operating Systems", date: "Oct 10, 2026", size: "1.1 MB", type: "pdf" },
  { id: "3", name: "Board Snapshot - Dijkstra's", subject: "Algorithms", date: "Oct 09, 2026", size: "5.8 MB", type: "image" },
  { id: "4", name: "Group Project Draft", subject: "Software Eng", date: "Oct 05, 2026", size: "840 KB", type: "doc" },
];

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

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subjectInput, setSubjectInput] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share link state
  const [shareNote, setShareNote] = useState<Note | null>(null);
  const [copied, setCopied] = useState(false);

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

  const deleteNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note?.objectUrl) URL.revokeObjectURL(note.objectUrl);
    setNotes(notes.filter((n) => n.id !== id));
  };

  const openNote = (note: Note) => {
    if (note.objectUrl) {
      window.open(note.objectUrl, "_blank");
    } else {
      // For mock notes — show a placeholder action
      alert(`Cannot preview "${note.name}" — this is a demo note without an actual file.`);
    }
  };

  const downloadNote = (note: Note) => {
    if (!note.objectUrl || !note.file) {
      alert(`"${note.name}" is a demo note and cannot be downloaded.`);
      return;
    }
    const a = document.createElement("a");
    a.href = note.objectUrl;
    a.download = note.file.name;
    a.click();
  };

  const generateShareLink = (note: Note): string => {
    // In a real app, this would be an API call to generate a short link
    return `https://campuscore.app/notes/share/${note.id}?view=1`;
  };

  const handleShareClick = (note: Note) => {
    setShareNote(note);
    setCopied(false);
  };

  const handleCopyLink = () => {
    if (!shareNote) return;
    navigator.clipboard.writeText(generateShareLink(shareNote)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const validateFile = (file: File): boolean => {
    if (!ALL_ALLOWED_MIMES.includes(file.type)) {
      setFileError("Only images (JPG, PNG, GIF, WebP), PDFs, and DOCX files are allowed.");
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !subjectInput.trim()) return;

    const objectUrl = URL.createObjectURL(selectedFile);
    const newNote: Note = {
      id: Date.now().toString(),
      name: selectedFile.name.replace(/\.[^/.]+$/, ""),
      subject: subjectInput.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      size: formatBytes(selectedFile.size),
      type: getFileType(selectedFile),
      file: selectedFile,
      objectUrl,
    };
    setNotes([newNote, ...notes]);
    setShowUploadModal(false);
    setSelectedFile(null);
    setSubjectInput("");
    setFileError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notes Manager</h1>
          <p className="text-gray-400 mt-1">Upload, open, share, and organize your study materials</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Upload Notes
        </button>
      </div>

      {/* Toolbar */}
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

        {/* Type filter tabs */}
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

      {/* Grid */}
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
              {/* File Preview Area */}
              <button
                onClick={() => openNote(note)}
                className="flex items-center justify-center w-full h-28 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-4 hover:bg-white/[0.06] transition-colors relative overflow-hidden"
                title="Open file"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {getFileIcon(note.type)}
                {/* Open hint on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </button>

              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-200 line-clamp-1 flex-1 text-sm" title={note.name}>
                  {note.name}
                </h3>
                <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTypeBadgeColor(note.type)}`}>
                  {note.type}
                </span>
              </div>
              <p className="text-xs text-purple-400 font-medium tracking-wide uppercase mb-2">{note.subject}</p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                <div className="text-xs text-gray-500">{note.size} · {note.date}</div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => openNote(note)}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadNote(note)}
                    className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleShareClick(note)}
                    className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors"
                    title="Share link (view/download)"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
          <FolderOpen className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">
            {search || typeFilter !== "all" ? "No notes match your filters" : "No notes yet"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">Upload PDFs, documents, or images.</p>
          {!search && typeFilter === "all" && (
            <button onClick={() => setShowUploadModal(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload Your First Note
            </button>
          )}
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

              <p className="text-xs text-gray-500 mb-3">
                Anyone with this link can <strong className="text-gray-300">view or download</strong> the file. They cannot edit it.
              </p>

              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="flex-1 text-xs font-mono text-purple-300 truncate">
                  {generateShareLink(shareNote)}
                </p>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                    copied
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/[0.08] text-gray-300 hover:text-white"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
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
            onClick={(e) => e.target === e.currentTarget && setShowUploadModal(false)}
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
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-purple-500/60 bg-purple-500/10"
                      : selectedFile
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-white/[0.1] hover:border-purple-500/40 hover:bg-white/[0.02]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  {selectedFile ? (
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                        {getFileIcon(getFileType(selectedFile))}
                      </div>
                      <p className="text-sm font-medium text-emerald-400 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatBytes(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-300 font-medium">Drag & drop or click to browse</p>
                      <p className="text-xs text-gray-500 mt-2">PDF, DOCX, or Images (max 20MB)</p>
                    </div>
                  )}
                </div>

                {fileError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {fileError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="e.g. Database Management Systems"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || !subjectInput.trim() || !!fileError}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload File
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
