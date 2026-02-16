// Band Events
export const BAND_EVENTS = [
  {
    id: 'internal_dispute',
    category: 'band',
    title: 'CREATIVE DIFFERENCES',
    description:
      'Matze thinks the new song should be slower. Marius wants it faster.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Side with Matze (Slow)',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'Marius is annoyed.'
      },
      {
        label: 'Side with Marius (Fast)',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'Matze sulks.'
      },
      {
        label: 'Compromise [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 5,
            description: 'Everyone is happy.'
          },
          failure: {
            type: 'stat',
            stat: 'harmony',
            value: -10,
            description: 'Now they both hate you.'
          }
        },
        outcomeText: 'You tried to mediate.'
      }
    ]
  },
  {
    id: 'late_night_party',
    category: 'band',
    title: 'LATE NIGHT PARTY',
    description:
      'The local scene invites you to an afterparty. It will be legendary, but exhausting.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Party Hard [-20 Stamina, +10 Mood]',
        effect: {
          type: 'composite',
          effects: [
            {
              type: 'stat',
              stat: 'stamina',
              value: -20,
              description: 'Drank too much.'
            },
            {
              type: 'stat',
              stat: 'mood',
              value: 10,
              description: 'Best night ever!'
            },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'You wake up with a headache but great memories.'
      },
      {
        label: 'Go to Sleep [+10 Stamina, -5 Mood]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: 10 },
            {
              type: 'stat',
              stat: 'mood',
              value: -5,
              description: 'FOMO hits hard.'
            }
          ]
        },
        outcomeText: 'Boring, but responsible.'
      }
    ]
  },
  {
    id: 'writers_block',
    category: 'band',
    title: "WRITER'S BLOCK",
    description: 'The band is stuck on a new riff. Frustration is rising.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Push through [Skill Check]',
        skillCheck: {
          stat: 'skill',
          threshold: 8,
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 10,
            description: 'Breakthrough! New song written.'
          },
          failure: {
            type: 'composite',
            effects: [
              {
                type: 'stat',
                stat: 'mood',
                value: -15,
                description: 'Everyone is angry.'
              },
              { type: 'stat', stat: 'stamina', value: -10 }
            ]
          }
        },
        outcomeText: 'You spent hours in the practice room.'
      },
      {
        label: 'Take a break [-50€]',
        effect: {
          type: 'composite',
          effects: [
            {
              type: 'resource',
              resource: 'money',
              value: -50,
              description: 'Went for beers.'
            },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'Sometimes you just need a distraction.'
      }
    ]
  }
]
