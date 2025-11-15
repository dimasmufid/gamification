import {
  ActiveOrganizationPayload,
  OrganizationPayload,
  heroSchema,
  inventoryItemSchema,
  profileResponseSchema,
  taskTemplateSchema,
  worldStateSchema,
} from "@/lib/api/schemas";
import type { Hero } from "@/lib/models/hero";
import type { InventoryItem } from "@/lib/models/inventory";
import type { SessionTemplate } from "@/lib/models/session";
import type { WorldState } from "@/lib/models/world";
import type {
  ActiveOrganization,
  AuthenticatedUser,
  Organization,
  OrganizationMembership,
} from "@/lib/models/user";
import { z } from "zod";

type HeroPayload = z.infer<typeof heroSchema>;
type WorldStatePayload = z.infer<typeof worldStateSchema>;
type UserPayload = z.infer<typeof profileResponseSchema>["user"];
type MembershipPayload = z.infer<typeof profileResponseSchema>["user"]["memberships"][number];

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

export function toOrganization(payload: OrganizationPayload): Organization {
  return {
    id: payload.id,
    name: payload.name,
    slug: payload.slug,
    businessImage: payload.business_image,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at ?? null,
  };
}

export function toMembership(payload: MembershipPayload): OrganizationMembership {
  return {
    organization: toOrganization(payload.organization),
    role: payload.role,
    isDefault: payload.is_default,
  };
}

export function toActiveOrganization(payload: ActiveOrganizationPayload): ActiveOrganization {
  return {
    ...toOrganization(payload),
    role: payload.role,
    isDefault: payload.is_default,
  };
}

export function toUser(payload: UserPayload): AuthenticatedUser {
  return {
    id: payload.id,
    email: payload.email,
    fullName: payload.full_name,
    profilePicture: payload.profile_picture,
    memberships: payload.memberships.map(toMembership),
    activeOrganizationId: payload.active_organization_id ?? undefined,
  };
}
