AGENTS.md

Agent Contract

This file is the operating contract for AI coding agents working in this repository.

Use it to reduce failed builds, rejected PRs, unsafe edits, unnecessary exploration, and repeated reviewer corrections.

Keep this file short, specific, and current. Prefer repo-specific facts over generic advice.


---

1. Project Snapshot

Field	Value

Project	[PROJECT_NAME]
Product type	[SaaS / app / API / game / internal tool / library]
Primary users	[WHO USES THIS]
Critical flow	[WHAT MUST NOT BREAK]
Language	[TypeScript / Python / Go / etc.]
Framework	[Next.js / React / Django / Rails / FastAPI / etc.]
Package manager	[pnpm / npm / yarn / uv / pip / poetry / cargo]
Runtime	[Node / Python / etc. version]
Database	[Postgres / SQLite / MongoDB / none]
Auth	[Clerk / Auth.js / custom / Firebase / none]
Deployment	[Vercel / AWS / Render / Docker / etc.]
Test framework	[Vitest / Jest / Playwright / Pytest / etc.]



---

2. Prime Directive

Agents must make the smallest safe change that satisfies the request.

Before editing:

1. Read the relevant files.


2. Identify the source of truth.


3. Find existing patterns.


4. Avoid unrelated changes.


5. Plan verification before coding.



After editing:

1. Run the relevant checks.


2. Report what changed.


3. Report what passed, failed, or was not run.


4. Surface remaining risk.



Do not claim success without verification.


---

3. Source-of-Truth Map

Check these files before changing related behavior.

Area	Source of Truth	Rule

App entry / providers	[path]	Do not change global wiring without checking startup behavior.
Routing	[path]	Follow existing route conventions.
UI components	[path]	Reuse existing primitives before creating new ones.
Styling / design system	[path]	Do not introduce a second styling system.
State management	[path]	Do not create duplicate state sources.
API contracts	[path]	Preserve request/response compatibility unless asked.
Validation	[path]	Use existing schemas and validation helpers.
Database schema	[path]	Update migrations, generated types, and tests together.
Auth / permissions	[path]	Verify roles, sessions, and access checks.
Billing / plans	[path]	Treat as high-risk. Verify plan access and webhooks.
Environment config	[path]	Update examples when variables change.
Tests	[path]	Match existing test style and helpers.
CI / deployment	[path]	Do not change unless required by the task.


If the requested change conflicts with a source-of-truth file, stop and explain the conflict.


---

4. Repo Layout

Use this map before searching broadly.

[repo-root]/
  [path]/        - [purpose]
  [path]/        - [purpose]
  [path]/        - [purpose]
  [path]/        - [purpose]
  [path]/        - [purpose]

Key files:

[path] — [why it matters]

[path] — [why it matters]

[path] — [why it matters]


Generated files:

[path] — do not edit manually unless explicitly instructed.



---

5. Commands

Use these exact commands.

# Install
[install command]

# Typecheck
[typecheck command]

# Lint
[lint command]

# Unit tests
[test command]

# Build
[build command]

# End-to-end tests, if relevant
[e2e command]

Command rules:

If dependencies changed, run install before other checks.

If types changed, run typecheck.

If behavior changed, run tests.

If UI changed, run lint and the relevant browser or e2e check.

If build, config, imports, or routing changed, run build.

If a command fails, report the failure and whether it appears related to the change.



---

6. Verification Matrix

Change Type	Required Verification

Copy-only change	[lint or targeted check]
UI behavior change	[component/unit test + manual or e2e check]
API change	[integration/contract test]
Database change	[migration check + generated types + integration test]
Auth / permission change	[role/session regression check]
Billing change	[webhook/checkout/plan-access check]
State persistence change	[old-state migration/fallback test]
Dependency change	[install + build + relevant tests]
Refactor	[existing tests proving behavior unchanged]
Documentation-only change	[verify commands, paths, and links are accurate]



---

7. Coding Rules

Always follow existing conventions.

Do:

Prefer boring, readable code.

Keep changes localized.

Reuse existing utilities, components, schemas, and services.

Preserve public APIs unless explicitly told otherwise.

Add regression coverage for bug fixes when practical.

Keep loading, empty, error, disabled, and success states intact.

Preserve accessibility behavior.

Update docs when commands, setup, APIs, or env vars change.


Do not:

Do not perform drive-by refactors.

Do not rename unrelated symbols.

Do not move files only for preference.

Do not add dependencies for convenience.

Do not duplicate validation, API clients, stores, or business logic.

Do not bypass auth, permissions, validation, billing, or security checks.

Do not silence lint/type errors without explaining why.

Do not delete failing tests to make checks pass.

Do not commit secrets or real customer data.

Do not edit generated files unless instructed.



---

8. High-Risk Areas

Changes here require extra caution.

Area	Risk	Required Check

[path]	[auth/session/customer data/etc.]	[specific check]
[path]	[billing/payment/plans/etc.]	[specific check]
[path]	[persisted state/migrations/etc.]	[specific check]
[path]	[public API/external client/etc.]	[specific check]
[path]	[critical UI flow/etc.]	[specific check]


