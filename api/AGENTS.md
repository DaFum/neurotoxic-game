# api - Agent Instructions

- Keep endpoint response shapes backward compatible; keep error bodies in the `{ error: string }` shape that node and UI suites assert against.
- Leaderboard and song-adjacent endpoints must normalize IDs consistently with `/api/leaderboard/**`; do not accept raw UI IDs.
- Player display names must use shared `validatePlayerName` in `lib/playerName.js`, also consumed by the identity prompt. It strips control chars, every `\p{Cf}` format char and the blank fillers U+115F/U+1160/U+2800/U+3164/U+FFA0 before checking length and requiring a visible character; `validateLeaderboardPlayer` adds player-ID validation. Do not re-inline a bare `.trim()`. React auto-escapes stored names, so this guards log/display corruption, not HTML injection.
- Do not add backend endpoints for features not reachable in current UI flows.
- Rate-limit and abuse-detection paths must NOT trust `x-forwarded-for` by default — use the shared client-IP helper in `lib/apiUtils.js`. The header is only honored when `TRUST_PROXY=true` is explicitly set on the deployment; reading it directly opens rate-limit bypass via header spoofing. Asserted by `tests/security/rateLimitBypass.test.js`.
