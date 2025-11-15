# Nesra Town – Backend Specification (Next.js API or FastAPI)

## Overview
Backend handles:
- Task/session logic
- Reward computation
- Inventory & cosmetics
- Hero progression
- WorldState evolution

Works independently of frontend team. API endpoints should be stable and simple JSON.

---

## Technology Options

### Option 1 — Next.js API Routes (Recommended for rapid build)
- Unified codebase
- Fast iteration
- Works well with server actions

### Option 2 — Existing FastAPI backend
- Cleaner separation
- Can scale as microservice
- Reuse your existing infra

Both follow the same API contract.

---

## Database (Postgres)

### Tables

#### `User`
- `id PK (UUID)`
- `email` (unique, indexed)
- `hashed_password`
- `is_active` (default: true)
- `is_superuser` (default: false)
- `is_verified` (default: false)
- `full_name` (nullable)
- `profile_picture` (nullable, Text)
- `created_at` (timestamp with timezone)
- `updated_at` (nullable, timestamp with timezone)

#### `Hero`
- `id PK`
- `user_id FK`
- `level INT`
- `exp INT`
- `gold INT`
- `equipped_hat_id`
- `equipped_outfit_id`
- `equipped_accessory_id`

#### `TaskTemplate`
- `id PK`
- `user_id FK`
- `name`
- `category`
- `default_duration_minutes`
- `room`

#### `Session`
- `id PK`
- `user_id FK`
- `task_template_id FK`
- `duration_minutes`
- `room`
- `started_at`
- `ended_at`
- `status ENUM("success","cancel","timeout")`
- `reward_exp`
- `reward_gold`

#### `Item`
- `id PK`
- `name`
- `type ENUM("hat","outfit","accessory")`
- `rarity`
- `sprite_key`

#### `Inventory`
- `id PK`
- `user_id`
- `item_id`
- `obtained_at`

#### `WorldState`
- `id PK`
- `user_id`
- `study_room_level`
- `build_room_level`
- `training_room_level`
- `total_sessions_success`
- `day_streak`
- `last_session_date`

---

## Reward Logic

### EXP Formula
```
exp = duration_minutes * 2
```

### Gold Formula
```
gold = duration_minutes * 1
```

### Level Up
```
exp_to_next = level * 100
```

### Cosmetic Drop Chance
```
10% chance per successful session
```

---

## World Progression Rules
```
5  successful sessions → Study Room L2
15 successful sessions → Build Room L2
30 successful sessions → Plaza upgrade
```

WorldState updates should be idempotent.

---

## API Endpoints

### GET `/api/profile`
Returns:
- user
- hero
- worldState

### GET `/api/tasks`
Returns task templates.

### POST `/api/session/start`
Body:
- task_template_id
- duration_minutes

Creates session with status = `pending`.

### POST `/api/session/complete`
Body:
- session_id

Backend:
1. Validates time window  
2. Computes EXP + Gold  
3. Rolls cosmetic drop  
4. Updates Hero & WorldState  
5. Returns:
```
{
  success: true,
  exp_reward,
  gold_reward,
  dropped_item: null or item
}
```

### GET `/api/inventory`
Returns list of cosmetics owned.

### POST `/api/inventory/equip`
Body:
- item_id

Updates hero.

---

## Cron / Scheduled Jobs (Optional Later)
- Daily streak reset (if no session in last 24h)
- Cosmetic shop rotation
- Seasonal events

---

## Security
- JWT or session-based auth
- Backend decides game logic, never trust client values
- Prevent duplicate session completions by locking `Session` rows

---

## Scalability (Future)
- Move session tracking to Redis  
- Microservice split: Auth / Inventory / WorldState  

For now: keep it simple.

