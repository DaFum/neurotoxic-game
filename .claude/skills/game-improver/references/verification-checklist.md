# Verification Checklist

Complete checklist to verify that improvements are production-ready.

## Pre-Submit Verification

### 1. Code Quality (Linting)

**Run**:

```bash
pnpm run lint
```

**Verify**:

- ✅ No ESLint errors (warnings OK if pre-existing)
- ✅ Songs.js not linted (excluded by config)
- ✅ No unused imports
- ✅ No console.log left in code
- ✅ Proper destructuring and naming

### 2. Logic Tests (Node Tests)

**Run**:

```bash
pnpm run test
```

**Verify**:

- ✅ All logic tests pass
- ✅ New tests added for bug fixes / features
- ✅ State mutations tested (money clamping, harmony bounds, etc.)
- ✅ Edge cases covered (0 money, harmony at min/max, invalid inputs)
- ✅ No flaky tests (run 3x, should be stable)

**For single file**:

```bash
pnpm run test -- tests/path/to/file.test.js
```

**For watch mode** (faster iteration):

```bash
pnpm run test -- --watch
```

### 3. UI Tests (Vitest)

**Run**:

```bash
pnpm run test:ui
```

**Verify**:

- ✅ All component tests pass
- ✅ New components tested (render, props, callbacks)
- ✅ No memory leaks (mocks cleaned up in `try/finally`)
- ✅ No stale snapshots
- ✅ No console errors from components

**For single file**:

```bash
pnpm run test:ui -- tests/path/to/file.test.jsx
```

### 4. Build Verification

**Run**:

```bash
pnpm run build
```

**Verify**:

- ✅ No import errors
- ✅ No missing dependencies
- ✅ No bundle size regression (>10% increase = investigate)
- ✅ Output in `dist/` is valid
- ✅ No console warnings during build

### 5. All Tests in Sequence

**Run** (takes 3-5 min):

```bash
pnpm run test:all
```

Or **manually in sequence**:

```bash
pnpm run lint && pnpm run test && pnpm run test:ui && pnpm run build
```

**Verify**: All 4 steps pass.

---

## Code-Level Checks

### State & Reducers

- [ ] New `ActionTypes` added to enum (not scattered)
- [ ] Reducer case handles action correctly
- [ ] Action creators in `actionCreators.js` defined
- [ ] Reducer returns new state (no mutations: `{ ...state }`)
- [ ] Money clamped to `>= 0` via `gameStateUtils.clampMoney()`
- [ ] Harmony clamped to `[1, 100]` via `gameStateUtils.clampHarmony()`
- [ ] Fuel clamped to `[0, 100]`
- [ ] No direct property mutations (`state.money = 100` ❌)

### UI & Styling

- [ ] Colors use CSS vars: `var(--color-toxic-green)` (not hardcoded)
- [ ] Tailwind classes: `bg-void-black`, `text-toxic-green` (not custom)
- [ ] Non-color tokens use arbitrary syntax: `z-(--z-crt)`
- [ ] Responsive design checked (mobile, tablet, desktop)
- [ ] Accessibility: Icon buttons have `aria-label` and `Tooltip`
- [ ] No broken layouts (flex constraints, scrolling)

### Localization

- [ ] All user-facing text uses `t('namespace:key')`
- [ ] Keys follow namespacing: `ui:button.save`, `events:harbinger`
- [ ] Both `en` and `de` translations added
- [ ] Interpolation placeholders match: `{{cost}}`, `{{location}}`
- [ ] No hardcoded strings in JSX (except dev-only console)

### Performance

- [ ] No per-frame allocations in render/update loops
- [ ] Pixi scenes destroyed on unmount: `app.destroy({...})`
- [ ] Event listeners removed in cleanup (`removeEventListener`)
- [ ] Heavy computations memoized (`useMemo`)
- [ ] Callbacks wrapped in `useCallback` (and included in deps)
- [ ] No N² loops or unnecessary re-renders

### Audio

