# Agent-Customization Prompt Template

Purpose

- Reusable prompt to generate or update small agent customization files (AGENTS.md, CLAUDE.md, .github/copilot-instructions.md, `.cursor` rules).
- Enforce the repository's "Golden Rule": include only items that are non-discoverable, would cause failures if missed, and are specific/actionable.

How to use

- Fill the placeholders in the template below and paste the full prompt to your assistant (Copilot/Claude/OpenAI).
- If available, attach or list the small set of context files to read (e.g., `package.json`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`).
- Answer any clarification questions the assistant returns before accepting the file.

Prompt template (copy & paste)

```
You are a concise, repository-aware agent-instruction writer.
Goal: Produce a minimal context file that follows this repo's conventions and the Golden Rule.

Inputs (fill these):
- Purpose (one line): <e.g., "Minimal AGENTS.md for CI and i18n gotchas">
- Target file path: <relative path to write, e.g., AGENTS.md | CLAUDE.md | .github/copilot-instructions.md | .github/instructions/my.instructions.md>
- Scope / applyTo (optional glob): <e.g., src/**>
- Files to read (optional list): <package.json, AGENTS.md, CLAUDE.md, README.md>
- Non-discoverable rules (bullet list):
  - <rule 1>
  - <rule 2>
- Tooling/constraints (optional): <e.g., pnpm, Node 22.13+, Tailwind v4>
- Validate (yes/no): <run validate_context_file.py?>

Requirements for the assistant output:
1. Only output the final file content (markdown). Do NOT include a file system play-by-play.
2. Keep output under ~300 words unless more is explicitly requested.
3. Use these sections only if they contain content: "Critical Commands", "Architecture Constraints", "Testing", "Style & Conventions", "Gotchas".
4. At the top include a one-line summary (purpose) and a single-line commit-message suggestion.
5. Follow Conventional Commits for the suggested commit message.
6. Avoid duplicating README content or listing the directory structure.
7. If any required input is missing or ambiguous, return a short list of clarifying questions and do NOT write the file yet.

Return format (exact):
---FILE---
<markdown content to write to the target file>
---COMMIT---
<one-line conventional-commit message>
---QUESTIONS---
<either an empty list or 1-3 clarifying questions>
```

Example invocations

- Create a minimal AGENTS.md capturing only non-discoverable rules and test/lint commands:
  - Purpose: "Root AGENTS.md — CI, Node, i18n, gotchas"
  - Target file path: `AGENTS.md`
  - Files to read: `package.json`, `README.md`, `CLAUDE.md`
  - Non-discoverable rules: `pnpm only`, `Node 22.13+`, `update both en/de locales when adding i18n keys`.

- Create a Copilot-scoped instruction under `src/` that imports AGENTS.md and highlights 3 high-impact rules:
  - Purpose: "Copilot rules for src/"
  - Target file path: `.github/instructions/agent-customization.instructions.md`
  - Scope: `src/**`
  - Non-discoverable rules: `do not import PIXI in minigame hooks`, `use audioEngine.getGigTimeMs()`.

Validator (optional)

- To validate a generated context file locally, run:

```bash
python .claude/skills/agents-md-writer/scripts/validate_context_file.py <path-to-file> --readme README.md
```

Notes for maintainers

- Keep the prompt minimal. If you want the rule to apply repo-wide, create or update `AGENTS.md` instead of many scoped files.
- This template intentionally forces the assistant to ask clarifying questions when inputs are incomplete.

Saved-by: agent-customization.prompt.md
