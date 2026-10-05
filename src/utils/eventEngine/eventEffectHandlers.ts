import type { EventDelta } from '../../types'
import { finiteNumberOr, isFiniteNumber } from '../gameState'
import { getSafeUUID } from '../crypto'
import { resolveTemplateString } from './templateResolver'
import { asNumber, clampMoneyChange, clampPercentageAmount } from './helpers'
import { isExpeditionEventResultId } from '../../domain/expedition/eventDeltas'
import type { EffectShape, EngineGameState, TemplateContext } from './types'

/** Reads the flat mood/stamina accumulator the stat handler builds up. */
const readMembersDelta = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

/**
 * Effect handler registry keyed by declarative event effect type.
 */
const EVENT_EFFECT_HANDLERS = Object.assign(Object.create(null), {
  relationship: (
    eff: EffectShape,
    delta: EventDelta,
    context: TemplateContext
  ) => {
    const parsedChange = eff.value
    if (!isFiniteNumber(parsedChange)) return
    if (!delta.band.relationshipChange) delta.band.relationshipChange = []
    const resolveName = (str: string) => resolveTemplateString(str, context)
    delta.band.relationshipChange.push({
      member1: resolveName(String(eff.member1 ?? '')),
      member2: resolveName(String(eff.member2 ?? '')),
      change: parsedChange,
      // Only the `banter` tag is meaningful downstream (`applyEventDelta` logs
      // it into `band.banterEvents`); any other value is dropped.
      ...(eff.source === 'banter' ? { source: 'banter' } : {})
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
      const current = finiteNumberOr(gameState.player.money, 0)
      const amount = clampPercentageAmount(
        current,
        eff.percentage,
        eff.min,
        eff.max
      )
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
    // Mood/stamina accumulate like every other stat: a composite event with two
    // mood effects must apply both, not just the last one.
    if (eff.stat === 'mood') {
      const previous = readMembersDelta(delta.band.membersDelta)
      delta.band.membersDelta = {
        ...previous,
        moodChange: asNumber(previous.moodChange) + asNumber(eff.value)
      }
    }
    if (eff.stat === 'stamina') {
      const previous = readMembersDelta(delta.band.membersDelta)
      delta.band.membersDelta = {
        ...previous,
        staminaChange: asNumber(previous.staminaChange) + asNumber(eff.value)
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
      if (Number.isFinite(eff.value)) {
        if (!delta.band.inventory) delta.band.inventory = {}
        delta.band.inventory[eff.item] =
          asNumber(delta.band.inventory[eff.item]) + asNumber(eff.value)
      } else if (typeof eff.value !== 'number') {
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
      // `typeof value === 'number'` accepts NaN and Infinity, which would build
      // an entry (`id:Infinity`) that every cooldown reader then rejects as
      // malformed — a cooldown that never applies and never expires.
      const cooldownDays = finiteNumberOr(eff.value, 0)
      if (cooldownDays > 0) {
        const currentDay = finiteNumberOr(gameState?.player?.day, 0)
        // `isOnCooldown` only honors a whole-day expiry suffix, so a fractional
        // persisted day must not leak into the entry it would then reject.
        const expiryDay = Math.floor(currentDay + cooldownDays)
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
  /**
   * expedition
   * Reads `eff.result` and nothing else. An event names an Expedition outcome;
   * the numbers behind it belong to the run's own registry, so a `value` on
   * this effect is ignored rather than honored, and an unknown result id adds
   * nothing to the delta at all.
   */
  expedition: (eff: EffectShape, delta: EventDelta) => {
    if (!isExpeditionEventResultId(eff.result)) return
    const previous = delta.expedition?.resultIds ?? []
    if (previous.includes(eff.result)) return
    delta.expedition = { resultIds: [...previous, eff.result] }
  },
  /**
   * contraband
   * Grants one catalogue contraband item (`eff.itemId`) through the stash path.
   * The instance id is minted here because reducers must stay free of UUID
   * generation; `applyEventDelta` validates the id against the catalogue.
   */
  contraband: (eff: EffectShape, delta: EventDelta) => {
    if (typeof eff.itemId !== 'string' || eff.itemId.length === 0) return
    if (!delta.band.stashAdd) delta.band.stashAdd = []
    delta.band.stashAdd.push({
      contrabandId: eff.itemId,
      instanceId: getSafeUUID()
    })
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

export { processEffect }
