/** Event categories accepted by the event registry and event trigger system. */
export const EVENT_CATEGORIES = [
  'transport',
  'band',
  'gig',
  'financial',
  'special'
] as const

/** Union of event category ids. */
export type EventCategory = (typeof EVENT_CATEGORIES)[number]
