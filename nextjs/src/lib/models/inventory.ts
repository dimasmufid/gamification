export type Rarity = "common" | "rare" | "epic";

export interface InventoryItem {
  id: string;
  name: string;
  type: "hat" | "outfit" | "accessory";
  rarity: Rarity;
  spriteKey: string;
  obtainedAt: string;
  isEquipped?: boolean;
  isNew?: boolean;
}
