export const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "BBA", "MBA"];
export const SECTIONS = ["A", "B", "C", "D"];

export const PREDEFINED_COLORS = [
  { id: "purple", bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400", hex: "#a855f7" },
  { id: "cyan", bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-400", hex: "#06b6d4" },
  { id: "emerald", bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-400", hex: "#10b981" },
  { id: "amber", bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400", hex: "#f59e0b" },
  { id: "rose", bg: "bg-rose-500/20", border: "border-rose-500/30", text: "text-rose-400", hex: "#f43f5e" },
  { id: "indigo", bg: "bg-indigo-500/20", border: "border-indigo-500/30", text: "text-indigo-400", hex: "#6366f1" },
  { id: "orange", bg: "bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-400", hex: "#f97316" },
  { id: "pink", bg: "bg-pink-500/20", border: "border-pink-500/30", text: "text-pink-400", hex: "#ec4899" },
];

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const TIME_SLOTS = [
  { label: "9:00 - 9:50 AM",   type: "class", id: "1",     title: "P1" },
  { label: "9:50 - 10:40 AM",  type: "class", id: "2",     title: "P2" },
  { label: "10:40 - 11:00 AM", type: "break", id: "break", title: "Break" },
  { label: "11:00 - 11:50 AM", type: "class", id: "3",     title: "P3" },
  { label: "11:50 - 12:40 PM", type: "class", id: "4",     title: "P4" },
  { label: "12:40 - 1:40 PM",  type: "lunch", id: "lunch", title: "Lunch" },
  { label: "1:40 - 2:30 PM",   type: "class", id: "5",     title: "P5" },
  { label: "2:30 - 3:20 PM",   type: "class", id: "6",     title: "P6" },
  { label: "3:20 - 4:10 PM",   type: "class", id: "7",     title: "P7" },
];
