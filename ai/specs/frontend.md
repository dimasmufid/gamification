# Nesra Town – Frontend (Next.js + Phaser) Specification

## Overview
This document defines the **frontend architecture** for Nesra Town, including the world, avatar movement, UI, session flow, and cosmetic systems.

## Tech Stack
- **Next.js (App Router)**
- **TypeScript**
- **Phaser 3** embedded in React
- **TailwindCSS** for UI
- **Zustand** (optional) for lightweight game/UI state
- **API** consumed via Next.js API routes or FastAPI

---

## Folder Structure
```
/app
  /page.tsx
  /game/page.tsx
  /api/... (for SSR-only utilities)

/game
  /phaser
    config.ts
    index.ts
    scenes/
      BootScene.ts
      WorldScene.ts
      UIScene.ts
    assets/
      tiles.png
      map.json
      player.png

/lib
  /models (TS interfaces)
  /utils
```

---

## Game Requirements

### 1. World Map
- Use **1 tilemap** (`map.json`)
- Layers:
  - `Ground`
  - `Walls` (with collision)
  - `Decorations`
  - `Interactables`
- Rooms (detected via rectangular zones):
  - Study Room
  - Build Room
  - Training Room
- World should support **layer visibility changes** based on backend `WorldState`.

---

### 2. Player Avatar
- WASD movement
- Sprite animations:
  - Idle
  - Walk
- Optional: dynamically swap full-body sprite based on equipped cosmetics.

---

### 3. UI Layout

#### Top Bar
- Avatar icon
- Level + XP bar
- Gold amount
- Daily streak

#### Right Panel Tabs
- Tasks
- Inventory
- History

#### Interaction Overlay
- In-room label (“Study Room”, etc.)
- Session timers
- Victory modal

---

### 4. Session Flow

#### Start
- Click "Start Session" button.
- Select task + duration.
- Timer overlay appears (blocking movement).
- Optional: subtle background animation.

#### Complete
- Show victory popup:
  - XP gained
  - Gold gained
  - Cosmetic drop (if any)
- Fetch updated hero state from backend.

---

### 5. Inventory System
- List cosmetics from backend API.
- On “Equip”, call API → update hero.
- Refresh Phaser world to apply new visuals.

---

### 6. World Progression
- Poll `/api/worldstate` on load.
- Toggle layers via Phaser:
  - `study_room_level_2`
  - `build_room_enhanced`
- Add small particle effects on level-up transitions.

---

## Integration Notes
- Frontend never calculates rewards—only displays them.
- Phaser emits events to React:
  - `onEnterRoom("study")`
  - `onSessionStart()`
  - `onSessionComplete()`

React passes updated state into Phaser when needed. 
