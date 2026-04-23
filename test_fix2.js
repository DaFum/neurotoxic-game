import fs from 'fs';
import { execSync } from 'child_process';

const controllerPath = 'src/components/PixiStageController.ts';
execSync(`git checkout ${controllerPath}`);
let code = fs.readFileSync(controllerPath, 'utf-8');

// Also update ToxicFilterManager
const managerPath = 'src/components/stage/ToxicFilterManager.ts';
let managerCode = fs.readFileSync(managerPath, 'utf-8');

managerCode = managerCode.replace(
  /colorMatrix: any\n  toxicFilters: any\n  isToxicActive: boolean\n  stageContainer: any/,
  `colorMatrix: ColorMatrixFilter | null\n  toxicFilters: ColorMatrixFilter[] | null\n  isToxicActive: boolean\n  stageContainer: Container | null`
);

managerCode = managerCode.replace(
  /constructor\(stageContainer: any\) \{/,
  `constructor(stageContainer: Container) {`
);

managerCode = managerCode.replace(
  /update\(state: any, elapsed: number\) \{/,
  `update(state: any, elapsed: number): void {`
);

managerCode = managerCode.replace(
  /isReady\(\) \{/,
  `isReady(): boolean {`
);

managerCode = managerCode.replace(
  /dispose\(\) \{/,
  `dispose(): void {`
);

// We need to keep stageContainer filters nulling but not the destroy part which is in PixiStageController
managerCode = managerCode.replace(
  /    if \(this\.stageContainer\) \{\n      this\.stageContainer\.filters = null\n    \}\n\n    if \(this\.colorMatrix\) \{/g,
  `    if (this.stageContainer) {
      this.stageContainer.filters = null
    }

    if (this.colorMatrix) {`
);

fs.writeFileSync(managerPath, managerCode);

// Add getters to PixiStageController for backward compatibility with tests
const gettersCode = `

  // Getters and Setters for backward compatibility with existing tests
  get colorMatrix() {
    return this.toxicFilterManager?.colorMatrix ?? null
  }

  set colorMatrix(value) {
    if (this.toxicFilterManager) {
      this.toxicFilterManager.colorMatrix = value
    }
  }

  get toxicFilters() {
    return this.toxicFilterManager?.toxicFilters ?? null
  }

  set toxicFilters(value) {
    if (this.toxicFilterManager) {
      this.toxicFilterManager.toxicFilters = value
    }
  }

  get isToxicActive() {
    return this.toxicFilterManager?.isToxicActive ?? false
  }

  set isToxicActive(value) {
    if (this.toxicFilterManager) {
      this.toxicFilterManager.isToxicActive = value
    }
  }`;

code = code.replace(
  /class PixiStageController extends BaseStageController \{/,
  `class PixiStageController extends BaseStageController {${gettersCode}`
);

// Update toxicFilterManager type
code = code.replace(
  /toxicFilterManager: any/,
  `toxicFilterManager: ToxicFilterManager | null`
);

fs.writeFileSync(controllerPath, code);

// Revert test controller to origin
const testPath = 'tests/node/PixiStageController.test.js';
execSync(`git checkout ${testPath}`);
