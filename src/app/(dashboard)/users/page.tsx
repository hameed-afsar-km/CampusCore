"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useFirestore } from "@/lib/use-firestore";
import { Plus, Search, Mail, Shield, Trash2, X } from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

export default function UsersPage() {
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
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");

  // Only admins can access this page
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
        await adminCreateUser(email, password, name, role);
      } else {
        throw new Error("Action not available.");
      }
      setShowModal(false);
      setName(""); setEmail(""); setPassword(""); setRole("student");
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manage Users</h1>
          <p className="text-gray-400 mt-1">Add or remove roles across the platform</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
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
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found.</td>
                </tr>
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
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </div>
                    </td>
    <td className="px-6 py-4 text-right">
                      {user.uid !== userData?.uid && (
                        <button 
                          onClick={() => setConfirmDelete(user.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                <Shield className="w-5 h-5 text-purple-500" />
                Add New User
              </h2>

              {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center gap-2 text-red-400 text-sm">
                  {error.includes("auth/") ? "Failed to create user. Ensure the password is at least 6 characters and the email is valid." : error}
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
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] hover:border-purple-500/30 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white"
                  >
                    <option value="student">Student</option>
                    <option value="professor">Faculty / Professor</option>
                    <option value="admin">Administrator</option>
                  </select>
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
                    {isCreating ? "Creating..." : "Create User"}
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
        title="Remove User?"
        message="This will remove the user from the active user list."
      />
    </div>
  );
}
