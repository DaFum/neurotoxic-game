## 2024-06-12 - Disabled Button Tooltips
**Learning:** In Tailwind UI, combining `pointer-events-none` with `cursor-not-allowed` on disabled buttons breaks the cursor style and prevents tooltips from showing because the browser ignores all pointer events.
**Action:** Rely on the native HTML `disabled` attribute combined with visual cues like `opacity-50` instead of `pointer-events-none` so users still get the `cursor-not-allowed` visual feedback.
