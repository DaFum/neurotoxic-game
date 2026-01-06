# AGENTS.md

## Project Overview
**NEUROTOXIC: GRIND THE VOID v3.0** is a web-based "Roguelike Tour Manager" and "Rhythm Action" game. The player manages a Death Grindcore band, navigating a procedural map of Germany, managing resources (Money, Fuel, Harmony), and performing gigs via a 3-lane rhythm game mechanics (Pixi.js).

The project is built by a **"Designer-Turned-Developer"** persona:
-   **Aesthetic First**: Brutalist design, "Toxic Green" (#00FF41) on "Void Black" (#0A0A0A), Glitch effects, CRT scanlines.
-   **Functional Core**: React 18 for UI/State, Pixi.js for the Rhythm Game Engine.

## Tech Stack

### Frontend Core
-   **Framework**: React 18 (`v18.2.0`)
-   **Build Tool**: Vite (`v5.0.0`)
-   **Language**: JavaScript (ESModules)

### Game Engine & Visuals
-   **Rhythm Engine**: Pixi.js (`v8.0.0`) - Used for high-performance 2D rendering in `Gig.jsx`.
-   **Animations**: Framer Motion (`v12.0.0`) - Used for UI transitions and modals.
-   **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) - Configured with CSS variables for the color palette.

### Audio
-   **Library**: Howler.js (`v2.2.4`) - Planned for audio playback.

## Global Context & Navigation

The project root is `neurotoxic-game/`. All commands must be run from this directory.

-   📂 `src/context`: Global State Management (`GameState.jsx`). Handles Player stats, Band stats, Inventory, and Event triggering.
-   📂 `src/scenes`: Major game states.
    -   `MainMenu.jsx`: Entry point.
    -   `Overworld.jsx`: Map navigation and travel logic.
    -   `PreGig.jsx`: Strategic preparation (Budget allocation).
    -   `Gig.jsx`: The core Rhythm Game (Pixi.js implementation).
    -   `PostGig.jsx`: Economic summary and scoring.
-   📂 `src/data`: Static game data.
    -   `events.js`: Database of random encounters.
    -   `venues.js`: List of ~45 playable locations.
-   📂 `src/ui`: Reusable UI components (`HUD`, `EventModal`).

**[INSTRUCTION]**: This is a single-repo structure. Complex logic resides in `src/scenes/Gig.jsx` (Rhythm Engine) and `src/context/GameState.jsx` (Economy/Events).

## Setup & Commands

To start working on the project:

```bash
# Navigate to project root
cd neurotoxic-game

# Install dependencies
npm install

# Start Development Server
npm run dev
# Server usually starts at http://localhost:5173
```

## Code Style & Conventions

### Aesthetic Directives (STRICT)
1.  **Color Palette**: NEVER use default colors. Use CSS variables defined in `src/index.css`:
    -   `var(--toxic-green)`: Primary accent, text, borders.
    -   `var(--void-black)`: Backgrounds.
    -   `var(--blood-red)`: Errors, critical hits.
2.  **Typography**:
    -   Headers: `'Metal Mania'` (via Google Fonts).
    -   UI/Code: `'Courier New'` or Monospace.
3.  **UI Elements**:
    -   Buttons must be uppercase, boxy, and have hover effects (invert colors).
    -   Always include the `.crt-overlay` div in the main layout for the scanline effect.

### Coding Standards
-   **State Management**: Use `useGameState()` hook to access global context. Do not prop-drill deeply.
-   **Pixi.js Integration**: Always wrap Pixi application creation in a `useEffect` with a `isMountedRef` check to prevent memory leaks during React strict-mode double renders. See `src/scenes/Gig.jsx` for the pattern.
-   **Tailwind v4**: Use `@import "tailwindcss";` in CSS. Use utility classes for layout, but rely on CSS variables for theming.

## Testing

-   **Type**: Currently manual verification via Playwright scripts.
-   **Location**: Verification scripts are generated on-demand (e.g., `/home/jules/verification/`).
-   **Coverage**: Focus on "Happy Path" verification (Game Loop continuity).

## Development Environment

-   **Node Version**: Compatible with standard LTS.
-   **Asset Handling**: Assets (Audio/Images) are currently referenced via placeholders or public URL. `ASSET_REQUEST_LIST.md` details missing assets.

## Security & Guardrails

1.  **State Safety**: Ensure `player.money` and `band.harmony` checks prevent infinite negative values (Game Over logic).
2.  **Dependency Versions**: Do not upgrade `vite` or `react` to alpha/beta versions (e.g., v7/v19) as they break compatibility with current `lucide-react` and `eslint` configurations. Stick to the versions in `package.json`.
3.  **Tailwind Config**: Do not revert to Tailwind v3 syntax (`@tailwind base`). Keep the v4 configuration (`@import "tailwindcss";`).

## Git & PR Workflow

1.  **Branching**: Use descriptive feature branches (e.g., `feat/event-system`, `fix/pixi-memory-leak`).
2.  **Commits**: Use Conventional Commits (`feat:`, `fix:`, `docs:`).
3.  **Checks**: Ensure the app builds (`npm run build`) before submitting.
