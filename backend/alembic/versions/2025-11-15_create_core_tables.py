"""create_core_tables

Revision ID: 2ee94a7d0a30
Revises:
Create Date: 2025-11-15 12:39:15.893130

"""

from __future__ import annotations

from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "2ee94a7d0a30"
down_revision = None
branch_labels = None
depends_on = None

timestamp_default = sa.text("timezone('utc', now())")

user_tenant_role_enum = postgresql.ENUM(
    "OWNER",
    "ADMIN",
    "MEMBER",
    name="user_tenant_role",
)
invitation_status_enum = postgresql.ENUM(
    "PENDING",
    "ACCEPTED",
    "EXPIRED",
    "REVOKED",
    name="invitation_status",
)

task_category_enum = postgresql.ENUM(
    "study",
    "build",
    "training",
    "custom",
    name="task_category",
)
task_room_enum = postgresql.ENUM(
    "study_room",
    "build_room",
    "training_room",
    name="task_room",
)
session_room_enum = postgresql.ENUM(
    "study_room",
    "build_room",
    "training_room",
    name="session_room",
)
session_status_enum = postgresql.ENUM(
    "pending",
    "active",
    "success",
    "cancel",
    "timeout",
    name="session_status",
)
item_type_enum = postgresql.ENUM("hat", "outfit", "accessory", name="item_type")
item_rarity_enum = postgresql.ENUM("common", "rare", "epic", name="item_rarity")
item_room_affinity_enum = postgresql.ENUM(
    "study_room",
    "build_room",
    "training_room",
    name="item_room_affinity",
)


