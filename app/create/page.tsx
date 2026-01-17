"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

  const itemCount = CONTENT_ITEMS.length;
  const peekAmount = 0.10; // 10% peek
  const snapThreshold = 70;
  const velocityThreshold = 250;

  // Calculate item height (90% of container to leave 10% for peek)
  const itemHeight = containerHeight * (1 - peekAmount);

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height;
        setContainerHeight(height);
      }
    };

    const timer = setTimeout(updateHeight, 50);
    window.addEventListener("resize", updateHeight);
    
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate Y offset for an index
  const getYOffset = useCallback(
    (index: number) => -index * itemHeight,
    [itemHeight]
  );

  // Snap to index with animation
  const snapToIndex = useCallback(
    async (index: number, immediate = false) => {
      const clampedIndex = Math.max(0, Math.min(index, itemCount - 1));
      const targetY = getYOffset(clampedIndex);

      if (immediate) {
        controls.set({ y: targetY });
      } else {
        await controls.start({
          y: targetY,
          transition: {
            type: "tween",
            duration: 0.28,
            ease: [0.25, 0.1, 0.25, 1],
          },
        });
      }

      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
        // Haptic feedback
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    },
    [controls, currentIndex, getYOffset, itemCount]
  );

  // Initialize position
  useEffect(() => {
    if (containerHeight > 0) {
      snapToIndex(0, true);
    }
  }, [containerHeight, snapToIndex]);

  // Drag handlers
  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    
    let targetIndex = currentIndex;
    const distanceTriggered = Math.abs(offset.y) > snapThreshold;
    const velocityTriggered = Math.abs(velocity.y) > velocityThreshold;

    if (distanceTriggered || velocityTriggered) {
      if (offset.y < 0 || velocity.y < -velocityThreshold) {
        targetIndex = currentIndex + 1;
      } else if (offset.y > 0 || velocity.y > velocityThreshold) {
        targetIndex = currentIndex - 1;
      }
    }

    snapToIndex(targetIndex);
  };

  // Drag constraints
  const getDragConstraints = () => ({
    top: -((itemCount - 1) * itemHeight) - containerHeight * 0.15,
    bottom: containerHeight * 0.15,
  });

  return (
    <AppShell>
      <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
        {/* Fixed Top Bar */}
        <div className="relative z-30 flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur-sm border-b border-border/20 safe-area-top">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
          
          {/* Position indicator */}
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-sm font-semibold"
          >
            <span className="text-foreground">{currentIndex + 1}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-muted-foreground">{itemCount}</span>
          </motion.div>

          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden touch-none"
          style={{ touchAction: "none" }}
        >
          {containerHeight > 0 && (
            <motion.div
              className="w-full will-change-transform"
              drag="y"
              dragConstraints={getDragConstraints()}
              dragElastic={0.12}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              animate={controls}
              initial={{ y: 0 }}
              dragTransition={{
                bounceStiffness: 400,
                bounceDamping: 40,
                power: 0.6,
              }}
            >
              {CONTENT_ITEMS.map((item, index) => {
                const isNext = index === currentIndex + 1;
                const isCurrent = index === currentIndex;
                const isPrevious = index === currentIndex - 1;

                return (
                  <motion.div
                    key={item.id}
                    className="relative w-full"
                    style={{ height: itemHeight }}
                    animate={{
                      opacity: isCurrent ? 1 : isNext ? (isDragging ? 1 : 0.7) : isPrevious ? 0.5 : 0.3,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Content item with rounded top for peek effect */}
                    <div 
                      className="absolute inset-0 overflow-hidden bg-background"
                      style={{
                        borderTopLeftRadius: isNext ? 20 : 0,
                        borderTopRightRadius: isNext ? 20 : 0,
                      }}
                    >
                      {/* Content Form */}
                      <ContentItemForm 
                        item={item} 
                        router={router}
                        isCurrent={isCurrent}
                      />
                    </div>

                    {/* Top shadow for next item */}
                    {isNext && (
                      <div
                        className="absolute inset-x-0 top-0 h-6 pointer-events-none z-20"
                        style={{
                          background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.12), transparent)",
                          borderTopLeftRadius: 20,
                          borderTopRightRadius: 20,
                        }}
                      />
                    )}

                    {/* Peek fade overlay */}
                    {isNext && !isDragging && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          borderTopLeftRadius: 20,
                          borderTopRightRadius: 20,
                          background: `linear-gradient(to bottom, 
                            hsl(var(--background) / 0.6) 0%, 
                            hsl(var(--background) / 0.2) 50%,
                            transparent 100%
                          )`,
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
              
              {/* Extra space at bottom */}
              <div style={{ height: containerHeight * peekAmount }} />
            </motion.div>
          )}
        </div>

        {/* Fixed Bottom CTA */}
        <div className="relative z-30 w-full bg-background border-t border-border px-4 pt-4 pb-3 safe-area-bottom">
          <Button className="w-full rounded-[999px]" size="lg">
            Перевірити та зняти
          </Button>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-3">
            {CONTENT_ITEMS.map((_, index) => (
              <motion.div
                key={index}
                className="rounded-full"
                animate={{
                  width: index === currentIndex ? 20 : 6,
                  height: 6,
                  backgroundColor: index === currentIndex 
                    ? "hsl(var(--primary))" 
                    : "hsl(var(--muted-foreground) / 0.25)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            ))}
          </div>
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
    <div className="h-full flex flex-col pt-6 px-4 overflow-y-auto">
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
            className="min-h-[180px] pr-12 pb-14 text-base border-border/60"
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
      </div>

      {/* Secondary Action */}
      <div className="mt-6 pt-4 border-t border-border/40">
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
  );
}
