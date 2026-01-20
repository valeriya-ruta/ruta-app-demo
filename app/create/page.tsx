"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { motion, useAnimation, PanInfo, AnimatePresence, useDragControls } from "framer-motion";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import RecordingButton from "@/components/RecordingButton";
import { X, Trash2, Info } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// Base item (first one with transcription/script demo)
const BASE_ITEM = { 
  id: 0, 
  title: "Регулярність контенту ≠ дисципліна (для креативних людей)", 
  description: "• Чому більшості людей насправді складно постити регулярно?\n• Що для мене важливіше в контенті — дисципліна чи стан і ресурс?\n• Як би виглядав регулярний контент, якби він будувався навколо потоку?" 
};

// Additional items from swipe selection (1, 3, 4, 5, 7)
const SWIPED_ITEMS = [
  { id: 1, title: "POV: я думаю, що лінь заважає мені постити", description: "• Що я зазвичай звинувачую, коли не виходить регулярно?\n• Це справді лінь — чи перевантаження?\n• Коли контент починає відчуватись як ще одна задача?" },
  { id: 3, title: "Регулярність — це проблема енергії, а не часу", description: "• Чи справді мені бракує часу?\n• В яких станах я можу створювати контент легше?\n• Що забирає енергію перед зйомкою або письмом?" },
  { id: 4, title: "Чому контент зривається через постійні переключення", description: "• Скільки разів на день я перемикаюсь між задачами?\n• Що відбувається з думкою після цих переключень?\n• Чи можу я повертатись у контент без втрати фокусу?" },
  { id: 5, title: "Для новачків: чому складно постити регулярно", description: "• Чого я очікую від себе на старті?\n• Чи не намагаюсь я робити \"ідеально\" з першого разу?\n• Що було б, якби я спростила процес?" },
  { id: 7, title: "Чому планери і Notion не вирішують проблему контенту", description: "• Що саме я там організовую — і чи створюю контент?\n• Чи не стало планування заміною дії?\n• Коли я востаннє поверталась до старих ідей?" },
];

