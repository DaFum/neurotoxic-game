const CHATTER_DB = [
  // --- GENERAL TRAVEL / OVERWORLD (Original + New) ---
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
  {
    text: 'This map looks like a bad tour tattoo.',
    weight: 1,
    category: 'travel'
  },
  {
    text: 'Did we forget the banner again?',
    weight: 1,
    category: 'travel',
    speaker: 'Lars'
  },
  {
    text: "If the promoter ghosts us, we're playing in the parking lot.",
    weight: 1,
    category: 'travel'
  },
  {
    text: 'Every kilometer adds a new rattle to this van.',
    weight: 1,
    category: 'travel'
  },
  {
    text: 'Same highway, different city, same broken AUX cable.',
    weight: 0.5,
    category: 'travel'
  },
  {
    text: 'Imagine explaining this life to a normal person.',
    weight: 0.2,
    category: 'travel',
    speaker: 'Marius'
  },
  {
    text: 'Someone sit on the pedalboard so it stops sliding.',
    weight: 1,
    category: 'travel'
  },
  {
    text: 'Who called shotgun and then fell asleep?',
    weight: 1,
    category: 'travel'
  },

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
  {
    text: 'If the kick mic dies mid‑set, we riot.',
    weight: 2,
    condition: state => state.currentScene === 'PREGIG'
  },
  {
    text: 'One more tuning check or I’ll snap this guitar in half.',
    weight: 2,
    condition: state => state.currentScene === 'PREGIG'
  },
  {
    text: 'These strings are either dead or perfect. No in‑between.',
    weight: 2,
    condition: state => state.currentScene === 'PREGIG',
    speaker: 'Matze'
  },
  {
    text: 'Does this place even have a monitor mix, or just vibes?',
    weight: 1,
    condition: state => state.currentScene === 'PREGIG'
  },
  {
    text: 'No new songs tonight. Last time was a trainwreck.',
    weight: 2,
    condition: state => state.currentScene === 'PREGIG',
    speaker: 'Lars'
  },
  {
    text: 'Who stole my setlist again?',
    weight: 1,
    condition: state => state.currentScene === 'PREGIG'
  },
  {
    text: 'If the intro track fails, we just walk on angry.',
    weight: 1,
    condition: state => state.currentScene === 'PREGIG'
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
  {
    text: 'I almost fell off the stage, totally worth it.',
    weight: 3,
    condition: state => state.currentScene === 'POSTGIG'
  },
  {
    text: 'That last breakdown nearly killed my wrists.',
    weight: 2,
    condition: state => state.currentScene === 'POSTGIG',
    speaker: 'Lars'
  },
  {
    text: 'We sold more patches than shirts. Respect.',
    weight: 2,
    condition: state => state.currentScene === 'POSTGIG'
  },
  {
    text: 'I can still feel the bass in my chest.',
    weight: 2,
    condition: state => state.currentScene === 'POSTGIG'
  },
  {
    text: 'If that was us on an off‑night, we’re doing fine.',
    weight: 4,
    condition: state => state.currentScene === 'POSTGIG'
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
  {
    text: 'If one more person asks “So what’s your real job?” I’m done.',
    weight: 10,
    condition: state => state.band.members.some(m => m.mood < 30)
  },
  {
    text: 'Why does every town look the same at 3am?',
    weight: 10,
    condition: state => state.band.members.some(m => m.mood < 20)
  },
  {
    text: 'I’m three bad shows away from selling all my gear.',
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
  {
    text: 'This van, this band, this tour – perfect chaos.',
    weight: 5,
    condition: state => state.band.members.some(m => m.mood > 80)
  },
  {
    text: 'Every show feels bigger than the last lately.',
    weight: 5,
    condition: state => state.band.members.some(m => m.mood > 90)
  },
  {
    text: 'Screenshot this moment in my brain forever.',
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
  {
    text: 'If we busk at the next rest stop, we might make fuel money.',
    weight: 10,
    condition: state => state.player.money < 100
  },
  {
    text: 'Okay, this is “new cymbal” money territory.',
    weight: 5,
    condition: state => state.player.money > 2000,
    speaker: 'Lars'
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
  {
    text: 'Somebody just used our track in their story. Nice.',
    weight: 3,
    condition: state => state.social?.instagram > 500
  },
  {
    text: 'If we’re viral, we better not waste tonight’s set.',
    weight: 5,
    condition: state => state.social?.viral > 0
  },

  // --- LOCATION SPECIFIC (General) ---
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
  {
    text: 'Back in Stendal. Same streets, louder band.',
    weight: 10,
    condition: state => state.player.location === 'Stendal'
  },
  {
    text: 'Berlin fees, Berlin chaos, Berlin sweat.',
    weight: 5,
    condition: state =>
      state.player.location && state.player.location.includes('Berlin')
  },

  // --- GIG SPECIFIC (In-Game) ---
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
  },
  {
    text: 'Push it, they’re still moving!',
    weight: 5,
    condition: state =>
      state.currentScene === 'GIG' &&
      state.band.members.some(m => m.stamina > 80)
  },
  {
    text: 'If I drop this beat, pretend it was on purpose.',
    weight: 5,
    condition: state =>
      state.currentScene === 'GIG' &&
      state.band.members.some(m => m.stamina < 30),
    speaker: 'Lars'
  }
]

const VENUE_CHATTER_DB = [
  // STENDAL / TANGERMÜNDE / MAGDEBURG
  {
    venueId: 'stendal_adler',
    lines: [
      'Sweaty, low ceiling, perfect for total chaos.',
      'If the crowd climbs on the bar, we did it right.'
    ]
  },
  {
    venueId: 'tangermuende_kaminstube',
    lines: [
      'Feels like playing in someone’s living room with better beer.',
      'If the fireplace is lit, it’s going to be a hot one.'
    ]
  },
  {
    venueId: 'tangermuende_burgfest',
    lines: [
      'Castle walls mean extra reverb for every blastbeat.',
      'If it rains, this turns into a medieval mudpit.'
    ]
  },
  {
    venueId: 'magdeburg_moritzhof',
    lines: [
      'Arts center by day, riff temple by night.',
      'Crowd is close enough to read the setlist over your shoulder.'
    ]
  },
  {
    venueId: 'magdeburg_factory',
    lines: [
      'Old industrial vibes, perfect for metallic noise.',
      'If the room fills, the air turns into fog and feedback.'
    ]
  },
  {
    venueId: 'magdeburg_stadtpark',
    lines: [
      'Open air means no ceiling to stop the snare cracks.',
      'If the birds take off during the breakdown, we win.'
    ]
  },

  // LEIPZIG / DRESDEN
  {
    venueId: 'leipzig_conne',
    lines: [
      'Legendary room, no excuses here.',
      'If the skate kids show up, the pit gets serious.'
    ]
  },
  {
    venueId: 'leipzig_ut',
    lines: [
      'Old cinema turned riff cathedral.',
      'Projector off, amps on, screen replaced by sweat.'
    ]
  },
  {
    venueId: 'leipzig_distille',
    lines: [
      'Tiny stage, huge noise.',
      'If it sells out, you can’t even drop a pick.'
    ]
  },
  {
    venueId: 'leipzig_taeubchen',
    lines: [
      'Feels almost too fancy for our volume.',
      'If the lights hit right, this room looks massive.'
    ]
  },
  {
    venueId: 'leipzig_werk2',
    lines: [
      'Big hall, big expectations.',
      'If the subs wake up, the floor starts breathing.'
    ]
  },
  {
    venueId: 'leipzig_agra',
    lines: [
      'Festival‑hall energy, even on a weekday.',
      'Too big to hide a bad show in here.'
    ]
  },
  {
    venueId: 'leipzig_arena',
    lines: [
      'Arena mode: tiny humans, huge PA.',
      'This is the “call your parents” kind of stage.'
    ]
  },
  {
    venueId: 'dresden_beatpol',
    lines: [
      'Classic tour stop, sticky floor guaranteed.',
      'If they sing along here, you’re officially on the circuit.'
    ]
  },
  {
    venueId: 'dresden_chemie',
    lines: [
      'Punk basement energy turned up to eleven.',
      'Walls remember every scream in this room.'
    ]
  },

  // HANNOVER
  {
    venueId: 'hannover_chez',
    lines: [
      'Feels like home for every touring van.',
      'If the crowd moves, this room shakes with them.'
    ]
  },
  {
    venueId: 'hannover_musikzentrum',
    lines: [
      'Serious stage, serious sound.',
      'The lights here can cook you alive.'
    ]
  },

  // BERLIN
  {
    venueId: 'berlin_so36',
    lines: [
      'Kreuzberg history staring right back at you.',
      'If you mess up here, the walls will remember.'
    ]
  },
  {
    venueId: 'berlin_cassiopeia',
    lines: [
      'Skate, graffiti, and noise in one courtyard.',
      'Perfect place for losing your voice and your hearing.'
    ]
  },
  {
    venueId: 'berlin_lido',
    lines: [
      'Red curtains, loud bands, zero subtlety.',
      'Stage feels small until the lights go on.'
    ]
  },
  {
    venueId: 'berlin_astra',
    lines: [
      'Big room, bigger echoes.',
      'If the balcony moves, you know it’s a good night.'
    ]
  },
  {
    venueId: 'berlin_k17',
    lines: [
      'Dark club energy, perfect for blastbeats.',
      'Feels like a second home for heavy bands.'
    ]
  },

  // HAMBURG
  {
    venueId: 'hamburg_knust',
    lines: [
      'Brick walls and tight sound.',
      'If the front row is sweating, the mix is right.'
    ]
  },
  {
    venueId: 'hamburg_headcrash',
    lines: [
      'Compact, loud, merciless.',
      'Every mistake is visible from the bar.'
    ]
  },
  {
    venueId: 'hamburg_markthalle',
    lines: [
      'Classic hall, serious rock history.',
      'You feel tiny until the crowd starts.'
    ]
  },
  {
    venueId: 'hamburg_logo',
    lines: [
      'Club‑show textbook, no frills, just noise.',
      'Perfect size for a sold‑out sweatbox.'
    ]
  },

  // KÖLN
  {
    venueId: 'koeln_underground',
    lines: [
      'Basement air, upstairs volume.',
      'Feels like every wall has a sticker story.'
    ]
  },
  {
    venueId: 'koeln_mtc',
    lines: [
      'Low ceiling, loud amps.',
      'You can high‑five the crowd between riffs.'
    ]
  },
  {
    venueId: 'koeln_luxor',
    lines: [
      'Long room, sound hits you from the back.',
      'If the room is packed, it turns into a tunnel of noise.'
    ]
  },

  // MÜNCHEN / STUTTGART
  {
    venueId: 'muenchen_backstage',
    lines: [
      'Outdoor, indoor, everything loud.',
      'Easy to get lost between stage and backstage.'
    ]
  },
  {
    venueId: 'muenchen_feierwerk',
    lines: [
      'DIY spirit with clean sound.',
      'Feels like a youth center that grew up with you.'
    ]
  },
  {
    venueId: 'stuttgart_lka',
    lines: [
      'Big stage, big room, big pressure.',
      'You see every face from up here – and they see you.'
    ]
  },

  // DORTMUND / BREMEN / FRANKFURT / KASSEL / NÜRNBERG
  {
    venueId: 'dortmund_fzw',
    lines: [
      'Modern hall with festival energy.',
      'When the lights kick in, it feels twice as big.'
    ]
  },
  {
    venueId: 'dortmund_junkyard',
    lines: [
      'Industrial yard, loud music, cold air.',
      'Perfect spot for outdoor chaos.'
    ]
  },
  {
    venueId: 'bremen_tower',
    lines: [
      'Tiny tower, tall volume.',
      'If you hit hard, the whole building vibrates.'
    ]
  },
  {
    venueId: 'frankfurt_batschkapp',
    lines: [
      'Legendary club, no room for weak sets.',
      'You either rise to the room or get swallowed.'
    ]
  },
  {
    venueId: 'kassel_goldgrube',
    lines: ['Small room, golden name.', 'Nights here feel like secret shows.']
  },
  {
    venueId: 'nuernberg_hirsch',
    lines: [
      'Wide stage, heavy sound.',
      'If the horns go up, you’re doing it right.'
    ]
  },

  // ROSTOCK / ERFURT / SAARBRÜCKEN / FREIBURG / KIEL
  {
    venueId: 'rostock_mau',
    lines: [
      'Harbor air and heavy riffs.',
      'Perfect place to make the Baltic Sea shake.'
    ]
  },
  {
    venueId: 'erfurt_centrum',
    lines: [
      'Feels like the center of everything for one night.',
      'Crowd stands close enough to tune your guitar for you.'
    ]
  },
  {
    venueId: 'saarbruecken_garage',
    lines: [
      'Big room, louder locals.',
      'If the balcony starts jumping, hold on tight.'
    ]
  },
  {
    venueId: 'freiburg_jazzhaus',
    lines: [
      'Jazz in the name, distortion in the air.',
      'Low ceiling, nice lights, nasty volume.'
    ]
  },
  {
    venueId: 'kiel_pumpe',
    lines: [
      'Old building, fresh noise.',
      'If the pipes rattle, you know the PA is working.'
    ]
  }
]

export const getRandomChatter = state => {
  let pool = []

  // 1. Gather Venue Specific Chatter
  const currentNode = state.gameMap?.nodes[state.player.currentNodeId]
  if (currentNode?.venue?.id) {
    const venueEntry = VENUE_CHATTER_DB.find(
      v => v.venueId === currentNode.venue.id
    )
    if (venueEntry && venueEntry.lines) {
      // Add venue lines with high priority (treated as heavy weight or mixed in)
      // We map them to standard object format
      const venueLines = venueEntry.lines.map(text => ({
        text,
        weight: 10, // Higher chance for location specific
        condition: null
      }))
      pool = [...pool, ...venueLines]
    }
  }

  // 2. Gather Standard Chatter
  const standardChatter = CHATTER_DB.filter(c => {
    if (c.condition) return c.condition(state)
    if (
      !c.condition &&
      (state.currentScene === 'OVERWORLD' || state.currentScene === 'MENU')
    )
      return true
    return false
  })

  pool = [...pool, ...standardChatter]

  if (pool.length === 0) return null

  // Weighted Random Selection
  // Flatten weights: simple array expansion or range check
  const weightedPool = []
  pool.forEach(item => {
    // Arbitrary multiplier for weight (default 1)
    const count = Math.max(1, Math.round((item.weight || 1) * 2))
    for (let i = 0; i < count; i++) {
      weightedPool.push(item)
    }
  })

  const item = weightedPool[Math.floor(Math.random() * weightedPool.length)]

  return item
    ? {
        text: item.text,
        speaker: item.speaker || null
      }
    : null
}
