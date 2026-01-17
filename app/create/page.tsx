"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
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

export default function CreatePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const currentIndexRef = useRef(currentIndex);

  const itemCount = CONTENT_ITEMS.length;
  const peekAmount = 0.10; // 10% peek
  const snapThreshold = 60;
  const velocityThreshold = 200;

  // Calculate item height (90% of container to leave 10% for peek)
  const itemHeight = containerHeight * (1 - peekAmount);

  // Keep ref in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    };

    // Multiple attempts to ensure we get the height
    updateHeight();
    const timer1 = setTimeout(updateHeight, 100);
    const timer2 = setTimeout(updateHeight, 300);
    
    window.addEventListener("resize", updateHeight);
    
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  // Snap to index with animation
  const snapToIndex = (index: number, immediate = false) => {
    const clampedIndex = Math.max(0, Math.min(index, itemCount - 1));
    const targetY = -clampedIndex * itemHeight;

    if (immediate) {
      controls.set({ y: targetY });
    } else {
      controls.start({
        y: targetY,
        transition: {
          type: "tween",
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        },
      });
    }

    setCurrentIndex(clampedIndex);
    currentIndexRef.current = clampedIndex;
    
    // Haptic feedback
    if (!immediate && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Initialize position when height is ready
  useEffect(() => {
    if (containerHeight > 0 && itemHeight > 0) {
      controls.set({ y: -currentIndexRef.current * itemHeight });
    }
  }, [containerHeight, itemHeight, controls]);

  // Drag handlers
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    
    const { offset, velocity } = info;
    const currentIdx = currentIndexRef.current;
    
    let targetIndex = currentIdx;
    
    // Check if drag distance or velocity exceeds threshold
    if (Math.abs(offset.y) > snapThreshold || Math.abs(velocity.y) > velocityThreshold) {
      if (offset.y < 0 || velocity.y < -velocityThreshold) {
        // Swiped up - go to next
        targetIndex = currentIdx + 1;
      } else if (offset.y > 0 || velocity.y > velocityThreshold) {
        // Swiped down - go to previous
        targetIndex = currentIdx - 1;
      }
    }

    snapToIndex(targetIndex);
  };

  return (
    <AppShell>
      <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
        {/* Fixed Top Bar */}
        <div className="relative z-30 flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur-sm border-b border-border/20 safe-area-top">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>

          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
        >
          {containerHeight > 0 && itemHeight > 0 && (
            <motion.div
              className="w-full absolute inset-x-0 top-0 touch-none select-none"
              style={{ touchAction: "none" }}
              drag="y"
              dragConstraints={{
                top: -((itemCount - 1) * itemHeight) - 50,
                bottom: 50,
              }}
              dragElastic={0.1}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              animate={controls}
              initial={{ y: 0 }}
            >
              {CONTENT_ITEMS.map((item, index) => {
                const isNext = index === currentIndex + 1;
                const isCurrent = index === currentIndex;
                const isPrevious = index === currentIndex - 1;

                return (
                  <motion.div
                    key={item.id}
                    className="relative w-full overflow-hidden"
                    style={{ height: itemHeight }}
                    animate={{
                      opacity: isCurrent ? 1 : isNext ? (isDragging ? 0.95 : 0.6) : isPrevious ? 0.5 : 0.3,
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Content container */}
                    <div 
                      className="absolute inset-0 bg-background"
                      style={{
                        borderTopLeftRadius: isNext ? 16 : 0,
                        borderTopRightRadius: isNext ? 16 : 0,
                      }}
                    >
                      {/* Content Form - includes the button */}
                      <ContentItemForm 
                        item={item} 
                        router={router}
                        isCurrent={isCurrent}
                      />
                    </div>

                    {/* Top shadow for peek depth */}
                    {isNext && (
                      <div
                        className="absolute inset-x-0 top-0 h-4 pointer-events-none z-20"
                        style={{
                          background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.1), transparent)",
                          borderTopLeftRadius: 16,
                          borderTopRightRadius: 16,
                        }}
                      />
                    )}

                    {/* Peek fade overlay */}
                    {isNext && !isDragging && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          borderTopLeftRadius: 16,
                          borderTopRightRadius: 16,
                          background: `linear-gradient(to bottom, 
                            hsl(var(--background) / 0.5) 0%, 
                            hsl(var(--background) / 0.15) 60%,
                            transparent 100%
                          )`,
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
              
              {/* Extra space at bottom for last item peek area */}
              <div style={{ height: containerHeight * peekAmount }} />
            </motion.div>
          )}
          
          {/* Loading state */}
          {containerHeight === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}
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
    <div className="h-full flex flex-col">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pt-6 px-4">
        <div className="space-y-6">
          {/* Title Input - pre-filled with item title */}
          <Input
            type="text"
            placeholder="Заголовок контенту"
            defaultValue={item.title}
            className="text-base border-border/60"
            tabIndex={isCurrent ? 0 : -1}
          />

          {/* Script Area */}
          <div className="relative">
            <Textarea
              placeholder="Розкажи, про що ти хочеш поговорити в цьому контенті. Опиши основні ідеї та ключові моменти..."
              className="min-h-[160px] pr-12 pb-14 text-base border-border/60"
              tabIndex={isCurrent ? 0 : -1}
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
