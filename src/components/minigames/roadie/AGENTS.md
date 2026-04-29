# src/components/minigames/roadie - Agent Instructions

Agents for `src/components/minigames/roadie/**` guide Roadie minigame scenarios, hook behavior, and travel-completion handoff. Call them when working on gameplay or test logic in this folder; they are not for production-sensitive operations, privileged actions, or broad renderer rewrites. Consult this file before changing Roadie scenario flow, timers, or arrival integration.

## Scope

Applies to `src/components/minigames/roadie/**`.

## Rules

- Keep Roadie hook logic free of Pixi imports and imperative renderer state.
- Preserve travel completion handoff through the shared minigame/arrival flow.

## Gotchas

- Timer cleanup must run on unmount and early completion so scenes cannot auto-advance after teardown.
