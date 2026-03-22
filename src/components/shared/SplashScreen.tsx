"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen() {
  const [show, setShow] = useState(true);

  // Auto-hide the splash screen after the animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2200); // Wait 2.2s before unmounting
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#030712]"
        >
          {/* Vibrant Orbs behind the logo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <motion.div 
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 0.4 }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-purple-500/30 blur-[100px]"
             />
             <motion.div 
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 0.3 }}
               transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-500/20 blur-[120px]"
             />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* CampusCore Logo Text Animation */}
            <motion.div
              initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-black tracking-tight mb-4"
            >
              <span className="text-white">Campus</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                Core
              </span>
            </motion.div>

            {/* Smart Loader Progress Bar */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 140, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
              className="h-1 bg-white/10 rounded-full overflow-hidden relative"
            >
               <motion.div
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ duration: 1.2, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"
               />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
