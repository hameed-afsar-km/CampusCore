"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type CalEventType = "exam" | "assignment" | "todo" | "event" | "holiday";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // yyyy-MM-dd
  type: CalEventType;
  time?: string;
  location?: string;
}

interface CalendarContextType {
  events: CalendarEvent[];
  addEvent: (event: CalendarEvent) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, partial: Partial<CalendarEvent>) => void;
}

const CalendarContext = createContext<CalendarContextType>({
  events: [],
  addEvent: () => {},
  removeEvent: () => {},
  updateEvent: () => {},
});

export function useCalendar() {
  return useContext(CalendarContext);
}

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: "cal-1", title: "DBMS Mid Term", date: "2026-03-25", type: "exam", time: "10:00 AM", location: "Hall A" },
  { id: "cal-2", title: "OS Lab Submission", date: "2026-03-22", type: "assignment", time: "11:59 PM" },
  { id: "cal-3", title: "Tech Symposium", date: "2026-03-28", type: "event", time: "09:00 AM", location: "Main Auditorium" },
  { id: "cal-4", title: "College Foundation Day", date: "2026-03-30", type: "holiday" },
];

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);

  const addEvent = (event: CalendarEvent) => {
    setEvents((prev) => {
      if (prev.find((e) => e.id === event.id)) return prev;
      return [...prev, event];
    });
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEvent = (id: string, partial: Partial<CalendarEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...partial } : e))
    );
  };

  return (
    <CalendarContext.Provider value={{ events, addEvent, removeEvent, updateEvent }}>
      {children}
    </CalendarContext.Provider>
  );
}
