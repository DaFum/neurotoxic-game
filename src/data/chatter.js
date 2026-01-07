export const CHATTER_DB = [
    // General
    { text: "My back hurts.", weight: 1 },
    { text: "Did we pack the spare snare?", weight: 1 },
    { text: "I'm hungry.", weight: 1 },
    { text: "This van smells like stale beer.", weight: 1 },
    { text: "Are we there yet?", weight: 0.5 },
    
    // Low Mood
    { text: "I swear if I have to drive another hour...", weight: 10, condition: (state) => state.band.members.some(m => m.mood < 30) },
    { text: "I hate this tour.", weight: 10, condition: (state) => state.band.members.some(m => m.mood < 20) },
    
    // High Mood
    { text: "We are gonna crush it tonight!", weight: 5, condition: (state) => state.band.members.some(m => m.mood > 80) },
    { text: "Life is good.", weight: 5, condition: (state) => state.band.members.some(m => m.mood > 90) },

    // Low Money
    { text: "Can we afford gas?", weight: 10, condition: (state) => state.player.money < 100 },
    
    // Specific Location (Stendal)
    { text: "Home sweet home.", weight: 10, condition: (state) => state.player.location === 'Stendal' },
];

export const getRandomChatter = (state) => {
    const validChatter = CHATTER_DB.filter(c => !c.condition || c.condition(state));
    // Simple weighted random? Or just random from valid.
    const item = validChatter[Math.floor(Math.random() * validChatter.length)];
    return item ? item.text : "...";
};
