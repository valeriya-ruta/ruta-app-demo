"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import RecordingButton from "@/components/RecordingButton";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Sample content data - 5 items
const CONTENT_ITEMS = [
  { id: 1, title: "Content 1", description: "" },
  { id: 2, title: "Content 2", description: "" },
  { id: 3, title: "Content 3", description: "" },
  { id: 4, title: "Content 4", description: "" },
  { id: 5, title: "Content 5", description: "" },
];

// Header height in pixels
const HEADER_HEIGHT = 56;
// Peek amount (10% of viewport minus header)
const PEEK_PERCENT = 10;

export default function CreatePage() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const itemCount = CONTENT_ITEMS.length;

  // Track scroll position to determine current index
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemHeight = containerHeight * 0.9; // 90% of container
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < itemCount) {
        setCurrentIndex(newIndex);
        // Haptic feedback
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(8);
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, itemCount]);

  return (
    <AppShell>
      <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
        {/* Fixed Top Bar */}
        <div 
          className="relative z-30 flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm border-b border-border/20 safe-area-top"
          style={{ height: HEADER_HEIGHT }}
        >
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>

          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area with CSS Snap */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-scroll overscroll-y-contain"
          style={{
            scrollSnapType: "y mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {CONTENT_ITEMS.map((item, index) => {
            const isNext = index === currentIndex + 1;
            const isCurrent = index === currentIndex;
            const isPrev = index === currentIndex - 1;

            return (
              <div
                key={item.id}
                className="relative w-full"
                style={{
                  // Item takes 90% of available height (100vh - header), leaving 10% for peek
                  height: `calc((100vh - ${HEADER_HEIGHT}px) * ${(100 - PEEK_PERCENT) / 100})`,
                  scrollSnapAlign: "start",
                  scrollSnapStop: "always",
                }}
              >
                {/* Content container */}
                <motion.div 
                  className="absolute inset-0 bg-background overflow-hidden"
                  style={{
                    borderTopLeftRadius: isNext ? 16 : 0,
                    borderTopRightRadius: isNext ? 16 : 0,
                  }}
                  initial={false}
                  animate={{
                    opacity: isCurrent ? 1 : (isNext || isPrev) ? 0.65 : 0.4,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Content Form */}
                  <ContentItemForm 
                    item={item} 
                    router={router}
                    isCurrent={isCurrent}
                  />
                </motion.div>

                {/* Top shadow for peek depth */}
                {isNext && (
                  <div
                    className="absolute inset-x-0 top-0 h-3 pointer-events-none z-20"
                    style={{
                      background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.06), transparent)",
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  />
                )}

                {/* Peek fade overlay for next item */}
                {isNext && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      background: `linear-gradient(to bottom, 
                        hsl(var(--background) / 0.35) 0%, 
                        hsl(var(--background) / 0.1) 50%,
                        transparent 100%
                      )`,
                    }}
                  />
                )}
              </div>
            );
          })}
          
          {/* Extra space at bottom for last item peek area */}
          <div 
            style={{ 
              height: `calc((100vh - ${HEADER_HEIGHT}px) * ${PEEK_PERCENT / 100})`,
              scrollSnapAlign: "end",
            }} 
          />
        </div>
      </div>
    </AppShell>
  );
}

// Separate component for each content item's form
interface ContentItemFormProps {
  item: { id: number; title: string; description: string };
  router: ReturnType<typeof useRouter>;
  isCurrent: boolean;
}

function ContentItemForm({ item, router, isCurrent }: ContentItemFormProps) {
  return (
    <div className={`h-full flex flex-col ${!isCurrent ? 'pointer-events-none' : ''}`}>
      {/* Content area */}
      <div className="flex-1 pt-6 px-4 overflow-hidden">
        <div className="space-y-6">
          {/* Title Input - pre-filled with item title */}
          <Input
            type="text"
            placeholder="Заголовок контенту"
            defaultValue={item.title}
            className="text-base border-border/60"
            tabIndex={isCurrent ? 0 : -1}
            readOnly={!isCurrent}
          />

          {/* Script Area */}
          <div className="relative">
            <Textarea
              placeholder="Розкажи, про що ти хочеш поговорити в цьому контенті. Опиши основні ідеї та ключові моменти..."
              className="min-h-[160px] pr-12 pb-14 text-base border-border/60"
              tabIndex={isCurrent ? 0 : -1}
              readOnly={!isCurrent}
            />
            <RecordingButton />
            <Button 
              variant="secondary" 
              size="sm"
              className="absolute bottom-3 left-3 px-2.5"
              tabIndex={isCurrent ? 0 : -1}
            >
              Створити сценарій
            </Button>
          </div>

          {/* Secondary Action */}
          <div className="pt-4 border-t border-border/40">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/reuse")}
              tabIndex={isCurrent ? 0 : -1}
            >
              ✨ Перевикористати контент
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Action Button - inside each item */}
      <div className="px-4 pt-4 pb-4 border-t border-border bg-background">
        <Button 
          className="w-full rounded-[999px]" 
          size="lg"
          tabIndex={isCurrent ? 0 : -1}
        >
          Перевірити та зняти
        </Button>
      </div>
    </div>
  );
}
