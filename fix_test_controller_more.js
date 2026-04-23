import fs from 'fs';

const filePath = 'tests/node/PixiStageController.test.js';
let code = fs.readFileSync(filePath, 'utf-8');

// The test is checking `controller.toxicFilterManager.colorMatrix` when `toxicFilterManager` is actually null on init.
code = code.replace(
  /assert\.equal\(controller\.toxicFilterManager\.colorMatrix, null\)/g,
  'assert.equal(controller.colorMatrix, null)'
);

code = code.replace(
  /assert\.equal\(controller\.toxicFilterManager\.toxicFilters, null\)/g,
  'assert.equal(controller.toxicFilters, null)'
);

code = code.replace(
  /assert\.equal\(controller\.toxicFilterManager\.isToxicActive, false\)/g,
  'assert.equal(controller.isToxicActive, false)'
);


// In dispose cleans up filters and container properly
code = code.replace(
  /assert\.equal\(controller\.toxicFilterManager\.colorMatrix, null\)/g,
  'assert.equal(controller.colorMatrix, null)'
);

code = code.replace(
  /assert\.equal\(controller\.toxicFilterManager\.toxicFilters, null\)/g,
  'assert.equal(controller.toxicFilters, null)'
);

// We need to globally just test against the getters we created instead of reaching into toxicFilterManager since it can be null
code = code.replace(/controller\.toxicFilterManager\.isToxicActive/g, 'controller.isToxicActive');
code = code.replace(/controller\.toxicFilterManager\.toxicFilters/g, 'controller.toxicFilters');
code = code.replace(/controller\.toxicFilterManager\.colorMatrix/g, 'controller.colorMatrix');

fs.writeFileSync(filePath, code);
