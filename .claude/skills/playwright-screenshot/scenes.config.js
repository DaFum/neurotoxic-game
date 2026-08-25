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
 * Descriptive only. Nothing imports this file — the runnable fixture registry
 * lives in `scripts/screenshot-state-inject.js`, which owns the save-state
 * overrides, wait strategies and capture hooks, and exports `getFixtureNames()`
 * for consumers.
 *
 * A parallel FIXTURES map used to live here too. It drifted twice: it described
 * the four minigames years before they were runnable, and later missed
 * `band-hq-settings` entirely. Do not reintroduce it — add fixtures to the
 * registry instead.
 */

export const SCENES = {
  INTRO: {
    name: 'INTRO',
    description: 'Introduction sequence with "Skip" button',
    waitSignal: { type: 'button', text: /skip/i },
    order: 1,
    gamePhase: 'INTRO'
  },
  MENU: {
    name: 'MENU',
    description: 'Main menu',
    waitSignal: { type: 'heading', text: /neurotoxic/i },
    order: 2,
    gamePhase: 'MENU'
  },
  CREDITS: {
    name: 'CREDITS',
    description: 'Credits screen',
    waitSignal: { type: 'heading', text: /credits/i },
    order: 3,
    gamePhase: 'CREDITS'
  },
  BAND_HQ: {
    name: 'BAND_HQ',
    description: 'Band HQ modal overlay on menu',
    waitSignal: { type: 'heading', text: /band hq/i },
    order: 4,
    isOverlay: true
  },
  OVERWORLD: {
    name: 'OVERWORLD',
    description: 'Tour map with nodes and travel UI',
    waitSignal: { type: 'heading', text: /tour plan/i },
    fallback: { type: 'svg' },
    order: 5,
    gamePhase: 'OVERWORLD'
  },
  OVERWORLD_NODE_SELECT: {
    name: 'OVERWORLD_NODE_SELECT',
    description: 'Overworld with node selected, shows confirmation',
    waitSignal: { type: 'text', text: /CONFIRM\?/ },
    order: 6
  },
  TRAVEL_MINIGAME: {
    name: 'TRAVEL_MINIGAME',
    description: 'Tourbus Terror minigame (canvas)',
    waitSignal: { type: 'canvas' },
    order: 7,
    gamePhase: 'TRAVEL_MINIGAME',
    minigameType: 'TOURBUS'
  },
  PREGIG: {
    name: 'PREGIG',
    description: 'Pre-gig preparation (setlist, modifiers)',
    waitSignal: { type: 'heading', text: /preparation/i },
    fallback: { type: 'heading', text: /modifier/i },
    order: 8,
    gamePhase: 'PRE_GIG'
  },
  PRE_GIG_MINIGAME: {
    name: 'PRE_GIG_MINIGAME',
    description: 'Pre-gig minigames (Roadie Run, Kabelsalat, Amp Calibration)',
    waitSignal: { type: 'canvas' },
    order: 9,
    gamePhase: 'PRE_GIG_MINIGAME',
    variants: [
      {
        name: 'PRE_GIG_MINIGAME_ROADIE',
        minigameType: 'ROADIE',
        description: 'Roadie Run minigame'
      },
      {
        name: 'PRE_GIG_MINIGAME_KABELSALAT',
        minigameType: 'KABELSALAT',
        description: 'Kabelsalat minigame'
      },
      {
        name: 'PRE_GIG_MINIGAME_AMP',
        minigameType: 'AMP_CALIBRATION',
        description: 'Amp Calibration minigame'
      }
    ]
  },
  GIG: {
    name: 'GIG',
    description: 'Main rhythm game (PixiJS canvas)',
    waitSignal: { type: 'canvas' },
    fallback: { type: 'button', text: /skip|continue|escape/i },
    order: 10,
    gamePhase: 'GIG'
  },
  POSTGIG: {
    name: 'POSTGIG',
    description: 'Post-gig report and results',
    waitSignal: { type: 'heading', text: /gig report|result/i },
    fallback: { type: 'grid', text: /earnings|crowd|fame/i },
    order: 11,
    gamePhase: 'POST_GIG'
  },
  GAMEOVER: {
    name: 'GAMEOVER',
    description: 'Game Over screen (state injection only)',
    // The headline is `ui:gameOver.soldOut` / `tourComplete`, never the words
    // "game over" — the previous /game over|bankrupt/i pattern never matched.
    waitSignal: {
      type: 'heading',
      text: /sold out|tour complete|ausverkauft|tour vollendet/i
    },
    fallback: { type: 'flex', text: /bankruptcy|stats|day/i },
    order: 12,
    gamePhase: 'GAMEOVER',
    requiresStateInjection: true
  },
  CLINIC: {
    name: 'CLINIC',
    description: 'Clinic/Doctor scene (state injection only)',
    waitSignal: { type: 'networkidle' },
    order: 13,
    gamePhase: 'CLINIC',
    requiresStateInjection: true
  },
  EVENT_MODAL: {
    name: 'EVENT_MODAL',
    description: 'Random event modal overlay (appears during OVERWORLD)',
    waitSignal: { type: 'dialog' },
    order: 14,
    isOverlay: true,
    requiresStateInjection: true
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

  return {
    valid: errors.length === 0,
    errors
  }
}
