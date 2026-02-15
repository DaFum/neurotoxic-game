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
| **Audio**       | Tone.js 15.x (WebAudio buffers)                  |

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

- Audio: Ambient playback starts on Start Tour and plays full MIDI tracks; gig playback starts from configured excerpts via WebAudio buffers and stops at the song duration.
- Last updated: 2026-02-13.
