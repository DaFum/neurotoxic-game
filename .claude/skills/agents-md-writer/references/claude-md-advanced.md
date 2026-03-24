# CLAUDE.md — Advanced Features Reference

Deep dive into Claude Code-specific context file features that go beyond what AGENTS.md can express.

## Table of Contents

1. File Discovery and Loading Order
2. Import System
3. Rules Directory
4. Monorepo Configuration
5. HTML Comments
6. Effort Frontmatter
7. Auto-Memory Integration
8. Context Budget Management
9. Subdirectory CLAUDE.md Patterns

---

## 1. File Discovery and Loading Order

Claude Code discovers CLAUDE.md files in two ways:

**Ancestor walk (loaded at launch):** Starting from the current working directory, Claude walks up the directory tree loading every CLAUDE.md it finds. If you run `claude` in `foo/bar/`, it loads both `foo/bar/CLAUDE.md` and `foo/CLAUDE.md`.

**Descendant discovery (loaded on access):** CLAUDE.md files in subdirectories are NOT loaded at launch. They are included when Claude reads files in those subdirectories during a session. This means subdirectory instructions are contextual — they only activate when relevant.

**Precedence:** More specific (closer to working directory) files take precedence over general (higher in tree) files. If instructions conflict, Claude may pick one arbitrarily — avoid contradictions.

**Additional directories:** The `--add-dir` flag gives Claude access to directories outside the main working directory. CLAUDE.md files from additional directories are NOT loaded by default. Set `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` to include them.

---

## 2. Import System

### Syntax

Use `@path/to/file` anywhere in a CLAUDE.md file to import another file's content:

```markdown
# Project Instructions

@docs/architecture-decisions.md
@package.json
@AGENTS.md

## Additional Rules

- Always run migrations after pulling
```

### Resolution rules

- Relative paths resolve from the file containing the import, NOT the working directory
- Absolute paths are also supported
- Imports are recursive up to 5 levels deep
- Imported files are expanded and loaded into context at launch alongside the CLAUDE.md that references them

### Best practices

- Import shared instructions from AGENTS.md to avoid duplication
- Import key config files (package.json, pyproject.toml) only if they contain non-obvious configuration that agents need to know about
- Don't import large files — they consume context budget. Import only what's essential.
- Use imports as progressive disclosure: keep CLAUDE.md lean, import details that are occasionally needed

### Example: Lean root CLAUDE.md using imports

```markdown
# myproject — Claude Instructions

@AGENTS.md
@docs/api-contracts.md

## Claude-Specific

- Auto-memory is enabled — corrections persist across sessions
- Run `make lint` via hooks on PostFileWrite for \*.py
```

This keeps the root file under 10 lines while giving Claude access to shared instructions and API contracts when needed.

---

## 3. Rules Directory

### Structure

```
.claude/
└── rules/
    ├── general.md          # Always loaded
    ├── frontend.md         # Scoped to frontend files
    ├── api.md              # Scoped to API files
    └── testing.md          # Scoped to test files
```

### Frontmatter scoping

Rules files support `paths:` frontmatter to control when they activate:

```markdown
---
paths:
  - src/api/**
  - src/middleware/**
---

API handlers must validate request bodies using Zod schemas.
All endpoints must return standardized error responses with `code`, `message`, and `details` fields.
```

### When to use rules/ vs. subdirectory CLAUDE.md

- **Rules directory**: Better for cross-cutting concerns that apply to file patterns (e.g., "all \*.test.ts files should use vitest")
- **Subdirectory CLAUDE.md**: Better for directory-scoped conventions (e.g., "everything in backend/ uses Express middleware pattern")

Both work. Use whichever matches your mental model.

### Caution with large rule sets

A known issue in monorepos: path-scoped rules can be re-injected as system reminders on every tool call, consuming significant context window space. If you have many rule files, monitor context usage with `/context` and consolidate aggressively. Fewer, more focused rules are better than many granular ones.

---

## 4. Monorepo Configuration

### The problem

In a monorepo with multiple teams, ancestor CLAUDE.md files and rules from other teams get loaded and consume context budget even when irrelevant.

### claudeMdExcludes

Add to `.claude/settings.local.json` (local to your machine, not committed):

```json
{
  "claudeMdExcludes": [
    "**/other-team/CLAUDE.md",
    "**/infrastructure/.claude/rules/**",
    "/home/user/monorepo/legacy/CLAUDE.md"
  ]
}
```

Patterns are matched against absolute file paths using glob syntax. Can be set at user, project, local, or managed policy level. Arrays merge across layers. Managed policy CLAUDE.md files cannot be excluded.

