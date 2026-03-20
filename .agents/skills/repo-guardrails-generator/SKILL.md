---
name: repo-guardrails-generator
description: Generate strict project guardrails and checklists that enforce consistency, prevent common mistakes, and align teams on standards. Trigger when defining rules for new repos, setting up new agents/projects, enforcing technical constraints (version pinning, dependency management), creating team practices (code review, testing standards), preventing specific failure patterns (flaky tests, style inconsistencies), or integrating guardrails with existing documentation (AGENTS.md, CLAUDE.md). Works for monorepos with multiple project types and helps avoid rule conflicts across teams.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: '1.0.0'
  author: 'neurotoxic-project'
  category: 'tooling'
  keywords: ['tooling', 'guardrails', 'automation']
  maturity: 'stable'
license: 'Proprietary. See LICENSE.txt for terms'
---

# Repo Guardrails Generator

Create specific, verifiable guardrails that enforce team standards and prevent costly mistakes. Guardrails are the operational rules that make documentation actionable—they bridge between strategy (AGENTS.md, CLAUDE.md) and practice.

## When to Use This Skill

**New guardrails:**

- Setting up a new project or repository
- Enforcing a new technical constraint (e.g., "no `any` types", "pin Node.js to v22+")
- Preventing a specific failure pattern (style regressions, test flakiness, accidental upgrades)
- Codifying team practices (naming conventions, PR requirements, design patterns)

**Updating guardrails:**

- Monorepo with project-specific guardrails (frontend, backend, shared utils)
- Aligning new guardrails with existing AGENTS.md or CLAUDE.md
- Handling conflicts between project-wide and team-specific rules
- Adding error-recovery guardrails (what to do when someone breaks a rule)

## Decision Tree: When to Use What

```text
User asks: "I want rules for X"
├─ If X is a technical constraint (versions, linting, types)
│  └─ Ask: Single project or monorepo with conflicts?
│     ├─ Single: Create strict MUST/NEVER guardrails with verification steps
│     └─ Monorepo: Create project-specific sets + shared core rules
├─ If X is integration with existing docs
│  └─ Audit AGENTS.md/CLAUDE.md first, identify gaps, then create guardrails
└─ If X is prevention of a pattern
   └─ Include error-recovery (how to detect, how to fix, rollback steps)
```

## Workflow

### Step 1: Analyze Context (Uncover Real Constraints)

Ask yourself:

- **Failures**: What mistakes actually happen? (e.g., "Someone upgraded Vite and broke builds", "Styles use hardcoded colors")
- **Costs**: How much does each mistake cost? (review time, debugging, test flakiness)
- **Constraints**: What's non-negotiable? (e.g., "No external dependencies", "All components must be testable")
- **Integration**: Do existing guardrails (in AGENTS.md, CLAUDE.md) already cover this? If yes, reference them instead of duplicating.

**Example context analysis:**

> "We keep having type safety issues because junior devs use `any`. It wastes 2–3 hours per PR in review. Hard constraint: TypeScript everywhere, no exceptions."

### Step 2: Draft the Rules (Three Categories)

Guardrails use three levels:

- **MUST** (Non-negotiable): "MUST use `pnpm run test` before committing" — these are hard stops.
- **SHOULD** (Best practice): "SHOULD define interfaces for all props" — these are guidance, enforcement is context-dependent.
- **NEVER** (Forbidden): "NEVER commit secrets" — explicit prohibition with consequences.

For each rule, include **why**:

- The failure it prevents
- The cost if violated
- How to detect violations (verifiable)

**Example rule with reasoning:**

```markdown
- [ ] **Type Safety**: MUST not use `any` types.
      WHY: Loses type information, causes downstream errors.
      VERIFY: Run `pnpm run lint` — catch at commit time.
```

### Step 3: Handle Conflicts & Edge Cases

When rules span multiple projects or teams:

1. **Identify conflicts**: Do project-specific rules contradict each other?
   - Example: "Frontend requires Tailwind v4" but "Shared utils must be framework-agnostic"
   - Solution: Create a shared rule ("utils are CSS-in-JS") and project overrides

