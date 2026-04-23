import fs from 'fs';

let content = fs.readFileSync('src/components/stage/TourbusObstacleManager.ts', 'utf8');

content = content.replace(
  'obstacleMap: Map<string | number, Sprite | Graphics | any>',
  'obstacleMap: Map<string | number, (Sprite | Graphics) & { hasExploded?: boolean }>'
);

content = content.replace(
  '    textures: any,\n    colors: any',
  "    textures: {\n      rock: Texture | null\n      barrier: Texture | null\n      fuel: Texture | null\n    },\n    colors: {\n      warningYellow: number\n      bloodRed: number\n      toxicGreen: number\n    }"
);

content = content.replace(
  '  updateObstacles(state: any, height: any, laneWidth: any) {',
  '  updateObstacles(state: any, height: number, laneWidth: number) {'
);

fs.writeFileSync('src/components/stage/TourbusObstacleManager.ts', content);
