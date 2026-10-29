import type { RandomFn } from '../../types/callbacks'
import type {
  BrandOfferUrgency,
  SocialEngineGameState
} from '../../types/social'
import { finiteNumberOr } from '../gameState'
import { SCANDAL_CONTROVERSY_THRESHOLD } from '../socialThresholds'

// ─── Contextual Hooks ────────────────────────────────────────────────────

type HookId =
  | 'standard'
  | 'controversy_high'
  | 'trend_match'
  | 'famous'
  | 'desperate'
  | 'newcomer'

const HOOK_DEFAULTS: Record<HookId, string> = {
  standard: 'They reached out cold. The pitch deck looks polished.',
  controversy_high:
    'They want to monetize your scandal before the news cycle moves on.',
  trend_match:
    'The algorithm flagged you. They want in before everyone else does.',
  famous: 'Your name opens doors now. They came knocking.',
  desperate: 'They’re running out of options — and they need you tonight.',
  newcomer: 'A scout caught a clip. Small offer, but it’s a foot in the door.'
}

/**
 * Selects a contextual brand offer hook based on the current social and player state.
 *
 * @remarks
 * This function evaluates the player's fame, controversy, social trends, and overall follower count
 * to determine the most appropriate narrative hook for a brand offer. It also assigns an urgency
 * level which dictates how the brand offer is presented.
 *
 * @param gameState - The current state of the game, including social metrics and player status
 * @param isStretched - Indicates if the player's resources or capabilities are currently overextended
 * @param totalFollowers - The cumulative number of followers the player has acquired
 * @param rng - A random number generator function for evaluating probabilistic outcomes
 * @returns An object containing the localization key, default flavor text, and urgency of the chosen hook
 */
export const pickContextualHook = (
  gameState: SocialEngineGameState,
  isStretched: boolean,
  totalFollowers: number,
  rng: RandomFn
): { key: string; default: string; urgency: BrandOfferUrgency } => {
  const social = gameState.social ?? {}
  const controversy = finiteNumberOr(gameState.social?.controversyLevel, 0)
  const fame = finiteNumberOr(gameState.player?.fame, 0)

  let chosen: HookId
  let urgency: BrandOfferUrgency

  if (isStretched) {
    chosen = totalFollowers < 1500 ? 'newcomer' : 'desperate'
    urgency = 'high'
  } else if (controversy >= SCANDAL_CONTROVERSY_THRESHOLD) {
    chosen = 'controversy_high'
    urgency = 'high'
  } else if (fame > 1000 || totalFollowers > 10000) {
    chosen = 'famous'
    urgency = 'low'
  } else if (social.trend && social.trend !== 'NEUTRAL') {
    chosen = 'trend_match'
    urgency = 'medium'
  } else {
    chosen = 'standard'
    urgency = rng() < 0.25 ? 'high' : 'medium'
  }

  return {
    key: `economy:brandFlavor.hooks.${chosen}`,
    default: HOOK_DEFAULTS[chosen],
    urgency
  }
}
