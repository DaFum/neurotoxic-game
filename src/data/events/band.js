// Band Events
export const BAND_EVENTS = [
  {
    id: 'internal_dispute',
    category: 'band',
    tags: ['conflict'],
    title: 'CREATIVE DIFFERENCES',
    description:
      'Matze thinks the new song should be slower. Lars wants it faster.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Side with Matze (Slow)',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'Lars is annoyed.'
      },
      {
        label: 'Side with Lars (Fast)',
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
  },
  {
    id: 'ego_clash',
    category: 'band',
    tags: ['conflict'],
    title: 'EGO CLASH',
    description: 'Marius wants a longer drum solo. Everyone else disagrees.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Let him have it [+5 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: 5 },
        outcomeText: 'He feels seen.'
      },
      {
        label: 'Shut it down [-10 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: -10 },
        outcomeText: 'Awkward silence.'
      }
    ]
  },
  {
    id: 'gear_upgrade_argument',
    category: 'band',
    tags: ['conflict'],
    title: 'GEAR UPGRADE ARGUMENT',
    description: 'Matze insists he needs a new amp “for the tone”.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Approve purchase [-200€]',
        effect: { type: 'resource', resource: 'money', value: -200 },
        outcomeText: 'Tone improved. Wallet destroyed.'
      },
      {
        label: 'Say no [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'harmony', value: 5 },
          failure: { type: 'stat', stat: 'harmony', value: -10 }
        },
        outcomeText: 'You tried to reason.'
      }
    ]
  },
  {
    id: 'setlist_argument',
    category: 'band',
    tags: ['conflict'],
    title: 'SETLIST ARGUMENT',
    description: 'Marius wants more fast songs. Lars wants more “groove”.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Go faster (Side with Marius)',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'Lars rolls his eyes.'
      },
      {
        label: 'Go groovier (Side with Lars)',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'Marius taps his sticks impatiently.'
      },
      {
        label: 'Compromise [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'harmony', value: 8 },
          failure: { type: 'stat', stat: 'harmony', value: -12 }
        },
        outcomeText: 'You negotiate like a tired diplomat.'
      }
    ]
  },
  {
    id: 'van_silence',
    category: 'band',
    tags: ['conflict'],
    title: 'THE SILENCE',
    description: 'Nobody talks for an hour. It’s not peaceful. It’s tension.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Crack a joke [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 5,
          success: { type: 'stat', stat: 'harmony', value: 6 },
          failure: { type: 'stat', stat: 'mood', value: -5 }
        },
        outcomeText: 'You try to break the ice.'
      },
      {
        label: 'Let it be',
        effect: { type: 'stat', stat: 'harmony', value: -3 },
        outcomeText: 'The silence stays heavy.'
      }
    ]
  },
  {
    id: 'late_soundcheck_blame',
    category: 'band',
    tags: ['conflict'],
    title: 'BLAME GAME',
    description: 'Soundcheck is late and everyone blames everyone.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'Take responsibility [-5 Mood, +5 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: -5 },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'It stings, but it helps.'
      },
      {
        label: 'Call it out [-8 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: -8 },
        outcomeText: 'Now it’s personal.'
      }
    ]
  },
  {
    id: 'practice_room_rage',
    category: 'band',
    tags: ['conflict'],
    title: 'PRACTICE ROOM RAGE',
    description: 'A riff loop turns into an argument. Again.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Push through [Skill]',
        skillCheck: {
          stat: 'skill',
          threshold: 7,
          success: { type: 'stat', stat: 'harmony', value: 10 },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'harmony', value: -10 },
              { type: 'stat', stat: 'stamina', value: -10 }
            ]
          }
        },
        outcomeText: 'Hours disappear into noise.'
      },
      {
        label: 'Call it a day [+5 Mood, -5 Progress]',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'You choose sanity.'
      }
    ]
  },
  {
    id: 'band_photo_day',
    category: 'band',
    title: 'BAND PHOTO DAY',
    description: 'You promised new press photos. Nobody is ready.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Do it properly [-20€]',
        effect: { type: 'resource', resource: 'money', value: -20 },
        outcomeText: 'At least you look like a real band.'
      },
      {
        label: 'DIY photos [+5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'You shoot it in a parking garage. Somehow works.'
      }
    ]
  },
  {
    id: 'new_song_debut_fear',
    category: 'band',
    title: 'NEW SONG PANIC',
    description: 'Someone suggests playing the new song tonight. The room goes quiet.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Do it [+10 Hype, Risk]',
        skillCheck: {
          stat: 'skill',
          threshold: 8,
          success: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'hype', value: 10 },
              { type: 'stat', stat: 'harmony', value: 5 }
            ]
          },
          failure: { type: 'stat', stat: 'harmony', value: -10 }
        },
        outcomeText: 'You commit.'
      },
      {
        label: 'No new songs [+5 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: 5 },
        outcomeText: 'Safe choice. Less drama.'
      }
    ]
  },
  {
    id: 'merch_table_duty',
    category: 'band',
    title: 'MERCH TABLE DUTY',
    description: 'Nobody wants to run the merch table after the set.',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'You do it [-5 Stamina, +10€]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: -5 },
            { type: 'resource', resource: 'money', value: 10 }
          ]
        },
        outcomeText: 'Small talk for cash.'
      },
      {
        label: 'Force Marius [-5 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'He does it, but he remembers.'
      }
    ]
  },
  {
    id: 'sleeping_floor_fight',
    category: 'band',
    title: 'SLEEPING ARRANGEMENTS',
    description: 'The floor spot looks… worse than usual. Everybody wants the couch.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Draw straws [Luck]',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'harmony', value: 5 },
          failure: { type: 'stat', stat: 'harmony', value: -5 }
        },
        outcomeText: 'Fair… in theory.'
      },
      {
        label: 'You take the floor [+5 Harmony, -5 Stamina]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: 5 },
            { type: 'stat', stat: 'stamina', value: -5 }
          ]
        },
        outcomeText: 'Hero move. Terrible sleep.'
      }
    ]
  },
  {
    id: 'band_prank',
    category: 'band',
    title: 'TOUR PRANK',
    description: 'Someone swapped your strings with ancient rusty ones as a “joke”.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Laugh it off [+5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'You pretend it’s funny.'
      },
      {
        label: 'Get angry [-8 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: -8 },
        outcomeText: 'Now it’s a war.'
      }
    ]
  },
  {
    id: 'ego_clash_2',
    category: 'band',
    tags: ['conflict'],
    title: 'EGO CLASH II',
    description: 'Lars wants to “rebrand” the band mid-tour. Marius wants to sleep.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Hear him out [+5 Mood, -5 Time]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: 5 },
            { type: 'stat', stat: 'time', value: -0.5 }
          ]
        },
        outcomeText: 'You brainstorm at 2am. Why.'
      },
      {
        label: 'Shut it down [+5 Stamina, -5 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: 5 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'Sleep wins. Friendships lose.'
      }
    ]
  },
  {
    id: 'vocal_warmup_cringe',
    category: 'band',
    title: 'VOCAL WARMUP CRINGE',
    description: 'Someone starts intense warmups in the van. Everyone suffers.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Join in [+5 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: 5 },
        outcomeText: 'Painful bonding.'
      },
      {
        label: 'Beg for silence [-5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'Nobody listens.'
      }
    ]
  },
  {
    id: 'band_meeting',
    category: 'band',
    title: 'BAND MEETING',
    description: 'You need to talk about expectations. Nobody wants to.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Do it properly [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: { type: 'stat', stat: 'harmony', value: 12 },
          failure: { type: 'stat', stat: 'harmony', value: -8 }
        },
        outcomeText: 'You attempt emotional leadership.'
      },
      {
        label: 'Skip it',
        effect: { type: 'stat', stat: 'harmony', value: -3 },
        outcomeText: 'Avoidance is a strategy…'
      }
    ]
  },
  {
    id: 'lost_setlist_notes',
    category: 'band',
    title: 'LOST NOTES',
    description: 'Your setlist notes disappeared. The show is tonight.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Rewrite from memory [Skill]',
        skillCheck: {
          stat: 'skill',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 5 },
          failure: { type: 'stat', stat: 'mood', value: -5 }
        },
        outcomeText: 'You trust your brain.'
      },
      {
        label: 'Wing it',
        effect: { type: 'stat', stat: 'harmony', value: -4 },
        outcomeText: 'Confidence is not a plan.'
      }
    ]
  },
  {
    id: 'backstage_argument',
    category: 'band',
    tags: ['conflict'],
    title: 'BACKSTAGE ARGUMENT',
    description: 'A small comment turns into a big fight five minutes before stage.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Calm everyone down [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: { type: 'stat', stat: 'harmony', value: 10 },
          failure: { type: 'stat', stat: 'harmony', value: -15 }
        },
        outcomeText: 'You try to prevent disaster.'
      },
      {
        label: 'Let them vent [-5 Harmony, +5 Mood]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: -5 },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'It’s messy, but honest.'
      }
    ]
  },
  {
    id: 'creative_high',
    category: 'band',
    title: 'CREATIVE HIGH',
    description: 'A new riff appears out of nowhere. Everyone is smiling.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Capture it [+10 Mood, +5 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: 10 },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'You record a demo on a phone mic.'
      }
    ]
  },
  {
    id: 'sore_throat',
    category: 'band',
    title: 'SORE THROAT',
    description: 'Someone’s voice sounds rough today.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Buy tea & honey [-10€]',
        effect: { type: 'resource', resource: 'money', value: -10 },
        outcomeText: 'Warm, sticky, helpful.'
      },
      {
        label: 'Ignore it [-5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'Tomorrow will be worse.'
      }
    ]
  },
  {
    id: 'band_bonding_walk',
    category: 'band',
    title: 'BONDING WALK',
    description: 'You have two hours to kill. Someone suggests a walk together.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Go together [+8 Harmony, +5 Mood]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: 8 },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'You talk like humans for once.'
      },
      {
        label: 'Stay alone [+5 Mood]',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'Recharge time.'
      }
    ]
  },
  {
    id: 'tempo_police',
    category: 'band',
    tags: ['conflict'],
    title: 'TEMPO POLICE',
    description: 'Marius insists everyone is rushing. Lars insists Marius is dragging.',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'Do metronome drills [-10 Stamina, +8 Harmony]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: -10 },
            { type: 'stat', stat: 'harmony', value: 8 }
          ]
        },
        outcomeText: 'Painful, but it works.'
      },
      {
        label: 'Ignore it [-6 Harmony]',
        effect: { type: 'stat', stat: 'harmony', value: -6 },
        outcomeText: 'The argument continues forever.'
      }
    ]
  },
  {
    id: 'forgotten_lyrics',
    category: 'band',
    title: 'FORGOTTEN LYRICS',
    description: 'Someone admits they forgot a verse. On tour. Right now.',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'Rehearse quickly [-5 Time]',
        effect: { type: 'stat', stat: 'time', value: -0.5 },
        outcomeText: 'You whisper-sing in a hallway.'
      },
      {
        label: 'Improvise [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 5 },
          failure: { type: 'stat', stat: 'harmony', value: -6 }
        },
        outcomeText: 'Confidence, baby.'
      }
    ]
  }
]
