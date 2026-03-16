import { CHATTER_DB, ALLOWED_DEFAULT_SCENES } from './standardChatter.js'
import { VENUE_CHATTER_LOOKUP } from './venueChatter.js'

export { CHATTER_DB, ALLOWED_DEFAULT_SCENES }

export const getRandomChatter = state => {
  let pool = []

  // 1) Venue Specific Chatter (Scene-aware)
  const currentNode = state.gameMap?.nodes[state.player.currentNodeId]
  const venueId = currentNode?.venue?.id

  if (venueId) {
    const venueEntry = VENUE_CHATTER_LOOKUP[venueId]

    if (venueEntry?.linesByScene) {
      const scene = state.currentScene
      const venueLines =
        venueEntry.linesByScene[scene] || venueEntry.linesByScene.ANY || []

      // Give venue lines higher priority, but not always dominating
      for (let i = 0; i < venueLines.length; i++) {
        pool.push({
          text: venueLines[i],
          weight: 8,
          condition: null,
          speaker: null
        })
      }
    } else if (venueEntry?.lines) {
      // Backwards compatibility: old "lines" array
      for (let i = 0; i < venueEntry.lines.length; i++) {
        pool.push({
          text: venueEntry.lines[i],
          weight: 8,
          condition: null,
          speaker: null
        })
      }
    }
  }

  // 2) Standard chatter
  for (let i = 0; i < CHATTER_DB.length; i++) {
    const c = CHATTER_DB[i]
    if (c.condition) {
      if (c.condition(state)) pool.push(c)
    } else if (ALLOWED_DEFAULT_SCENES.includes(state.currentScene)) {
      pool.push(c)
    }
  }

  if (pool.length === 0) return null

  // Weighted Random Selection
  let totalWeight = 0
  for (let i = 0; i < pool.length; i++) {
    totalWeight += pool[i].weight || 1
  }
  let roll = Math.random() * totalWeight
  let item = pool[pool.length - 1]

  for (const entry of pool) {
    roll -= entry.weight || 1
    if (roll <= 0) {
      item = entry
      break
    }
  }

  return {
    text: item.text,
    speaker: item.speaker || null,
    type: item.type || 'normal'
  }
}
