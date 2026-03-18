---
name: skill-aligner
description: Align skills with repository conventions and detect drift across the skill library. Trigger when a skill feels outdated, references deleted files, uses incorrect/deprecated commands, has version mismatches (Vite 7 vs 8, React 18 vs 19), terminology doesn't match project docs, or contradicts AGENTS.md/CLAUDE.md. Use to synchronize single skills after repo changes, audit monorepo skills for cascading drift, or batch-update a skill library. Detects command mismatches, path changes, version drift, broken references, and circular dependencies.
---

# Skill Aligner

Detect and fix drift between skills and the repository. Drift happens when the repository changes (new versions, restructured paths, new commands) but skills still reference the old state. This skill helps you find drift systematically and fix it safely.

## When to Use This Skill

**Single skill drift:**
- A skill references `npm run lint:fix` but the repo only has `npm run lint`
- A skill mentions "Vite 7" but you upgraded to "Vite 8.0.0"
- A skill references `src/utils/` but you moved it to `packages/shared/src/utils/`

**Monorepo cascading drift:**
- You restructured a monorepo from `frontend/src` to `packages/frontend/src`
- This affects 3 skills at once — how do you sync in the right order?
- What if syncing one skill breaks another?

**Library-wide audits:**
- You're maintaining 20+ skills — some may have stale references
- You want to audit all skills for critical drift vs. cosmetic drift
- You need a systematic approach to batch-update safely

## Drift Detection Patterns

These are the most common drift types. Learn to spot them quickly.

### 1. **Command Mismatch** (Most Common)
**What it looks like:**
- Skill says: `npm run test:unit`
- Repo says: `npm run test`

**How to detect:**
```bash
# Extract all npm run commands from SKILL.md
grep -o 'npm run [a-z:]*' SKILL.md | sort -u

# Compare to package.json scripts
jq '.scripts | keys' package.json
```

**Decision tree:**
- Is the script in package.json? → Update skill
- Is the script missing? → Add to package.json, then update skill
- Are both valid (e.g., `test` and `test:unit`)? → Ask: which does the skill actually use? Update to the correct one

### 2. **Version Mismatch** (Critical)
**What it looks like:**
- Skill says: "Vite 7 compatible"
- Repo says: `"vite": "8.0.0"` in package.json

**How to detect:**
```bash
# Find version references in SKILL.md
grep -E '(v[0-9]+\.[0-9]+|React|Vite|Tailwind)' SKILL.md

# Compare to package.json
jq '.dependencies, .devDependencies' package.json
```

**Decision tree:**
- Is the version mentioned just for context? → Update to current version
- Is the version a constraint (e.g., "MUST use v8")? → Verify it's still a constraint, update if needed
- Are there API changes between versions? → Escalate to skill-creator for deeper rewrite

### 3. **Path Mismatch** (Cascading Risk)
**What it looks like:**
- Skill says: `src/components/Button.jsx`
- Repo says: `packages/ui/src/components/Button.jsx` (after monorepo restructure)

**How to detect:**
```bash
# Find file/directory references in SKILL.md
grep -E '(src/|packages/|\.\./)' SKILL.md

# Verify they exist
for path in $(grep -o '[a-zA-Z0-9/_.-]*\.js[x]*' SKILL.md); do
  [ -f "$path" ] && echo "✓ $path exists" || echo "✗ $path MISSING"
done
```

**Decision tree:**
- Is the path simply outdated? → Update to new location
- Do multiple skills reference this path? → Check for cascading drift (see Monorepo Strategy below)
- Does the path change affect imports or tooling? → Escalate to skill-creator

### 4. **Terminology/Doc Mismatch** (Subtle)
**What it looks like:**
- Skill says: "Use Brutalist design" with custom CSS
- AGENTS.md says: "Use Tailwind v4 @theme tokens"

**How to detect:**
```bash
# Extract key terms from SKILL.md
grep -i -E '(design|pattern|architecture|constraint)' SKILL.md

# Compare to AGENTS.md and CLAUDE.md
grep -i -E '(design|pattern|architecture|constraint)' AGENTS.md CLAUDE.md
```

