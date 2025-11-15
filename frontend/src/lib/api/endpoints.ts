import { apiFetch } from "@/lib/api/client";
import {
  authResponseSchema,
  inventoryItemSchema,
  profileResponseSchema,
  sessionCompleteSchema,
  sessionStartSchema,
  taskTemplateSchema,
  tenantReadSchema,
  worldStateSchema,
} from "@/lib/api/schemas";
import {
  toActiveOrganization,
  toHero,
  toInventoryItem,
  toTaskTemplate,
  toUser,
  toWorldState,
} from "@/lib/api/transformers";
import type { InventoryItem } from "@/lib/models/inventory";
import type { ActiveOrganization, AuthenticatedUser } from "@/lib/models/user";
import type { ActiveSession, RewardPayload, SessionTemplate } from "@/lib/models/session";
import type { WorldState } from "@/lib/models/world";
import { z } from "zod";

const arraySchema = <T extends z.ZodTypeAny>(schema: T) => z.array(schema);

type AuthResponsePayload = z.infer<typeof authResponseSchema>;

function deriveActiveOrganization(payload: AuthResponsePayload["user"]): ActiveOrganization {
  const activeId = payload.active_organization_id;
  const membership = payload.memberships.find(
    (member) => member.organization.id === activeId,
  ) ?? payload.memberships[0];
  if (!membership) {
    throw new Error("User is missing tenant memberships");
  }
  return toActiveOrganization({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    business_image: membership.organization.business_image,
    created_at: membership.organization.created_at,
    role: membership.role,
    is_default: membership.is_default,
  });
}

function mapAuthResponse(payload: AuthResponsePayload): {
  user: AuthenticatedUser;
  organization: ActiveOrganization;
} {
  const user = toUser(payload.user);
  const organization = deriveActiveOrganization(payload.user);
  return {
    user,
    organization,
  };
}

export async function getProfile() {
  const payload = await apiFetch("/api/profile");
  const parsed = profileResponseSchema.parse(payload);
  return {
    user: toUser(parsed.user),
    hero: toHero(parsed.hero),
    worldState: toWorldState(parsed.world_state),
    organization: toActiveOrganization(parsed.organization),
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

export async function signin(input: { email: string; password: string }) {
  const payload = await apiFetch("/api/signin", {
    method: "POST",
    body: input,
  });
  const parsed = authResponseSchema.parse(payload);
  return mapAuthResponse(parsed);
}

export async function signup(input: {
  email: string;
  password: string;
  fullName?: string | null;
  organizationName: string;
}) {
  const payload = await apiFetch("/api/signup", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      full_name: input.fullName ?? null,
      organization_name: input.organizationName,
    },
  });
  const parsed = authResponseSchema.parse(payload);
  return mapAuthResponse(parsed);
}

export async function switchOrganization(organizationId: string) {
  const payload = await apiFetch("/api/organizations/select", {
    method: "POST",
    body: { organization_id: organizationId },
  });
  const parsed = authResponseSchema.parse(payload);
  return mapAuthResponse(parsed);
}

export async function updateTenant(
  tenantId: string,
  input: { name?: string; slug?: string; businessImage?: string | null }
) {
  const payload = await apiFetch(`/api/tenants/${tenantId}`, {
    method: "PATCH",
    body: {
      name: input.name,
      slug: input.slug,
      business_image: input.businessImage ?? null,
    },
  });
  const parsed = tenantReadSchema.parse(payload);
  return parsed;
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
