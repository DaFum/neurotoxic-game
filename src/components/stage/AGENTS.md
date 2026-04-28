# src/components/stage — Agent Instructions

## Scope

Applies to `src/components/stage/**`.

## Domain Gotchas

- Pixi application teardown must clear resize plugin references even when `resizeTo` comes from the prototype chain; check teardown targets with an inherited-property-safe guard.
- Keep teardown resilient to partial destruction: cancel resize listeners first, then destroy app, then fallback destroy paths.

## Recent Findings (2026-04)

- Prototype-provided Pixi fields can survive teardown if cleanup only checks own-properties; this causes latent resize hooks across scene transitions.
