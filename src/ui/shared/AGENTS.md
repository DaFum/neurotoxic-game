# src/ui/shared — Agent Instructions

## Scope

Applies to `src/ui/shared/**`.

## Local Conventions

- Follow `src/ui/AGENTS.md` for general UI, i18n, and token rules; this file only adds shared-primitive specifics.
- Keep shared primitives input-tolerant: treat incoming props/events as boundary data and narrow before use.
- Prefer event/property composition over replacing consumer handlers (forward `onFocus`, `onBlur`, pointer handlers when wrapping children).

## Domain Gotchas

- Tooltip-like wrappers must preserve disabled-element accessibility behavior (`aria-describedby`, keyboard focusability) when fallback wrappers are used.
- When reading optional child props (`aria-*`, style/className), guard unknown objects and use own-property checks to avoid prototype-chain surprises.
- Shared UI wrappers should avoid introducing app-specific business logic; keep them reusable and presentation-oriented.
