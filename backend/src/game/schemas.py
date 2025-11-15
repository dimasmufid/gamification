from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import Field, conint

from src.auth.models import UserTenantRole
from src.auth.schemas import UserPublic
from src.game.enums import ItemRarity, ItemType, Room, SessionStatus, TaskCategory
from src.schemas import CustomModel


class HeroEquipped(CustomModel):
    hat_id: UUID | None = None
    outfit_id: UUID | None = None
    accessory_id: UUID | None = None


class HeroPublic(CustomModel):
    id: UUID
    level: int
    exp: int
    exp_to_next: int
    gold: int
    equipped: HeroEquipped


class WorldStatePublic(CustomModel):
    id: UUID
    study_room_level: int
    build_room_level: int
    training_room_level: int
    plaza_level: int
    total_sessions_success: int
    day_streak: int
    last_session_date: date | None = None


class ActiveOrganizationResponse(CustomModel):
    id: UUID
    name: str
    slug: str
    business_image: str | None = None
    created_at: datetime
    role: UserTenantRole
    is_default: bool


class ProfileResponse(CustomModel):
    user: UserPublic
    hero: HeroPublic
    world_state: WorldStatePublic
    organization: ActiveOrganizationResponse


class TaskTemplateCreate(CustomModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: TaskCategory = TaskCategory.STUDY
    default_duration_minutes: conint(strict=True, ge=1) = 25
    room: Room = Room.STUDY


class TaskTemplateUpdate(CustomModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: TaskCategory | None = None
    default_duration_minutes: conint(strict=True, ge=1) | None = None
    room: Room | None = None


class TaskTemplatePublic(CustomModel):
    id: UUID
    name: str
    category: TaskCategory
    default_duration_minutes: int
    room: Room
    created_at: datetime
    updated_at: datetime | None = None


class PaginatedTasks(CustomModel):
    items: list[TaskTemplatePublic]
    next_cursor: str | None = None


class SessionStartRequest(CustomModel):
    task_template_id: UUID
    duration_minutes: conint(strict=True, ge=1)


class SessionStartResponse(CustomModel):
    session_id: UUID
    status: SessionStatus
    started_at: datetime
    duration_minutes: int
    room: Room


class SessionIdentifier(CustomModel):
    session_id: UUID


class RewardSummary(CustomModel):
    exp_reward: int
    gold_reward: int


class DroppedItem(CustomModel):
    id: UUID
    name: str
    type: ItemType
    rarity: ItemRarity
    sprite_key: str


class SessionCompleteResponse(CustomModel):
    session: RewardSummary
    dropped_item: DroppedItem | None = None
    hero: HeroPublic
    world_state: WorldStatePublic


class SessionHistoryEntry(CustomModel):
    id: UUID
    status: SessionStatus
    duration_minutes: int
    room: Room
    started_at: datetime
    ended_at: datetime | None = None
    reward_exp: int
    reward_gold: int


class SessionHistoryResponse(CustomModel):
    items: list[SessionHistoryEntry]
    next_cursor: str | None = None


class InventoryItemPublic(CustomModel):
    id: UUID
    name: str
    type: ItemType
    rarity: ItemRarity
    sprite_key: str
    obtained_at: datetime


class InventoryResponse(CustomModel):
    items: list[InventoryItemPublic]
    equipped: HeroEquipped


class WorldStateResponse(CustomModel):
    world_state: WorldStatePublic
    milestones: dict[str, int]


class EquipItemRequest(CustomModel):
    item_id: UUID


__all__ = [
    "ActiveOrganizationResponse",
    "DroppedItem",
    "EquipItemRequest",
    "HeroEquipped",
    "HeroPublic",
    "InventoryItemPublic",
    "InventoryResponse",
    "PaginatedTasks",
    "ProfileResponse",
    "RewardSummary",
    "SessionCompleteResponse",
    "SessionHistoryEntry",
    "SessionHistoryResponse",
    "SessionIdentifier",
    "SessionStartRequest",
    "SessionStartResponse",
    "TaskTemplateCreate",
    "TaskTemplatePublic",
    "TaskTemplateUpdate",
    "WorldStatePublic",
    "WorldStateResponse",
]
