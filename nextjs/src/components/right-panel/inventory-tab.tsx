"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InventoryItem } from "@/lib/models/inventory";
import { CosmeticCard } from "@/components/cosmetic-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGameStore } from "@/lib/store/use-game-store";
import { useMutation } from "@tanstack/react-query";
import { equipItem } from "@/lib/api/endpoints";
import { toast } from "sonner"

type InventoryTabProps = {
  items: InventoryItem[];
  loading?: boolean;
};

export function InventoryTab({ items, loading }: InventoryTabProps) {
  const hero = useGameStore((state) => state.hero);
  const setHero = useGameStore((state) => state.setHero);

  const mutation = useMutation({
    mutationFn: (item: InventoryItem) => equipItem(item.id),
    onSuccess: (_, item) => {
      if (!hero) return;
      const updated = { ...hero };
      if (item.type === "hat") updated.equippedHatId = item.id;
      if (item.type === "outfit") updated.equippedOutfitId = item.id;
      if (item.type === "accessory") updated.equippedAccessoryId = item.id;
      setHero(updated);
      toast("Equipped!",{
        description: `${item.name} equipped successfully.`,
      });
    },
    onError: (error: Error) =>
      toast.error("Unable to equip item", {
        description: error.message,
      }),
  });

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime());
  }, [items]);

  if (loading && !items.length) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="text-sm text-white/60">
        Finish a session to unlock your first cosmetic drop.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[420px] pr-2">
      <div className="grid gap-3">
        {sorted.map((item) => (
          <CosmeticCard
            key={item.id}
            item={item}
            isEquipped={
              hero?.equippedHatId === item.id ||
              hero?.equippedOutfitId === item.id ||
              hero?.equippedAccessoryId === item.id
            }
            onEquip={(selected) => mutation.mutate(selected)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
