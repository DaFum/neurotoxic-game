# api/leaderboard - Agent Instructions

- Resolve submitted song IDs through the canonical song/leaderboard mapping (`SONGS_BY_ID.get(songId).leaderboardId`); never persist raw UI song IDs.
- Do not expose internal storage keys through public response shapes.
- Keep failure response shapes deterministic — security and node suites assert exact error bodies.
- `playerId` is a client-generated localStorage UUID and the ONLY authorization a write carries — the write endpoints have no auth. It must never appear in a GET response: publishing it lets any reader rename that player and overwrite their scores. Responses expose `toPublicPlayerRef(playerId)` (`lib/apiUtils.js`) instead, a one-way hash that is stable enough to use as a client list key. `src/ui/bandhq/leaderboard` consumes it as `playerRef`.
- The client already resolves song IDs before submitting (`src/utils/leaderboardUtils.ts` sends `SONGS_BY_ID.get(id).leaderboardId`), so the server allowlist in `lib/leaderboardSongIds.js` holds leaderboard IDs, not UI IDs. All 7 UI IDs differ from their leaderboard ID (`01 Kranker Schrank` → `01_kranker_schrank`), so rejecting a raw UI ID is intended, not a bug. `tests/api/leaderboard.song.test.js` pins the allowlist against `SONGS_BY_ID` so the two cannot drift.
- `song.js` uses the `GT` flag so a submission can only raise a player's best. `stats.js` deliberately does NOT: those boards track CURRENT stats and money legitimately decreases, so `GT` would silently redefine `lb:balance` as "peak balance ever".