**Decision tree:**
- Is the skill's guidance aligned with AGENTS.md? → Update if not
- Is the terminology outdated (e.g., "Brutalist" vs "Tailwind v4")? → Standardize language
- Does the skill add domain-specific context missing from docs? → Keep and add reference to docs

### 5. **Missing Feature/Capability**
**What it looks like:**
- Skill says: "Handles GitHub Actions"
- Repo also uses: GitLab CI, but skill doesn't mention it

**How to detect:**
```bash
# Find capability claims in SKILL.md
grep -E '(supports?|handles?|works with)' SKILL.md

# Check actual repo setup
ls -la | grep -E '(\.github|\.gitlab|\.circleci)'
```

**Decision tree:**
- Is the missing platform important? → Add guidance for it, or note it as out-of-scope
- Would adding it require major rewrite? → Escalate to skill-creator
- Is it a cosmetic gap? → Update description to be honest about scope

---

## Workflow: Three Phases

### Phase 1: Audit (Detect Drift)

**Step 1a: Skill Audit**
Read the `SKILL.md` file. Extract:
- All commands (`npm run ...`, `git`, `python`)
- All file paths (`src/`, `packages/`, relative paths)
- All version references (Vite, React, Node.js, etc.)
- All terminology claims (what does it say it supports?)

**Step 1b: Repository Audit**
Cross-reference against current state:
- `package.json` → scripts, versions, dependencies
- `AGENTS.md` / `CLAUDE.md` → architecture, constraints, terminology
- File system → does `src/utils/` still exist?
- CI config (`.github/workflows/`, `.gitlab-ci.yml`) → what platforms are used?

**Step 1c: Dependency Mapping** (for monorepos)
- Does this skill depend on other skills?
- Do changes here affect other skills? (e.g., path changes in monorepo)
- What's the dependency order? (e.g., sync shared-utils before frontend)

**Decision: Is there drift?**
- No drift → Mark as clean, no action
- Minor drift (1–2 items) → Handle inline in Phase 2
- Major drift (3+ items, complex) → Consider escalating to skill-creator

---

### Phase 2: Cross-Reference (Understand Impact)

**Step 2a: Identify Drift Type**
Classify each drift item:
- Command mismatch? → Low risk, easy fix
- Version mismatch? → Medium risk, may need deep rewrite
- Path mismatch? → High risk if monorepo, check for cascading effects
- Terminology mismatch? → Low risk, update descriptions
- Missing capability? → Medium risk, assess scope

**Step 2b: Risk Assessment**
For each drift item, ask:
1. Is this a simple find-replace? (Low risk)
2. Does fixing this break other skills? (Check dependencies from 1c)
3. Does this require domain expertise I lack? (Consider escalating)
4. Is this a breaking change for users of this skill? (Document the update)

**Step 2c: Update Decision**
- **Update the skill**: Command mismatch, simple path changes, version bumps with no API changes
- **Update the repo**: Rarely — only if the skill is right and repo config is wrong
- **Escalate to skill-creator**: Complex rewrites, API changes, unclear scope, high-risk monorepo changes

**Step 2d: Validation Plan**
Before making changes:
- How will I test that the fix worked? (e.g., "run the skill on a test prompt")
- What could go wrong? (e.g., "if I change the path, does it break the skill logic?")
- Do I need a rollback plan? (especially for monorepo changes)

---

### Phase 3: Update (Fix Drift)

**Step 3a: Apply Changes**
- Update commands to match `package.json`
- Update paths to match current repo structure
- Update version references
- Update terminology to match AGENTS.md/CLAUDE.md
- Add references to new capabilities (e.g., "This skill also works with GitLab CI — see `X` for setup")

**Step 3b: Monorepo Safety** (if applicable)
- Sync in dependency order (shared → frontend/backend)
- Verify each update with a test run
- Watch for cascading breakage (if one skill update breaks another, stop and reassess)

