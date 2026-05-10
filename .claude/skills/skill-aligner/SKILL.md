---
name: skill-aligner
description: Align skills with repository conventions and detect drift across the skill library. Trigger when a skill feels outdated, references deleted files, uses incorrect/deprecated commands, has version mismatches (Vite 7 vs 8, React 18 vs 19), terminology doesn't match project docs, or contradicts AGENTS.md/CLAUDE.md. Use to synchronize single skills after repo changes, audit monorepo skills for cascading drift, or batch-update a skill library. Detects command mismatches, path changes, version drift, broken references, and circular dependencies.
---

# Skill Aligner

Detect and fix drift between skills and the repository. Drift happens when the repository changes (new versions, restructured paths, new commands) but skills still reference the old state. This skill covers **every file inside a skill directory** — not just `SKILL.md`.

## Scope: What to Check

Each skill directory can contain any of these file types. All of them can carry drift.

| File type | Location pattern | What drifts |
|:---|:---|:---|
| Entry point | `SKILL.md` | commands, versions, paths, terminology |
| Reference docs | `references/*.md` | same as above; often the densest drift |
| Shell scripts | `scripts/*.sh` | package manager, script names, env assumptions |
| Node scripts | `scripts/*.mjs`, `scripts/*.js`, `scripts/*.cjs` | import paths, API calls, package manager |
| Python scripts | `scripts/*.py` | CLI invocations, file paths |
| Agent specs | `agents/openai.yaml` | model names, display text |
| Asset configs | `assets/*.json` | tool versions, rule sets |
| Validation | `validation/rubric.yaml` | criteria tied to repo conventions |
| Loose docs | `*.md` at skill root | any of the above |

**Audit order**: start with `SKILL.md`, then `references/`, then `scripts/`, then the rest. Fix in the same order — later files often mirror conventions established in earlier ones.

---

## Drift Detection Patterns

### 1. Command Mismatch (Most Common)

**Applies to**: `SKILL.md`, `references/*.md`, `scripts/*.sh`, all script files.

**What it looks like:**
- File says: `npm run test` or `npm ci`
- Repo requires: `pnpm run test` or `pnpm install --frozen-lockfile` (AGENTS.md: "Use `pnpm` only.")

**How to detect:**

```bash
# Scan every file in the skill for package-manager commands
grep -rn "npm " .claude/skills/<skill-name>/

# Cross-reference scripts section of package.json
jq '.scripts | keys' package.json

# Check that pnpm run <name> actually exists
grep -o 'pnpm run [a-z:_-]*' .claude/skills/<skill-name>/SKILL.md | sort -u | \
  while read cmd; do
    script="${cmd#pnpm run }"
    jq -e --arg s "$script" '.scripts[$s]' package.json > /dev/null \
      && echo "✓ $cmd" || echo "✗ MISSING in package.json: $cmd"
  done
```

**Decision tree:**
- `npm` anywhere? → Replace with `pnpm`; `npm install` → `pnpm install --frozen-lockfile`; `npm ci` → `pnpm install --frozen-lockfile`; `npm run X` → `pnpm run X`; `npm -v` → `pnpm -v`
- Script name not in `package.json`? → Check if renamed; update to current name
- Both names valid aliases? → Use the one listed in AGENTS.md critical commands

### 2. Version Mismatch (Critical)

**Applies to**: sync lines in all `.md` files, inline version claims anywhere.

**What it looks like:**
- Sync line says: `React 19.2.4 / Vite 8.0.1`
- Actual: `React 19.2.5 / Vite 8.0.10 / Tailwind 4.2.4`

**How to detect:**

```bash
# Find all version references across the entire skill
grep -rn -E '(React|Vite|Tailwind|Framer|Tone\.js|Node) [0-9]+\.[0-9]' .claude/skills/<skill-name>/

# Get ground truth
jq '{react: .dependencies.react, vite: .devDependencies.vite, tailwindcss: .devDependencies.tailwindcss}' package.json
```

