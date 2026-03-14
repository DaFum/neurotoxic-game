import { CHATTER_DB, ALLOWED_DEFAULT_SCENES } from './standardChatter.js'
import { VENUE_CHATTER_DB } from './venueChatter.js'

export { CHATTER_DB, ALLOWED_DEFAULT_SCENES }

export const getRandomChatter = state => {
  const pool = []
  let totalWeight = 0

  // 1) Venue Specific Chatter (Scene-aware)
  const currentNode = state.gameMap?.nodes?.[state.player?.currentNodeId]
  const venueId = currentNode?.venue?.id

  if (venueId) {
    // ⚡ Bolt Optimization: Use a simple loop for the venue match instead of find for large DB
    let venueEntry = null
    for (let i = 0; i < VENUE_CHATTER_DB.length; i++) {
      if (VENUE_CHATTER_DB[i].venueId === venueId) {
        venueEntry = VENUE_CHATTER_DB[i]
        break
      }
    }

    let venueLines = null
    if (venueEntry?.linesByScene) {
      const scene = state.currentScene
      venueLines =
        venueEntry.linesByScene[scene] || venueEntry.linesByScene.ANY || []
    } else if (venueEntry?.lines) {
      // Backwards compatibility: old "lines" array
      venueLines = venueEntry.lines
    }

    if (venueLines) {
      // ⚡ Bolt Optimization: Inline mapping and pushing to prevent intermediate array creation
      for (let i = 0; i < venueLines.length; i++) {
        pool.push({
          text: venueLines[i],
          weight: 8,
          condition: null,
          speaker: null,
          type: 'normal'
        })
        totalWeight += 8
      }
    }
  }

  // 2) Standard chatter
  // ⚡ Bolt Optimization: Single O(N) pass to filter, calculate weight, and push,
  // avoiding multiple array concatenations (.concat) and iterative map/reduce
  const isDefaultScene = ALLOWED_DEFAULT_SCENES.includes(state.currentScene)
  for (let i = 0; i < CHATTER_DB.length; i++) {
    const c = CHATTER_DB[i]
    const isValid = c.condition ? c.condition(state) : isDefaultScene

    if (isValid) {
      pool.push(c)
      totalWeight += c.weight || 1
    }
  }

  if (pool.length === 0) return null

  // Weighted Random Selection
  let roll = Math.random() * totalWeight
  let item = pool[pool.length - 1]

  for (let i = 0; i < pool.length; i++) {
    const entry = pool[i]
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
