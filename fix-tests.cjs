const fs = require('fs');

const file1 = 'src/context/reducers/assetReducer.ts';
let c1 = fs.readFileSync(file1, 'utf8');
c1 = c1.replace(
  `    pendingForeclosureNotices: (state.pendingForeclosureNotices ?? []).filter(
      kind => kind !== payload.kind
    )`,
  `    pendingForeclosureNotices: (() => {
      // ⚡ BOLT OPTIMIZATION: Replaced .filter() with procedural loop.
      // Why: Eliminates intermediate array and closure allocations.
      // Impact: Reduces GC pressure when dismissing foreclosure notices.
      const source = state.pendingForeclosureNotices ?? []
      const result = []
      for (let i = 0; i < source.length; i++) {
        if (source[i] !== payload.kind) {
          result.push(source[i])
        }
      }
      return result
    })()`
);
fs.writeFileSync(file1, c1);

const file2 = 'src/context/reducers/systemReducer.ts';
let c2 = fs.readFileSync(file2, 'utf8');
c2 = c2.replace(
  `  const activeQuestCooldowns = (state.questCooldowns ?? []).filter(
    cd => cd.expiresOnDay > currentDay
  )`,
  `  // ⚡ BOLT OPTIMIZATION: Replaced .filter() with procedural loop.
  // Why: Eliminates intermediate array and closure allocations on hot path.
  // Impact: Reduces GC pressure when advancing days.
  const sourceQuestCooldowns = state.questCooldowns ?? []
  const activeQuestCooldowns = []
  for (let i = 0; i < sourceQuestCooldowns.length; i++) {
    const cd = sourceQuestCooldowns[i]
    if (cd && cd.expiresOnDay > currentDay) {
      activeQuestCooldowns.push(cd)
    }
  }`
);

c2 = c2.replace(
  `  const activeEventCooldowns = (state.eventCooldowns ?? []).filter(cd => {
    if (typeof cd !== 'string') return false
    const idx = cd.indexOf(':')
    if (idx < 0) return false // legacy daily entry → drop
    const expiry = parseInt(cd.slice(idx + 1), 10)
    return Number.isFinite(expiry) && expiry > currentDay
  })`,
  `  // ⚡ BOLT OPTIMIZATION: Replaced .filter() with procedural loop.
  // Why: Eliminates intermediate array and closure allocations on hot path.
  // Impact: Reduces GC pressure when advancing days.
  const sourceEventCooldowns = state.eventCooldowns ?? []
  const activeEventCooldowns = []
  for (let i = 0; i < sourceEventCooldowns.length; i++) {
    const cd = sourceEventCooldowns[i]
    if (typeof cd === 'string') {
      const idx = cd.indexOf(':')
      if (idx >= 0) {
        const expiry = parseInt(cd.slice(idx + 1), 10)
        if (Number.isFinite(expiry) && expiry > currentDay) {
          activeEventCooldowns.push(cd)
        }
      }
    }
  }`
);
fs.writeFileSync(file2, c2);

const file3 = 'src/context/reducers/assetSanitizers.ts';
let c3 = fs.readFileSync(file3, 'utf8');
c3 = c3.replace(
  `    const sanitizedSlots = sanitizeSlots(clean.slots).filter(
      s => s.addedByModuleId !== undefined || chassisSlotTypes.has(s.slotType)
    )`,
  `    // ⚡ BOLT OPTIMIZATION: Replaced .filter() with procedural loop.
    // Why: Eliminates intermediate array and closure allocations.
    // Impact: Reduces GC pressure during asset sanitization.
    const preSanitizedSlots = sanitizeSlots(clean.slots)
    const sanitizedSlots = []
    for (let i = 0; i < preSanitizedSlots.length; i++) {
      const s = preSanitizedSlots[i]
      if (s && (s.addedByModuleId !== undefined || chassisSlotTypes.has(s.slotType))) {
        sanitizedSlots.push(s)
      }
    }`
);
fs.writeFileSync(file3, c3);

console.log('Done');
