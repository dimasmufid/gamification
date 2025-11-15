"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGameStore } from "@/lib/store/use-game-store";
import { computeHeroProgress } from "@/lib/utils/hero";
import { Coins, Flame } from "lucide-react";

type TopBarProps = {
  loading?: boolean;
};

export function TopBar({ loading }: TopBarProps) {
  const hero = useGameStore((state) => state.hero);
  const worldState = useGameStore((state) => state.worldState);
  const progress = useMemo(() => computeHeroProgress(hero), [hero]);

  if (loading && !hero) {
    return (
      <div className="w-full border-b border-white/5 bg-slate-950/70 px-6 py-4">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/70 backdrop-blur px-6 py-4">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-6">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="/avatar-placeholder.png" alt="Hero Avatar" />
            <AvatarFallback>NT</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-white/60">Hero Level</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold leading-none">
                Lv {hero?.level ?? 1}
              </span>
              <Badge variant="outline" className="text-xs">
                {hero?.exp ?? 0} XP
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Progress value={progress.progressPercent} />
          <div className="flex justify-between text-xs text-white/60">
            <span>Next level</span>
            <span>{progress.expToNextLevel - (hero?.exp ?? 0)} XP remaining</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-2">
            <div className="flex items-center gap-2 text-white/60">
              <Coins className="h-4 w-4 text-amber-300" />
              Gold
            </div>
            <p className="text-lg font-semibold text-amber-200">
              {hero?.gold ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-2">
            <div className="flex items-center gap-2 text-white/60">
              <Flame className="h-4 w-4 text-orange-400" />
              Streak
            </div>
            <p className="text-lg font-semibold text-orange-200">
              {worldState?.dayStreak ?? hero?.streak ?? 0} days
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
