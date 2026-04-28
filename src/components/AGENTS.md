# src/components — Agent Instructions

## Scope

Applies to `src/components/**`.

## UI Rules

- Use design tokens/CSS variables for styling; do not hardcode theme colors.
- Keep Tailwind usage v4-compatible.
- Keep text translatable via i18n keys/components.

## React + TypeScript Rules

- React 19: pass `ref` as a standard prop (`ref?: React.Ref<HTMLInputElement>`). Do not introduce `React.forwardRef()` — it is deprecated in this codebase.
- Keep components presentational where possible; push game-state mutations into hooks/context action creators.
- Type props explicitly at the component boundary. For DOM-wrapping components, extend the underlying element's props: `interface InputProps extends React.ComponentProps<'input'> { … }`.
- Event handlers use the discriminated React event types (`React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>`) — never `any`.
- Never typecast with `as any`; prefer `unknown` + a type guard if the prop source is genuinely untyped.

## Change Rules

- Separate behavior refactors from typing refactors; keep type-only PRs behavior-preserving.

## Nested TypeScript Notes

- Keep component prop interfaces and runtime `propTypes` optional/required flags synchronized.
- For reusable components, export explicit prop types and avoid `any` passthrough props.
- When a prop accepts external/untrusted objects, type as `unknown` at the boundary and narrow before access.

## Recent Findings (2026-04)

- For categorized action menus, keep a one-to-one mapping between action unions and rendered items to prevent unreachable handlers hiding in lookup maps.
- In this codebase, TSX components still use runtime `propTypes`; do not drop `propTypes` just because TypeScript props exist, especially for components consumed from JS boundaries.
- In optional numeric UI fields (`staminaChange`, `moodChange`, offer values), avoid truthy checks when rendering. Use explicit nullish checks so `0` displays as a meaningful value.
- For translation-driven lists rendered from object unions, validate nested element types (e.g., string arrays) in runtime guards before mapping.
