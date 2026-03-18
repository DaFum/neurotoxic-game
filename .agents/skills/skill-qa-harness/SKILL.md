---
name: skill-qa-harness
description: Run this skill whenever work touches `.agents/skills/**` (new skills, edits, refactors, CI failures, trigger-quality tuning, or release prep). It should aggressively validate structure, frontmatter YAML, referenced-file paths, duplicate names, and trigger-description overlap risk, then output evidence-backed PASS/FAIL/WARN gate results with concrete fixes. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Gate skills with structural + logical checks and report PASS/WARN/FAIL plus exact remediation paths.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: "1.0.0"
  author: "neurotoxic-project"
  category: "meta"
  keywords: ["meta","skills","qa","testing"]
  maturity: "beta"
license: "Proprietary. See LICENSE.txt for terms"
---
# Skill QA Harness

Use this skill to perform a fast but discriminative quality gate for the skill library before merge or CI.

## Why this exists

Skill regressions are often subtle: invalid YAML, stale script references, and over-broad trigger descriptions can pass casual review but break agent routing or create accidental cross-triggering. This workflow emphasizes evidence-backed checks and actionable remediation.

## Workflow

1. **Discover scope**
   - Enumerate `SKILL.md` files under `.agents/skills/`.
   - Note whether the request is for a full-library sweep or targeted changed-skill subset.

2. **Run structural validator first (authoritative baseline)**
   - Execute:

   ```bash
   node .agents/skills/skilltest/scripts/validate-skills.mjs
   ```

   - Capture raw output and quote the relevant lines in the report.

3. **Run discriminative logical checks**
   - **Duplicate names**: verify each `name` frontmatter value is unique.
   - **Reference integrity**: for each mentioned local script/path in instructions, verify existence.
   - **Trigger overlap risk**: compare descriptions for broad overlapping phrases (e.g., multiple skills claiming the same catch-all situations without differentiators).

4. **Edge-case handling**
   - If validator output is deprecated/noisy, still use results but annotate the warning.
   - If a check cannot be completed, emit `WARN` with why and a fallback/manual step.
   - Never claim “all clear” unless the corresponding check output is shown.

5. **Report for CI/PR use**
   - Emit a concise gate summary using `PASS`, `FAIL`, `WARN`.
   - Include blockers and a concrete next action for every `FAIL`/`WARN` item.

## Output template

```text
Skill QA Gate
- PASS: Structural validation (`validate-skills.mjs`) completed.
- WARN: Trigger overlap risk between skill A and skill B (keyword collision on "benchmark").
- FAIL: Missing referenced script `.agents/skills/foo/scripts/run.sh`.

Blockers
- Missing script path in foo skill.

Recommended Fixes
1) Add or remove stale script reference in foo/SKILL.md.
2) Narrow overlapping descriptions with domain-specific trigger terms.
```

## Example

**Input:** “I changed two skills and need a pre-PR QA gate summary.”

**Action:** Run structural validator, then perform duplicate-name + path-reference + description-overlap checks.

**Output:** Evidence-backed PASS/WARN/FAIL summary with blockers and concrete remediations.

## Decision Tree

- **Only changed files provided?** Validate only touched skills first, then run full sweep if any blocker appears.
- **Validator passes but regressions suspected?** Run logical checks (duplicate names, refs, overlap) before declaring PASS.
- **Any unresolved check?** Emit `WARN` + explicit manual step; do not silently PASS.

## Quality Cut-List

- [ ] PASS/WARN/FAIL each has concrete evidence.
- [ ] Blockers list includes owner-actionable fixes.
- [ ] Trigger overlap findings include compared skill names.
- [ ] Missing path findings include exact broken path strings.


_Skill sync: validates skill structure, YAML frontmatter, metadata consistency, and trigger overlap as of 2026-03-18._
