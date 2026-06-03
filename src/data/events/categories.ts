export const EVENT_CATEGORIES = [
  'transport',
  'band',
  'gig',
  'financial',
  'special'
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]
