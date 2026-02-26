// Band Events
export const BAND_EVENTS = [
  {
    id: 'internal_dispute',
    category: 'band',
    tags: ['conflict'],
    title: 'events:internal_dispute.title',
    description: 'events:internal_dispute.description',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'events:internal_dispute.option_slow',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'events:internal_dispute.outcome_slow'
      },
      {
        label: 'events:internal_dispute.option_fast',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'events:internal_dispute.outcome_fast'
      },
      {
        label: 'events:internal_dispute.option_compromise',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 5,
            description: 'events:internal_dispute.success_compromise'
          },
          failure: {
            type: 'stat',
            stat: 'harmony',
            value: -10,
            description: 'events:internal_dispute.failure_compromise'
          }
        },
        outcomeText: 'events:internal_dispute.outcome_compromise'
      }
    ]
  },
  {
    id: 'late_night_party',
    category: 'band',
    title: 'events:late_night_party.title',
    description: 'events:late_night_party.desc',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'events:late_night_party.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            {
              type: 'stat',
              stat: 'stamina',
              value: -20,
              description: 'events:late_night_party.opt2.d_178c'
            },
            {
              type: 'stat',
              stat: 'mood',
              value: 10,
              description: 'events:late_night_party.opt3.d_d207'
            },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'events:late_night_party.opt3.outcome'
      },
      {
        label: 'events:late_night_party.opt4.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: 10 },
            {
              type: 'stat',
              stat: 'mood',
              value: -5,
              description: 'events:late_night_party.opt5.d_bcd1'
            }
          ]
        },
        outcomeText: 'events:late_night_party.opt5.outcome'
      }
    ]
  },
  {
    id: 'writers_block',
    category: 'band',
    title: "events:writers_block.title",
    description: 'events:writers_block.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:writers_block.opt1.label',
        skillCheck: {
          stat: 'skill',
          threshold: 8,
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 10,
            description: 'events:writers_block.opt1.d_daa8'
          },
          failure: {
            type: 'composite',
            effects: [
              {
                type: 'stat',
                stat: 'mood',
                value: -15,
                description: 'events:writers_block.opt2.d_5ccd'
              },
              { type: 'stat', stat: 'stamina', value: -10 }
            ]
          }
        },
        outcomeText: 'events:writers_block.opt2.outcome'
      },
      {
        label: 'events:writers_block.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            {
              type: 'resource',
              resource: 'money',
              value: -50,
              description: 'events:writers_block.opt4.d_56f9'
            },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'events:writers_block.opt4.outcome'
      }
    ]
  },
  {
    id: 'ego_clash',
    category: 'band',
    tags: ['conflict'],
    title: 'events:ego_clash.title',
    description: 'events:ego_clash.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:ego_clash.opt1.label',
        effect: { type: 'stat', stat: 'harmony', value: 5 },
        outcomeText: 'events:ego_clash.opt1.outcome'
      },
      {
        label: 'events:ego_clash.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -10 },
        outcomeText: 'events:ego_clash.opt2.outcome'
      }
    ]
  },
  {
    id: 'gear_upgrade_argument',
    category: 'band',
    tags: ['conflict'],
    title: 'events:gear_upgrade_argument.title',
    description: 'events:gear_upgrade_argument.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:gear_upgrade_argument.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -200 },
        outcomeText: 'events:gear_upgrade_argument.opt1.outcome'
      },
      {
        label: 'events:gear_upgrade_argument.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'harmony', value: 5 },
          failure: { type: 'stat', stat: 'harmony', value: -10 }
        },
        outcomeText: 'events:gear_upgrade_argument.opt2.outcome'
      }
    ]
  },
  {
    id: 'setlist_argument',
    category: 'band',
    tags: ['conflict'],
    title: 'events:setlist_argument.title',
    description: 'events:setlist_argument.desc',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'events:setlist_argument.opt1.label',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'events:setlist_argument.opt1.outcome'
      },
      {
        label: 'events:setlist_argument.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'events:setlist_argument.opt2.outcome'
      },
      {
        label: 'events:setlist_argument.opt3.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'harmony', value: 8 },
          failure: { type: 'stat', stat: 'harmony', value: -12 }
        },
        outcomeText: 'events:setlist_argument.opt3.outcome'
      }
    ]
  },
  {
    id: 'van_silence',
    category: 'band',
    tags: ['conflict'],
    title: 'events:van_silence.title',
    description: 'events:van_silence.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:van_silence.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 5,
          success: { type: 'stat', stat: 'harmony', value: 6 },
          failure: { type: 'stat', stat: 'mood', value: -5 }
        },
        outcomeText: 'events:van_silence.opt1.outcome'
      },
      {
        label: 'events:van_silence.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -3 },
        outcomeText: 'events:van_silence.opt2.outcome'
      }
    ]
  },
  {
    id: 'late_soundcheck_blame',
    category: 'band',
    tags: ['conflict'],
    title: 'events:late_soundcheck_blame.title',
    description: 'events:late_soundcheck_blame.desc',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'events:late_soundcheck_blame.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: -5 },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'events:late_soundcheck_blame.opt1.outcome'
      },
      {
        label: 'events:late_soundcheck_blame.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -8 },
        outcomeText: 'events:late_soundcheck_blame.opt2.outcome'
      }
    ]
  },
  {
    id: 'practice_room_rage',
    category: 'band',
    tags: ['conflict'],
    title: 'events:practice_room_rage.title',
    description: 'events:practice_room_rage.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:practice_room_rage.opt1.label',
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
        outcomeText: 'events:practice_room_rage.opt1.outcome'
      },
      {
        label: 'events:practice_room_rage.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'events:practice_room_rage.opt2.outcome'
      }
    ]
  },
  {
    id: 'band_photo_day',
    category: 'band',
    title: 'events:band_photo_day.title',
    description: 'events:band_photo_day.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:band_photo_day.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -20 },
        outcomeText: 'events:band_photo_day.opt1.outcome'
      },
      {
        label: 'events:band_photo_day.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'events:band_photo_day.opt2.outcome'
      }
    ]
  },
  {
    id: 'new_song_debut_fear',
    category: 'band',
    title: 'events:new_song_debut_fear.title',
    description: 'events:new_song_debut_fear.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:new_song_debut_fear.opt1.label',
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
        outcomeText: 'events:new_song_debut_fear.opt1.outcome'
      },
      {
        label: 'events:new_song_debut_fear.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: 5 },
        outcomeText: 'events:new_song_debut_fear.opt2.outcome'
      }
    ]
  },
  {
    id: 'merch_table_duty',
    category: 'band',
    title: 'events:merch_table_duty.title',
    description: 'events:merch_table_duty.desc',
    trigger: 'random',
    chance: 0.05,
    options: [
      {
        label: 'events:merch_table_duty.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: -5 },
            { type: 'resource', resource: 'money', value: 10 }
          ]
        },
        outcomeText: 'events:merch_table_duty.opt1.outcome'
      },
      {
        label: 'events:merch_table_duty.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'events:merch_table_duty.opt2.outcome'
      }
    ]
  },
  {
    id: 'sleeping_floor_fight',
    category: 'band',
    title: 'events:sleeping_floor_fight.title',
    description: 'events:sleeping_floor_fight.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:sleeping_floor_fight.opt1.label',
        skillCheck: {
          stat: 'luck',
          threshold: 5,
          success: { type: 'stat', stat: 'harmony', value: 5 },
          failure: { type: 'stat', stat: 'harmony', value: -5 }
        },
        outcomeText: 'events:sleeping_floor_fight.opt1.outcome'
      },
      {
        label: 'events:sleeping_floor_fight.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: 5 },
            { type: 'stat', stat: 'stamina', value: -5 }
          ]
        },
        outcomeText: 'events:sleeping_floor_fight.opt2.outcome'
      }
    ]
  },
  {
    id: 'band_prank',
    category: 'band',
    title: 'events:band_prank.title',
    description: 'events:band_prank.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:band_prank.opt1.label',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'events:band_prank.opt1.outcome'
      },
      {
        label: 'events:band_prank.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -8 },
        outcomeText: 'events:band_prank.opt2.outcome'
      }
    ]
  },
  {
    id: 'ego_clash_2',
    category: 'band',
    tags: ['conflict'],
    title: 'events:ego_clash_2.title',
    description: 'events:ego_clash_2.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:ego_clash_2.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: 5 },
            { type: 'stat', stat: 'time', value: -0.5 }
          ]
        },
        outcomeText: 'events:ego_clash_2.opt1.outcome'
      },
      {
        label: 'events:ego_clash_2.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: 5 },
            { type: 'stat', stat: 'harmony', value: -5 }
          ]
        },
        outcomeText: 'events:ego_clash_2.opt2.outcome'
      }
    ]
  },
  {
    id: 'vocal_warmup_cringe',
    category: 'band',
    title: 'events:vocal_warmup_cringe.title',
    description: 'events:vocal_warmup_cringe.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:vocal_warmup_cringe.opt1.label',
        effect: { type: 'stat', stat: 'harmony', value: 5 },
        outcomeText: 'events:vocal_warmup_cringe.opt1.outcome'
      },
      {
        label: 'events:vocal_warmup_cringe.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:vocal_warmup_cringe.opt2.outcome'
      }
    ]
  },
  {
    id: 'band_meeting',
    category: 'band',
    title: 'events:band_meeting.title',
    description: 'events:band_meeting.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:band_meeting.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: { type: 'stat', stat: 'harmony', value: 12 },
          failure: { type: 'stat', stat: 'harmony', value: -8 }
        },
        outcomeText: 'events:band_meeting.opt1.outcome'
      },
      {
        label: 'events:band_meeting.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -3 },
        outcomeText: 'events:band_meeting.opt2.outcome'
      }
    ]
  },
  {
    id: 'lost_setlist_notes',
    category: 'band',
    title: 'events:lost_setlist_notes.title',
    description: 'events:lost_setlist_notes.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:lost_setlist_notes.opt1.label',
        skillCheck: {
          stat: 'skill',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 5 },
          failure: { type: 'stat', stat: 'mood', value: -5 }
        },
        outcomeText: 'events:lost_setlist_notes.opt1.outcome'
      },
      {
        label: 'events:lost_setlist_notes.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -4 },
        outcomeText: 'events:lost_setlist_notes.opt2.outcome'
      }
    ]
  },
  {
    id: 'backstage_argument',
    category: 'band',
    tags: ['conflict'],
    title: 'events:backstage_argument.title',
    description: 'events:backstage_argument.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:backstage_argument.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 8,
          success: { type: 'stat', stat: 'harmony', value: 10 },
          failure: { type: 'stat', stat: 'harmony', value: -15 }
        },
        outcomeText: 'events:backstage_argument.opt1.outcome'
      },
      {
        label: 'events:backstage_argument.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: -5 },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'events:backstage_argument.opt2.outcome'
      }
    ]
  },
  {
    id: 'creative_high',
    category: 'band',
    title: 'events:creative_high.title',
    description: 'events:creative_high.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:creative_high.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'mood', value: 10 },
            { type: 'stat', stat: 'harmony', value: 5 }
          ]
        },
        outcomeText: 'events:creative_high.opt1.outcome'
      }
    ]
  },
  {
    id: 'sore_throat',
    category: 'band',
    title: 'events:sore_throat.title',
    description: 'events:sore_throat.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:sore_throat.opt1.label',
        effect: { type: 'resource', resource: 'money', value: -10 },
        outcomeText: 'events:sore_throat.opt1.outcome'
      },
      {
        label: 'events:sore_throat.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -5 },
        outcomeText: 'events:sore_throat.opt2.outcome'
      }
    ]
  },
  {
    id: 'band_bonding_walk',
    category: 'band',
    title: 'events:band_bonding_walk.title',
    description: 'events:band_bonding_walk.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:band_bonding_walk.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: 8 },
            { type: 'stat', stat: 'mood', value: 5 }
          ]
        },
        outcomeText: 'events:band_bonding_walk.opt1.outcome'
      },
      {
        label: 'events:band_bonding_walk.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: 5 },
        outcomeText: 'events:band_bonding_walk.opt2.outcome'
      }
    ]
  },
  {
    id: 'tempo_police',
    category: 'band',
    tags: ['conflict'],
    title: 'events:tempo_police.title',
    description: 'events:tempo_police.desc',
    trigger: 'random',
    chance: 0.04,
    options: [
      {
        label: 'events:tempo_police.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'stamina', value: -10 },
            { type: 'stat', stat: 'harmony', value: 8 }
          ]
        },
        outcomeText: 'events:tempo_police.opt1.outcome'
      },
      {
        label: 'events:tempo_police.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -6 },
        outcomeText: 'events:tempo_police.opt2.outcome'
      }
    ]
  },
  {
    id: 'forgotten_lyrics',
    category: 'band',
    title: 'events:forgotten_lyrics.title',
    description: 'events:forgotten_lyrics.desc',
    trigger: 'random',
    chance: 0.03,
    options: [
      {
        label: 'events:forgotten_lyrics.opt1.label',
        effect: { type: 'stat', stat: 'time', value: -0.5 },
        outcomeText: 'events:forgotten_lyrics.opt1.outcome'
      },
      {
        label: 'events:forgotten_lyrics.opt2.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { type: 'stat', stat: 'mood', value: 5 },
          failure: { type: 'stat', stat: 'harmony', value: -6 }
        },
        outcomeText: 'events:forgotten_lyrics.opt2.outcome'
      }
    ]
  }
]
