---
name: skill-aligner
description: Align skills with repository conventions. Trigger when a skill feels outdated, references missing files, or uses incorrect commands.
---

# Skill Aligner

Synchronize skills with the current state of the repository.

## Workflow

1.  **Audit the Skill**
    Read the `SKILL.md` file.
    *   Does it reference files that exist?
    *   Are the commands (`npm run ...`) correct?
    *   Is the terminology ("Brutalist", "Tone.js") accurate?

2.  **Cross-Reference**
    Check `AGENTS.md` and `package.json`.
    *   *Skill says*: `npm run test:unit`.
    *   *Repo says*: `npm run test`.
    *   *Action*: Update skill to use `npm run test`.

3.  **Update Content**
    *   **Paths**: Ensure file paths are relative to repo root.
    *   **Tone**: Use imperative instructions.
    *   **Constraints**: Add missing constraints (e.g., "Must use Tailwind v4").

## Example

**Input**: "Update `ci-hardener` to use the new lint script."

**Action**:
1.  Read `package.json`. See `"lint": "eslint ."`.
2.  Read `ci-hardener/SKILL.md`. See `"npm run lint:fix"`.
3.  **Update**: Change command to `npm run lint -- --fix` (if supported) or just `npm run lint`.

**Output**:
"Updated `ci-hardener` to reflect the consolidation of lint scripts in `package.json`."
