"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";

interface VerticalSnapScrollerProps {
  children: ReactNode[];
  onIndexChange?: (index: number) => void;
  initialIndex?: number;
  peekAmount?: number; // percentage of next item visible (0-1)
  snapThreshold?: number; // pixels required to trigger snap
  velocityThreshold?: number; // velocity required to trigger snap
  resistance?: number; // drag resistance factor (higher = more resistance)
}

export default function VerticalSnapScroller({
  children,
  onIndexChange,
  initialIndex = 0,
  peekAmount = 0.1, // 10% peek
  snapThreshold = 80,
  velocityThreshold = 300,
  resistance = 0.55,
}: VerticalSnapScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const itemCount = React.Children.count(children);

  // Each item takes (1 - peekAmount) of container, leaving peekAmount visible for next
  const itemHeight = containerHeight * (1 - peekAmount);
  const peekHeight = containerHeight * peekAmount;

  // Update container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height;
        setContainerHeight(height);
      }
    };

    // Initial measurement with a small delay to ensure layout is complete
    const timer = setTimeout(updateHeight, 50);
    
    window.addEventListener("resize", updateHeight);
    
    // Also observe for layout changes
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

  // Calculate the Y offset for current index
  const getYOffset = useCallback(
    (index: number) => {
      return -index * itemHeight;
    },
    [itemHeight]
  );

  // Apply resistance to drag (rubber band effect)
  const applyResistance = useCallback((delta: number, currentIdx: number) => {
    const isOverscrollingTop = currentIdx === 0 && delta > 0;
    const isOverscrollingBottom = currentIdx === itemCount - 1 && delta < 0;
    
    if (isOverscrollingTop || isOverscrollingBottom) {
      const sign = delta > 0 ? 1 : -1;
      const absValue = Math.abs(delta);
      return sign * Math.pow(absValue, 0.7) * 0.4;
    }
    
    return delta * resistance;
  }, [itemCount, resistance]);

  // Snap to index with smooth animation
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
        onIndexChange?.(clampedIndex);

        // Haptic feedback
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    },
    [controls, currentIndex, getYOffset, itemCount, onIndexChange]
  );

  // Initialize position when container height is known
  useEffect(() => {
    if (containerHeight > 0) {
      snapToIndex(initialIndex, true);
    }
  }, [containerHeight, initialIndex, snapToIndex]);

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end - determine snap direction
  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);

    const { offset, velocity } = info;
    const dragDistance = offset.y;
    const dragVelocity = velocity.y;

    let targetIndex = currentIndex;

    const distanceTriggered = Math.abs(dragDistance) > snapThreshold;
    const velocityTriggered = Math.abs(dragVelocity) > velocityThreshold;

    if (distanceTriggered || velocityTriggered) {
      if (dragDistance < 0 || dragVelocity < -velocityThreshold) {
        targetIndex = currentIndex + 1;
      } else if (dragDistance > 0 || dragVelocity > velocityThreshold) {
        targetIndex = currentIndex - 1;
      }
    }

    snapToIndex(targetIndex);
  };

  // Drag constraints
  const getDragConstraints = () => {
    const topConstraint = -((itemCount - 1) * itemHeight) - containerHeight * 0.15;
    const bottomConstraint = containerHeight * 0.15;
    return { top: topConstraint, bottom: bottomConstraint };
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden touch-none select-none"
      style={{ touchAction: "none" }}
    >
      {containerHeight > 0 ? (
        <motion.div
          className="w-full will-change-transform"
          drag="y"
          dragConstraints={getDragConstraints()}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          animate={controls}
          initial={{ y: getYOffset(initialIndex) }}
          dragTransition={{
            bounceStiffness: 400,
            bounceDamping: 40,
            power: resistance,
          }}
        >
          {React.Children.map(children, (child, index) => {
            const isNext = index === currentIndex + 1;
            const isPrevious = index === currentIndex - 1;
            const isCurrent = index === currentIndex;

            return (
              <div
                key={index}
                className="relative w-full"
                style={{
                  height: itemHeight,
                }}
              >
                {/* Content container */}
                <motion.div 
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    borderTopLeftRadius: isNext ? 20 : 0,
                    borderTopRightRadius: isNext ? 20 : 0,
                  }}
                  animate={{
                    opacity: isCurrent ? 1 : isNext ? (isDragging ? 1 : 0.85) : isPrevious ? 0.6 : 0.3,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {child}
                </motion.div>

                {/* Top shadow/edge for next item - creates depth illusion */}
                {isNext && (
                  <div
                    className="absolute inset-x-0 top-0 pointer-events-none z-20"
                    style={{
                      height: 24,
                      background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.15), transparent)",
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                    }}
                  />
                )}

                {/* Peek fade overlay - subtle gradient to hint content continues */}
                {isNext && !isDragging && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      background: `linear-gradient(to bottom, 
                        hsl(var(--background) / 0.7) 0%, 
                        hsl(var(--background) / 0.3) 50%,
                        transparent 100%
                      )`,
                    }}
                  />
                )}
              </div>
            );
          })}
          
          {/* Extra space at bottom to allow last item to scroll fully */}
          <div style={{ height: peekHeight }} />
        </motion.div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
