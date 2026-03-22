import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CampusCore — All your college life, in one place",
  description:
    "CampusCore is the ultimate college management platform for B.S. Abdur Rahman Crescent Institute of Science and Technology. Manage assignments, notes, exams, attendance, and more — all in one place.",
  keywords: [
    "college management",
    "student portal",
    "BSACIST",
    "Crescent Institute",
    "assignments",
    "attendance",
    "notes",
    "timetable",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
