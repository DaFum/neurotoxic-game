/// <reference types="vite/client" />

/**
 * Whether the client may talk to the leaderboard API.
 *
 * @remarks
 * Reads `VITE_ENABLE_LEADERBOARD_SYNC` at call time, from `import.meta.env`
 * first and `process.env` second. Only a case-insensitive `'false'` turns it
 * off; unset or any other value leaves it on. Static builds without the API
 * (GitHub Pages) set it to `'false'`.
 *
 * @returns `false` when the flag is `'false'`, otherwise `true`.
 */
export const isLeaderboardSyncEnabled = (): boolean => {
  const viteFlag = import.meta.env?.VITE_ENABLE_LEADERBOARD_SYNC
  if (typeof viteFlag === 'string') {
    return viteFlag.toLowerCase() !== 'false'
  }

  const processEnvSource = globalThis as {
    process?: { env?: Record<string, string | undefined> }
  }
  const processFlag =
    processEnvSource.process != null &&
    typeof processEnvSource.process === 'object'
      ? processEnvSource.process.env?.VITE_ENABLE_LEADERBOARD_SYNC
      : undefined
  if (typeof processFlag === 'string') {
    return processFlag.toLowerCase() !== 'false'
  }

  return true
}
