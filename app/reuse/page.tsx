"use client";

import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Check, X, ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";

type IdeaStatus = "accepted" | "rejected";

const SWIPE_THRESHOLD_RIGHT = 60;  // Like threshold (displayed position)
const SWIPE_THRESHOLD_LEFT = 45;   // Dislike - easier due to ergonomics
const MAX_ROTATION = 6;
const CARD_HEIGHT = 400;

const ideas = [
  {
    id: "idea-1",
    title: "One-minute growth story",
    description:
      "Share a quick, honest moment from your creator journey. Focus on a single lesson you wish you knew earlier.",
  },
  {
    id: "idea-2",
    title: "Before vs after workflow",
    description:
      "Show how your process changed over time. Highlight one tool or habit that made the biggest difference.",
  },
  {
    id: "idea-3",
    title: "Behind-the-scenes setup",
    description:
      "Give a calm walkthrough of your recording space or kit. Keep it practical, clean, and minimal.",
  },
  {
    id: "idea-4",
    title: "Answer a common question",
    description:
      "Pick a FAQ and answer it in under 60 seconds. Start with the question and finish with a clear takeaway.",
  },
  {
    id: "idea-5",
    title: "Creative constraint challenge",
    description:
      "Create a piece of content using a single constraint. Explain how the constraint improved focus and output.",
  },
  {
    id: "idea-6",
    title: "Mini trend breakdown",
    description:
      "Break down a trend in your niche. Mention why it works and when it might not be a good fit.",
  },
  {
    id: "idea-7",
    title: "Personal process check-in",
    description:
      "Share one thing you're improving this week. Keep it reflective and practical, not overly dramatic.",
  },
  {
    id: "idea-8",
    title: "Five-second hook test",
    description:
      "Record 2–3 opening lines for the same idea. Ask which hook feels most clear and compelling.",
  },
  {
    id: "idea-9",
    title: "Tool you can’t live without",
    description:
      "Pick one app or device you use daily. Explain the specific problem it solves for you.",
  },
  {
    id: "idea-10",
    title: "A calm call-to-action",
    description:
      "Invite viewers to try a small action. Make it low-pressure and focused on progress over perfection.",
  },
];

