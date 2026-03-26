"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  FileText,
  Calendar,
  BarChart3,
  Bell,
  Trophy,
  Users,
  BookOpen,
  Send,
  FolderKanban,
  LogOut,
  Menu as MenuIcon,
  X,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";
import { MenuItem, MenuContainer } from "@/components/ui/fluid-menu";
import { CalendarProvider } from "@/lib/calendar-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Assignments", href: "/assignments", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "To-Do List", href: "/todo", icon: <CheckSquare className="w-5 h-5" /> },
  { label: "Notes", href: "/notes", icon: <FileText className="w-5 h-5" /> },
  { label: "Exams & Tests", href: "/exams", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Marks Tracker", href: "/marks", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Calendar", href: "/calendar", icon: <Calendar className="w-5 h-5" /> },
  { label: "Announcements", href: "/announcements", icon: <Bell className="w-5 h-5" /> },
  { label: "Events", href: "/events", icon: <Trophy className="w-5 h-5" /> },
  { label: "Attendance", href: "/attendance", icon: <CheckCircle2 className="w-5 h-5" /> },
  { label: "Collaboration", href: "/collaboration", icon: <Users className="w-5 h-5" /> },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { userData, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // We stripped out roles check because this app is purely tailored for Students now.

  return (
    <ProtectedRoute>
      <CalendarProvider>
      <div className="min-h-screen bg-[#030712] flex">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          className={`fixed lg:sticky top-0 left-0 h-screen w-72 border-r border-white/[0.06] bg-[#030712]/95 backdrop-blur-2xl z-50 flex flex-col transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight">
                Campus<span className="gradient-text">Core</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation - Disabled for Desktop Bottom Dock */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
             {/* Left blank; we use Dock and Fluid Menu now */}
             <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
               Use the dock at the bottom of the screen to navigate.
             </div>
          </div>

          {/* User Profile & Actions */}
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.03]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                  {userData?.displayName?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">
                  {userData?.displayName}
                </p>
                <p className="text-xs text-gray-400 truncate capitalize">
                  {userData?.role}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/settings" className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Mobile Header (Fallback Logo) */}
          <header className="lg:hidden h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#030712]/95 backdrop-blur-xl sticky top-0 z-30">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl">CampusCore</span>
            </Link>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden p-6 md:p-8 lg:pb-32">
            <div className="max-w-6xl mx-auto w-full">{children}</div>
          </main>
        </div>

        {/* Desktop Dock Navbar */}
        <div className="hidden lg:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Dock className="items-end pb-3 bg-[#030712]/80 backdrop-blur-xl border border-white/[0.06] shadow-2xl">
            {navItems.map((item, idx) => (
              <Link href={item.href} key={idx}>
                <DockItem className="aspect-square rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] text-white">
                  <DockLabel>{item.label}</DockLabel>
                  <DockIcon>{item.icon}</DockIcon>
                </DockItem>
              </Link>
            ))}
          </Dock>
        </div>

        {/* Mobile Fluid Menu */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50 flex flex-col items-center">
          <MenuContainer>
            <MenuItem 
              icon={
                <div className="relative w-6 h-6 text-white">
                  <div className="absolute inset-0 transition-all duration-300 ease-in-out origin-center opacity-100 scale-100 rotate-0 [div[data-expanded=true]_&]:opacity-0 [div[data-expanded=true]_&]:scale-0 [div[data-expanded=true]_&]:rotate-180 flex items-center justify-center">
                    <MenuIcon size={24} strokeWidth={1.5} />
                  </div>
                  <div className="absolute inset-0 transition-all duration-300 ease-in-out origin-center opacity-0 scale-0 -rotate-180 [div[data-expanded=true]_&]:opacity-100 [div[data-expanded=true]_&]:scale-100 [div[data-expanded=true]_&]:rotate-0 flex items-center justify-center">
                    <X size={24} strokeWidth={1.5} />
                  </div>
                </div>
              } 
            />
            {navItems.map((item, idx) => (
              <Link key={idx} href={item.href}>
                <MenuItem icon={<div className="text-white hover:text-purple-400">{item.icon}</div>} />
              </Link>
            ))}
          </MenuContainer>
        </div>
      </div>
      </CalendarProvider>
    </ProtectedRoute>
  );
}
