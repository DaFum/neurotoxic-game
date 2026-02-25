# AGENTS.md

## Project Overview

**NEUROTOXIC: GRIND THE VOID v3.0** is a web-based "Roguelike Tour Manager" and "Rhythm Action" game. The player manages a Death Grindcore band, navigating a procedural map of Germany, managing resources (Money, Fuel, Harmony), and performing gigs via a 3-lane rhythm game (Pixi.js).

**Design Philosophy**: Aesthetic-first, brutalist UI with "Designer-Turned-Developer" sensibility.

## Quick Reference

| Category        | Technologies                                     |
| --------------- | ------------------------------------------------ |
| **Frontend**    | React 19.2.4, Vite 7.3.1, JavaScript (ESModules) |
| **Game Engine** | Pixi.js 8.16.0                                   |
| **Styling**     | Tailwind CSS 4.2.0, Framer Motion 12.34.3        |
| **Audio**       | Tone.js 15.5.0 (WebAudio buffers)                |

## Project Structure

```text
neurotoxic-game/
├── docs/                         # Architecture, state, coding standards
├── src/
│   ├── context/                  # Global reducer + provider
│   ├── hooks/
│   │   └── rhythmGame/           # Gig loop split hooks
│   ├── scenes/                   # Route-level game screens
│   ├── utils/
│   │   ├── audio/                # Low-level audio internals (playback, MIDI, timing)
│   │   └── ...                   # Game engines (economy, social, events)
│   ├── components/
│   │   └── stage/                # Pixi manager classes & stage utils
│   ├── data/
│   │   └── events/               # Category event catalogs
│   └── ui/
│       └── shared/               # Reusable settings/slider controls
└── tests/                        # Node test suite
```

## Setup

