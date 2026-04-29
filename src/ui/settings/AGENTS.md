# src/ui/settings - Agent Instructions

## Scope

Applies to `src/ui/settings/**`.

## Rules

- Normalize control input values at the UI boundary before invoking callbacks.
- Preserve mute, music, and SFX semantics for `0`; use nullish checks, not truthy checks.
- Keep settings panels stateless where possible and pass side effects through provided callbacks/hooks.

## Gotchas

- Slider/input handlers may deliver strings. Coerce and validate numeric ranges before dispatch.
