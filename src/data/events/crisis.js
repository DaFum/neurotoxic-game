import { validateCrisisEvent } from '../../utils/eventValidator.js'
import { calculateZealotryEffects } from '../../utils/socialEngine.js'
import { secureRandom } from '../../utils/crypto.js'

// Crisis Events — reputation damage, recovery arcs, and social fallout
// These fire when controversyLevel crosses key thresholds.
// Triggers: 'post_gig' (band/financial pool), 'travel' (band/special pool via arrivalUtils)
/**
 * Erstellt ein Composite-Effektobjekt und fügt diesem einen Cooldown für ein Ereignis hinzu.
 *
 * @param {string} eventId - Kennung des Ereignisses, für das der Cooldown gesetzt wird.
 * @param {Array<object>} effects - Liste von Effekten, die im Composite enthalten sein sollen.
 * @param {string} [description] - Optionale Beschreibung, die dem Composite hinzugefügt wird.
 * @returns {object} Das erzeugte Composite-Objekt mit den kombinierten Effekten und einem angehängten Cooldown.
 */
function createCooldownComposite(eventId, effects, description) {
  const composite = {
    type: 'composite',
    effects: [...effects, { type: 'cooldown', eventId }]
  }
  if (description) {
    composite.description = description
  }
  return composite
}

