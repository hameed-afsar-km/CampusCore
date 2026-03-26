"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, or, arrayUnion } from "firebase/firestore";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
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
  Loader2,
  Clock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CollabRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  type: "document" | "project" | "study-group";
  itemId: string;
  itemName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: any;
}

interface Friendship {
  id: string;
  participants: string[]; // [uid1, uid2]
  status: "pending" | "accepted";
  senderId: string;
  updatedAt: any;
}

interface Profile {
  uid: string;
  displayName: string;
  role: string;
  email: string;
  photoURL?: string;
}

type TabType = "collaborations" | "friends";

export default function CollaborationPage() {
  const { user, userData } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabType>("collaborations");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<"project" | "friend">("friend");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Firestore Data
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [collabInvites, setCollabInvites] = useState<CollabRequest[]>([]);
  const [users, setUsers] = useState<Profile[]>([]); // Results for friend search
  const [friendsProfiles, setFriendsProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: "friend" | "collab" } | null>(null);

  // 1. Listen for friendships (real-time)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendships"),
      where("participants", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friendship));
      setFriendships(items);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // 2. Listen for collaborations (real-time)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "collab_invites"),
      or(where("senderId", "==", user.uid), where("receiverId", "==", user.uid))
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollabRequest));
      setCollabInvites(items);
    });
    return () => unsub();
  }, [user]);

  // 3. Fetch specific profile data for friends
  useEffect(() => {
    const fetchFriendsProfiles = async () => {
      const friendUids = friendships.flatMap(f => f.participants).filter(uid => uid !== user?.uid);
      if (friendUids.length === 0) return;

      const q = query(collection(db, "users"), where("uid", "in", friendUids.slice(0, 10))); // query limit
      const snapshot = await getDocs(q);
      const profiles: Record<string, Profile> = {};
      snapshot.forEach(doc => {
        profiles[doc.id] = doc.data() as Profile;
      });
      setFriendsProfiles(profiles);
    };
    fetchFriendsProfiles();
  }, [friendships, user?.uid]);

  // User Search Logic
  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 3) {
        setUsers([]);
        return;
      }
      try {
        const q = query(collection(db, "users"), where("displayName", ">=", search), where("displayName", "<=", search + "\uf8ff"));
        const snapshot = await getDocs(q);
        const results = snapshot.docs
          .map(doc => doc.data() as Profile)
          .filter(u => u.uid !== user?.uid);
        setUsers(results);
      } catch (err) {
        console.error("Search error:", err);
      }
    };
    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [search, user?.uid]);

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;
    // Check if already exists
    const existing = friendships.find(f => f.participants.includes(receiverId));
    if (existing) return;

    await addDoc(collection(db, "friendships"), {
      participants: [user.uid, receiverId],
      status: "pending",
      senderId: user.uid,
      updatedAt: serverTimestamp(),
    });
  };

  const acceptFriend = async (id: string) => {
    await updateDoc(doc(db, "friendships", id), {
      status: "accepted",
      updatedAt: serverTimestamp(),
    });
  };

  const handleAction = async (id: string, newStatus: "accepted" | "declined") => {
    const invite = collabInvites.find(i => i.id === id);
    if (!invite) return;

    await updateDoc(doc(db, "collab_invites", id), {
      status: newStatus,
    });

    if (newStatus === "accepted") {
      const col = invite.type === "document" ? "notes" : invite.type === "project" ? "assignments" : "exams";
      await updateDoc(doc(db, col, invite.itemId), {
        collaborators: arrayUnion(invite.receiverId)
      });
    }
  };

  const removeHandle = async () => {
    if (!confirmDelete) return;
    const col = confirmDelete.type === "friend" ? "friendships" : "collab_invites";
    await deleteDoc(doc(db, col, confirmDelete.id));
    setConfirmDelete(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document": return <FileText className="w-4 h-4 text-purple-400" />;
      case "project": return <FolderKanban className="w-4 h-4 text-cyan-400" />;
      case "study-group": return <BookOpen className="w-4 h-4 text-emerald-400" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFriendStatus = (receiverUid: string) => {
    const friendship = friendships.find(f => f.participants.includes(receiverUid));
    if (!friendship) return null;
    if (friendship.status === "accepted") return "friend";
    return friendship.senderId === user?.uid ? "pending-sent" : "pending-received";
  };

  // Invite to Collab Modal States
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [collabResource, setCollabResource] = useState<"document" | "project" | "study-group">("document");
  const [collabItemId, setCollabItemId] = useState("");
  const [collabItems, setCollabItems] = useState<{ id: string, title: string }[]>([]);

  // Fetch items based on resource type
  useEffect(() => {
    if (!showCollabModal || !user) return;
    const fetchItems = async () => {
      const col = collabResource === "document" ? "notes" : collabResource === "project" ? "assignments" : "exams";
      const q = query(collection(db, col), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      setCollabItems(snap.docs.map(doc => ({ id: doc.id, title: (doc.data() as any).title || (doc.data() as any).subject || "Untitled" })));
    };
    fetchItems();
  }, [collabResource, showCollabModal, user]);

  const sendCollabInvite = async () => {
    if (!user || !selectedFriend || !collabItemId) return;
    const item = collabItems.find(i => i.id === collabItemId);
    await addDoc(collection(db, "collab_invites"), {
      senderId: user.uid,
      senderName: userData?.displayName || user.email,
      senderRole: userData?.role || "student",
      receiverId: selectedFriend.uid,
      type: collabResource,
      itemId: collabItemId,
      itemName: item?.title || "Untitled",
      status: "pending",
      createdAt: serverTimestamp(),
    });
    setShowCollabModal(false);
    setCollabItemId("");
  };

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

  const acceptedFriends = friendships
    .filter(f => f.status === "accepted")
    .map(f => f.participants.find(p => p !== user?.uid))
    .map(uid => friendsProfiles[uid!] )
    .filter(Boolean);

  const pendingReceived = friendships
    .filter(f => f.status === "pending" && f.senderId !== user?.uid)
    .map(f => ({ id: f.id, profile: friendsProfiles[f.participants.find(p => p !== user?.uid)!] }))
    .filter(p => !!p.profile);

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

      {/* Search & Results */}
      <div className="space-y-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search students/professors to connect..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
          />
        </div>

        <AnimatePresence>
          {search.length >= 3 && users.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {users.map((u) => {
                const status = getFriendStatus(u.uid);
                return (
                  <div key={u.uid} className="dash-card p-4 flex items-center justify-between border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white uppercase">
                        {u.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-200 text-sm truncate max-w-[120px]">{u.displayName}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{u.role}</p>
                      </div>
                    </div>
                    {status === "friend" ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">Friend</span>
                    ) : status === "pending-sent" ? (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md border border-amber-500/20">Sent</span>
                    ) : status === "pending-received" ? (
                      <button onClick={() => acceptFriend(friendships.find(f => f.participants.includes(u.uid))?.id!)} className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded-md">Accept</button>
                    ) : (
                      <button onClick={() => sendFriendRequest(u.uid)} className="p-2 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors">
                        <UserPlus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Collaborations Tab ─────────────────────────────────────────── */}
      {tab === "collaborations" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {collabInvites.map((req, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={req.id}
                className="dash-card group relative p-5 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                      {req.senderName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-200">{req.senderName}</h3>
                      <p className="text-xs text-gray-500 capitalize">{req.senderRole}</p>
                    </div>
                  </div>
                  <button onClick={() => setConfirmDelete({ id: req.id, type: "collab" })} className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-white/[0.03] p-3 rounded-xl border border-white/[0.04] mb-5">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-white/[0.05]">
                    {getTypeIcon(req.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">
                      {req.senderId === user?.uid ? "You invited them to" : "Invited you to collaborate on"}
                    </p>
                    <p className="text-sm font-medium text-gray-300 truncate" title={req.itemName}>
                      {req.itemName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {req.createdAt ? new Date(req.createdAt.toDate()).toLocaleDateString() : "Just now"}
                  </span>
                  <div className="flex gap-2">
                    {req.status === "pending" && req.receiverId === user?.uid ? (
                      <>
                        <button onClick={() => handleAction(req.id, "accepted")} className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Accept</button>
                        <button onClick={() => handleAction(req.id, "declined")} className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/[0.05] hover:bg-red-500/10 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 rounded-lg transition-colors flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Decline</button>
                      </>
                    ) : (
                      <span className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border flex items-center gap-1.5 ${
                        req.status === "accepted" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : 
                        req.status === "pending" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
                      }`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && collabInvites.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
              <Globe className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-1">No collaboration requests</h3>
              <p className="text-sm text-gray-500">Add friends and invite them to your notes or assignments.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Friends Tab ─────────────────────────────────────────────────── */}
      {tab === "friends" && (
        <div className="space-y-4">
          {pendingReceived.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2"><UserPlus className="w-4 h-4" /> Friend Requests Received</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingReceived.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="dash-card p-4 flex items-center justify-between border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white uppercase">{item.profile.displayName.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-gray-200 text-sm">{item.profile.displayName}</p>
                        <p className="text-xs text-gray-500 uppercase">{item.profile.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptFriend(item.id)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete({ id: item.id, type: "friend" })} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><XCircle className="w-4 h-4" /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2"><UserCheck className="w-4 h-4" /> My Friends ({acceptedFriends.length})</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {acceptedFriends.map((friend) => (
                  <motion.div key={friend.uid} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="dash-card p-5 hover:border-purple-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-lg uppercase">{friend.displayName.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-gray-200">{friend.displayName}</p>
                          <p className="text-xs text-gray-500 uppercase">{friend.role}</p>
                        </div>
                      </div>
                      <button onClick={() => setConfirmDelete({ id: friendships.find(f => f.participants.includes(friend.uid))?.id!, type: "friend" })} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 text-xs font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> View Profile</button>
                      <button onClick={() => { setSelectedFriend(friend); setShowCollabModal(true); }} className="flex-1 text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"><Link2 className="w-3.5 h-3.5" /> Invite to Collab</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {!loading && acceptedFriends.length === 0 && (
                <div className="col-span-full text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl border-dashed">
                  <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium mb-1">No friends yet</p>
                  <p className="text-sm text-gray-600 mb-4">Search for classmates above or generate an invite link.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Link2 className="w-5 h-5 text-purple-400" />Generate Invite Link</h2>
                <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <button onClick={generateLink} className="w-full btn-primary">Generate Link</button>
                {inviteLink && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Your Invite Link</label>
                    <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <p className="flex-1 text-sm text-purple-300 font-mono truncate">{inviteLink}</p>
                      <button onClick={copyLink} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.08] text-gray-300 hover:text-white"}`}><Copy className="w-3.5 h-3.5" />{copied ? "Copied!" : "Copy"}</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaboration Invite Modal */}
      <AnimatePresence>
        {showCollabModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowCollabModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#030712] border border-white/[0.1] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-purple-400" />Invite to Collab</h2>
                <button onClick={() => setShowCollabModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Resource Type</label>
                  <select value={collabResource} onChange={(e) => setCollabResource(e.target.value as any)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none">
                    <option value="document">Notes</option>
                    <option value="project">Assignments</option>
                    <option value="study-group">Exams (Study Group)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Select Item</label>
                  <select value={collabItemId} onChange={(e) => setCollabItemId(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-2.5 px-4 text-sm text-gray-200 outline-none">
                    <option value="">Select an item...</option>
                    {collabItems.map(item => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </div>
                <button onClick={sendCollabInvite} disabled={!collabItemId} className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Send Invite</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={removeHandle}
        title={confirmDelete?.type === "friend" ? "Remove Friend?" : "Remove Invite?"}
        message="This action cannot be undone."
      />
    </div>
  );
}

// Helper types for Lucide icons missing in imports above
import { Trash2 } from "lucide-react";
