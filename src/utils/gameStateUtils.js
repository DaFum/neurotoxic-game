/**
 * Applies event delta changes to the current game state.
 * @param {object} state - Current game state.
 * @param {object} delta - Event delta payload.
 * @returns {object} Updated game state.
 */
export const applyEventDelta = (state, delta) => {
  const nextState = { ...state }

  if (delta.player) {
    const nextPlayer = { ...nextState.player }
    if (typeof delta.player.money === 'number') {
      nextPlayer.money = Math.max(0, nextPlayer.money + delta.player.money)
    }
    if (typeof delta.player.time === 'number') {
      nextPlayer.time = nextPlayer.time + delta.player.time
    }
    if (typeof delta.player.fame === 'number') {
      nextPlayer.fame = Math.max(0, nextPlayer.fame + delta.player.fame)
    }
    if (delta.player.van) {
      const nextVan = { ...nextPlayer.van }
      if (typeof delta.player.van.fuel === 'number') {
        nextVan.fuel = Math.max(
          0,
          Math.min(100, nextVan.fuel + delta.player.van.fuel)
        )
      }
      if (typeof delta.player.van.condition === 'number') {
        nextVan.condition = Math.max(
          0,
          Math.min(100, nextVan.condition + delta.player.van.condition)
        )
      }
      nextPlayer.van = nextVan
    }
    if (delta.player.location) nextPlayer.location = delta.player.location
    if (delta.player.currentNodeId)
      nextPlayer.currentNodeId = delta.player.currentNodeId
    if (typeof delta.player.day === 'number')
      nextPlayer.day = nextPlayer.day + delta.player.day

    nextState.player = nextPlayer
  }

  if (delta.band) {
    const nextBand = { ...nextState.band }
    if (typeof delta.band.harmony === 'number') {
      nextBand.harmony = Math.max(
        1,
        Math.min(100, nextBand.harmony + delta.band.harmony)
      )
    }

    if (delta.band.members) {
      nextBand.members = nextBand.members.map(m => {
        let newMood = m.mood
        let newStamina = m.stamina
        if (typeof delta.band.members.moodChange === 'number')
          newMood += delta.band.members.moodChange
        if (typeof delta.band.members.staminaChange === 'number')
          newStamina += delta.band.members.staminaChange
        return {
          ...m,
          mood: Math.max(0, Math.min(100, newMood)),
          stamina: Math.max(0, Math.min(100, newStamina))
        }
      })
    }
    if (delta.band.inventory) {
      nextBand.inventory = { ...nextBand.inventory }
      Object.entries(delta.band.inventory).forEach(([item, val]) => {
        if (val === true || val === false) {
          nextBand.inventory[item] = val
        } else if (typeof val === 'number') {
          // Add to existing count or set if not exists (assuming count starts at 0 if undefined)
          const current =
            typeof nextBand.inventory[item] === 'number'
              ? nextBand.inventory[item]
              : 0
          nextBand.inventory[item] = Math.max(0, current + val)
        }
      })
    }
    if (typeof delta.band.luck === 'number') {
      nextBand.luck = Math.max(0, (nextBand.luck || 0) + delta.band.luck)
    }
    nextState.band = nextBand
  }

  if (delta.social) {
    const nextSocial = { ...nextState.social }
    Object.entries(delta.social).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const currentValue =
          typeof nextSocial[key] === 'number' ? nextSocial[key] : 0
        nextSocial[key] = Math.max(0, currentValue + value)
      }
    })
    nextState.social = nextSocial
  }

  if (delta.flags) {
    if (delta.flags.addStoryFlag) {
      if (!nextState.activeStoryFlags.includes(delta.flags.addStoryFlag)) {
        nextState.activeStoryFlags = [
          ...nextState.activeStoryFlags,
          delta.flags.addStoryFlag
        ]
      }
    }
    if (delta.flags.queueEvent) {
      nextState.pendingEvents = [
        ...nextState.pendingEvents,
        delta.flags.queueEvent
      ]
    }
  }

  return nextState
}
