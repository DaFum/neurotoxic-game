---
name: repo-navigator-agents-routing
description: Route questions to the correct folder (context, hooks, scenes, utils, components, data, ui) and consult the relevant AGENTS.md first. Use when asked where logic lives or which files own behavior.
---

# AGENTS-Aware Repo Navigation

## Workflow

1. Identify the domain implied by the question (state, hooks, scenes, utils, components, data, ui).
2. Open the corresponding `src/<domain>/AGENTS.md` for local rules.
3. Provide file pointers and explain why those locations are canonical.

## Output

- Provide a short path list and next files to inspect.
