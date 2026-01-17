"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RecordingButton() {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <motion.button
      onClick={toggleRecording}
      className={cn(
        "absolute bottom-3 right-3 h-10 bg-secondary text-secondary-foreground",
        "flex items-center justify-end pr-0",
        "rounded-full overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50"
      )}
      animate={{
        width: isRecording ? 100 : 40,
      }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 28,
      }}
    >
      {/* Waveform */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
            }}
            className="flex items-center gap-1 px-2.5"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-secondary-foreground/70 rounded-full"
                initial={{ height: 4 }}
                animate={{
                  height: [4, 14, 6, 18, 5, 12, 4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
                style={{ minHeight: 4 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon Container */}
      <motion.div
        className="relative flex items-center justify-center h-10 w-10 flex-shrink-0"
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 28,
        }}
      >
        <AnimatePresence mode="sync">
          {isRecording ? (
            <motion.div
              key="stop"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.7, rotate: -30, opacity: 0.2 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.7, rotate: 90, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
            >
              <Square className="w-4 h-4 fill-current" />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.7, rotate: -30, opacity: 0.2 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.7, rotate: 90, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
            >
              <Mic className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}
