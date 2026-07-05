import type { EventDelta } from '../../types'
import { finiteNumberOr } from '../gameState'
import { resolveTemplateString } from './templateResolver'
import { asNumber, clampMoneyChange } from './helpers'
import type { EffectShape, EngineGameState, TemplateContext } from './types'

/**
 * Effect handler registry keyed by declarative event effect type.
 */
const EVENT_EFFECT_HANDLERS = Object.assign(Object.create(null), {
  relationship: (
    eff: EffectShape,
    delta: EventDelta,
    context: TemplateContext
  ) => {
    const parsedChange =
      typeof eff.value === 'number' ? eff.value : Number(eff.value)
    if (!Number.isFinite(parsedChange)) return
    if (!delta.band.relationshipChange) delta.band.relationshipChange = []
    const resolveName = (str: string) => resolveTemplateString(str, context)
    delta.band.relationshipChange.push({
      member1: resolveName(String(eff.member1 ?? '')),
      member2: resolveName(String(eff.member2 ?? '')),
      change: parsedChange
    })
  },
  resource: (
    eff: EffectShape,
    delta: EventDelta,
    _context: TemplateContext,
    gameState: EngineGameState | null
  ) => {
    if (eff.resource === 'money') {
      const prevDelta = asNumber(delta.player.money)
      let change = asNumber(eff.value)
      if (gameState) {
        const current = finiteNumberOr(gameState.player?.money, 0)
        change = clampMoneyChange(current, prevDelta, change)
      }
      delta.player.money = prevDelta + change
    }
    if (eff.resource === 'fuel') {
      delta.player.van = { ...(delta.player.van || {}) }
      delta.player.van.fuel =
        asNumber(delta.player.van.fuel) + asNumber(eff.value)
    }
  },
  /**
   * percentage_resource
   * Note: for negative amounts, `min` acts as the maximum *loss* (a floor for the value)
   * enforced via Math.max, and `max` acts as the minimum *loss* (ceiling) enforced via Math.min.
   * Example: `min: -100` bedeutet "verliere maximal 100" bei negativen Prozentsätzen.
   */
  percentage_resource: (
    eff: EffectShape,
    delta: EventDelta,
    _context: TemplateContext,
    gameState: EngineGameState | null
  ) => {
    if (!gameState || !gameState.player) return

    if (eff.resource === 'money') {
      const current = gameState.player.money ?? 0
      const percentage = asNumber(eff.percentage)
      let amount = Math.round(current * (percentage / 100))

      // Defensive guard: swap if min > max
      let min = typeof eff.min === 'number' ? eff.min : undefined
      let max = typeof eff.max === 'number' ? eff.max : undefined
      if (min !== undefined && max !== undefined && min > max) {
        ;[min, max] = [max, min]
      }

      // Note: for negative amounts, 'min' acts as the maximum *loss* (a floor for the value)
      // using Math.max, and 'max' acts as the minimum *loss* (ceiling) using Math.min.
      if (min !== undefined) amount = Math.max(min, amount)
      if (max !== undefined) amount = Math.min(max, amount)

      delta.player.money = asNumber(delta.player.money) + amount
    }
  },
  stat: (
    eff: EffectShape,
    delta: EventDelta,
    _context: TemplateContext,
    gameState: EngineGameState | null
  ) => {
    if (eff.stat === 'time')
      delta.player.time = asNumber(delta.player.time) + asNumber(eff.value)
    if (eff.stat === 'fame')
      delta.player.fame = asNumber(delta.player.fame) + asNumber(eff.value)
    if (eff.stat === 'harmony') {
      const prevDelta = asNumber(delta.band.harmony)
      let change = asNumber(eff.value)
      if (gameState) {
        const current = finiteNumberOr(gameState.band?.harmony, 1)
        if (current + prevDelta + change < 1) {
          change = 1 - (current + prevDelta)
        } else if (current + prevDelta + change > 100) {
          change = 100 - (current + prevDelta)
        }
      }
      delta.band.harmony = prevDelta + change
    }
    if (eff.stat === 'mood') {
      delta.band.membersDelta = {
        ...(delta.band.membersDelta || {}),
        moodChange: asNumber(eff.value)
      }
    }
    if (eff.stat === 'stamina') {
      delta.band.membersDelta = {
        ...(delta.band.membersDelta || {}),
        staminaChange: asNumber(eff.value)
      }
    }
    if (eff.stat === 'van_condition') {
      delta.player.van = { ...(delta.player.van || {}) }
      delta.player.van.condition =
        asNumber(delta.player.van.condition) + asNumber(eff.value)
    }
    if (eff.stat === 'hype' || eff.stat === 'crowd_energy')
      delta.player.fame = asNumber(delta.player.fame) + asNumber(eff.value)
    if (eff.stat === 'viral')
      delta.social.viral = asNumber(delta.social.viral) + asNumber(eff.value)
    if (eff.stat === 'controversyLevel')
      delta.social.controversyLevel =
        asNumber(delta.social.controversyLevel) + asNumber(eff.value)
    if (eff.stat === 'loyalty')
      delta.social.loyalty =
        asNumber(delta.social.loyalty) + asNumber(eff.value)
    if (eff.stat === 'score')
      delta.score = asNumber(delta.score) + asNumber(eff.value)
    if (eff.stat === 'luck')
      delta.band.luck = asNumber(delta.band.luck) + asNumber(eff.value)
    if (eff.stat === 'skill')
      delta.band.skill = asNumber(delta.band.skill) + asNumber(eff.value)
  },
  stat_increment: (eff: EffectShape, delta: EventDelta) => {
    if (eff.stat === 'conflictsResolved') {
      if (!delta.player.stats) delta.player.stats = {}
      delta.player.stats.conflictsResolved =
        asNumber(delta.player.stats.conflictsResolved) + asNumber(eff.value)
    }
    if (eff.stat === 'stageDives') {
      if (!delta.player.stats) delta.player.stats = {}
      delta.player.stats.stageDives =
        asNumber(delta.player.stats.stageDives) + asNumber(eff.value)
    }
  },
  item: (eff: EffectShape, delta: EventDelta) => {
    if (typeof eff.item === 'string' && eff.item.length > 0) {
      if (typeof eff.value === 'number') {
        if (Number.isFinite(eff.value)) {
          if (!delta.band.inventory) delta.band.inventory = {}
          delta.band.inventory[eff.item] =
            asNumber(delta.band.inventory[eff.item]) + eff.value
        }
      } else {
        if (!delta.band.inventory) delta.band.inventory = {}
        const val = eff.value !== undefined ? eff.value : true
        delta.band.inventory[eff.item] = val
      }
    }
  },
  unlock: (eff: EffectShape, delta: EventDelta) => {
    delta.flags.unlock = eff.unlock
  },
  game_over: (eff: EffectShape, delta: EventDelta) => {
    delta.flags.gameOver = true
  },
  flag: (eff: EffectShape, delta: EventDelta) => {
    if (typeof eff.flag === 'string' && eff.flag.length > 0) {
      delta.flags.addStoryFlag = eff.flag
    }
  },
  cooldown: (
    eff: EffectShape,
    delta: EventDelta,
    _context: TemplateContext = {},
    gameState: EngineGameState | null = null
  ) => {
    if (typeof eff.eventId === 'string' && eff.eventId.length > 0) {
      if (typeof eff.value === 'number' && eff.value > 0) {
        const currentDay = finiteNumberOr(gameState?.player?.day, 0)
        const expiryDay = currentDay + eff.value
        delta.flags.addCooldown = `${eff.eventId}:${expiryDay}`
      } else {
        delta.flags.addCooldown = eff.eventId
      }
    }
  },
  social_set: (eff: EffectShape, delta: EventDelta) => {
    if (typeof eff.stat === 'string' && eff.stat.length > 0) {
      delta.social[eff.stat] = eff.value
    }
  },
  chain: (eff: EffectShape, delta: EventDelta) => {
    if (typeof eff.eventId === 'string') {
      delta.flags.queueEvent = eff.eventId
    }
  },
  quest: (eff: EffectShape, delta: EventDelta) => {
    if (typeof eff.quest === 'string' && eff.quest.length > 0) {
      if (!delta.flags.addQuest) delta.flags.addQuest = []
      delta.flags.addQuest.push(eff.quest)
    }
  },
  stash_confiscate: (
    eff: EffectShape,
    delta: EventDelta,
    context: TemplateContext
  ) => {
    // itemId can be provided explicitly on the effect or inherited from event context
    const itemId = eff.itemId || context?.riskItemId
    if (typeof itemId === 'string' && itemId.length > 0) {
      if (!delta.band.stashRemove) delta.band.stashRemove = []
      delta.band.stashRemove.push(itemId)
    }
  }
})

/**
 * Processes a single effect object into state delta modifications.
 * @param eff - Effect object from an event definition.
 * @param delta - Mutable event delta accumulator to update.
 * @param context - Template context used by effects that resolve dynamic fields.
 * @param gameState - Current game state for effects that need live values.
 */
const processEffect = (
  eff: EffectShape,
  delta: EventDelta,
  context: TemplateContext = {},
  gameState: EngineGameState | null = null
) => {
  const handler = EVENT_EFFECT_HANDLERS[String(eff.type)]
  if (typeof handler === 'function') {
    handler(eff, delta, context, gameState)
  }
}

export { EVENT_EFFECT_HANDLERS, processEffect }
