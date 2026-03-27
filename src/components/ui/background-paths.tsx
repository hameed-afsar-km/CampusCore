"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Typewriter } from "@/components/ui/typewriter-text";

const FloatingPaths = React.memo(({ position }: { position: number }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const paths = useMemo(() => {
        if (!mounted) return [];
        return Array.from({ length: 12 }, (_, i) => ({
            id: i,
            d: `M-${380 - i * 15 * position} -${189 + i * 20}C-${
                380 - i * 15 * position
            } -${189 + i * 20} -${312 - i * 15 * position} ${216 - i * 20} ${
                152 - i * 15 * position
            } ${343 - i * 20}C${616 - i * 15 * position} ${470 - i * 20} ${
                684 - i * 15 * position
            } ${875 - i * 20} ${684 - i * 15 * position} ${875 - i * 20}`,
            width: 0.5 + i * 0.1,
            duration: 15 + i * 2,
        }));
    }, [position, mounted]);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-white/5"
                viewBox="0 0 696 316"
                fill="none"
                preserveAspectRatio="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={`path-${position}-${path.id}`}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        initial={{ pathLength: 0.3, opacity: 0.1 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.05, 0.15, 0.05],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: path.duration,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
});

FloatingPaths.displayName = "FloatingPaths";

const TYPEWRITER_TEXTS = [
    "Your Campus. Streamlined.",
    "Study Smart. Achieve More.",
    "One Platform. Every Need.",
    "Built for Student Success.",
];

export function BackgroundPaths({
    title = "CampusCore",
}: {
    title?: string;
}) {
    return (
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden bg-[#02050e]">
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 w-full px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="relative inline-block mb-6">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter select-none">
                            <span className="shimmer-text">CampusCore</span>
                        </h1>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent blur-sm" />
                    </div>

                    <div className="text-gray-500 mt-2 text-xs md:text-sm max-w-sm mx-auto tracking-widest uppercase font-mono h-6 opacity-60">
                        <Typewriter
                            text={TYPEWRITER_TEXTS}
                            speed={70}
                            deleteSpeed={35}
                            loop={true}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

