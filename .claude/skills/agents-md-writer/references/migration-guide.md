# Migration Guide: Converting AI Config Files to AGENTS.md

This reference covers detailed migration paths from each tool-specific format to AGENTS.md as the universal standard.

## Table of Contents
1. From .cursorrules / .cursor/rules/
2. From .github/copilot-instructions.md
3. From GEMINI.md
4. From CLAUDE.md (consolidating to AGENTS.md)
5. From .windsurfrules
6. Multi-file consolidation workflow

---

## 1. From .cursorrules / .cursor/rules/

### What Cursor files look like

**Legacy format** (`.cursorrules`): A single Markdown file at the project root. Plain text, no frontmatter. Deprecated but still supported.

**Current format** (`.cursor/rules/*.mdc`): Multiple scoped files with YAML frontmatter:

```yaml
---
description: Frontend component conventions
globs: src/components/**/*.tsx
alwaysApply: false
---
- Use functional components with hooks
- Prefer server components for data fetching
```

### What to keep vs. discard

**Keep** (likely passes the Golden Rule):
- Non-standard build/test commands
- Architecture constraints not enforced by linters
- Gotchas about auto-generated files, frozen directories, etc.
- Scoping information (which rules apply to which directories) — translate to subdirectory CLAUDE.md files or `.claude/rules/` if the user uses Claude Code

**Discard** (fails the Golden Rule):
- Technology descriptions ("We use React 18 with TypeScript")
- Generic style rules that linters enforce
- Framework basics ("Use functional components") — agents know these
- Anything labeled `alwaysApply: true` that describes obvious conventions

### Migration steps

```bash
# 1. Read all existing rules
cat .cursorrules 2>/dev/null
for f in .cursor/rules/*.mdc; do echo "=== $f ===" && cat "$f"; done

# 2. Extract content, strip frontmatter, deduplicate
# (The skill should do this programmatically)

# 3. After creating AGENTS.md, symlink for backward compatibility
mv .cursorrules .cursorrules.bak  # keep backup
mkdir -p .cursor/rules
ln -sfn ../../AGENTS.md .cursor/rules/main.mdc
```

### Scoping: what gets lost

Cursor's `globs` and `alwaysApply` frontmatter have no AGENTS.md equivalent. For scoped rules:
- **If the user uses Claude Code**: Create subdirectory CLAUDE.md files or `.claude/rules/*.md` with `paths:` frontmatter
- **If they also use Cursor**: Keep the scoped `.mdc` files alongside AGENTS.md. Only the shared/universal rules go in AGENTS.md.

---

## 2. From .github/copilot-instructions.md

### What Copilot files look like

A single Markdown file at `.github/copilot-instructions.md`. Plain Markdown, no frontmatter. Copilot also supports `.github/instructions/*.instructions.md` files with `applyTo` frontmatter for scoping:

```yaml
---
applyTo: "src/api/**"
---
Use Express middleware pattern for all route handlers.
```

### What to keep vs. discard

Copilot instructions tend to be shorter and more focused than .cursorrules. Still apply the Golden Rule — most Copilot instruction files contain technology descriptions and obvious patterns that should be removed.

### Migration steps

```bash
# 1. Read existing instructions
cat .github/copilot-instructions.md
for f in .github/instructions/*.instructions.md; do echo "=== $f ===" && cat "$f"; done

# 2. After creating AGENTS.md, symlink
ln -sfn ../AGENTS.md .github/copilot-instructions.md
```

Copilot reads AGENTS.md natively as of August 2025, so the symlink is a belt-and-suspenders measure.

---

## 3. From GEMINI.md

### What Gemini files look like

Plain Markdown at the project root. Gemini CLI has a unique behavior: it walks both UP and DOWN the directory tree, concatenating all GEMINI.md files it finds. Users can inspect the combined context with `/memory show`.

