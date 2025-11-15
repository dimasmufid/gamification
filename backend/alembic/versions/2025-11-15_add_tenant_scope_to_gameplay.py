"""add tenant scope to gameplay

Revision ID: 022da91158a0
Revises: 2ee94a7d0a30
Create Date: 2025-11-15 13:14:39.305524

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "022da91158a0"
down_revision = "2ee94a7d0a30"
branch_labels = None
depends_on = None


_HEROES_TENANT_FK = "fk_heroes_tenant_id"
_TASKS_TENANT_FK = "fk_task_templates_tenant_id"
_SESSIONS_TENANT_FK = "fk_sessions_tenant_id"
_INVENTORY_TENANT_FK = "fk_inventory_tenant_id"
_WORLD_TENANT_FK = "fk_world_states_tenant_id"
_DROPLOG_TENANT_FK = "fk_cosmetic_drop_logs_tenant_id"


def upgrade() -> None:
    # Add tenant references
    op.add_column(
        "heroes",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "task_templates",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "sessions",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "inventory",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "world_states",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "cosmetic_drop_logs",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.create_foreign_key(
        _HEROES_TENANT_FK,
        "heroes",
        "tenant",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        _TASKS_TENANT_FK,
        "task_templates",
        "tenant",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        _SESSIONS_TENANT_FK,
        "sessions",
        "tenant",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        _INVENTORY_TENANT_FK,
        "inventory",
        "tenant",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        _WORLD_TENANT_FK,
        "world_states",
        "tenant",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        _DROPLOG_TENANT_FK,
        "cosmetic_drop_logs",
        "tenant",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_index("ix_heroes_tenant_id", "heroes", ["tenant_id"])
    op.create_index("ix_task_templates_tenant_id", "task_templates", ["tenant_id"])
    op.create_index("ix_sessions_tenant_id", "sessions", ["tenant_id"])
    op.create_index("ix_inventory_tenant_id", "inventory", ["tenant_id"])
    op.create_index("ix_world_states_tenant_id", "world_states", ["tenant_id"])
    op.create_index(
        "ix_cosmetic_drop_logs_tenant_id",
        "cosmetic_drop_logs",
        ["tenant_id"],
    )

    membership_cte = """
        WITH membership AS (
            SELECT DISTINCT ON (ut.user_id)
                ut.user_id,
                ut.tenant_id
            FROM user_tenant ut
            ORDER BY ut.user_id, ut.is_default DESC, ut.created_at ASC
        )
    """

    op.execute(
        f"""
        {membership_cte}
        UPDATE heroes h
        SET tenant_id = m.tenant_id
        FROM membership m
        WHERE m.user_id = h.user_id;
        """
    )
    op.execute(
        f"""
        {membership_cte}
        UPDATE task_templates tt
        SET tenant_id = m.tenant_id
        FROM membership m
        WHERE m.user_id = tt.user_id;
        """
    )
    op.execute(
        f"""
        {membership_cte}
        , session_mapping AS (
            SELECT s.id,
                   COALESCE(tt.tenant_id, m.tenant_id) AS tenant_id
            FROM sessions s
            LEFT JOIN task_templates tt ON tt.id = s.task_template_id
            LEFT JOIN membership m ON m.user_id = s.user_id
        )
        UPDATE sessions s
        SET tenant_id = sm.tenant_id
        FROM session_mapping sm
        WHERE sm.id = s.id;
        """
    )
    op.execute(
        f"""
        {membership_cte}
        UPDATE inventory i
        SET tenant_id = m.tenant_id
        FROM membership m
        WHERE m.user_id = i.user_id;
        """
    )
    op.execute(
        f"""
        {membership_cte}
        UPDATE world_states ws
        SET tenant_id = m.tenant_id
        FROM membership m
        WHERE m.user_id = ws.user_id;
        """
    )
    op.execute(
        """
        UPDATE cosmetic_drop_logs cd
        SET tenant_id = s.tenant_id
        FROM sessions s
        WHERE s.id = cd.session_id;
        """
    )

    for table in (
        "heroes",
        "task_templates",
        "sessions",
        "inventory",
        "world_states",
        "cosmetic_drop_logs",
    ):
        op.alter_column(
            table,
            "tenant_id",
            nullable=False,
            existing_type=postgresql.UUID(as_uuid=True),
        )

    op.drop_constraint("heroes_user_id_key", "heroes", type_="unique")
    op.create_unique_constraint(
        "uq_hero_tenant_user",
        "heroes",
        ["tenant_id", "user_id"],
    )
    op.drop_constraint("world_states_user_id_key", "world_states", type_="unique")
    op.create_unique_constraint(
        "uq_world_state_tenant_user",
        "world_states",
        ["tenant_id", "user_id"],
    )
    op.drop_constraint("uq_inventory_item", "inventory", type_="unique")
    op.create_unique_constraint(
        "uq_inventory_item",
        "inventory",
        ["tenant_id", "user_id", "item_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_inventory_item", "inventory", type_="unique")
    op.create_unique_constraint(
        "uq_inventory_item",
        "inventory",
        ["user_id", "item_id"],
    )
    op.drop_constraint("uq_world_state_tenant_user", "world_states", type_="unique")
    op.create_unique_constraint(
        "world_states_user_id_key",
        "world_states",
        ["user_id"],
    )
    op.drop_constraint("uq_hero_tenant_user", "heroes", type_="unique")
    op.create_unique_constraint(
        "heroes_user_id_key",
        "heroes",
        ["user_id"],
    )

    op.drop_index("ix_cosmetic_drop_logs_tenant_id", table_name="cosmetic_drop_logs")
    op.drop_index("ix_world_states_tenant_id", table_name="world_states")
    op.drop_index("ix_inventory_tenant_id", table_name="inventory")
    op.drop_index("ix_sessions_tenant_id", table_name="sessions")
    op.drop_index("ix_task_templates_tenant_id", table_name="task_templates")
    op.drop_index("ix_heroes_tenant_id", table_name="heroes")

    op.drop_constraint(_DROPLOG_TENANT_FK, "cosmetic_drop_logs", type_="foreignkey")
    op.drop_constraint(_WORLD_TENANT_FK, "world_states", type_="foreignkey")
    op.drop_constraint(_INVENTORY_TENANT_FK, "inventory", type_="foreignkey")
    op.drop_constraint(_SESSIONS_TENANT_FK, "sessions", type_="foreignkey")
    op.drop_constraint(_TASKS_TENANT_FK, "task_templates", type_="foreignkey")
    op.drop_constraint(_HEROES_TENANT_FK, "heroes", type_="foreignkey")

    op.drop_column("cosmetic_drop_logs", "tenant_id")
    op.drop_column("world_states", "tenant_id")
    op.drop_column("inventory", "tenant_id")
    op.drop_column("sessions", "tenant_id")
    op.drop_column("task_templates", "tenant_id")
    op.drop_column("heroes", "tenant_id")
