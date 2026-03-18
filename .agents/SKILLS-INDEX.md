# Neurotoxic Skills Library Index

**Status:** 100% Compliant with Agent Skills Specification  
**Last Updated:** 2026-03-18  
**Total Skills:** 30 (22 stable, 8 beta)

---

## Quick Start

### Discover Skills
```bash
# View all skills
cat .agents/skills-manifest.json | jq '.skills[] | {name: .directory, category, maturity}'

# Query by category
cat .agents/skills-manifest.json | jq '.skills[] | select(.category=="game")'

# List skill dependencies
cat .agents/skills-dependencies.json | jq '.dependencies'
```

### Validate Skills
```bash
# Run full validation
bash ./.agents/validate-skills.sh ./.agents/skills

# Check validation results
cat skill-validation-report.csv
```

---

## Skills by Category

### Meta (4 skills)
- **skill-creator** — Create, improve, and evaluate skills
- **skill-qa-harness** — Run structural and logical validation gates for skills (YAML, references, trigger overlap)
- **skill-aligner** — Align skills with repository conventions
- **skilltest** — Validate skill structure and test execution (integration-level validation)

### Game (2 skills)
- **game-improver** — Implement gameplay improvements and bug fixes
- **game-balancing-assistant** — Analyze and tune game balance

### Code Quality (2 skills)
- **one-command-quality-gate** — Run lint, test, build suite
- **mega-lint-snapshot** — Comprehensive linting and security scanning

### Performance (3 skills)
- **react-performance-optimization** — Optimize React rendering and bundle
- **perf-budget-enforcer** — Enforce bundle size and performance budgets
- **pixi-lifecycle-memory-leak-sentinel** — Detect Pixi.js memory leaks

### UI (3 skills)
- **convention-keeper-brutalist-ui** — Enforce brutalist design system
- **debug-ux-upgrader** — Add debug tools and overlays
- **tailwind-v4-css-variables-enforcer** — Enforce Tailwind v4 tokens

### Audio (2 skills)
- **audio-debugger-ambient-vs-gig** — Debug audio playback issues
- **webaudio-reliability-fixer** — Stabilize Web Audio startup

### Documentation (3 skills)
- **agents-md-writer** — Write AGENTS.md context files
- **project-brain-codex-instructions** — Generate project context
- **release-notes-synthesizer** — Create release notes from commits

### Testing (1 skill)
- **golden-path-test-author** — Write integration tests for game flow

### State Management (1 skill)
- **state-safety-action-creator-guard** — Enforce state immutability

### Debugging (1 skill)
- **min-repro-builder** — Create minimal reproduction cases

### Assets (1 skill)
- **asset-pipeline-verifier** — Diagnose asset loading issues

### CI (1 skill)
- **ci-hardener** — Improve CI reliability and speed

### Diagnostics (1 skill)
- **one-command-doctor** — Diagnose environment and build issues

### Infrastructure (1 skill)
- **repo-navigator-agents-routing** — Route requests to correct domains

### Refactoring (1 skill)
- **refactor-with-safety** — Refactor code without breaking functionality

### Tooling (2 skills)
- **repo-guardrails-generator** — Generate project guardrails
- **dependency-pin-upgrade-blocker** — Enforce pinned dependencies

### Workflow (1 skill)
- **change-plan-conventional-commits** — Plan changes and draft commit messages

---

## Key Metadata Files

### skills-manifest.json
Machine-readable registry of all 30 skills with metadata.

**Usage:**
```json
{
  "meta": {
    "total_skills": 30,
    "categories": {...},
    "generated_date": "2026-03-18"
  },
  "skills": [
    {
      "directory": "skill-creator",
      "name": "skill-creator",
      "category": "meta",
      "maturity": "stable",
      "version": "1.0.0",
      ...
    }
  ]
}
```

### skills-dependencies.json
Dependency graph showing skill relationships and routing triggers.

**Usage:**
```json
{
  "dependencies": {
    "game-improver": {
      "depends_on": [],
      "related_skills": [
        "game-balancing-assistant",
        "convention-keeper-brutalist-ui",
        ...
      ],
      "routing_triggers": {...}
    }
  }
}
```

---

## Asset Files (Token Maps)

### tailwind-v4-css-variables-enforcer/assets/tokens.json
46 Tailwind color tokens extracted from `src/index.css`.

**Contents:**
- Color definitions (hex, RGB, RGBA)
- Validation rules for token enforcement
- Forbidden patterns (hex codes, rgb(), hsl())

### state-safety-action-creator-guard/assets/action-types.json
Redux ActionTypes schema with payloads and state invariants.

**Contents:**
- Action type definitions
- Payload schemas
- State change rules
- Validation guards

### audio-debugger-ambient-vs-gig/assets/audio-config.json
Audio context configuration for ambient and gig playback.

