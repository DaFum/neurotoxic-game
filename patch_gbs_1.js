const fs = require('fs');
let content = fs.readFileSync('scripts/game-balance-simulation.mjs', 'utf8');

content = content.replace(
`    // Bankruptcy from daily costs draining the player to zero
    const dailyNetChange = state.player.money - moneyBeforeDay
    if (shouldTriggerBankruptcy(state.player.money, dailyNetChange)) {
      counters.bankrupt = true
      break
    }

    applyWorldEvents(state, scenario, rng, counters)
    maybeShiftSocialTrend(state, rng, counters)
    maybeActivateBrandDeal(state, rng, counters)
    maybeApplyPostPulse(state, rng, counters)
    maybeApplyContrabandDrop(state, rng, counters)
    maybeHandleSponsorship(state, rng, counters)
    maybeMaintainVanAndResources(state, scenario, rng, counters)
    maybeBuyCatalogUpgrade(state, rng, counters)

    const shouldPlayGig =
      day % (scenario.gigGapDays || SIMULATION_CONSTANTS.baseGigGapDays) === 0`,
`    // Bankruptcy from daily costs draining the player to zero
    const dailyNetChange = state.player.money - moneyBeforeDay
    if (shouldTriggerBankruptcy(state.player.money, dailyNetChange)) {
      counters.bankrupt = true
      break
    }

    const shouldPlayGig =
      day % (scenario.gigGapDays || SIMULATION_CONSTANTS.baseGigGapDays) === 0

    applyWorldEvents(state, scenario, rng, counters, shouldPlayGig)
    maybeShiftSocialTrend(state, rng, counters)
    maybeActivateBrandDeal(state, rng, counters)
    maybeApplyPostPulse(state, rng, counters)
    maybeApplyContrabandDrop(state, rng, counters)
    maybeHandleSponsorship(state, rng, counters)
    maybeMaintainVanAndResources(state, scenario, rng, counters)
    maybeBuyCatalogUpgrade(state, rng, counters)`);

content = content.replace(
`const applyWorldEvents = (state, scenario, rng, eventCounts) => {
  const intensity = scenario.eventIntensity ?? 0.5`,
`const applyWorldEvents = (state, scenario, rng, eventCounts, isTravelDay) => {
  const intensity = scenario.eventIntensity ?? 0.5`);

content = content.replace(
`  // Process equipment events (transport)
  if (rng() < 0.06 * intensity) {
    const event = eventEngine.checkEvent('transport', state, 'travel', rng)
    if (event && event.options && event.options.length > 0) {
      const choice = event.options[Math.floor(rng() * event.options.length)]
      const { delta } = resolveEventChoice(choice, state, rng)

      if (delta) {
        Object.assign(state, applyEventDelta(state, delta))
      }
      eventCounts.equipmentEvents += 1
    }
  }`,
`  // Process equipment events (transport)
  if (isTravelDay && rng() < 0.06 * intensity) {
    const event = eventEngine.checkEvent('transport', state, 'travel', rng)
    if (event && event.options && event.options.length > 0) {
      const choice = event.options[Math.floor(rng() * event.options.length)]
      const { delta } = resolveEventChoice(choice, state, rng)

      if (delta) {
        Object.assign(state, applyEventDelta(state, delta))
      }
      eventCounts.equipmentEvents += 1
    }
  }`);

fs.writeFileSync('scripts/game-balance-simulation.mjs', content);
