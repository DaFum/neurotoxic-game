const fs = require('fs');

const path = 'src/hooks/rhythmGame/useRhythmGameState.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the dependency array of useMemo
content = content.replace('}), [dispatch])', '}), [])');

// Add import for getPixiColorFromToken
if (!content.includes('getPixiColorFromToken')) {
  content = content.replace("import { useReducer, useRef, useMemo } from 'react'", "import { useReducer, useRef, useMemo } from 'react'\nimport { getPixiColorFromToken } from '../../components/stage/utils'");
}

// Replace the hardcoded colors with tokens
content = content.replace('color: 0xff0041,', "color: getPixiColorFromToken('--rhythm-guitar') ?? 0xff0041,");
content = content.replace('color: 0x00ff41,', "color: getPixiColorFromToken('--rhythm-drums') ?? 0x00ff41,");
content = content.replace('color: 0x0041ff,', "color: getPixiColorFromToken('--rhythm-bass') ?? 0x0041ff,");

fs.writeFileSync(path, content, 'utf8');
