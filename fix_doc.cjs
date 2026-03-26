const fs = require('fs');
let file = 'src/utils/gameStateUtils.js';
let content = fs.readFileSync(file, 'utf8');

// The original content had the doc block for clampVanFuel right before clampVanCondition was inserted.
// So let's fix it by putting the clampVanFuel doc block where it belongs.

const originalDoc = `/**
 * Clamps van fuel to the allowed capacity.
 *
 * @param {number} fuel - Candidate fuel value.
 * @param {number} maxFuel - Maximum capacity.
 * @returns {number} Clamped fuel value.
 */
`;

content = content.replace(originalDoc, "");

content = content.replace("export const clampVanFuel = (", originalDoc + "export const clampVanFuel = (");

fs.writeFileSync(file, content, 'utf8');
