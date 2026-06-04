---
name: tsdoc-writer
description: Use when writing, revising, or reviewing TSDoc comments for TypeScript APIs, IntelliSense hover text, exported functions, classes, interfaces, type aliases, generic helpers, parameter docs, examples, deprecation notices, defaults, thrown errors, release tags, TypeDoc or API Extractor output, or documentation lint feedback.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: '1.0.0'
  author: 'neurotoxic-project'
  category: 'documentation'
  keywords:
    [
      'documentation',
      'tsdoc',
      'typescript',
      'intellisense',
      'typedoc',
      'api-extractor',
      'eslint-plugin-tsdoc'
    ]
  maturity: 'stable'
license: 'Proprietary. See LICENSE.txt for terms'
---

# TSDoc Writer

## Overview

Write TSDoc for the developer reading an IDE hover, not for the compiler. TypeScript owns types; TSDoc owns intent, constraints, edge cases, side effects, defaults, and usage.

## When to Use

- Adding or reviewing docs on exported TypeScript symbols and public class members.
- Improving noisy comments that repeat the signature instead of explaining behavior.
- Documenting APIs where constraints, lifecycle, failure modes, defaults, or examples affect correct use.
- Writing property-level docs for interfaces or object-literal config.

Skip TSDoc for obvious private implementation details. Use a normal code comment when the note explains an internal trick rather than the API contract.

## Writing Workflow

1. Identify the consumer: caller, object-literal author, subclasser, maintainer, or migration reader.
2. Write one self-contained summary sentence. It should be useful by itself in IntelliSense.
3. Add tags only when they add contract information beyond the TypeScript type.
4. Prefer constraints and edge cases: accepted formats, empty inputs, ordering, mutability, persistence, side effects, default behavior, and failure modes.
5. Delete type restatements. If removing a sentence changes no developer decision, remove it.
6. Keep `@param` blocks in the same order as the function signature.
7. Use CommonMark intentionally: backticks for symbols and values, bullets inside `@remarks`, and fenced `ts` blocks inside `@example`.

## Tag Guide

| Tag              | Use it for                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@remarks`       | Context, architectural reasoning, lifecycle notes, side effects, or caveats too long for the summary.                                                                     |
| `@typeParam T`   | The role or constraint of a generic type parameter. Do not write "the type of T".                                                                                         |
| `@param name`    | Semantic meaning, constraints, formats, units, ownership, or special values.                                                                                              |
| `@returns`       | What the value represents, including meaningful empty, false, null, or undefined results.                                                                                 |
| `@throws`        | Each catchable error condition the caller should handle. Omit it when nothing intentional is thrown.                                                                      |
| `@example`       | A copy-pasteable consumer example, preferably with real names and realistic values. Use multiple `@example` blocks when distinct use cases would otherwise blur together. |
| `@deprecated`    | Why the API is obsolete and what to use instead, often with `{@link Replacement}`.                                                                                        |
| `@see`           | Related references such as RFCs, external docs, tracking tickets, or design notes.                                                                                        |
| `{@link Symbol}` | Inline references to related symbols or URLs. Do not use `@link` as a block tag.                                                                                          |
| `@defaultValue`  | Default values for properties, accessors, or fields. Prefer this TSDoc tag over JSDoc-only forms such as `@default`.                                                      |

TSDoc `@param` and `@typeParam` blocks use `name - description`. Do not include JSDoc type syntax such as `@param {string} userId`.

## Release Tags

Use release tags only when generated API docs or declaration rollups consume them:

| Tag             | Use it for                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `@public`       | Stable APIs intended for external consumers.                                                        |
| `@beta`         | Usable APIs that may still change before a stable release.                                          |
| `@alpha`        | Experimental APIs whose contract is actively unsettled.                                             |
| `@experimental` | Same stability meaning as `@beta`; use it only when local tooling or docs already prefer that name. |
| `@internal`     | Repo-only APIs that should be hidden or stripped from generated public docs.                        |

Release tags complement TypeScript access modifiers; they do not replace `private` or `protected`. In app code without a published API surface, omit release tags unless local tooling requires them. Do not use both `@beta` and `@experimental` on the same API.

## Comment Shape

Use this order when each section is relevant. Omit empty sections.

````ts
/**
 * Summary sentence.
 *
 * @remarks
 * Deeper context or edge cases.
 *
 * @typeParam T - What this generic represents in the API contract.
 * @param value - Constraint, format, unit, or semantic role.
 * @returns What the result means to the caller.
 *
 * @example
 * ```ts
 * const result = useTheApi(value);
 * ```
 */
````

## Governance Notes

Mention governance tools only when the task is about linting, generated docs, or library publishing:

- `eslint-plugin-tsdoc` checks syntax such as malformed tags, missing hyphens, and invalid Markdown.
- TypeDoc turns TSDoc into static HTML docs; review its output when validating `{@link ...}` targets, `@see` sections, and Markdown rendering.
- API Extractor consumes TSDoc for API reports, declaration rollups, and release-tag policy.
- Do not propose installing or changing dependencies unless the user asks for tooling changes.

## Reference Loading

Load extra references only when useful:

| Need                                                                       | Reference                                                                  |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Fast tag lookup, release tags, linking syntax, and the no-JSDoc-types rule | [references/tsdoc-reference-guide.md](references/tsdoc-reference-guide.md) |
| A complete model comment to adapt for a function                           | [references/perfect-tsdoc-example.md](references/perfect-tsdoc-example.md) |

## Example

Weak TSDoc repeats the signature:

```ts
/**
 * Fetches users.
 *
 * @param limit - The limit number.
 * @returns A promise of users.
 */
export async function fetchUsers(limit: number): Promise<User[]>;
```

Useful TSDoc explains the contract:

```ts
/**
 * Fetches the next page of profiles visible to the current session.
 *
 * @remarks
 * This reads from the API cache first. Do not use it for real-time moderation
 * decisions where revoked accounts must disappear immediately.
 *
 * @param limit - The maximum profiles to return. Must be between `1` and `100`.
 * @returns Profiles for the requested page. An empty array means there are no more profiles.
 *
 * @throws {@link RateLimitError}
 * Thrown when the caller exceeds the profile API request budget.
 *
 * @see https://tsdoc.org/
 */
export async function fetchUsers(limit: number): Promise<User[]>;
```

## Review Checklist

- The first sentence stands alone in a hover popup.
- No tag repeats a TypeScript type that the signature already shows.
- Every documented constraint is actionable for a caller.
- Defaults use `@defaultValue` and property docs live beside the property.
- `@deprecated` names a replacement or migration path.
- Release tags are present only when publishing or API-report tooling needs them.
- Examples compile in spirit: imports may be omitted, but APIs and values are realistic.
- Edge cases are explicit when they affect behavior.

## Common Mistakes

| Mistake                                 | Fix                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `@param count - The count number.`      | Say what count controls, its unit, or valid range.                                   |
| `@returns Promise resolving to Result.` | Say what completion means and what failures remain possible.                         |
| Long summary paragraph                  | Move detail to `@remarks`; keep the first sentence short.                            |
| Documenting implementation steps        | Document caller-visible behavior unless the internal detail is part of the contract. |
| Adding `@throws` for impossible errors  | Omit speculative tags. Only document errors consumers should catch.                  |
