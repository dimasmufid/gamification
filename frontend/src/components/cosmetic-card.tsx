"use client";

import type { InventoryItem } from "@/lib/models/inventory";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CosmeticCardProps = {
  item: InventoryItem;
  onEquip?: (item: InventoryItem) => void;
  isEquipped?: boolean;
};

const rarityColors: Record<InventoryItem["rarity"], string> = {
  common: "from-slate-800 to-slate-900",
  rare: "from-sky-700/60 to-slate-900",
  epic: "from-violet-700/60 to-slate-900",
};

export function CosmeticCard({ item, onEquip, isEquipped }: CosmeticCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-gradient-to-br p-4 text-white shadow",
        rarityColors[item.rarity],
      )}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
        <span>{item.rarity}</span>
        {item.isNew && (
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-amber-200">
            New
          </span>
        )}
      </div>
      <p className="mt-2 text-lg font-semibold">{item.name}</p>
      <p className="text-sm text-white/70 capitalize">{item.type}</p>
      <Button
        variant={isEquipped ? "secondary" : "default"}
        className="mt-4 w-full"
        onClick={() => onEquip?.(item)}
      >
        {isEquipped ? "Equipped" : "Equip"}
      </Button>
    </div>
  );
}
