---
name: project-brain-codex-instructions
description: generate comprehensive project context and instructions. Trigger when onboarding a new agent, creating a README, or summarizing the project architecture.
---

# Project Brain Codex

Synthesize the project's architecture, constraints, and workflows into a single instruction set.

## Workflow

1.  **Ingest Sources**
    Read key documentation files:
    *   `AGENTS.md` (Primary rules).
    *   `package.json` (Dependencies).
    *   `.github/copilot-instructions.md` (Coding style).

2.  **Synthesize Constraints**
    Extract non-negotiables:
    *   **Stack**: React 18, Vite 5, Tailwind 4.
    *   **State**: Immutable, Reducer-driven.
    *   **Style**: Brutalist, CSS Variables.

3.  **Map Architecture**
    Describe the folder structure and domain ownership.
    *   `src/scenes/` -> Game Loops.
    *   `src/data/` -> Static Content.
    *   `src/utils/` -> Logic Engines.

4.  **Format Output**
    Create a Markdown document with clear sections:
    *   **Project Overview**
    *   **Tech Stack**
    *   **Core Rules**
    *   **Architecture Map**

## Example

**Input**: "Create a summary for a new developer."

**Output**:
```markdown
# NEUROTOXIC Project Codex

## Project Overview
Neurotoxic is a brutalist rhythm game...

## Tech Stack
- React 18 + Vite 5
- Tailwind 4 (Brutalist Design)
- Pixi.js 8 + Tone.js 15

## Core Rules
1. **State**: Never mutate `gameState` directly. Use reducers.
2. **Audio**: Init AudioContext only after user gesture.
3. **Assets**: Use `import.meta.glob` for dynamic assets.

## Architecture Map
- `src/scenes/`: Main game states (Overworld, Gig).
- `src/utils/audioEngine.js`: Central audio controller.
```

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
