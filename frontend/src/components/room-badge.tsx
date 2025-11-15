"use client";

import { useEffect, useState } from "react";
import { phaserEvents } from "@/game/phaser/events";
import type { SessionRoom } from "@/lib/models/session";
import { cn } from "@/lib/utils";

const roomLabels: Record<SessionRoom, string> = {
  plaza: "Central Plaza",
  study: "Study Room",
  build: "Build Room",
  training: "Training Grounds",
};

export function RoomBadge() {
  const [room, setRoom] = useState<SessionRoom>("plaza");

  useEffect(() => {
    const enterHandler = ({ room: active }: { room: SessionRoom }) => setRoom(active);
    phaserEvents.on("room:enter", enterHandler);
    return () => {
      phaserEvents.off("room:enter", enterHandler);
    };
  }, []);

  return (
    <div
      className={cn(
        "absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-1 text-sm font-medium text-white shadow-lg backdrop-blur",
      )}
    >
      {roomLabels[room]}
    </div>
  );
}
