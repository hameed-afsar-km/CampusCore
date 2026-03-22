"use client";

import { useState } from "react";
import { useCalendar } from "@/lib/calendar-context";
import type { CalEventType } from "@/lib/calendar-context";
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
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar as CalendarIcon } from "lucide-react";

const TODAY = new Date();
const TODAY_STR = format(TODAY, "yyyy-MM-dd");

function getEventColor(type: CalEventType) {
  switch (type) {
    case "exam": return { pill: "bg-red-500/20 text-red-300 border-red-500/10", card: "bg-red-500/10 border-red-500/20", label: "text-red-400" };
    case "assignment": return { pill: "bg-amber-500/20 text-amber-300 border-amber-500/10", card: "bg-amber-500/10 border-amber-500/20", label: "text-amber-400" };
    case "todo": return { pill: "bg-cyan-500/20 text-cyan-300 border-cyan-500/10", card: "bg-cyan-500/10 border-cyan-500/20", label: "text-cyan-400" };
    case "event": return { pill: "bg-purple-500/20 text-purple-300 border-purple-500/10", card: "bg-purple-500/10 border-purple-500/20", label: "text-purple-400" };
    case "holiday": return { pill: "bg-gray-500/20 text-gray-300 border-gray-500/10", card: "bg-gray-500/10 border-gray-500/20", label: "text-gray-400" };
  }
}

export default function CalendarPage() {
  const { events } = useCalendar();
  const [currentMonth, setCurrentMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(TODAY);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days: React.ReactNode[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const dateString = format(cloneDay, "yyyy-MM-dd");
        const dayEvents = events.filter((e) => e.date === dateString);
        const isToday = isSameDay(cloneDay, TODAY);
        const isSelected = isSameDay(cloneDay, selectedDate);
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);

        days.push(
          <div
            key={cloneDay.toISOString()}
            onClick={() => setSelectedDate(cloneDay)}
            className={`min-h-[90px] border border-white/[0.04] p-2 transition-all cursor-pointer ${
              !isCurrentMonth
                ? "bg-white/[0.01] text-gray-600"
                : isSelected
                ? "bg-purple-500/10 border-purple-500/30 text-white"
                : "bg-white/[0.02] text-gray-300 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex justify-end">
              <span
                className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${
                  isToday
                    ? "bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-bold"
                    : ""
                }`}
              >
                {format(cloneDay, "d")}
              </span>
            </div>
            <div className="mt-1 space-y-0.5 overflow-hidden max-h-[52px]">
              {dayEvents.slice(0, 3).map((event) => {
                const color = getEventColor(event.type);
                return (
                  <div
                    key={event.id}
                    className={`text-[9px] px-1 py-0.5 rounded truncate font-medium border ${color.pill}`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                );
              })}
              {dayEvents.length > 3 && (
                <div className="text-[9px] text-gray-500 pl-1">+{dayEvents.length - 3} more</div>
              )}
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

  const selectedDateEvents = events.filter(
    (e) => e.date === format(selectedDate, "yyyy-MM-dd")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Academic Calendar</h1>
        <p className="text-gray-400 mt-1">All your exams, todos, assignments, and events — synced in one place</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 dash-card !p-0 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-white/[0.06] bg-white/[0.01]">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2 mt-4 sm:mt-0 bg-[#030712] rounded-xl p-1 border border-white/[0.08]">
              <button onClick={prevMonth} className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span
                className="text-sm font-medium px-3 text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  setCurrentMonth(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
                  setSelectedDate(TODAY);
                }}
              >
                Today
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-[#030712]">
            {/* Day names */}
            <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.03]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                <div
                  key={i}
                  className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="bg-white/[0.04]">{renderCells()}</div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="dash-card sticky top-24">
            {/* Date header */}
            <div className="text-center mb-6 pb-6 border-b border-white/[0.06]">
              <h3 className="text-3xl font-bold gradient-text">{format(selectedDate, "dd")}</h3>
              <p className="text-gray-400 font-medium">{format(selectedDate, "MMMM yyyy")}</p>
              <p className="text-sm text-gray-500 mt-1">{format(selectedDate, "EEEE")}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-200 flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-purple-400" />
                {selectedDateEvents.length > 0
                  ? `${selectedDateEvents.length} item${selectedDateEvents.length > 1 ? "s" : ""}`
                  : "No schedule"}
              </h4>

              <AnimatePresence mode="popLayout">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event) => {
                    const color = getEventColor(event.type);
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={event.id}
                        className={`p-3 rounded-xl border ${color.card}`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${color.label}`}>
                          {event.type}
                        </span>
                        <h5 className="font-semibold mt-1 mb-2 text-gray-200 text-sm">{event.title}</h5>
                        {event.time && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5" /> {event.time}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" /> {event.location}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-sm text-gray-500 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                  >
                    Nothing scheduled.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Legend</h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                {([
                  { type: "exam" as CalEventType, label: "Exams" },
                  { type: "assignment" as CalEventType, label: "Assignments" },
                  { type: "todo" as CalEventType, label: "To-Dos" },
                  { type: "event" as CalEventType, label: "Events" },
                  { type: "holiday" as CalEventType, label: "Holidays" },
                ]).map(({ type, label }) => {
                  const c = getEventColor(type);
                  return (
                    <div key={type} className="flex items-center gap-2 text-xs text-gray-300">
                      <div className={`w-2.5 h-2.5 rounded-full border ${c.pill}`} />
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
