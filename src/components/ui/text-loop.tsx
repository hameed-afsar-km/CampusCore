"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TextLoopProps = {
  children: React.ReactNode[];
  className?: string;
  interval?: number;
};

// TextLoop component completely rewritten to have a beautiful "scroll within itself" / flip animation.
export function TextLoop({
  children,
  className,
  interval = 3,
}: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const words = React.Children.map(children, (child) => {
    // Attempt to extract text if it's a simple string wrapped in a span, or just string.
    if (typeof child === "string") return child;
    // @ts-ignore
    if (child?.props?.children && typeof child.props.children === "string") {
      // @ts-ignore
      return child.props.children;
    }
    return "";
  }) || [];

  const startAnimation = useCallback(() => {
    const nextIndex = (currentIndex + 1) % words.length;
    setCurrentIndex(nextIndex);
    setIsAnimating(true);
  }, [currentIndex, words.length]);

  useEffect(() => {
    if (!isAnimating) {
      const timer = setTimeout(() => {
        startAnimation();
      }, interval * 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, interval, startAnimation]);

  const currentWordStr = words[currentIndex] || "";
  const currentWordLetters = currentWordStr.split("");

  return (
    <div className={cn("relative inline-block transition-all duration-300", className)}>
      <AnimatePresence
        onExitComplete={() => setIsAnimating(false)}
        mode="wait"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, filter: "blur(4px)", position: "absolute" }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className="z-10 inline-block relative text-left whitespace-nowrap overflow-visible"
          key={currentWordStr}
        >
          {currentWordLetters.map((letter, index) => (
            <motion.span
              key={currentWordStr + index}
              initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className="inline-block"
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
