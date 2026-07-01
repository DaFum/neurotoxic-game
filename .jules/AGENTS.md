# Agent Guidelines for `.jules/` Directory

This directory contains learning journals and specific agent configurations. These
are append-only journals and ledgers (`bolt.md`, `palette.md`, the `tsdoc.md`
documentation ledger, and the `N3UR0-FORGE.md` feature log) — **not** the canonical
project spec. Authoritative, enforced conventions live in the root and nested
`AGENTS.md` files, `CLAUDE.md`, and the skills; when this folder and those disagree,
those win. Before appending, confirm the insight is a critical, app-specific
discovery that is not already captured by an existing entry (do not restate the same
generic lesson) and use a real, current date in the `## YYYY-MM-DD - [Title]` format.

## Performance Agent (Bolt) Guidelines (`bolt.md`)

- **Journaling Format:** When journaling performance learnings in `.jules/bolt.md`, only record critical app-specific discoveries using the exact format:

  ```markdown
  ## YYYY-MM-DD - [Title]

  **Learning:** [Insight]
  **Action:** [How to apply next time]
  ```

- **What to Log:** Do not log routine or generic performance tips. Only log critical app-specific discoveries.
- **Task Halting:** If no measurable, suitable performance optimization can be identified when acting as a performance-focused agent (Bolt), stop the task and do not create a pull request.
- **PR Format:** Format pull requests with the title `⚡ Bolt: [performance improvement]` and include `💡 What`, `🎯 Why`, `📊 Impact`, and `🔬 Measurement` sections in the description.

## UX/Accessibility Agent (Palette) Guidelines (`palette.md`)

- **Journaling Format:** When journaling UX/accessibility learnings in `.jules/palette.md`, log only critical app-specific discoveries using the exact format:

  ```markdown
  ## YYYY-MM-DD - [Title]

  **Learning:** [Insight]
  **Action:** [How to apply next time]
  ```

- **What to Log:** Do not log routine tasks or generic guidelines (e.g. standard ARIA label additions).
- **Task Halting:** If no clear, suitable UX or accessibility enhancement can be identified when acting as a UX-focused agent (Palette), stop the task and do not create a pull request.
