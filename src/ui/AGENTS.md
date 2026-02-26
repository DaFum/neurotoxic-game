# src/ui/ — Gotchas

- Toast taxonomy: `success`, `error`, `warning`, `info`. The `info` type renders with `--info-blue` token.
- No hardcoded colors — use CSS variables (`--toxic-green`, `--void-black`, etc.) with Tailwind v4 syntax: `bg-(--void-black)` not `bg-[var(--void-black)]`.
