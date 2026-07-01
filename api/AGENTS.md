# api - Agent Instructions

- Keep endpoint response shapes backward compatible; keep error bodies in the `{ error: string }` shape that node and UI suites assert against.
- Leaderboard and song-adjacent endpoints must normalize IDs consistently with `/api/leaderboard/**`; do not accept raw UI IDs.
- Player display names must be sanitized through the shared `sanitizePlayerName` helper in `lib/apiUtils.js` (strips C0/C1/DEL control chars) before the length check — do not re-inline a bare `.trim()`. Stored names are rendered client-side where React auto-escapes, so this guards log/display corruption, not HTML injection.
- Do not add backend endpoints for features not reachable in current UI flows.
- Rate-limit and abuse-detection paths must NOT trust `x-forwarded-for` by default — use the shared client-IP helper in `lib/apiUtils.js`. The header is only honored when `TRUST_PROXY=true` is explicitly set on the deployment; reading it directly opens rate-limit bypass via header spoofing. Asserted by `tests/security/rateLimitBypass.test.js`.
