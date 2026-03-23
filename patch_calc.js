const fs = require('fs');
let content = fs.readFileSync('scripts/calculate-baseline-fame.mjs', 'utf8');

content = content.replace(
`  // Show cancellation if harmony is critically low
  if (state.band.harmony < 15 && Math.random() < BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE) {
    fameDelta = -(FLAT_FAME_PENALTY_PER_BAD_GIG * 2)
    outcomeText = \`CANCELLED! Harmony too low. Fame \${fameDelta}\`
    score = 0
  }

  state.gigsPlayed++
  state.fame = Math.max(0, state.fame + fameDelta)

  // Add estimated gig income
  const gigNet = estimateGigNet(previousFame)
  state.money += gigNet`,
`  // Show cancellation if harmony is critically low
  let isCancelled = false;
  if (state.band.harmony < 15 && Math.random() < BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE) {
    fameDelta = -(FLAT_FAME_PENALTY_PER_BAD_GIG * 2)
    outcomeText = \`CANCELLED! Harmony too low. Fame \${fameDelta}\`
    score = 0
    isCancelled = true;
  }

  state.fame = Math.max(0, state.fame + fameDelta)

  let gigNet = 0;
  if (!isCancelled) {
    state.gigsPlayed++
    // Add estimated gig income
    gigNet = estimateGigNet(previousFame)
    state.money += gigNet
  }
`);

fs.writeFileSync('scripts/calculate-baseline-fame.mjs', content);