```markdown
## Stack
- Go 1.22, Chi router, sqlc for database queries

## Guidelines
- Use structured logging (slog) not fmt.Println
- All errors must be wrapped with fmt.Errorf
```

### Migration steps

```bash
# 1. Read all GEMINI.md files in the repo
find . -name "GEMINI.md" -exec echo "=== {} ===" \; -exec cat {} \;

# 2. Consolidate into AGENTS.md (apply Golden Rule)
# 3. Gemini CLI can be configured to read AGENTS.md via settings.json:
#    "contextFileName": ["GEMINI.md", "AGENTS.md"]
```

---

## 4. From CLAUDE.md (consolidating to AGENTS.md)

If the user wants to move from a Claude-only setup to a multi-tool AGENTS.md approach while keeping Claude-specific features:

### Strategy

Keep CLAUDE.md, but make it thin — it imports AGENTS.md and adds only Claude-specific instructions:

```markdown
@AGENTS.md

## Claude-Specific
- Hooks: run `uv run ruff check --fix .` on PostFileWrite for *.py files
- Auto-memory is enabled — don't repeat corrections, they're persisted
```

### What stays in CLAUDE.md vs. moves to AGENTS.md

**Stays in CLAUDE.md:**
- Import syntax (`@path/to/file`)
- Hook-related instructions
- Auto-memory guidance
- Claude Code CLI-specific commands
- Anything referencing `.claude/` directory features

**Moves to AGENTS.md:**
- Build/test/lint commands
- Architecture constraints
- Style conventions
- Gotchas
- Everything that any agent needs to know

---

## 5. From .windsurfrules

Plain Markdown file at the project root. Format is very similar to .cursorrules. Migration is straightforward — read the file, apply the Golden Rule, create AGENTS.md. Windsurf reads AGENTS.md natively, so no symlink needed.

---

## 6. Multi-File Consolidation Workflow

When a repo has accumulated multiple config files over time:

```bash
# Discovery — find all existing config files
find . -maxdepth 3 \( \
  -name "AGENTS.md" -o \
  -name "CLAUDE.md" -o \
  -name "CODEX.md" -o \
  -name "GEMINI.md" -o \
  -name "JULES.md" -o \
  -name ".cursorrules" -o \
  -name ".windsurfrules" -o \
  -name "copilot-instructions.md" \
  -o -path "*/.cursor/rules/*.mdc" \
  -o -path "*/.github/instructions/*.instructions.md" \
\) -print
```

### Consolidation process

1. Read all files and extract every instruction
2. Deduplicate — most instructions will be identical or near-identical across files
3. Apply the Golden Rule to the merged set — this usually removes 60-80% of content
4. Write the surviving instructions into AGENTS.md
5. Identify any tool-specific features that can't go in AGENTS.md:
   - Claude Code: imports, nested files, hooks → keep in thin CLAUDE.md
   - Cursor: scoped globs → keep in `.cursor/rules/*.mdc` if needed
   - Copilot: applyTo scoping → keep in `.github/instructions/` if needed
6. Symlink everything else to AGENTS.md
7. Back up originals, clean up deprecated files
8. Update .gitignore with local/personal files

### Final structure for a well-organized multi-tool repo

```
project-root/
├── AGENTS.md                                    # Universal truth
├── CLAUDE.md                                    # @AGENTS.md + Claude-only
├── .github/
│   └── copilot-instructions.md → ../AGENTS.md   # Symlink
├── .cursor/
│   └── rules/
│       ├── main.mdc → ../../AGENTS.md            # Shared rules
│       └── frontend.mdc                          # Cursor-specific scoped rules (if needed)
├── .claude/
│   ├── settings.local.json                       # claudeMdExcludes etc.
│   └── rules/
│       └── api-conventions.md                    # Claude-specific scoped rules (if needed)
├── .gitignore                                    # CLAUDE.local.md
└── .backups/                                     # Old config files (temporary)
    ├── .cursorrules.bak
    └── .windsurfrules.bak
```
