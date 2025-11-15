"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { InventoryItem } from "@/lib/models/inventory";

type RewardModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward?: {
    expReward: number;
    goldReward: number;
    droppedItem?: InventoryItem | null;
  };
};

export function RewardModal({ open, onOpenChange, reward }: RewardModalProps) {
  if (!reward) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Session Complete!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">Rewards</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-semibold text-cyan-200">
                +{reward.expReward} XP
              </span>
              <span className="text-lg font-semibold text-amber-200">
                +{reward.goldReward} Gold
              </span>
            </div>
          </div>

          {reward.droppedItem && (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-300/5 p-4">
              <p className="text-sm text-amber-200">New Cosmetic</p>
              <p className="text-xl font-semibold text-white">
                {reward.droppedItem.name}
              </p>
              <p className="text-sm text-white/70 capitalize">
                {reward.droppedItem.rarity} · {reward.droppedItem.type}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
