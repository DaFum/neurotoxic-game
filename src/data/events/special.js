// Special Events
export const SPECIAL_EVENTS = [
  {
    id: 'deal_devil',
    category: 'special',
    title: 'THE CROSSROADS',
    description: 'A man in a suit offers you a golden pick.',
    trigger: 'special_location',
    chance: 1.0,
    options: [
      {
        label: 'Take it',
        effect: { type: 'item', item: 'golden_pick' },
        outcomeText: 'It feels warm.'
      },
      {
        label: 'Refuse',
        effect: { type: 'stat', stat: 'luck', value: 1 },
        outcomeText: 'He vanishes.'
      }
    ]
  },
  {
    id: 'mysterious_producer',
    category: 'special',
    title: 'MYSTERIOUS PRODUCER',
    description: 'A shadowy figure offers to “elevate your sound.”',
    trigger: 'special_location',
    chance: 0.5,
    options: [
      {
        label: 'Accept [+Skill, -Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'skill', value: 2 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'Sharper sound. Bigger egos.'
      },
      {
        label: 'Refuse [+Luck]',
        effect: { type: 'stat', stat: 'luck', value: 2 },
        outcomeText: 'You trust your instincts.'
      }
    ]
  },
  {
    id: 'strange_roadside_shrine',
    category: 'special',
    title: 'ROADSIDE SHRINE',
    description: 'You find a small shrine made of guitar picks and candles.',
    trigger: 'special_location',
    chance: 0.35,
    options: [
      {
        label: 'Leave an offering [-10€]',
        effect: { type: 'resource', resource: 'money', value: -10 },
        outcomeText: 'The air feels lighter.'
      },
      {
        label: 'Take a pick [Risk]',
        skillCheck: {
          stat: 'luck',
          threshold: 7,
          success: { type: 'item', item: 'mystery_pick' },
          failure: { type: 'stat', stat: 'mood', value: -10 }
        },
        outcomeText: 'You tempt fate.'
      }
    ]
  },
  {
    id: 'legendary_patch_trader',
    category: 'special',
    title: 'PATCH TRADER',
    description: 'A strange collector offers a legendary patch for a price.',
    trigger: 'special_location',
    chance: 0.25,
    options: [
      {
        label: 'Buy it [-80€]',
        effect: { type: 'resource', resource: 'money', value: -80 },
        outcomeText: 'It looks powerful. Somehow.'
      },
      {
        label: 'Decline',
        effect: { type: 'stat', stat: 'luck', value: 1 },
        outcomeText: 'You walk away. The air shimmers.'
      }
    ]
  },
  {
    id: 'midnight_radio',
    category: 'special',
    title: 'MIDNIGHT RADIO',
    description: 'The radio plays a song that sounds exactly like your next album.',
    trigger: 'special_location',
    chance: 0.3,
    options: [
      {
        label: 'Record it [+2 Skill]',
        effect: { type: 'stat', stat: 'skill', value: 2 },
        outcomeText: 'Inspiration hits like a truck.'
      },
      {
        label: 'Turn it off [-5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'Too weird. Too late.'
      }
    ]
  },
  {
    id: 'ghost_backstage',
    category: 'special',
    title: 'GHOST BACKSTAGE',
    description: 'You swear you hear a crowd cheering in an empty hallway.',
    trigger: 'special_location',
    chance: 0.25,
    options: [
      {
        label: 'Follow the sound [Luck]',
        skillCheck: {
          stat: 'luck',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 10 },
          failure: { type: 'stat', stat: 'mood', value: -10 }
        },
        outcomeText: 'You step into the unknown.'
      },
      {
        label: 'Ignore it',
        effect: { type: 'stat', stat: 'harmony', value: 1 },
        outcomeText: 'You pretend it never happened.'
      }
    ]
  },
  {
    id: 'the_other_band',
    category: 'special',
    title: 'THE OTHER BAND',
    description: 'A band “from another timeline” offers to swap setlists for one night.',
    trigger: 'special_location',
    chance: 0.2,
    options: [
      {
        label: 'Swap [Skill]',
        skillCheck: {
          stat: 'skill',
          threshold: 9,
          success: { type: 'stat', stat: 'hype', value: 15 },
          failure: { type: 'stat', stat: 'hype', value: -15 }
        },
        outcomeText: 'It’s either legendary or a trainwreck.'
      },
      {
        label: 'Decline',
        effect: { type: 'stat', stat: 'mood', value: 2 },
        outcomeText: 'You stay in your universe.'
      }
    ]
  }
]
