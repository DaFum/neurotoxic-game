# State Transitions Documentation

This document tracks current scene/state transitions implemented in `GameState`, reducer actions, and scene components.

## Scene State Machine

```mermaid
stateDiagram-v2
    [*] --> INTRO: initialState.currentScene
    INTRO --> MENU: Intro skip/end

    MENU --> OVERWORLD: New game / load
    MENU --> SETTINGS: Open settings
    MENU --> CREDITS: Open credits

    SETTINGS --> MENU: Return
    CREDITS --> MENU: Return

    OVERWORLD --> TRAVEL_MINIGAME: Move to node
    TRAVEL_MINIGAME --> PREGIG: Arrival at GIG/FESTIVAL/FINALE
    TRAVEL_MINIGAME --> OVERWORLD: Arrival at non-GIG node

    OVERWORLD --> PREGIG: Start gig at current GIG node
    OVERWORLD --> GAMEOVER: Stranded / fail condition

    PREGIG --> PRE_GIG_MINIGAME: Confirm loadout
    PREGIG --> OVERWORLD: Back out

    PRE_GIG_MINIGAME --> GIG: Equipment delivered

    GIG --> POSTGIG: Song resolve
    GIG --> OVERWORLD: Escape/quit path

    POSTGIG --> OVERWORLD: Continue tour
    POSTGIG --> GAMEOVER: Bankruptcy / fail condition

    GAMEOVER --> MENU: Restart
```

### Node Types & Interaction

- `GIG`, `FESTIVAL`, `FINALE`: Trigger performance flow (`PREGIG`).
- `REST_STOP`: Recover Stamina/Mood.
- `SPECIAL`: Trigger unique events.
- `START`: Return to HQ.

## Reducer-Driven Transition Rules

| Action                     | Transition                     | Notes                                                 |
| -------------------------- | ------------------------------ | ----------------------------------------------------- |
| `CHANGE_SCENE`             | `* -> payload`                 | Generic scene transition entrypoint.                  |
| `START_GIG`                | `* -> PREGIG`                  | Also sets `currentGig`.                               |
| `START_TRAVEL_MINIGAME`    | `OVERWORLD -> TRAVEL_MINIGAME` | Sets `minigameState`.                                 |
| `COMPLETE_TRAVEL_MINIGAME` | `TRAVEL_MINIGAME -> *`         | Updates state; routing deferred to `useArrivalLogic`. |
| `START_ROADIE_MINIGAME`    | `PREGIG -> PRE_GIG_MINIGAME`   | Sets equipment list.                                  |
| `COMPLETE_ROADIE_MINIGAME` | `PRE_GIG_MINIGAME -> GIG`      | Applies damage penalties.                             |
| `LOAD_GAME`                | `* -> safeLoadedScene`         | Scene validated against allowlist.                    |
| `RESET_STATE`              | `* -> INTRO`                   | Uses fresh initial state factory.                     |

## Event Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> CandidateCheck: triggerEvent(...)
    CandidateCheck --> Idle: no matching event
    CandidateCheck --> Active: event found
    Active --> Resolving: player choice
    Resolving --> ApplyingDelta: resolveEventChoice (in eventEngine)
    ApplyingDelta --> Idle: APPLY_EVENT_DELTA + clear activeEvent
```

Notes:

- `activeEvent` controls modal visibility.
- `pendingEvents`, `eventCooldowns`, and `activeStoryFlags` constrain repeat/event pacing.

## Core Resource Transitions

### Money

- Updated through player updates, gig results, and event deltas.
- Clamped in reducer to never drop below zero.

### Harmony

- Updated by travel/events/gig outcomes.
- Clamped in reducer to stay in valid gameplay range (`1..100`).

### Day progression

- `ADVANCE_DAY` advances simulation and can trigger downstream economy/social effects.

## Gig Runtime State (High level)

Gig internals are managed by rhythm hooks and Pixi stage runtime:

- `useRhythmGameLogic` orchestrates rhythm lifecycle.
- `hooks/rhythmGame/*` modules manage timing loop, scoring, input, notes, and effects.
- Final gig stats are persisted via `SET_LAST_GIG_STATS` and consumed in `POSTGIG`.

---

_Last updated: 2026-02-23._
