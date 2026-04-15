with open('scripts/game-balance-simulation.mjs', 'r') as f:
    content = f.read()

# Add the missing import at the top
import_line = "import { hasActiveSponsorship } from '../src/utils/gameStateUtils.js';\n"
if "hasActiveSponsorship" not in content[:500]: # check top of file
    content = content.replace("import fs from 'fs';", "import fs from 'fs';\n" + import_line)

# Revert the incorrect logic
content = content.replace("const hadSponsor = (state.social.activeDeals.length > 0)", "const hadSponsor = hasActiveSponsorship(state.social)")
content = content.replace("const hasSponsor = (state.social.activeDeals.length > 0)", "const hasSponsor = hasActiveSponsorship(state.social)")
content = content.replace("if (social.activeDeals.length > 0) {", "if (hasActiveSponsorship(social)) {")
content = content.replace("sponsorActive: (s.social.activeDeals.length > 0)", "sponsorActive: hasActiveSponsorship(s.social)")

with open('scripts/game-balance-simulation.mjs', 'w') as f:
    f.write(content)
