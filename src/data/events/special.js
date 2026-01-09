// Special Events
export const SPECIAL_EVENTS = [
  {
    id: 'deal_devil',
    category: 'special',
    title: 'THE CROSSROADS',
    text: 'A man in a suit offers you a golden pick.',
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
  }
]
