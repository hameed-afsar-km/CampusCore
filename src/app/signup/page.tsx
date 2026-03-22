"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpEmail, signInGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Role defaults to "student". Admin/Teachers are predefined in Firebase.
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signUpEmail(email, password, name, "student");
      router.push("/dashboard");
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account already exists with this email");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      await signInGoogle("student");
      router.push("/dashboard");
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#02050e]">
      {/* Immersive Modern Animated Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/30 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg px-6"
      >
        <div className="backdrop-blur-3xl bg-white/[0.03] border border-white/[0.08] p-8 md:p-12 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden">
          
          {/* Subtle Top Shine */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Header */}
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 mb-6 shadow-xl relative"
            >
              <GraduationCap className="w-7 h-7 text-white" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-cyan-300" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Join CampusCore</h1>
            <p className="text-gray-400">Step into the future of campus management</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailSignUp} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center bg-white/[0.04] border border-white/[0.05] rounded-2xl overflow-hidden transition-all group-focus-within:border-white/[0.2] group-focus-within:bg-white/[0.06]">
                  <div className="pl-4 pr-3 text-gray-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-transparent py-3.5 pr-4 text-white placeholder:text-gray-600 outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Student Email</label>
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center bg-white/[0.04] border border-white/[0.05] rounded-2xl overflow-hidden transition-all group-focus-within:border-white/[0.2] group-focus-within:bg-white/[0.06]">
                  <div className="pl-4 pr-3 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="123456789012@crescent.education"
                    className="w-full bg-transparent py-3.5 pr-4 text-white placeholder:text-gray-600 outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center bg-white/[0.04] border border-white/[0.05] rounded-2xl overflow-hidden transition-all group-focus-within:border-white/[0.2] group-focus-within:bg-white/[0.06]">
                  <div className="pl-4 pr-3 text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-transparent py-3.5 pr-4 text-white placeholder:text-gray-600 outline-none text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-4 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group mt-4 overflow-hidden rounded-2xl p-[1px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity blur-[2px]" />
              <div className="relative bg-[#02050e] flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl transition-all group-hover:bg-transparent text-white font-medium shadow-xl">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Create Account <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                )}
              </div>
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/[0.1]" />
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/[0.1]" />
          </div>

          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-lg transition-all text-sm font-medium text-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
