"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Share2,
  Trash2,
  Search,
  Filter,
  Plus,
  FileIcon,
  FolderOpen,
  Image as ImageIcon,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Note {
  id: string;
  name: string;
  subject: string;
  date: string;
  size: string;
  type: "pdf" | "doc" | "image";
}

const mockNotes: Note[] = [
  { id: "1", name: "Chapter 4 Notes - B Trees", subject: "DBMS", date: "Oct 12, 2026", size: "2.4 MB", type: "pdf" },
  { id: "2", name: "Process Synchronization Handout", subject: "Operating Systems", date: "Oct 10, 2026", size: "1.1 MB", type: "pdf" },
  { id: "3", name: "Board Snapshot - Dijkstra's", subject: "Algorithms", date: "Oct 09, 2026", size: "5.8 MB", type: "image" },
  { id: "4", name: "Group Project Draft", subject: "Software Eng", date: "Oct 05, 2026", size: "840 KB", type: "doc" },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [search, setSearch] = useState("");
  const { userData } = useAuth();

  const filteredNotes = notes.filter((n) => 
    n.name.toLowerCase().includes(search.toLowerCase()) || 
    n.subject.toLowerCase().includes(search.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FileText className="w-8 h-8 text-red-400" />;
      case "image": return <ImageIcon className="w-8 h-8 text-blue-400" />;
      case "doc": return <FileIcon className="w-8 h-8 text-teal-400" />;
      default: return <FileText className="w-8 h-8 text-gray-400" />;
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notes Manager</h1>
          <p className="text-gray-400 mt-1">Upload, organize, and share study materials</p>
        </div>
        <button className="btn-primary flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Upload Notes
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white/[0.02] p-2 rounded-2xl border border-white/[0.06]">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by file name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 bg-white/[0.03] hover:text-white border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 bg-white/[0.03] hover:text-white border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all">
            <FolderOpen className="w-4 h-4" /> Subjects
          </button>
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
              className="dash-card group relative p-5 hover:border-purple-500/30 transition-all cursor-default"
            >
              <div className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                 <MoreVertical className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-center h-32 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-4 group-hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {getFileIcon(note.type)}
              </div>

              <h3 className="font-semibold text-gray-200 line-clamp-1 mb-1" title={note.name}>{note.name}</h3>
              <p className="text-xs text-purple-400 font-medium tracking-wide uppercase mb-2">
                {note.subject}
              </p>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                <div className="text-xs text-gray-500">
                  {note.size} • {note.date}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                  <button className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors" title="Share via link">
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
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
            <FolderOpen className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-1">Upload your first note</h3>
          <p className="text-sm text-gray-500 mb-6">Store your PDFs, documents, or images safely.</p>
          <button className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Select Files
          </button>
        </div>
      )}
    </div>
  );
}
