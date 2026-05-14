# tests/ui - Agent Instructions

## Scope

Applies to `tests/ui/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Use Vitest and React Testing Library patterns consistent with neighboring UI tests.
- Validate rendered behavior and wiring, not reducer internals already covered in node tests.
- Keep mock props aligned with shared type contracts and prop optionality.
- Use typed helper builders for repeated render setups.

## Gotchas

- If shared prop optionality changes, add fallback behavior coverage for missing props.
- Menu redesigns need assertions that legacy actions remain reachable.
- Kabelsalat tests must assert timeout-loss and fully wired win paths call `changeScene('GIG')`.
- Minigame completion overlays need fallback-timer and unmount-cleanup coverage.
- Use a props-spy pattern (`const capturedProps = []; vi.mock(…, () => ({ Component: props => { capturedProps.push(props); return <div /> } }))`) to assert derived props (e.g. `cityTraits`) passed down to child components without rendering the child itself.
- Mock `MerchStrategyBlock` in `PreGig` tests to avoid `HQ_ITEMS`/`economyEngine` dependency; provide `onUpdatePrice` and `onRestock` callback props in the mock so handler tests can fire them directly. The `economyEngine` mock must include `DEFAULT_MERCH_PRICES` when merch tab tests are present.
