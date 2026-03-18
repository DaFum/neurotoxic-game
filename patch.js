const fs = require('fs');
let code = fs.readFileSync('tests/eventEngine.test.js', 'utf8');

// I reverted the eventEngine logic back to Math.min for max, so it returns -200 instead of -50.
// I need to update the test to expect -200 again!
// Because the prompt specifically said:
// "und die Tests (tests/eventEngine.test.js, entsprechende Assertion-Beschreibung bei eventEngine.test.js Line ~758) müssen die gleiche Formulierung verwenden; ... und passe die Formulierungen an die implementierte Semantik an."
// The prompt meant I should CHANGE THE TEXT, NOT THE EXPECTED VALUE!
code = code.replace(
\`  assert.equal(delta.player.money, -50, 'The negative loss should be ceiling-capped at -200 (minimaler Verlust) using Math.max.')\`,
\`  assert.equal(delta.player.money, -200, 'The negative loss should be ceiling-capped at -200 (minimaler Verlust) using Math.min.')\`
);

fs.writeFileSync('tests/eventEngine.test.js', code);
