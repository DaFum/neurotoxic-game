/**
 * Persisted player progression, resources, van, and statistics state.
 */
export interface PlayerState {
  playerId: string | null
  playerName: string
  money: number
  day: number
  time: number
  location: string
  currentNodeId: string
  lastGigNodeId: string | null
  tutorialStep: number
  score: number
  fame: number
  fameLevel: number
  eventsTriggeredToday: number
  totalTravels: number
  hqUpgrades: string[]
  clinicVisits: number
  van: {
    fuel: number
    condition: number
    upgrades: string[]
    breakdownChance: number
  }
  passiveFollowers: number
  stats: {
    totalDistance: number
    conflictsResolved: number
    stageDives: number
    /** Failed stage dives / crowdsurfs; 2 unlock the `clumsy` trait. */
    failedStageDives?: number
    consecutiveBadShows: number
    proveYourselfMode: boolean
    /** Set when the FINALE gig was completed; routes to the victory end screen. */
    tourCompleted?: boolean
  }
  [key: string]: unknown
}
