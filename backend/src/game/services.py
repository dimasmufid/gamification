from __future__ import annotations

import random
from collections.abc import Sequence
from datetime import date, timedelta
from typing import Iterable
from uuid import UUID

from sqlalchemy import Select, and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.game.enums import ItemRarity, ItemType
from src.game.models import (
    CosmeticDropLog,
    Hero,
    Inventory,
    Item,
    Session,
    TaskTemplate,
    WorldState,
)
from src.game.schemas import (
    DroppedItem,
    HeroEquipped,
    HeroPublic,
    WorldStatePublic,
)

ALLOWED_DURATIONS = {25, 50, 90}
DROP_CHANCE = 0.10
RARITY_WEIGHTS: dict[ItemRarity, float] = {
    ItemRarity.COMMON: 0.75,
    ItemRarity.RARE: 0.2,
    ItemRarity.EPIC: 0.05,
}
ROOM_THRESHOLDS = {
    "study_room_level_2": 5,
    "build_room_level_2": 15,
    "plaza_level_2": 30,
}


def exp_to_next_level(level: int) -> int:
    return max(level, 1) * 100


def compute_rewards(duration_minutes: int) -> tuple[int, int]:
    exp_reward = duration_minutes * 2
    gold_reward = duration_minutes * 1
    return exp_reward, gold_reward


def hero_to_public(hero: Hero) -> HeroPublic:
    return HeroPublic(
        id=hero.id,
        level=hero.level,
        exp=hero.exp,
        exp_to_next=exp_to_next_level(hero.level),
        gold=hero.gold,
        equipped=HeroEquipped(
            hat_id=hero.equipped_hat_id,
            outfit_id=hero.equipped_outfit_id,
            accessory_id=hero.equipped_accessory_id,
        ),
    )


def world_state_to_public(world_state: WorldState) -> WorldStatePublic:
    return WorldStatePublic(
        id=world_state.id,
        study_room_level=world_state.study_room_level,
        build_room_level=world_state.build_room_level,
        training_room_level=world_state.training_room_level,
        plaza_level=world_state.plaza_level,
        total_sessions_success=world_state.total_sessions_success,
        day_streak=world_state.day_streak,
        last_session_date=world_state.last_session_date,
    )


def milestone_summary(world_state: WorldState) -> dict[str, int]:
    return {name: threshold for name, threshold in ROOM_THRESHOLDS.items()}


async def initialize_progression(
    session: AsyncSession,
    *,
    user_id: UUID,
) -> tuple[Hero, WorldState]:
    hero = await get_hero(session, user_id=user_id)
    if not hero:
        hero = Hero(user_id=user_id)
        session.add(hero)
        await session.commit()
        await session.refresh(hero)

    world_state = await get_world_state(session, user_id=user_id)
    if not world_state:
        world_state = WorldState(user_id=user_id)
        session.add(world_state)
        await session.commit()
        await session.refresh(world_state)

    return hero, world_state


async def get_hero(session: AsyncSession, *, user_id: UUID) -> Hero | None:
    statement: Select[tuple[Hero]] = select(Hero).where(Hero.user_id == user_id)
    result = await session.execute(statement)
    return result.scalars().first()


async def get_world_state(
    session: AsyncSession,
    *,
    user_id: UUID,
) -> WorldState | None:
    statement: Select[tuple[WorldState]] = select(WorldState).where(
        WorldState.user_id == user_id
    )
    result = await session.execute(statement)
    return result.scalars().first()


async def get_task_template(
    session: AsyncSession,
    *,
    template_id: UUID,
    user_id: UUID,
) -> TaskTemplate | None:
    statement = select(TaskTemplate).where(
        TaskTemplate.id == template_id,
        TaskTemplate.user_id == user_id,
    )
    result = await session.execute(statement)
    return result.scalars().first()


def apply_rewards(hero: Hero, exp_reward: int, gold_reward: int) -> None:
    hero.exp += exp_reward
    hero.gold += gold_reward
    while hero.exp >= exp_to_next_level(hero.level):
        hero.exp -= exp_to_next_level(hero.level)
        hero.level += 1