// Header height in pixels
const HEADER_HEIGHT = 56;
// Peek amount percentage
const PEEK_PERCENT = 10;
// Threshold to trigger snap (percentage of item height user must drag)
const SNAP_THRESHOLD_PERCENT = 35;
// Resistance factor
const DRAG_RESISTANCE = 0.4;

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const currentIndexRef = useRef(0);
  const dragControls = useDragControls();
  
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
    ? [BASE_ITEM, ...SWIPED_ITEMS, { id: -1, title: "", description: "", isEmptyState: true }] 
    : [BASE_ITEM];
  const itemCount = displayedItems.length;
  // For the counter, don't count the empty state (6 items when showing all: 1 base + 5 swiped)
  const contentItemCount = showAllItems ? 1 + SWIPED_ITEMS.length : 1;

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
            className="absolute inset-x-0 top-0"
            drag={itemCount > 1 ? "y" : false}
            dragControls={dragControls}
            dragConstraints={getDragConstraints()}
            dragElastic={DRAG_RESISTANCE}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ y: 0 }}
            dragListener={false}
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
                      className="absolute inset-0 bg-background"
                      style={{
                        borderTopLeftRadius: isNext ? 16 : 0,
                        borderTopRightRadius: isNext ? 16 : 0,
                        overflow: isCurrent ? 'visible' : 'hidden',
                      }}
                      initial={false}
                      animate={{
                        opacity: isCurrent ? 1 : (isNext || isPrev) ? 0.6 : 0.3,
                      }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Drag handle at top of next item (peek area) */}
                      {isNext && itemCount > 1 && (
                        <div 
                          className="absolute inset-x-0 top-0 h-full cursor-grab active:cursor-grabbing z-30"
                          onPointerDown={(e) => dragControls.start(e)}
                          style={{ touchAction: 'none' }}
                        >
                          {/* Visual drag indicator */}
                          <div className="flex justify-center pt-3">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                          </div>
                        </div>
                      )}
                      {/* Content Form or Empty State */}
                      {'isEmptyState' in item && item.isEmptyState ? (
                        <EmptyStateScreen router={router} isCurrent={isCurrent} />
                      ) : (
                        <ContentItemForm 
                          item={item} 
                          router={router}
                          isCurrent={isCurrent}
                          onDragHandlePointerDown={(e) => dragControls.start(e)}
                          showDragHandle={itemCount > 1 && index > 0}
                          prefilledScript={showAllItems && index === 0}
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
            
            {/* Extra space at bottom - also a drag handle */}
            <div 
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => itemCount > 1 && dragControls.start(e)}
              style={{ 
                height: `calc((100vh - ${HEADER_HEIGHT}px) * ${PEEK_PERCENT / 100})`,
                touchAction: 'none',
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

// Demo transcription text
const DEMO_TRANSCRIPTION = "Мені на консультаціях часто кажуть, що я людина креативна, мені дуже важко вести контент регулярно, тому що в мене дуже багато ідей, але я не встигаю їх всі зробити. І тому що контент – це дуже багато роботи, і реально кожного дня не встигаєш. Але якщо війти в потік, то виходить набагато краще. І дисципліна на таких людей зазвичай не працює. Працює система, де можна записати свої ідеї, наприклад, в нотатки і потім до них повертатися періодично і це буде підтримувати енергію. А взагалі геніально це використовувати або штучний інтелект, або реального асистента, щоб він допомагав це перетворювати на реальний контент.";

const GENERATED_SCRIPT = `Ти хочеш вести блог, але постиш 1–2 рази на тиждень і думаєш, що проблема в дисципліні?

Насправді, справа не в дисципліні і навіть не в мотивації.

Більшість креативних людей, як ти, просто не можуть постійно працювати "по плану".
Тому що креативність працює інакше — вона з'являється в потоці, ресурсі, та енергії.

І якщо ти можеш легко входити в цей потік, проблема з регулярністю зникає сама собою.

Для цього тобі не потрібна жорстка система і список правил, бо вони навпаки тільки зупиняють твій креатив.
Тобі потрібна система, яка підтримає цей потік енергії - і ти одразу побачиш, як легко тобі створювати контент!`;

// Separate component for each content item's form
interface ContentItemFormProps {
  item: { id: number; title: string; description: string };
  router: ReturnType<typeof useRouter>;
  isCurrent: boolean;
  onDragHandlePointerDown?: (e: React.PointerEvent) => void;
  showDragHandle?: boolean;
  prefilledScript?: boolean; // Show the generated script immediately
}

function ContentItemForm({ item, router, isCurrent, onDragHandlePointerDown, showDragHandle, prefilledScript }: ContentItemFormProps) {
  const [transcribedText, setTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const hasTranscribed = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Script generation state
  const [scriptState, setScriptState] = useState<'idle' | 'loading' | 'transforming' | 'done'>('idle');
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [isTextFadingOut, setIsTextFadingOut] = useState(false);
  const hasGeneratedScript = useRef(false);

  // When prefilledScript becomes true, set the generated script
  useEffect(() => {
    if (prefilledScript && !hasGeneratedScript.current) {
      setTranscribedText(GENERATED_SCRIPT);
      setScriptState('done');
      hasTranscribed.current = true;
      hasGeneratedScript.current = true;
    }
  }, [prefilledScript]);

  // Auto-expand textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set to scrollHeight, with a minimum of 160px
      const newHeight = Math.max(160, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [transcribedText]);

  // Handle script generation with magical animation
  const handleGenerateScript = useCallback(() => {
    if (hasGeneratedScript.current || scriptState !== 'idle') return;
    hasGeneratedScript.current = true;
    
    setScriptState('loading');
    
    // After 3 seconds, start the transformation
    setTimeout(() => {
      setScriptState('transforming');
      setIsTextFadingOut(true);
      
      // Split script into lines for animation
      const lines = GENERATED_SCRIPT.split('\n');
      
      // Start revealing lines after old text fades (500ms)
      setTimeout(() => {
        setTranscribedText(''); // Clear old text
        setIsTextFadingOut(false);
        
        // Reveal lines one by one
        lines.forEach((line, index) => {
          setTimeout(() => {
            setVisibleLines(prev => [...prev, line]);
            // Update textarea with visible lines for proper height calculation
            setTranscribedText(lines.slice(0, index + 1).join('\n'));
          }, index * 180); // 180ms between each line
        });
        
        // Mark as done after all lines are revealed
        setTimeout(() => {
          setScriptState('done');
        }, lines.length * 180 + 300);
      }, 500);
    }, 3000);
  }, [scriptState]);

  // Simulate live voice transcription with bunched words
  const startTranscriptionDemo = useCallback(() => {
    // Only run once per page load
    if (hasTranscribed.current || isTranscribing) return;
    hasTranscribed.current = true;
    setIsTranscribing(true);

    const words = DEMO_TRANSCRIPTION.split(" ");
    let currentIndex = 0;
    let currentText = "";

    // Wait 1 second before starting
    setTimeout(() => {
      const addNextBunch = () => {
        if (currentIndex >= words.length) {
          setIsTranscribing(false);
          return;
        }

        // Random bunch size: 1-5 words
        const bunchSize = Math.floor(Math.random() * 5) + 1;
        const endIndex = Math.min(currentIndex + bunchSize, words.length);
        
        // Add words one by one with tiny delays within the bunch
        const addWordsInBunch = (idx: number) => {
          if (idx >= endIndex) {
            // After bunch is complete, wait longer before next bunch (300-600ms)
            const pauseBetweenBunches = Math.floor(Math.random() * 300) + 300;
            setTimeout(addNextBunch, pauseBetweenBunches);
            return;
          }

          // Add the word
          currentText += (currentText ? " " : "") + words[idx];
          setTranscribedText(currentText);
          
          // Tiny delay between words in same bunch (20-80ms)
          const wordDelay = Math.floor(Math.random() * 60) + 20;
          setTimeout(() => addWordsInBunch(idx + 1), wordDelay);
        };

        addWordsInBunch(currentIndex);
        currentIndex = endIndex;
      };

      addNextBunch();
    }, 1000);
  }, [isTranscribing]);

  return (
    <div className={`h-full flex flex-col ${!isCurrent ? 'pointer-events-none' : ''}`}>
      {/* Drag handle at top for going to previous item */}
      {showDragHandle && (
        <div 
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing flex-shrink-0"
          onPointerDown={onDragHandlePointerDown}
          style={{ touchAction: 'none' }}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      )}
      {/* Content area - scrollable */}
      <div className={`flex-1 ${showDragHandle ? 'pt-2' : 'pt-6'} px-4 overflow-y-auto overscroll-contain pb-6`}>
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
            {/* Hidden textarea for height calculation */}
            <Textarea
              ref={textareaRef}
              placeholder={item.description || "Розкажи, про що ти хочеш поговорити в цьому контенті. Опиши основні ідеї та ключові моменти..."}
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              className={`min-h-[160px] pr-12 pb-14 text-base border-border/60 resize-none overflow-hidden transition-opacity duration-500 ${
                isTextFadingOut ? 'opacity-0' : scriptState === 'transforming' ? 'opacity-0' : 'opacity-100'
              }`}
              tabIndex={isCurrent ? 0 : -1}
              readOnly={!isCurrent || scriptState !== 'idle'}
            />
            
            {/* Magical text overlay during transformation */}
            {scriptState === 'transforming' && visibleLines.length > 0 && (
              <div className="absolute inset-0 px-4 py-3 pointer-events-none overflow-hidden">
                <div className="text-base text-foreground leading-relaxed">
                  {visibleLines.map((line, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      className={line === '' ? 'h-6' : ''}
                    >
                      {line}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            <RecordingButton onRecordingStart={startTranscriptionDemo} />
            <Button 
              variant="secondary" 
              size="sm"
              className="absolute bottom-3 left-3 px-2.5 gap-2"
              tabIndex={isCurrent ? 0 : -1}
              onClick={handleGenerateScript}
              disabled={scriptState !== 'idle'}
            >
              {scriptState === 'loading' && (
                <motion.div
                  className="w-4 h-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
              {scriptState === 'idle' && 'Створити сценарій'}
              {scriptState === 'loading' && 'Пишу сценарій...'}
              {(scriptState === 'transforming' || scriptState === 'done') && 'Сценарій готовий ✓'}
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

// Default export with Suspense wrapper for useSearchParams
export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  );
}