High-risk categories include auth, permissions, payments, data deletion, migrations, file uploads, email delivery, background jobs, webhooks, public APIs, analytics, accessibility, internationalization, and customer data exports.


---

9. Known Gotchas

Document only non-obvious repo facts.

Gotcha 1: [Name]

Where: [path]

Risk: [what can break]

Rule: [what agent must always do]

Check: [test/command/manual check]


Gotcha 2: [Name]

Where: [path]

Risk: [what can break]

Rule: [what agent must always do]

Check: [test/command/manual check]


Gotcha 3: [Name]

Where: [path]

Risk: [what can break]

Rule: [what agent must always do]

Check: [test/command/manual check]


Examples of useful gotchas:

“This API response is consumed by mobile clients; keep fields backward-compatible.”

“This state shape is persisted; add fallback handling when changing it.”

“This webhook is retried by the provider; handlers must be idempotent.”

“This component must remain keyboard accessible.”

“This file looks unused but is loaded dynamically.”

“This feature must work with the feature flag both on and off.”



---

10. Environment and Secrets

Environment sources:

[.env.example path]

[deployment config path]

[CI secrets location]


Rules:

Never commit real secrets.

Never print secrets in logs.

Update .env.example when adding required variables.

Mark variables as server-only or client-exposed.

Do not expose server-only values to browser code.

Validate missing required variables with clear errors.


When env vars change, report:

Variable name.

Required or optional.

Server-only or client-exposed.

Files updated.

Deployment follow-up.



---

11. Dependency Policy

Before adding a dependency, check:

1. Can existing code solve this?


2. Can the framework or standard library solve this?


3. Is the dependency maintained?


4. Does it add security, licensing, bundle-size, or operational risk?


5. Is the benefit worth the cost?



If added, report the package, reason, alternative considered, and verification run.


---

12. Task Protocols

Bug Fix

1. Identify likely root cause.


2. Find smallest responsible code path.


3. Fix the cause, not only the symptom.


4. Add or update regression coverage when practical.


5. Verify the broken flow.


6. Add a gotcha if this was a repeatable mistake.



Feature

1. Match existing product patterns.


2. Reuse existing components and utilities.


3. Add loading, empty, error, disabled, and success states where relevant.


4. Update types, tests, and docs.


5. Keep scope limited to the request.


6. Verify the main user flow.



Refactor

1. Keep behavior unchanged unless explicitly requested.


2. Confirm tests exist or add coverage first.


3. Keep the refactor small.


4. Avoid mixing refactor work with feature work.


5. Verify behavior did not change.




---

13. Final Response Format

Agents must respond with this structure.

## Summary

- [What changed]
- [Why it changed]

## Files Changed

- `[path]` — [brief explanation]
- `[path]` — [brief explanation]

## Verification

- `[command]` — [passed / failed / not run]
- `[command]` — [passed / failed / not run]

## Notes / Risks

- [Remaining concern]
- [Manual check needed]

For bug fixes, also include:

## Root Cause

- [Cause]

## Regression Coverage

- [Test added/updated, or why not practical]

For features, also include:

## User-Visible Behavior

- [What the user can now do]

For dependency changes, also include:

## Dependency Change

- Package: `[name]`
- Reason: `[why]`
- Alternative considered: `[alternative]`

For environment changes, also include:

## Environment Changes

- `[VARIABLE]` — [required/optional], [server/client], [purpose]


---

14. Tool Compatibility Notes

Use this file as the shared agent instruction source.

Optional compatibility files:

# CLAUDE.md
@AGENTS.md

## Claude Code
[Claude-specific notes only if needed]

# .github/copilot-instructions.md
Follow AGENTS.md for repository-wide agent instructions.

For monorepos, add nested AGENTS.md files inside packages only when local rules are genuinely different.


---

15. Maintenance Rule

Update this file when:

An agent repeats a mistake.

A reviewer leaves the same correction twice.

A bug reveals a hidden rule.

A source-of-truth file changes.

A command changes.

A new high-risk area appears.


After each bug fix, ask:

What instruction would have prevented this bug?

Add the answer to Source-of-Truth Map, High-Risk Areas, Known Gotchas, Commands, or Verification Matrix.

Remove outdated or conflicting instructions immediately.


---

16. Readiness Score

Score before relying on this file.

Category	Score 0-2

Project snapshot complete	[0 / 1 / 2]
Source-of-truth files listed	[0 / 1 / 2]
Commands are executable	[0 / 1 / 2]
Verification matrix is specific	[0 / 1 / 2]
High-risk areas documented	[0 / 1 / 2]
Gotchas are concrete	[0 / 1 / 2]
Env/security rules clear	[0 / 1 / 2]
Final response format defined	[0 / 1 / 2]
Tool compatibility handled	[0 / 1 / 2]
Maintenance rule included	[0 / 1 / 2]


Score:

0-8: Too generic.

9-14: Usable but incomplete.

15-18: Strong.

19-20: Team-ready.
