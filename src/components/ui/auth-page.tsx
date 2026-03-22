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
      <div className="bg-[#02050e] relative hidden h-full flex-col border-r border-white/[0.05] p-10 lg:flex overflow-hidden">
        <div className="from-[#02050e] absolute inset-0 z-10 bg-gradient-to-t to-transparent opacity-80" />
        
        <div className="z-20 flex items-center gap-3 pt-4">
          <p className="text-2xl font-bold tracking-tight text-white">
            Campus<span className="gradient-text">Core</span>
          </p>
        </div>

        <div className="z-20 mt-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <blockquote className="space-y-4">
              <p className="text-2xl font-medium leading-relaxed text-white/90">
                &ldquo;Streamlining my academic life has never been this beautiful. Everything I need is just one click away.&rdquo;
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-px w-8 bg-purple-500" />
                <span className="font-mono text-sm font-semibold tracking-wider text-purple-400 uppercase">
                  ~ Crescent Institute Student
                </span>
              </footer>
            </blockquote>
          </motion.div>
        </div>

        {/* Animated Background Paths */}
        <div className="absolute inset-0 z-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
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

        <div className="mx-auto w-full max-w-sm space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden mb-12">
            <p className="text-2xl font-bold tracking-tight text-white">CampusCore</p>
          </div>

          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {type === 'login' ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-gray-400 text-sm">
              {type === 'login' 
                ? 'Sign in to access your student dashboard' 
                : 'Join the next generation of academic management'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center"
            >
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
              className="w-full bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] text-white rounded-2xl py-6"
            >
              <GoogleIcon className='size-5 me-2' />
              Continue with Google
            </Button>
          </div>

          <AuthSeparator />

          <form onSubmit={onSubmit} className="space-y-4">
            {type === 'signup' && setName && (
               <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                <Input
                  placeholder="John Doe"
                  className="bg-white/[0.03] border-white/[0.08] focus:border-purple-500/50 rounded-2xl py-6 h-auto text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">Institutional Email</label>
              <div className="relative">
                <Input
                  placeholder="123456789012@crescent.education"
                  className="bg-white/[0.03] border-white/[0.08] focus:border-purple-500/50 rounded-2xl py-6 h-auto ps-11 text-white"
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
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                <Input
                  placeholder="min. 6 characters"
                  className="bg-white/[0.03] border-white/[0.08] focus:border-purple-500/50 rounded-2xl py-6 h-auto text-white"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value || "")}
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full btn-primary rounded-2xl py-6 h-auto text-base">
              {loading ? (
                <div className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Sparkles className="size-4" />
                  </motion.div>
                  Processing...
                </div>
              ) : (
                <span>{type === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </Button>
          </form>

          <p className="text-gray-500 text-center text-sm">
            {type === 'login' ? (
              <>New to CampusCore? <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold underline-offset-4 hover:underline">Sign up for free</Link></>
            ) : (
              <>Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline-offset-4 hover:underline">Sign in</Link></>
            )}
          </p>

          <p className="text-gray-600 text-center text-xs leading-relaxed max-w-[280px] mx-auto">
            By clicking continue, you agree to our{' '}
            <a href="#" className="hover:text-gray-400 underline underline-offset-4">Terms</a>{' '}
            and{' '}
            <a href="#" className="hover:text-gray-400 underline underline-offset-4">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </main>
  );
}

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(99, 102, 241, ${0.05 + i * 0.01})`, // Using purple-ish colors
    width: 0.5 + i * 0.02,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-white/10"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.05 + path.id * 0.01}
            initial={{ pathLength: 0.3, opacity: 0.1 }}
            animate={{
              pathLength: 1,
              opacity: [0.1, 0.3, 0.1],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 25 + Math.random() * 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
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
