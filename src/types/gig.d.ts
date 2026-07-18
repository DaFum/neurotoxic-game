/**
 * Pre-gig modifier flags applied to gig setup and calculations.
 */
export interface GigModifiers {
  promo: boolean
  soundcheck: boolean
  merch: boolean
  catering: boolean
  guestlist: boolean
  [key: string]: boolean
}

/**
 * Persisted summary of the most recent completed gig.
 */
export interface PostGigSummary extends UnknownRecord {
  score?: number
  misses?: number
  accuracy?: number
  combo?: number
  health?: number
  overload?: number
  maxCombo?: number
  /** True when the gig ended via the health-zero fail path; failed gigs must never count as good gigs. */
  failed?: boolean
  songStats?: Array<{ songId: string; score: number; accuracy: number }>
  toastId?: string
  events?: string[]
}
