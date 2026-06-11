import type { RandomFn } from '../../types/callbacks'
import type {
  BrandOfferUrgency,
  SocialEngineGameState
} from '../../types/social'
import { finiteNumberOr } from '../gameState'

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
  } else if (controversy >= 50) {
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
