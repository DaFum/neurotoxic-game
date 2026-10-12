import type { GameState } from '../../types'
import { hasStateItem } from '../../utils/gameState'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { isHighControversy } from '../../utils/socialThresholds'

import { QUEST_APOLOGY_TOUR, QUEST_EGO_MANAGEMENT } from '../questsConstants'
import { QuestOfferEngine } from '../../domain/questOfferEngine'
import { isOnCooldown } from '../../utils/gameState'
import { FLAGS, type StoryFlag } from '../flags.registry'

/**
 * Authored chance of a story-arc aftermath beat. Each beat declares its arc
 * outcome as `requiredFlag`, which `selectEvent` multiplies by 5 while the
 * flag is active, for an effective 10% when the beat is rolled.
 *
 * @remarks
 * Outcome flags persist, so up to four beats can be eligible at the same
 * trigger at once. Kept low so their combined weight (at most 0.4) leaves the
 * rest of the pool and the "no event" share intact instead of saturating
 * `selectEvent`'s roll.
 */
const STORY_AFTERMATH_CHANCE = 0.02

/** Days before the same aftermath beat may recur after it resolves. */
const STORY_AFTERMATH_COOLDOWN_DAYS = 30

type StoryAftermathEffect = { stat: string; value: number }

/**
 * Builds an aftermath beat that only becomes eligible once its arc outcome
 * flag is set, so finishing or failing a story arc changes later events.
 * Effects stay small and non-lethal; every option starts the shared cooldown.
 */
const createStoryAftermathEvent = (
  id: string,
  flag: StoryFlag,
  trigger: 'travel' | 'post_gig',
  options: readonly (readonly StoryAftermathEffect[])[]
) => ({
  id,
  category: 'band',
  tags: ['story', 'aftermath'],
  title: `events:${id}.title`,
  description: `events:${id}.desc`,
  trigger,
  chance: STORY_AFTERMATH_CHANCE,
  requiredFlag: flag,
  condition: (state: GameState) => hasStateItem(state.activeStoryFlags, flag),
  options: options.map((effects, index) => ({
    label: `events:${id}.opt${index + 1}.label`,
    effect: {
      type: 'composite',
      effects: [
        ...effects.map(({ stat, value }) => ({ type: 'stat', stat, value })),
        {
          type: 'cooldown',
          eventId: id,
          value: STORY_AFTERMATH_COOLDOWN_DAYS
        }
      ]
    },
    outcomeText: `events:${id}.opt${index + 1}.outcome`
  }))
})

/**
 * Story-arc aftermath beats: one per quest outcome flag (plus the in-progress
 * Prove Yourself arc), each gated on and weighted by that flag.
 */
