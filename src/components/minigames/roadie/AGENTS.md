# src/components/minigames/roadie - Agent Instructions

## Scope

Applies to `src/components/minigames/roadie/**`.

## Rules

- Keep Roadie hook logic free of Pixi imports and imperative renderer state.
- Preserve travel completion handoff through the shared minigame/arrival flow.

## Gotchas

- Timer cleanup must run on unmount and early completion so scenes cannot auto-advance after teardown.
