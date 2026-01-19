"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useAnimation, PanInfo, AnimatePresence } from "framer-motion";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import RecordingButton from "@/components/RecordingButton";
import { X, Trash2, Info } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// All content data - 6 items total
const ALL_CONTENT_ITEMS = [
  { id: 1, title: "One-minute growth story", description: "Share a quick, honest moment from your creator journey." },
  { id: 2, title: "Before vs after workflow", description: "Show how your process changed over time." },
  { id: 3, title: "Behind-the-scenes setup", description: "Give a calm walkthrough of your recording space." },
  { id: 4, title: "Answer a common question", description: "Pick a FAQ and answer it in under 60 seconds." },
  { id: 5, title: "Creative constraint challenge", description: "Create content using a single constraint." },
  { id: 6, title: "Mini trend breakdown", description: "Break down a trend in your niche." },
];

// Header height in pixels
const HEADER_HEIGHT = 56;
// Peek amount percentage
const PEEK_PERCENT = 10;
// Threshold to trigger snap (percentage of item height user must drag)
const SNAP_THRESHOLD_PERCENT = 35;
// Resistance factor
const DRAG_RESISTANCE = 0.4;

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const currentIndexRef = useRef(0);
  
  // Demo state: track if we should show all items or just one
  const [showAllItems, setShowAllItems] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const hasAnimated = useRef(false);

  // Check if we just came from the swipe deck
  useEffect(() => {
    const fromSwipe = searchParams.get("fromSwipe") === "true";
    
    if (fromSwipe && !hasAnimated.current) {
      // Delay the reveal animation for dramatic effect
      hasAnimated.current = true;
      setIsAnimating(true);
      
      // Clear the URL param
      window.history.replaceState({}, "", "/create");
      
      // Show the items with animation after a brief pause
      setTimeout(() => {
        setShowAllItems(true);
        // End animation state after items have appeared
        setTimeout(() => {
          setIsAnimating(false);
          // Show the info popup
          setShowPopup(true);
          // Auto-hide popup after 4 seconds
          setTimeout(() => {
            setShowPopup(false);
          }, 4000);
        }, 600);
      }, 400);
    }
    // On regular page load (no fromSwipe param), always start with 1 item
    // This allows easy demo restart by refreshing the page
  }, [searchParams]);

  // Get the items to display (add empty state as last item when showing all)
  const displayedItems = showAllItems 
    ? [...ALL_CONTENT_ITEMS, { id: 0, title: "", description: "", isEmptyState: true }] 
    : [ALL_CONTENT_ITEMS[0]];
  const itemCount = displayedItems.length;
  // For the counter, don't count the empty state
  const contentItemCount = showAllItems ? ALL_CONTENT_ITEMS.length : 1;

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
    if (itemCount <= 1) return; // No dragging if only 1 item
    setIsDragging(true);
  };

  // Handle drag end - determine if we should snap to next/prev or stay
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (itemCount <= 1) return; // No snapping if only 1 item
    setIsDragging(false);
    
    const { offset, velocity } = info;
    const itemHeight = getItemHeight();
    const threshold = itemHeight * (SNAP_THRESHOLD_PERCENT / 100);
    
    const currentIdx = currentIndexRef.current;
    let targetIndex = currentIdx;

    const effectiveDrag = offset.y;
    const exceededThreshold = Math.abs(effectiveDrag) > threshold;
    const highVelocity = Math.abs(velocity.y) > 500;

    if (exceededThreshold || highVelocity) {
      if (effectiveDrag < 0 || velocity.y < -500) {
        targetIndex = currentIdx + 1;
      } else if (effectiveDrag > 0 || velocity.y > 500) {
        targetIndex = currentIdx - 1;
      }
    }

    snapToIndex(targetIndex);
  };

  // Calculate drag constraints
  const getDragConstraints = useCallback(() => {
    if (itemCount <= 1) {
      // No dragging allowed with single item
      return { top: 0, bottom: 0 };
    }
    const itemHeight = getItemHeight();
    const maxDrag = itemHeight * 0.5;
    return {
      top: getYOffset(currentIndexRef.current) - maxDrag,
      bottom: getYOffset(currentIndexRef.current) + maxDrag,
    };
  }, [getItemHeight, getYOffset, itemCount]);


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

          {/* Item counter - hide on empty state */}
          <span className="text-sm text-muted-foreground tabular-nums">
            {currentIndex < contentItemCount 
              ? `${currentIndex + 1}/${contentItemCount}`
              : `${contentItemCount}/${contentItemCount}`
            }
          </span>

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
            style={{ touchAction: itemCount > 1 ? "pan-x" : "none" }}
            drag={itemCount > 1 ? "y" : false}
            dragConstraints={getDragConstraints()}
            dragElastic={DRAG_RESISTANCE}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ y: 0 }}
          >
            <AnimatePresence mode="popLayout">
              {displayedItems.map((item, index) => {
                const isNext = index === currentIndex + 1;
                const isCurrent = index === currentIndex;
                const isPrev = index === currentIndex - 1;
                const isNewItem = index > 0 && showAllItems;

                return (
                  <motion.div
                    key={item.id}
                    initial={isNewItem ? { opacity: 0, y: 40, scale: 0.95 } : false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: isNewItem ? (index - 1) * 0.08 : 0,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
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
                      {/* Content Form or Empty State */}
                      {'isEmptyState' in item && item.isEmptyState ? (
                        <EmptyStateScreen router={router} isCurrent={isCurrent} />
                      ) : (
                        <ContentItemForm 
                          item={item} 
                          router={router}
                          isCurrent={isCurrent}
                        />
                      )}
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Extra space at bottom */}
            <div 
              style={{ 
                height: `calc((100vh - ${HEADER_HEIGHT}px) * ${PEEK_PERCENT / 100})`,
              }} 
            />
          </motion.div>
          
        </div>

        {/* Info popup */}
        <AnimatePresence>
          {showPopup && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-6 left-4 right-4 z-40"
            >
              <div 
                className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-secondary/95 backdrop-blur-sm border border-border/40 shadow-lg"
                onClick={() => setShowPopup(false)}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed pt-1">
                  Нові згенеровані ідеї будуть нижче — гортай вниз, щоб їх побачити!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              defaultValue={item.description}
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
            
            {/* Primary Action Button */}
            <Button 
              className="w-full rounded-[999px] mt-3" 
              size="lg"
              tabIndex={isCurrent ? 0 : -1}
            >
              Перевірити та зняти
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state screen component
interface EmptyStateScreenProps {
  router: ReturnType<typeof useRouter>;
  isCurrent: boolean;
}

function EmptyStateScreen({ router, isCurrent }: EmptyStateScreenProps) {
  return (
    <div className={`h-full flex flex-col items-center justify-center px-6 ${!isCurrent ? 'pointer-events-none' : ''}`}>
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Закінчились ідеї?
        </h2>
        <p className="text-muted-foreground mb-8">
          Ти завжди можеш згенерувати нові! Натискай на кнопку нижче
        </p>
        <Button 
          className="rounded-[999px] px-8" 
          size="lg"
          onClick={() => router.push("/reuse")}
          tabIndex={isCurrent ? 0 : -1}
        >
          Згенерувати більше ідей
        </Button>
      </div>
    </div>
  );
}