const STORY_AFTERMATH_EVENTS = [
  createStoryAftermathEvent(
    'aftermath_apology_tour_failed',
    FLAGS.APOLOGY_TOUR_FAILED,
    'post_gig',
    [
      [
        { stat: 'controversyLevel', value: -3 },
        { stat: 'harmony', value: -2 }
      ],
      [{ stat: 'loyalty', value: -3 }]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_back_from_pit_complete',
    FLAGS.BACK_FROM_PIT_COMPLETE,
    'post_gig',
    [
      [
        { stat: 'loyalty', value: 5 },
        { stat: 'harmony', value: 2 }
      ],
      [{ stat: 'fame', value: 10 }]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_back_from_pit_failed',
    FLAGS.BACK_FROM_PIT_FAILED,
    'post_gig',
    [
      [
        { stat: 'harmony', value: -2 },
        { stat: 'loyalty', value: 3 }
      ],
      [{ stat: 'loyalty', value: -4 }]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_band_pact_complete',
    FLAGS.BAND_PACT_COMPLETE,
    'travel',
    [
      [{ stat: 'harmony', value: 5 }],
      [
        { stat: 'mood', value: 5 },
        { stat: 'harmony', value: 2 }
      ]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_band_pact_failed',
    FLAGS.BAND_PACT_FAILED,
    'travel',
    [
      [
        { stat: 'harmony', value: 3 },
        { stat: 'mood', value: -3 }
      ],
      [{ stat: 'harmony', value: -4 }]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_ego_crisis_resolved',
    FLAGS.EGO_CRISIS_RESOLVED,
    'travel',
    [
      [{ stat: 'harmony', value: 4 }],
      [
        { stat: 'mood', value: 4 },
        { stat: 'harmony', value: 1 }
      ]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_ego_crisis_failed',
    FLAGS.EGO_CRISIS_FAILED,
    'travel',
    [
      [
        { stat: 'harmony', value: 2 },
        { stat: 'stamina', value: -5 }
      ],
      [
        { stat: 'harmony', value: -4 },
        { stat: 'controversyLevel', value: 2 }
      ]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_prove_yourself_active',
    FLAGS.PROVE_YOURSELF_ACTIVE,
    'travel',
    [
      [
        { stat: 'stamina', value: -5 },
        { stat: 'harmony', value: 2 }
      ],
      [
        { stat: 'viral', value: 1 },
        { stat: 'controversyLevel', value: 2 }
      ]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_prove_yourself_complete',
    FLAGS.PROVE_YOURSELF_COMPLETE,
    'post_gig',
    [[{ stat: 'fame', value: 15 }], [{ stat: 'loyalty', value: 5 }]]
  ),
  createStoryAftermathEvent(
    'aftermath_prove_yourself_failed',
    FLAGS.PROVE_YOURSELF_FAILED,
    'post_gig',
    [
      [{ stat: 'mood', value: -3 }],
      [
        { stat: 'controversyLevel', value: 4 },
        { stat: 'viral', value: 1 }
      ]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_sincere_redemption_complete',
    FLAGS.SINCERE_REDEMPTION_COMPLETE,
    'post_gig',
    [
      [
        { stat: 'loyalty', value: 6 },
        { stat: 'stamina', value: -5 }
      ],
      [
        { stat: 'loyalty', value: 3 },
        { stat: 'viral', value: 1 }
      ]
    ]
  ),
  createStoryAftermathEvent(
    'aftermath_sincere_redemption_failed',
    FLAGS.SINCERE_REDEMPTION_FAILED,
    'post_gig',
    [
      [
        { stat: 'loyalty', value: 2 },
        { stat: 'harmony', value: -2 }
      ],
      [{ stat: 'loyalty', value: -4 }]
    ]
  )
]

/** Raw consequence event definitions consumed by the event registry. */
export const CONSEQUENCE_EVENTS = [
  {
    id: 'consequences_venue_complaint',
    category: 'financial',
    title: 'events:consequences_venue_complaint.title',
    description: 'events:consequences_venue_complaint.desc',
    trigger: 'post_gig',
    chance: 0.85,
    condition: (state: GameState) => {
      // Bad-gig gating uses 0–100 accuracy (or the failed flag); the raw
      // rhythm score reaches thousands and would never trip a < 30 check.
      // Missing accuracy (pre-accuracy saves) falls back to 100 so the
      // consequence never false-positives — same as crisis_poor_performance.
      const accuracy = finiteNumberOr(state.lastGigStats?.accuracy, 100)
      return (
        (state.lastGigStats?.failed === true || accuracy < 30) &&
        !hasStateItem(state.eventCooldowns, 'consequences_venue_complaint')
      )
    },
    options: [
      {
        label: 'events:consequences_venue_complaint.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -100 },
            { type: 'stat', stat: 'controversyLevel', value: -10 },
            { type: 'stat', stat: 'loyalty', value: 5 },
            { type: 'cooldown', eventId: 'consequences_venue_complaint' }
          ]
        },
        outcomeText: 'events:consequences_venue_complaint.opt1.outcome'
      },
      {
        label: 'events:consequences_venue_complaint.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: 15 },
            { type: 'stat', stat: 'harmony', value: -5 },
            { type: 'cooldown', eventId: 'consequences_venue_complaint' }
          ]
        },
        outcomeText: 'events:consequences_venue_complaint.opt2.outcome'
      },
      {
        label: 'events:consequences_venue_complaint.opt3.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: -5 },
              { type: 'stat', stat: 'loyalty', value: 10 },
              { type: 'cooldown', eventId: 'consequences_venue_complaint' }
            ],
            description: 'events:consequences_venue_complaint.opt3.d_53d0'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: 20 },
              { type: 'stat', stat: 'harmony', value: -10 },
              { type: 'cooldown', eventId: 'consequences_venue_complaint' }
            ],
            description: 'events:consequences_venue_complaint.opt3.d_d21d'
          }
        },
        outcomeText: 'events:consequences_venue_complaint.opt3.outcome'
      }
    ]
  },
  {
    id: 'consequences_ticket_sales_collapse',
    category: 'financial',
    title: 'events:consequences_ticket_sales_collapse.title',
    description: 'events:consequences_ticket_sales_collapse.desc',
    trigger: 'post_gig',
    chance: 0.7,
    condition: (state: GameState) => {
      const consecutiveBadShows = finiteNumberOr(
        state.player?.stats?.consecutiveBadShows,
        0
      )
      return (
        consecutiveBadShows >= 2 &&
        isHighControversy(state.social?.controversyLevel) &&
        !hasStateItem(
          state.eventCooldowns,
          'consequences_ticket_sales_collapse'
        )
      )
    },
    options: [
      {
        label: 'events:consequences_ticket_sales_collapse.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: FLAGS.DISCOUNTED_TICKETS_ACTIVE },
            { type: 'stat', stat: 'loyalty', value: 10 },
            { type: 'cooldown', eventId: 'consequences_ticket_sales_collapse' }
          ]
        },
        outcomeText: 'events:consequences_ticket_sales_collapse.opt1.outcome'
      },
      {
        label: 'events:consequences_ticket_sales_collapse.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -150 },
            { type: 'stat', stat: 'controversyLevel', value: -5 },
            { type: 'cooldown', eventId: 'consequences_ticket_sales_collapse' }
          ]
        },
        outcomeText: 'events:consequences_ticket_sales_collapse.opt2.outcome'
      }
    ]
  },
  {
    id: 'consequences_bandmate_scandal',
    category: 'band',
    title: 'events:consequences_bandmate_scandal.title',
    description: 'events:consequences_bandmate_scandal.desc',
    trigger: 'post_gig',
    chance: 0.75,
    condition: (state: GameState) => {
      if (
        state.social?.egoFocus != null &&
        finiteNumberOr(state.social?.controversyLevel, 0) >= 30 &&
        !hasStateItem(state.eventCooldowns, 'consequences_bandmate_scandal')
      ) {
        return { egoFocus: state.social.egoFocus }
      }
      return false
    },
    options: [
      {
        label: 'events:consequences_bandmate_scandal.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: 20 },
            { type: 'stat', stat: 'harmony', value: 10 },
            { type: 'stat', stat: 'loyalty', value: 15 },
            { type: 'cooldown', eventId: 'consequences_bandmate_scandal' }
          ]
        },
        outcomeText: 'events:consequences_bandmate_scandal.opt1.outcome'
      },
      {
        label: 'events:consequences_bandmate_scandal.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: -10 },
            { type: 'stat', stat: 'harmony', value: -20 },
            { type: 'social_set', stat: 'egoFocus', value: null },
            { type: 'cooldown', eventId: 'consequences_bandmate_scandal' }
          ]
        },
        outcomeText: 'events:consequences_bandmate_scandal.opt2.outcome'
      },
      {
        label: 'events:consequences_bandmate_scandal.opt3.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: -25 },
              { type: 'stat', stat: 'loyalty', value: 30 },
              { type: 'stat', stat: 'viral', value: 2 },
              { type: 'cooldown', eventId: 'consequences_bandmate_scandal' }
            ],
            description: 'events:consequences_bandmate_scandal.opt3.d_fc96'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: 25 },
              { type: 'stat', stat: 'harmony', value: -15 },
              { type: 'cooldown', eventId: 'consequences_bandmate_scandal' }
            ],
            description: 'events:consequences_bandmate_scandal.opt3.d_133d'
          }
        },
        outcomeText: 'events:consequences_bandmate_scandal.opt3.outcome'
      }
    ]
  },
  {
    id: 'consequences_cancel_culture_quest',
    category: 'special',
    title: 'events:consequences_cancel_culture_quest.title',
    description: 'events:consequences_cancel_culture_quest.desc',
    trigger: 'post_gig',
    chance: 0.9,
    condition: (state: GameState) => {
      const controversy = finiteNumberOr(state.social?.controversyLevel, 0)
      const flags = state.activeStoryFlags || []
      // canOfferQuest mirrors addQuest gating (active quest, completion,
      // failure-retry cooldown), so the offer never surfaces while the
      // post-gig addQuest dispatch would silently refuse the quest.
      return (
        controversy >= 85 &&
        !hasStateItem(flags, FLAGS.CANCEL_QUEST_ACTIVE) &&
        QuestOfferEngine.canOfferQuest(state, QUEST_APOLOGY_TOUR)
      )
    },
    options: [
      {
        label: 'events:consequences_cancel_culture_quest.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: FLAGS.CANCEL_QUEST_ACTIVE },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'events:consequences_cancel_culture_quest.opt1.outcome'
      },
      {
        label: 'events:consequences_cancel_culture_quest.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: -40 },
            { type: 'stat', stat: 'loyalty', value: -30 },
            { type: 'stat', stat: 'harmony', value: -15 }
          ]
        },
        outcomeText: 'events:consequences_cancel_culture_quest.opt2.outcome'
      }
    ]
  },
  {
    id: 'consequences_ego_breakup_threat',
    category: 'band',
    title: 'events:consequences_ego_breakup_threat.title',
    description: 'events:consequences_ego_breakup_threat.desc',
    trigger: 'travel',
    chance: 0.8,
    condition: (state: GameState) => {
      // Decline path (opt2) writes an event cooldown; quest failure writes a
      // questCooldowns retry entry. canOfferQuest covers the latter plus
      // active/completed gating, isOnCooldown covers the former.
      if (isOnCooldown(state, 'ego_management_retry')) return false
      if (!QuestOfferEngine.canOfferQuest(state, QUEST_EGO_MANAGEMENT)) {
        return false
      }

      const harmony = finiteNumberOr(state.band?.harmony, 0)
      const egoFocus = state.social?.egoFocus || null
      const flags = state.activeStoryFlags || []
      return (
        egoFocus != null &&
        harmony < 25 &&
        !hasStateItem(flags, FLAGS.BREAKUP_QUEST_ACTIVE)
      )
    },
    options: [
      {
        label: 'events:consequences_ego_breakup_threat.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: FLAGS.BREAKUP_QUEST_ACTIVE },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'events:consequences_ego_breakup_threat.opt1.outcome'
      },
      {
        label: 'events:consequences_ego_breakup_threat.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'score', value: -1000 },
            { type: 'stat', stat: 'harmony', value: -25 },
            { type: 'stat', stat: 'controversyLevel', value: 10 },
            { type: 'stat', stat: 'loyalty', value: -15 },
            { type: 'flag', flag: FLAGS.EGO_CRISIS_FAILED },
            { type: 'cooldown', eventId: 'ego_management_retry', value: 10 }
          ]
        },
        outcomeText: 'events:consequences_ego_breakup_threat.opt2.outcome'
      }
    ]
  },
  {
    id: 'consequences_comeback_album',
    category: 'special',
    title: 'events:consequences_comeback_album.title',
    description: 'events:consequences_comeback_album.desc',
    trigger: 'post_gig',
    chance: 1.0,
    condition: (state: GameState) => {
      return (
        hasStateItem(state.pendingEvents, 'consequences_comeback_album') &&
        !hasStateItem(state.activeStoryFlags, FLAGS.COMEBACK_TRIGGERED)
      )
    },
    options: [
      {
        label: 'events:consequences_comeback_album.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: FLAGS.COMEBACK_TRIGGERED },
            { type: 'resource', resource: 'money', value: 300 },
            { type: 'stat', stat: 'fame', value: 100 },
            { type: 'stat', stat: 'loyalty', value: 20 },
            { type: 'stat', stat: 'controversyLevel', value: -15 }
          ]
        },
        outcomeText: 'events:consequences_comeback_album.opt1.outcome'
      },
      {
        label: 'events:consequences_comeback_album.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: FLAGS.COMEBACK_TRIGGERED },
            { type: 'stat', stat: 'loyalty', value: 25 },
            { type: 'stat', stat: 'viral', value: 2 }
          ]
        },
        outcomeText: 'events:consequences_comeback_album.opt2.outcome'
      }
    ]
  },
  {
    // Queue-only consequence: quest failure penalties enqueue this id via
    // `{ type: 'event.queue', eventId: 'event_bad_press' }` (questRegistry).
    id: 'event_bad_press',
    category: 'special',
    title: 'events:event_bad_press.title',
    description: 'events:event_bad_press.desc',
    trigger: 'post_gig',
    chance: 1.0,
    condition: (state: GameState) =>
      hasStateItem(state.pendingEvents, 'event_bad_press'),
    options: [
      {
        label: 'events:event_bad_press.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -150 },
            { type: 'stat', stat: 'controversyLevel', value: -10 },
            { type: 'stat', stat: 'loyalty', value: 5 }
          ]
        },
        outcomeText: 'events:event_bad_press.opt1.outcome'
      },
      {
        label: 'events:event_bad_press.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: 15 },
            { type: 'stat', stat: 'viral', value: 2 }
          ]
        },
        outcomeText: 'events:event_bad_press.opt2.outcome'
      }
    ]
  },
  ...STORY_AFTERMATH_EVENTS
]
