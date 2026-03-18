---
name: repo-guardrails-generator
description: generate strict project guardrails and checklists. Trigger when defining rules, setting up a new agent, or codifying best practices. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Generate enforceable guardrails that reduce ambiguity and prevent policy drift across contributors.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: "1.0.0"
  author: "neurotoxic-project"
  category: "tooling"
  keywords: ["tooling","guardrails","automation"]
  maturity: "stable"
license: "Proprietary. See LICENSE.txt for terms"
---
# Repo Guardrails Generator

Create concise, actionable rules for the repository.

## Workflow

1.  **Analyze Context**
    - What are the common failures? (e.g., "Tests fail often", "Styles are inconsistent").
    - What are the hard constraints? (e.g., "No `any` type").

2.  **Draft the Rules**
    - **MUST**: Non-negotiable. (e.g., "MUST use `pnpm run test`").
    - **SHOULD**: Best practice. (e.g., "SHOULD use descriptive names").
    - **NEVER**: Forbidden. (e.g., "NEVER commit secrets").

3.  **Format as Checklist**
    - Use checkboxes `[ ]` for verifiability.
    - Keep it short (max 10 items).

4.  **Review against `AGENTS.md`**
    Ensure alignment with existing project documentation.

## Example

**Input**: "Create guardrails for the UI components."

**Output**:

```markdown
# UI Component Guardrails

- [ ] **Styles**: Use `@theme` native token utilities (`bg-void-black`, `text-toxic-green`) — not `bg-(--void-black)` or `bg-[var(--void-black)]`.
- [ ] **Structure**: One component per file.
- [ ] **Props**: Define `propTypes` or use TypeScript interfaces.
- [ ] **Testing**: Storybook story exists.
- [ ] **Accessibility**: `aria-label` on icon-only buttons.
```


_Skill sync: compatible with React 19.2.4 / Vite 8.0.0 baseline as of 2026-03-18._
