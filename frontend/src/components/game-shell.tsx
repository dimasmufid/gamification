"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getProfile, listInventory, listTasks } from "@/lib/api/endpoints";
import { useGameStore } from "@/lib/store/use-game-store";
import { TopBar } from "@/components/top-bar";
import { SessionPanel } from "@/components/session-panel/session-panel";
import { RightPanel } from "@/components/right-panel/right-panel";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { RoomBadge } from "@/components/room-badge";
import { RewardModal } from "@/components/reward-modal";
import { toast } from "sonner";
import { phaserEvents, phaserCommands } from "@/game/phaser/events";
import { deriveDecorState } from "@/lib/models/world";
import type { SessionRoom } from "@/lib/models/session";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { ApiError } from "@/lib/api/client";

const PhaserCanvas = dynamic(() => import("@/game/phaser/phaser-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-slate-900/60 ring-1 ring-white/10">
      <p className="text-sm text-white/60">Loading world…</p>
    </div>
  ),
});

export function GameShell() {
  const router = useRouter();
  const setHero = useGameStore((state) => state.setHero);
  const setWorldState = useGameStore((state) => state.setWorldState);
  const setTasks = useGameStore((state) => state.setTasks);
  const setInventory = useGameStore((state) => state.setInventory);
  const rewardModal = useGameStore((state) => state.rewardModal);
  const closeRewardModal = useGameStore((state) => state.closeRewardModal);
  const setActiveRoom = useGameStore((state) => state.setActiveRoom);
  const hero = useGameStore((state) => state.hero);
  const worldState = useGameStore((state) => state.worldState);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: listTasks,
  });

  const inventoryQuery = useQuery({
    queryKey: ["inventory"],
    queryFn: listInventory,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setHero(profileQuery.data.hero);
      setWorldState(profileQuery.data.worldState);
      setAuth({
        user: profileQuery.data.user,
        organization: profileQuery.data.organization,
      });
      phaserCommands.emit(
        "command:updateWorld",
        deriveDecorState(profileQuery.data.worldState),
      );
    }
  }, [profileQuery.data, setHero, setWorldState, setAuth]);

  useEffect(() => {
    if (tasksQuery.data) {
      setTasks(tasksQuery.data);
    }
  }, [tasksQuery.data, setTasks]);

  useEffect(() => {
    if (inventoryQuery.data) {
      setInventory(inventoryQuery.data);
    }
  }, [inventoryQuery.data, setInventory]);

  useEffect(() => {
    const handler = ({ room }: { room: SessionRoom }) => setActiveRoom(room);
    phaserEvents.on("room:enter", handler);
    return () => {
      phaserEvents.off("room:enter", handler);
    };
  }, [setActiveRoom]);

  useEffect(() => {
    if (worldState) {
      phaserCommands.emit("command:updateWorld", deriveDecorState(worldState));
    }
  }, [worldState]);

  useEffect(() => {
    if (hero) {
      phaserCommands.emit("command:applyCosmetics", {
        hatKey: hero.equippedHatId,
        outfitKey: hero.equippedOutfitId,
        accessoryKey: hero.equippedAccessoryId,
      });
    }
  }, [hero]);

  useEffect(() => {
    const error =
      profileQuery.error || tasksQuery.error || inventoryQuery.error;
    if (error) {
      toast.error("Failed to load data", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [inventoryQuery.error, profileQuery.error, tasksQuery.error]);

  useEffect(() => {
    if (profileQuery.error instanceof ApiError && profileQuery.error.status === 401) {
      clearAuth();
      router.push("/sign-in");
    }
  }, [profileQuery.error, clearAuth, router]);

  const isLoading =
    profileQuery.isLoading || tasksQuery.isLoading || inventoryQuery.isLoading;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <TopBar loading={isLoading} />
      <div
        className={cn(
          "grid flex-1 gap-6 px-6 pb-10 pt-6",
          "xl:grid-cols-[320px_1fr_360px]",
          "lg:grid-cols-[280px_minmax(0,1fr)] lg:[grid-template-areas:'left center''right right']",
          "max-w-[1400px] w-full mx-auto",
        )}
      >
        <section className="xl:order-none order-2 xl:w-auto w-full">
          <SessionPanel loading={isLoading} />
        </section>

        <section className="relative order-1 min-h-[520px] rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 shadow-[0_20px_120px_rgba(15,23,42,0.6)]">
          <RoomBadge />
          <PhaserCanvas />
        </section>

        <section className="order-3 xl:order-none">
          <RightPanel loading={isLoading} />
        </section>
      </div>
      <RewardModal
        open={Boolean(rewardModal)}
        onOpenChange={(open) => {
          if (!open) {
            closeRewardModal();
          }
        }}
        reward={rewardModal ?? undefined}
      />
    </div>
  );
}
