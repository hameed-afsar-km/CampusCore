"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthPage } from "@/components/ui/auth-page";
import { restoreAdminRecord } from "@/lib/restore-admin";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { signInEmail, signInGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else {
        setError("Failed to login. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleAdminRecovery = async () => {
     if (email !== 'admin@campus.edu') {
       setError("Recovery is only available for the root master account (admin@campus.edu)");
       return;
     }

     setLoading(true);
     try {
        // Try creating the auth user first in case they were fully deleted
        const cred = await createUserWithEmailAndPassword(auth, email, "Password123!");
        await restoreAdminRecord(cred.user.uid, email, "Master Admin");
        setError("Recovery Success! You can now login with Password123!");
     } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
           // User exists in Auth, but record is missing in Firestore? Restore it.
           // Note: This requires the console UID if known, but for a new record, 
           // we'd need to re-link. 
           setError("Auth account exists but record was deleted. Re-syncing...");
           // If they are logged in or we have UID, we can restore.
           // For now, let's assume they use a new email or we handle the existing one.
           setError("Account exists in system. Use regular login or Reset Password in Community if you have another admin.");
        } else {
           setError("Recovery failed: " + err.message);
        }
     }
     setLoading(false);
  };

  const handleGoogleLogin = async () => {
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
    <AuthPage
      type="login"
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onSubmit={handleEmailLogin}
      onGoogleSignIn={handleGoogleLogin}
      error={error}
      loading={loading}
    >
       <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={handleAdminRecovery}
            className="text-[10px] text-gray-700 hover:text-cyan-500 uppercase tracking-widest font-black transition-colors"
          >
             Institutional Emergency Recovery
          </button>
       </div>
    </AuthPage>
  );
}
