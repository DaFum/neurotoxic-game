import type { Platform } from '../types/social'

type SocialPlatformConfig = {
  id: Platform
  label: string
  multiplier: number
}

/**
 * Supported social platforms and their follower-growth multipliers.
 */
export const SOCIAL_PLATFORMS = {
  INSTAGRAM: { id: 'instagram', label: 'Instagram', multiplier: 1.2 },
  TIKTOK: { id: 'tiktok', label: 'TikTok', multiplier: 1.5 }, // Volatile
  YOUTUBE: { id: 'youtube', label: 'YouTube', multiplier: 0.8 },
  NEWSLETTER: { id: 'newsletter', label: 'Newsletter', multiplier: 0.5 }
} as const satisfies Record<Uppercase<Platform>, SocialPlatformConfig>

/**
 * Set of supported social platform ids for runtime validation.
 */
export const SOCIAL_PLATFORM_IDS = new Set<Platform>(
  Object.values(SOCIAL_PLATFORMS).map(platform => platform.id)
)
