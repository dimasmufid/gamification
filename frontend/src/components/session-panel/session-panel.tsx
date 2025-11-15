"use client";

import { SessionForm } from "@/components/session-panel/session-form";
import { ActiveTimer } from "@/components/session-panel/active-timer";
import { useGameStore } from "@/lib/store/use-game-store";
import { Card } from "@/components/ui/card";

type SessionPanelProps = {
  loading?: boolean;
};

export function SessionPanel({ loading }: SessionPanelProps) {
  const sessionStatus = useGameStore((state) => state.sessionStatus);
  const session = useGameStore((state) => state.session);

  return (
    <Card className="rounded-3xl border-white/5 bg-white/5 p-5 text-white">
      {sessionStatus === "running" && session ? (
        <ActiveTimer session={session} />
      ) : (
        <SessionForm loading={loading} />
      )}
    </Card>
  );
}
