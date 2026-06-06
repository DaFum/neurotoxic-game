import fs from 'fs';

let content = fs.readFileSync('src/utils/gameState/calculations.ts', 'utf-8');
content = content.replace("import { clampNonNegative } from './clamps'\nimport { clampNonNegative } from './clamps'\n", "import { clampNonNegative } from './clamps'\n");
fs.writeFileSync('src/utils/gameState/calculations.ts', content);

content = fs.readFileSync('src/utils/gameState/checks.ts', 'utf-8');
content = content.replace("import { isForbiddenKey } from '../objectUtils'\nimport { isForbiddenKey, isLooseRecord, safeJsonParse } from '../objectUtils'\n", "import { isForbiddenKey, isLooseRecord, safeJsonParse } from '../objectUtils'\n");
fs.writeFileSync('src/utils/gameState/checks.ts', content);

content = fs.readFileSync('src/utils/gameState/delta.ts', 'utf-8');
content = content.replace("import { isForbiddenKey, isLooseRecord } from '../objectUtils'\nimport { isForbiddenKey, isLooseRecord, safeJsonParse } from '../objectUtils'\n", "import { isForbiddenKey, isLooseRecord, safeJsonParse } from '../objectUtils'\n");
content = content.replace("import { finiteNumberOr } from '../finiteNumber'\nimport { finiteNumberOr, isFiniteNumber } from '../finiteNumber'\n", "import { finiteNumberOr, isFiniteNumber } from '../finiteNumber'\n");
content = content.replace("} from './clamps'\n} from './clamps'", "} from './clamps'");
fs.writeFileSync('src/utils/gameState/delta.ts', content);
