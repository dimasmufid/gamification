import { z } from "zod";

export const heroSchema = z.object({
  id: z.string(),
  level: z.number(),
  exp: z.number(),
  gold: z.number(),
  streak: z.number(),
  equipped_hat_id: z.string().uuid().nullable(),
  equipped_outfit_id: z.string().uuid().nullable(),
  equipped_accessory_id: z.string().uuid().nullable(),
});

export const worldStateSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  study_room_level: z.number().min(1).max(2),
  build_room_level: z.number().min(1).max(2),
  training_room_level: z.number().min(1).max(2),
  total_sessions_success: z.number(),
  day_streak: z.number(),
  last_session_date: z.string().nullable(),
});

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["hat", "outfit", "accessory"]),
  rarity: z.enum(["common", "rare", "epic"]),
  sprite_key: z.string(),
  obtained_at: z.string(),
});

export const taskTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  default_duration_minutes: z.number(),
  room: z.enum(["study", "build", "training"]),
});

export const profileResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    full_name: z.string().nullable(),
    profile_picture: z.string().nullable(),
  }),
  hero: heroSchema,
  world_state: worldStateSchema,
});

export const sessionStartSchema = z.object({
  session_id: z.string(),
  duration_minutes: z.number(),
  started_at: z.string(),
  ends_at: z.string(),
});

export const sessionCompleteSchema = z.object({
  success: z.boolean(),
  exp_reward: z.number(),
  gold_reward: z.number(),
  dropped_item: inventoryItemSchema.nullable(),
  hero: heroSchema,
  world_state: worldStateSchema,
});
