/**
 * scenes.config.js
 *
 * Centralized scene navigation and fixture configuration for playwright-screenshot skill.
 *
 * Defines:
 * - Scene metadata (name, description, navigation path)
 * - Wait strategies (what DOM element confirms scene is loaded)
 * - State fixtures (pre-built save states for testing)
 *
 * This single source of truth prevents duplication across screenshot-game-flow.js,
 * screenshot-all-scenes.js, and screenshot-state-inject.js.
 */

export const SCENES = {
  INTRO: {
    name: 'INTRO',
    description: 'Introduction sequence with "Skip" button',
    waitSignal: { type: 'button', text: /skip/i },
    order: 1
  },
  MENU: {
    name: 'MENU',
    description: 'Main menu',
    waitSignal: { type: 'heading', text: /neurotoxic/i },
    order: 2
  },
  CREDITS: {
    name: 'CREDITS',
    description: 'Credits screen',
    waitSignal: { type: 'heading', text: /credits/i },
    order: 3
  },
  BAND_HQ: {
    name: 'BAND_HQ',
    description: 'Band HQ modal overlay on menu',
    waitSignal: { type: 'heading', text: /band hq/i },
    order: 4
  },
  OVERWORLD: {
    name: 'OVERWORLD',
    description: 'Tour map with nodes and travel UI',
    waitSignal: { type: 'heading', text: /tour plan/i },
    fallback: { type: 'svg' },
    order: 5
  },
  OVERWORLD_NODE_SELECT: {
    name: 'OVERWORLD_NODE_SELECT',
    description: 'Overworld with node selected, shows confirmation',
    waitSignal: { type: 'text', text: /CONFIRM\?/ },
    order: 6
  },
  TRAVEL_MINIGAME: {
    name: 'TRAVEL_MINIGAME',
    description: 'Tourbus Terror minigame',
    waitSignal: { type: 'text', text: /TOURBUS TERROR/ },
    order: 7
  },
  PREGIG: {
    name: 'PREGIG',
    description: 'Pre-gig preparation (setlist, modifiers)',
    waitSignal: { type: 'heading', text: /preparation/i },
    fallback: { type: 'heading', text: /modifier/i },
    order: 8
  },
  PRE_GIG_MINIGAME: {
    name: 'PRE_GIG_MINIGAME',
    description: 'Pre-gig minigame (canvas)',
    waitSignal: { type: 'canvas' },
    order: 9
  },
  GIG: {
    name: 'GIG',
    description: 'Main rhythm game (PixiJS canvas)',
    waitSignal: { type: 'canvas' },
    fallback: { type: 'button', text: /skip|continue|escape/i },
    order: 10
  },
  POSTGIG: {
    name: 'POSTGIG',
    description: 'Post-gig report and results',
    waitSignal: { type: 'heading', text: /gig report/i },
    fallback: { type: 'grid', text: /earnings|crowd|fame/i },
    order: 11
  },
  POSTGIG_SOCIAL: {
    name: 'POSTGIG_SOCIAL',
    description: 'Post-gig social media phase',
    waitSignal: { type: 'heading', text: /post to social media/i },
    order: 12
  },
  GAMEOVER: {
    name: 'GAMEOVER',
    description: 'Game Over screen (state injection only)',
    waitSignal: { type: 'heading', text: /game over/i },
    fallback: { type: 'flex', text: /bankruptcy|stats|day/i },
    order: 13,
    requiresStateInjection: true
  },
  CLINIC: {
    name: 'CLINIC',
    description: 'Clinic/Doctor scene (state injection only)',
    waitSignal: { type: 'networkidle' },
    order: 14,
    requiresStateInjection: true
  },
  EVENT_MODAL: {
    name: 'EVENT_MODAL',
    description: 'Random event modal overlay',
    waitSignal: { type: 'dialog' },
    order: 15
  }
}

/**
 * Fixture definitions for state injection
 * Maps fixture name to BASE_STATE overrides
 */
export const FIXTURES = {
  menu: {
    description: 'Main menu (fresh start)',
    currentScene: 'MENU'
  },
  overworld: {
    description: 'Overworld map with moderate resources',
    currentScene: 'OVERWORLD',
    playerOverride: { money: 480, fame: 350 }
  },
  pregig: {
    description: 'PreGig preparation screen',
    currentScene: 'PREGIG'
  },
  postgig: {
    description: 'Post-gig report screen',
    currentScene: 'POSTGIG'
  },
  gameover: {
    description: 'Game over screen (bankrupt)',
    currentScene: 'GAMEOVER',
    playerOverride: { money: 0, fame: 0, day: 14 },
    bandOverride: { harmony: 1 }
  },
  clinic: {
    description: 'Clinic scene',
    currentScene: 'CLINIC',
    playerOverride: { money: 800, fame: 500 }
  },
  'band-hq': {
    description: 'Main menu with Band HQ modal open',
    currentScene: 'MENU'
  },
  'event-modal': {
    description: 'Overworld with an active event modal open',
    currentScene: 'OVERWORLD'
  },
  gig: {
    description: 'GIG scene with PixiJS canvas',
    currentScene: 'GIG',
    songId: '01 Kranker Schrank' // IMPORTANT: Must match actual song key
  }
}

/**
 * Helper to get scene by name
 * @param {string} sceneName
 * @returns {Object} Scene metadata
 */
export function getScene(sceneName) {
  return SCENES[sceneName]
}

/**
 * Helper to get all scenes in order (for full-flow capture)
 * @returns {Array} Scenes sorted by order
 */
export function getScenesInOrder() {
  return Object.values(SCENES).sort((a, b) => a.order - b.order)
}

/**
 * Helper to get fixture by name
 * @param {string} fixtureName
 * @returns {Object} Fixture metadata
 */
export function getFixture(fixtureName) {
  return FIXTURES[fixtureName]
}

/**
 * Helper to get all fixtures
 * @returns {Array} List of available fixture names
 */
export function getFixtureNames() {
  return Object.keys(FIXTURES)
}

/**
 * Helper to validate scene configuration
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateSceneConfig() {
  const errors = []

  // Check for duplicate order numbers
  const orders = Object.values(SCENES).map(s => s.order)
  const duplicates = orders.filter((o, i) => orders.indexOf(o) !== i)
  if (duplicates.length > 0) {
    errors.push(`Duplicate scene orders: ${duplicates.join(', ')}`)
  }

  // Check for missing waitSignal
  for (const [name, scene] of Object.entries(SCENES)) {
    if (!scene.waitSignal) {
      errors.push(`Scene ${name} missing waitSignal`)
    }
  }

  // Check fixture references valid scenes
  for (const [name, fixture] of Object.entries(FIXTURES)) {
    if (fixture.currentScene && !SCENES[fixture.currentScene]) {
      errors.push(
        `Fixture '${name}' references unknown scene: ${fixture.currentScene}`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