**Decision tree:**
- Sync line only? → Bulk `sed` replace across all files in the skill
- Version claim in instructional text? → Update and verify the guidance is still accurate for the new version
- API break between versions? → Escalate to `skill-creator`

### 3. Extension Mismatch (.js/.jsx vs .ts/.tsx)

**Applies to**: `SKILL.md`, all `references/*.md`, all `scripts/` that reference source paths.

**What it looks like:**
- File says: `src/context/gameReducer.js`
- Repo has: `src/context/gameReducer.ts`

**How to detect:**

```bash
# Scan all markdown in the skill for .js/.jsx src/ references
grep -rn 'src/.*\.jsx\?\b' .claude/skills/<skill-name>/ \
  | grep -v '\.test\.\|\.spec\.\|config\.\|\.mjs\|setup\.'

# Verify actual extension on disk for each hit
for f in $(grep -roh 'src/[a-zA-Z0-9/_.-]*\.jsx\?' .claude/skills/<skill-name>/ | sort -u); do
  base="${f%.*}"
  found=false
  for ext in .ts .tsx .js .jsx; do
    [ -f "$base$ext" ] && echo "✓ $base$ext" && found=true && break
  done
  $found || echo "✗ MISSING: $f"
done
```

**Decision tree:**
- `.ts`/`.tsx` version exists on disk? → Update the reference
- File is genuinely absent from repo? → Mark as aspirational; add a note
- Reference is inside a `node:test` `import` statement? → Keep `.js` — `tsx` resolves `.js` imports to `.ts` at runtime; changing them would break tests
- Reference is inside a shell `ls` or path description? → Update to `.ts`/`.tsx`

### 4. Path Mismatch (Cascading Risk)

**Applies to**: all files in the skill.

**What it looks like:**
- File says: `src/utils/AudioManager.js`
- Repo moved it to: `src/utils/audio/AudioManager.ts`

**How to detect:**

```bash
# Find all src/ references across the skill
grep -rn -oE 'src/[a-zA-Z0-9/_.-]+' .claude/skills/<skill-name>/ | sort -u

# Verify each directory still exists
grep -roh -E 'src/[a-zA-Z0-9/_/-]+/' .claude/skills/<skill-name>/ | sort -u | \
  while read dir; do [ -d "$dir" ] && echo "✓ $dir" || echo "✗ MISSING dir: $dir"; done
```

**Decision tree:**
- Path moved? → Update to new location in every file in the skill
- Multiple skills share the stale path? → Fix in dependency order (leaf skills first); see Monorepo Strategy below
- Path inside a code block showing an error message or generic example? → Keep if intentionally illustrative (e.g., `src/utils/missing.js` as a "file not found" example)

### 5. Script File Drift

Shell scripts and Node scripts are executable artefacts — their bugs are silent until run.

**What to check in `scripts/*.sh`:**

```bash
# Check shebang is present
head -1 .claude/skills/<skill-name>/scripts/*.sh

# Find npm commands
grep -n "npm " .claude/skills/<skill-name>/scripts/*.sh

# Find hardcoded script names and verify against package.json
grep -oE 'pnpm run [a-z:_-]+' .claude/skills/<skill-name>/scripts/*.sh | sort -u | \
  while read cmd; do
    script="${cmd#pnpm run }"
    jq -e --arg s "$script" '.scripts[$s]' package.json > /dev/null \
      && echo "✓ $cmd" || echo "✗ script missing: $cmd"
  done
```

**What to check in `scripts/*.mjs` / `scripts/*.js`:**

```bash
# Find npm references in Node scripts
grep -n "npm " .claude/skills/<skill-name>/scripts/*.mjs .claude/skills/<skill-name>/scripts/*.js 2>/dev/null

# Find src/ path references in scripts
grep -n "src/" .claude/skills/<skill-name>/scripts/*.mjs .claude/skills/<skill-name>/scripts/*.js 2>/dev/null
```

