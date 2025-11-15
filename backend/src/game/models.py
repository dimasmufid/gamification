from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base, TimestampMixin
from src.game.enums import ItemRarity, ItemType, Room, SessionStatus, TaskCategory


class Hero(TimestampMixin, Base):
    __tablename__ = "heroes"
    __table_args__ = (
        UniqueConstraint("tenant_id", "user_id", name="uq_hero_tenant_user"),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenant.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    exp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gold: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    equipped_hat_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("items.id", ondelete="SET NULL"),
    )
    equipped_outfit_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("items.id", ondelete="SET NULL"),
    )
    equipped_accessory_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("items.id", ondelete="SET NULL"),
    )


class TaskTemplate(TimestampMixin, Base):
    __tablename__ = "task_templates"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenant.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    category: Mapped[TaskCategory] = mapped_column(
        SQLEnum(TaskCategory, name="task_category"),
        nullable=False,
        default=TaskCategory.STUDY,
    )
    default_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    room: Mapped[Room] = mapped_column(
        SQLEnum(Room, name="task_room"),
        nullable=False,
        default=Room.STUDY,
    )

    __table_args__ = (
        CheckConstraint(
            "default_duration_minutes IN (25, 50, 90)",
            name="default_duration_minutes_check",
        ),
    )


class Session(TimestampMixin, Base):
    __tablename__ = "sessions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenant.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_template_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("task_templates.id", ondelete="SET NULL"),
        nullable=True,
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    room: Mapped[Room] = mapped_column(
        SQLEnum(Room, name="session_room"),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[SessionStatus] = mapped_column(
        SQLEnum(SessionStatus, name="session_status"),
        default=SessionStatus.PENDING,
        nullable=False,
        index=True,
    )
    reward_exp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reward_gold: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    drop_item_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("items.id", ondelete="SET NULL"),
    )


class Item(TimestampMixin, Base):
    __tablename__ = "items"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    type: Mapped[ItemType] = mapped_column(
        SQLEnum(ItemType, name="item_type"),
        nullable=False,
    )
    rarity: Mapped[ItemRarity] = mapped_column(
        SQLEnum(ItemRarity, name="item_rarity"),
        nullable=False,
        default=ItemRarity.COMMON,
    )
    sprite_key: Mapped[str] = mapped_column(String(length=255), nullable=False)
    room_affinity: Mapped[Room | None] = mapped_column(
        SQLEnum(Room, name="item_room_affinity"),
        nullable=True,
    )
    unlock_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenant.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    obtained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "user_id",
            "item_id",
            name="uq_inventory_item",
        ),
    )


class WorldState(TimestampMixin, Base):
    __tablename__ = "world_states"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "user_id",
            name="uq_world_state_tenant_user",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenant.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    study_room_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    build_room_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    training_room_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    plaza_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_sessions_success: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    day_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_session_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_reset_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CosmeticDropLog(Base):
    __tablename__ = "cosmetic_drop_logs"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenant.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


__all__ = [
    "CosmeticDropLog",
    "Hero",
    "Inventory",
    "Item",
    "Session",
    "TaskTemplate",
    "WorldState",
]
