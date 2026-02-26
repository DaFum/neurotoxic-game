// Gig Events
export const GIG_EVENTS = [
  {
    id: 'gig_mid_strings_snapped',
    category: 'gig',
    title: 'events:gig_mid_strings_snapped.title',
    description: 'events:gig_mid_strings_snapped.desc',
    trigger: 'gig_mid',
    chance: 0.1,
    options: [
      {
        label: 'events:gig_mid_strings_snapped.opt1.label',
        effect: { type: 'stat', stat: 'score', value: -500 },
        outcomeText: 'events:gig_mid_strings_snapped.opt1.outcome'
      },
      {
        label: 'events:gig_mid_strings_snapped.opt2.label',
        skillCheck: {
          stat: 'technical',
          threshold: 5,
          success: {
            type: 'stat',
            stat: 'score',
            value: 100,
            description: 'events:gig_mid_strings_snapped.opt2.d_a1d3'
          },
          failure: {
            type: 'stat',
            stat: 'score',
            value: -200,
            description: 'events:gig_mid_strings_snapped.opt2.d_8f05'
          }
        },
        outcomeText: 'events:gig_mid_strings_snapped.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_intro_drunk_fan',
    category: 'gig',
    title: 'events:gig_intro_drunk_fan.title',
    description: "events:gig_intro_drunk_fan.desc",
    trigger: 'gig_intro',
    chance: 0.2,
    options: [
      {
        label: 'events:gig_intro_drunk_fan.opt1.label',
        effect: { type: 'stat', stat: 'mood', value: -2 },
        outcomeText: 'events:gig_intro_drunk_fan.opt1.outcome'
      },
      {
        label: 'events:gig_intro_drunk_fan.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 5,
          success: { type: 'stat', stat: 'hype', value: 10 },
          failure: { type: 'stat', stat: 'hype', value: -10 }
        },
        outcomeText: 'events:gig_intro_drunk_fan.opt2.outcome'
      }
    ]
  },
  {
    id: 'amp_feedback_loop',
    category: 'gig',
    title: 'events:amp_feedback_loop.title',
    description: 'events:amp_feedback_loop.desc',
    trigger: 'gig_mid',
    chance: 0.08,
    options: [
      {
        label: 'events:amp_feedback_loop.opt1.label',
        effect: { type: 'stat', stat: 'score', value: 200 },
        outcomeText: 'events:amp_feedback_loop.opt1.outcome'
      },
      {
        label: 'events:amp_feedback_loop.opt2.label',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 150 },
          failure: { type: 'stat', stat: 'score', value: -300 }
        },
        outcomeText: 'events:amp_feedback_loop.opt2.outcome'
      }
    ]
  },
  {
    id: 'crowd_surf_disaster',
    category: 'gig',
    title: 'events:crowd_surf_disaster.title',
    description: 'events:crowd_surf_disaster.desc',
    trigger: 'gig_mid',
    chance: 0.05,
    options: [
      {
        label: 'events:crowd_surf_disaster.opt1.label',
        effect: { type: 'stat', stat: 'score', value: -500 },
        outcomeText: 'events:crowd_surf_disaster.opt1.outcome'
      },
      {
        label: 'events:crowd_surf_disaster.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'score', value: 300 },
            { type: 'stat', stat: 'mood', value: -5 }
          ]
        },
        outcomeText: 'events:crowd_surf_disaster.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_intro_dead_air',
    category: 'gig',
    title: 'events:gig_intro_dead_air.title',
    description: 'events:gig_intro_dead_air.desc',
    trigger: 'gig_intro',
    chance: 0.12,
    options: [
      {
        label: 'events:gig_intro_dead_air.opt1.label',
        effect: { type: 'stat', stat: 'hype', value: 10 },
        outcomeText: 'events:gig_intro_dead_air.opt1.outcome'
      },
      {
        label: 'events:gig_intro_dead_air.opt2.label',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'hype', value: 5 },
          failure: { type: 'stat', stat: 'hype', value: -10 }
        },
        outcomeText: 'events:gig_intro_dead_air.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_intro_monitor_fail',
    category: 'gig',
    title: 'events:gig_intro_monitor_fail.title',
    description: 'events:gig_intro_monitor_fail.desc',
    trigger: 'gig_intro',
    chance: 0.1,
    options: [
      {
        label: 'events:gig_intro_monitor_fail.opt1.label',
        effect: { type: 'stat', stat: 'score', value: -200 },
        outcomeText: 'events:gig_intro_monitor_fail.opt1.outcome'
      },
      {
        label: 'events:gig_intro_monitor_fail.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 150 },
          failure: { type: 'stat', stat: 'score', value: -250 }
        },
        outcomeText: 'events:gig_intro_monitor_fail.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_pick_drop',
    category: 'gig',
    title: 'events:gig_mid_pick_drop.title',
    description: 'events:gig_mid_pick_drop.desc',
    trigger: 'gig_mid',
    chance: 0.12,
    options: [
      {
        label: 'events:gig_mid_pick_drop.opt1.label',
        effect: { type: 'stat', stat: 'score', value: -150 },
        outcomeText: 'events:gig_mid_pick_drop.opt1.outcome'
      },
      {
        label: 'events:gig_mid_pick_drop.opt2.label',
        skillCheck: {
          stat: 'technical',
          threshold: 5,
          success: { type: 'stat', stat: 'score', value: 80 },
          failure: { type: 'stat', stat: 'score', value: -120 }
        },
        outcomeText: 'events:gig_mid_pick_drop.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_feedback',
    category: 'gig',
    title: 'events:gig_mid_feedback.title',
    description: 'events:gig_mid_feedback.desc',
    trigger: 'gig_mid',
    chance: 0.1,
    options: [
      {
        label: 'events:gig_mid_feedback.opt1.label',
        effect: { type: 'stat', stat: 'score', value: 120 },
        outcomeText: 'events:gig_mid_feedback.opt1.outcome'
      },
      {
        label: 'events:gig_mid_feedback.opt2.label',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 100 },
          failure: { type: 'stat', stat: 'score', value: -200 }
        },
        outcomeText: 'events:gig_mid_feedback.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_broken_stick',
    category: 'gig',
    title: 'events:gig_mid_broken_stick.title',
    description: 'events:gig_mid_broken_stick.desc',
    trigger: 'gig_mid',
    chance: 0.09,
    options: [
      {
        label: 'events:gig_mid_broken_stick.opt1.label',
        effect: { type: 'stat', stat: 'score', value: -120 },
        outcomeText: 'events:gig_mid_broken_stick.opt1.outcome'
      },
      {
        label: 'events:gig_mid_broken_stick.opt2.label',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'score', value: 140 },
          failure: { type: 'stat', stat: 'score', value: -160 }
        },
        outcomeText: 'events:gig_mid_broken_stick.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_stage_diver',
    category: 'gig',
    title: 'events:gig_mid_stage_diver.title',
    description: 'events:gig_mid_stage_diver.desc',
    trigger: 'gig_mid',
    chance: 0.06,
    options: [
      {
        label: 'events:gig_mid_stage_diver.opt1.label',
        effect: { type: 'stat', stat: 'score', value: 200 },
        flags: ['stageDive'],
        outcomeText: 'events:gig_mid_stage_diver.opt1.outcome'
      },
      {
        label: 'events:gig_mid_stage_diver.opt2.label',
        effect: { type: 'stat', stat: 'score', value: -80 },
        outcomeText: 'events:gig_mid_stage_diver.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_tempo_wobble',
    category: 'gig',
    title: 'events:gig_mid_tempo_wobble.title',
    description: 'events:gig_mid_tempo_wobble.desc',
    trigger: 'gig_mid',
    chance: 0.1,
    options: [
      {
        label: 'events:gig_mid_tempo_wobble.opt1.label',
        skillCheck: {
          stat: 'skill',
          threshold: 7,
          success: { type: 'stat', stat: 'score', value: 200 },
          failure: { type: 'stat', stat: 'score', value: -250 }
        },
        outcomeText: 'events:gig_mid_tempo_wobble.opt1.outcome'
      },
      {
        label: 'events:gig_mid_tempo_wobble.opt2.label',
        effect: { type: 'stat', stat: 'score', value: -150 },
        outcomeText: 'events:gig_mid_tempo_wobble.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_crowd_chant',
    category: 'gig',
    title: 'events:gig_mid_crowd_chant.title',
    description: 'events:gig_mid_crowd_chant.desc',
    trigger: 'gig_mid',
    chance: 0.05,
    options: [
      {
        label: 'events:gig_mid_crowd_chant.opt1.label',
        effect: { type: 'stat', stat: 'hype', value: 10 },
        outcomeText: 'events:gig_mid_crowd_chant.opt1.outcome'
      },
      {
        label: 'events:gig_mid_crowd_chant.opt2.label',
        effect: { type: 'stat', stat: 'score', value: 100 },
        outcomeText: 'events:gig_mid_crowd_chant.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_intro_wrong_song',
    category: 'gig',
    title: 'events:gig_intro_wrong_song.title',
    description: 'events:gig_intro_wrong_song.desc',
    trigger: 'gig_intro',
    chance: 0.06,
    options: [
      {
        label: 'events:gig_intro_wrong_song.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'hype', value: 8 },
          failure: { type: 'stat', stat: 'hype', value: -8 }
        },
        outcomeText: 'events:gig_intro_wrong_song.opt1.outcome'
      },
      {
        label: 'events:gig_intro_wrong_song.opt2.label',
        effect: { type: 'stat', stat: 'score', value: -300 },
        outcomeText: 'events:gig_intro_wrong_song.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_string_tuning_drift',
    category: 'gig',
    title: 'events:gig_mid_string_tuning_drift.title',
    description: 'events:gig_mid_string_tuning_drift.desc',
    trigger: 'gig_mid',
    chance: 0.08,
    options: [
      {
        label: 'events:gig_mid_string_tuning_drift.opt1.label',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 120 },
          failure: { type: 'stat', stat: 'score', value: -180 }
        },
        outcomeText: 'events:gig_mid_string_tuning_drift.opt1.outcome'
      },
      {
        label: 'events:gig_mid_string_tuning_drift.opt2.label',
        effect: { type: 'stat', stat: 'score', value: -200 },
        outcomeText: 'events:gig_mid_string_tuning_drift.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_power_dip',
    category: 'gig',
    title: 'events:gig_mid_power_dip.title',
    description: 'events:gig_mid_power_dip.desc',
    trigger: 'gig_mid',
    chance: 0.04,
    options: [
      {
        label: 'events:gig_mid_power_dip.opt1.label',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'score', value: 150 },
          failure: { type: 'stat', stat: 'score', value: -350 }
        },
        outcomeText: 'events:gig_mid_power_dip.opt1.outcome'
      },
      {
        label: 'events:gig_mid_power_dip.opt2.label',
        effect: { type: 'stat', stat: 'score', value: -100 },
        outcomeText: 'events:gig_mid_power_dip.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_intro_huge_cheer',
    category: 'gig',
    title: 'events:gig_intro_huge_cheer.title',
    description: 'events:gig_intro_huge_cheer.desc',
    trigger: 'gig_intro',
    chance: 0.05,
    options: [
      {
        label: 'events:gig_intro_huge_cheer.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'score', value: 300 },
            { type: 'stat', stat: 'hype', value: 10 }
          ]
        },
        outcomeText: 'events:gig_intro_huge_cheer.opt1.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_mic_cut',
    category: 'gig',
    title: 'events:gig_mid_mic_cut.title',
    description: 'events:gig_mid_mic_cut.desc',
    trigger: 'gig_mid',
    chance: 0.08,
    options: [
      {
        label: 'events:gig_mid_mic_cut.opt1.label',
        effect: { type: 'stat', stat: 'score', value: 200 },
        outcomeText: 'events:gig_mid_mic_cut.opt1.outcome'
      },
      {
        label: 'events:gig_mid_mic_cut.opt2.label',
        skillCheck: {
          stat: 'technical',
          threshold: 6,
          success: { type: 'stat', stat: 'score', value: 120 },
          failure: { type: 'stat', stat: 'score', value: -220 }
        },
        outcomeText: 'events:gig_mid_mic_cut.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_bad_mix',
    category: 'gig',
    title: 'events:gig_mid_bad_mix.title',
    description: 'events:gig_mid_bad_mix.desc',
    trigger: 'gig_mid',
    chance: 0.06,
    options: [
      {
        label: 'events:gig_mid_bad_mix.opt1.label',
        effect: { type: 'stat', stat: 'score', value: 80 },
        outcomeText: 'events:gig_mid_bad_mix.opt1.outcome'
      },
      {
        label: 'events:gig_mid_bad_mix.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'score', value: -150 },
            { type: 'stat', stat: 'mood', value: -5 }
          ]
        },
        outcomeText: 'events:gig_mid_bad_mix.opt2.outcome'
      }
    ]
  },
  {
    id: 'gig_mid_perfect_breakdown',
    category: 'gig',
    title: 'events:gig_mid_perfect_breakdown.title',
    description: 'events:gig_mid_perfect_breakdown.desc',
    trigger: 'gig_mid',
    chance: 0.05,
    options: [
      {
        label: 'events:gig_mid_perfect_breakdown.opt1.label',
        effect: { type: 'stat', stat: 'score', value: 500 },
        outcomeText: 'events:gig_mid_perfect_breakdown.opt1.outcome'
      }
    ]
  }
]
