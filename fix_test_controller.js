import fs from 'fs';

const filePath = 'tests/node/PixiStageController.test.js';
let code = fs.readFileSync(filePath, 'utf-8');

// Replace mock getters directly in tests if needed
code = code.replace(/assert\.equal\(controller\.isToxicActive, /g, 'assert.equal(controller.toxicFilterManager.isToxicActive, ');
code = code.replace(/assert\.ok\(controller\.toxicFilters\)/g, 'assert.ok(controller.toxicFilterManager.toxicFilters)');
code = code.replace(/assert\.ok\(controller\.colorMatrix\)/g, 'assert.ok(controller.toxicFilterManager.colorMatrix)');
code = code.replace(/assert\.equal\(controller\.colorMatrix, null\)/g, 'assert.equal(controller.toxicFilterManager.colorMatrix, null)');
code = code.replace(/assert\.equal\(controller\.toxicFilters, null\)/g, 'assert.equal(controller.toxicFilterManager.toxicFilters, null)');
code = code.replace(/controller\.colorMatrix\./g, 'controller.toxicFilterManager.colorMatrix.');

fs.writeFileSync(filePath, code);
