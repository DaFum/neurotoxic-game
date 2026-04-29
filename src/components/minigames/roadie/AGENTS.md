# src/components/minigames/roadie — Agent Instructions

## Scope

Applies to `src/components/minigames/roadie/**`.

## Domain Gotchas

- Completion overlays must preserve both manual continue and fallback timer paths to avoid stranding users after game end.
- Roadie component props should preserve strict callback signatures from minigame hooks; do not widen completion handlers to untyped payloads.

## Recent Findings (2026-04)

- StrictMode replay can double-run timers; keep one-shot guards and cleanup behavior aligned with shared minigame hook contracts.
