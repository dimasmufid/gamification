import { apiFetch } from "@/lib/api/client";
import {
  inventoryItemSchema,
  profileResponseSchema,
  sessionCompleteSchema,
  sessionStartSchema,
  taskTemplateSchema,
  worldStateSchema,
} from "@/lib/api/schemas";
import { toHero, toInventoryItem, toTaskTemplate, toWorldState } from "@/lib/api/transformers";
import type { InventoryItem } from "@/lib/models/inventory";
import type { ActiveSession, RewardPayload, SessionTemplate } from "@/lib/models/session";
import type { WorldState } from "@/lib/models/world";
import { z } from "zod";

const arraySchema = <T extends z.ZodTypeAny>(schema: T) => z.array(schema);

export async function getProfile() {
  const payload = await apiFetch("/api/profile");
  const parsed = profileResponseSchema.parse(payload);
  return {
    user: parsed.user,
    hero: toHero(parsed.hero),
    worldState: toWorldState(parsed.world_state),
  };
}

export async function listTasks(): Promise<SessionTemplate[]> {
  const payload = await apiFetch("/api/tasks");
  const parsed = arraySchema(taskTemplateSchema).parse(payload);
  return parsed.map(toTaskTemplate);
}

export async function getWorldState(): Promise<WorldState> {
  const payload = await apiFetch("/api/worldstate");
  const parsed = worldStateSchema.parse(payload);
  return toWorldState(parsed);
}

export async function listInventory(): Promise<InventoryItem[]> {
  const payload = await apiFetch("/api/inventory");
  const parsed = arraySchema(inventoryItemSchema).parse(payload);
  return parsed.map(toInventoryItem);
}

export async function equipItem(itemId: string) {
  await apiFetch("/api/inventory/equip", {
    method: "POST",
    body: { item_id: itemId },
  });
}

export async function startSession(input: {
  taskTemplateId: string;
  durationMinutes: number;
  room: SessionTemplate["room"];
}) {
  const payload = await apiFetch("/api/session/start", {
    method: "POST",
    body: {
      task_template_id: input.taskTemplateId,
      duration_minutes: input.durationMinutes,
    },
  });
  const parsed = sessionStartSchema.parse(payload);
  const activeSession: ActiveSession = {
    sessionId: parsed.session_id,
    templateId: input.taskTemplateId,
    durationMinutes: parsed.duration_minutes,
    startedAt: parsed.started_at,
    endsAt: parsed.ends_at,
    room: input.room,
  };
  return activeSession;
}

export async function completeSession(sessionId: string): Promise<{
  reward: RewardPayload;
  hero: ReturnType<typeof toHero>;
  worldState: WorldState;
  droppedItem: InventoryItem | null;
}> {
  const payload = await apiFetch("/api/session/complete", {
    method: "POST",
    body: { session_id: sessionId },
  });
  const parsed = sessionCompleteSchema.parse(payload);
  const reward: RewardPayload = {
    expReward: parsed.exp_reward,
    goldReward: parsed.gold_reward,
    droppedItemId: parsed.dropped_item?.id ?? null,
  };
  return {
    reward,
    hero: toHero(parsed.hero),
    worldState: toWorldState(parsed.world_state),
    droppedItem: parsed.dropped_item ? toInventoryItem(parsed.dropped_item) : null,
  };
}

export async function cancelSession(sessionId: string) {
  await apiFetch("/api/session/cancel", {
    method: "POST",
    body: { session_id: sessionId },
  }).catch(() => undefined);
}
