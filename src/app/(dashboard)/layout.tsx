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
  Menu,
  X,
  Settings,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Assignments", href: "/assignments", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "To-Do List", href: "/todo", icon: <CheckSquare className="w-5 h-5" />, roles: ["student"] },
  { label: "Notes", href: "/notes", icon: <FileText className="w-5 h-5" /> },
  { label: "Exams & Tests", href: "/exams", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Marks Tracker", href: "/marks", icon: <BarChart3 className="w-5 h-5" />, roles: ["student"] },
  { label: "Calendar", href: "/calendar", icon: <Calendar className="w-5 h-5" /> },
  { label: "Announcements", href: "/announcements", icon: <Bell className="w-5 h-5" /> },
  { label: "Events", href: "/events", icon: <Trophy className="w-5 h-5" /> },
  { label: "Leave System", href: "/leaves", icon: <Send className="w-5 h-5" /> },
  { label: "Projects", href: "/projects", icon: <FolderKanban className="w-5 h-5" /> },
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

  const filteredNavItems = navItems.filter((item) =>
    !item.roles || (userData && item.roles.includes(userData.role))
  );

  return (
    <ProtectedRoute>
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

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${
                  pathname === item.href ? "active" : ""
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
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
              <button className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
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
          {/* Mobile Header */}
          <header className="lg:hidden h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#030712]/95 backdrop-blur-xl sticky top-0 z-30">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold">CampusCore</span>
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden p-6 md:p-8">
            <div className="max-w-6xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
