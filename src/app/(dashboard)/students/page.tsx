"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { Plus, Search, Mail, Shield, Trash2, X, GraduationCap } from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StudentsPage() {
  const { userData, adminCreateUser } = useAuth();
  const { data: users, loading, remove } = useFirestore<any>("users", false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // New User Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState<UserRole>("student"); // Fixed role
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [error, setError] = useState("");

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editDept, setEditDept] = useState("");
  const [editSection, setEditSection] = useState("");

  // Only professors (and admins implicitly) can access this page
  if (userData?.role !== "professor" && userData?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-400 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const filteredUsers = users.filter((u: any) =>
    u.role === "student" && (
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) || 
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    
    try {
      if (adminCreateUser) {
        await adminCreateUser(email, password, name, role, department, section);
      } else {
        throw new Error("Action not available.");
      }
      setShowModal(false);
      setName(""); setEmail(""); setPassword(""); setDepartment(""); setSection("");
    } catch (err: any) {
      setError(err.message || "Failed to create student.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, "users", editingUser.uid), {
        department: editDept,
        section: editSection
      });
      setEditingUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manage Students</h1>
          <p className="text-gray-400 mt-1">Enroll new students to your courses</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Enroll Student
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search students..."
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
                <th className="px-6 py-4 font-medium">Dept/Section</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading students...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No students found.</td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-cyan-500/20 text-cyan-400">
                          {(user.displayName || "S")[0]}
                        </div>
                        <span className="font-medium text-gray-200">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-white/[0.05] border border-white/[0.1] px-2 py-1 rounded text-gray-300">
                          {user.department || "No Dept"}
                        </span>
                        <span className="text-xs bg-white/[0.05] border border-white/[0.1] px-2 py-1 rounded text-gray-300">
                          {user.section || "No Section"}
                        </span>
                      </div>
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
                          <button 
                            onClick={() => {
                              setEditingUser(user);
                              setEditDept(user.department || "");
                              setEditSection(user.section || "");
                            }}
                            className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          >
                            <Shield className="w-4 h-4" /> {/* Or Edit2 */}
                          </button>
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

      {/* Modal */}
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
                <GraduationCap className="w-5 h-5 text-purple-500" />
                Enroll New Student
              </h2>

              {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center gap-2 text-red-400 text-sm">
                  {error.includes("auth/") ? "Failed to create account. Check connection and ensure email is valid." : error}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Temporary Default Password</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all uppercase"
                    />
                  </div>
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
                    disabled={isCreating}
                    className="btn-primary"
                  >
                    {isCreating ? "Enrolling..." : "Enroll Student"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setEditingUser(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
            >
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-500" />
                Allocate Section
              </h2>

              <p className="text-sm text-gray-400 mb-6">
                Assigning department and section for: <span className="text-white font-medium">{editingUser.displayName}</span>
              </p>

              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={editSection}
                      onChange={(e) => setEditSection(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.06] mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.03] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    Save Allocation
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
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Remove Student?"
        message="This will remove the student from the platform."
      />
    </div>
  );
}
