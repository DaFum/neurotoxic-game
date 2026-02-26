// Transport Events
export const TRANSPORT_EVENTS = [
  {
    id: 'van_breakdown_tire',
    category: 'transport',
    title: 'events:van_breakdown_tire.title',
    description: 'events:van_breakdown_tire.desc',
    trigger: 'travel',
    chance: 0.08,
    options: [
      {
        label: 'events:van_breakdown_tire.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -50 },
            {
              type: 'stat',
              stat: 'time',
              value: -2,
              description: 'events:van_breakdown_tire.opt2.d_bb01'
            }
          ]
        },
        outcomeText: 'events:van_breakdown_tire.opt2.outcome'
      },
      {
        label: 'events:van_breakdown_tire.opt3.label',
        skillCheck: {
          stat: 'stamina', // Check against random band member's stamina
          threshold: 5, // Easy check
          success: {
            type: 'stat',
            stat: 'time',
            value: -1,
            description: 'events:van_breakdown_tire.opt3.d_f283'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'time', value: -3 },
              {
                type: 'stat',
                stat: 'stamina',
                value: -10,
                description: 'events:van_breakdown_tire.opt4.d_18ab'
              }
            ]
          }
        },
        outcomeText: 'events:van_breakdown_tire.opt4.outcome'
      }
    ]
  },
  {
    id: 'van_breakdown_engine',
    category: 'transport',
    title: 'events:van_breakdown_engine.title',
    description: 'events:van_breakdown_engine.desc',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'events:van_breakdown_engine.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -200 },
            { type: 'stat', stat: 'time', value: -4 }
          ]
        },
        outcomeText: 'events:van_breakdown_engine.opt1.outcome'
      },
      {
        label: 'events:van_breakdown_engine.opt2.label',
        skillCheck: {
          stat: 'skill',
          threshold: 7,
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 10,
            description: 'events:van_breakdown_engine.opt2.d_2a50'
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
        outcomeText: 'events:van_breakdown_engine.opt2.outcome'
      }
    ]
  },
  {
    id: 'van_critical_failure',
    category: 'transport',
    title: 'events:van_critical_failure.title',
    description: "events:van_critical_failure.desc",
    trigger: 'travel',
    chance: 0, // Triggered by chain only
    options: [
      {
        label: 'events:van_critical_failure.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -100 },
            {
              type: 'stat',
              stat: 'time',
              value: -24,
              description: 'events:van_critical_failure.opt2.d_eebb'
            }
          ]
        },
        outcomeText: 'events:van_critical_failure.opt2.outcome'
      },
      {
        label: 'events:van_critical_failure.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -500 },
            { type: 'flag', flag: 'RENTAL_VAN' }
          ]
        },
        outcomeText: 'events:van_critical_failure.opt3.outcome'
      }
    ]
  },
  {
    id: 'police_control',
    category: 'transport',
    title: 'events:police_control.title',
    description: "events:police_control.desc",
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'events:police_control.opt1.label',
        effect: {
          type: 'stat',
          stat: 'time',
          value: -0.5,
          description: 'events:police_control.opt1.d_e9ba'
        },
        outcomeText: 'events:police_control.opt1.outcome'
      },
      {
        label: 'events:police_control.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'stat',
            stat: 'fame',
            value: 5,
            description: 'events:police_control.opt2.d_6291'
          },
          failure: {
            type: 'resource',
            resource: 'money',
            value: -150,
            description: 'events:police_control.opt2.d_f065'
          }
        },
        outcomeText: 'events:police_control.opt2.outcome'
      },
      {
        label: 'events:police_control.opt3.label',
        skillCheck: {
          stat: 'stamina', // Placeholder for driving skill
          threshold: 9,
          success: {
            type: 'stat',
            stat: 'mood',
            value: 20,
            description: 'events:police_control.opt3.d_a844'
          },
          failure: { type: 'game_over', description: 'Arrested. Tour Over.' }
        },
        outcomeText: 'events:police_control.opt3.outcome'
      }
    ]
  },
  {
    id: 'wrong_turn',
    category: 'transport',
    title: 'events:wrong_turn.title',
    description: 'events:wrong_turn.desc',
    trigger: 'travel',
    chance: 0.03,
    options: [
      {
        label: 'events:wrong_turn.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'fuel', value: -5 },
            { type: 'stat', stat: 'time', value: -1 }
          ]
        },
        outcomeText: 'events:wrong_turn.opt1.outcome'
      },
      {
        label: 'events:wrong_turn.opt2.label',
        skillCheck: {
          stat: 'luck', // Implicit check
          threshold: 5, // 50/50
          success: {
            type: 'unlock',
            unlock: 'rare_vinyl',
            description: 'events:wrong_turn.opt2.d_d549'
          },
          failure: {
            type: 'stat',
            stat: 'time',
            value: -2,
            description: 'events:wrong_turn.opt2.d_74ca'
          }
        },
        outcomeText: 'events:wrong_turn.opt2.outcome'
      }
    ]
  },
  {
    id: 'traffic_jam',
    category: 'transport',
    title: 'events:traffic_jam.title',
    description: 'events:traffic_jam.desc',
    trigger: 'travel',
    chance: 0.07,
    options: [
      {
        label: 'events:traffic_jam.opt1.label',
        effect: { type: 'stat', stat: 'time', value: -2 },
        outcomeText: 'events:traffic_jam.opt1.outcome'
      },
      {
        label: 'events:traffic_jam.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 4,
          success: {
            type: 'stat',
            stat: 'time',
            value: -1,
            description: 'events:traffic_jam.opt2.d_a401'
          },
          failure: {
            type: 'composite',
            effects: [
              {
                type: 'stat',
                stat: 'time',
                value: -3,
                description: 'events:traffic_jam.opt3.d_deb3'
              },
              { type: 'resource', resource: 'fuel', value: -10 }
            ]
          }
        },
        outcomeText: 'events:traffic_jam.opt3.outcome'
      }
    ]
  },
  {
    id: 'hitchhiker',
    category: 'transport',
    title: 'events:hitchhiker.title',
    description: 'events:hitchhiker.desc',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'events:hitchhiker.opt1.label',
        skillCheck: {
          stat: 'luck',
          threshold: 3, // Mostly good outcomes
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 10,
            description: 'events:hitchhiker.opt1.d_7509'
          },
          failure: {
            type: 'resource',
            resource: 'money',
            value: -50,
            description: 'events:hitchhiker.opt1.d_9cfe'
          }
        },
        outcomeText: 'events:hitchhiker.opt1.outcome'
      },
      {
        label: 'events:hitchhiker.opt2.label',
        effect: {
          type: 'stat',
          stat: 'harmony',
          value: -5,
          description: 'events:hitchhiker.opt2.d_43e6'
        },
        outcomeText: 'events:hitchhiker.opt2.outcome'
      }
    ]
  },
  {
    id: 'wild_accident',
    category: 'transport',
    title: 'events:wild_accident.title',
    description: 'events:wild_accident.desc',
    trigger: 'travel',
    chance: 0.02,
    options: [
      {
        label: 'events:wild_accident.opt1.label',
        skillCheck: {
          stat: 'stamina',
          threshold: 6,
          success: {
            type: 'stat',
            stat: 'mood',
            value: -10,
            description: 'events:wild_accident.opt1.d_d2cd'
          },
          failure: {
            type: 'composite',
            effects: [
              {
                type: 'resource',
                resource: 'money',
                value: -500,
                description: 'events:wild_accident.opt2.d_7bd0'
              },
              { type: 'stat', stat: 'van_condition', value: -20 }
            ]
          }
        },
        outcomeText: 'events:wild_accident.opt2.outcome'
      }
    ]
  },
  {
    id: 'gas_station_encounter',
    category: 'transport',
    title: 'events:gas_station_encounter.title',
    description: 'events:gas_station_encounter.desc',
    trigger: 'travel',
    chance: 0.06,
    options: [
      {
        label: 'events:gas_station_encounter.opt1.label',
        effect: {
          type: 'stat',
          stat: 'fame',
          value: 5,
          description: 'events:gas_station_encounter.opt1.d_0466'
        },
        outcomeText: 'events:gas_station_encounter.opt1.outcome'
      },
      {
        label: 'events:gas_station_encounter.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:gas_station_encounter.opt2.outcome'
      }
    ]
  },
  {
    id: 'speed_trap',
    category: 'transport',
    title: 'events:speed_trap.title',
    description: 'events:speed_trap.desc',
    trigger: 'travel',
    chance: 0.04,
    options: [
      {
        label: 'events:speed_trap.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -30 },
        outcomeText: 'events:speed_trap.opt1.outcome'
      }
    ]
  },
  {
    id: 'road_rage',
    category: 'transport',
    title: 'events:road_rage.title',
    description: 'events:road_rage.desc',
    trigger: 'travel',
    chance: 0.04,
    options: [
      {
        label: 'events:road_rage.opt1.label',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'mood', value: 5 },
          failure: { type: 'stat', stat: 'van_condition', value: -5 }
        },
        outcomeText: 'events:road_rage.opt1.outcome'
      },
      {
        label: 'events:road_rage.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:road_rage.opt2.outcome'
      }
    ]
  },
  {
    id: 'scenic_route',
    category: 'transport',
    title: 'events:scenic_route.title',
    description: 'events:scenic_route.desc',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'events:scenic_route.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'time', value: -1 },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'events:scenic_route.opt1.outcome'
      },
      {
        label: 'events:scenic_route.opt2.label',
        effect: { type: 'stat', stat: 'time', value: 0 },
        outcomeText: 'events:scenic_route.opt2.outcome'
      }
    ]
  },
  {
    id: 'fuel_leak',
    category: 'transport',
    title: 'events:fuel_leak.title',
    description: 'events:fuel_leak.desc',
    trigger: 'travel',
    chance: 0.04,
    options: [
      {
        label: 'events:fuel_leak.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -150 },
            { type: 'stat', stat: 'time', value: -2 }
          ]
        },
        outcomeText: 'events:fuel_leak.opt1.outcome'
      },
      {
        label: 'events:fuel_leak.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'time', value: 0 },
          failure: { type: 'chain', eventId: 'van_critical_failure' }
        },
        outcomeText: 'events:fuel_leak.opt2.outcome'
      }
    ]
  },
  {
    id: 'flat_battery',
    category: 'transport',
    title: 'events:flat_battery.title',
    description: 'events:flat_battery.desc',
    trigger: 'travel',
    chance: 0.06,
    options: [
      {
        label: 'events:flat_battery.opt1.label',
        effect: { type: 'stat', stat: 'time', value: -1 },
        outcomeText: 'events:flat_battery.opt1.outcome'
      },
      {
        label: 'events:flat_battery.opt2.label',
        effect: { type: 'resource', resource: 'money', value: -80 },
        outcomeText: 'events:flat_battery.opt2.outcome'
      }
    ]
  },
  {
    id: 'missed_exit',
    category: 'transport',
    title: 'events:missed_exit.title',
    description: 'events:missed_exit.desc',
    trigger: 'travel',
    chance: 0.06,
    options: [
      {
        label: 'events:missed_exit.opt1.label',
        effect: { type: 'stat', stat: 'time', value: -1 },
        outcomeText: 'events:missed_exit.opt1.outcome'
      },
      {
        label: 'events:missed_exit.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'events:missed_exit.opt2.outcome'
      }
    ]
  },
  {
    id: 'van_smell_attack',
    category: 'transport',
    title: 'events:van_smell_attack.title',
    description: 'events:van_smell_attack.desc',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'events:van_smell_attack.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'time', value: -0.5 },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'events:van_smell_attack.opt1.outcome'
      },
      {
        label: 'events:van_smell_attack.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:van_smell_attack.opt2.outcome'
      }
    ]
  },
  {
    id: 'rest_stop_fight',
    category: 'transport',
    title: 'events:rest_stop_fight.title',
    description: 'events:rest_stop_fight.desc',
    trigger: 'travel',
    chance: 0.03,
    options: [
      {
        label: 'events:rest_stop_fight.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: { type: 'stat', stat: 'harmony', value: 5 },
          failure: { type: 'stat', stat: 'harmony', value: -8 }
        },
        outcomeText: 'events:rest_stop_fight.opt1.outcome'
      },
      {
        label: 'events:rest_stop_fight.opt2.label',
        effect: { type: 'stat', stat: 'time', value: -0.5 },
        outcomeText: 'events:rest_stop_fight.opt2.outcome'
      }
    ]
  },
  {
    id: 'lost_key',
    category: 'transport',
    title: 'events:lost_key.title',
    description: 'events:lost_key.desc',
    trigger: 'travel',
    chance: 0.03,
    options: [
      {
        label: 'events:lost_key.opt1.label',
        effect: { type: 'stat', stat: 'time', value: -1 },
        outcomeText: 'events:lost_key.opt1.outcome'
      },
      {
        label: 'events:lost_key.opt2.label',
        effect: { type: 'resource', resource: 'money', value: -120 },
        outcomeText: 'events:lost_key.opt2.outcome'
      }
    ]
  },
  {
    id: 'rainstorm_drive',
    category: 'transport',
    title: 'events:rainstorm_drive.title',
    description: 'events:rainstorm_drive.desc',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'events:rainstorm_drive.opt1.label',
        effect: { type: 'stat', stat: 'time', value: -1 },
        outcomeText: 'events:rainstorm_drive.opt1.outcome'
      },
      {
        label: 'events:rainstorm_drive.opt2.label',
        skillCheck: {
          stat: 'stamina',
          threshold: 7,
          success: { type: 'stat', stat: 'time', value: -0.5 },
          failure: { type: 'stat', stat: 'time', value: -2 }
        },
        outcomeText: 'events:rainstorm_drive.opt2.outcome'
      }
    ]
  },
  {
    id: 'cheap_hotel_or_van',
    category: 'transport',
    title: 'events:cheap_hotel_or_van.title',
    description: 'events:cheap_hotel_or_van.desc',
    trigger: 'travel',
    chance: 0.04,
    options: [
      {
        label: 'events:cheap_hotel_or_van.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'resource', resource: 'money', value: -120 },
            { type: 'stat', stat: 'stamina', value: 15 }
          ]
        },
        outcomeText: 'events:cheap_hotel_or_van.opt1.outcome'
      },
      {
        label: 'events:cheap_hotel_or_van.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:cheap_hotel_or_van.opt2.outcome'
      }
    ]
  },
  {
    id: 'fuel_warning_light',
    category: 'transport',
    title: 'events:fuel_warning_light.title',
    description: 'events:fuel_warning_light.desc',
    trigger: 'travel',
    chance: 0.06,
    options: [
      {
        label: 'events:fuel_warning_light.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -40 },
        outcomeText: 'events:fuel_warning_light.opt1.outcome'
      },
      {
        label: 'events:fuel_warning_light.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 3 },
          failure: { type: 'chain', eventId: 'van_breakdown_engine' }
        },
        outcomeText: 'events:fuel_warning_light.opt2.outcome'
      }
    ]
  },
  {
    id: 'tire_pressure_warning',
    category: 'transport',
    title: 'events:tire_pressure_warning.title',
    description: 'events:tire_pressure_warning.desc',
    trigger: 'travel',
    chance: 0.05,
    options: [
      {
        label: 'events:tire_pressure_warning.opt1.label',
        effect: { type: 'stat', stat: 'time', value: -0.5 },
        outcomeText: 'events:tire_pressure_warning.opt1.outcome'
      },
      {
        label: 'events:tire_pressure_warning.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'time', value: 0 },
          failure: { type: 'chain', eventId: 'van_breakdown_tire' }
        },
        outcomeText: 'events:tire_pressure_warning.opt2.outcome'
      }
    ]
  }
]
