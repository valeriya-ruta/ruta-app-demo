"use client";

import { useState, useRef, useCallback } from "react";
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

// Header height in pixels
const HEADER_HEIGHT = 56;
// Peek amount percentage
const PEEK_PERCENT = 10;
// Threshold to trigger snap (percentage of item height user must drag)
const SNAP_THRESHOLD_PERCENT = 35; // Must drag 35% of item height to snap
// Resistance factor (lower = more resistance, 0.3-0.5 is good)
const DRAG_RESISTANCE = 0.4;

export default function CreatePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const currentIndexRef = useRef(0);

  const itemCount = CONTENT_ITEMS.length;

  // Get container height
  const getContainerHeight = useCallback(() => {
    if (typeof window === 'undefined') return 600;
    return window.innerHeight - HEADER_HEIGHT;
  }, []);

  // Get item height (90% of container)
  const getItemHeight = useCallback(() => {
    return getContainerHeight() * (1 - PEEK_PERCENT / 100);
  }, [getContainerHeight]);

  // Get Y offset for an index
  const getYOffset = useCallback((index: number) => {
    return -index * getItemHeight();
  }, [getItemHeight]);

  // Snap to index with animation
  const snapToIndex = useCallback((index: number, immediate = false) => {
    const clampedIndex = Math.max(0, Math.min(index, itemCount - 1));
    const targetY = getYOffset(clampedIndex);

    if (immediate) {
      controls.set({ y: targetY });
    } else {
      controls.start({
        y: targetY,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      });
    }

    setCurrentIndex(clampedIndex);
    currentIndexRef.current = clampedIndex;

    // Haptic feedback on change
    if (!immediate && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  }, [controls, getYOffset, itemCount]);

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end - determine if we should snap to next/prev or stay
  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    
    const { offset, velocity } = info;
    const itemHeight = getItemHeight();
    const threshold = itemHeight * (SNAP_THRESHOLD_PERCENT / 100);
    
    const currentIdx = currentIndexRef.current;
    let targetIndex = currentIdx;

    // Calculate effective drag with resistance already applied by dragElastic
    const effectiveDrag = offset.y;
    
    // Check if drag exceeds threshold OR has high velocity
    const exceededThreshold = Math.abs(effectiveDrag) > threshold;
    const highVelocity = Math.abs(velocity.y) > 500;

    if (exceededThreshold || highVelocity) {
      if (effectiveDrag < 0 || velocity.y < -500) {
        // Dragged up - go to next
        targetIndex = currentIdx + 1;
      } else if (effectiveDrag > 0 || velocity.y > 500) {
        // Dragged down - go to previous
        targetIndex = currentIdx - 1;
      }
    }

    snapToIndex(targetIndex);
  };

  // Calculate drag constraints
  const getDragConstraints = useCallback(() => {
    const itemHeight = getItemHeight();
    const maxDrag = itemHeight * 0.5; // Allow dragging up to 50% for visual feedback
    return {
      top: getYOffset(currentIndexRef.current) - maxDrag,
      bottom: getYOffset(currentIndexRef.current) + maxDrag,
    };
  }, [getItemHeight, getYOffset]);

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

        {/* Scrollable Content Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-x-0 top-0 touch-pan-x"
            style={{ touchAction: "pan-x" }}
            drag="y"
            dragConstraints={getDragConstraints()}
            dragElastic={DRAG_RESISTANCE}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ y: 0 }}
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
                    height: `calc((100vh - ${HEADER_HEIGHT}px) * ${(100 - PEEK_PERCENT) / 100})`,
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
                      opacity: isCurrent ? 1 : (isNext || isPrev) ? 0.6 : 0.3,
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
                  {isNext && !isDragging && (
                    <div
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        background: `linear-gradient(to bottom, 
                          hsl(var(--background) / 0.4) 0%, 
                          hsl(var(--background) / 0.15) 50%,
                          transparent 100%
                        )`,
                      }}
                    />
                  )}
                </div>
              );
            })}
            
            {/* Extra space at bottom */}
            <div 
              style={{ 
                height: `calc((100vh - ${HEADER_HEIGHT}px) * ${PEEK_PERCENT / 100})`,
              }} 
            />
          </motion.div>
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
          {/* Title Input */}
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

      {/* Primary Action Button */}
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
