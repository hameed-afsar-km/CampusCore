export const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "BBA", "MBA"];
export const SECTIONS = ["A", "B", "C", "D"];

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
