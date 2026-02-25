export const buildBandState = (overrides = {}) => ({
  harmony: 60,
  members: [
    {
      name: 'Matze',
      mood: 70,
      stamina: 80,
      baseStats: { skill: 5 },
      traits: []
    },
    {
      name: 'Marius',
      mood: 65,
      stamina: 75,
      baseStats: { skill: 4 },
      traits: []
    },
    {
      name: 'Lars',
      mood: 75,
      stamina: 70,
      baseStats: { skill: 3 },
      traits: []
    }
  ],
  ...overrides
})

export const buildBandWithMembers = (updates, otherOverrides = {}) => {
  const band = buildBandState(otherOverrides)
  updates.forEach(update => {
    const idx = band.members.findIndex(m => m.name === update.name)
    if (idx !== -1) {
      band.members[idx] = { ...band.members[idx], ...update }
    } else {
      throw new Error(
        `Member "${update.name}" not found in band. Available: ${band.members.map(m => m.name).join(', ')}`
      )
    }
  })
  return band
}