**Step 3c: Verification**
- Run the skill on a test prompt to confirm it still works
- Check that referenced files exist and paths are correct
- Verify commands actually run: `npm run <script>` without errors
- Re-read AGENTS.md/CLAUDE.md to confirm alignment

**Step 3d: Document**
- Commit message should note what drifted and why (e.g., "sync to React 19.2.4 upgrade")
- If changes affect multiple skills, note the dependency chain
- If you escalated to skill-creator, document why

---

## Common Scenarios

### Scenario 1: Single Skill, Simple Drift
**Problem**: `ci-hardener` says `npm run lint:fix` but package.json only has `npm run lint`

**Steps**:
1. Audit: Extract commands from ci-hardener/SKILL.md → `["npm run lint:fix", "npm run test"]`
2. Cross-reference: Check package.json → `["lint": "...", "test": "...", "format": "..."]`
3. Drift found: `lint:fix` doesn't exist, `format` is new
4. Decision: Is `lint:fix` a mistake, or should we add it to package.json?
   - If repo intended `npm run format`, update skill
   - If skill intended `npm run lint --fix`, add the script to package.json
5. Update: Choose one path, verify with test run

---

### Scenario 2: Monorepo Cascading Drift
**Problem**: Restructured from `frontend/src/` to `packages/frontend/src/`. Now `frontend-linter`, `shared-utils`, and `web-config` skills all need updates.

**Steps**:
1. Audit: Map all three skills to identify which paths they reference
2. Dependency mapping:
   - `shared-utils` is a dependency of `frontend` and `web-config`
   - Sync order: `shared-utils` first, then `frontend-linter` and `web-config`
3. Phase 1: Update `shared-utils` skill with new paths
4. Test: Run the skill to confirm it works with new paths
5. Phase 2: Update `frontend-linter`, verify no breakage
6. Phase 3: Update `web-config`, verify cascading works
7. Rollback plan: If phase 3 breaks, revert and escalate to skill-creator

---

### Scenario 3: Version Mismatch Requiring Rewrite
**Problem**: Skill references "Vite 7" and old file structure, but we're on Vite 8.0.0 with API changes

**Steps**:
1. Audit: Extract version references → "Vite 7 compatible"
2. Cross-reference: Package.json says `"vite": "8.0.0"`, CLAUDE.md says "Vite 8.0.0 required"
3. Risk assessment:
   - Is this a simple version bump in examples? → Update and test
   - Are there API changes? (e.g., Vite 7 plugin API changed in v8) → Escalate to skill-creator
4. Decision: If escalating, document why:
   - "Vite 8 has breaking changes in X; this skill needs a deeper rewrite"
   - Recommend skill-creator review the entire workflow

---

## Error Recovery

**If you're stuck:**

1. **Can't find where something changed?** → Search AGENTS.md and git history
   ```bash
   git log --oneline -S "old_command" -- package.json | head -5
   ```

2. **Don't know if a change is safe?** → Test it:
   ```bash
   # Copy skill to temp location, make change, run test
   cp -r skill skill-test
   # ... make changes ...
   # Run skill-test on eval
   ```

3. **Sync broke multiple skills?** → Rollback and escalate:
   ```bash
   git checkout -- .  # Undo all changes
   # Then escalate to skill-creator with details
   ```

4. **Unsure about scope?** → Ask: "Is this a find-replace (low complexity) or a rewrite (high complexity)?"
   - Low: Update and move on
   - High: Escalate to skill-creator for assessment

---

## When to Escalate to skill-creator

Stop and escalate if:

- ✋ Skill requires major rewrite (changed architecture, removed steps, new workflows)
- ✋ Version upgrade has breaking API changes
- ✋ Monorepo change creates circular dependencies or unsolvable conflicts
- ✋ You're not confident the change won't break the skill's functionality
- ✋ Multiple skills have interdependencies you can't verify safely

Escalation example:
> "game-improver references Vite 7 and old structure. Vite 8 has plugin API changes. This needs skill-creator review before I proceed."

_Skill sync: compatible with React 19.2.4 / Vite 8.0.0 baseline as of 2026-03-18._
