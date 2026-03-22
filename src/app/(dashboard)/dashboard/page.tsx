"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Bell,
  Trophy,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const { userData } = useAuth();

  const stats = [
    { label: "Classes Today", value: "4", icon: BookOpen, color: "from-purple-500 to-indigo-500" },
    { label: "Pending Tasks", value: "7", icon: CheckSquare, color: "from-amber-400 to-orange-500" },
    { label: "Attendance", value: "82%", icon: Clock, color: "from-emerald-400 to-teal-500" },
    { label: "Current CGPA", value: "8.4", icon: TrendingUp, color: "from-cyan-400 to-blue-500" },
  ];

//   Wait, I need to import Bell
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold"
          >
            Welcome back, <span className="gradient-text">{userData?.displayName?.split(" ")[0] || "User"}</span> 👋
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 mt-1"
          >
            Here&apos;s what&apos;s happening with your academics today.
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-right"
        >
          <div className="text-sm font-medium text-gray-400 mb-1 backdrop-blur-md bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.05] shadow-inner">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="dash-card group relative overflow-hidden"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:scale-150 transition-transform duration-500`} />
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Deadlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="dash-card border-amber-500/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold text-white">Upcoming Deadlines</h3>
              </div>
              <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { title: "Advanced DB Assignment", subject: "DBMS", due: "Tomorrow, 11:59 PM", type: "Assignment", color: "badge-warning" },
                { title: "OS Lab Record Submission", subject: "OS Lab", due: "Friday, 4:00 PM", type: "Lab", color: "badge-info" },
                { title: "Web Dev Mini Project", subject: "Web Dev", due: "Next Monday", type: "Project", color: "badge-primary" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                  <div>
                    <h4 className="font-medium text-[0.95rem] mb-1">{item.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={`badge ${item.color}`}>{item.type}</span>
                      <span>•</span>
                      <span>{item.subject}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-medium text-amber-400 flex items-center gap-1.5 sm:justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      {item.due}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="dash-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-white">Today&apos;s Schedule</h3>
              <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                Full Timetable <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative border-l-2 border-white/[0.06] ml-3 space-y-6">
              {[
                { time: "09:00 AM", subject: "Compiler Design", room: "Block A - 301", prof: "Dr. Smith", active: false },
                { time: "11:00 AM", subject: "Data Structures", room: "Block B - 204", prof: "Prof. Johnson", active: true },
                { time: "01:30 PM", subject: "Database Lab", room: "Lab 3", prof: "Mr. Davis", active: false },
              ].map((cls, i) => (
                <div key={i} className="pl-6 relative">
                  <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-[#030712] ${cls.active ? "bg-cyan-400" : "bg-white/[0.2]"}`} />
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-purple-400 mb-1">{cls.time}</div>
                      <h4 className={`font-medium ${cls.active ? "text-white" : "text-gray-300"}`}>{cls.subject}</h4>
                      <p className="text-sm text-gray-500 mt-1">{cls.prof}</p>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-1.5 bg-white/[0.03] px-3 py-1 rounded-lg w-fit">
                       {cls.room}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {/* Announcements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="dash-card"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Announcements</h3>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>

            <div className="space-y-4">
              {[
                { title: "Mid-term Schedule Released", date: "2 hours ago", urgent: true },
                { title: "Campus Tech Fest Registration Open", date: "Yesterday", urgent: false },
                { title: "Library Due Date Extended", date: "Oct 12", urgent: false },
              ].map((announcement, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${announcement.urgent ? "bg-red-400" : "bg-blue-400"}`} />
                    <div>
                      <h4 className="text-sm font-medium text-gray-200 group-hover:text-purple-400 transition-colors line-clamp-2">
                        {announcement.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{announcement.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-2 rounded-xl border border-white/[0.06] text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors">
              View All Announcements
            </button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="dash-card"
          >
            <h3 className="font-semibold text-white mb-5">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Task", icon: CheckSquare, color: "text-emerald-400", bg: "from-emerald-500/10 to-transparent" },
                { label: "Upload Notes", icon: ClipboardList, color: "text-purple-400", bg: "from-purple-500/10 to-transparent" },
                { label: "Join Event", icon: Trophy, color: "text-cyan-400", bg: "from-cyan-500/10 to-transparent" },
                { label: "Check Marks", icon: BarChart3, color: "text-amber-400", bg: "from-amber-500/10 to-transparent" },
              ].map((action, i) => (
                <button key={i} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br ${action.bg} border border-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all hover:-translate-y-1 shadow-lg`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                  <span className="text-xs text-center font-medium text-gray-300">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
