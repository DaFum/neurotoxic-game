import { CHATTER_DB, ALLOWED_DEFAULT_SCENES } from './standardChatter.js';
import { VENUE_CHATTER_DB } from './venueChatter.js';

export { CHATTER_DB, VENUE_CHATTER_DB, ALLOWED_DEFAULT_SCENES };

export const getRandomChatter = state => {
  let pool = []

  // 1) Venue Specific Chatter (Scene-aware)
  const currentNode = state.gameMap?.nodes[state.player.currentNodeId]
  const venueId = currentNode?.venue?.id

  if (venueId) {
    const venueEntry = VENUE_CHATTER_DB.find(v => v.venueId === venueId)

    if (venueEntry?.linesByScene) {
      const scene = state.currentScene
      const venueLines =
        venueEntry.linesByScene[scene] || venueEntry.linesByScene.ANY || []

      // Give venue lines higher priority, but not always dominating
      const venueWeighted = venueLines.map(text => ({
        text,
        weight: 8,
        condition: null,
        speaker: null
      }))

      pool = pool.concat(venueWeighted)
    } else if (venueEntry?.lines) {
      // Backwards compatibility: old "lines" array
      const venueWeighted = venueEntry.lines.map(text => ({
        text,
        weight: 8,
        condition: null,
        speaker: null
      }))
      pool = pool.concat(venueWeighted)
    }
  }

  // 2) Standard chatter
  const standardChatter = CHATTER_DB.filter(c => {
    if (c.condition) return c.condition(state)
    return ALLOWED_DEFAULT_SCENES.includes(state.currentScene)
  })

  pool = pool.concat(standardChatter)

  if (pool.length === 0) return null

  // Weighted Random Selection
  const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0)
  let roll = Math.random() * totalWeight
  let item = pool[pool.length - 1]

  for (const entry of pool) {
    roll -= entry.weight || 1
    if (roll <= 0) {
      item = entry
      break
    }
  }

  return { text: item.text, speaker: item.speaker || null }
}
