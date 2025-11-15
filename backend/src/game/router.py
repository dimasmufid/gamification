from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import CurrentUser
from src.database import get_async_session
from src.game.enums import ItemType, Room, SessionStatus
from src.game.models import Inventory, Item, Session, TaskTemplate
from src.game.schemas import (
    EquipItemRequest,
    HeroEquipped,
    HeroPublic,
    InventoryItemPublic,
    InventoryResponse,
    PaginatedTasks,
    ProfileResponse,
    RewardSummary,
    SessionCompleteResponse,
    SessionHistoryEntry,
    SessionHistoryResponse,
    SessionIdentifier,
    SessionStartRequest,
    SessionStartResponse,
    TaskTemplateCreate,
    TaskTemplatePublic,
    TaskTemplateUpdate,
    WorldStateResponse,
)
from src.game.services import (
    ALLOWED_DURATIONS,
    apply_rewards,
    compute_rewards,
    get_inventory_items,
    get_task_template,
    hero_to_public,
    initialize_progression,
    maybe_roll_cosmetic_drop,
    milestone_summary,
    update_world_state_on_success,
    world_state_to_public,
)

router = APIRouter(tags=["game"])


def ensure_allowed_duration(duration: int) -> None:
    if duration not in ALLOWED_DURATIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Duration is not allowed.",
        )


def serialize_task(template: TaskTemplate) -> TaskTemplatePublic:
    return TaskTemplatePublic(
        id=template.id,
        name=template.name,
        category=template.category,
        default_duration_minutes=template.default_duration_minutes,
        room=template.room,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


def encode_cursor(value: datetime) -> str:
    return value.isoformat()


def decode_cursor(cursor: str) -> datetime:
    try:
        return datetime.fromisoformat(cursor)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cursor.",
        ) from exc


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> ProfileResponse:
    hero, world_state = await initialize_progression(session, user_id=user.id)
    return ProfileResponse(
        user=user,
        hero=hero_to_public(hero),
        world_state=world_state_to_public(world_state),
    )


@router.get("/tasks", response_model=PaginatedTasks)
async def list_tasks(
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
    room: Room | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
) -> PaginatedTasks:
    statement = (
        select(TaskTemplate)
        .where(TaskTemplate.user_id == user.id)
        .order_by(TaskTemplate.created_at.desc())
    )
    if room:
        statement = statement.where(TaskTemplate.room == room)
    if cursor:
        cursor_dt = decode_cursor(cursor)
        statement = statement.where(TaskTemplate.created_at < cursor_dt)
    statement = statement.limit(limit + 1)

    result = await session.execute(statement)
    templates = list(result.scalars().all())
    next_cursor = None
    if len(templates) > limit:
        next_cursor = encode_cursor(templates[limit - 1].created_at)
        templates = templates[:limit]

    return PaginatedTasks(
        items=[serialize_task(template) for template in templates],
        next_cursor=next_cursor,
    )


