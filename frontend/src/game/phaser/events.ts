"use client";

import mitt from "mitt";
import type { InventoryItem } from "@/lib/models/inventory";
import type { SessionRoom } from "@/lib/models/session";
import type { WorldDecorState } from "@/lib/models/world";

type PhaserToReactEvents = {
  "room:enter": { room: SessionRoom };
  "room:leave": { room: SessionRoom };
  "session:timer:done": { sessionId: string };
};

type ReactToPhaserEvents = {
  "command:lockMovement": void;
  "command:unlockMovement": void;
  "command:updateWorld": WorldDecorState;
  "command:applyCosmetics": {
    hatKey?: string;
    outfitKey?: string;
    accessoryKey?: string;
  };
  "command:rewardFx": { droppedItem?: InventoryItem | null };
};

export const phaserEvents = mitt<PhaserToReactEvents>();
export const phaserCommands = mitt<ReactToPhaserEvents>();
