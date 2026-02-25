// Crisis Events — reputation damage, recovery arcs, and social fallout
// These fire when controversyLevel crosses key thresholds.
// Triggers: 'post_gig' (band/financial pool), 'travel' (band/special pool via arrivalUtils)
export const CRISIS_EVENTS = [
  {
    id: 'crisis_bad_review',
    category: 'band',
    tags: ['crisis', 'reputation'],
    title: 'BAD REVIEW ONLINE',
    description:
      'A metal blog just posted a savage breakdown of your last performance. Screenshots are spreading fast.',
    trigger: 'post_gig',
    chance: 0.55,
    condition: gs =>
      (gs.social?.controversyLevel || 0) >= 20 &&
      (gs.band?.harmony || 100) < 75,
    options: [
      {
        label: 'Say nothing (absorb the hit)',
        effect: { type: 'stat', stat: 'controversyLevel', value: 15 },
        outcomeText: 'The review stays up and keeps circulating.'
      },
      {
        label: 'Respond professionally [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: -5 },
              { type: 'stat', stat: 'loyalty', value: 10 }
            ],
            description: 'Your measured response earned you respect.'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: 25 },
              { type: 'stat', stat: 'harmony', value: -5 }
            ],
            description:
              'You came off defensive. It went viral for all the wrong reasons.'
          }
        },
        outcomeText: 'You drafted a careful reply.'
      },
      {
        label: 'Own it — post a self-aware apology',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: -10 },
            { type: 'stat', stat: 'loyalty', value: 15 },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText:
          'Acknowledging the bad show felt honest. Real fans respect the humility.'
      }
    ]
  },
  {
    id: 'crisis_online_backlash',
    category: 'band',
    tags: ['crisis', 'social_media'],
    title: 'ONLINE BACKLASH',
    description:
      'A thread calling out your "problematic" stage antics has hit 10k shares. The algorithm is not your friend today.',
    trigger: 'post_gig',
    chance: 0.6,
    condition: gs => (gs.social?.controversyLevel || 0) >= 50,
    options: [
      {
        label: 'Ride it out (no response)',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: 10 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'The thread grows. Band morale suffers under the noise.'
      },
      {
        label: 'Hire PR damage control [-250€]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -250 },
            { type: 'stat', stat: 'controversyLevel', value: -20 }
          ]
        },
        outcomeText:
          'A professional spun the narrative. It cost you, but the thread died down.'
      },
      {
        label: 'Release raw acoustic session [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: -30 },
              { type: 'stat', stat: 'viral', value: 2 },
              { type: 'stat', stat: 'loyalty', value: 20 }
            ],
            description:
              'The stripped-down session melted hearts. Controversy forgotten.'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: 15 },
              { type: 'stat', stat: 'harmony', value: -5 }
            ],
            description:
              'It looked forced. The internet smelled desperation.'
          }
        },
        outcomeText: 'You recorded a heartfelt session in the van.'
      }
    ]
  },
  {
    id: 'crisis_shadowban_scare',
    category: 'band',
    tags: ['crisis', 'shadowban'],
    title: 'ALGORITHMIC DEATH',
    description:
      'Your posts are reaching 12 people. Something is very wrong. The platform has buried you.',
    trigger: 'travel',
    chance: 0.7,
    condition: gs => (gs.social?.controversyLevel || 0) >= 80,
    options: [
      {
        label: 'Nuke all controversial posts',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: -30 },
            { type: 'stat', stat: 'loyalty', value: -10 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText:
          'You wiped your history. Some fans felt betrayed. Controversy slowly recedes.'
      },
      {
        label: 'Post a long public apology [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: -25 },
              { type: 'stat', stat: 'loyalty', value: 25 }
            ],
            description:
              'Genuine. Raw. The fans who stayed became your most loyal soldiers.'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: 15 },
              { type: 'stat', stat: 'harmony', value: -10 }
            ],
            description: 'It read like a PR stunt. The backlash doubled.'
          }
        },
        outcomeText: 'You typed and deleted and typed again.'
      },
      {
        label: 'Lean in — go full chaos mode',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: 20 },
            { type: 'stat', stat: 'viral', value: 3 },
            { type: 'stat', stat: 'harmony', value: -10 }
          ]
        },
        outcomeText:
          'You doubled down on everything. The chaos got eyeballs. The band is not okay.'
      }
    ]
  },
  {
    id: 'crisis_venue_cancels',
    category: 'financial',
    tags: ['crisis', 'venue'],
    title: 'BOOKING CANCELLED',
    description:
      'The venue manager left a voicemail. They have "concerns about your current public image" and are pulling your upcoming booking.',
    trigger: 'post_gig',
    chance: 0.5,
    condition: gs => (gs.social?.controversyLevel || 0) >= 65,
    options: [
      {
        label: 'Accept the cancellation [-150€ deposit]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -150 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'You eat the deposit. Another city, another door closed.'
      },
      {
        label: 'Negotiate hard [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'controversyLevel', value: -5 },
              { type: 'stat', stat: 'loyalty', value: 5 }
            ],
            description:
              'You convinced them to keep the booking. They added a clause: "no incidents."'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'resource', resource: 'money', value: -300 },
              { type: 'stat', stat: 'harmony', value: -10 }
            ],
            description:
              'The negotiation turned ugly. You lost the deposit and they charged a cancellation fee.'
          }
        },
        outcomeText: 'You called the manager back.'
      },
      {
        label: 'Book a DIY squat show instead',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -50 },
            { type: 'stat', stat: 'loyalty', value: 15 },
            { type: 'stat', stat: 'controversyLevel', value: -5 }
          ]
        },
        outcomeText:
          'You found an abandoned warehouse. The show was legendary. Screw the venue.'
      }
    ]
  },
  {
    id: 'crisis_redemption_charity',
    category: 'special',
    tags: ['crisis', 'charity', 'recovery'],
    title: 'REDEMPTION OFFER',
    description:
      "A local non-profit reached out. They need a headliner for a benefit show. It won't pay anything — but the goodwill might.",
    trigger: 'travel',
    chance: 0.3,
    condition: gs => (gs.social?.controversyLevel || 0) >= 40,
    options: [
      {
        label: 'Play the charity show (free)',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: -25 },
            { type: 'stat', stat: 'loyalty', value: 20 },
            { type: 'stat', stat: 'harmony', value: 10 }
          ]
        },
        outcomeText:
          'You played your hearts out. The crowd knew it mattered. The internet noticed.'
      },
      {
        label: 'Donate gig proceeds instead [-200€]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -200 },
            { type: 'stat', stat: 'controversyLevel', value: -15 },
            { type: 'stat', stat: 'loyalty', value: 15 }
          ]
        },
        outcomeText:
          'You posted the donation publicly. Some cynics called it PR. Most fans were moved.'
      },
      {
        label: 'Decline — not the right time',
        effect: { type: 'stat', stat: 'harmony', value: -3 },
        outcomeText: 'The band argued about it for two hours. You move on.'
      }
    ]
  },
  {
    id: 'crisis_sponsor_ultimatum',
    category: 'financial',
    tags: ['crisis', 'sponsorship'],
    title: 'SPONSOR ULTIMATUM',
    description:
      "Your brand partner's legal team sent a message. Clean up your act or the deal is void.",
    trigger: 'post_gig',
    chance: 0.8,
    condition: gs =>
      (gs.social?.controversyLevel || 0) >= 80 &&
      (gs.social?.activeDeals?.length || 0) > 0,
    options: [
      {
        label: 'Promise to clean up your image',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'controversyLevel', value: -10 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText:
          'You agreed to tone it down. The band is not thrilled. The sponsor stays — for now.'
      },
      {
        label: 'Call them out publicly [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'viral', value: 3 },
              { type: 'stat', stat: 'loyalty', value: 30 },
              { type: 'stat', stat: 'controversyLevel', value: -10 }
            ],
            description:
              'Your rebellion went viral. True fans rallied. The sponsor went away, but so did half the controversy.'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'resource', resource: 'money', value: -500 },
              { type: 'stat', stat: 'controversyLevel', value: 20 }
            ],
            description:
              'They sued. You lost the deal and paid legal costs. The controversy spiralled.'
          }
        },
        outcomeText: 'You posted a very direct response.'
      },
      {
        label: 'Negotiate reduced obligations [-100€]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -100 },
            { type: 'stat', stat: 'controversyLevel', value: -5 }
          ]
        },
        outcomeText:
          'You hired a cheap lawyer. A compromise was reached. Nobody is happy.'
      }
    ]
  }
]
