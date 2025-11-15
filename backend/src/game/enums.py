from __future__ import annotations

from enum import Enum


class SessionStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUCCESS = "success"
    CANCEL = "cancel"
    TIMEOUT = "timeout"


class TaskCategory(str, Enum):
    STUDY = "study"
    BUILD = "build"
    TRAINING = "training"
    CUSTOM = "custom"


class Room(str, Enum):
    STUDY = "study_room"
    BUILD = "build_room"
    TRAINING = "training_room"


class ItemType(str, Enum):
    HAT = "hat"
    OUTFIT = "outfit"
    ACCESSORY = "accessory"


class ItemRarity(str, Enum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"


__all__ = [
    "ItemRarity",
    "ItemType",
    "Room",
    "SessionStatus",
    "TaskCategory",
]
