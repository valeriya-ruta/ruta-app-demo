"use client";

import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import RecordingButton from "@/components/RecordingButton";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-background">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-8 safe-area-top">
          <button className="p-2 text-muted-foreground hover:text-foreground">
            <Trash2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-0 pt-2">
          <div className="space-y-6">
            {/* Title Input */}
            <Input
              type="text"
              placeholder="Заголовок контенту"
              className="text-base border-border/60"
            />

            {/* Script Area with Action */}
            <div className="relative">
              <Textarea
                placeholder="Розкажи, про що ти хочеш поговорити в цьому контенті. Опиши основні ідеї та ключові моменти..."
                className="min-h-[200px] pr-12 pb-14 text-base border-border/60"
              />
              <RecordingButton />
              <Button 
                variant="secondary" 
                size="sm"
                className="absolute bottom-3 left-3 px-2.5"
              >
                Створити сценарій
              </Button>
            </div>
          </div>

          {/* Secondary Action - Content-level action */}
          <div className="mt-6 pt-4 border-t border-border/40 pb-0">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/reuse")}
            >
              ✨ Перевикористати контент
            </Button>
          </div>
        </div>

        {/* Primary Action - Bottom Button */}
        <div className="w-full bg-background/95 border-t border-border px-4 pt-8 pb-3 safe-area-bottom">
          <Button className="w-full rounded-[999px]" size="lg">
            Перевірити та зняти
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
