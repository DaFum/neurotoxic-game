const fs = require('fs');
let content = fs.readFileSync('scripts/game-balance-simulation.mjs', 'utf8');

// The review asked: "Line 1342: The pre-gig daily loop is incorrectly calling maybeApplyPostPulse with stale gig data... Move this call out of the daily loop and into the successful post-gig flow where fresh gig stats are available"

// We remove maybeApplyPostPulse from line 1342
content = content.replace(/    maybeApplyPostPulse\(state, rng, counters, state\.currentGig \|\| null, state\.lastGigStats \|\| null, state\.activeEvent \|\| null\)\n/, "");

// We insert it after the gig has successfully been played, for example after `applyPostGigState` or the depletion of merch, around 1490
const gigInsertionPoint = `state.band.inventory = depleteInventory(state.band.inventory, buyers)`;
content = content.replace(gigInsertionPoint, `${gigInsertionPoint}

    maybeApplyPostPulse(state, rng, counters, venue, {
      misses,
      hitRate: performanceScore / 100,
      peakHype: Math.round(performanceScore + rng() * 12)
    }, state.activeEvent || null, performanceScore)`);

// We update maybeApplyPostPulse signature to accept performanceScore
content = content.replace(/const maybeApplyPostPulse = \(state, rng, counters, currentGig, lastGigStats, activeEvent\) => \{/, `const maybeApplyPostPulse = (state, rng, counters, currentGig, lastGigStats, activeEvent, performanceScore) => {`);
content = content.replace(/    rngValue: rng\(\)\n  \}\)/, `    rngValue: rng(),\n    perfScore: performanceScore\n  })`);

// The review asked: "Around line 790-802: The post-gig update logic is replacing state.social with a partial object from calculatePostGigStateUpdates... merge the returned updatedSocial into the current state.social instead of overwriting it."
// We already do `if (updatedSocial) state.social = updatedSocial`? Wait, calculatePostGigStateUpdates returns a newly spread social object in the real code, or does it return partial? Wait, let's look at the actual code in derivations.ts. Actually, the review says: "merge the returned updatedSocial into the current state.social instead of overwriting it." Let's do `state.social = { ...state.social, ...updatedSocial }`
content = content.replace(/if \(updatedSocial\) state\.social = updatedSocial/, `if (updatedSocial) state.social = { ...state.social, ...updatedSocial }`);

// The review asked: "Around line 1501-1503: Normalize the gig net value once in the simulation flow and reuse that single value everywhere. In the logic around gig processing (including the existing gigNet computation and the bankruptcy check later in the same path), default missing financials.net to zero, then use the normalized gigNet for totals, timeline updates, and bankruptcy evaluation so all counters stay consistent."
content = content.replace(/shouldTriggerBankruptcy\(\n        state\.player\.money,\n        financials \? financials\.net : 0,\n        getTotalDailyObligations\(state\)\n      \)/, `shouldTriggerBankruptcy(
        state.player.money,
        gigNet,
        getTotalDailyObligations(state)
      )`);

// The review asked: "Line 1291: The risk roll stream is hardcoded to 300... Update the RNG array sizing to derive from the current asset count in preState so rollAssetRiskEvents always receives enough rolls."
content = content.replace(/const riskResult = rollAssetRiskEvents\(preState, Array\.from\(\{length: 300\}, \(\) => rng\(\)\), 0\);/g, `const assetCount = preState.assets ? preState.assets.length : 0;\n    const riskResult = rollAssetRiskEvents(preState, Array.from({length: assetCount * 2 + 10}, () => rng()), 0);`);

fs.writeFileSync('scripts/game-balance-simulation.mjs', content);
