"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Home, List, Camera, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
  pageTransition?: "default" | "slide-up";
}

const navItems = [
  { href: "/", icon: Home },
  { href: "/list", icon: List, activeColor: "#004BA8" },
  { href: "/create", icon: Camera },
  { href: "/statistics", icon: BarChart3 },
];

export default function AppShell({
  children,
  hideNav = false,
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
      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn("flex-1 w-full max-w-md mx-auto", !hideNav && "pb-24")}
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

      {/* Bottom Navigation */}
      {!hideNav && (
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 pb-10 safe-area-bottom"
      >
        <div className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-xl border-t border-border rounded-t-2xl shadow-lg">
          <div className="flex items-center justify-around px-2 pt-3 pb-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/list" && pathname === "/");
            const activeColor = item.activeColor || undefined;
            
            // Determine the color based on active state and item-specific rules
            let iconStyle: React.CSSProperties | undefined;
            if (isActive && activeColor) {
              iconStyle = { color: activeColor };
            } else if (!isActive) {
              // Apply muted color for inactive icons: rgba(113, 113, 122, 1)
              iconStyle = { color: "rgba(113, 113, 122, 1)" };
            }
            
            return (
              <div
                key={item.href}
                className={cn(
                  "relative flex items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all cursor-pointer",
                  "active:scale-95"
                )}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  style={!isActive ? { color: "rgba(113, 113, 122, 1)" } : undefined}
                >
                  <Icon 
                    className={cn(
                      "w-6 h-6",
                      !isActive && "text-muted-foreground"
                    )}
                    style={iconStyle}
                  />
                </motion.div>
              </div>
            );
          })}
          </div>
        </div>
      </motion.nav>
      )}
    </div>
  );
}