**Decision tree:**
- `npm` in `.sh`? → Replace with `pnpm`
- Script references a `pnpm run X` that no longer exists? → Update to current script name
- Script sources a path that moved? → Update path

### 6. Cross-Skill Reference Drift

Skills reference other skills by name in their descriptions, workflows, or escalation guidance.

**What it looks like:**
- Skill says: "Escalate to `state-mutation-guard`"
- Actual skill name: `state-safety-action-creator-guard`

**How to detect:**

```bash
# Extract skill name references from all files in the skill
grep -roh -E '`[a-z][a-z-]+`' .claude/skills/<skill-name>/ | sort -u

# Cross-reference against existing skill directories
ls .claude/skills/ > /tmp/existing-skills.txt
grep -roh -E '`[a-z][a-z-]+`' .claude/skills/<skill-name>/ | sort -u | tr -d '`' | \
  while read name; do
    grep -qx "$name" /tmp/existing-skills.txt && echo "✓ $name" || echo "? $name (not a skill dir)"
  done
```

**Decision tree:**
- Name matches no skill directory? → Verify it was renamed, then update the reference
- Skill was deleted? → Remove the reference or replace with the successor skill
- Name is a generic term (not a skill)? → Ignore

### 7. Terminology / Doc Mismatch (Subtle)

**Applies to**: all `.md` files.

**What it looks like:**
- Reference doc says: "import from `npm`" or "yarn add"
- AGENTS.md says: pnpm only

**How to detect:**

```bash
# Pull key constraints from AGENTS.md
grep -E '(pnpm|npm|yarn|Howler|AudioContext|i18n|Tailwind|forwardRef)' AGENTS.md CLAUDE.md

# Scan skill for contradictions
grep -rn -E '(yarn |Howler\.js|React\.forwardRef|import type .* from)' .claude/skills/<skill-name>/
```

**Decision tree:**
- Skill guidance contradicts AGENTS.md? → Update skill to match AGENTS.md
- Skill adds domain context AGENTS.md lacks? → Keep; add a pointer to AGENTS.md for the constraint
- Terminology is just cosmetically different (e.g., "module" vs "file")? → Leave unless confusing

### 8. Missing Capability / Stale Scope

**Applies to**: `SKILL.md` description front-matter and trigger conditions.

**What it looks like:**
- Skill description says it handles only Vite config
- Repo now uses both Vite and Playwright — skill is silent on the latter

**How to detect:**

```bash
# Check what the skill says it triggers on
head -5 .claude/skills/<skill-name>/SKILL.md

# Compare to AGENTS.md critical commands to see if new commands exist
grep "pnpm run" AGENTS.md
```

**Decision tree:**
- New tooling is in scope of the skill's purpose? → Add guidance or note the gap
- New tooling is genuinely out of scope? → Update description to be explicit
- Gap requires a new skill? → Escalate to `skill-creator`

---

## Workflow: Three Phases

### Phase 1: Audit (Detect Drift)

**Step 1a: Inventory all files**

```bash
# List every file in the skill
find .claude/skills/<skill-name> -type f | sort
```

For each file, extract:
- Package-manager commands (`npm`/`pnpm`/`yarn`)
- `pnpm run <script>` names
- File paths (`src/`, relative paths)
- Version numbers (React, Vite, Tailwind, etc.)
- Skill name references (backtick-wrapped identifiers)

**Step 1b: Repository ground truth**

```bash
# Scripts
jq '.scripts | keys' package.json

# Versions
jq '{react: .dependencies.react, vite: .devDependencies.vite, tailwindcss: .devDependencies.tailwindcss}' package.json

