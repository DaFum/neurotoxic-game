/**
 * Clamps player money to a safe, non-negative integer.
 * @param {number} money - Candidate money value.
 * @returns {number} Clamped money value.
 */
export const clampPlayerMoney = money => {
  if (!Number.isFinite(money)) return 0
  return Math.floor(Math.max(0, money))
}

/**
 * Clamps band harmony to the canonical gameplay range.
 * @param {number} harmony - Candidate harmony value.
 * @returns {number} Clamped harmony value in range [1, 100].
 */
export const clampBandHarmony = harmony => {
  if (!Number.isFinite(harmony)) return 1
  const safeHarmony = Math.floor(harmony)
  return Math.max(1, Math.min(100, safeHarmony))
}

/**
 * Applies an inventory delta to a single inventory slot.
 * @param {boolean|number|undefined} currentValue - Existing inventory value.
 * @param {boolean|number} deltaValue - Delta to apply.
 * @returns {boolean|number|undefined} Updated inventory value.
 */
export const applyInventoryItemDelta = (currentValue, deltaValue) => {
  if (deltaValue === true || deltaValue === false) {
    return deltaValue
  }

  if (typeof deltaValue === 'number') {
    const currentCount = typeof currentValue === 'number' ? currentValue : 0
    return Math.max(0, currentCount + deltaValue)
  }

  return currentValue
}

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
      nextPlayer.money = clampPlayerMoney(nextPlayer.money + delta.player.money)
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
      nextBand.harmony = clampBandHarmony(nextBand.harmony + delta.band.harmony)
    }

    const membersDelta =
      delta.band.membersDelta !== undefined
        ? delta.band.membersDelta
        : delta.band.members
    if (membersDelta) {
      if (Array.isArray(membersDelta)) {
        nextBand.members = nextBand.members.map((member, index) => {
          const memberDelta = membersDelta[index] || {}
          const moodChange =
            typeof memberDelta.moodChange === 'number'
              ? memberDelta.moodChange
              : 0
          const staminaChange =
            typeof memberDelta.staminaChange === 'number'
              ? memberDelta.staminaChange
              : 0
          return {
            ...member,
            mood: Math.max(0, Math.min(100, member.mood + moodChange)),
            stamina: Math.max(0, Math.min(100, member.stamina + staminaChange))
          }
        })
      } else {
        nextBand.members = nextBand.members.map(member => {
          let newMood = member.mood
          let newStamina = member.stamina
          if (typeof membersDelta.moodChange === 'number') {
            newMood += membersDelta.moodChange
          }
          if (typeof membersDelta.staminaChange === 'number') {
            newStamina += membersDelta.staminaChange
          }
          return {
            ...member,
            mood: Math.max(0, Math.min(100, newMood)),
            stamina: Math.max(0, Math.min(100, newStamina))
          }
        })
      }
    }
    if (delta.band.inventory) {
      nextBand.inventory = { ...nextBand.inventory }
      Object.entries(delta.band.inventory).forEach(([item, val]) => {
        nextBand.inventory[item] = applyInventoryItemDelta(
          nextBand.inventory[item],
          val
        )
      })
    }
    if (typeof delta.band.luck === 'number') {
      nextBand.luck = Math.max(0, (nextBand.luck || 0) + delta.band.luck)
    }
    if (typeof delta.band.skill === 'number') {
      nextBand.members = nextBand.members.map(member => ({
        ...member,
        baseStats: {
          ...member.baseStats,
          skill: Math.max(
            1,
            Math.min(10, (member.baseStats?.skill || 5) + delta.band.skill)
          )
        }
      }))
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
