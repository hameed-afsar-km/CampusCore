"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { Plus, Search, Mail, Shield, Trash2, X, Edit2, Users } from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEPARTMENTS, SECTIONS } from "../timetable/page";

export default function UsersPage() {
  const { userData, adminCreateUser } = useAuth();
  const { data: users, loading, remove } = useFirestore<any>("users", false);
  const { data: classes } = useFirestore<any>("classes", false);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [section, setSection] = useState(SECTIONS[0]);
  const [staffId, setStaffId] = useState("");
  const [classId, setClassId] = useState("");
  const [classAdvisorId, setClassAdvisorId] = useState("");
  const [subjectsTaught, setSubjectsTaught] = useState("");
  const [error, setError] = useState("");

  // Edit form
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editClassId, setEditClassId] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editClassAdvisorId, setEditClassAdvisorId] = useState("");
  const [editSubjectsTaught, setEditSubjectsTaught] = useState("");

  const activeClasses = useMemo(() => classes.filter((c: any) => c.isActive !== false), [classes]);

  if (userData?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-400 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const filteredUsers = users.filter((u: any) =>
    (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    try {
      if (adminCreateUser) {
        const newUid = await adminCreateUser(email, password, name, role, department, section, staffId);
        
        const extraPayload: any = {};
        if (role === "student" && classId) {
          extraPayload.classId = classId;
        }
        if (role === "professor") {
          if (classAdvisorId) extraPayload.classAdvisorId = classAdvisorId;
          const subs = subjectsTaught.split(',').map(s=>s.trim()).filter(Boolean);
          if (subs.length > 0) extraPayload.subjectsTaught = subs;
        }
        
        if (Object.keys(extraPayload).length > 0) {
          await updateDoc(doc(db, "users", newUid), extraPayload);
        }
      }
      setShowModal(false);
      setName(""); setEmail(""); setPassword(""); setRole("student");
      setDepartment(DEPARTMENTS[0]); setSection(SECTIONS[0]); setStaffId(""); setClassId("");
      setClassAdvisorId(""); setSubjectsTaught("");
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const selectedClass = classes.find((c: any) => c.id === editClassId);
      const updatePayload: any = { department: editDept, section: editSection };
      if (editingUser.role === "student") {
        updatePayload.classId = editClassId || null;
        if (selectedClass) {
          updatePayload.department = selectedClass.department;
          updatePayload.section = selectedClass.section;
          updatePayload.year = selectedClass.year;
          updatePayload.semester = selectedClass.semester;
        }
      } else if (editingUser.role === "professor") {
        updatePayload.classAdvisorId = editClassAdvisorId || null;
        updatePayload.subjectsTaught = editSubjectsTaught.split(',').map(s=>s.trim()).filter(Boolean);
      }
      await updateDoc(doc(db, "users", editingUser.uid), updatePayload);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getClassName = (cid: string) => {
    const cls = classes.find((c: any) => c.id === cid);
    return cls ? `${cls.department}-${cls.section} Sem${cls.semester}` : "Unknown Class";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manage Users</h1>
          <p className="text-gray-400 mt-1">Create users and allocate them to classes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Add User
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      <div className="dash-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-sm text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Class / Dept</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found.</td></tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          user.role === 'admin' ? "bg-red-500/20 text-red-400" :
                          user.role === 'professor' ? "bg-purple-500/20 text-purple-400" :
                          "bg-cyan-500/20 text-cyan-400"
                        }`}>
                          {(user.displayName || "U")[0]}
                        </div>
                        <span className="font-medium text-gray-200">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        user.role === 'admin' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        user.role === 'professor' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                        "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.classId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs bg-white/[0.05] border border-white/[0.1] px-2 py-1 rounded text-gray-300 font-mono">
                            {getClassName(user.classId)}
                          </span>
                        </div>
                      ) : user.department ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] bg-white/[0.05] border border-white/[0.1] px-1.5 py-0.5 rounded text-gray-400">{user.department}</span>
                            {user.section && <span className="text-[10px] bg-white/[0.05] border border-white/[0.1] px-1.5 py-0.5 rounded text-gray-400">{user.section}</span>}
                            {user.staffId && <span className="text-[10px] bg-white/[0.05] border border-white/[0.1] px-1.5 py-0.5 rounded text-gray-400">ID: {user.staffId}</span>}
                          </div>
                          {user.classAdvisorId && (
                            <span className="text-[10px] text-cyan-400">Class Advisor: {getClassName(user.classAdvisorId)}</span>
                          )}
                          {user.subjectsTaught && user.subjectsTaught.length > 0 && (
                            <span className="text-[10px] text-purple-400">Subjects: {user.subjectsTaught.join(", ")}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.uid !== userData?.uid && (
                        <div className="flex justify-end gap-1">
                          {user.role !== "admin" && (
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setEditClassId(user.classId || "");
                                setEditDept(user.department || DEPARTMENTS[0]);
                                setEditSection(user.section || SECTIONS[0]);
                                setEditClassAdvisorId(user.classAdvisorId || "");
                                setEditSubjectsTaught(user.subjectsTaught ? user.subjectsTaught.join(", ") : "");
                              }}
                              className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                              title="Edit Allocation"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" /> Add New User
              </h2>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error.includes("auth/") ? "Failed to create user. Check password (min 6 chars) and valid email." : error}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                  <input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full bg-[#0a0a0a] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white">
                    <option value="student">Student</option>
                    <option value="professor">Faculty / Professor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {role === "student" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign to Class <span className="text-gray-500">(optional — can be done later)</span></label>
                    <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white">
                      <option value="">Unassigned</option>
                      {activeClasses.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.department} — Sec {c.section} | Sem {c.semester} | {c.academicYear}</option>
                      ))}
                    </select>
                  </div>
                )}

                {role === "professor" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white">
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Staff ID</label>
                        <input type="text" placeholder="e.g. FAC-1049" value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all uppercase" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Class Advisor (Optional)</label>
                      <select value={classAdvisorId} onChange={e => setClassAdvisorId(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white">
                        <option value="">Not Advising</option>
                        {activeClasses.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.department} — Sec {c.section} | Sem {c.semester}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Subjects Taught (Optional)</label>
                      <input type="text" placeholder="e.g. Maths, Physics, DSA" value={subjectsTaught} onChange={e => setSubjectsTaught(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.06] mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.03] rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isCreating} className="btn-primary">{isCreating ? "Creating..." : "Create User"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / Allocate Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={() => setEditingUser(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
              <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-500" /> Allocate User
              </h2>
              <p className="text-sm text-gray-400 mb-6">Editing: <span className="text-white font-medium">{editingUser.displayName}</span> ({editingUser.role})</p>

              <form onSubmit={handleEditUser} className="space-y-4">
                {editingUser.role === "student" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign to Class</label>
                    <select value={editClassId} onChange={e => setEditClassId(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white">
                      <option value="">Unassigned</option>
                      {activeClasses.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.department} — Sec {c.section} | Sem {c.semester} | {c.academicYear}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1.5">Selecting a class auto-fills Department, Section, Year, and Semester from the class definition.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
                        <select value={editDept} onChange={e => setEditDept(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white">
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Section</label>
                        <select value={editSection} onChange={e => setEditSection(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white">
                          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Class Advisor (Optional)</label>
                      <select value={editClassAdvisorId} onChange={e => setEditClassAdvisorId(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white">
                        <option value="">Not Advising</option>
                        {activeClasses.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.department} — Sec {c.section} | Sem {c.semester}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Subjects Taught (Optional)</label>
                      <input type="text" placeholder="e.g. Maths, Physics, DSA" value={editSubjectsTaught} onChange={e => setEditSubjectsTaught(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.06] mt-6">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.03] rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="btn-primary">Save Allocation</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete User?"
        message="This will permanently remove this user account from the system."
      />
    </div>
  );
}
