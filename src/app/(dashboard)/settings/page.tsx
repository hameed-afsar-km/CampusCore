"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Key, Mail, User, Shield, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { updatePassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user, userData } = useAuth();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isGoogleProvider = user?.providerData.some(p => p.providerId === 'google.com');

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match." });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await updatePassword(user, newPassword);
      setMessage({ type: 'success', text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: "For security, please log out and log back in to change your password." });
      } else {
        setMessage({ type: 'error', text: error.message || "Failed to update password." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage({ type: 'success', text: "Password reset email sent!" });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Failed to send reset email." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-400 mt-1">Manage your security and account details</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information (Read Only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-[#030712] border border-white/[0.06] shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 border-b border-white/[0.06] pb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Profile Details</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Full Name</label>
              <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06] opacity-70 cursor-not-allowed">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{userData?.displayName || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Email Address</label>
              <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06] opacity-70 cursor-not-allowed">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{user?.email || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Account Role</label>
              <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06] opacity-70 cursor-not-allowed w-max">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 capitalize font-medium">{userData?.role || "Student"}</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 italic flex items-center gap-2">
               <AlertCircle className="w-4 h-4" />
               Profile details are locked by the institution and cannot be changed manually.
            </p>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-[#030712] border border-white/[0.06] shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 border-b border-white/[0.06] pb-4">
            <Key className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Security & Password</h2>
          </div>

          {message && (
            <div className={`p-4 mb-6 rounded-xl border flex items-center gap-3 ${
              message.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
              {isGoogleProvider ? (
                 <div>
                   <h3 className="text-sm font-semibold text-white mb-2">Connected with Google</h3>
                   <p className="text-gray-400 text-sm mb-4">
                     You signed in securely using Google. You can link a password below to also enable email login.
                   </p>
                 </div>
              ) : (
                <p className="text-gray-400 text-sm mb-4">
                  Update the password associated with your account. We recommend a strong, unique password.
                </p>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    {isGoogleProvider ? "Set New Password" : "New Password"}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-sm text-cyan-400 hover:text-cyan-300 font-medium disabled:opacity-50"
                  >
                    Send Password Reset Link
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading || !newPassword || !confirmPassword} 
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
