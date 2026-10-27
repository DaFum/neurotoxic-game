# Post-Gig Resolution — Agent Instructions

## Social Resolution

- Keep post outcome, target selection, and gig-virality rolls independent; thread all three values into `calculatePostGigStateUpdates` rather than reusing one scalar.
- `finalResult.totalFollowers` is the applied follower delta after organic growth and affinity. Use it for quest progress; `followers` is only the authored post-option base.
- `postGig.calculatePostGigStateUpdates` reads `social.activeDeals` (pre-decrement), not `updatedSocial.activeDeals`, for `comm_sellout_ad` penalty resolution; otherwise sponsorship penalties on the deal's final expiring gig are silently dropped.
- Gig pass/fail uses `perfScore >= 31` with `PERF_SCORE_MIN = 30` and `PERF_SCORE_SCALER = 150` in `postGig/`. Simulation scripts must import `calculatePerformanceScore()` rather than re-implement it.
