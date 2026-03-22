'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import Link from "next/link";
import {
  AtSignIcon,
  ChevronLeftIcon,
  Sparkles,
} from 'lucide-react';
import { Input } from './input';
import { BackgroundPaths } from './background-paths';
import { Typewriter } from './typewriter-text';

interface AuthPageProps {
  type: 'login' | 'signup';
  email: string;
  setEmail: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  error?: string;
  loading?: boolean;
  name?: string;
  setName?: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  showPassword?: boolean;
  setShowPassword?: (val: boolean) => void;
}

export function AuthPage({
  type,
  email,
  setEmail,
  onSubmit,
  onGoogleSignIn,
  error,
  loading,
  name,
  setName,
  password,
  setPassword,
  showPassword,
  setShowPassword
}: AuthPageProps) {
  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2 bg-[#02050e]">
      {/* Left Side: Visual Experience */}
      <div className="relative hidden h-full flex-col p-0 lg:flex overflow-hidden bg-[#02050e]">
        <BackgroundPaths title="CampusCore" />
      </div>

      {/* Right Side: Form */}
      <div className="relative flex min-h-screen flex-col justify-center p-6 md:p-10">
        {/* Responsive Background Glows */}
        <div aria-hidden className="absolute inset-0 isolate contain-strict -z-10 opacity-30">
          <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/3 rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-96 w-96 translate-y-1/3 -translate-x-1/3 rounded-full bg-cyan-600/10 blur-[100px]" />
        </div>

        {/* Home Navigation */}
        <Button variant="ghost" className="absolute top-8 left-8 text-gray-400 hover:text-white" asChild>
          <Link href="/">
            <ChevronLeftIcon className='size-4 me-2' />
            Home
          </Link>
        </Button>

        <div className="mx-auto w-full max-w-md p-8 rounded-[2.5rem] glass-card relative overflow-hidden">
          {/* Internal Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -z-10" />

          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <p className="text-2xl font-bold tracking-tight text-white shimmer-text">CampusCore</p>
          </div>

          <div className="flex flex-col space-y-2 text-center sm:text-left mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
              {type === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <div className="h-5">
              <Typewriter 
                text={
                  type === 'login' 
                    ? [
                        "Sign in to your campus dashboard",
                        "Manage your notes with ease",
                        "Track your assignments and tests"
                      ]
                    : [
                        "Begin your academic journey with CampusCore",
                        "One platform. Every need.",
                        "Built for Student Success."
                      ]
                }
                speed={70}
                deleteSpeed={40}
                loop={true}
                className="text-gray-400 text-sm"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center flex items-center justify-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <Button 
              type="button" 
              variant="outline"
              size="lg" 
              disabled={loading}
              onClick={onGoogleSignIn}
              className="w-full bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-white rounded-2xl py-6 h-auto transition-all duration-300"
            >
              <GoogleIcon className='size-5 me-2' />
              Continue with Google
            </Button>
          </div>

          <div className="my-8">
            <AuthSeparator />
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {type === 'signup' && setName && (
               <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <Input
                  placeholder="John Doe"
                  className="bg-white/[0.02] border-white/[0.06] focus:border-purple-500/50 rounded-2xl py-6 h-auto text-white transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Account ID (Email)</label>
              <div className="relative">
                <Input
                  placeholder="123456789012@crescent.education"
                  className="bg-white/[0.02] border-white/[0.06] focus:border-purple-500/50 rounded-2xl py-6 h-auto ps-11 text-white transition-all"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="text-gray-500 absolute inset-y-0 start-0 flex items-center justify-center ps-4">
                  <AtSignIcon className="size-4" />
                </div>
              </div>
            </div>

            {setPassword && (
               <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Security Key</label>
                <Input
                  placeholder="••••••••"
                  className="bg-white/[0.02] border-white/[0.06] focus:border-purple-500/50 rounded-2xl py-6 h-auto text-white transition-all"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value || "")}
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full btn-primary rounded-2xl py-6 h-auto text-base mt-2">
              {loading ? (
                <div className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Sparkles className="size-4 text-cyan-300" />
                  </motion.div>
                  Synchronizing...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  {type === 'login' ? 'Sign In' : 'Create Account'}
                  <Sparkles className="size-4 opacity-50" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-gray-500 text-center text-sm mt-8">
            {type === 'login' ? (
              <>New to CampusCore? <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold underline-offset-4 hover:underline">Join Now</Link></>
            ) : (
              <>Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline-offset-4 hover:underline">Sign in</Link></>
            )}
          </p>

          <p className="text-[10px] text-gray-600 text-center mt-10 leading-relaxed max-w-[280px] mx-auto opacity-50 uppercase tracking-widest">
            Protected by CampusCore Security
          </p>
        </div>
      </div>
    </main>
  );
}



const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <g>
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </g>
  </svg>
);

const AuthSeparator = () => {
  return (
    <div className="flex w-full items-center justify-center opacity-30">
      <div className="bg-white/20 h-px w-full" />
      <span className="text-gray-500 px-4 text-[10px] font-bold tracking-[0.2em]">OR</span>
      <div className="bg-white/20 h-px w-full" />
    </div>
  );
};
