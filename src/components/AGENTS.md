# src/components/ — Gotchas

- `GigHUD` requires `stats.accuracy` as a numeric prop (`PropTypes.number.isRequired`). The "LOW ACC" warning fires at `accuracy < 70`.
- `MapNode.jsx` hover tooltips are type-aware — performance nodes (`GIG`, `FESTIVAL`, `FINALE`) must display venue capacity, pay, and difficulty.
- Never recreate Pixi app/controller objects on every render. Frame-loop logic belongs in controller/manager runtime methods, not React render paths.
