---
name: agents-md-writer
description: Write high-quality AGENTS.md, CLAUDE.md, or CODEX.md context files for code repositories. Use this skill whenever the user asks to create, write, generate, improve, or review a repository context file for coding agents — including any mention of "AGENTS.md", "CLAUDE.md", "CODEX.md", "GEMINI.md", ".cursorrules", "copilot-instructions.md", "context file for agents", "agent instructions", "coding agent setup", or requests like "help my AI agent understand this repo". Also trigger when users say things like "initialize agent config", "set up Claude Code for my project", "write instructions for Codex/Copilot", "make my repo AI-friendly", "migrate my .cursorrules", "sync my AI config across tools", or "validate my AGENTS.md". This skill is informed by peer-reviewed research on what actually helps coding agents solve tasks, and covers the full multi-tool ecosystem including Claude Code, Codex, Copilot, Cursor, Gemini CLI, Jules, and Windsurf.
---

# AGENTS.md Writer

## Table of Contents
- [Why This Skill Exists](#why-this-skill-exists)
- [The Multi-Tool Landscape (2026)](#the-multi-tool-landscape-2026)
- [Before Writing: Gather Information](#before-writing-gather-information)
- [The Golden Rule](#the-golden-rule)
- [Context File Structure](#context-file-structure)
- [Critical Commands](#critical-commands)
- [Architecture Constraints](#architecture-constraints)
- [Testing](#testing)
- [Style & Conventions](#style-conventions)
- [Gotchas](#gotchas)
- [Section-by-Section Guidance](#section-by-section-guidance)
- [Critical Commands](#critical-commands)
- [Commands](#commands)
- [What to NEVER Include](#what-to-never-include)
- [Choosing Your File Strategy](#choosing-your-file-strategy)
- [CLAUDE.md — Advanced Features](#claudemd-advanced-features)
- [Migrating from Other Tools](#migrating-from-other-tools)
- [Validation](#validation)
- [Writing Process](#writing-process)
- [Quality Checklist](#quality-checklist)
- [Example: Minimal but Effective Context File](#example-minimal-but-effective-context-file)
- [Critical Commands](#critical-commands)
- [Testing](#testing)
- [Gotchas](#gotchas)
- [Example: Multi-Tool Setup](#example-multi-tool-setup)
- [Claude-Specific](#claude-specific)
- [Example: Bloated and Harmful Context File (DO NOT write like this)](#example-bloated-and-harmful-context-file-do-not-write-like-this)
- [Overview](#overview)
- [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
- [Improving an Existing Context File](#improving-an-existing-context-file)


Write effective repository-level context files (AGENTS.md, CLAUDE.md, CODEX.md, etc.) that actually improve coding agent performance — across the entire multi-tool ecosystem.

## Why This Skill Exists

Research (Gloaguen et al., 2026 — "Evaluating AGENTS.md") evaluated context files across 4 coding agents and 2 benchmarks and found:

- **LLM-generated context files reduce task success by ~2-3%** while increasing cost by 20%+
- **Developer-written context files provide marginal gains (~4%)** — but only when minimal and precise
- Context files that include codebase overviews do NOT help agents find relevant files faster
- Agents reliably follow instructions in context files — the problem is that unnecessary instructions make tasks harder

The key insight: **less is more**. Only include information that an agent cannot discover on its own from the codebase. Every unnecessary instruction is cognitive load that hurts performance.

## The Multi-Tool Landscape (2026)

AGENTS.md is now an open standard stewarded by the Agentic AI Foundation under the Linux Foundation. Every major AI coding tool reads context files, but each has its own native format:

| Tool           | Native file                       | Reads AGENTS.md?         |
| -------------- | --------------------------------- | ------------------------ |
| Claude Code    | `CLAUDE.md`                       | Via import or workaround |
| OpenAI Codex   | `AGENTS.md`                       | Native                   |
| GitHub Copilot | `.github/copilot-instructions.md` | Yes                      |
| Cursor         | `.cursor/rules/*.mdc`             | Yes                      |
| Google Jules   | `JULES.md`                        | Yes                      |
| Gemini CLI     | `GEMINI.md`                       | Via config               |
| Windsurf       | `.windsurfrules`                  | Yes                      |
| Amp            | `AGENTS.md`                       | Native                   |

**The practical strategy**: Write core instructions in **AGENTS.md** (broadest compatibility), then use tool-specific files only for features that AGENTS.md can't provide. See "Choosing Your File Strategy" below.

## Before Writing: Gather Information

Before writing the context file, understand the repository:

1. **Read the repository structure** — `view` the root directory to understand layout
2. **Read existing documentation** — check README.md, CONTRIBUTING.md, docs/ folder
3. **Identify the tech stack** — language, framework, package manager, test runner
4. **Check for non-obvious tooling** — custom build scripts, monorepo tools, unusual dependency managers
5. **Look for existing context files** — check for AGENTS.md, CLAUDE.md, CODEX.md, .cursorrules, .github/copilot-instructions.md, GEMINI.md
6. **Identify pain points** — things that would trip up an agent that aren't documented elsewhere

If the user provides a repo path (local or GitHub URL), explore it. If they describe their repo verbally, ask targeted questions — but keep it efficient, don't interrogate them.

## The Golden Rule

> **Include ONLY information that meets ALL of these criteria:**
>
> 1. An agent cannot easily discover it by reading the codebase
> 2. Getting it wrong would cause a build failure, test failure, or style violation
> 3. It is specific and actionable (not vague guidance)

If a piece of information fails any of these three tests, leave it out.

## Context File Structure

Use this structure. Every section is optional — include only sections that have genuinely useful content.

```markdown
# [Project Name] — Agent Instructions

## Critical Commands

[Only non-obvious commands. Skip if standard tools work as expected.]

## Architecture Constraints

[Only hard rules that aren't enforceable by linters/CI. Skip if none exist.]

## Testing

[Only if the test setup is non-standard or requires specific steps.]

## Style & Conventions

[Only conventions NOT enforced by existing tooling. Skip if linters handle it.]

## Gotchas

[Non-obvious pitfalls specific to this codebase. Skip if none exist.]
```

## Section-by-Section Guidance

### Critical Commands

Include commands ONLY if they differ from what an agent would naturally try.

**INCLUDE:**

- Custom build commands (if `make build` or standard tools don't work)
- Non-standard test invocations (e.g., `uv run pytest --tb=short -q` instead of just `pytest`)
- Required environment setup that isn't in README (e.g., `source .venv/bin/activate && pre-commit install`)
- Specific dependency installation that's unusual (e.g., `pdm install -G :all` instead of `pip install -e .`)

**DO NOT INCLUDE:**

- `git clone`, `cd`, `pip install` — agents know these
- Standard `pytest` or `npm test` invocations (agents try these by default)
- Commands documented in README.md or CONTRIBUTING.md

**Good example:**

```markdown
## Critical Commands

- Install: `uv sync --all-extras` (do NOT use pip)
- Test: `uv run pytest tests/ --tb=short -q` (must use uv, not bare pytest)
- Lint before committing: `uv run ruff check --fix . && uv run ruff format .`
```

**Bad example (DO NOT write like this):**

```markdown
## Commands

- Clone: `git clone https://github.com/org/repo.git`
- Install dependencies: `pip install -r requirements.txt`
- Run tests: `pytest`
- Format code: `black .`
```

### Architecture Constraints

Include hard architectural rules that aren't discoverable from code structure alone.

**INCLUDE:**

- "All database access must go through the `db/` layer — never import ORM models directly in API handlers"
- "New API endpoints require a migration file in `migrations/` AND an entry in `openapi.yaml`"
- "This monorepo uses workspace references — never add cross-package dependencies to root package.json"

**DO NOT INCLUDE:**

- Directory descriptions ("src/ contains source code, tests/ contains tests") — agents can see this
- Design pattern explanations — agents understand common patterns
- Language or framework basics

### Testing

**INCLUDE:**

- Non-standard test commands or required environment variables
- "Integration tests require a running Postgres — use `docker compose up -d db` first"
- "Always run `make generate` before testing if you modified any `.proto` files"
- Specific test file naming conventions if non-standard

**DO NOT INCLUDE:**

- "Run tests to make sure your changes work" — agents do this by default
- Standard test runner usage
- Obvious things like "tests are in the tests/ directory"

### Style & Conventions

Only include conventions that automated tooling does NOT enforce.

**INCLUDE:**

- "Commit messages must follow Conventional Commits: `type(scope): description`"
- "All new public functions need a Google-style docstring with Args, Returns, and Raises sections"
- "Error messages must be user-facing — write them in complete sentences, not technical jargon"

**DO NOT INCLUDE:**

- Formatting rules (ruff/black/prettier handle this)
- Import ordering (isort/ruff handle this)
- Type annotation requirements (mypy/pyright handle this)
- Line length limits (configured in pyproject.toml/eslint)

### Gotchas

This is often the most valuable section. Include non-obvious things that would waste an agent's time.

**INCLUDE:**

- "The `config.py` file is auto-generated — edit `config.yaml` instead"
- "Tests in `tests/integration/` are flaky on CI — if they fail locally, retry once before investigating"
- "The `legacy/` directory is frozen — never modify files there, create wrappers instead"
- "Python 3.11+ required — some dependencies break on 3.10"

## What to NEVER Include

These are backed by research findings that show they actively hurt performance:

1. **Codebase overviews / directory listings** — 100% of LLM-generated context files include these, and they do NOT help agents find relevant files faster. Agents can `ls` and `find` on their own.

2. **Paraphrased README content** — Context files that duplicate existing docs are the primary reason LLM-generated files hurt performance. If it's already in the README, don't repeat it.

3. **General coding advice** — "Write clean code", "Follow SOLID principles", "Add comments". These are noise.

4. **Technology descriptions** — "This project uses React for the frontend and Express for the backend." Agents can read package.json.

5. **Lengthy explanations** — Keep everything terse. More tokens = more cost + more confusion. Average effective context files are ~640 words. Aim for 200-400 words for most repos.

6. **Vague instructions** — "Make sure to handle errors properly" tells the agent nothing actionable.

## Choosing Your File Strategy

Ask the user which tools they use, then apply this decision tree:

**Single-tool teams:**

- Claude Code only → `CLAUDE.md`
- Codex only → `AGENTS.md`
- Cursor only → `.cursor/rules/*.mdc` (but consider AGENTS.md for future-proofing)

**Multi-tool teams (recommended approach):**

1. Write core instructions in **AGENTS.md** (universal standard, broadest compatibility)
2. Symlink for tools that don't natively read AGENTS.md:
   ```bash
   # Copilot
   mkdir -p .github && ln -sfn ../AGENTS.md .github/copilot-instructions.md
   # Cursor (basic — for advanced scoping, use .cursor/rules/ natively)
   mkdir -p .cursor/rules && ln -sfn ../../AGENTS.md .cursor/rules/main.mdc
   ```
3. Add a **CLAUDE.md** only if you need Claude Code-specific features (nested files, imports, hooks). In the simplest case, CLAUDE.md can just import the shared file:

   ```markdown
   @AGENTS.md

   ## Claude-Specific

   [Any Claude Code-only instructions here]
   ```

**Always add `.gitignore` entries** for personal/local files:

```
CLAUDE.local.md
```

## CLAUDE.md — Advanced Features

Claude Code has capabilities beyond what AGENTS.md supports. Use these when the user specifically works with Claude Code. For a deep dive, read `references/claude-md-advanced.md`.

### File Hierarchy

Claude Code walks up the directory tree from the working directory, loading every CLAUDE.md it finds. It also discovers CLAUDE.md files in subdirectories when it reads files there. This enables layered instructions:

```
project-root/
├── CLAUDE.md              # Project-wide rules
├── frontend/
│   └── CLAUDE.md          # Frontend-specific conventions
├── backend/
│   └── CLAUDE.md          # Backend-specific conventions
└── scripts/
    └── CLAUDE.md          # Scripting conventions
```

Each subdirectory file should contain ONLY rules specific to that part of the codebase.

### Import Syntax

CLAUDE.md files can pull in other files using `@path/to/file` syntax:

```markdown
@docs/architecture.md
@package.json
@AGENTS.md
```

Imports are recursive (up to 5 levels deep). Relative paths resolve from the file containing the import.

### Rules Directory

For granular, conditional rules, use `.claude/rules/*.md` with optional `paths:` frontmatter for scoping.

### Monorepo Configuration

In large monorepos, use `claudeMdExcludes` in `.claude/settings.local.json` to skip irrelevant CLAUDE.md files from other teams. See `references/claude-md-advanced.md` for details.

### Context Budget Warning

Claude Code injects a system reminder telling the model to ignore CLAUDE.md content that isn't relevant to the current task. The more irrelevant content you add, the more likely Claude deprioritizes ALL your instructions. Keep the root file under 300 lines. Use imports and subdirectory files for the rest.

## Migrating from Other Tools

If the user has existing config files, read `references/migration-guide.md` for detailed per-tool conversion instructions. The high-level process:

1. **Audit existing files** — Read all current config files (.cursorrules, copilot-instructions.md, etc.)
2. **Deduplicate** — Most content will be identical across files. Extract the shared core.
3. **Apply the Golden Rule** — Filter every line through the three criteria. Remove what fails.
4. **Write AGENTS.md** — This becomes the single source of truth
5. **Add tool-specific files** — Only for features that require them
6. **Symlink the rest** — Point other tool config files at AGENTS.md
7. **Clean up** — Remove deprecated files, update .gitignore

## Validation

After writing a context file, run the bundled validation script to catch common problems:

```bash
python scripts/validate_context_file.py <path-to-context-file> [--readme <path-to-readme>]
```

The validator checks for: codebase overviews, directory listings, README duplication, generic advice, technology descriptions, excessive word count, vague instructions, and discoverable commands.

If the user provides a repo path, run validation automatically after generating the file and fix any issues before presenting the final result.

## Writing Process

1. **Gather info** about the repo (see "Before Writing" above)
2. **Check for existing config files** — if migrating, read `references/migration-guide.md`
3. **Identify non-obvious requirements** — things that meet the Golden Rule
4. **Draft the file** — aim for 200-400 words, use the structure template
5. **Review against "What to NEVER Include"** — remove anything that fails
6. **Run the validator** — `python scripts/validate_context_file.py <file>`
7. **Check each line**: "Would an agent fail without this specific instruction?" If no, cut it.
8. **Set up multi-tool strategy** — symlinks, imports, tool-specific files as needed
9. **Save the file(s)** to the repo root

## Quality Checklist

Before finalizing, verify:

- [ ] No codebase overview or directory listing
- [ ] No content duplicated from README.md or CONTRIBUTING.md
- [ ] No generic coding advice
- [ ] No technology descriptions the agent can discover from package files
- [ ] Every instruction is specific and actionable
- [ ] Total length is under 500 words (ideally 200-400)
- [ ] Commands are copy-pasteable (no placeholders unless clearly marked)
- [ ] File uses the appropriate name for the target tool(s)
- [ ] Multi-tool strategy is set up (symlinks, imports) if user uses multiple tools
- [ ] Validator passes with no errors

## Example: Minimal but Effective Context File

```markdown
# myproject — Agent Instructions

## Critical Commands

- Install: `uv sync --all-extras`
- Test: `uv run pytest tests/ -x --tb=short`
- Lint: `uv run ruff check --fix . && uv run ruff format .`

## Testing

- Run `docker compose up -d` before integration tests (tests/integration/)
- Generate test fixtures with `python scripts/gen_fixtures.py` after modifying any schema

## Gotchas

- `src/generated/` is auto-generated from protobuf — edit `.proto` files in `proto/` instead
- The `LEGACY_MODE` env var must be unset for new tests (some old tests set it)
- Python 3.12+ required — `match` statements are used throughout
```

~100 words. Only actionable, non-discoverable information. This is what good looks like.

## Example: Multi-Tool Setup

```
project-root/
├── AGENTS.md                                    # Shared core (single source of truth)
├── CLAUDE.md                                    # Imports AGENTS.md + Claude-specific
├── .github/
│   └── copilot-instructions.md → ../AGENTS.md   # Symlink
├── .cursor/
│   └── rules/
│       └── main.mdc → ../../AGENTS.md            # Symlink
└── .gitignore                                    # Contains: CLAUDE.local.md
```

CLAUDE.md contents:

```markdown
@AGENTS.md

## Claude-Specific

- Run `uv run pre-commit run --all-files` before committing
```

## Example: Bloated and Harmful Context File (DO NOT write like this)

```markdown
# MyProject

## Overview

MyProject is a web application built with FastAPI and PostgreSQL...

## Project Structure

- `src/` — Source code
  - `src/api/` — API endpoints
  - `src/models/` — Database models
    ...

## Development Guidelines

- Write clean, readable code
- Follow PEP 8 style guidelines
- Add type hints to all functions
```

Every piece of information is either discoverable or too vague to act on. Research shows files like this reduce agent performance by ~3% while adding 20%+ to inference costs.

## Improving an Existing Context File

If the user has an existing AGENTS.md / CLAUDE.md:

1. Read the current file
2. For each line, ask: "Does this meet the Golden Rule?"
3. Remove everything that fails
4. Check for missing gotchas or non-standard commands
5. Rewrite to be minimal
6. Run the validator on the result
7. Show the user a before/after comparison with clear explanations of what was removed and why
