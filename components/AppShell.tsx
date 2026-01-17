"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: ReactNode;
  pageTransition?: "default" | "slide-up";
}

export default function AppShell({
  children,
  pageTransition = "default",
}: AppShellProps) {
  const pathname = usePathname();
  const transitionConfig =
    pageTransition === "slide-up"
      ? {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 28 },
          transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
        }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 },
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        };

  return (
    <div className="flex flex-col min-h-screen bg-background safe-area-top">
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 w-full max-w-md mx-auto"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={transitionConfig.initial}
            animate={transitionConfig.animate}
            exit={transitionConfig.exit}
            transition={transitionConfig.transition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
