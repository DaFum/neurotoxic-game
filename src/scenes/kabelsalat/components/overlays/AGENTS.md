# src/scenes/kabelsalat/components/overlays - Agent Instructions

## Continuation

- Overlay actions must preserve both automatic and manual continuation paths.
- Manual continue buttons must remain rendered when the overlay is visible; loss overlays call `onAdvance(false)` and powered overlays call `onAdvance(true)`.

## Events / Copy

- If adding Escape, backdrop, or click handlers, handle the overlay action first and stop/prevent the event as needed so scene-level handlers do not also run.
- Keep overlay copy in i18n keys.

## Tests

- Manual continue tests should assert the final scene transition, not just overlay text.
