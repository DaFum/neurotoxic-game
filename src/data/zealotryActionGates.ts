import { HIGH_CONTROVERSY_THRESHOLD } from '../utils/socialThresholds'

/**
 * Social-state gates for the once-per-day zealotry actions.
 *
 * @remarks
 * Single source of truth shared by the hook configs (`useDarkWebLeak`,
 * `useCultIndoctrination`, `useVoidSermon`), which use them for the UI eligibility check,
 * and by `applyZealotryAction` in `socialReducer`, which enforces them so a raw
 * dispatch cannot skip the gate. Repeat execution is bounded by daily caps, cash cost,
 * and band harmony drain (see `docs/balance/void-sermon-tuning.md`).
 */

/**
 * Minimum `social.controversyLevel` required for a dark-web leak: the shared
 * high-controversy tier (`BALANCE_CONFIG.social.highControversyThreshold`).
 */
export const DARK_WEB_LEAK_REQUIRED_CONTROVERSY = HIGH_CONTROVERSY_THRESHOLD

/** Minimum `social.zealotry` required for a cult indoctrination. */
export const CULT_INDOCTRINATION_REQUIRED_ZEALOTRY = 50

/** Minimum `social.zealotry` required for a void sermon. */
export const VOID_SERMON_REQUIRED_ZEALOTRY = 35