**Contents:**
- Ambient context settings (volume, fade times, looping)
- Gig context settings (high volume, foreground priority)
- AudioContext lifecycle management

---

## Validation & CI

### validate-skills.sh
Automated CI validator that checks all skills for compliance.

**Features:**
- Structural validation (SKILL.md, YAML, required fields)
- Content validation (name matching, reference existence)
- Reference depth checking (max 1 level)
- CSV report generation
- Exit codes: 0 (PASS), 1 (FAIL), 2 (WARN)

**Usage:**
```bash
bash ./.agents/validate-skills.sh ./.agents/skills
```

**Last Run:**
```
Total: 30 | PASS: 30 | WARN: 0 | FAIL: 0
✓ All skills valid (PASS)
```

---

## Compliance Report

Full compliance documentation available in `SKILLS-COMPLIANCE-REPORT.md`.

**Sections:**
- Executive summary with metrics
- Category breakdown (17 categories)
- Maturity analysis (22 stable, 8 beta)
- Generated files manifest
- Tier 1, 2, 3 completion checklist
- Next steps and recommendations

---

## Top 10 High-Impact Skills

Pre-approved with standard tool set (Bash, Read, Write, Glob, Grep, Edit, WebFetch):

1. **skill-creator** — Meta: skill creation and improvement
2. **game-improver** — Game: core gameplay improvements
3. **one-command-quality-gate** — QA: CI gating mechanism
4. **asset-pipeline-verifier** — Assets: loading diagnostics
5. **state-safety-action-creator-guard** — State: immutability enforcement
6. **react-performance-optimization** — Perf: React optimization
7. **tailwind-v4-css-variables-enforcer** — UI: token enforcement
8. **mega-lint-snapshot** — QA: comprehensive linting
9. **golden-path-test-author** — Testing: regression coverage
10. **skill-qa-harness** — Meta: skill validation

---

## Maturity Tiers

### Stable (22 skills)
Production-ready, fully tested, actively maintained.

- agents-md-writer
- asset-pipeline-verifier
- audio-debugger-ambient-vs-gig
- change-plan-conventional-commits
- ci-hardener
- convention-keeper-brutalist-ui
- dependency-pin-upgrade-blocker
- game-balancing-assistant
- game-improver
- mega-lint-snapshot
- one-command-doctor
- one-command-quality-gate
- perf-budget-enforcer
- pixi-lifecycle-memory-leak-sentinel
- project-brain-codex-instructions
- refactor-with-safety
- repo-guardrails-generator
- repo-navigator-agents-routing
- skill-creator
- state-safety-action-creator-guard
- tailwind-v4-css-variables-enforcer
- webaudio-reliability-fixer

### Beta (8 skills)
Experimental, in active development, feedback welcome.

- debug-ux-upgrader
- golden-path-test-author
- min-repro-builder
- react-performance-optimization
- release-notes-synthesizer
- skill-aligner
- skill-qa-harness
- skilltest

---

## Bundled References

4 skills include bundled reference documentation:

### game-improver (4 files)
- implementation-standards.md
- game-improver-playbook.md
- operational-workflows.md
- quality-and-release.md

### react-performance-optimization (7 files)
- virtualization.md
- code-splitting.md
- profiling-debugging.md
- common-pitfalls.md
- memoization.md
- concurrent-features.md
- state-management.md

### mega-lint-snapshot (1 file)
- tools.md

### skilltest (1 file)
- open-agent-skills.md

---

## Integration Examples

### Load All Skills Programmatically
```bash
jq '.skills' .agents/skills-manifest.json | \
  jq 'map({name: .directory, category: .category})'
```

### Find Skills by Maturity
```bash
jq '.skills[] | select(.maturity=="beta")' \
  .agents/skills-manifest.json
```

### Check Skill Dependencies
```bash
jq '.dependencies["game-improver"]' \
  .agents/skills-dependencies.json
```

### Validate Before Commit
```bash
bash ./.agents/validate-skills.sh ./.agents/skills && \
  git add .agents/
```

---

## Documentation

- **SKILLS-INDEX.md** — This file (quick reference)
- **SKILLS-COMPLIANCE-REPORT.md** — Full compliance analysis
- **skills-manifest.json** — Machine-readable skill registry
- **skills-dependencies.json** — Dependency graph
- **validate-skills.sh** — Validation script

---

## Summary

**30 Skills | 17 Categories | 22 Stable + 8 Beta | 100% Compliant**

The Neurotoxic skills library provides a comprehensive toolkit for game development, code quality, performance optimization, and testing. All skills are documented, validated, and ready for production use.

For detailed compliance information, see `SKILLS-COMPLIANCE-REPORT.md`.

Generated 2026-03-18