2. **Error recovery**: What if someone breaks a rule? How do they fix it?
   - Example: "MUST pin Vite to 8.0.1" → Error recovery: "If upgraded, run `pnpm install --frozen-lockfile vite@8.0.1` and rebuild"

3. **Validation**: How do we verify compliance?
   - Manual checklist (pre-commit review)
   - Automated (CI checks, linters, pre-commit hooks)

### Step 4: Format as Checklist (Max 10–12 Items)

Use checkboxes `[ ]` for each rule. Organize into **sections** (Linting, Styling, Testing, etc.) so users can find relevant rules quickly.

```markdown
# <Project> Guardrails

## Linting

- [ ] **Types**: MUST not use `any`. Catch at commit with `pnpm run lint`.
- [ ] **Imports**: MUST use absolute paths from `@/` aliases.

## Styling

- [ ] **Colors**: Use `@theme` tokens only. Never hardcode colors or use `bg-[var(...)]`.

## Testing

- [ ] **Coverage**: SHOULD write tests for components with props.
```

### Step 5: Review Against Existing Docs

Check your project's AGENTS.md or CLAUDE.md. If rules already exist there, reference them instead:

```markdown
- [ ] **Version Pinning**: See AGENTS.md → "Pinned Dependencies" for the full list.
```

This avoids duplication and keeps guardrails as the **operational checklist**, not a documentation rewrite.

## Example: React 19 Project

**Input**: "Create guardrails for a new React 19 project with Tailwind v4 and strict linting."

**Output**:

```markdown
# React 19 Project Guardrails

## Linting & Types

- [ ] **Type Safety**: MUST not use `any` types. No exceptions. Run `pnpm run lint` to verify before committing.
- [ ] **Module Imports**: MUST use absolute imports (`@/components/...`). Never `../../../`. Checked by ESLint.
- [ ] **Unused Code**: SHOULD not leave commented-out code. If needed, use a task tracking system instead.

## Styling & Tailwind v4

- [ ] **Color Tokens**: MUST use `@theme` CSS variables (e.g., `bg-void-black`, `text-toxic-green`) from Tailwind config. NEVER hardcode `#fff` or use `bg-[var(--color-...)]` — the @theme syntax is shorter and faster.
- [ ] **Utility Classes**: SHOULD prefer native Tailwind utilities. Use arbitrary values `w-[calc(...)]` only for one-offs; if you need it twice, add it to @theme.
- [ ] **Z-Index**: Use CSS variables for z-index (`z-(--z-crt)`). See CLAUDE.md for the token list.

## Testing

- [ ] **Component Tests**: SHOULD write at least one test per component. Use Vitest for React components, node:test for logic.
- [ ] **Golden Path**: MUST test the critical game loop. See golden-path-test-author skill if unsure what "critical" means.

## Performance & Dependencies

- [ ] **Version Pinning**: MUST keep exact versions: React 19.2.4, Vite 8.0.1, Tailwind 4.2.2. See CLAUDE.md → "Architecture Constraints" for rationale. Do NOT upgrade without explicit approval.
- [ ] **Howler.js**: NEVER import Howler.js. Use Tone.js only. See webaudio-reliability-fixer skill if audio breaks.

## Integration with Docs

See CLAUDE.md → "Critical Commands", "Architecture Constraints", "Gotchas" for deeper guidance on any rule above.
```

## Common Mistakes to Avoid

| Mistake                           | Why It Breaks                                | Fix                                                             |
| --------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Rules too vague ("Be consistent") | Hard to verify, no teeth                     | Make them specific ("Use @theme tokens, not hardcoded colors")  |
| Too many rules (15+)              | No one reads them all                        | Prioritize: max 10–12, group by section                         |
| No error recovery                 | Developer doesn't know how to fix violations | Add "If broken, do X" for each MUST/NEVER                       |
| No reference to docs              | Duplication and confusion                    | Link to AGENTS.md/CLAUDE.md sections instead of repeating       |
| Missing the "why"                 | Rules feel arbitrary                         | Explain the failure cost (review time, bugs, onboarding burden) |

_Skill sync: compatible with React 19.2.4 / Vite 8.0.1 baseline as of 2026-03-18._
