export const CHATTER_DB = [
  // --- GENERAL TRAVEL / OVERWORLD ---
  {
    text: 'My back hurts from sleeping in this seat.',
    weight: 1,
    category: 'travel'
  },
  {
    text: 'Did we pack the spare snare?',
    weight: 1,
    category: 'travel',
    speaker: 'Lars'
  },
  { text: "I'm starving. Fast food again?", weight: 1, category: 'travel' },
  {
    text: 'This van smells like stale beer and broken dreams.',
    weight: 1,
    category: 'travel'
  },
  { text: 'Are we there yet?', weight: 0.5, category: 'travel' },
  {
    text: 'I should have been a dentist.',
    weight: 0.2,
    category: 'travel',
    speaker: 'Marius'
  },
  { text: 'Did anyone bring a phone charger?', weight: 1, category: 'travel' },
  { text: 'Turn up the radio!', weight: 1, category: 'travel' },

  // --- PRE-GIG (Preparation) ---
  {
    text: 'Where is the sound guy?',
    weight: 2,
    condition: state => state.currentScene === 'PREGIG'
  },
  {
    text: 'I need a beer before we start.',
    weight: 2,
    condition: state => state.currentScene === 'PREGIG'
  },
  {
    text: 'My strings feel sticky.',
    weight: 2,
    condition: state => state.currentScene === 'PREGIG',
    speaker: 'Matze'
  },
  {
    text: 'Does this venue have a backstage?',
    weight: 1,
    condition: state => state.currentScene === 'PREGIG'
  },
  {
    text: "Let's stick to the setlist this time, okay?",
    weight: 2,
    condition: state => state.currentScene === 'PREGIG',
    speaker: 'Lars'
  },

  // --- POST-GIG (Reaction) ---
  {
    text: 'That crowd was insane!',
    weight: 5,
    condition: state =>
      state.currentScene === 'POSTGIG' && state.lastGigStats?.score > 10000
  },
  {
    text: 'I think I broke a stick.',
    weight: 2,
    condition: state => state.currentScene === 'POSTGIG',
    speaker: 'Lars'
  },
  {
    text: 'We need to sell more merch.',
    weight: 2,
    condition: state => state.currentScene === 'POSTGIG'
  },
  {
    text: 'My ears are ringing.',
    weight: 2,
    condition: state => state.currentScene === 'POSTGIG'
  },
  {
    text: "Rough set. Let's practice more.",
    weight: 5,
    condition: state =>
      state.currentScene === 'POSTGIG' && state.lastGigStats?.misses > 10
  },

  // --- CONDITION: LOW MOOD ---
  {
    text: 'I swear if I have to drive another hour...',
    weight: 10,
    condition: state => state.band.members.some(m => m.mood < 30)
  },
  {
    text: 'I hate this tour. I wanna go home.',
    weight: 10,
    condition: state => state.band.members.some(m => m.mood < 20)
  },
  {
    text: "Don't talk to me right now.",
    weight: 8,
    condition: state => state.band.members.some(m => m.mood < 25)
  },

  // --- CONDITION: HIGH MOOD ---
  {
    text: 'We are gonna crush it tonight!',
    weight: 5,
    condition: state => state.band.members.some(m => m.mood > 80)
  },
  {
    text: 'Life is good. The road is freedom.',
    weight: 5,
    condition: state => state.band.members.some(m => m.mood > 90)
  },
  {
    text: 'I love you guys.',
    weight: 1,
    condition: state => state.band.members.some(m => m.mood > 95)
  },

  // --- CONDITION: MONEY ---
  {
    text: 'Can we afford gas?',
    weight: 10,
    condition: state => state.player.money < 100
  },
  {
    text: 'We are rich! Steak dinner tonight!',
    weight: 5,
    condition: state => state.player.money > 2000
  },

  // --- CONDITION: FAME/SOCIAL ---
  {
    text: 'Did you see that comment on Insta?',
    weight: 3,
    condition: state => state.social?.instagram > 500
  },
  {
    text: 'We are going viral!',
    weight: 5,
    condition: state => state.social?.viral > 0
  },

  // --- LOCATION SPECIFIC ---
  {
    text: 'Home sweet home.',
    weight: 10,
    condition: state => state.player.location === 'Stendal'
  },
  {
    text: 'Berlin is too expensive.',
    weight: 5,
    condition: state =>
      state.player.location && state.player.location.includes('Berlin')
  },

  // --- GIG SPECIFIC (In-Game) ---
  // Note: Gig scene updates fast, chatter might be distracting but adds flavor
  {
    text: 'FASTER!',
    weight: 5,
    condition: state =>
      state.currentScene === 'GIG' &&
      state.band.members.some(m => m.stamina > 80)
  },
  {
    text: 'My arms are burning!',
    weight: 5,
    condition: state =>
      state.currentScene === 'GIG' &&
      state.band.members.some(m => m.stamina < 30),
    speaker: 'Lars'
  }
]

export const getRandomChatter = state => {
  // Filter by condition
  const validChatter = CHATTER_DB.filter(c => {
    // If scene is specified implicitly via condition, respect it.
    // If 'category' is 'travel' but we are in GIG, filter out?
    // Let's rely on explicit condition() first.
    if (c.condition) return c.condition(state)

    // Default fallbacks (no condition) are mostly for travel/overworld
    if (
      !c.condition &&
      (state.currentScene === 'OVERWORLD' || state.currentScene === 'MENU')
    )
      return true

    return false
  })

  if (validChatter.length === 0) return null

  // Weighted Random
  // For simplicity, just pick random for now, or implement weight logic
  const item = validChatter[Math.floor(Math.random() * validChatter.length)]

  return item
    ? {
        text: item.text,
        speaker: item.speaker || null // If null, caller assigns random
      }
    : null
}
