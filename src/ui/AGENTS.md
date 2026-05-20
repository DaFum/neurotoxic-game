# src/ui - Agent Instructions

## Layout wrappers

- Wrapper components must forward `contentClassName` to preserve Brutalist flexbox layouts.

## Copy

- Do not pass non-string values into `t(...)`; fall back to explicit unknown-item keys for malformed labels. If no domain-specific unknown key exists, add one in EN/DE locales with a `defaultValue` instead of rendering a raw value.

## Controls and images

- Tooltip/disabled-control wrappers must compose (not replace) consumer event handlers and preserve `aria-describedby` / keyboard focusability.
- `<img>` `onError` handlers must null themselves before swapping `src` to the offline fallback: `e.currentTarget.onerror = null; e.currentTarget.src = getGeneratedImageFallbackUrl()`. The fallback URL can also 404 (especially offline), and without nulling first the handler re-fires in an infinite loop. Applied in `ContrabandStash.tsx` and `ShopItem.tsx`.
- If the offline fallback also 404s, the nulled handler is the intended stopping point; do not add retry loops. `getGeneratedImageFallbackUrl()` currently returns the static local SVG path from `imageGen.ts`.
