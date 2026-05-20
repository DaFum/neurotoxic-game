# src/ui - Agent Instructions

- Wrapper components must forward `contentClassName` to preserve Brutalist flexbox layouts.
- Do not pass non-string values into `t(...)`; fall back to explicit unknown-item keys for malformed labels.
- Tooltip/disabled-control wrappers must compose (not replace) consumer event handlers and preserve `aria-describedby` / keyboard focusability.
- `<img>` `onError` handlers must null themselves before swapping `src` to the offline fallback: `e.currentTarget.onerror = null; e.currentTarget.src = getGeneratedImageFallbackUrl()`. The fallback URL can also 404 (especially offline), and without nulling first the handler re-fires in an infinite loop. Applied in `ContrabandStash.tsx` and `ShopItem.tsx`.
