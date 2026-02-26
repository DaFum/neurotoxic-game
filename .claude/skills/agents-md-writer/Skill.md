---
name: agents-md-writer
description: Write high-quality AGENTS.md, CLAUDE.md, or CODEX.md context files for code repositories. Use this skill whenever the user asks to create, write, generate, improve, or review a repository context file for coding agents — including any mention of "AGENTS.md", "CLAUDE.md", "CODEX.md", "context file for agents", "agent instructions", "coding agent setup", or requests like "help my AI agent understand this repo". Also trigger when users say things like "initialize agent config", "set up Claude Code for my project", "write instructions for Codex/Copilot", or "make my repo AI-friendly". This skill is informed by peer-reviewed research on what actually helps coding agents solve tasks, so it avoids the common pitfalls that make auto-generated context files harmful.
---

# AGENTS.md Writer

Write effective repository-level context files (AGENTS.md, CLAUDE.md, CODEX.md) that actually improve coding agent performance.

## Why This Skill Exists

Research (Gloaguen et al., 2026 — "Evaluating AGENTS.md") evaluated context files across 4 coding agents and 2 benchmarks and found:

- **LLM-generated context files reduce task success by ~2-3%** while increasing cost by 20%+
- **Developer-written context files provide marginal gains (~4%)** — but only when minimal and precise
- Context files that include codebase overviews do NOT help agents find relevant files faster
- Agents reliably follow instructions in context files — the problem is that unnecessary instructions make tasks harder
- Context files are largely redundant with existing documentation (README, docs/, etc.)

The key insight: **less is more**. Only include information that an agent cannot discover on its own from the codebase. Every unnecessary instruction is cognitive load that hurts performance.

## Before Writing: Gather Information

Before writing the context file, you need to understand the repository. Do the following:

1. **Read the repository structure** — `view` the root directory to understand layout
2. **Read existing documentation** — check README.md, CONTRIBUTING.md, docs/ folder
3. **Identify the tech stack** — language, framework, package manager, test runner
4. **Check for non-obvious tooling** — custom build scripts, monorepo tools, unusual dependency managers
5. **Look for existing context files** — check for AGENTS.md, CLAUDE.md, CODEX.md, .github/copilot-instructions.md
6. **Identify pain points** — things that would trip up an agent that aren't documented elsewhere

If the user provides a repo path (local or GitHub URL), explore it. If they describe their repo verbally, ask targeted questions about the items above — but keep it efficient, don't interrogate them.

## The Golden Rule

> **Include ONLY information that meets ALL of these criteria:**
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
- "Run tests to make sure your changes work" — agents do this by default (and research shows context files increase testing even without being asked)
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

1. **Codebase overviews / directory listings** — Research shows 100% of LLM-generated context files include these, and they do NOT help agents find relevant files faster. Agents can `ls` and `find` on their own.

2. **Paraphrased README content** — Context files that duplicate existing docs are the primary reason LLM-generated files hurt performance. If it's already in the README, don't repeat it.

3. **General coding advice** — "Write clean code", "Follow SOLID principles", "Add comments". These are noise.

4. **Technology descriptions** — "This project uses React for the frontend and Express for the backend." Agents can read package.json.

5. **Lengthy explanations** — Keep everything terse. Research shows more tokens = more cost + more confusion. Average effective context files are ~640 words. Aim for 200-400 words for most repos.

6. **Vague instructions** — "Make sure to handle errors properly" tells the agent nothing actionable. Either specify the error handling pattern or leave it out.

## Choosing the Filename

- **AGENTS.md** — Universal, works with Codex, Qwen Code, and most agents. Use this as the default.
- **CLAUDE.md** — Specifically for Claude Code. Use this if the user only uses Claude Code. Claude Code reads CLAUDE.md automatically.
- **CODEX.md** — Specifically for OpenAI Codex. Use if the user only uses Codex.
- If unsure, write **AGENTS.md** (broadest compatibility). If the user wants maximum reach, you can create both AGENTS.md and CLAUDE.md with the same content.

## Writing Process

1. **Gather info** about the repo (see "Before Writing" above)
2. **Identify non-obvious requirements** — things that meet the Golden Rule
3. **Draft the file** — aim for 200-400 words, use the structure template above
4. **Review against the "What to NEVER Include" list** — remove anything that fails
5. **Check each line**: "Would an agent fail without this specific instruction?" If no, cut it.
6. **Save the file** to the repo root

## Quality Checklist

Before finalizing, verify:

- [ ] No codebase overview or directory listing
- [ ] No content duplicated from README.md or CONTRIBUTING.md  
- [ ] No generic coding advice
- [ ] No technology descriptions the agent can discover from package files
- [ ] Every instruction is specific and actionable
- [ ] Total length is under 500 words (ideally 200-400)
- [ ] Commands are copy-pasteable (no placeholders unless clearly marked)
- [ ] File uses the appropriate name (AGENTS.md / CLAUDE.md / CODEX.md)

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

That's ~100 words and contains only actionable, non-discoverable information. This is what good looks like.

## Example: Bloated and Harmful Context File (DO NOT write like this)

```markdown
# MyProject

## Overview
MyProject is a web application built with FastAPI and PostgreSQL. It provides RESTful APIs for managing user data.

## Project Structure
- `src/` — Source code
  - `src/api/` — API endpoints
  - `src/models/` — Database models
  - `src/utils/` — Utility functions
- `tests/` — Test files
- `docs/` — Documentation
- `scripts/` — Helper scripts

## Getting Started
1. Clone the repository
2. Install Python 3.11+
3. Run `pip install -r requirements.txt`
4. Set up the database
5. Run `pytest` to verify

## Development Guidelines
- Write clean, readable code
- Follow PEP 8 style guidelines
- Add type hints to all functions
- Write tests for new features
- Use meaningful variable names
```

This file is entirely useless — every piece of information is either discoverable or too vague to act on. Research shows files like this actively reduce agent performance by ~3% while adding 20%+ to inference costs.

## Improving an Existing Context File

If the user has an existing AGENTS.md / CLAUDE.md:

1. Read the current file
2. For each line, ask: "Does this meet the Golden Rule?" (non-discoverable, failure-causing if missed, specific/actionable)
3. Remove everything that fails
4. Check for missing gotchas or non-standard commands
5. Rewrite to be minimal

Show the user a before/after comparison with clear explanations of what was removed and why.
