# api/leaderboard - Agent Instructions

- Resolve submitted song IDs through the canonical song/leaderboard mapping (`SONGS_BY_ID.get(songId).leaderboardId`); never persist raw UI song IDs.
- Do not expose internal storage keys through public response shapes.
- Keep failure response shapes deterministic — security and node suites assert exact error bodies.
