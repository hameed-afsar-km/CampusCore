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
  Copy,
  UserCheck,
  Link2,
  X,
  FolderKanban,
  BookOpen,
  GraduationCap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CollabRequest {
  id: string;
  senderName: string;
  role: string;
  type: "document" | "project" | "study-group";
  itemName: string;
  status: "pending" | "accepted" | "declined";
  timestamp: string;
}

interface Friend {
  id: string;
  name: string;
  role: string;
  initial: string;
  gradient: string;
  collabs: number;
  status: "friend" | "pending-sent" | "pending-received";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockRequests: CollabRequest[] = [
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

const mockFriends: Friend[] = [
  { id: "f1", name: "Alex Dev", role: "Student", initial: "A", gradient: "from-purple-500 to-indigo-500", collabs: 3, status: "friend" },
  { id: "f2", name: "Riya Sharma", role: "Student", initial: "R", gradient: "from-pink-500 to-rose-500", collabs: 1, status: "friend" },
  { id: "f3", name: "Karan Patel", role: "Student", initial: "K", gradient: "from-cyan-500 to-blue-500", collabs: 2, status: "pending-sent" },
  { id: "f4", name: "Priya Menon", role: "Student", initial: "P", gradient: "from-emerald-500 to-teal-500", collabs: 0, status: "pending-received" },
];

type TabType = "collaborations" | "friends";

export default function CollaborationPage() {
  const [search, setSearch] = useState("");
  const { userData } = useAuth();
  const [requests, setRequests] = useState<CollabRequest[]>(mockRequests);
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [tab, setTab] = useState<TabType>("collaborations");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<"project" | "friend">("friend");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document": return <FileText className="w-4 h-4 text-purple-400" />;
      case "project": return <FolderKanban className="w-4 h-4 text-cyan-400" />;
      case "study-group": return <BookOpen className="w-4 h-4 text-emerald-400" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const updateStatus = (id: string, newStatus: "accepted" | "declined") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.senderName.toLowerCase().includes(search.toLowerCase()) ||
      r.itemName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const generateLink = () => {
    const fakeLink = `https://campuscore.app/invite/${Math.random().toString(36).substring(2, 10)}`;
    setInviteLink(fakeLink);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const acceptFriend = (id: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "friend" } : f))
    );
  };

  const removeFriend = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Collaboration</h1>
          <p className="text-gray-400 mt-1">Manage invites, shared files, friends, and study groups</p>
        </div>
        <button
          onClick={() => { setShowInviteModal(true); setInviteLink(""); }}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Link2 className="w-5 h-5" /> Generate Invite Link
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/[0.06] w-fit">
        {([
          { key: "collaborations" as TabType, label: "Collaborations", icon: <Globe className="w-3.5 h-3.5" /> },
          { key: "friends" as TabType, label: "Friends", icon: <Users className="w-3.5 h-3.5" /> },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={tab === "collaborations" ? "Search requests..." : "Search friends..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      {/* ─── Collaborations Tab ─────────────────────────────────────────── */}
      {tab === "collaborations" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredRequests.map((req, i) => (
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
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-xl ${
                        req.role === "professor"
                          ? "bg-gradient-to-br from-cyan-500 to-blue-500"
                          : "bg-gradient-to-br from-purple-500 to-indigo-500"
                      }`}
                    >
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
                    <p className="text-xs text-gray-500 mb-0.5">Invited you to collaborate on</p>
                    <p className="text-sm font-medium text-gray-300 truncate" title={req.itemName}>
                      {req.itemName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <span className="text-xs text-gray-500">{req.timestamp}</span>
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
                      <span
                        className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border flex items-center gap-1.5 ${
                          req.status === "accepted"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-red-400 bg-red-500/10 border-red-500/20"
                        }`}
                      >
                        {req.status === "accepted" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredRequests.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
              <Globe className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-1">No collaboration requests</h3>
              <p className="text-sm text-gray-500">Generate an invite link and share it with your teammates.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Friends Tab ─────────────────────────────────────────────────── */}
      {tab === "friends" && (
        <div className="space-y-4">
          {/* Pending Received */}
          {friends.filter((f) => f.status === "pending-received").length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Friend Requests Received
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.filter((f) => f.status === "pending-received" && f.name.toLowerCase().includes(search.toLowerCase())).map((friend) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="dash-card p-4 flex items-center justify-between border-amber-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${friend.gradient} flex items-center justify-center font-bold text-white`}>
                        {friend.initial}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-200 text-sm">{friend.name}</p>
                        <p className="text-xs text-gray-500">{friend.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptFriend(friend.id)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Accept">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeFriend(friend.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Decline">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              My Friends ({friends.filter((f) => f.status === "friend").length})
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredFriends.filter((f) => f.status === "friend").map((friend) => (
                  <motion.div
                    key={friend.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="dash-card p-5 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${friend.gradient} flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
                          {friend.initial}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-200">{friend.name}</p>
                          <p className="text-xs text-gray-500">{friend.role}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFriend(friend.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100" title="Remove Friend">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.04] mb-4">
                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                      {friend.collabs} collaborative project{friend.collabs !== 1 ? "s" : ""}
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 text-xs font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> View Profile
                      </button>
                      <button className="flex-1 text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                        <Link2 className="w-3.5 h-3.5" /> Invite to Collab
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Pending Sent */}
              {filteredFriends.filter((f) => f.status === "pending-sent").map((friend) => (
                <motion.div
                  key={friend.id}
                  className="dash-card p-5 opacity-60 relative"
                >
                  <div className="absolute top-3 right-3 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Pending
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${friend.gradient} flex items-center justify-center font-bold text-white text-lg`}>
                      {friend.initial}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-200">{friend.name}</p>
                      <p className="text-xs text-gray-500">Invite sent · Awaiting response</p>
                    </div>
                  </div>
                  <button onClick={() => removeFriend(friend.id)} className="w-full text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                    Cancel Invite
                  </button>
                </motion.div>
              ))}

              {filteredFriends.filter((f) => f.status === "friend" || f.status === "pending-sent").length === 0 && (
                <div className="col-span-full text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
                  <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium mb-1">No friends yet</p>
                  <p className="text-sm text-gray-600 mb-4">Generate an invite link to connect with classmates.</p>
                  <button onClick={() => setShowInviteModal(true)} className="btn-primary inline-flex items-center gap-2 text-sm">
                    <Link2 className="w-4 h-4" /> Generate Invite Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-purple-400" />
                  Generate Invite Link
                </h2>
                <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Invite Type</label>
                  <div className="flex gap-2">
                    {([
                      { key: "friend" as const, label: "Friend", icon: <Users className="w-3.5 h-3.5" /> },
                      { key: "project" as const, label: "Project Collab", icon: <FolderKanban className="w-3.5 h-3.5" /> },
                    ]).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setInviteType(opt.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border transition-all ${
                          inviteType === opt.key
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                            : "bg-white/[0.02] border-white/[0.08] text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={generateLink} className="w-full btn-primary">
                  Generate Link
                </button>

                {inviteLink && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Your Invite Link</label>
                    <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="flex-1 text-sm text-purple-300 font-mono truncate">{inviteLink}</p>
                      <button
                        onClick={copyLink}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                          copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.08] text-gray-300 hover:text-white"
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      Share this link with others to invite them to collaborate.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
