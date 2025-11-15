"use client";

import { useEffect, useMemo, useState } from "react";
import { ActiveSession } from "@/lib/models/session";
import { secondsLeft, formatCountdown } from "@/lib/utils/timers";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelSession, completeSession } from "@/lib/api/endpoints";
import { useGameStore } from "@/lib/store/use-game-store";
import { phaserCommands } from "@/game/phaser/events";
import { toast } from "sonner"

type ActiveTimerProps = {
  session: ActiveSession;
};

export function ActiveTimer({ session }: ActiveTimerProps) {
  const [remaining, setRemaining] = useState(() => secondsLeft(session.endsAt));
  const completeAction = useGameStore((state) => state.completeSession);
  const cancelAction = useGameStore((state) => state.cancelSession);
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(secondsLeft(session.endsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.endsAt]);

  const completeMutation = useMutation({
    mutationFn: () => completeSession(session.sessionId),
    onSuccess: (payload) => {
      completeAction({
        reward: payload.reward,
        hero: payload.hero,
        worldState: payload.worldState,
        droppedItem: payload.droppedItem,
      });
      phaserCommands.emit("command:unlockMovement");
      phaserCommands.emit("command:rewardFx", { droppedItem: payload.droppedItem ?? undefined });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to complete session",{
        description: error.message,
      });
      phaserCommands.emit("command:unlockMovement");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSession(session.sessionId),
    onSuccess: () => {
      toast("Session cancelled");
    },
    onSettled: () => {
      phaserCommands.emit("command:unlockMovement");
    },
  });

  useEffect(() => {
    if (remaining <= 0 && !completeMutation.isPending) {
      completeMutation.mutate();
    }
  }, [completeMutation, remaining]);

  const formatted = useMemo(() => formatCountdown(remaining), [remaining]);

  return (
    <div className="space-y-6 text-center">
      <div>
        <p className="text-sm text-white/70">Focus Session</p>
        <p className="mt-2 text-4xl font-semibold tracking-wider">{formatted}</p>
        <p className="text-xs uppercase tracking-wide text-white/50">
          Room · {session.room}
        </p>
      </div>
      <div className="grid gap-3">
        <Button
          variant="secondary"
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? "Completing..." : "Complete Now"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            cancelAction();
            cancelMutation.mutate();
          }}
          disabled={cancelMutation.isPending}
        >
          Cancel Session
        </Button>
      </div>
    </div>
  );
}
