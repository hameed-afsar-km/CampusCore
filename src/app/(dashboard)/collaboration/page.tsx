"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  Users,
  Search,
  UserPlus,
  Send,
  MoreVertical,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  Globe,
} from "lucide-react";

interface Request {
  id: string;
  senderName: string;
  role: string;
  type: "document" | "project" | "study-group";
  itemName: string;
  status: "pending" | "accepted" | "declined";
  timestamp: string;
}

const mockRequests: Request[] = [
  {
    id: "1",
    senderName: "Alex Dev",
    role: "student",
    type: "document",
    itemName: "Algorithms Summary Notes",
    status: "pending",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    senderName: "Prof. Sarah",
    role: "professor",
    type: "project",
    itemName: "Final Year Capstone Review",
    status: "pending",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    senderName: "Mike R.",
    role: "student",
    type: "study-group",
    itemName: "Weekly Code Forces Grp",
    status: "accepted",
    timestamp: "Oct 12",
  },
];

export default function CollaborationPage() {
  const [search, setSearch] = useState("");
  const { userData } = useAuth();
  const [requests, setRequests] = useState(mockRequests);

  const filtered = requests.filter((r) =>
    r.senderName.toLowerCase().includes(search.toLowerCase()) || 
    r.itemName.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document": return <FileText className="w-4 h-4 text-purple-400" />;
      case "project": return <Globe className="w-4 h-4 text-cyan-400" />;
      case "study-group": return <Users className="w-4 h-4 text-emerald-400" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const updateStatus = (id: string, newStatus: "accepted" | "declined") => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Collaboration</h1>
          <p className="text-gray-400 mt-1">Manage invites, shared files, and study groups</p>
        </div>
        <button className="btn-primary flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5" /> Invite Someone
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search requests by name or item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <AnimatePresence>
          {filtered.map((req, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={req.id}
              className="dash-card group relative p-5 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-xl ${
                    req.role === 'professor' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  }`}>
                    {req.senderName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-200">{req.senderName}</h3>
                    <p className="text-xs text-gray-500 capitalize">{req.role}</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-white/[0.03] p-3 rounded-xl border border-white/[0.04] mb-5">
                <div className="flex-shrink-0 p-2 rounded-lg bg-white/[0.05]">
                  {getTypeIcon(req.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Invited you to view</p>
                  <p className="text-sm font-medium text-gray-300 truncate" title={req.itemName}>
                    {req.itemName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                <span className="text-xs text-gray-500">
                  {req.timestamp}
                </span>

                <div className="flex gap-2">
                  {req.status === "pending" ? (
                    <>
                      <button 
                        onClick={() => updateStatus(req.id, "accepted")}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button 
                         onClick={() => updateStatus(req.id, "declined")}
                         className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/[0.05] hover:bg-red-500/10 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 rounded-lg transition-colors flex items-center gap-1"
                      >
                         <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  ) : (
                    <span className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border flex items-center gap-1.5 ${
                      req.status === 'accepted' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                      'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                      {req.status === 'accepted' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
         <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
           <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
             <Users className="w-8 h-8 text-gray-500" />
           </div>
           <h3 className="text-lg font-medium text-gray-300 mb-1">No requests found</h3>
           <p className="text-sm text-gray-500">You don&apos;t have any collaboration invites matching your criteria.</p>
         </div>
      )}
    </div>
  );
}