- [ ] Uses `audioEngine.getGigTimeMs()` (single clock)
- [ ] AudioContext state handled (suspended → resumed)
- [ ] No direct Tone.js access
- [ ] Audio nodes cleaned up on unmount
- [ ] Playback respects configured excerpt duration

### Pixi/Graphics

- [ ] Resources destroyed on unmount: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`
- [ ] No circular refs or dangling listeners
- [ ] Textures loaded via `loadTexture()` utility
- [ ] No memory leaks (heap size stable over multiple scenes)

### Testing

- [ ] New behavior has test coverage
- [ ] Edge cases tested (boundary values, invalid inputs)
- [ ] State safety verified (clamping, no negatives)
- [ ] Happy path + error path tested
- [ ] No hardcoded test data that might diverge from production

---

## Common Verification Issues

| Issue                               | Check                              | Fix                                          |
| ----------------------------------- | ---------------------------------- | -------------------------------------------- |
| Test fails: "Unknown action X"      | `ActionTypes` enum updated?        | Add to `ActionTypes` before using in reducer |
| "Money is negative after action"    | Clamping applied?                  | Use `gameStateUtils.clampMoney()` in reducer |
| Linting fails: "unused import X"    | Remove dead code?                  | Delete import, or use it                     |
| Memory leak suspected               | Pixi destroyed? Listeners cleaned? | Check `useEffect` cleanup return             |
| Build fails: "Cannot find module X" | Path correct? File exists?         | Check file path, extension (`.js` vs `.jsx`) |
| UI test flaky                       | Async state? Race condition?       | Wrap in `waitFor()`, avoid `setTimeout`      |
| Color looks wrong                   | CSS var used?                      | Check token name, ensure `--color-` prefix   |

---

## Final Sign-Off

Before pushing, verify:

- [ ] **All tests pass**: `pnpm run test:all` succeeds
- [ ] **No lint warnings**: `pnpm run lint` clean
- [ ] **Commit message**: Conventional Commits format (`feat:`, `fix:`, etc.)
- [ ] **PR/Branch**: Target branch is correct
- [ ] **Documentation**: Comments explain "why", not "what"
- [ ] **Safety**: State never invalid (money negative, harmony out of bounds, etc.)

---

## Debugging Failed Checks

### Linting Fails

**Issue**: ESLint error "Unexpected token"

```
SyntaxError: Unexpected token ) in tests/foo.test.js:42
```

**Fix**:

1. Check syntax at line 42
2. Ensure matching parentheses, braces, semicolons
3. Check JSX syntax if in component file

### Test Fails

**Issue**: Assertion error

```
AssertionError: 450 == 500
  at test (tests/travel.test.js:25)
```

**Fix**:

1. Read assertion message carefully
2. Add console.log before assertion to debug state
3. Check preconditions (initial state setup)
4. Verify action was applied (action creator called?)

### Build Fails

**Issue**: Cannot find module

```
Error: ENOENT: no such file or directory, open 'src/utils/missing.js'
```

**Fix**:

1. Verify file path (check for typos)
2. Verify file exists: `ls src/utils/missing.js`
3. Check import statement: `.js` or `.jsx`?
4. Check relative path depth (`../../` correct?)

### Memory Leak

**Issue**: Heap size grows continuously

```
Start: 500MB, After 10 gigs: 1500MB
```

**Fix**:

1. Check Pixi cleanup in `useEffect` return
2. Verify audio nodes destroyed on unmount
3. Use DevTools Memory snapshots to identify retained objects
4. Look for circular references, dangling listeners

---

## Full Verification Command

**One command to check everything**:

```bash
pnpm run lint && \
pnpm run test && \
pnpm run test:ui && \
pnpm run build && \
echo "✅ All checks passed!"
```

**Expected output**:

```
[lint] ✓ 0 errors, 0 warnings
[test] ✓ 678 tests pass
[test:ui] ✓ 728 tests pass
[build] ✓ dist/ built
✅ All checks passed!
```
