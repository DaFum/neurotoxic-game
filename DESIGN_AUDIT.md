# Design Audit Fixes

The following issues were identified and fixed to adhere to the project's brutalist design system and resolve styling inconsistencies:

1. **Z-Index Hardcoding & Tiering**
   - Removed hardcoded `z-[100]` in `EventModal.tsx` and `QuestsModal.tsx`.
   - Re-aligned modal components (`EventModal`, `QuestsModal`, `MerchPressModal`, `PirateRadioModal`, `BandHQ`, `BloodBankModal`, `SupplyStopModal`) to correctly use the design system's `--z-modal` variable.
   - Refactored HUD components (`HUD`, `EventLog`, `OverworldMenu`, `GlitchButton`) to use `--z-hud` or `--z-stage-overlay` instead of raw values (`z-50`, `z-40`, etc.).

2. **Viewport Height Constraints (vh -> svh)**
   - Updated modal container maximum heights from `vh` to `svh` (e.g., `max-h-[calc(100svh-4rem)]`) across `QuestsModal`, `PirateRadioModal`, `ContrabandStash`, `SupplyStopModal`, `BandHQ`, and `DebugLogViewer` to prevent content from clipping under mobile browser UI chrome.
   - Added `max-h-[calc(100svh-4rem)]` and vertical scrolling (`overflow-y-auto`) to `EventModal` to fix overflowing content in short viewports.

3. **Arbitrary Theme Utilities**
   - Refactored `ContrabandStash.tsx` to utilize native `@theme` utilities (e.g., `bg-void-black`, `text-toxic-green`, `border-electric-blue-20`) instead of arbitrary raw variables (`bg-(--color-void-black)`).

4. **Brutalist Shape Violations**
   - Removed `rounded` and `rounded-sm` classes from `DealCard.tsx`, `QuestsModal.tsx`, `ContrabandStash.tsx`, and `GlossaryTab.tsx` to maintain strict brutalist sharp edges.

5. **Modal Chrome Standardization**
   - Standardized CSS classes for modal wrappers across the codebase (`border-4`, `border-toxic-green`, `p-3 sm:p-6`, `bg-void-black`, `shadow-[4px_4px_0px_var(--color-toxic-green)] sm:shadow-[8px_8px_0px_var(--color-toxic-green)]`) to ensure visual consistency.

6. **Font Definitions**
   - Migrated multiple inline font definitions (`font-['Metal_Mania']`, `font-[Metal_Mania]`, `font-[Courier_New]`) in React components and `overworld.css` to the globally defined CSS variables `font-display` and `font-ui`.

7. **Dead CSS Selectors**
   - Cleaned up obsolete map-node render path classes and unused animations in `src/overworld.css` (e.g., `.scan`, `.noise`, `.radio*`, `.map-node`, `.confirm-lbl`, `.n-reachable`, `.n-pending`, `.el-cursor`, `.n-unlocked`).