export default function ReusePage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, IdeaStatus>>({});
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [hasHapticFired, setHasHapticFired] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [skipTransition, setSkipTransition] = useState(false);
  const [flyAwayX, setFlyAwayX] = useState<number | null>(null);
  const leaveDirection = useRef<"left" | "right" | null>(null);
  const startPoint = useRef({ x: 0, y: 0 });

  const currentIdea = ideas[currentIndex];
  const nextIdea = ideas[currentIndex + 1];

  // Calculate displayed position with lighter resistance for easier swiping
  const getDisplayedX = (rawX: number) => {
    const abs = Math.abs(rawX);
    return rawX / (1 + abs / 500); // Lighter resistance (was 320)
  };
  
  // During exit, use flyAwayX for smooth animation; during drag, apply resistance
  const displayedX = useMemo(() => {
    if (flyAwayX !== null) {
      return flyAwayX;
    }
    return getDisplayedX(drag.x);
  }, [drag.x, flyAwayX]);

  const rotation = Math.max(
    -MAX_ROTATION,
    Math.min(MAX_ROTATION, displayedX / 22)
  );
  const scale = 1 - Math.min(Math.abs(displayedX) / 1500, 0.02);
  const opacity = 1 - Math.min(Math.abs(displayedX) / 1100, 0.06);

  const progressText = `${Math.min(currentIndex + 1, ideas.length)} / ${
    ideas.length
  }`;

  // Compute border color based on swipe direction (use direction-specific thresholds)
  const swipeDirection = displayedX > 0 ? "right" : displayedX < 0 ? "left" : null;
  const currentThreshold = swipeDirection === "left" ? SWIPE_THRESHOLD_LEFT : SWIPE_THRESHOLD_RIGHT;
  const borderProgress = Math.min(Math.abs(displayedX) / currentThreshold, 1);
  const borderColor =
    swipeDirection === "right"
      ? `rgba(34, 197, 94, ${borderProgress * 0.9})`
      : swipeDirection === "left"
      ? `rgba(239, 68, 68, ${borderProgress * 0.9})`
      : "rgba(241, 245, 249, 1)";

  const commitSwipe = (direction: "left" | "right") => {
    leaveDirection.current = direction;
    const currentDisplayed = getDisplayedX(drag.x);
    
    // Phase 1: Set current position and enable fly-away transition
    setFlyAwayX(currentDisplayed);
    setIsDragging(false);
    setIsLeaving(true);
    
    // Phase 2: After browser paints with transition enabled, animate to off-screen
    // Double rAF ensures the transition CSS is applied before position changes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const distance = window.innerWidth + 400;
        setFlyAwayX(direction === "right" ? distance : -distance);
      });
    });
  };

  const resetDrag = () => {
    setDrag({ x: 0, y: 0 });
    setIsDragging(false);
    setHasHapticFired(false);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isLeaving || !currentIdea) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startPoint.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    setHasHapticFired(false);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isLeaving) return;
    const deltaX = event.clientX - startPoint.current.x;
    // Constrain vertical movement - only allow minimal drift
    const deltaY = (event.clientY - startPoint.current.y) * 0.15;
    const clampedY = Math.max(-20, Math.min(20, deltaY));
    setDrag({ x: deltaX, y: clampedY });
    // Use displayed position for threshold check (matches visual feedback)
    const displayed = getDisplayedX(deltaX);
    const threshold = deltaX < 0 ? SWIPE_THRESHOLD_LEFT : SWIPE_THRESHOLD_RIGHT;
    if (!hasHapticFired && Math.abs(displayed) >= threshold) {
      if (navigator.vibrate) {
        navigator.vibrate(8);
      }
      setHasHapticFired(true);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || isLeaving) return;
    // Use displayed position for threshold (matches visual - when border is full, card flies away)
    const displayed = getDisplayedX(drag.x);
    const threshold = drag.x < 0 ? SWIPE_THRESHOLD_LEFT : SWIPE_THRESHOLD_RIGHT;
    if (Math.abs(displayed) >= threshold) {
      commitSwipe(drag.x > 0 ? "right" : "left");
      return;
    }
    resetDrag();
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transform transition end (not border-color which is faster)
    if (e.propertyName !== "transform") return;
    if (!isLeaving || !leaveDirection.current || !currentIdea) return;
    const status: IdeaStatus =
      leaveDirection.current === "right" ? "accepted" : "rejected";
    setStatuses((prev) => ({ ...prev, [currentIdea.id]: status }));
    leaveDirection.current = null;
    setIsLeaving(false);
    setHasHapticFired(false);
    setFlyAwayX(null);
    // Skip transition so next card appears instantly (no fly-in)
    setSkipTransition(true);
    setDrag({ x: 0, y: 0 });
    setCurrentIndex((prev) => prev + 1);
    // Re-enable transitions after next paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSkipTransition(false);
      });
    });
  };

  const toggleStatus = (ideaId: string) => {
    setStatuses((prev) => ({
      ...prev,
      [ideaId]: prev[ideaId] === "accepted" ? "rejected" : "accepted",
    }));
  };

  return (
    <AppShell pageTransition="slide-up">
      <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-background">
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          {progressText}
        </div>

        {currentIndex >= ideas.length ? (
          <div className="flex flex-col flex-1 px-5 pb-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold">Review your ideas</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Toggle any item before confirming.
              </p>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {ideas.map((idea) => {
                const status = statuses[idea.id] ?? "rejected";
                const isAccepted = status === "accepted";
                return (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => toggleStatus(idea.id)}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-150 ease-out active:scale-[0.98] active:brightness-[0.98] ${
                      isAccepted
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-rose-200 bg-rose-50/60"
                    }`}
                  >
                    <span
                      className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full ${
                        isAccepted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {isAccepted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{idea.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {idea.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-6">
              <Button
                className="w-full rounded-[999px]"
                onClick={() => {
                  setIsConfirmed(true);
                  router.push("/create?fromSwipe=true");
                }}
              >
                Continue
              </Button>
              {isConfirmed && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Selection confirmed for demo. No data has been saved.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center px-5">
              <div
                className="relative flex items-center justify-center w-full"
                style={{ height: CARD_HEIGHT }}
              >
                {nextIdea && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-[28px] bg-white px-6 text-center shadow-[0_14px_35px_rgba(15,23,42,0.08)] border border-slate-100"
                    style={{
                      transform: "translateY(12px) scale(0.988)",
                    }}
                  >
                    <h2 className="text-2xl font-semibold text-foreground">
                      {nextIdea.title}
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {nextIdea.description}
                    </p>
                  </div>
                )}

                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onTransitionEnd={handleTransitionEnd}
                  className="relative z-10 flex h-full w-full flex-col items-center justify-center rounded-[28px] bg-white px-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
                  style={{
                    transform: `translate3d(${displayedX}px, ${drag.y}px, 0) rotate(${rotation}deg) scale(${scale})`,
                    opacity: isLeaving ? 0.9 : opacity,
                    border: `2px solid ${borderColor}`,
                    transition: skipTransition
                      ? "none"
                      : isDragging
                      ? "border-color 80ms ease"
                      : isLeaving
                      ? "transform 380ms cubic-bezier(0.32, 0, 0.67, 0), opacity 380ms ease, border-color 100ms ease"
                      : "transform 280ms ease-out, opacity 280ms ease-out, border-color 200ms ease",
                    touchAction: "pan-y",
                  }}
                >
                  <h2 className="text-2xl font-semibold text-foreground">
                    {currentIdea.title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {currentIdea.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span>Swipe left if you don’t like the idea</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Swipe right if you like the idea</span>
                  <ThumbsUp className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
