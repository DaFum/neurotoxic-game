const fs = require('fs');

let content = fs.readFileSync('src/hooks/useClinicLogic.ts', 'utf8');

content = content.replace(
  "import type { BandMember } from '../types/game'",
  "import type { BandMember } from '../types/game'\nimport type { TFunction } from 'i18next'\nimport type { GameStateWithActions } from '../context/GameState'"
);

content = content.replace(
  "clinicHeal: (args: any) => void,",
  "clinicHeal: GameStateWithActions['clinicHeal'],"
);

content = content.replace(
  "clinicEnhance: (args: any) => void,",
  "clinicEnhance: GameStateWithActions['clinicEnhance'],"
);

content = content.replace(
  "t: (key: string, options?: unknown) => string",
  "t: TFunction"
);

content = content.replace(
  "t: (key: string, options?: unknown) => string",
  "t: TFunction"
);

content = content.replace(
  "const membersMap = useMemo(() => {\n    const map = new Map<string, BandMember>()\n    const members = band?.members\n    if (members) {\n      for (let i = 0; i < members.length; i++) {\n        const m = members[i] as BandMember\n        map.set(m.id, m)\n      }\n    }\n    return map\n  }, [band?.members])",
  "const membersMap = useMemo(() => {\n    const map = new Map<string, BandMember>()\n    band?.members?.forEach(m => {\n      if (m.id) {\n        map.set(m.id, m)\n      }\n    })\n    return map\n  }, [band?.members])"
);

content = content.replace(
  "player?.money || 0,",
  "player?.money ?? 0,"
);
content = content.replace(
  "player?.fame || 0,",
  "player?.fame ?? 0,"
);


fs.writeFileSync('src/hooks/useClinicLogic.ts', content);
