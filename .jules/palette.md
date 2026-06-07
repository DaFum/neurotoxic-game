## 2026-06-07 - Focus indicators for Band HQ buttons
**Learning:** Found several buttons in Band HQ (DetailedStatsTab) missing explicit `focus-visible` outlines for keyboard accessibility, unlike other parts of the app which have `focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black`.
**Action:** Always verify all new interactive elements (buttons, links) have explicit `focus-visible` utility classes added to maintain consistent keyboard navigation across the app.
