---
name: one-command-doctor
description: Run a quick healthcheck (node version, install, lint, test, build) and summarize likely fixes. Use when diagnosing build, audio, or runtime issues.
---

# One-Command Doctor

## Workflow

1. Capture Node and npm versions.
2. Run install, lint, test, and build checks.
3. Summarize failures and propose fixes.

## Command

- Prefer the bundled script: `./.agents/skills/one-command-doctor/scripts/doctor.sh`

## Output

- Provide a concise diagnosis and next steps.

## Related Skills

- `one-command-quality-gate` — if doctor passes, run the full quality gate
- `debug-ux-upgrader` — for adding deeper diagnostic tooling after initial diagnosis
