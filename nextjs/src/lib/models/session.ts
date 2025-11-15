export type SessionStatus =
  | "idle"
  | "pending"
  | "running"
  | "success"
  | "cancelled"
  | "timeout";

export type SessionRoom = "plaza" | "study" | "build" | "training";

export interface SessionTemplate {
  id: string;
  name: string;
  category: string;
  defaultDurationMinutes: number;
  room: Exclude<SessionRoom, "plaza">;
}

export interface ActiveSession {
  sessionId: string;
  templateId: string;
  durationMinutes: number;
  startedAt: string;
  endsAt: string;
  room: Exclude<SessionRoom, "plaza">;
}

export interface RewardPayload {
  expReward: number;
  goldReward: number;
  droppedItemId?: string | null;
}
