export const QUEST_EVENTS = [
  {
    id: 'quest_trigger_pick_of_destiny',
    category: 'special',
    title: 'events:quest_trigger_pick_of_destiny.title',
    description: 'events:quest_trigger_pick_of_destiny.desc',
    trigger: 'random',
    chance: 0.05,
    condition: state => !state.activeQuests || state.activeQuests.length === 0,
    options: [
      {
        label: 'events:quest_trigger_pick_of_destiny.opt1.label',
        effect: {
          type: 'quest',
          quest: {
            id: 'quest_pick_of_destiny',
            label: 'events:quest_pick_of_destiny.label',
            description: 'events:quest_pick_of_destiny.desc',
            deadlineOffset: 15,
            progress: 0,
            required: 3,
            rewardType: 'item',
            rewardData: { item: 'lucky_pick' }, // We'll add this item later or use a generic one
            moneyReward: 200
          }
        },
        outcomeText: 'events:quest_trigger_pick_of_destiny.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_pick_of_destiny.opt2.label',
        effect: { type: 'none' },
        outcomeText: 'events:quest_trigger_pick_of_destiny.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_viral_dance',
    category: 'band',
    title: 'events:quest_trigger_viral_dance.title',
    description: 'events:quest_trigger_viral_dance.desc',
    trigger: 'random',
    chance: 0.1,
    condition: state =>
      (!state.activeQuests || state.activeQuests.length === 0) &&
      (state.social?.tiktok || 0) < 5000,
    options: [
      {
        label: 'events:quest_trigger_viral_dance.opt1.label',
        effect: {
          type: 'quest',
          quest: {
            id: 'quest_viral_dance',
            label: 'events:quest_viral_dance.label',
            description: 'events:quest_viral_dance.desc',
            deadlineOffset: 5,
            progress: 0,
            required: 500,
            rewardType: 'fame',
            rewardData: { fame: 500 },
            moneyReward: 0
          }
        },
        outcomeText: 'events:quest_trigger_viral_dance.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_viral_dance.opt2.label',
        effect: { type: 'none' },
        outcomeText: 'events:quest_trigger_viral_dance.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_sponsor_demand',
    category: 'financial',
    title: 'events:quest_trigger_sponsor_demand.title',
    description: 'events:quest_trigger_sponsor_demand.desc',
    trigger: 'random',
    chance: 0.08,
    condition: state => !state.activeQuests || state.activeQuests.length === 0,
    options: [
      {
        label: 'events:quest_trigger_sponsor_demand.opt1.label',
        effect: {
          type: 'quest',
          quest: {
            id: 'quest_sponsor_demand',
            label: 'events:quest_sponsor_demand.label',
            description: 'events:quest_sponsor_demand.desc',
            deadlineOffset: 7,
            progress: 0,
            required: 2,
            rewardType: 'item',
            rewardData: { item: 'energy_drink' },
            moneyReward: 500
          }
        },
        outcomeText: 'events:quest_trigger_sponsor_demand.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_sponsor_demand.opt2.label',
        effect: { type: 'none' },
        outcomeText: 'events:quest_trigger_sponsor_demand.opt2.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_harmony_project',
    category: 'band',
    title: 'events:quest_trigger_harmony_project.title',
    description: 'events:quest_trigger_harmony_project.desc',
    trigger: 'random',
    chance: 0.3, // High chance if condition is met, reduced to 0.3 to prevent spam
    condition: state =>
      (!state.activeQuests || state.activeQuests.length === 0) &&
      (state.band?.harmony || 0) < 60,
    options: [
      {
        label: 'events:quest_trigger_harmony_project.opt1.label',
        effect: {
          type: 'quest',
          quest: {
            id: 'quest_harmony_project',
            label: 'events:quest_harmony_project.label',
            description: 'events:quest_harmony_project.desc',
            deadlineOffset: 4,
            progress: 0,
            required: 1,
            rewardType: 'harmony',
            rewardData: { harmony: 20 },
            moneyReward: 0
          }
        },
        outcomeText: 'events:quest_trigger_harmony_project.opt1.outcome'
      }
    ]
  },
  {
    id: 'quest_trigger_local_legend',
    category: 'special',
    title: 'events:quest_trigger_local_legend.title',
    description: 'events:quest_trigger_local_legend.desc',
    trigger: 'random',
    chance: 0.07,
    condition: state => !state.activeQuests || state.activeQuests.length === 0,
    options: [
      {
        label: 'events:quest_trigger_local_legend.opt1.label',
        effect: {
          type: 'quest',
          quest: {
            id: 'quest_local_legend',
            label: 'events:quest_local_legend.label',
            description: 'events:quest_local_legend.desc',
            deadlineOffset: 10,
            progress: 0,
            required: 500,
            rewardType: 'skill_point',
            rewardData: { memberIndex: 0 }, // We'll distribute to random member in reducer
            moneyReward: 0
          }
        },
        outcomeText: 'events:quest_trigger_local_legend.opt1.outcome'
      },
      {
        label: 'events:quest_trigger_local_legend.opt2.label',
        effect: { type: 'none' },
        outcomeText: 'events:quest_trigger_local_legend.opt2.outcome'
      }
    ]
  }
]
