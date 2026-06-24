import { logEventError } from './helpers'
import type { EngineEvent, EngineGameState } from './types'

export const filterEvents = (
  pool: EngineEvent[],
  trigger: string | null,
  state: EngineGameState
) => {
  const result: EngineEvent[] = []
  for (let i = 0, len = pool.length; i < len; i++) {
    const e = pool[i]
    if (!e) continue
    // Match exact trigger OR 'random' events (eligible at any trigger point)
    if (trigger && e.trigger !== trigger && e.trigger !== 'random') {
      continue
    }
    if (!e.condition) {
      result.push(e)
      continue
    }
    try {
      if (e.condition(state)) {
        result.push(e)
      }
    } catch (err) {
      logEventError(err, e.id)
    }
  }
  return result
}
