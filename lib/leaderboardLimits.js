/**
 * Highest balance the `lb:balance` board publishes, shared by the client
 * payload (`useLeaderboardSync`) and the stats API.
 *
 * @remarks
 * The player's wallet itself is not capped; only the published value is. A
 * richer wallet is sent and stored as this value, so a late-game balance never
 * makes the API reject the whole snapshot and drop every other stat with it.
 */
export const MAX_PUBLISHED_BALANCE = 10_000_000