const rawCrisisEvents = [
  {
    id: 'crisis_bad_review',
    category: 'band',
    tags: ['crisis', 'reputation'],
    title: 'events:crisis_bad_review.title',
    description: 'events:crisis_bad_review.desc',
    trigger: 'post_gig',
    chance: 0.55,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 20 &&
      (gs.band?.harmony ?? 100) < 75 &&
      !(gs.eventCooldowns || []).includes('crisis_bad_review'),
    options: [
      {
        label: 'events:crisis_bad_review.opt1.label',
        effect: createCooldownComposite('crisis_bad_review', [
          { type: 'stat', stat: 'controversyLevel', value: 15 }
        ]),
        outcomeText: 'events:crisis_bad_review.opt1.outcome'
      },
      {
        label: 'events:crisis_bad_review.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: createCooldownComposite(
            'crisis_bad_review',
            [
              { type: 'stat', stat: 'controversyLevel', value: -5 },
              { type: 'stat', stat: 'loyalty', value: 10 }
            ],
            'events:crisis_bad_review.opt2.d_5509'
          ),
          failure: createCooldownComposite(
            'crisis_bad_review',
            [
              { type: 'stat', stat: 'controversyLevel', value: 25 },
              { type: 'stat', stat: 'harmony', value: -5 }
            ],
            'events:crisis_bad_review.opt2.d_0f6b'
          )
        },
        outcomeText: 'events:crisis_bad_review.opt2.outcome'
      },
      {
        label: 'events:crisis_bad_review.opt3.label',
        effect: createCooldownComposite('crisis_bad_review', [
          { type: 'stat', stat: 'controversyLevel', value: -10 },
          { type: 'stat', stat: 'loyalty', value: 15 },
          { type: 'stat', stat: 'harmony', value: 5 }
        ]),
        outcomeText: 'events:crisis_bad_review.opt3.outcome'
      }
    ]
  },
  {
    id: 'crisis_online_backlash',
    category: 'band',
    tags: ['crisis', 'social_media'],
    title: 'events:crisis_online_backlash.title',
    description: 'events:crisis_online_backlash.desc',
    trigger: 'post_gig',
    chance: 0.6,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 50 &&
      !(gs.eventCooldowns || []).includes('crisis_online_backlash'),
    options: [
      {
        label: 'events:crisis_online_backlash.opt1.label',
        effect: createCooldownComposite('crisis_online_backlash', [
          { type: 'stat', stat: 'controversyLevel', value: 10 },
          { type: 'stat', stat: 'harmony', value: -5 }
        ]),
        outcomeText: 'events:crisis_online_backlash.opt1.outcome'
      },
      {
        label: 'events:crisis_online_backlash.opt2.label',
        effect: createCooldownComposite('crisis_online_backlash', [
          { type: 'resource', resource: 'money', value: -250 },
          { type: 'stat', stat: 'controversyLevel', value: -20 }
        ]),
        outcomeText: 'events:crisis_online_backlash.opt2.outcome'
      },
      {
        label: 'events:crisis_online_backlash.opt3.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: createCooldownComposite(
            'crisis_online_backlash',
            [
              { type: 'stat', stat: 'controversyLevel', value: -30 },
              { type: 'stat', stat: 'viral', value: 2 },
              { type: 'stat', stat: 'loyalty', value: 20 }
            ],
            'events:crisis_online_backlash.opt3.d_ab89'
          ),
          failure: createCooldownComposite(
            'crisis_online_backlash',
            [
              { type: 'stat', stat: 'controversyLevel', value: 15 },
              { type: 'stat', stat: 'harmony', value: -5 }
            ],
            'events:crisis_online_backlash.opt3.d_34b9'
          )
        },
        outcomeText: 'events:crisis_online_backlash.opt3.outcome'
      }
    ]
  },
  {
    id: 'crisis_shadowban_scare',
    category: 'band',
    tags: ['crisis', 'shadowban'],
    title: 'events:crisis_shadowban_scare.title',
    description: 'events:crisis_shadowban_scare.desc',
    trigger: 'travel',
    chance: 0.7,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 80 &&
      !(gs.eventCooldowns || []).includes('crisis_shadowban_scare'),
    options: [
      {
        label: 'events:crisis_shadowban_scare.opt1.label',
        effect: createCooldownComposite('crisis_shadowban_scare', [
          { type: 'stat', stat: 'controversyLevel', value: -30 },
          { type: 'stat', stat: 'loyalty', value: -10 },
          { type: 'stat', stat: 'harmony', value: -5 }
        ]),
        outcomeText: 'events:crisis_shadowban_scare.opt1.outcome'
      },
      {
        label: 'events:crisis_shadowban_scare.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: createCooldownComposite(
            'crisis_shadowban_scare',
            [
              { type: 'stat', stat: 'controversyLevel', value: -25 },
              { type: 'stat', stat: 'loyalty', value: 25 }
            ],
            'events:crisis_shadowban_scare.opt2.d_06a9'
          ),
          failure: createCooldownComposite(
            'crisis_shadowban_scare',
            [
              { type: 'stat', stat: 'controversyLevel', value: 15 },
              { type: 'stat', stat: 'harmony', value: -10 }
            ],
            'events:crisis_shadowban_scare.opt2.d_b90e'
          )
        },
        outcomeText: 'events:crisis_shadowban_scare.opt2.outcome'
      },
      {
        label: 'events:crisis_shadowban_scare.opt3.label',
        effect: createCooldownComposite('crisis_shadowban_scare', [
          { type: 'stat', stat: 'controversyLevel', value: 20 },
          { type: 'stat', stat: 'viral', value: 3 },
          { type: 'stat', stat: 'harmony', value: -10 }
        ]),
        outcomeText: 'events:crisis_shadowban_scare.opt3.outcome'
      }
    ]
  },
  {
    id: 'crisis_venue_cancels',
    category: 'financial',
    tags: ['crisis', 'venue'],
    title: 'events:crisis_venue_cancels.title',
    description: 'events:crisis_venue_cancels.desc',
    trigger: 'post_gig',
    chance: 0.5,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 65 &&
      !(gs.eventCooldowns || []).includes('crisis_venue_cancels'),
    options: [
      {
        label: 'events:crisis_venue_cancels.opt1.label',
        effect: createCooldownComposite('crisis_venue_cancels', [
          { type: 'resource', resource: 'money', value: -150 },
          { type: 'stat', stat: 'harmony', value: -5 }
        ]),
        outcomeText: 'events:crisis_venue_cancels.opt1.outcome'
      },
      {
        label: 'events:crisis_venue_cancels.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: createCooldownComposite(
            'crisis_venue_cancels',
            [
              { type: 'stat', stat: 'controversyLevel', value: -5 },
              { type: 'stat', stat: 'loyalty', value: 5 }
            ],
            'events:crisis_venue_cancels.opt2.d_c2c9'
          ),
          failure: createCooldownComposite(
            'crisis_venue_cancels',
            [
              { type: 'resource', resource: 'money', value: -300 },
              { type: 'stat', stat: 'harmony', value: -10 }
            ],
            'events:crisis_venue_cancels.opt2.d_73a7'
          )
        },
        outcomeText: 'events:crisis_venue_cancels.opt2.outcome'
      },
      {
        label: 'events:crisis_venue_cancels.opt3.label',
        effect: createCooldownComposite('crisis_venue_cancels', [
          { type: 'resource', resource: 'money', value: -50 },
          { type: 'stat', stat: 'loyalty', value: 15 },
          { type: 'stat', stat: 'controversyLevel', value: -5 }
        ]),
        outcomeText: 'events:crisis_venue_cancels.opt3.outcome'
      }
    ]
  },
  {
    id: 'crisis_redemption_charity',
    category: 'special',
    tags: ['crisis', 'charity', 'recovery'],
    title: 'events:crisis_redemption_charity.title',
    description: 'events:crisis_redemption_charity.desc',
    trigger: 'travel',
    chance: 0.3,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 40 &&
      !(gs.eventCooldowns || []).includes('crisis_redemption_charity'),
    options: [
      {
        label: 'events:crisis_redemption_charity.opt1.label',
        effect: createCooldownComposite('crisis_redemption_charity', [
          { type: 'stat', stat: 'controversyLevel', value: -25 },
          { type: 'stat', stat: 'loyalty', value: 20 },
          { type: 'stat', stat: 'harmony', value: 10 }
        ]),
        outcomeText: 'events:crisis_redemption_charity.opt1.outcome'
      },
      {
        label: 'events:crisis_redemption_charity.opt2.label',
        effect: createCooldownComposite('crisis_redemption_charity', [
          { type: 'resource', resource: 'money', value: -200 },
          { type: 'stat', stat: 'controversyLevel', value: -15 },
          { type: 'stat', stat: 'loyalty', value: 15 }
        ]),
        outcomeText: 'events:crisis_redemption_charity.opt2.outcome'
      },
      {
        label: 'events:crisis_redemption_charity.opt3.label',
        effect: createCooldownComposite('crisis_redemption_charity', [
          { type: 'stat', stat: 'harmony', value: -3 }
        ]),
        outcomeText: 'events:crisis_redemption_charity.opt3.outcome'
      }
    ]
  },
  {
    id: 'crisis_sponsor_ultimatum',
    category: 'financial',
    tags: ['crisis', 'sponsorship'],
    title: 'events:crisis_sponsor_ultimatum.title',
    description: 'events:crisis_sponsor_ultimatum.desc',
    trigger: 'post_gig',
    chance: 0.8,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 80 &&
      (gs.social?.activeDeals?.length ?? 0) > 0 &&
      !(gs.eventCooldowns || []).includes('crisis_sponsor_ultimatum'),
    options: [
      {
        label: 'events:crisis_sponsor_ultimatum.opt1.label',
        effect: createCooldownComposite('crisis_sponsor_ultimatum', [
          { type: 'stat', stat: 'controversyLevel', value: -10 },
          { type: 'stat', stat: 'harmony', value: -5 }
        ]),
        outcomeText: 'events:crisis_sponsor_ultimatum.opt1.outcome'
      },
      {
        label: 'events:crisis_sponsor_ultimatum.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: createCooldownComposite(
            'crisis_sponsor_ultimatum',
            [
              { type: 'stat', stat: 'viral', value: 3 },
              { type: 'stat', stat: 'loyalty', value: 30 },
              { type: 'stat', stat: 'controversyLevel', value: -10 }
            ],
            'events:crisis_sponsor_ultimatum.opt2.d_0dd7'
          ),
          failure: createCooldownComposite(
            'crisis_sponsor_ultimatum',
            [
              { type: 'resource', resource: 'money', value: -500 },
              { type: 'stat', stat: 'controversyLevel', value: 20 }
            ],
            'events:crisis_sponsor_ultimatum.opt2.d_cc26'
          )
        },
        outcomeText: 'events:crisis_sponsor_ultimatum.opt2.outcome'
      },
      {
        label: 'events:crisis_sponsor_ultimatum.opt3.label',
        effect: createCooldownComposite('crisis_sponsor_ultimatum', [
          { type: 'resource', resource: 'money', value: -100 },
          { type: 'stat', stat: 'controversyLevel', value: -5 }
        ]),
        outcomeText: 'events:crisis_sponsor_ultimatum.opt3.outcome'
      }
    ]
  },
  {
    id: 'crisis_poor_performance',
    category: 'band',
    tags: ['crisis', 'performance'],
    title: 'events:crisis_poor_performance.title',
    description: 'events:crisis_poor_performance.desc',
    trigger: 'post_gig',
    chance: 1.0,
    condition: gs =>
      (gs.lastGigStats?.score ?? 100) < 30 &&
      !gs.eventCooldowns?.includes('crisis_poor_performance'),
    options: [
      {
        label: 'events:crisis_poor_performance.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: createCooldownComposite(
            'crisis_poor_performance',
            [
              { type: 'stat', stat: 'controversyLevel', value: 5 },
              { type: 'stat', stat: 'harmony', value: 5 }
            ],
            'events:crisis_poor_performance.opt1.d_04df'
          ),
          failure: createCooldownComposite(
            'crisis_poor_performance',
            [
              { type: 'stat', stat: 'controversyLevel', value: 20 },
              { type: 'stat', stat: 'loyalty', value: -10 }
            ],
            'events:crisis_poor_performance.opt1.d_b07b'
          )
        },
        outcomeText: 'events:crisis_poor_performance.opt1.outcome'
      },
      {
        label: 'events:crisis_poor_performance.opt2.label',
        effect: createCooldownComposite('crisis_poor_performance', [
          { type: 'stat', stat: 'loyalty', value: 10 },
          { type: 'stat', stat: 'controversyLevel', value: -5 }
        ]),
        outcomeText: 'events:crisis_poor_performance.opt2.outcome'
      }
    ]
  },
  {
    id: 'crisis_leaked_story',
    category: 'band',
    tags: ['crisis', 'scandal'],
    title: 'events:crisis_leaked_story.title',
    description: 'events:crisis_leaked_story.desc',
    trigger: 'travel',
    chance: 0.4,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 60 &&
      !(gs.eventCooldowns || []).includes('crisis_leaked_story'),
    options: [
      {
        label: 'events:crisis_leaked_story.opt1.label',
        effect: createCooldownComposite('crisis_leaked_story', [
          { type: 'stat', stat: 'controversyLevel', value: -15 },
          { type: 'stat', stat: 'loyalty', value: -20 }
        ]),
        outcomeText: 'events:crisis_leaked_story.opt1.outcome'
      },
      {
        label: 'events:crisis_leaked_story.opt2.label',
        effect: createCooldownComposite('crisis_leaked_story', [
          { type: 'stat', stat: 'controversyLevel', value: 15 },
          { type: 'stat', stat: 'harmony', value: -10 }
        ]),
        outcomeText: 'events:crisis_leaked_story.opt2.outcome'
      }
    ]
  },
  {
    id: 'crisis_mass_unfollow',
    category: 'band',
    tags: ['crisis', 'social_media'],
    title: 'events:crisis_mass_unfollow.title',
    description: 'events:crisis_mass_unfollow.desc',
    trigger: 'post_gig',
    chance: 0.5,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 75 &&
      !gs.eventCooldowns?.includes('crisis_mass_unfollow'),
    options: [
      {
        label: 'events:crisis_mass_unfollow.opt1.label',
        effect: createCooldownComposite('crisis_mass_unfollow', [
          { type: 'stat', stat: 'loyalty', value: 5 },
          { type: 'stat', stat: 'harmony', value: -10 }
        ]),
        outcomeText: 'events:crisis_mass_unfollow.opt1.outcome'
      }
    ]
  },
  {
    id: 'crisis_ego_clash',
    category: 'band',
    tags: ['crisis', 'ego', 'drama'],
    title: 'events:crisis_ego_clash.title',
    description: 'events:crisis_ego_clash.desc',
    trigger: 'travel',
    chance: 0.6,
    condition: gs =>
      gs.social?.egoFocus != null &&
      (gs.band?.harmony ?? 100) < 40 &&
      !(gs.eventCooldowns || []).includes('crisis_ego_clash'),
    options: [
      {
        label: 'events:crisis_ego_clash.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: createCooldownComposite(
            'crisis_ego_clash',
            [
              { type: 'stat', stat: 'harmony', value: 20 },
              { type: 'stat', stat: 'controversyLevel', value: -5 }
            ],
            'events:crisis_ego_clash.opt1.d_26fc'
          ),
          failure: createCooldownComposite(
            'crisis_ego_clash',
            [
              { type: 'stat', stat: 'harmony', value: -15 },
              { type: 'stat', stat: 'mood', value: -10 }
            ],
            'events:crisis_ego_clash.opt1.d_7dcd'
          )
        },
        outcomeText: 'events:crisis_ego_clash.opt1.outcome'
      },
      {
        label: 'events:crisis_ego_clash.opt2.label',
        effect: createCooldownComposite('crisis_ego_clash', [
          { type: 'stat', stat: 'harmony', value: -8 },
          { type: 'stat', stat: 'controversyLevel', value: 10 }
        ]),
        outcomeText: 'events:crisis_ego_clash.opt2.outcome'
      }
    ]
  },
  {
    id: 'crisis_notice_50',
    category: 'band',
    tags: ['crisis', 'milestone'],
    title: 'events:crisis_notice_50.title',
    description: 'events:crisis_notice_50.desc',
    trigger: 'post_gig',
    chance: 1.0,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 50 &&
      !gs.activeStoryFlags?.includes('saw_crisis_50'),
    options: [
      {
        label: 'events:crisis_notice_50.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'saw_crisis_50' },
            { type: 'stat', stat: 'fame', value: -10 },
            { type: 'stat', stat: 'mood', value: -5 }
          ]
        },
        outcomeText: 'events:crisis_notice_50.opt1.outcome'
      }
    ]
  },
  {
    id: 'crisis_notice_80',
    category: 'band',
    tags: ['crisis', 'milestone'],
    title: 'events:crisis_notice_80.title',
    description: 'events:crisis_notice_80.desc',
    trigger: 'post_gig',
    chance: 1.0,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 80 &&
      !gs.activeStoryFlags?.includes('saw_crisis_80'),
    options: [
      {
        label: 'events:crisis_notice_80.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'saw_crisis_80' },
            { type: 'stat', stat: 'fame', value: -25 },
            { type: 'stat', stat: 'stamina', value: -5 }
          ]
        },
        outcomeText: 'events:crisis_notice_80.opt1.outcome'
      }
    ]
  },
  {
    id: 'crisis_notice_100',
    category: 'band',
    tags: ['crisis', 'milestone'],
    title: 'events:crisis_notice_100.title',
    description: 'events:crisis_notice_100.desc',
    trigger: 'post_gig',
    chance: 1.0,
    condition: gs =>
      (gs.social?.controversyLevel ?? 0) >= 100 &&
      !gs.activeStoryFlags?.includes('saw_crisis_100'),
    options: [
      {
        label: 'events:crisis_notice_100.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'saw_crisis_100' },
            { type: 'stat', stat: 'fame', value: -50 },
            { type: 'stat', stat: 'mood', value: -10 }
          ]
        },
        outcomeText: 'events:crisis_notice_100.opt1.outcome'
      }
    ]
  },
  {
    id: 'crisis_police_raid_zealotry',
    category: 'special',
    tags: ['crisis', 'raid', 'cult'],
    title: 'events:crisis_police_raid_zealotry.title',
    description: 'events:crisis_police_raid_zealotry.desc',
    trigger: 'post_gig',
    // The chance is explicitly set to the computed raidProbability from our new feature
    chance: 1.0,
    condition: gs => {
      if ((gs.social?.zealotry ?? 0) === 0) return false
      if ((gs.eventCooldowns || []).includes('crisis_police_raid_zealotry'))
        return false
      const { raidProbability } = calculateZealotryEffects(gs.social.zealotry)
      // Return true only if secureRandom() < raidProbability
      // eventEngine checks `condition` before `chance`.
      return secureRandom() < raidProbability
    },
    options: [
      {
        label: 'events:crisis_police_raid_zealotry.opt1.label',
        effect: createCooldownComposite('crisis_police_raid_zealotry', [
          { type: 'resource', resource: 'money', value: -500 }
        ]),
        outcomeText: 'events:crisis_police_raid_zealotry.opt1.outcome'
      },
      {
        label: 'events:crisis_police_raid_zealotry.opt2.label',
        effect: createCooldownComposite('crisis_police_raid_zealotry', [
          { type: 'stat', stat: 'controversyLevel', value: 30 }
        ]),
        outcomeText: 'events:crisis_police_raid_zealotry.opt2.outcome'
      }
    ]
  }
]

export const CRISIS_EVENTS = rawCrisisEvents.filter(validateCrisisEvent)
