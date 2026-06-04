// Roadie Minigame Constants
/**
 * Roadie minigame grid width in columns.
 */
export const ROADIE_GRID_WIDTH = 12
/**
 * Roadie minigame grid height in rows.
 */
export const ROADIE_GRID_HEIGHT = 8 // Rows: 0 (Start), 1-6 (Road), 7 (Venue)
/**
 * Base roadie movement cooldown in milliseconds.
 */
export const ROADIE_MOVE_COOLDOWN_BASE = 120 // ms

// Tourbus Minigame Constants
/**
 * Number of playable tourbus minigame lanes.
 */
export const TOURBUS_LANE_COUNT = 3
/**
 * Vertical bus position as a percentage of screen height.
 */
export const TOURBUS_BUS_Y_PERCENT = 85 // Bus position in % of screen height
/**
 * Bus height as a percentage of screen height.
 */
export const TOURBUS_BUS_HEIGHT_PERCENT = 10 // Bus height in % of screen height
/**
 * Initial tourbus travel speed in relative units per millisecond.
 */
export const TOURBUS_BASE_SPEED = 0.05 // relative units per ms
/**
 * Maximum tourbus travel speed in relative units per millisecond.
 */
export const TOURBUS_MAX_SPEED = 0.12
/**
 * Base tourbus obstacle spawn interval in milliseconds.
 */
export const TOURBUS_SPAWN_RATE_MS = 1500
/**
 * Distance required to complete the tourbus minigame.
 */
export const TOURBUS_TARGET_DISTANCE = 2500
