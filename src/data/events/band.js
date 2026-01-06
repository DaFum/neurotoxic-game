// Band Events
export const BAND_EVENTS = [
    {
      id: 'internal_dispute',
      category: 'band',
      title: 'CREATIVE DIFFERENCES',
      text: "Matze thinks the new song should be slower. Marius wants it faster.",
      trigger: 'random',
      chance: 0.05,
      options: [
        {
          label: "Side with Matze (Slow)",
          effect: { type: 'stat', stat: 'harmony', value: -5 },
          outcomeText: "Marius is annoyed."
        },
        {
          label: "Side with Marius (Fast)",
          effect: { type: 'stat', stat: 'harmony', value: -5 },
          outcomeText: "Matze sulks."
        },
        {
          label: "Compromise [Charisma]",
          skillCheck: {
            stat: 'charisma',
            threshold: 6,
            success: { type: 'stat', stat: 'harmony', value: 5, description: "Everyone is happy." },
            failure: { type: 'stat', stat: 'harmony', value: -10, description: "Now they both hate you." }
          },
          outcomeText: "You tried to mediate."
        }
      ]
    }
];
