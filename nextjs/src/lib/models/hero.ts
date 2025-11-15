export type CosmeticSlot = "hat" | "outfit" | "accessory";

export interface Hero {
  id: string;
  level: number;
  exp: number;
  gold: number;
  streak: number;
  equippedHatId?: string;
  equippedOutfitId?: string;
  equippedAccessoryId?: string;
}

export interface HeroProgress {
  expToNextLevel: number;
  progressPercent: number;
}
