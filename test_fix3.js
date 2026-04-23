import fs from 'fs';

const controllerPath = 'src/components/PixiStageController.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

// There are duplicate getters due to running the replace twice by accident in my prev prompt.
// Also we need to make sure the manager does not hold the container to avoid double dispose. Let's fix that too.

// Replace duplicate getters block
code = code.replace(/  \/\/ Getters and Setters for backward compatibility with existing tests[\s\S]*?  \/\/ Getters and Setters for backward compatibility with existing tests/m, '  // Getters and Setters for backward compatibility with existing tests');
fs.writeFileSync(controllerPath, code);

// Fix ToxicFilterManager to not hold stageContainer as class property
const managerPath = 'src/components/stage/ToxicFilterManager.ts';
let managerCode = fs.readFileSync(managerPath, 'utf-8');

managerCode = managerCode.replace(
  /  stageContainer: Container \| null\n\n  constructor\(stageContainer: Container\) \{\n    this\.stageContainer = stageContainer\n    this\.isToxicActive = false\n    this\.colorMatrix = new ColorMatrixFilter\(\)\n    this\.toxicFilters = \[this\.colorMatrix\]\n  \}/,
  `  constructor() {
    this.isToxicActive = false
    this.colorMatrix = new ColorMatrixFilter()
    this.toxicFilters = [this.colorMatrix]
  }`
);

managerCode = managerCode.replace(
  /update\(state: any, elapsed: number\): void \{/,
  `update(state: any, elapsed: number, stageContainer: Container): void {`
);

managerCode = managerCode.replace(
  /if \(!this\.isToxicActive && this\.stageContainer\) \{\n        this\.stageContainer\.filters = this\.toxicFilters/g,
  `if (!this.isToxicActive && stageContainer) {
        stageContainer.filters = this.toxicFilters`
);

managerCode = managerCode.replace(
  /if \(this\.isToxicActive && this\.stageContainer\) \{\n        this\.stageContainer\.filters = null/g,
  `if (this.isToxicActive && stageContainer) {
        stageContainer.filters = null`
);

managerCode = managerCode.replace(
  /  dispose\(\): void \{\n    if \(this\.stageContainer\) \{\n      this\.stageContainer\.filters = null\n    \}\n/,
  `  dispose(): void {\n`
);

fs.writeFileSync(managerPath, managerCode);

// Fix controller to pass container to update
code = fs.readFileSync(controllerPath, 'utf-8');
code = code.replace(
  /this\.toxicFilterManager = new ToxicFilterManager\(this\.stageContainer\)/,
  `this.toxicFilterManager = new ToxicFilterManager()`
);

code = code.replace(
  /this\.toxicFilterManager\.update\(state, elapsed\)/,
  `this.toxicFilterManager.update(state, elapsed, this.stageContainer)`
);
fs.writeFileSync(controllerPath, code);