# Constraints
cat AGENTS.md CLAUDE.md
```

**Step 1c: Dependency mapping** (for multi-skill audits)

- Which other skills does this one reference by name?
- Which other skills reference _this_ one?
- What's the safe sync order? (Fix foundational skills first)

**Decision: Is there drift?**

- No drift → Mark clean; update sync date only if it's stale
- Minor (1–2 items) → Fix inline
- Major (3+ items or structural) → Consider escalating to `skill-creator`

---

### Phase 2: Cross-Reference (Understand Impact)

For each drift item, classify risk:

| Drift type | Risk | Typical fix |
|:---|:---|:---|
| `npm` → `pnpm` in script file | Low | `sed` replace |
| `pnpm run X` not in package.json | Low–Medium | Update script name |
| `.js` → `.ts` in narrative path | Low | `sed` replace |
| Directory moved | Medium | Update all references in skill |
| Version bump, no API change | Low | Update sync line |
| Version bump with API change | High | Escalate to `skill-creator` |
| Cross-skill name wrong | Low | Update reference |
| Guidance contradicts AGENTS.md | High | Update to match AGENTS.md |

Before acting:
1. Will this fix break something else in the skill?
2. Does this drift appear in multiple files of the same skill?
3. Does fixing here require fixing sibling skills too?

---

### Phase 3: Update (Fix Drift)

**Step 3a: Apply changes — in file-type order**

1. `SKILL.md` first (sets the canonical terms other files must match)
2. `references/*.md` (densest content; most drift)
3. `scripts/` (executable; highest impact if wrong)
4. Everything else

For bulk version/extension updates across an entire skill:

```bash
# Bulk version replace across all files in a skill
find .claude/skills/<skill-name> -type f \( -name "*.md" -o -name "*.sh" -o -name "*.mjs" \) \
  -exec sed -i \
    -e 's/React 19\.2\.4/React 19.2.5/g' \
    -e 's/Vite 8\.0\.1\b/Vite 8.0.10/g' \
    -e 's/Tailwind 4\.2\.2/Tailwind 4.2.4/g' \
  {} \;

# Bulk npm → pnpm in shell scripts
find .claude/skills/<skill-name>/scripts -name "*.sh" \
  -exec sed -i \
    -e 's/\bnpm -v\b/pnpm -v/g' \
    -e 's/\bnpm install\b/pnpm install/g' \
    -e 's/\bnpm ci\b/pnpm install --frozen-lockfile/g' \
    -e 's/\bnpm run \([a-z:_-]*\)/pnpm run \1/g' \
  {} \;
```

**Step 3b: Verify each change**

```bash
# No npm left in scripts
grep -rn "npm " .claude/skills/<skill-name>/scripts/

# No stale .js src paths in narrative markdown
grep -rn 'src/.*\.jsx\?\b' .claude/skills/<skill-name>/ \
  | grep -v '\.test\.\|config\.\|\.mjs\|import '

# All pnpm run commands valid
grep -roh 'pnpm run [a-z:_-]*' .claude/skills/<skill-name>/ | sort -u | \
  while read cmd; do
    script="${cmd#pnpm run }"
    jq -e --arg s "$script" '.scripts[$s]' package.json > /dev/null \
      && echo "✓ $cmd" || echo "✗ NOT IN package.json: $cmd"
  done
```

**Step 3c: Update sync line**

Every `SKILL.md` should end with a sync line. Update it after fixing:

```
_Skill sync: compatible with React 19.2.5 / Vite 8.0.10 / Tailwind 4.2.4 baseline as of YYYY-MM-DD._
```

For reference files with their own sync lines, update those too.

**Step 3d: Commit**

Use Conventional Commits. Describe what drifted and why:

```
fix: sync <skill-name> to React 19.2.5 / Vite 8.0.10 baseline

- references/improvement-patterns.md: .js → .ts for src/ paths
- scripts/quality-gate.sh: npm run → pnpm run
- SKILL.md: sync line date updated
```

---

## Common Scenarios

### Scenario 1: Single Skill, All File Types

**Problem**: `game-improver` skill has npm in a reference doc and wrong extensions in scripts.

**Steps**:

1. `find .claude/skills/game-improver -type f | sort` — inventory all 9 files
2. Scan each for npm/extension/version drift
3. Fix `SKILL.md` first (canonical), then `references/`, then `scripts/`
4. Verify with the grep checks above
5. Commit as one unit: "fix: sync game-improver across all skill files"

### Scenario 2: Library-Wide Audit

**Problem**: Upgraded from React 19.2.4 → 19.2.5. 30 skills need sync-line updates.

**Steps**:

1. Find all affected files:
   ```bash
   grep -rln "React 19\.2\.4" .claude/skills/ --include="*.md" --include="*.sh"
   ```
2. Bulk-replace across all of them:
   ```bash
   find .claude/skills -type f \( -name "*.md" -o -name "*.sh" \) \
     -exec sed -i 's/React 19\.2\.4/React 19.2.5/g' {} \;
   ```
3. Scan for any remaining old references:
   ```bash
   grep -rln "React 19\.2\.4" .claude/skills/
   ```
4. One commit covering all skills

### Scenario 3: Skill References Moved Source File

**Problem**: `audio-debugger-ambient-vs-gig` points to `src/utils/AudioManager.js` but it moved to `src/utils/audio/AudioManager.ts`.

**Steps**:

1. Check every file in the skill:
   ```bash
   grep -rn "AudioManager" .claude/skills/audio-debugger-ambient-vs-gig/
   ```
2. Verify new path: `ls src/utils/audio/AudioManager.ts`
3. Replace in all files:
   ```bash
   find .claude/skills/audio-debugger-ambient-vs-gig -type f \
     -exec sed -i 's|src/utils/AudioManager\.js|src/utils/audio/AudioManager.ts|g' {} \;
   ```
4. Check other skills that may reference the same path:
   ```bash
   grep -rln "AudioManager" .claude/skills/ --include="*.md"
   ```

### Scenario 4: Cascading Cross-Skill Rename

**Problem**: Skill `state-mutation-guard` was renamed to `state-safety-action-creator-guard`. Other skills reference the old name.

**Steps**:

1. Find all references to the old name:
   ```bash
   grep -rln "state-mutation-guard" .claude/skills/
   ```
2. Update each referencing skill
3. Verify the new name exists:
   ```bash
   ls .claude/skills/state-safety-action-creator-guard/
   ```
4. Commit per referencing skill or as one batch

---

## Error Recovery

**Can't find where something changed?**
```bash
git log --oneline -S "old_value" -- package.json AGENTS.md | head -10
```

**Unsure if a `.js` import should be `.ts`?**
Check if it's inside a `node:test` `import` statement. If yes, keep `.js` — tsx handles the resolution. If it's narrative text or a shell path, update to `.ts`.

**Sync broke multiple skills?**
```bash
git checkout -- .claude/skills/   # Undo all skill changes
# Then escalate to skill-creator with a list of the affected files
```

**Script change not working?**
```bash
bash -n .claude/skills/<skill-name>/scripts/<script>.sh  # Syntax check only
```

---

## When to Escalate to skill-creator

Stop and escalate if:

- ✋ Version upgrade has breaking API changes affecting the skill's core workflow
- ✋ A skill directory structure itself needs to be reorganized (new reference files, new agents)
- ✋ Guidance in a reference doc is wrong, not just stale (requires domain knowledge to fix correctly)
- ✋ Fixing one skill requires simultaneously rewriting three or more others
- ✋ A script's logic is wrong (not just the package manager command)

Escalation message format:

> "`<skill-name>/references/<file>.md` gives wrong guidance for `<topic>` since `<change>`. This needs `skill-creator` review — I can fix the surface drift but not validate the domain correctness."

_Skill sync: compatible with React 19.2.5 / Vite 8.0.10 / Tailwind 4.2.4 baseline as of 2026-05-10._
