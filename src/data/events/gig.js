// Gig Events
export const GIG_EVENTS = [
  {
    id: 'gig_mid_strings_snapped',
    category: 'gig',
    title: 'STRING SNAPPED!',
    description: 'A sharp TWANG sounds from the guitar amp.',
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
          success: {
            type: 'stat',
            stat: 'score',
            value: 100,
            description: 'Crowd cheered the fix!'
          },
          failure: {
            type: 'stat',
            stat: 'score',
            value: -200,
            description: 'Took too long.'
          }
        },
        outcomeText: 'You scrambled for a string.'
      }
    ]
  },
  {
    id: 'gig_intro_drunk_fan',
    category: 'gig',
    title: 'DRUNK HECKLER',
    description: "Someone is yelling 'PLAY FREEBIRD' repeatedly.",
    trigger: 'gig_intro',
    chance: 0.2,
    options: [
      {
        label: 'Ignore',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'You started the set.'
      },
      {
        label: 'Mock him',
        skillCheck: {
          stat: 'charisma',
          threshold: 5,
          success: { type: 'stat', stat: 'hype', value: 10 },
          failure: { type: 'stat', stat: 'hype', value: -10 }
        },
        outcomeText: 'Crowd reaction.'
      }
    ]
  },
  {
    id: 'amp_feedback_loop',
    category: 'gig',
    title: 'FEEDBACK SCREAM',
    description: 'The amp starts screaming uncontrollably.',
    trigger: 'gig_mid',
    chance: 0.08,
    options: [
      {
        label: 'Embrace it [+200 Score]',
        effect: { type: 'stat', stat: 'score', value: 200 },
        outcomeText: 'Crowd thinks it’s intentional.'
      },
      {
        label: 'Fix it fast [Technical]',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 150 },
          failure: { type: 'stat', stat: 'score', value: -300 }
        },
        outcomeText: 'You dove for the knobs.'
      }
    ]
  },
  {
    id: 'crowd_surf_disaster',
    category: 'gig',
    title: 'CROWD SURF GONE WRONG',
    description: 'Someone falls during a crowd surf.',
    trigger: 'gig_mid',
    chance: 0.05,
    options: [
      {
        label: 'Stop show [-500 Score]',
        effect: { type: 'stat', stat: 'score', value: -500 },
        outcomeText: 'Responsible move.'
      },
      {
        label: 'Keep playing [+300 Score, -5 Mood]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'score', value: 300 },
            { type: 'stat', stat: 'mood', value: -5 }
          ]
        },
        outcomeText: 'Controversial.'
      }
    ]
  },
  {
    id: 'gig_intro_dead_air',
    category: 'gig',
    title: 'DEAD AIR',
    description: 'The intro track fails. The room stares at you.',
    trigger: 'gig_intro',
    chance: 0.12,
    options: [
      {
        label: 'Start raw [+10 Hype]',
        effect: { type: 'stat', stat: 'hype', value: 10 },
        outcomeText: 'No intro. Just violence.'
      },
      {
        label: 'Fix it quickly [Tech]',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'hype', value: 5 },
          failure: { type: 'stat', stat: 'hype', value: -10 }
        },
        outcomeText: 'You wrestle the cable gods.'
      }
    ]
  },
  {
    id: 'gig_intro_monitor_fail',
    category: 'gig',
    title: 'NO MONITORS',
    description: 'Monitors cut out right as you start.',
    trigger: 'gig_intro',
    chance: 0.1,
    options: [
      {
        label: 'Play through it [-200 Score]',
        effect: { type: 'stat', stat: 'score', value: -200 },
        outcomeText: 'You guess your way through the first song.'
      },
      {
        label: 'Signal the tech [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 150 },
          failure: { type: 'stat', stat: 'score', value: -250 }
        },
        outcomeText: 'You try to communicate with gestures and panic.'
      }
    ]
  },
  {
    id: 'gig_mid_pick_drop',
    category: 'gig',
    title: 'PICK DROP',
    description: 'Your pick flies into the void mid-riff.',
    trigger: 'gig_mid',
    chance: 0.12,
    options: [
      {
        label: 'Finger it (dangerous) [-150 Score]',
        effect: { type: 'stat', stat: 'score', value: -150 },
        outcomeText: 'It’s… not ideal.'
      },
      {
        label: 'Grab a spare [Tech]',
        skillCheck: {
          stat: 'technical',
          threshold: 5,
          success: { type: 'stat', stat: 'score', value: 80 },
          failure: { type: 'stat', stat: 'score', value: -120 }
        },
        outcomeText: 'You dive for the mic stand tape-picks.'
      }
    ]
  },
  {
    id: 'gig_mid_feedback',
    category: 'gig',
    title: 'FEEDBACK HOWL',
    description: 'A sudden feedback howl cuts through the mix.',
    trigger: 'gig_mid',
    chance: 0.1,
    options: [
      {
        label: 'Make it a moment [+120 Score]',
        effect: { type: 'stat', stat: 'score', value: 120 },
        outcomeText: 'The crowd thinks it’s intentional.'
      },
      {
        label: 'Kill it fast [Tech]',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 100 },
          failure: { type: 'stat', stat: 'score', value: -200 }
        },
        outcomeText: 'You wrestle the gain.'
      }
    ]
  },
  {
    id: 'gig_mid_broken_stick',
    category: 'gig',
    title: 'BROKEN STICK',
    description: 'Marius snaps a stick mid-song.',
    trigger: 'gig_mid',
    chance: 0.09,
    options: [
      {
        label: 'Keep going [-120 Score]',
        effect: { type: 'stat', stat: 'score', value: -120 },
        outcomeText: 'He improvises with half a stick.'
      },
      {
        label: 'Throw spare to Marius [Luck]',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'score', value: 140 },
          failure: { type: 'stat', stat: 'score', value: -160 }
        },
        outcomeText: 'The throw is… questionable.'
      }
    ]
  },
  {
    id: 'gig_mid_stage_diver',
    category: 'gig',
    title: 'STAGE DIVER',
    description: 'Someone attempts a stage dive at the worst possible time.',
    trigger: 'gig_mid',
    chance: 0.06,
    options: [
      {
        label: 'Let it happen [+200 Score]',
        effect: { type: 'stat', stat: 'score', value: 200 },
        flags: ['stageDive'],
        outcomeText: 'Chaos fuels the song.'
      },
      {
        label: 'Wave them off [-80 Score]',
        effect: { type: 'stat', stat: 'score', value: -80 },
        outcomeText: 'Safety first, hype second.'
      }
    ]
  },
  {
    id: 'gig_mid_tempo_wobble',
    category: 'gig',
    title: 'TEMPO WOBBLE',
    description: 'The band drifts slightly. The groove is threatened.',
    trigger: 'gig_mid',
    chance: 0.1,
    options: [
      {
        label: 'Lock in [Skill]',
        skillCheck: {
          stat: 'skill',
          threshold: 7,
          success: { type: 'stat', stat: 'score', value: 200 },
          failure: { type: 'stat', stat: 'score', value: -250 }
        },
        outcomeText: 'You stare each other into perfect timing.'
      },
      {
        label: 'Just blast through [-150 Score]',
        effect: { type: 'stat', stat: 'score', value: -150 },
        outcomeText: 'Speed covers sins… sometimes.'
      }
    ]
  },
  {
    id: 'gig_mid_crowd_chant',
    category: 'gig',
    title: 'CROWD CHANT',
    description: 'The crowd starts chanting your name mid-set.',
    trigger: 'gig_mid',
    chance: 0.05,
    options: [
      {
        label: 'Acknowledge [+10 Hype]',
        effect: { type: 'stat', stat: 'hype', value: 10 },
        outcomeText: 'You point and grin.'
      },
      {
        label: 'Stay focused [+100 Score]',
        effect: { type: 'stat', stat: 'score', value: 100 },
        outcomeText: 'Professional mode.'
      }
    ]
  },
  {
    id: 'gig_intro_wrong_song',
    category: 'gig',
    title: 'WRONG START',
    description: 'Someone starts the wrong song. Everybody notices.',
    trigger: 'gig_intro',
    chance: 0.06,
    options: [
      {
        label: 'Laugh and switch [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'hype', value: 8 },
          failure: { type: 'stat', stat: 'hype', value: -8 }
        },
        outcomeText: 'You try to make it charming.'
      },
      {
        label: 'Power through [-300 Score]',
        effect: { type: 'stat', stat: 'score', value: -300 },
        outcomeText: 'Confusion becomes the theme.'
      }
    ]
  },
  {
    id: 'gig_mid_string_tuning_drift',
    category: 'gig',
    title: 'TUNING DRIFT',
    description: 'The guitar slowly slips out of tune under hot lights.',
    trigger: 'gig_mid',
    chance: 0.08,
    options: [
      {
        label: 'Tune quickly [Tech]',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 120 },
          failure: { type: 'stat', stat: 'score', value: -180 }
        },
        outcomeText: 'You tune between parts like a machine.'
      },
      {
        label: 'Ignore it [-200 Score]',
        effect: { type: 'stat', stat: 'score', value: -200 },
        outcomeText: 'The crowd hears it. You hear it more.'
      }
    ]
  },
  {
    id: 'gig_mid_power_dip',
    category: 'gig',
    title: 'POWER DIP',
    description: 'The lights flicker. The amp sounds… worried.',
    trigger: 'gig_mid',
    chance: 0.04,
    options: [
      {
        label: 'Keep playing [Luck]',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'score', value: 150 },
          failure: { type: 'stat', stat: 'score', value: -350 }
        },
        outcomeText: 'You gamble with electricity.'
      },
      {
        label: 'Signal to cut a song [-100 Score]',
        effect: { type: 'stat', stat: 'score', value: -100 },
        outcomeText: 'You shorten the set to survive.'
      }
    ]
  },
  {
    id: 'gig_intro_huge_cheer',
    category: 'gig',
    title: 'HUGE CHEER',
    description: 'The room erupts when you walk on stage. Unexpected.',
    trigger: 'gig_intro',
    chance: 0.05,
    options: [
      {
        label: 'Ride it [+300 Score, +10 Hype]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'score', value: 300 },
            { type: 'stat', stat: 'hype', value: 10 }
          ]
        },
        outcomeText: 'You feel ten feet tall.'
      }
    ]
  },
  {
    id: 'gig_mid_mic_cut',
    category: 'gig',
    title: 'MIC CUTS OUT',
    description: 'Vocals vanish mid-chorus.',
    trigger: 'gig_mid',
    chance: 0.08,
    options: [
      {
        label: 'Let the crowd sing [+200 Score]',
        effect: { type: 'stat', stat: 'score', value: 200 },
        outcomeText: 'They carry you.'
      },
      {
        label: 'Swap mic [Tech]',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 120 },
          failure: { type: 'stat', stat: 'score', value: -220 }
        },
        outcomeText: 'You juggle cables mid-song.'
      }
    ]
  },
  {
    id: 'gig_mid_bad_mix',
    category: 'gig',
    title: 'BAD MIX NIGHT',
    description: 'Everything sounds like mud. You can’t fix the room.',
    trigger: 'gig_mid',
    chance: 0.06,
    options: [
      {
        label: 'Play simpler [+80 Score]',
        effect: { type: 'stat', stat: 'score', value: 80 },
        outcomeText: 'You adapt to survive.'
      },
      {
        label: 'Get angry [-150 Score, -5 Mood]',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'score', value: -150 },
            { type: 'stat', stat: 'mood', value: -5 }
          ]
        },
        outcomeText: 'Rage doesn’t EQ the room.'
      }
    ]
  },
  {
    id: 'gig_mid_perfect_breakdown',
    category: 'gig',
    title: 'PERFECT BREAKDOWN',
    description: 'Everything locks in. The pit explodes.',
    trigger: 'gig_mid',
    chance: 0.05,
    options: [
      {
        label: 'FEED IT [+500 Score]',
        effect: { type: 'stat', stat: 'score', value: 500 },
        outcomeText: 'That’s a core memory.'
      }
    ]
  }
]
