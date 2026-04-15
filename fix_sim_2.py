with open('scripts/game-balance-simulation.mjs', 'r') as f:
    content = f.read()

import_line = "import { hasActiveSponsorship } from '../src/utils/gameStateUtils.js';\n"
content = content.replace("import fs from 'node:fs/promises'", "import fs from 'node:fs/promises'\n" + import_line)

with open('scripts/game-balance-simulation.mjs', 'w') as f:
    f.write(content)
