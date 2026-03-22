"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthPage } from "@/components/ui/auth-page";

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
    />
  );
}
