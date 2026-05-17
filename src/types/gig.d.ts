export interface GigModifiers {
  promo: boolean
  soundcheck: boolean
  merch: boolean
  catering: boolean
  guestlist: boolean
  [key: string]: boolean
}

export interface PostGigSummary extends UnknownRecord {
  score?: number
  misses?: number
  accuracy?: number
  combo?: number
  health?: number
  overload?: number
  maxCombo?: number
  songStats?: Array<{ songId: string; score: number; accuracy: number }>
  toastId?: string
}
