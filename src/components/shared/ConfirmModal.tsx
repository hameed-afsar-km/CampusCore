"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmModalProps) {
  const variantStyles = {
    danger: "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20",
  };

  const btnStyles = {
    danger: "bg-gradient-to-r from-red-600 to-rose-600",
    warning: "bg-gradient-to-r from-amber-600 to-orange-600",
    info: "bg-gradient-to-r from-blue-600 to-indigo-600",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-[#030712] border border-white/[0.08] rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[80px] opacity-20 ${
              variant === "danger" ? "bg-red-500" : variant === "warning" ? "bg-amber-500" : "bg-blue-500"
            }`} />

            <div className="flex items-center justify-between mb-5">
              <div className={`p-2 rounded-xl ${variantStyles[variant]} border`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              {message}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 ${btnStyles[variant]}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
