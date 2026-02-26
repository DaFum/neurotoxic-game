/**
 * Consequences Event Pool
 */

export const CONSEQUENCE_EVENTS = [
  {
    id: 'consequences_venue_complaint',
    category: 'financial',
    title: 'events:consequences_venue_complaint.title',
    description: 'events:consequences_venue_complaint.desc',
    trigger: 'post_gig',
    chance: 0.85,
    condition: state => {
      const score = state.lastGigStats?.score ?? 0
      return (
        score < 30 &&
        !(state.eventCooldowns || []).includes('consequences_venue_complaint')
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
        }
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
    condition: state => {
      const consecutiveBadShows = state.player?.stats?.consecutiveBadShows || 0
      const controversy = state.social?.controversyLevel || 0
      return (
        consecutiveBadShows >= 2 &&
        controversy >= 40 &&
        !(state.eventCooldowns || []).includes(
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
            { type: 'flag', flag: 'discounted_tickets_active' },
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
    condition: state => {
      if (
        state.social?.egoFocus != null &&
        (state.social?.controversyLevel || 0) >= 30 &&
        !(state.eventCooldowns || []).includes('consequences_bandmate_scandal')
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
        }
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
    condition: state => {
      const controversy = state.social?.controversyLevel || 0
      const flags = state.activeStoryFlags || []
      const quests = state.activeQuests || []
      return (
        controversy >= 85 &&
        !flags.includes('cancel_quest_active') &&
        !quests.some(q => q.id === 'quest_apology_tour')
      )
    },
    options: [
      {
        label: 'events:consequences_cancel_culture_quest.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'cancel_quest_active' },
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
    condition: state => {
      const harmony = state.band?.harmony || 0
      const egoFocus = state.social?.egoFocus || null
      const flags = state.activeStoryFlags || []
      return (
        egoFocus !== null &&
        harmony < 25 &&
        !flags.includes('breakup_quest_active')
      )
    },
    options: [
      {
        label: 'events:consequences_ego_breakup_threat.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'breakup_quest_active' },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'events:consequences_ego_breakup_threat.opt1.outcome'
      },
      {
        label: 'events:consequences_ego_breakup_threat.opt2.label',
        effect: { type: 'game_over' },
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
    condition: state => {
      return (
        (state.pendingEvents || []).includes('consequences_comeback_album') &&
        !(state.activeStoryFlags || []).includes('comeback_triggered')
      )
    },
    options: [
      {
        label: 'events:consequences_comeback_album.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'comeback_triggered' },
            { type: 'resource', resource: 'money', value: 500 },
            { type: 'stat', stat: 'fame', value: 200 },
            { type: 'stat', stat: 'loyalty', value: 25 },
            { type: 'stat', stat: 'controversyLevel', value: -20 }
          ]
        },
        outcomeText: 'events:consequences_comeback_album.opt1.outcome'
      },
      {
        label: 'events:consequences_comeback_album.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'comeback_triggered' },
            { type: 'stat', stat: 'loyalty', value: 40 },
            { type: 'stat', stat: 'viral', value: 2 }
          ]
        },
        outcomeText: 'events:consequences_comeback_album.opt2.outcome'
      }
    ]
  }
]
