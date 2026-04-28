# src/components/postGig — Agent Instructions

## Scope

Applies to `src/components/postGig/**`.

## Domain Gotchas

- Side-effect deltas (`moneyChange`, `staminaChange`, `moodChange`, etc.) are optional numeric values where `0` is valid. Render guards must use `value != null`, not truthy checks.
- Negotiated deals are untrusted at render time. Guard `offer.upfront` and `offer.duration` as required numbers before using negotiated payloads, otherwise fall back to the original deal object.

## Recent Findings (2026-04)

- When a summary row renders on nullish checks, nested value spans must use the same nullish pattern; mixed guards produce labels with missing values.
