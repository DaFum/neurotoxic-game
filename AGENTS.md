# AGENTS.md

## Project Overview

**NEUROTOXIC: GRIND THE VOID v3.0** is a web-based "Roguelike Tour Manager" and "Rhythm Action" game. The player manages a Death Grindcore band, navigating a procedural map of Germany, managing resources (Money, Fuel, Harmony), and performing gigs via a 3-lane rhythm game (Pixi.js).

**Design Philosophy**: Aesthetic-first, brutalist UI with "Designer-Turned-Developer" sensibility.

## Quick Reference

| Category        | Technologies                                     |
| --------------- | ------------------------------------------------ |
| **Frontend**    | React 18.2.0, Vite 5.0.0, JavaScript (ESModules) |
| **Game Engine** | Pixi.js 8.0.0                                    |
| **Styling**     | Tailwind CSS v4, Framer Motion 12.0.0            |
| **Audio**       | Howler.js 2.2.4                                  |

## Project Structure

```text
neurotoxic-game/
├── docs/                   # Architecture & state documentation
│   ├── ARCHITECTURE.md     # Module relationships & diagrams
│   ├── STATE_TRANSITIONS.md # State machine documentation
│   └── CODING_STANDARDS.md # Detailed coding conventions
├── src/
│   ├── context/           # State management (see src/context/AGENTS.md)
│   ├── hooks/             # Custom React hooks (see src/hooks/AGENTS.md)
│   ├── scenes/            # Game screens (see src/scenes/AGENTS.md)
│   ├── utils/             # Game engines (see src/utils/AGENTS.md)
│   ├── components/        # Game components (see src/components/AGENTS.md)
│   ├── data/              # Static data (see src/data/AGENTS.md)
│   └── ui/                # UI components (see src/ui/AGENTS.md)
└── tests/                 # Unit tests
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

## Critical Constraints

1. **Version Pinning**: Do not upgrade React (18.x), Vite (5.x), or Tailwind (v4)
2. **Tailwind v4 Syntax**: Use `@import "tailwindcss";` (NOT `@tailwind base`)
3. **CSS Variables**: Never use hardcoded colors - use `var(--toxic-green)`, `var(--void-black)`, etc.
4. **State Safety**: Always validate `player.money >= 0` and `band.harmony > 0`

## Sub-Agent Architecture

For domain-specific guidance, consult specialized agent documentation:

| Agent          | Location                   | Expertise                                  |
| -------------- | -------------------------- | ------------------------------------------ |
| **Context**    | `src/context/AGENTS.md`    | State management, reducers, actions        |
| **Hooks**      | `src/hooks/AGENTS.md`      | Travel logic, purchase logic, custom hooks |
| **Scenes**     | `src/scenes/AGENTS.md`     | Screen navigation, game flow               |
| **Utils**      | `src/utils/AGENTS.md`      | Game engines, calculations, audio          |
| **Components** | `src/components/AGENTS.md` | Pixi.js, real-time rendering               |
| **Data**       | `src/data/AGENTS.md`       | Events, venues, songs, balance             |
| **UI**         | `src/ui/AGENTS.md`         | Design system, reusable components         |

## Documentation

| Document                          | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| `.github/copilot-instructions.md` | Detailed coding conventions for AI assistants |
| `docs/ARCHITECTURE.md`            | System diagrams and module relationships      |
| `docs/STATE_TRANSITIONS.md`       | State machine documentation                   |
| `docs/CODING_STANDARDS.md`        | JavaScript/React coding standards             |

## Git Workflow

1. **Branches**: Use descriptive names (`feat/event-system`, `fix/pixi-memory-leak`)
2. **Commits**: Use Conventional Commits (`feat:`, `fix:`, `docs:`)
3. **Pre-commit**: Ensure `npm run build` succeeds

---

_"Complexity is not an excuse for friction."_

## Maintenance

- Audio: Ambient playback starts on Start Tour and plays full MIDI tracks; gig playback starts from configured excerpts and stops at the song duration.  
- Last updated: 2026-02-06.
