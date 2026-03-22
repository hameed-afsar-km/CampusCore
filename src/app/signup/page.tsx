"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthPage } from "@/components/ui/auth-page";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpEmail, signInGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <AuthPage
      type="signup"
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onSubmit={handleEmailSignUp}
      onGoogleSignIn={handleGoogleSignUp}
      error={error}
      loading={loading}
    />
  );
}
