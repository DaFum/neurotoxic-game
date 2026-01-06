export const SONGS_DB = [
    {
        id: 'kranker_schrank',
        name: "Kranker Schrank",
        duration: 50, // Seconds
        difficulty: 2, // 1-5
        energy: { start: 60, peak: 85, end: 70 },
        viralPotential: 0.4,
        bandStamina: -15,
        merchBoost: 1.2,
        tags: ['fast', 'aggressive', 'short'],
        bpm: 180
    },
    {
        id: 'idiorcissism',
        name: "Idiorcissism",
        duration: 185, // 3:05
        difficulty: 3,
        energy: { start: 50, peak: 90, end: 80 },
        viralPotential: 0.6,
        bandStamina: -25,
        merchBoost: 1.0,
        tags: ['groovy', 'heavy'],
        bpm: 140
    },
    {
        id: 'akoasma',
        name: "Akoasma",
        duration: 408, // 6:48
        difficulty: 5,
        energy: { start: 40, peak: 100, end: 95 },
        viralPotential: 0.8,
        bandStamina: -40,
        merchBoost: 1.5,
        tags: ['epic', 'progressive'],
        bpm: 160
    },
    {
        id: 'system',
        name: "System",
        duration: 160,
        difficulty: 3,
        energy: { start: 70, peak: 85, end: 60 },
        viralPotential: 0.3,
        bandStamina: -20,
        merchBoost: 1.1,
        tags: ['punk', 'fast'],
        bpm: 200
    },
    {
        id: 'lost_scriptures',
        name: "Lost Scriptures",
        duration: 300, // Placeholder
        difficulty: 4,
        energy: { start: 20, peak: 95, end: 10 },
        viralPotential: 0.9,
        bandStamina: -30,
        merchBoost: 1.3,
        tags: ['dark', 'atmospheric'],
        bpm: 120,
        unlockCondition: 'leipzig_complete'
    }
];
