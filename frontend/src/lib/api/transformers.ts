import { heroSchema, inventoryItemSchema, taskTemplateSchema, worldStateSchema } from "@/lib/api/schemas";
import type { Hero } from "@/lib/models/hero";
import type { InventoryItem } from "@/lib/models/inventory";
import type { SessionTemplate } from "@/lib/models/session";
import type { WorldState } from "@/lib/models/world";
import { z } from "zod";

type HeroPayload = z.infer<typeof heroSchema>;
type WorldStatePayload = z.infer<typeof worldStateSchema>;

export function toHero(payload: HeroPayload): Hero {
  return {
    id: payload.id,
    level: payload.level,
    exp: payload.exp,
    gold: payload.gold,
    streak: payload.streak,
    equippedHatId: payload.equipped_hat_id ?? undefined,
    equippedOutfitId: payload.equipped_outfit_id ?? undefined,
    equippedAccessoryId: payload.equipped_accessory_id ?? undefined,
  };
}

export function toWorldState(payload: WorldStatePayload): WorldState {
  return {
    id: payload.id,
    userId: payload.user_id,
    studyRoomLevel: payload.study_room_level as 1 | 2,
    buildRoomLevel: payload.build_room_level as 1 | 2,
    trainingRoomLevel: payload.training_room_level as 1 | 2,
    totalSessionsSuccess: payload.total_sessions_success,
    dayStreak: payload.day_streak,
    lastSessionDate: payload.last_session_date,
  };
}

export function toInventoryItem(payload: z.infer<typeof inventoryItemSchema>): InventoryItem {
  return {
    id: payload.id,
    name: payload.name,
    type: payload.type,
    rarity: payload.rarity,
    spriteKey: payload.sprite_key,
    obtainedAt: payload.obtained_at,
  };
}

export function toTaskTemplate(payload: z.infer<typeof taskTemplateSchema>): SessionTemplate {
  return {
    id: payload.id,
    name: payload.name,
    category: payload.category,
    defaultDurationMinutes: payload.default_duration_minutes,
    room: payload.room,
  };
}
