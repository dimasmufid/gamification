"use client";

import { create } from "zustand";
import type { Hero } from "@/lib/models/hero";
import type { InventoryItem } from "@/lib/models/inventory";
import type {
  ActiveSession,
  RewardPayload,
  SessionRoom,
  SessionStatus,
  SessionTemplate,
} from "@/lib/models/session";
import type { WorldState } from "@/lib/models/world";

type RewardModalState = (RewardPayload & { droppedItem?: InventoryItem | null }) | null;

interface GameState {
  hero?: Hero;
  worldState?: WorldState;
  tasks: SessionTemplate[];
  inventory: InventoryItem[];
  activeRoom: SessionRoom;
  sessionStatus: SessionStatus;
  session?: ActiveSession | null;
  rewardModal: RewardModalState;
  selectedTaskId?: string;
  setHero: (hero: Hero) => void;
  setWorldState: (world: WorldState) => void;
  setTasks: (tasks: SessionTemplate[]) => void;
  setInventory: (items: InventoryItem[]) => void;
  setActiveRoom: (room: SessionRoom) => void;
  startSession: (session: ActiveSession) => void;
  completeSession: (payload: { reward: RewardPayload; hero: Hero; worldState: WorldState; droppedItem?: InventoryItem | null }) => void;
  cancelSession: () => void;
  openRewardModal: (payload: RewardModalState) => void;
  closeRewardModal: () => void;
  setSelectedTaskId: (id?: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  tasks: [],
  inventory: [],
  activeRoom: "plaza",
  sessionStatus: "idle",
  session: null,
  rewardModal: null,
  selectedTaskId: undefined,
  setHero: (hero) => set({ hero }),
  setWorldState: (worldState) => set({ worldState }),
  setTasks: (tasks) => set({ tasks }),
  setInventory: (inventory) => set({ inventory }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  startSession: (session) =>
    set({
      session,
      sessionStatus: "running",
    }),
  completeSession: ({ reward, hero, worldState, droppedItem }) =>
    set({
      hero,
      worldState,
      rewardModal: { ...reward, droppedItem },
      sessionStatus: "success",
      session: null,
    }),
  cancelSession: () =>
    set({
      session: null,
      sessionStatus: "idle",
    }),
  openRewardModal: (payload) =>
    set({
      rewardModal: payload,
    }),
  closeRewardModal: () =>
    set({
      rewardModal: null,
      sessionStatus: "idle",
    }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
}));
