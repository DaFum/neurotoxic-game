/**
 * Consequences Event Pool
 */

export const CONSEQUENCE_EVENTS = [
  {
    id: 'consequences_venue_complaint',
    category: 'financial',
    title: 'VENUE COMPLAINT',
    description:
      'The venue manager is furious about your recent performance and demands compensation.',
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
        label: 'Apologize [-100€, -10 Controversy, +5 Loyalty]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -100 },
            { type: 'stat', stat: 'controversyLevel', value: -10 },
            { type: 'stat', stat: 'loyalty', value: 5 },
            { type: 'cooldown', eventId: 'consequences_venue_complaint' }
          ]
        },
        outcomeText: 'You paid them off. Fans noticed the humility.'
      },
      {
        label: 'Ignore [+15 Controversy, -5 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: 15 },
            { type: 'stat', stat: 'harmony', value: -5 },
            { type: 'cooldown', eventId: 'consequences_venue_complaint' }
          ]
        },
        outcomeText: "You walk away, but the internet doesn't forget."
      },
      {
        label: 'Deny [Charisma 7]',
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
            description: 'You talked your way out of it smoothly.'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: 20 },
              { type: 'stat', stat: 'harmony', value: -10 },
              { type: 'cooldown', eventId: 'consequences_venue_complaint' }
            ],
            description: "They didn't buy it. The backlash is worse."
          }
        }
      }
    ]
  },
  {
    id: 'consequences_ticket_sales_collapse',
    category: 'financial',
    title: 'TICKET SALES COLLAPSE',
    description:
      'Promoters are threatening to cancel gigs due to low pre-sales and recent controversies.',
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
        label: 'Discount tickets [+10 Loyalty]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'discounted_tickets_active' },
            { type: 'stat', stat: 'loyalty', value: 10 },
            { type: 'cooldown', eventId: 'consequences_ticket_sales_collapse' }
          ]
        },
        outcomeText: 'Tickets are cheaper. Real fans appreciate it.'
      },
      {
        label: 'Double promo [-150€, -5 Controversy]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -150 },
            { type: 'stat', stat: 'controversyLevel', value: -5 },
            { type: 'cooldown', eventId: 'consequences_ticket_sales_collapse' }
          ]
        },
        outcomeText: 'You threw money at the problem. It somewhat helped.'
      }
    ]
  },
  {
    id: 'consequences_bandmate_scandal',
    category: 'band',
    title: 'BANDMATE SCANDAL',
    description:
      '{egoFocus} was photographed at the afterparty in a compromising situation.',
    trigger: 'post_gig',
    chance: 0.75,
    condition: state => {
      return (
        state.social?.egoFocus !== null &&
        (state.social?.controversyLevel || 0) >= 30 &&
        !(state.eventCooldowns || []).includes('consequences_bandmate_scandal')
      )
    },
    options: [
      {
        label: 'Stand behind them [+20 Controversy, +10 Harmony, +15 Loyalty]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: 20 },
            { type: 'stat', stat: 'harmony', value: 10 },
            { type: 'stat', stat: 'loyalty', value: 15 },
            { type: 'cooldown', eventId: 'consequences_bandmate_scandal' }
          ]
        },
        outcomeText:
          'The band sticks together. The media hates it, but the diehards love the loyalty.'
      },
      {
        label: 'Distance yourself [-10 Controversy, -20 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: -10 },
            { type: 'stat', stat: 'harmony', value: -20 },
            { type: 'social_set', stat: 'egoFocus', value: null },
            { type: 'cooldown', eventId: 'consequences_bandmate_scandal' }
          ]
        },
        outcomeText: 'You threw them under the bus. Standard PR move.'
      },
      {
        label: 'Counter-narrative [Charisma 8]',
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
            description: 'You completely flipped the story! Masterclass in PR.'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: 25 },
              { type: 'stat', stat: 'harmony', value: -15 },
              { type: 'cooldown', eventId: 'consequences_bandmate_scandal' }
            ],
            description:
              'Your excuse made no sense. Everyone is laughing at you.'
          }
        }
      }
    ]
  },
  {
    id: 'consequences_cancel_culture_quest',
    category: 'special',
    title: 'THE INTERNET HAS SPOKEN',
    description:
      'The backlash has reached critical mass. Hashtags about cancelling the band are trending globally.',
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
        label: 'Launch Apology Tour [-5 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'cancel_quest_active' },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'Time to eat humble pie in front of everyone.'
      },
      {
        label: 'Go dark [-40 Controversy, -30 Loyalty, -15 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: -40 },
            { type: 'stat', stat: 'loyalty', value: -30 },
            { type: 'stat', stat: 'harmony', value: -15 }
          ]
        },
        outcomeText:
          'You vanish from the internet. The storm passes, but you lose your hardcore fans.'
      }
    ]
  },
  {
    id: 'consequences_ego_breakup_threat',
    category: 'band',
    title: 'BREAKUP THREAT',
    description:
      'The tension in the van is unbearable. Someone is about to quit the band.',
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
        label: 'Try to save the band [+5 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'breakup_quest_active' },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText:
          "You beg them to stay. It's going to take work to fix this."
      },
      {
        label: 'Let them walk (Game Over)',
        effect: { type: 'game_over' },
        outcomeText: 'The band is over. Time to get a real job.'
      }
    ]
  },
  {
    id: 'consequences_comeback_album',
    category: 'special',
    title: 'THE COMEBACK IS REAL',
    description:
      'After completing the apology tour and cleaning up your image, labels are interested again.',
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
        label: 'Sign EP deal [+500€, +200 Fame, +25 Loyalty, -20 Controversy]',
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
        outcomeText: 'You sold out a little, but the comeback EP is a hit!'
      },
      {
        label: 'Self-release [+40 Loyalty, +2 Viral]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'flag', flag: 'comeback_triggered' },
            { type: 'stat', stat: 'loyalty', value: 40 },
            { type: 'stat', stat: 'viral', value: 2 }
          ]
        },
        outcomeText: 'You stayed indie. The fans respect the hustle.'
      }
    ]
  }
]
