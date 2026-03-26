"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";

export type CalEventType = "exam" | "assignment" | "todo" | "event" | "holiday";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string or YYYY-MM-DD
  type: CalEventType;
  time?: string;
  location?: string;
}

interface CalendarContextType {
  events: CalendarEvent[];
}

const CalendarContext = createContext<CalendarContextType>({
  events: [],
});

export function useCalendar() {
  return useContext(CalendarContext);
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const unsubs: (() => void)[] = [];
    const sourceData: Record<string, CalendarEvent[]> = {};

    const syncConfigs = [
      { name: "todos", type: "todo" as const, dateField: "dueDate", titleField: "text" },
      { name: "exams", type: "exam" as const, dateField: "date", titleField: "subject", prefix: "Exam" },
      { name: "assignments", type: "assignment" as const, dateField: "dueDate", titleField: "title" },
      { name: "events", type: "event" as const, dateField: "date", titleField: "title" },
    ];

    syncConfigs.forEach((config) => {
      const q = query(collection(db, config.name), where("userId", "==", user.uid));
      
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          let date = data[config.dateField];
          
          if (date && typeof date === "object" && "toDate" in date) {
            date = date.toDate().toISOString().split("T")[0];
          } else if (date && typeof date === "string" && date.includes("T")) {
            date = date.split("T")[0];
          }

          return {
            id: `${config.type}-${doc.id}`,
            title: config.prefix ? `${config.prefix}: ${data[config.titleField]}` : data[config.titleField],
            date: date || "",
            type: config.type,
            time: data.time || "",
            location: data.location || "",
          };
        }).filter(e => e.date);

        sourceData[config.name] = items;
        setEvents(Object.values(sourceData).flat());
      });

      unsubs.push(unsub);
    });

    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  return (
    <CalendarContext.Provider value={{ events }}>
      {children}
    </CalendarContext.Provider>
  );
}