```bash
cd neurotoxic-game
npm install
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run test         # Run unit tests
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

Notes: `npm run test` uses Node's built-in test runner with `tsx` and `tests/setup.mjs`; `npm run test:e2e` runs Playwright when configured.

## Critical Constraints

1. **Version Pinning**: Keep React at 19.2.4, Vite at 7.3.1, and Tailwind at 4.2.0 unless a task explicitly requests an upgrade
2. **Tailwind v4 Syntax**: Use `@import "tailwindcss";` (NOT `@tailwind base`)
3. **CSS Variables**: Never use hardcoded colors - use `var(--toxic-green)`, `var(--void-black)`, etc.
4. **State Safety**: Always validate `player.money >= 0` and `band.harmony > 0`

## Current Runtime Truths (Code-Aligned)

- Root runtime composition: `ErrorBoundary` → `GameStateProvider` → scene renderer + global overlays (`HUD`, `ToastOverlay`, `ChatterOverlay`, `TutorialManager`, `EventModal`).
- Scene set in active use: `INTRO`, `MENU`, `SETTINGS`, `CREDITS`, `GAMEOVER`, `OVERWORLD`, `TRAVEL_MINIGAME`, `PREGIG`, `PRE_GIG_MINIGAME`, `GIG`, `POSTGIG`.
- **Node Types**: `START`, `GIG`, `FESTIVAL` (Capacity ≥ 1000), `REST_STOP`, `SPECIAL`, `FINALE`.
- **Game Flow**: `TRAVEL_MINIGAME` now routes directly to `PREGIG` for performance venues, skipping the overworld flash.
- Reducer/Event guardrails currently enforce:
  - `player.money >= 0` via shared state clamps
  - `band.harmony` clamped to `1..100` via shared state clamps
  - loaded scenes validated against an allowlist before state restore
  - event flags do not mutate non-canonical player fields
- Audio runtime path: Main Menu start/load actions call `audioManager.startAmbient()`; ambient prefers OGG buffer playback and falls back to MIDI synthesis. Gig playback uses excerpted buffers with bounded playback windows.
- Test surface: Node test runner (`tests/`) + optional Playwright e2e (`npm run test:e2e`).

## Sub-Agent Architecture

For domain-specific guidance, consult specialized agent documentation:

| Agent            | Location                         | Expertise                                                   |
| ---------------- | -------------------------------- | ----------------------------------------------------------- |
| **Context**      | `src/context/AGENTS.md`          | State management, reducers, actions                         |
| **Hooks**        | `src/hooks/AGENTS.md`            | Travel logic, purchase logic, custom hooks                  |
| **Scenes**       | `src/scenes/AGENTS.md`           | Screen navigation, game flow                                |
| **Utils**        | `src/utils/AGENTS.md`            | Game engines, calculations, audio                           |
| **Components**   | `src/components/AGENTS.md`       | Pixi.js, real-time rendering                                |
| **Data**         | `src/data/AGENTS.md`             | Events, venues, songs, balance                              |
| **UI**           | `src/ui/AGENTS.md`               | Design system, reusable components                          |
| **Stage**        | `src/components/stage/AGENTS.md` | Pixi stage managers, render-loop lifecycle                  |
| **Rhythm Hooks** | `src/hooks/rhythmGame/AGENTS.md` | Gig loop timing/input/scoring orchestration                 |
| **Audio Utils**  | `src/utils/audio/AGENTS.md`      | Low-level WebAudio/Tone resource handling                   |
| **Event Data**   | `src/data/events/AGENTS.md`      | Event catalog schema and balancing rules                    |
| **UI Shared**    | `src/ui/shared/AGENTS.md`        | Reusable settings/slider controls                           |
| **Minigames**    | `src/hooks/minigames/AGENTS.md`  | Minigame loop timing, input handling, scoring orchestration |

## Architecture Guard Updates

### [project-brain-codex-instructions]

- State guardrails are centralized via `src/utils/gameStateUtils.js` helpers (`clampPlayerMoney`, `clampBandHarmony`, `applyInventoryItemDelta`) and reused by both reducer flows and event-delta application paths.
- Tempo timing in `src/utils/rhythmUtils.js` now uses a single processed-map path (`ensureProcessedTempoMap` + `findTempoSegment`) instead of maintaining a legacy fallback branch.
- Audio asset URL maps are unified through `buildAssetUrlMap`; avoid reintroducing wrapper-only APIs such as `buildMidiUrlMap`.
- `useArrivalLogic` encapsulates the complex side-effects of arriving at a map node (autosave, event trigger, day advance) and handles routing to avoid logic duplication.
- **Economy Flow**: Travel only consumes Fuel Liters and Money for Food. Monetary gas costs are handled exclusively via the "Refuel" action.
- **Map Icons**: Node types use distinct icons: House (Start), Skull (Club), Flame (Festival), Campfire (Rest), Mystery (Special), Star (Finale).

### [minigame-architecture-guard]

- **Structure**: Minigames (`TRAVEL_MINIGAME`, `PRE_GIG_MINIGAME`) follow a split-layer pattern:
  - **Logic**: Pure React hooks (`useTourbusLogic`, `useRoadieLogic`) managing collision, movement, and scoring.
  - **Rendering**: PixiJS StageControllers (`TourbusStageController`, `RoadieStageController`) driving the visual loop.
  - **State**: Global state updates (damage, items) flow through `gameReducer` actions (`COMPLETE_TRAVEL_MINIGAME`, `COMPLETE_ROADIE_MINIGAME`).
- **Flow**:
  - `OVERWORLD` → `TRAVEL_MINIGAME` (Tourbus) → `OVERWORLD` (Arrival)
  - `PREGIG` → `PRE_GIG_MINIGAME` (Roadie) → `GIG`
- **Constraints**: Minigame hooks must not directly manipulate DOM or Pixi objects; they return reactive state for the StageController to consume.

### [state-safety-action-creator-guard]

- Do not add reducer-critical state mutations to `delta.flags`; use explicit action payload slices (`player`, `band`, `social`) and action creators instead.
- `delta.flags.score` is intentionally unsupported to prevent player-state schema drift from event payloads.
- Any new state field must be wired atomically across `ActionTypes`, reducer handling, action creators, and tests.

## Documentation

| Document                            | Purpose                                       |
| ----------------------------------- | --------------------------------------------- |
| `.github/copilot-instructions.md`   | Detailed coding conventions for AI assistants |
| `CLAUDE.md`                         | Assistant-facing architecture and style notes |
| `WIKI.md`                           | Documentation entry index                     |
| `docs/ARCHITECTURE.md`              | System/module architecture snapshot           |
| `docs/STATE_TRANSITIONS.md`         | Scene/event state machine behavior            |
| `docs/CODING_STANDARDS.md`          | JavaScript/React coding standards             |
| `docs/TAILWIND_V4_PATTERNS.md`      | Tailwind + animation/rendering patterns       |
| `docs/agent_knowledge_update.md`    | Recent system findings & corrections          |
| `docs/*_Exploration_Report.md`      | Deep-dive discovery & architecture analysis   |
| `neurotoxic-game-threat-model.md`   | Frontend threat model assumptions and risks   |
| `security_best_practices_report.md` | Current security findings summary             |

## Git Workflow

1. **Branches**: Use descriptive names (`feat/event-system`, `fix/pixi-memory-leak`)
2. **Commits**: Use Conventional Commits (`feat:`, `fix:`, `docs:`)
3. **Pre-commit**: Ensure `npm run build` succeeds

---

## AGENTS.md Usage (Codex Guidance)

These instructions track the latest AGENTS.md guidance for Codex. Keep project rules here and place targeted overrides in nested folders when needed.

### How Codex Discovers Guidance

1. **Global scope:** In `~/.codex`, Codex reads `AGENTS.override.md` if present; otherwise `AGENTS.md`. Only the first non-empty file applies.
2. **Project scope:** Starting at the repository root, Codex walks down to the working directory. At each directory, it checks `AGENTS.override.md`, then `AGENTS.md`, then any fallback filenames listed in `project_doc_fallback_filenames`. Codex includes at most one file per directory.
3. **Merge order:** Files are concatenated from root to leaf. Later files override earlier guidance.

Codex skips empty files and stops once the combined size reaches `project_doc_max_bytes` (default 32 KiB). Split guidance across nested directories or raise the limit if needed.

### Create Global Guidance

1. Ensure the Codex home directory exists:

   ```bash
   mkdir -p ~/.codex
   ```

2. Create reusable defaults in `~/.codex/AGENTS.md`.
3. Run `codex --ask-for-approval never "Summarize the current instructions."` to confirm it loads.

Use `~/.codex/AGENTS.override.md` for temporary global overrides without removing your base file.

### Layer Project Instructions

- Keep repository-level expectations in this file.
- Use nested `AGENTS.md` files for domain-specific rules.
- Use `AGENTS.override.md` only when you need to fully replace local guidance.

### Customize Fallback Filenames

If you already use alternate filenames (for example `TEAM_GUIDE.md`), add them to the fallback list:

```toml
# ~/.codex/config.toml
project_doc_fallback_filenames = ["TEAM_GUIDE.md", ".agents.md"]
project_doc_max_bytes = 65536
```

Restart Codex after changing configuration.

### CODEX_HOME Profiles

Use a custom profile when you need project-specific automation:

```bash
CODEX_HOME=$(pwd)/.codex codex exec "List active instruction sources"
```

### Verify Your Setup

- `codex --ask-for-approval never "Summarize the current instructions."`
- `codex --cd <subdir> --ask-for-approval never "Show which instruction files are active."`
- Review `~/.codex/log/codex-tui.log` (or the latest `session-*.jsonl`) if you need to audit loaded files.

### Troubleshoot Discovery Issues

- **Nothing loads:** Ensure you are in the intended repository, and that instruction files are non-empty.
- **Wrong guidance appears:** Check for `AGENTS.override.md` higher in the tree or inside `~/.codex`.
- **Fallback names ignored:** Confirm `project_doc_fallback_filenames` entries and restart Codex.
- **Instructions truncated:** Raise `project_doc_max_bytes` or split guidance into nested files.
- **Profile confusion:** Run `echo $CODEX_HOME` before launching Codex.

### Next Steps

- Visit <https://agents.md> for more AGENTS.md information.
- Review <https://developers.openai.com/codex/prompting> for Codex prompting guidance.

### Agent Skills

Codex can load skills from repository, user, admin, and system locations. In this repository, prefer checked-in skills under `.claude/skills` when they exist.

#### When to Use Skills

- Use a skill if the user explicitly references it (for example `$skill-creator`).
- Use a skill implicitly when the task matches its description.

#### Skill Locations (Priority)

- Repository: `.claude/skills` in the current directory, parent directories, or repository root.
- User: `~/.claude/skills`
- Admin: `/etc/codex/skills`
- System: bundled with Codex (for example `skill-creator`, `skill-installer`)

#### Skill Maintenance

- Keep skill descriptions precise so implicit matching behaves predictably.
- Restart Codex if newly added skills are not discovered.
- Disable skills via `~/.codex/config.toml` when needed.
- Repository skills are stored in `.claude/skills`; refer to that directory for the current skill list.
- Use `skill-qa-harness` to validate skill metadata and prompt-case expectations.
- Use `skilltest` for comprehensive skill standard validation and reporting.
- Use `skill-aligner` to rewrite skills so they match current repository conventions.
- Use `mega-lint-snapshot` to generate MegaLinter-style lint logs for CI diagnostics.

---

_"Complexity is not an excuse for friction."_

## Maintenance

- Audio: The audio architecture has been updated with the following principles:
  - `AudioManager` consumes playback, mute, and transport state strictly through `audioEngine` facade wrappers (no direct Tone.js access).
  - UI sync should consume `AudioManager` through its reactive snapshot/subscription interface (`getStateSnapshot` + `subscribe`) to avoid per-component audio-state drift.
  - The rhythm loop and input timing now use `audioEngine.getGigTimeMs()` and `audioEngine.getTransportState()` as the single runtime clock source.
  - Ambient playback continues to be initiated by main-menu tour actions via `AudioManager.startAmbient()`, with OGG-first and MIDI fallback behavior.
  - Gig note parsing and playback now resolve excerpt windows via `resolveSongPlaybackWindow` (`excerptEndMs - excerptStartMs` → `excerptDurationMs` → `durationMs`), with no synthetic default excerpt cap when metadata is absent.
- Performance: Heavy scenes are lazy-loaded in `App.jsx` via `createNamedLazyLoader` to reduce initial bundle execution and speed up first render.
- UI: Toast taxonomy remains `success`/`error`/`warning`/`info`, with `info` rendered using the blue token (`--info-blue`).
- Chatter: Default fallback chatter is limited to `MENU`, `OVERWORLD`, `PREGIG`, and `POSTGIG`; `GIG` requires explicit conditional chatter entries.
- State safety: Event delta handling intentionally rejects `flags.score` and keeps score ownership outside the global overworld player schema.
- **Economy Update**: Refactored `calculateTravelExpenses` and `calculateGigExpenses` to prevent double-charging fuel. Fuel cost is now paid only at gas stations; travel only deducts liters and food.
- **Social System Overhaul**: `socialEngine.js` generates dynamic arrays of `postOptions.js`, causing wide-ranging Game State side effects (Shadowban `controversyLevel`, Fan `loyalty`, Lead Singer `egoFocus`, and Harmony/Mood swings). `simulationUtils.js` incorporates passive multi-platform perks (IG Stamina, YouTube Money, TikTok Surges) triggered at 10k follower milestones.
- **Traits & Brand Deals**: Expanded trait system (Showman, Tech Wizard, Melodic Genius) with specific unlock conditions. Added `Brand Deals` system (`generateBrandOffers`) and Social Trends (`generateDailyTrend`) affecting post weights.
- **UI Architecture**: Refactored `PostGig` scene into modular components (`ReportPhase`, `SocialPhase`, `DealsPhase`, `CompletePhase`). Includes comprehensive validation (`saveValidator.js`) and "Reject All" functionality for streamlined gameplay.
- Last updated: 2026-02-25.
