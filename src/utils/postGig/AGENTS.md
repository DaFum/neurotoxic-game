# Post-Gig Resolution — Agent Instructions

## Social Resolution

- Keep post outcome, target selection, and gig-virality rolls independent; thread all three values into `calculatePostGigStateUpdates` rather than reusing one scalar.
- `finalResult.totalFollowers` is the applied follower delta after organic growth and affinity. Use it for quest progress; `followers` is only the authored post-option base.
