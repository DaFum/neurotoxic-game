# src/components - Agent Instructions

## Scope

Applies to `src/components/**` unless a deeper `AGENTS.md` overrides it.

## UI Rules

- User-facing text must use namespaced i18n keys and keep EN/DE locale JSON in sync.
- Use CSS variables for colors; do not introduce literal color values.
- React 19 refs are normal props. Do not add `React.forwardRef()`.
- Include `t` in callback/effect dependency arrays when used inside that scope.

## State Rules

- Trigger state changes through action creators or provided callbacks; do not reconstruct reducer payloads in components.
- Success toasts for bounded values must display the applied delta after clamping.

## Gotchas

- Minigame components must not import Pixi-only logic into hook layers.
- Overworld, PreGig, PostGig, and Stage routes each have deeper ownership rules; read the nested file before editing those folders.
