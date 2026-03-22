"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
} from "lucide-react";

type EventType = "exam" | "assignment" | "event" | "holiday";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  time?: string;
  location?: string;
}

const mockEvents: CalendarEvent[] = [
  { id: "1", title: "DBMS Mid Term", date: "2026-03-25", type: "exam", time: "10:00 AM", location: "Hall A" },
  { id: "2", title: "OS Lab Submission", date: "2026-03-22", type: "assignment", time: "11:59 PM" },
  { id: "3", title: "Tech Symposium", date: "2026-03-28", type: "event", time: "09:00 AM", location: "Main Auditorium" },
  { id: "4", title: "College Foundation Day", date: "2026-03-30", type: "holiday" },
];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-03-01T12:00:00"));
  const [selectedDate, setSelectedDate] = useState(new Date("2026-03-22T12:00:00"));
  const { userData } = useAuth();
  const isProfessor = userData?.role === "professor";

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const onDateClick = (day: Date) => setSelectedDate(day);

  // Helper to render calendar cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const dateString = format(cloneDay, "yyyy-MM-dd");
        
        // Find events for this day
        const dayEvents = mockEvents.filter(e => e.date === dateString);

        days.push(
          <div
            key={day.toISOString()}
            onClick={() => onDateClick(cloneDay)}
            className={`min-h-[100px] border border-white/[0.04] p-2 transition-all cursor-pointer relative ${
              !isSameMonth(day, monthStart)
                ? "bg-white/[0.01] text-gray-600"
                : isSameDay(day, selectedDate)
                ? "bg-purple-500/10 text-white border-purple-500/30"
                : "bg-white/[0.02] text-gray-300 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex justify-end">
              <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date("2026-03-22T12:00:00")) ? "bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-bold" : ""}`}>
                {formattedDate}
              </span>
            </div>
            
            <div className="mt-2 space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar">
              {dayEvents.map(event => (
                <div 
                  key={event.id}
                  className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                    event.type === 'exam' ? 'bg-red-500/20 text-red-300 border border-red-500/10' :
                    event.type === 'assignment' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10' :
                    event.type === 'event' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/10' :
                    'bg-gray-500/20 text-gray-300 border border-gray-500/10'
                  }`}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toISOString()} className="grid grid-cols-7 gap-px">
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  const selectedDateEvents = mockEvents.filter(e => e.date === format(selectedDate, "yyyy-MM-dd"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Academic Calendar</h1>
          <p className="text-gray-400 mt-1">Track exams, assignments, and college events</p>
        </div>
        {isProfessor && (
          <button className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-3 dash-card !p-0 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-white/[0.06] bg-white/[0.01]">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-3 mt-4 sm:mt-0 bg-[#030712] rounded-xl p-1 border border-white/[0.08]">
              <button onClick={prevMonth} className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium px-4 text-gray-300 cursor-pointer hover:text-white" onClick={() => setCurrentMonth(new Date("2026-03-01T12:00:00"))}>Today</span>
              <button onClick={nextMonth} className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days Wrapper */}
          <div className="bg-[#030712]">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.03]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                <div key={i} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider border-r border-white/[0.02] last:border-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="bg-white/[0.05]">
              {renderCells()}
            </div>
          </div>
        </div>

        {/* Sidebar Date Details */}
        <div className="space-y-6">
          <div className="dash-card sticky top-24">
            <div className="text-center mb-6 pb-6 border-b border-white/[0.06]">
              <h3 className="text-3xl font-bold gradient-text">{format(selectedDate, "dd")}</h3>
              <p className="text-gray-400 font-medium">{format(selectedDate, "MMMM yyyy")}</p>
              <p className="text-sm text-gray-500 mt-1">{format(selectedDate, "EEEE")}</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-200 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-400" /> Events
              </h4>
              
              <AnimatePresence mode="popLayout">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map(event => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={event.id}
                      className={`p-3 rounded-xl border ${
                        event.type === 'exam' ? 'bg-red-500/10 border-red-500/20' :
                        event.type === 'assignment' ? 'bg-amber-500/10 border-amber-500/20' :
                        event.type === 'event' ? 'bg-purple-500/10 border-purple-500/20' :
                        'bg-gray-500/10 border-gray-500/20'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        event.type === 'exam' ? 'text-red-400' :
                        event.type === 'assignment' ? 'text-amber-400' :
                        event.type === 'event' ? 'text-purple-400' :
                        'text-gray-400'
                      }`}>
                        {event.type}
                      </span>
                      <h5 className="font-semibold mt-1 mb-2 text-gray-200">{event.title}</h5>
                      
                      <div className="space-y-1.5">
                        {event.time && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5" /> {event.time}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MapPin className="w-3.5 h-3.5" /> {event.location}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6 text-sm text-gray-500 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                  >
                    No schedule for this day.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-white/[0.06]">
               <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Legend</h4>
               <div className="grid grid-cols-2 gap-2">
                 <div className="flex items-center gap-2 text-xs text-gray-300">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-400" /> Exams
                 </div>
                 <div className="flex items-center gap-2 text-xs text-gray-300">
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Assignments
                 </div>
                 <div className="flex items-center gap-2 text-xs text-gray-300">
                   <div className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Events
                 </div>
                 <div className="flex items-center gap-2 text-xs text-gray-300">
                   <div className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Holidays
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
