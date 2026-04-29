# src/ui/settings — Agent Instructions

## Scope

Applies to `src/ui/settings/**`.

## Local Conventions

- Follow `src/ui/AGENTS.md` for shared UI/i18n/token constraints; this file captures settings-specific behavior.
- Settings controls should normalize input values at the UI boundary before invoking callbacks.

## Domain Gotchas

- Slider/input handlers may deliver string values; coerce and validate numeric ranges before dispatching updates.
- Preserve mute/music/sfx semantics for `0` values (use nullish checks, not truthy checks).
- Keep settings panels stateless where possible; pass side effects through provided callbacks/hooks.
