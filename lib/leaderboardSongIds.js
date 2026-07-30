export const CANONICAL_LEADERBOARD_IDS = Object.freeze([
  '01_kranker_schrank',
  '02_the_lost_scriptures_of_the_elder_gods_akoasma_and_golgatha',
  '03_travestie_massaker',
  '04_new_millenium',
  '05_suicidal_jesus',
  '08_systemsprenger',
  '09_galactic_love_bazooka'
])

const canonicalLeaderboardIds = new Set(CANONICAL_LEADERBOARD_IDS)

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export const resolveLeaderboardId = value =>
  typeof value === 'string' && canonicalLeaderboardIds.has(value) ? value : null