@router.post(
    "/tasks", response_model=TaskTemplatePublic, status_code=status.HTTP_201_CREATED
)
async def create_task_template(
    payload: TaskTemplateCreate,
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> TaskTemplatePublic:
    ensure_allowed_duration(payload.default_duration_minutes)
    template = TaskTemplate(
        user_id=user.id,
        name=payload.name.strip(),
        category=payload.category,
        default_duration_minutes=payload.default_duration_minutes,
        room=payload.room,
    )
    session.add(template)
    await session.commit()
    await session.refresh(template)
    return serialize_task(template)


@router.put("/tasks/{task_id}", response_model=TaskTemplatePublic)
async def update_task_template(
    task_id: UUID,
    payload: TaskTemplateUpdate,
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> TaskTemplatePublic:
    template = await get_task_template(session, template_id=task_id, user_id=user.id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found."
        )

    if payload.default_duration_minutes is not None:
        ensure_allowed_duration(payload.default_duration_minutes)
        template.default_duration_minutes = payload.default_duration_minutes
    if payload.name is not None:
        template.name = payload.name.strip()
    if payload.category is not None:
        template.category = payload.category
    if payload.room is not None:
        template.room = payload.room

    await session.commit()
    await session.refresh(template)
    return serialize_task(template)


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_200_OK,
    response_model=dict[str, bool],
)
async def delete_task_template(
    task_id: UUID,
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> None:
    template = await get_task_template(session, template_id=task_id, user_id=user.id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found."
        )
    await session.delete(template)
    await session.commit()
    return {"success": True}


@router.post(
    "/session/start",
    response_model=SessionStartResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_session(
    payload: SessionStartRequest,
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> SessionStartResponse:
    ensure_allowed_duration(payload.duration_minutes)
    template = await get_task_template(
        session,
        template_id=payload.task_template_id,
        user_id=user.id,
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task template not found.",
        )

    pending_count_stmt = (
        select(func.count(Session.id))
        .where(Session.user_id == user.id)
        .where(Session.status.in_([SessionStatus.PENDING, SessionStatus.ACTIVE]))
    )
    pending_count = await session.scalar(pending_count_stmt)
    if pending_count and pending_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Too many sessions in progress.",
        )

    session_obj = Session(
        user_id=user.id,
        task_template_id=template.id,
        duration_minutes=payload.duration_minutes,
        room=template.room,
        started_at=datetime.now(UTC),
        status=SessionStatus.PENDING,
    )
    session.add(session_obj)
    await session.commit()
    await session.refresh(session_obj)
    return SessionStartResponse(
        session_id=session_obj.id,
        status=session_obj.status,
        started_at=session_obj.started_at,
        duration_minutes=session_obj.duration_minutes,
        room=session_obj.room,
    )


def validate_completion_window(session_obj: Session) -> None:
    elapsed = datetime.now(UTC) - session_obj.started_at
    required_minutes = session_obj.duration_minutes * 0.8
    if elapsed.total_seconds() < required_minutes * 60:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Session cannot be completed yet.",
        )


async def get_session_for_user(
    session: AsyncSession,
    *,
    session_id: UUID,
    user_id: UUID,
) -> Session | None:
    statement = (
        select(Session)
        .where(Session.id == session_id, Session.user_id == user_id)
        .with_for_update()
    )
    result = await session.execute(statement)
    return result.scalars().first()


@router.post("/session/complete", response_model=SessionCompleteResponse)
async def complete_session(
    payload: SessionIdentifier,
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> SessionCompleteResponse:
    session_obj = await get_session_for_user(
        session,
        session_id=payload.session_id,
        user_id=user.id,
    )
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found."
        )
    if session_obj.status not in (SessionStatus.PENDING, SessionStatus.ACTIVE):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session already finished.",
        )
    validate_completion_window(session_obj)

    hero, world_state = await initialize_progression(session, user_id=user.id)
    exp_reward, gold_reward = compute_rewards(session_obj.duration_minutes)
    apply_rewards(hero, exp_reward, gold_reward)
    session_obj.reward_exp = exp_reward
    session_obj.reward_gold = gold_reward
    session_obj.status = SessionStatus.SUCCESS
    session_obj.ended_at = datetime.now(UTC)

    update_world_state_on_success(world_state)
    dropped_item = await maybe_roll_cosmetic_drop(
        session,
        user_id=user.id,
        hero=hero,
        session_obj=session_obj,
    )
    await session.commit()
    await session.refresh(hero)
    await session.refresh(world_state)
    await session.refresh(session_obj)

    return SessionCompleteResponse(
        session=RewardSummary(exp_reward=exp_reward, gold_reward=gold_reward),
        dropped_item=dropped_item,
        hero=hero_to_public(hero),
        world_state=world_state_to_public(world_state),
    )


@router.post("/session/cancel", response_model=SessionHistoryEntry)
async def cancel_session(
    payload: SessionIdentifier,
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> SessionHistoryEntry:
    session_obj = await get_session_for_user(
        session,
        session_id=payload.session_id,
        user_id=user.id,
    )
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found."
        )
    if session_obj.status not in (SessionStatus.PENDING, SessionStatus.ACTIVE):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session already finalized.",
        )
    session_obj.status = SessionStatus.CANCEL
    session_obj.ended_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(session_obj)
    return SessionHistoryEntry(
        id=session_obj.id,
        status=session_obj.status,
        duration_minutes=session_obj.duration_minutes,
        room=session_obj.room,
        started_at=session_obj.started_at,
        ended_at=session_obj.ended_at,
        reward_exp=session_obj.reward_exp,
        reward_gold=session_obj.reward_gold,
    )


