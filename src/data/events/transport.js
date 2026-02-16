// Transport Events
export const TRANSPORT_EVENTS = [
  {
    id: 'van_breakdown_tire',
    category: 'transport',
    title: 'VAN BREAKDOWN: TIRE',
    description: 'A loud BANG echoes on the autobahn. The van swerves violently.',
    trigger: 'travel',
    chance: 0.08,
    options: [
      {
        label: 'Call ADAC [-50€, -2h]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -50 },
            {
              type: 'stat',
              stat: 'time',
              value: -2,
              description: 'Wait for tow truck'
            }
          ]
        },
        outcomeText: 'The tow truck arrived late. At least the tire is fixed.'
      },
      {
        label: 'Change it yourself [Stamina Check]',
        skillCheck: {
          stat: 'stamina', // Check against random band member's stamina
          threshold: 5, // Easy check
          success: {
            type: 'stat',
            stat: 'time',
            value: -1,
            description: 'Quick fix!'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'time', value: -3 },
              {
                type: 'stat',
                stat: 'stamina',
                value: -10,
                description: 'You hurt your back.'
              }
            ]
          }
        },
        outcomeText: 'You decided to get your hands dirty.'
      }
    ]
  },
  {
    id: 'van_breakdown_engine',
    category: 'transport',
    title: 'VAN BREAKDOWN: ENGINE',
    description: 'Steam hisses from the hood. The temperature gauge is in the red.',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'Professional Repair [-200€, -4h]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -200 },
            { type: 'stat', stat: 'time', value: -4 }
          ]
        },
        outcomeText: 'Expensive, but necessary. The van runs smoother now.'
      },
      {
        label: 'Duct Tape & Prayer [Tech Check]',
        skillCheck: {
          stat: 'skill',
          threshold: 7,
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 10,
            description: 'It worked! Genius.'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'time', value: -6 },
              { type: 'chain', eventId: 'van_critical_failure' },
              { type: 'flag', flag: 'VAN_DAMAGED' }
            ]
          }
        },
        outcomeText: 'You tried a MacGyver solution.'
      }
    ]
  },
  {
    id: 'van_critical_failure',
    category: 'transport',
    title: 'CRITICAL FAILURE',
    description: "The duct tape didn't hold. The engine block cracked. You need a tow.",
    trigger: 'travel',
    chance: 0, // Triggered by chain only
    options: [
      {
        label: 'Wait for cheap tow [-100€, -1d]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -100 },
            {
              type: 'stat',
              stat: 'time',
              value: -24,
              description: 'Lost a day waiting.'
            }
          ]
        },
        outcomeText:
          'You spent the night in a ditch, but the mechanic fixed it cheap.'
      },
      {
        label: 'Scrap it & Rent [-500€]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -500 },
            { type: 'flag', flag: 'RENTAL_VAN' }
          ]
        },
        outcomeText: 'The old van is gone. You are driving a rental now.'
      }
    ]
  },
  {
    id: 'police_control',
    category: 'transport',
    title: 'POLICE CONTROL',
    description: "Blue lights flash behind you. 'Allgemeine Verkehrskontrolle'.",
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'Cooperate [Safe]',
        effect: {
          type: 'stat',
          stat: 'time',
          value: -0.5,
          description: '30 mins lost.'
        },
        outcomeText: 'They checked the tires and let you go. Boring.'
      },
      {
        label: 'Talk your way out [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'stat',
            stat: 'fame',
            value: 5,
            description: 'Cop was a fan!'
          },
          failure: {
            type: 'resource',
            resource: 'money',
            value: -150,
            description: 'Fined for attitude.'
          }
        },
        outcomeText: 'You rolled down the window with a smile.'
      },
      {
        label: 'Flee! [Driving Skill]',
        skillCheck: {
          stat: 'stamina', // Placeholder for driving skill
          threshold: 9,
          success: {
            type: 'stat',
            stat: 'mood',
            value: 20,
            description: 'Adrenaline rush! Escaped!'
          },
          failure: { type: 'game_over', description: 'Arrested. Tour Over.' }
        },
        outcomeText: 'FLOOR IT!'
      }
    ]
  },
  {
    id: 'wrong_turn',
    category: 'transport',
    title: 'WRONG TURN',
    description: 'The GPS lied. You are in the middle of nowhere.',
    trigger: 'travel',
    chance: 0.03,
    options: [
      {
        label: 'Turn back',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'fuel', value: -5 },
            { type: 'stat', stat: 'time', value: -1 }
          ]
        },
        outcomeText: 'Lost some gas and time.'
      },
      {
        label: 'Explore the area',
        skillCheck: {
          stat: 'luck', // Implicit check
          threshold: 5, // 50/50
          success: {
            type: 'unlock',
            unlock: 'rare_vinyl',
            description: 'Found a hidden record store! +Rare Vinyl'
          },
          failure: {
            type: 'stat',
            stat: 'time',
            value: -2,
            description: 'Just a dead end.'
          }
        },
        outcomeText: 'You decided to look around.'
      }
    ]
  },
  {
    id: 'traffic_jam',
    category: 'transport',
    title: 'AUTOBAHN STAU',
    description: 'Complete standstill. Nothing moves.',
    trigger: 'travel',
    chance: 0.07,
    options: [
      {
        label: 'Wait it out [-2h]',
        effect: { type: 'stat', stat: 'time', value: -2 },
        outcomeText: 'Boring, but safe.'
      },
      {
        label: 'Take backroads [-1h, Risk]',
        skillCheck: {
          stat: 'luck',
          threshold: 4,
          success: {
            type: 'stat',
            stat: 'time',
            value: -1,
            description: 'Shortcut worked!'
          },
          failure: {
            type: 'composite',
            effects: [
              {
                type: 'stat',
                stat: 'time',
                value: -3,
                description: 'Got lost on farm roads.'
              },
              { type: 'resource', resource: 'fuel', value: -10 }
            ]
          }
        },
        outcomeText: 'You took the next exit.'
      }
    ]
  },
  {
    id: 'hitchhiker',
    category: 'transport',
    title: 'MYSTERIOUS HITCHHIKER',
    description: 'A figure stands in the rain with a guitar case.',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'Pick them up',
        skillCheck: {
          stat: 'luck',
          threshold: 3, // Mostly good outcomes
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 10,
            description: 'Great stories, good vibes.'
          },
          failure: {
            type: 'resource',
            resource: 'money',
            value: -50,
            description: 'Stole cash from the dashboard.'
          }
        },
        outcomeText: 'You opened the door.'
      },
      {
        label: 'Drive past',
        effect: {
          type: 'stat',
          stat: 'harmony',
          value: -5,
          description: 'Felt bad.'
        },
        outcomeText: 'Safety first.'
      }
    ]
  },
  {
    id: 'wild_accident',
    category: 'transport',
    title: 'WILD UNFALL',
    description: 'A deer jumps onto the road!',
    trigger: 'travel',
    chance: 0.02,
    options: [
      {
        label: 'Swerve! [Reflex Check]',
        skillCheck: {
          stat: 'stamina',
          threshold: 6,
          success: {
            type: 'stat',
            stat: 'mood',
            value: -10,
            description: 'Safe, but shaken.'
          },
          failure: {
            type: 'composite',
            effects: [
              {
                type: 'resource',
                resource: 'money',
                value: -500,
                description: 'Hit a tree. Van damaged.'
              },
              { type: 'stat', stat: 'van_condition', value: -20 }
            ]
          }
        },
        outcomeText: 'You yanked the wheel.'
      }
    ]
  },
  {
    id: 'gas_station_encounter',
    category: 'transport',
    title: 'GAS STATION ENCOUNTER',
    description: 'At the petrol station, someone recognizes the band shirt.',
    trigger: 'travel',
    chance: 0.06,
    options: [
      {
        label: 'Chat with them',
        effect: {
          type: 'stat',
          stat: 'fame',
          value: 5,
          description: 'It was a fan! Free coffee.'
        },
        outcomeText: 'Nice interaction.'
      },
      {
        label: 'Ignore',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'You just wanted to pee.'
      }
    ]
  },
  {
    id: 'speed_trap',
    category: 'transport',
    title: 'BLITZER',
    description: 'FLASH! You were going 130 in a 100 zone.',
    trigger: 'travel',
    chance: 0.04,
    options: [
      {
        label: 'Pay fine [-30€]',
        effect: { type: 'resource', resource: 'money', value: -30 },
        outcomeText: 'Damn.'
      }
    ]
  },
  {
    id: 'road_rage',
    category: 'transport',
    title: 'ROAD RAGE',
    description: 'A BMW tailgates you aggressively.',
    trigger: 'travel',
    chance: 0.04,
    options: [
      {
        label: 'Brake check',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'mood', value: 5 },
          failure: { type: 'stat', stat: 'van_condition', value: -5 }
        },
        outcomeText: 'Risky move.'
      },
      {
        label: 'Let them pass',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'Safe but annoying.'
      }
    ]
  },
  {
    id: 'scenic_route',
    category: 'transport',
    title: 'SCENIC ROUTE',
    description: 'The satnav suggests a longer but nicer route.',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'Take it',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'time', value: -1 },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'Beautiful views.'
      },
      {
        label: 'Stay on highway',
        effect: { type: 'stat', stat: 'time', value: 0 },
        outcomeText: 'Efficiency first.'
      }
    ]
  }
]
