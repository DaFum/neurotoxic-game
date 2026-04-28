# TypeScript Review Checklist

Use this checklist when reviewing a TypeScript diff or proposed change. Report the highest-risk findings first.

## Response Shape

Group findings like this:

1. **Blocking**: likely runtime bugs, unsafe type holes, failing typecheck, missing reducer cases, unchecked external data, or new `any` in core paths.
2. **Important**: maintainability or correctness risks that should be fixed before merging, but may not break immediately.
3. **Nit**: style or local consistency improvements.
4. **Checks**: typecheck/tests run, failed, or not run.

For each finding, include:

- the risky pattern
- why it matters in this codebase
- a concrete safer replacement

## Checklist

- [ ] No new `any`: check `as any`, `: any`, `any[]`, `Record<string, any>`, and implicit-any callback params.
- [ ] No `@ts-nocheck` or `@ts-ignore`.
- [ ] Any `@ts-expect-error` is scoped to one line, includes a reason, and is truly temporary.
- [ ] External data is represented as `unknown` and narrowed at the boundary.
- [ ] Boundary checks use `Object.hasOwn()` for untrusted object keys.
- [ ] Sanitizers reject or ignore `__proto__`, `constructor`, and `prototype` when arbitrary object keys are accepted.
- [ ] Shared types live in `src/types/` instead of being duplicated across modules.
- [ ] Type-only imports use `import type`; mixed imports use the inline `type` modifier.
- [ ] Config objects keyed by unions use `as const satisfies Record<K, V>` where literal inference matters.
- [ ] Enum-like constants use `as const` objects, not TypeScript `enum`.
- [ ] Action creators return `Extract<GameAction, { type: typeof ActionTypes.X }>`.
- [ ] Reducer switches remain exhaustive, preferably with `assertNever`.
- [ ] Clamps happen in action creators or boundary helpers, not duplicated in reducers and consumers.
- [ ] Map `.get()` results are narrowed before property access; no new non-null assertions for lookups.
- [ ] Optional chaining is not used to hide an incorrectly optional source type.
- [ ] Generics are constrained narrowly and are not decorative.
- [ ] Function-typed values have explicit signatures, not `Function`.
- [ ] Index signatures are not broad escape hatches; prefer finite key unions and `Record<K, V>`.
- [ ] React props and event handlers are typed at the component boundary.
- [ ] New React 19 refs use ref-as-prop rather than `forwardRef`, unless compatibility with an existing pattern requires otherwise.
- [ ] Hooks that call `t('key')` include `t` in dependency arrays.
- [ ] Changes keep runtime behavior stable unless the user explicitly asked for behavior changes.
- [ ] The closest available typecheck and relevant tests were run or the limitation is stated.

## Common Findings and Fixes

| Finding | Risk | Safer replacement |
| --- | --- | --- |
| `JSON.parse(raw) as GameState` | accepts invalid saves and crashes later | parse as `unknown`, validate with `isGameState` |
| `as any` in action payloads | breaks discriminated union safety | fix `GameAction` or return `Extract<...>` |
| missing `as const` on `ActionTypes` | action type widens to `string` | add `as const` and derive value union |
| `SONGS_BY_ID.get(id)!` | missing data becomes runtime crash | check `if (!song) return` or handle fallback |
| `Record<string, unknown>` for finite configs | missing scene/config keys compile | use `Record<SceneName, Config>` with `satisfies` |
| `in` for parsed JSON | prototype chain can pass check | use `Object.hasOwn(value, key)` |
| `forwardRef` in new component | conflicts with React 19 convention | accept `ref?: React.Ref<T>` as a prop |
