# TSDoc Reference Guide

Use this as the quick lookup when writing or reviewing TypeScript documentation comments. TSDoc is not JSDoc: never write standard JSDoc type annotations in TypeScript files. The TypeScript compiler owns type structure; TSDoc explains intent, behavior, and context.

## Core Tags

| Tag                                 | Use                                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@param <name> - <description>`     | Documents a function, method, or class parameter. Explain meaning, constraints, units, or accepted formats. Do not include type information such as `{string}`. |
| `@returns <description>`            | Describes what the return value represents. Omit it when the function returns `void` and there are no side effects worth explaining.                            |
| `@typeParam <name> - <description>` | Documents a generic type parameter such as `T`, focusing on its role in the contract.                                                                           |
| `@remarks`                          | Provides detailed context, edge cases, architectural notes, algorithms, or caveats without bloating the summary tooltip.                                        |
| `@example`                          | Provides a realistic usage example. Wrap code in a fenced Markdown block such as ` ```ts `.                                                                     |
| `@throws {@link ErrorType}`         | Documents an intentional exception the caller may need to catch, followed by the condition that causes it.                                                      |

## Modifiers and Release Tags

| Tag             | Purpose                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@internal`     | Marks APIs intended for internal package use only. Tools such as API Extractor can strip these from public docs.                                                              |
| `@alpha`        | Indicates a rapidly changing API whose contract is not stable.                                                                                                                |
| `@beta`         | Indicates an API that is mostly stable but not final.                                                                                                                         |
| `@experimental` | Indicates an API under testing and subject to breaking changes outside normal semantic versioning. Treat it as equivalent to `@beta` unless local tooling distinguishes them. |
| `@deprecated`   | Marks an API as obsolete. Always include migration advice or a replacement link in the text.                                                                                  |

## Linking and References

Use inline `{@link Target}` for clickable references to classes, functions, interfaces, or URLs.

```ts
/**
 * @deprecated Use {@link fetchUserV2} instead.
 */
```

Use `@see` for related resources that should appear in a "See also" section. Wrap links explicitly with `{@link ...}` when a documentation generator needs clickable output.

## Crucial Rule

Do not duplicate TypeScript types in doc comments:

```ts
// Bad: JSDoc type syntax inside TypeScript.
/**
 * @param {string} userId - The user id.
 */

// Good: TSDoc lets the TypeScript signature provide the type.
/**
 * @param userId - The UUID v4 identifier for the account.
 */
```
