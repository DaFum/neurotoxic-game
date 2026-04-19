# src/components/minigames — Agent Instructions

## Scope

Applies to `src/components/minigames/**`.

## Minigame Component Responsibilities

- Keep rendering and input wiring in components; gameplay state transitions belong to hooks/context reducers.
- Maintain accessibility and keyboard interactions for completion/continue flows.

## TypeScript Notes

- Keep component prop interfaces synchronized with runtime validators (`propTypes`) when both exist.
- Use narrow prop contracts for controller/logic dependencies; avoid `any` passthrough props.
- Preserve optionality semantics for controller factories and completion render callbacks.

## Gotchas

- Do not import PIXI into logic-only hooks; scene/frame components should consume prepared logic objects.
- Completion overlays should use provided completion state instead of recomputing reducer data.
