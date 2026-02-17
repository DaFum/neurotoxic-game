---
name: skill-aligner
description: align skills with repository conventions. Trigger when a skill feels outdated, references missing files, or uses incorrect commands.
---

# Skill Aligner

Synchronize skills with the current state of the repository.

## Workflow

1.  **Audit the Skill**
    Read the `SKILL.md` file.
    - Does it reference files that exist?
    - Are the commands (`npm run ...`) correct?
    - Is the terminology ("Brutalist", "Tone.js") accurate?

2.  **Cross-Reference**
    Check `AGENTS.md` and `package.json`.
    - _Skill says_: `npm run test:unit`.
    - _Repo says_: `npm run test`.
    - _Action_: Update skill to use `npm run test`.

3.  **Update Content**
    - **Paths**: Ensure file paths are relative to repo root.
    - **Tone**: Use imperative instructions.
    - **Constraints**: Add missing constraints (e.g., "Must use Tailwind v4").

## Example

**Input**: "Update `ci-hardener` to use the new lint script."

**Action**:

1.  Read `package.json`. See `"lint": "eslint ."`.
2.  Read `ci-hardener/SKILL.md`. See `"npm run lint:fix"`.
3.  **Update**: Change command to `npm run lint:fix` (or modify `lint` script to support `--fix`).

**Output**:
"Updated `ci-hardener` to reflect the consolidation of lint scripts in `package.json`."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
