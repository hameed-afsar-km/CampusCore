"use client";
import React, { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TextLoopProps = {
  children: string[];
  className?: string;
  interval?: number;
};

// Cinematic Spring In-Place Reveal.
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
    <div className="relative inline-flex flex-col h-[1.25em] overflow-hidden align-top min-w-[300px] sm:min-w-[400px] lg:min-w-[500px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
          transition={{
            duration: 0.5,
            ease: [0.32, 0.72, 0, 1],
          }}
          className={cn(
            "whitespace-nowrap leading-[1.25em] text-center lg:text-left",
            className
          )}
        >
          {words[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
