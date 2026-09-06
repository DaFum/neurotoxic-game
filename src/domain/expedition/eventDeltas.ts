/**
 * The closed set of Expedition effects a declarative event may request.
 *
 * @remarks
 * Events are content: their effect objects are authored data and, through the
 * engine, reach the reducer from outside the Expedition. So an event never
 * carries Expedition *numbers* — it names a result, and the numbers live here,
 * next to the axis they belong to. An unknown result id resolves to nothing,
 * which is what stops a hand-written or forged effect from authoring Heat,
 * Condition or cargo values the run's own rules would never produce.
 */

import type {
  ExpeditionEventResultEffect,
  ExpeditionEventResultId
} from '../../types/expedition'

/**
 * Effects of every known event result, keyed by result id.
 *
 * @remarks
 * Typed as a total record, so adding an id to the contract without giving it an
 * effect is a type error rather than a silently inert event.
 */
const EXPEDITION_EVENT_RESULTS: Readonly<
  Record<ExpeditionEventResultId, ExpeditionEventResultEffect>
> = {
  equipment_scuffed: {
    conditionWear: { pa: 4, instruments: 3, stageGear: 3 }
  },
  pa_overloaded: {
    conditionWear: { pa: 15, instruments: 0, stageGear: 0 }
  },
  spare_parts_scavenged: {
    cargoDelta: { spareParts: 1 }
  },
  supplies_spoiled: {
    cargoDelta: { supplies: -1 }
  },
  attention_drawn: {
    heat: 8
  },
  attention_faded: {
    heat: -6
  }
}

/**
 * Narrows an untrusted value to a known event result id.
 *
 * @param value - Raw `result` field from an event effect or a dispatched payload.
 * @returns True when the id has an entry in the registry.
 */
export const isExpeditionEventResultId = (
  value: unknown
): value is ExpeditionEventResultId =>
  typeof value === 'string' && Object.hasOwn(EXPEDITION_EVENT_RESULTS, value)

/**
 * Reads the effect a known result applies.
 *
 * @param resultId - Known result id.
 * @returns The registry entry for that id.
 */
export const getExpeditionEventResultEffect = (
  resultId: ExpeditionEventResultId
): ExpeditionEventResultEffect => EXPEDITION_EVENT_RESULTS[resultId]

/**
 * Filters an untrusted list down to known result ids.
 *
 * @param value - Raw `resultIds` value from a delta envelope or a payload.
 * @returns The known ids, in order and without duplicates.
 *
 * @remarks
 * Duplicates are dropped rather than stacked: one event result is one outcome,
 * so a payload repeating an id must not multiply its effect.
 */
export const sanitizeExpeditionEventResultIds = (
  value: unknown
): ExpeditionEventResultId[] => {
  if (!Array.isArray(value)) return []
  const out: ExpeditionEventResultId[] = []
  for (const entry of value) {
    if (!isExpeditionEventResultId(entry)) continue
    if (out.includes(entry)) continue
    out.push(entry)
  }
  return out
}