### Monorepo CLAUDE.md strategy

```
monorepo/
├── CLAUDE.md                    # Minimal shared rules (build system, CI, commit format)
├── AGENTS.md                    # Cross-tool shared rules
├── packages/
│   ├── frontend/
│   │   └── CLAUDE.md            # React/Vite conventions
│   ├── backend/
│   │   └── CLAUDE.md            # Express/Prisma conventions
│   └── shared/
│       └── CLAUDE.md            # Shared library conventions
└── .claude/
    └── settings.local.json      # Per-developer excludes
```

The root CLAUDE.md should be extremely minimal — just the monorepo-wide essentials (workspace tool, CI system, commit format). Each package gets its own CLAUDE.md with package-specific instructions.

### Sparse worktrees

For very large monorepos, use `worktree.sparsePaths` in Claude Code settings to check out only the directories you need:

```json
{
  "worktree": {
    "sparsePaths": ["packages/frontend", "packages/shared"]
  }
}
```

---

## 5. HTML Comments

`<!-- comments -->` in CLAUDE.md are hidden from Claude when auto-injected at session start but remain visible when Claude reads the file with the Read tool.

Use cases:

- Human-only maintenance notes: `<!-- Last reviewed: 2026-03-15 by @alice -->`
- Documenting why a rule exists (for human maintainers, not the agent)
- Temporarily disabling rules without deleting them

```markdown
## Critical Commands

<!-- This changed in v3.2 — see PR #847 for context -->

- Build: `turbo build --filter=@myorg/api`

<!-- DISABLED: re-enable after migration completes
## Legacy API
- The /v1/ endpoints are frozen — all new work goes to /v2/
-->
```

---

## 6. Effort Frontmatter

Skills and slash commands support `effort:` frontmatter to override the model effort level. This also works in CLAUDE.md for custom commands:

```markdown
---
effort: high
---
```

Effort levels: `low` (○), `medium` (◐), `high` (●). Use `high` for complex architectural tasks, `low` for quick fixes.

---

## 7. Auto-Memory Integration

Claude Code has a separate auto-memory system that accumulates learnings from your corrections across sessions. These are stored separately from CLAUDE.md.

**How they interact:**

- CLAUDE.md: instructions you write explicitly
- Auto-memory: notes Claude writes based on your corrections and preferences

**Guidance for context files:**

- Don't duplicate what auto-memory will learn naturally (like "I prefer tabs over spaces" — Claude will pick this up from corrections)
- DO include hard constraints that Claude shouldn't learn by trial-and-error (like "never deploy to production from main branch")
- You can reference auto-memory behavior: "Auto-memory is enabled — don't ask about preferences I've already corrected"

Subagents can also maintain their own auto-memory.

---

## 8. Context Budget Management

Claude Code has a system reminder that says:

> "IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task."

This means Claude will **ignore** CLAUDE.md content it deems irrelevant. The more irrelevant content you include, the more likely Claude deprioritizes everything — including the important instructions.

### Guidelines

- Root CLAUDE.md: under 300 lines (ideally under 60 for focused projects)
- Total context from all CLAUDE.md files + rules: monitor with `/context` command
- Use progressive disclosure: keep rarely-needed details in separate files, import or reference them
- Periodically audit: remove rules that Claude consistently follows without being told

### Red flags

- `/context` shows CLAUDE.md consuming >10% of the context window
- Claude ignoring instructions that are clearly in CLAUDE.md
- Rules being re-injected on every tool call (check with verbose mode)

---

## 9. Subdirectory CLAUDE.md Patterns

### Pattern: Frontend/Backend split

```markdown
# frontend/CLAUDE.md

## Component Conventions

- All components must export a Storybook story in `*.stories.tsx`
- Use `data-testid` attributes for E2E test selectors (not CSS classes)
```

```markdown
# backend/CLAUDE.md

## API Conventions

- All new endpoints need OpenAPI annotations via decorators
- Database queries must use the repository pattern in `src/repos/`
```

### Pattern: Generated code protection

```markdown
# src/generated/CLAUDE.md

DO NOT edit files in this directory. They are auto-generated from:

- Protobuf definitions in `../proto/`
- OpenAPI spec in `../api/openapi.yaml`

To make changes, edit the source files and run `make generate`.
```

### Pattern: Legacy code isolation

```markdown
# legacy/CLAUDE.md

This directory is frozen. Do not modify any files here.
When you need functionality from legacy code, create wrapper modules in `src/adapters/` instead.
The legacy code uses jQuery and ES5 — do not attempt to modernize it.
```
