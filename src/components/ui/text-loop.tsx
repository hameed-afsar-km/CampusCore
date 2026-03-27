"use client";
import React, { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TextLoopProps = {
  children: string[];
  className?: string;
  interval?: number;
};

// Ultimate Layout-Stable Text Loop: Width is locked to the widest word so surrounding text NEVER moves.
export function TextLoop({
  children,
  className,
  interval = 3,
}: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const words = useMemo(() => {
    return React.Children.toArray(children)
      .flatMap(child => (Array.isArray(child) ? child : [child]))
      .map(child => (typeof child === "string" ? child : String(child)))
      .filter(Boolean);
  }, [children]);

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((c) => (c + 1) % words.length);
    }, interval * 1000);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  if (words.length === 0) return null;

  return (
    <div className="relative inline-flex flex-col h-[1.3em] align-top">
      {/* Width-Gage: This invisible layer renders all words overlapping in a single CSS grid cell
          to force the parent container to ALWAYS maintain exactly the width of the longest phrase. */}
      <div className="grid invisible h-0 pointer-events-none select-none px-4" aria-hidden="true">
        {words.map((word, i) => (
          <div key={i} className={cn("col-start-1 row-start-1", className)}>{word}</div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentIndex}
           initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)", y: 5 }}
           animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
           exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)", y: -5 }}
           transition={{
             duration: 0.6,
             ease: [0.16, 1, 0.3, 1],
           }}
           className={cn(
             "absolute top-0 left-0 w-full h-full flex items-center justify-center lg:justify-start whitespace-nowrap px-4",
             className
           )}
        >
          {words[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
