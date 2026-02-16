---
name: skill-qa-harness
description: Validate and test the skill library. Trigger when adding a new skill, modifying an existing one, or running the skill CI. Checks structure, YAML, and logic.
---

# Skill QA Harness

Ensure all skills in the library are valid and functional.

## Workflow

1.  **Discovery**
    Scan `.claude/skills/` for all `SKILL.md` files.

2.  **Structural Validation**
    For each skill:
    *   **Frontmatter**: Does it have `name` and `description`?
    *   **Format**: Is it valid YAML?
    *   **Paths**: Do referenced scripts exist?

3.  **Logical Validation**
    *   **Duplicates**: Are there multiple skills with the same name?
    *   **Conflicts**: Do descriptions overlap significantly?

4.  **Reporting**
    Generate a PASS/FAIL report.

## Commands

Use the bundled validator (if available in `skilltest`):

```bash
node .claude/skills/skilltest/scripts/validate-skills.mjs
```

## Example

**Input**: "I added a new skill. Check if it's valid."

**Action**:
Run validation script.

**Output**:
```text
[FAIL] new-skill/SKILL.md: Missing 'description' in frontmatter.
[PASS] old-skill/SKILL.md
```
"The new skill is missing a description. Please add it to the YAML header."