@router.get("/sessions/history", response_model=SessionHistoryResponse)
async def get_session_history(
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
) -> SessionHistoryResponse:
    statement = (
        select(Session)
        .where(Session.user_id == user.id)
        .order_by(Session.started_at.desc())
    )
    if cursor:
        cursor_dt = decode_cursor(cursor)
        statement = statement.where(Session.started_at < cursor_dt)
    statement = statement.limit(limit + 1)

    result = await session.execute(statement)
    sessions_list = list(result.scalars().all())
    next_cursor = None
    if len(sessions_list) > limit:
        next_cursor = encode_cursor(sessions_list[limit - 1].started_at)
        sessions_list = sessions_list[:limit]

    return SessionHistoryResponse(
        items=[
            SessionHistoryEntry(
                id=item.id,
                status=item.status,
                duration_minutes=item.duration_minutes,
                room=item.room,
                started_at=item.started_at,
                ended_at=item.ended_at,
                reward_exp=item.reward_exp,
                reward_gold=item.reward_gold,
            )
            for item in sessions_list
        ],
        next_cursor=next_cursor,
    )


@router.get("/inventory", response_model=InventoryResponse)
async def get_inventory(
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> InventoryResponse:
    hero, _ = await initialize_progression(session, user_id=user.id)
    rows = await get_inventory_items(session, user_id=user.id)
    items = [
        InventoryItemPublic(
            id=item.id,
            name=item.name,
            type=item.type,
            rarity=item.rarity,
            sprite_key=item.sprite_key,
            obtained_at=inventory.obtained_at,
        )
        for inventory, item in rows
    ]
    return InventoryResponse(
        items=items,
        equipped=HeroEquipped(
            hat_id=hero.equipped_hat_id,
            outfit_id=hero.equipped_outfit_id,
            accessory_id=hero.equipped_accessory_id,
        ),
    )


def map_item_to_slot(item_type: ItemType) -> str:
    if item_type == ItemType.HAT:
        return "equipped_hat_id"
    if item_type == ItemType.OUTFIT:
        return "equipped_outfit_id"
    return "equipped_accessory_id"


@router.post("/inventory/equip", response_model=HeroPublic)
async def equip_item(
    payload: EquipItemRequest,
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> HeroPublic:
    hero, _ = await initialize_progression(session, user_id=user.id)
    statement = (
        select(Item)
        .join(Inventory, Inventory.item_id == Item.id)
        .where(Inventory.user_id == user.id, Item.id == payload.item_id)
    )
    result = await session.execute(statement)
    item = result.scalars().first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not owned."
        )

    slot_attr = map_item_to_slot(item.type)
    setattr(hero, slot_attr, item.id)
    await session.commit()
    await session.refresh(hero)
    return hero_to_public(hero)


@router.get("/worldstate", response_model=WorldStateResponse)
async def get_world_state_endpoint(
    user: CurrentUser,
    session: AsyncSession = Depends(get_async_session),
) -> WorldStateResponse:
    _, world_state = await initialize_progression(session, user_id=user.id)
    return WorldStateResponse(
        world_state=world_state_to_public(world_state),
        milestones=milestone_summary(world_state),
    )


__all__ = ["router"]
