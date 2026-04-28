---
name: typescript-senior-developer
description: >
  Strict TypeScript guidance for the NEUROTOXIC React/Three.js game codebase. Use when writing, reviewing, or migrating TypeScript; fixing tsc errors; and handling project-specific patterns like discriminated unions, action creators, lookup maps, and React 19 refs. Also use when touching src/types, src/context/action*, gamestateutils clamps, or @ts-expect-error suppressions.
---

# TypeScript Senior Developer

Apply strict, idiomatic TypeScript guidance for the NEUROTOXIC codebase. Favor small, safe changes that improve compiler guarantees without hiding runtime risk.

## Start Here

1. Determine the mode:
   - **Writing or editing code**: answer the immediate implementation need, then apply the project invariants below.
   - **Reviewing code or a diff**: use the review workflow and checklist before giving recommendations.
   - **Debugging TypeScript errors**: trace the error to the source type, not just the failing call site.
2. If file access is available, inspect the relevant files before giving repo-specific advice. Do not rely on names from memory when exact local types, imports, or reducers can be read.
3. Prefer project-local patterns over generic TypeScript advice. When a pattern is unclear, look for nearby examples in `src/types`, `src/context`, reducers, utilities, and data maps.
4. After code changes, run the closest available type check. Prefer the repo's documented command; otherwise use `npx tsc --noEmit`. Mention any check you could not run.

## Project Invariants

- Keep `strict`, `strictNullChecks`, `noImplicitAny`, `checkJs`, `isolatedModules`, and bundler module resolution clean.
- Add no new `any`, `as any`, `@ts-nocheck`, or `@ts-ignore`.
- Treat the `@ts-expect-error` budget in `src/` as zero. If one is truly unavoidable, scope it to one line and include a reason.
- Use `unknown` for external or untrusted data, then narrow once at the boundary.
- Use `Object.hasOwn()` for untrusted property checks from JSON, localStorage, events, or generic records. Avoid `in` and direct `hasOwnProperty` in those paths.
- Encode constraints at the action creator, parser, guard, or clamp boundary so reducers and consumers do not re-check the same invariant.
- Put shared contracts in `src/types/*.d.ts` and re-export through `src/types/index.ts` when that is the existing local pattern.
- Keep action type strings in `as const` objects. Do not introduce TypeScript `enum`.
- Return exact action variants from action creators with `Extract<GameAction, { type: typeof ActionTypes.X }>`.
- Keep reducer switches exhaustive with an `assertNever` default when the local reducer pattern supports it.
- Use `import type` for type-only imports. For mixed imports, use `import { value, type TypeName } from './module'`.
- Use React 19 ref-as-prop style for new components. Do not add `forwardRef` unless existing local compatibility requires it.
- Include `t` in React hook dependency arrays when a callback or effect calls `t('key')`.
- For lookup maps such as `SONGS_BY_ID`, keep map values typed, populate once, and narrow `.get()` results before use. Avoid non-null assertions.

## Writing Workflow

1. Identify the boundary: exported function, component props, reducer action, persistence parser, API response, event payload, map lookup, or config object.
2. Strengthen the boundary first. Let interior inference do as much work as possible.
3. Pick the narrowest useful type:
   - `type` for unions, intersections, tuples, mapped/conditional types, and aliases.
   - `interface` for extendable object shapes or declaration merging.
   - `unknown` for data whose shape is not yet proven.
   - `Record<K, V>` only when `K` is a real key union, not a disguised string bag.
4. Prefer `satisfies` for config objects keyed by unions because it validates coverage while preserving literal inference.
5. Avoid casts. If a cast remains necessary, narrow first and explain why the compiler cannot express the proof.
6. Keep runtime behavior stable. Type improvements should not silently change reducer logic, persistence format, or game balance clamps.
7. Validate with typecheck and relevant tests when available.

## Review Workflow

1. Classify findings by severity: **critical**, **high**, **medium**, or **low**.
2. Review for type-safety regressions before style. Prioritize `any`, unsafe assertions, missing guards, widened discriminants, unchecked map lookups, and reducer exhaustiveness.
3. For each finding, name the risk and give a concrete replacement pattern.
4. Call out missing validation commands or checks separately from code findings.
5. Do not request broad rewrites when a smaller type boundary fix solves the issue.

Use `references/review-checklist.md` for the full checklist.

## Debugging `tsc` Errors

1. Read the full diagnostic and the originating type definition.
2. Decide whether the failing expression is wrong, the source type is too loose/tight, or a boundary guard is missing.
3. Fix the source contract when multiple consumers are affected.
4. Fix the call site only when the local call is truly exceptional.
5. Avoid silencing with assertions unless the runtime invariant is already proven and cannot be modeled cleanly.

Use `references/migration-playbook.md` for JS-to-TS, checked JS, declaration files, and tsconfig/isolatedModules issues.

## Reference Loading

Load extra references only when relevant:

- `references/core-patterns.md`: examples for `type` vs `interface`, `as const`, discriminated unions, `Extract`, guards, `satisfies`, `import type`, maps, React 19, and utility types.
- `references/review-checklist.md`: complete review checklist and response shape.
- `references/migration-playbook.md`: JS-to-TS workflow, checked JS tactics, suppressions, declaration files, and typecheck triage.

For deeper dives, load from `references/`:

| Topic                                                        | File                                |
| ------------------------------------------------------------ | ----------------------------------- |
| Conditional types, `infer`, template literals, branded types | `references/advanced-types.md`      |
| Module augmentation, declaration merging, `.d.ts` authoring  | `references/module-augmentation.md` |
| tsconfig options deep-dive, `isolatedModules` edge cases     | `references/tsconfig.md`            |

