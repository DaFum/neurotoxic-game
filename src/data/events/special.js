// Special Events
export const SPECIAL_EVENTS = [
  {
    id: 'deal_devil',
    category: 'special',
    title: 'events:deal_devil.title',
    description: 'events:deal_devil.desc',
    trigger: 'special_location',
    chance: 1.0,
    options: [
      {
        label: 'events:deal_devil.opt1.label',
        effect: { type: 'item', item: 'golden_pick' },
        outcomeText: 'events:deal_devil.opt1.outcome'
      },
      {
        label: 'events:deal_devil.opt2.label',
        effect: { type: 'stat', stat: 'luck', value: 1 },
        outcomeText: 'events:deal_devil.opt2.outcome'
      }
    ]
  },
  {
    id: 'mysterious_producer',
    category: 'special',
    title: 'events:mysterious_producer.title',
    description: 'events:mysterious_producer.desc',
    trigger: 'special_location',
    chance: 0.5,
    options: [
      {
        label: 'events:mysterious_producer.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'skill', value: 2 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'events:mysterious_producer.opt1.outcome'
      },
      {
        label: 'events:mysterious_producer.opt2.label',
        effect: { type: 'stat', stat: 'luck', value: 2 },
        outcomeText: 'events:mysterious_producer.opt2.outcome'
      }
    ]
  },
  {
    id: 'strange_roadside_shrine',
    category: 'special',
    title: 'events:strange_roadside_shrine.title',
    description: 'events:strange_roadside_shrine.desc',
    trigger: 'special_location',
    chance: 0.35,
    options: [
      {
        label: 'events:strange_roadside_shrine.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -10 },
        outcomeText: 'events:strange_roadside_shrine.opt1.outcome'
      },
      {
        label: 'events:strange_roadside_shrine.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 7,
          success: { type: 'item', item: 'mystery_pick' },
          failure: { type: 'stat', stat: 'mood', value: -10 }
        },
        outcomeText: 'events:strange_roadside_shrine.opt2.outcome'
      }
    ]
  },
  {
    id: 'legendary_patch_trader',
    category: 'special',
    title: 'events:legendary_patch_trader.title',
    description: 'events:legendary_patch_trader.desc',
    trigger: 'special_location',
    chance: 0.25,
    options: [
      {
        label: 'events:legendary_patch_trader.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -80 },
        outcomeText: 'events:legendary_patch_trader.opt1.outcome'
      },
      {
        label: 'events:legendary_patch_trader.opt2.label',
        effect: { type: 'stat', stat: 'luck', value: 1 },
        outcomeText: 'events:legendary_patch_trader.opt2.outcome'
      }
    ]
  },
  {
    id: 'midnight_radio',
    category: 'special',
    title: 'events:midnight_radio.title',
    description: 'events:midnight_radio.desc',
    trigger: 'special_location',
    chance: 0.3,
    options: [
      {
        label: 'events:midnight_radio.opt1.label',
        effect: { type: 'stat', stat: 'skill', value: 2 },
        outcomeText: 'events:midnight_radio.opt1.outcome'
      },
      {
        label: 'events:midnight_radio.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:midnight_radio.opt2.outcome'
      }
    ]
  },
  {
    id: 'ghost_backstage',
    category: 'special',
    title: 'events:ghost_backstage.title',
    description: 'events:ghost_backstage.desc',
    trigger: 'special_location',
    chance: 0.25,
    options: [
      {
        label: 'events:ghost_backstage.opt1.label',
        skillCheck: {
          stat: 'luck',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 10 },
          failure: { type: 'stat', stat: 'mood', value: -10 }
        },
        outcomeText: 'events:ghost_backstage.opt1.outcome'
      },
      {
        label: 'events:ghost_backstage.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: 1 },
        outcomeText: 'events:ghost_backstage.opt2.outcome'
      }
    ]
  },
  {
    id: 'the_other_band',
    category: 'special',
    title: 'events:the_other_band.title',
    description: 'events:the_other_band.desc',
    trigger: 'special_location',
    chance: 0.2,
    options: [
      {
        label: 'events:the_other_band.opt1.label',
        skillCheck: {
          stat: 'skill',
          threshold: 9,
          success: { type: 'stat', stat: 'hype', value: 15 },
          failure: { type: 'stat', stat: 'hype', value: -15 }
        },
        outcomeText: 'events:the_other_band.opt1.outcome'
      },
      {
        label: 'events:the_other_band.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: 2 },
        outcomeText: 'events:the_other_band.opt2.outcome'
      }
    ]
  }
]
