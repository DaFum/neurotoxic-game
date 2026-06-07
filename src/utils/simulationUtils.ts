// Backward-compatibility barrel file for simulation utilities
// This module re-exports gig-related and daily-tick-related concerns
// that have been split into focused modules.

export { getGigModifiers, calculateGigPhysics } from './gigModifiersUtils'
export { calculateDailyUpdates } from './dailyTickLogic'