def upgrade() -> None:
    bind = op.get_bind()
    user_tenant_role_enum.create(bind, checkfirst=True)
    invitation_status_enum.create(bind, checkfirst=True)
    task_category_enum.create(bind, checkfirst=True)
    task_room_enum.create(bind, checkfirst=True)
    session_room_enum.create(bind, checkfirst=True)
    session_status_enum.create(bind, checkfirst=True)
    item_type_enum.create(bind, checkfirst=True)
    item_rarity_enum.create(bind, checkfirst=True)
    item_room_affinity_enum.create(bind, checkfirst=True)

    op.create_table(
        "user",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "is_superuser",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("full_name", sa.String(length=255)),
        sa.Column("profile_picture", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=timestamp_default,
        ),
    )
    op.create_index("ix_user_email", "user", ["email"], unique=True)

    op.create_table(
        "tenant",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True),
        sa.Column("business_image", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
    )
    op.create_index("ix_tenant_name", "tenant", ["name"])

    op.create_table(
        "user_tenant",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenant.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "role",
            user_tenant_role_enum,
            nullable=False,
            server_default="MEMBER",
        ),
        sa.Column(
            "is_default",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
    )
    op.create_index(
        "uq_user_default_tenant",
        "user_tenant",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("is_default"),
    )

    op.create_table(
        "invitation",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenant.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "role",
            user_tenant_role_enum,
            nullable=False,
            server_default="MEMBER",
        ),
        sa.Column("token", sa.String(length=512), nullable=False, unique=True),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "invited_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "status",
            invitation_status_enum,
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
    )
    op.create_index("ix_invitation_email", "invitation", ["email"])
    op.create_index("ix_invitation_tenant_id", "invitation", ["tenant_id"])

    op.create_table(
        "refresh_session",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "default_tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenant.id", ondelete="SET NULL"),
        ),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column(
            "user_agent",
            sa.String(length=512),
        ),
        sa.Column("ip", sa.String(length=64)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "revoked_at",
            sa.DateTime(timezone=True),
        ),
        sa.Column(
            "rotated_from_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("refresh_session.id", ondelete="SET NULL"),
        ),
    )
    op.create_index(
        "ix_refresh_session_user_id",
        "refresh_session",
        ["user_id"],
    )
    op.create_index(
        "ix_refresh_session_token_hash",
        "refresh_session",
        ["token_hash"],
    )
    op.create_index(
        "ix_refresh_active",
        "refresh_session",
        ["user_id", "expires_at"],
    )

    op.create_table(
        "items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", item_type_enum, nullable=False),
        sa.Column(
            "rarity",
            item_rarity_enum,
            nullable=False,
            server_default="common",
        ),
        sa.Column("sprite_key", sa.String(length=255), nullable=False),
        sa.Column("room_affinity", item_room_affinity_enum),
        sa.Column(
            "unlock_level",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column("description", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=timestamp_default,
        ),
    )

    op.create_table(
        "heroes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "level",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "exp",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "gold",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "equipped_hat_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("items.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "equipped_outfit_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("items.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "equipped_accessory_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("items.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=timestamp_default,
        ),
    )

    op.create_table(
        "task_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "category",
            task_category_enum,
            nullable=False,
            server_default="study",
        ),
        sa.Column("default_duration_minutes", sa.Integer(), nullable=False),
        sa.Column(
            "room",
            task_room_enum,
            nullable=False,
            server_default="study_room",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=timestamp_default,
        ),
        sa.CheckConstraint(
            "default_duration_minutes IN (25, 50, 90)",
            name="task_templates_default_duration_minutes_check",
        ),
    )
    op.create_index("ix_task_templates_user_id", "task_templates", ["user_id"])

    op.create_table(
        "world_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "study_room_level",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "build_room_level",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "training_room_level",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "plaza_level",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "total_sessions_success",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "day_streak",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("last_session_date", sa.Date()),
        sa.Column("last_reset_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=timestamp_default,
        ),
    )

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "task_template_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("task_templates.id", ondelete="SET NULL"),
        ),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("room", session_room_enum, nullable=False),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column(
            "status",
            session_status_enum,
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "reward_exp",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "reward_gold",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "drop_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("items.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=timestamp_default,
        ),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])
    op.create_index("ix_sessions_status", "sessions", ["status"])

    op.create_table(
        "inventory",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "obtained_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
        sa.UniqueConstraint("user_id", "item_id", name="uq_inventory_item"),
    )
    op.create_index("ix_inventory_user_id", "inventory", ["user_id"])
    op.create_index("ix_inventory_item_id", "inventory", ["item_id"])

    op.create_table(
        "cosmetic_drop_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "rolled_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=timestamp_default,
        ),
    )

    items_table = sa.table(
        "items",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String()),
        sa.column("type", item_type_enum),
        sa.column("rarity", item_rarity_enum),
        sa.column("sprite_key", sa.String()),
        sa.column("room_affinity", item_room_affinity_enum),
        sa.column("unlock_level", sa.Integer()),
    )
    op.bulk_insert(
        items_table,
        [
            {
                "id": uuid4(),
                "name": "Focus Cap",
                "type": "hat",
                "rarity": "common",
                "sprite_key": "hat_focus_cap",
                "room_affinity": "study_room",
                "unlock_level": 1,
            },
            {
                "id": uuid4(),
                "name": "Builder Gloves",
                "type": "accessory",
                "rarity": "rare",
                "sprite_key": "accessory_builder_gloves",
                "room_affinity": "build_room",
                "unlock_level": 2,
            },
            {
                "id": uuid4(),
                "name": "Training Gi",
                "type": "outfit",
                "rarity": "epic",
                "sprite_key": "outfit_training_gi",
                "room_affinity": "training_room",
                "unlock_level": 3,
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("cosmetic_drop_logs")
    op.drop_index("ix_inventory_item_id", table_name="inventory")
    op.drop_index("ix_inventory_user_id", table_name="inventory")
    op.drop_table("inventory")
    op.drop_index("ix_sessions_status", table_name="sessions")
    op.drop_index("ix_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_table("world_states")
    op.drop_index("ix_task_templates_user_id", table_name="task_templates")
    op.drop_table("task_templates")
    op.drop_table("heroes")
    op.drop_table("items")
    op.drop_index("ix_refresh_active", table_name="refresh_session")
    op.drop_index("ix_refresh_session_token_hash", table_name="refresh_session")
    op.drop_index("ix_refresh_session_user_id", table_name="refresh_session")
    op.drop_table("refresh_session")
    op.drop_index("ix_invitation_tenant_id", table_name="invitation")
    op.drop_index("ix_invitation_email", table_name="invitation")
    op.drop_table("invitation")
    op.drop_index("uq_user_default_tenant", table_name="user_tenant")
    op.drop_table("user_tenant")
    op.drop_index("ix_tenant_name", table_name="tenant")
    op.drop_table("tenant")
    op.drop_index("ix_user_email", table_name="user")
    op.drop_table("user")

    bind = op.get_bind()
    item_room_affinity_enum.drop(bind, checkfirst=True)
    item_rarity_enum.drop(bind, checkfirst=True)
    item_type_enum.drop(bind, checkfirst=True)
    session_status_enum.drop(bind, checkfirst=True)
    session_room_enum.drop(bind, checkfirst=True)
    task_room_enum.drop(bind, checkfirst=True)
    task_category_enum.drop(bind, checkfirst=True)
    invitation_status_enum.drop(bind, checkfirst=True)
    user_tenant_role_enum.drop(bind, checkfirst=True)
