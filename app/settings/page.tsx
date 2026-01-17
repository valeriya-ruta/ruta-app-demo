"use client";

import AppShell from "@/components/AppShell";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
        >
          <Settings className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-semibold text-center mb-3"
        >
          Settings
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-center max-w-xs"
        >
          Configure your preferences
        </motion.p>
      </div>
    </AppShell>
  );
}