def update_world_state_on_success(
    world_state: WorldState,
) -> None:
    world_state.total_sessions_success += 1
    today = date.today()
    if world_state.last_session_date:
        delta = today - world_state.last_session_date
        if delta == timedelta(days=0):
            pass
        elif delta == timedelta(days=1):
            world_state.day_streak += 1
        else:
            world_state.day_streak = 1
    else:
        world_state.day_streak = 1
    world_state.last_session_date = today

    if world_state.total_sessions_success >= ROOM_THRESHOLDS["plaza_level_2"]:
        world_state.plaza_level = 2
    if world_state.total_sessions_success >= ROOM_THRESHOLDS["build_room_level_2"]:
        world_state.build_room_level = 2
    if world_state.total_sessions_success >= ROOM_THRESHOLDS["study_room_level_2"]:
        world_state.study_room_level = 2


async def maybe_roll_cosmetic_drop(
    session: AsyncSession,
    *,
    user_id: UUID,
    hero: Hero,
    session_obj: Session,
) -> DroppedItem | None:
    if random.random() >= DROP_CHANCE:
        return None

    stmt = (
        select(Item)
        .outerjoin(
            Inventory,
            and_(
                Inventory.item_id == Item.id,
                Inventory.user_id == user_id,
            ),
        )
        .where(Inventory.id.is_(None))
        .where(Item.unlock_level <= hero.level)
    )
    stmt = stmt.where(
        (Item.room_affinity.is_(None)) | (Item.room_affinity == session_obj.room)
    )
    result = await session.execute(stmt)
    available_items: list[Item] = list(result.scalars().all())
    if not available_items:
        return None

    chosen_rarity = choose_weighted_rarity(item.rarity for item in available_items)
    candidates = [item for item in available_items if item.rarity == chosen_rarity]
    if not candidates:
        candidates = available_items
    item = random.choice(candidates)

    inventory_entry = Inventory(user_id=user_id, item_id=item.id)
    session.add(inventory_entry)
    session.add(
        CosmeticDropLog(
            session_id=session_obj.id,
            item_id=item.id,
        )
    )
    session_obj.drop_item_id = item.id

    if item.type == ItemType.HAT and not hero.equipped_hat_id:
        hero.equipped_hat_id = item.id
    elif item.type == ItemType.OUTFIT and not hero.equipped_outfit_id:
        hero.equipped_outfit_id = item.id
    elif item.type == ItemType.ACCESSORY and not hero.equipped_accessory_id:
        hero.equipped_accessory_id = item.id

    return DroppedItem(
        id=item.id,
        name=item.name,
        type=item.type,
        rarity=item.rarity,
        sprite_key=item.sprite_key,
    )


def choose_weighted_rarity(candidates: Iterable[ItemRarity]) -> ItemRarity:
    unique_rarities = {rarity for rarity in candidates}
    weights = [(rarity, RARITY_WEIGHTS.get(rarity, 0.0)) for rarity in unique_rarities]
    total_weight = sum(weight for _, weight in weights)
    if total_weight == 0:
        return ItemRarity.COMMON
    pick = random.random() * total_weight
    cumulative = 0.0
    for rarity, weight in weights:
        cumulative += weight
        if pick <= cumulative:
            return rarity
    return ItemRarity.COMMON


async def get_inventory_items(
    session: AsyncSession,
    *,
    user_id: UUID,
) -> list[tuple[Inventory, Item]]:
    statement = (
        select(Inventory, Item)
        .join(Item, Item.id == Inventory.item_id)
        .where(Inventory.user_id == user_id)
        .order_by(Inventory.obtained_at.desc())
    )
    result = await session.execute(statement)
    rows: Sequence[tuple[Inventory, Item]] = result.all()
    return list(rows)


__all__ = [
    "ALLOWED_DURATIONS",
    "apply_rewards",
    "HeroPublic",
    "HeroEquipped",
    "compute_rewards",
    "exp_to_next_level",
    "get_hero",
    "get_inventory_items",
    "get_task_template",
    "get_world_state",
    "hero_to_public",
    "initialize_progression",
    "maybe_roll_cosmetic_drop",
    "milestone_summary",
    "update_world_state_on_success",
    "world_state_to_public",
]
