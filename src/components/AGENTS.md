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

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

