---
name: repo-navigator-agents-routing
description: route requests to the correct domain and `AGENTS.md`. Trigger when asked where code lives, who owns a feature, or how the repo is organized.
---

# Repo Navigator

Direct questions to the correct domain and authoritative documentation.

## Domain Map

| Domain      | Path              | Owner Of                         |
| :---------- | :---------------- | :------------------------------- |
| **State**   | `src/context/`    | Reducers, Actions, Global State. |
| **Logic**   | `src/hooks/`      | Game Loop, Business Logic.       |
| **Flow**    | `src/scenes/`     | Screens, Page Routing.           |
| **Engine**  | `src/utils/`      | Audio, Math, Pure Functions.     |
| **View**    | `src/components/` | PixiJS, Canvas Rendering.        |
| **UI**      | `src/ui/`         | React DOM, HUD, Menus.           |
| **Content** | `src/data/`       | Static JSON, config, text.       |

## Workflow

1.  **Analyze the Intent**
    - "Where is the player health stored?" -> **State**.
    - "How does the damage calculation work?" -> **Engine** or **Logic**.
    - "Change the button color." -> **UI**.

2.  **Consult Authority**
    Always read the root `AGENTS.md` first for project overview, then the domain-specific `AGENTS.md`.
    - `src/context/AGENTS.md` defines state rules.
    - `src/ui/AGENTS.md` defines styling rules.

3.  **Direct the User**
    Point to the file and the documentation.

## Example

**Input**: "I want to change the starting money."

**Routing**:

1.  **Money** is global state -> `src/context/`.
2.  **Starting values** -> `src/context/initialState.js`.
3.  **Rules** -> `src/context/AGENTS.md`.

**Output**:
"Modify `src/context/initialState.js`. Consult `src/context/AGENTS.md` for state constraints."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
