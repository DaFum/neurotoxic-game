# tests/ui - Agent Instructions

- Kabelsalat tests must assert timeout-loss and fully wired win paths call `changeScene('GIG')`.
- Minigame completion overlays need fallback-timer and unmount-cleanup coverage.
- Menu redesigns need assertions that legacy actions remain reachable.
- `Tooltip.test.jsx` must keep disabled-child coverage that shows the tooltip without invoking the child element's own hover/focus handlers.
- Use a props-spy pattern (`const capturedProps = []; vi.mock(…, () => ({ Component: props => { capturedProps.push(props); return <div /> } }))`) to assert derived props (e.g. `cityTraits`) passed down to child components without rendering the child.
- Mock `MerchStrategyBlock` in `PreGig` tests to avoid `HQ_ITEMS`/`economy` dependency; provide `onUpdatePrice` and `onRestock` callback props so handler tests can fire them directly. The `economy` mock must include `DEFAULT_MERCH_PRICES` when merch tab tests are present.
