# src/components/clinic - Agent Instructions

## Routing

- Keep clinic actions routed through existing economy/health action creators and callbacks.

## Display

- Display costs and failure reasons from current clamped state, and display success deltas from reducer-applied changes (for example actual stamina/mood restored after clamps), not optimistic requested values.
- Clinic affordability checks must use the same clamped funds/fame and applied-delta pattern as Band HQ/shop flows: compare against current resources, abort with the existing disabled reason/toast when insufficient, and show applied deltas after reducer clamps.

## Copy

- Use i18n keys for treatment names, button labels, and toast text.
