// Gig Events
export const GIG_EVENTS = [
  {
    id: 'gig_mid_strings_snapped',
    category: 'gig',
    title: 'STRING SNAPPED!',
    text: 'A sharp TWANG sounds from the guitar amp.',
    trigger: 'gig_mid',
    chance: 0.1,
    options: [
      {
        label: 'Keep playing (Miss notes)',
        effect: { type: 'stat', stat: 'score', value: -500 },
        outcomeText: 'It sounded terrible.'
      },
      {
        label: 'Change it fast [Tech]',
        skillCheck: {
          stat: 'technical',
          threshold: 5,
          success: { type: 'stat', stat: 'score', value: 100, description: 'Crowd cheered the fix!' },
          failure: { type: 'stat', stat: 'score', value: -200, description: 'Took too long.' }
        },
        outcomeText: 'You scrambled for a string.'
      }
    ]
  },
  {
    id: 'gig_intro_drunk_fan',
    category: 'gig',
    title: 'DRUNK HECKLER',
    text: "Someone is yelling 'PLAY FREEBIRD' repeatedly.",
    trigger: 'gig_intro',
    chance: 0.2,
    options: [
      { label: 'Ignore', effect: { type: 'stat', stat: 'mood', value: -2 }, outcomeText: 'You started the set.' },
      { label: 'Mock him', skillCheck: { stat: 'charisma', threshold: 5, success: { type: 'stat', stat: 'hype', value: 10 }, failure: { type: 'stat', stat: 'hype', value: -10 } }, outcomeText: 'Crowd reaction.' }
    ]
  }
]
