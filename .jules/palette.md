## 2024-07-11 - Add ARIA label to Warning Icon in BandMemberRow
**Learning:** Icon-only warning states in HUD components (`AlertCircle` in `BandMemberRow`) lacked implicit accessibility context. Relying solely on `Tooltip` wrappers fails for screen readers since `lucide-react` icons aren`t inherently accessible.
**Action:** Always add `role="img"` and a localized `aria-label` directly to `lucide-react` SVG components when used as status indicators, even if wrapped in a Tooltip.
